import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';
import { randomUUID } from 'crypto';
import {
  buildRecipePrompt,
  buildSupplementalRecipePrompt,
  findCompatibleSubsetHints,
  getCandidateRecipes,
  getSupplementalExcludedRecipeTitles,
  INCOMPATIBLE_RECIPE_ERROR,
  INVENTED_INGREDIENT_ERROR,
  isPantryItem,
  isRecipeGenerationResult,
  mergeSupplementalRecipeCandidates,
  MIN_RECIPE_ITEMS,
  PantryItemInput,
  RecipeCandidate,
  RECIPES_PER_REQUEST,
  shouldRequestSupplementalRecipes,
  validateRecipeCandidates,
} from '@/lib/recipeGeneration';

const OPENAI_MODEL = process.env.OPENAI_RECIPE_MODEL || 'gpt-4o-mini';

interface RecipeResponse {
  id: string;
  title: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  directions: string[];
  suggestions: string;
  imageQuery: string;
  imageUrl: string;
  imageAttribution: RecipeImageAttribution | null;
}

interface RecipeImageAttribution {
  photographer: string;
  photographerUrl: string;
  sourceName: string;
  sourceUrl: string;
}

interface RecipePhoto {
  imageUrl: string;
  attribution: RecipeImageAttribution | null;
}

interface PexelsPhoto {
  url?: string;
  photographer?: string;
  photographer_url?: string;
  src?: {
    landscape?: string;
    large2x?: string;
    large?: string;
    medium?: string;
  };
}

interface PexelsSearchResponse {
  photos?: PexelsPhoto[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const logRecipeDebug = (stage: string, data: unknown) => {
  console.debug(`[recipe-generation:${stage}]`, data);
};

const buildRecipeImageUrl = (imageQuery: string) => {
  const encodedTitle = imageQuery
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f7d9a8"/>
          <stop offset="52%" stop-color="#d7efe7"/>
          <stop offset="100%" stop-color="#f4a6a6"/>
        </linearGradient>
      </defs>
      <rect width="900" height="520" fill="url(#bg)"/>
      <circle cx="710" cy="145" r="90" fill="#ffffff" opacity="0.42"/>
      <circle cx="205" cy="360" r="120" fill="#ffffff" opacity="0.32"/>
      <ellipse cx="450" cy="290" rx="235" ry="78" fill="#ffffff" opacity="0.82"/>
      <ellipse cx="450" cy="285" rx="185" ry="48" fill="#f8eee1"/>
      <path d="M310 284c74-58 201-58 280 0" fill="none" stroke="#d8845d" stroke-width="20" stroke-linecap="round"/>
      <path d="M328 308c68-42 176-42 244 0" fill="none" stroke="#c8a24a" stroke-width="16" stroke-linecap="round"/>
      <circle cx="388" cy="272" r="20" fill="#b95b47"/>
      <circle cx="500" cy="270" r="20" fill="#b95b47"/>
      <circle cx="455" cy="318" r="18" fill="#6f9b63"/>
      <text x="450" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#3c2f21">${encodedTitle}</text>
      <text x="450" y="438" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#3c2f21" opacity="0.72">Recipe idea from your pantry</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getRecipePhoto = async (imageQuery: string): Promise<RecipePhoto> => {
  const fallbackImageUrl = buildRecipeImageUrl(imageQuery);

  if (!process.env.PEXELS_API_KEY) {
    return {
      imageUrl: fallbackImageUrl,
      attribution: null,
    };
  }

  const searchParams = new URLSearchParams({
    query: `${imageQuery} food`,
    orientation: 'landscape',
    per_page: '1',
  });

  try {
    const response = await fetch(`https://api.pexels.com/v1/search?${searchParams.toString()}`, {
      headers: {
        Authorization: process.env.PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      console.warn('Pexels image search failed', response.status, response.statusText);
      return {
        imageUrl: fallbackImageUrl,
        attribution: null,
      };
    }

    const data = await response.json() as PexelsSearchResponse;
    const photo = data.photos?.[0];
    const imageUrl = photo?.src?.landscape || photo?.src?.large2x || photo?.src?.large || photo?.src?.medium;

    if (!photo || !imageUrl || !photo.photographer || !photo.photographer_url || !photo.url) {
      return {
        imageUrl: fallbackImageUrl,
        attribution: null,
      };
    }

    return {
      imageUrl,
      attribution: {
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        sourceName: 'Pexels',
        sourceUrl: photo.url,
      },
    };
  } catch (error) {
    console.warn('Unable to fetch recipe image from Pexels', error);
    return {
      imageUrl: fallbackImageUrl,
      attribution: null,
    };
  }
};

const createRecipePayload = (
  pantryItems: PantryItemInput[],
  excludedRecipeTitles: string[],
  options: {
    retryReason?: string;
    promptOverride?: string;
  } = {}
): ChatCompletionCreateParamsNonStreaming => ({
  model: OPENAI_MODEL,
  messages: [
    {
      role: 'system',
      content:
        'You are a practical home cooking assistant with broad cooking knowledge across global cuisines. Return only valid JSON that matches the requested shape. Prefer established dishes when the pantry genuinely supports them, but do not invent cultural origins or names.',
    },
    {
      role: 'user',
      content: options.retryReason
        ? `${options.promptOverride || buildRecipePrompt(pantryItems, excludedRecipeTitles)}

Retry reason from the application:
${options.retryReason}

The previous response did not yield valid recipes. Search compatible subsets again before returning failure.`
        : options.promptOverride || buildRecipePrompt(pantryItems, excludedRecipeTitles),
    },
  ],
  response_format: { type: 'json_object' },
  temperature: 0.2,
  max_tokens: 1800,
});

const requestRecipesFromModel = async (
  pantryItems: PantryItemInput[],
  excludedRecipeTitles: string[],
  options: {
    retryReason?: string;
    promptOverride?: string;
    stage?: 'primary' | 'retry' | 'supplemental';
  } = {}
) => {
  const response = await openai.chat.completions.create(createRecipePayload(pantryItems, excludedRecipeTitles, options));
  const content = response.choices[0]?.message?.content;
  const stage = options.stage || (options.retryReason ? 'retry' : 'primary');
  const rawLogStage = stage === 'supplemental'
    ? 'supplemental-raw-model-response'
    : stage === 'retry'
      ? 'raw-model-response-retry'
      : 'raw-model-response';
  const parsedLogStage = stage === 'supplemental'
    ? 'supplemental-parsed-response'
    : stage === 'retry'
      ? 'parsed-response-retry'
      : 'parsed-response';

  logRecipeDebug(rawLogStage, content);

  if (!content) {
    throw new Error('OpenAI did not return a recipe.');
  }

  const parsedResponse = JSON.parse(content);
  logRecipeDebug(parsedLogStage, parsedResponse);

  return parsedResponse;
};

const convertRecipeCandidateToResponse = async (candidateRecipe: RecipeCandidate): Promise<RecipeResponse> => {
  const recipePhoto = await getRecipePhoto(candidateRecipe.imageQuery);

  return {
    title: candidateRecipe.title,
    prepTime: candidateRecipe.prepTime,
    cookTime: candidateRecipe.cookTime,
    servings: candidateRecipe.servings,
    ingredients: candidateRecipe.ingredients,
    directions: candidateRecipe.directions,
    suggestions: candidateRecipe.suggestions,
    imageQuery: candidateRecipe.imageQuery,
    id: randomUUID(),
    imageUrl: recipePhoto.imageUrl,
    imageAttribution: recipePhoto.attribution,
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, only POST requests are accepted.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Recipe generation is not configured yet.' });
  }

  const pantryItems = req.body?.pantry_items;
  const excludedRecipeTitles = Array.isArray(req.body?.excluded_recipe_titles)
    ? req.body.excluded_recipe_titles.filter((title: unknown): title is string => typeof title === 'string')
    : [];

  if (!Array.isArray(pantryItems)) {
    return res.status(400).json({ error: 'Pantry items must be sent as a list.' });
  }

  const validPantryItems = pantryItems.filter(isPantryItem);

  if (validPantryItems.length < MIN_RECIPE_ITEMS) {
    return res.status(400).json({
      error: `Add at least ${MIN_RECIPE_ITEMS} ingredients before generating recipe ideas.`,
    });
  }

  try {
    const subsetHints = findCompatibleSubsetHints(validPantryItems);
    logRecipeDebug('subset-hints', subsetHints);

    let parsedGeneration = await requestRecipesFromModel(validPantryItems, excludedRecipeTitles);

    if (!isRecipeGenerationResult(parsedGeneration)) {
      return res.status(502).json({ error: 'OpenAI returned an unexpected recipe format.' });
    }

    if (!parsedGeneration.canMakeRecipe && subsetHints.length > 0) {
      parsedGeneration = await requestRecipesFromModel(
        validPantryItems,
        excludedRecipeTitles,
        {
          retryReason: 'The app-side subset pre-check found at least one compatible ingredient subset. Top-level canMakeRecipe should be false only if no subset can make a sensible recipe.',
          stage: 'retry',
        }
      );

      if (!isRecipeGenerationResult(parsedGeneration)) {
        return res.status(502).json({ error: 'OpenAI returned an unexpected recipe format.' });
      }
    }

    if (!parsedGeneration.canMakeRecipe) {
      logRecipeDebug('validated-final-response', {
        canMakeRecipe: false,
        reason: parsedGeneration.reason || INCOMPATIBLE_RECIPE_ERROR,
      });
      return res.status(422).json({
        error: parsedGeneration.reason || INCOMPATIBLE_RECIPE_ERROR,
      });
    }

    let candidateRecipes = getCandidateRecipes(parsedGeneration);
    let validationResult = validateRecipeCandidates(candidateRecipes, validPantryItems, excludedRecipeTitles);
    logRecipeDebug('validation-result', validationResult);

    if (validationResult.validRecipes.length === 0 && subsetHints.length > 0) {
      parsedGeneration = await requestRecipesFromModel(
        validPantryItems,
        excludedRecipeTitles,
        {
          retryReason: 'The previous recipes were rejected by validation. Generate recipes from compatible subsets only, using no ingredients outside the pantry except water, salt, pepper, dried herbs, and spices.',
          stage: 'retry',
        }
      );

      if (!isRecipeGenerationResult(parsedGeneration)) {
        return res.status(502).json({ error: 'OpenAI returned an unexpected recipe format.' });
      }

      if (parsedGeneration.canMakeRecipe) {
        candidateRecipes = getCandidateRecipes(parsedGeneration);
        validationResult = validateRecipeCandidates(candidateRecipes, validPantryItems, excludedRecipeTitles);
        logRecipeDebug('validation-result-retry', validationResult);
      }
    }

    if (validationResult.validRecipes.length === 0) {
      logRecipeDebug('validated-final-response', {
        canMakeRecipe: false,
        rejectedRecipes: validationResult.rejectedRecipes,
      });
      return res.status(422).json({
        error: INVENTED_INGREDIENT_ERROR,
      });
    }

    let finalValidRecipes = validationResult.validRecipes;
    let finalRejectedRecipes = validationResult.rejectedRecipes;

    if (shouldRequestSupplementalRecipes(finalValidRecipes.length)) {
      const remainingCount = RECIPES_PER_REQUEST - finalValidRecipes.length;
      const supplementalExcludedRecipeTitles = getSupplementalExcludedRecipeTitles(excludedRecipeTitles, finalValidRecipes);

      logRecipeDebug('partial-fill', {
        validRecipeCount: finalValidRecipes.length,
        remainingCount,
        existingRecipeTitles: finalValidRecipes.map((recipe) => recipe.title),
      });

      try {
        const supplementalPrompt = buildSupplementalRecipePrompt(
          validPantryItems,
          supplementalExcludedRecipeTitles,
          finalValidRecipes,
          remainingCount
        );
        const supplementalGeneration = await requestRecipesFromModel(
          validPantryItems,
          supplementalExcludedRecipeTitles,
          {
            promptOverride: supplementalPrompt,
            stage: 'supplemental',
          }
        );

        if (isRecipeGenerationResult(supplementalGeneration) && supplementalGeneration.canMakeRecipe) {
          const supplementalCandidates = getCandidateRecipes(supplementalGeneration);
          const supplementalMerge = mergeSupplementalRecipeCandidates(
            finalValidRecipes,
            supplementalCandidates,
            validPantryItems,
            excludedRecipeTitles
          );

          finalValidRecipes = supplementalMerge.recipes;
          finalRejectedRecipes = [
            ...finalRejectedRecipes,
            ...supplementalMerge.supplementalValidation.rejectedRecipes,
          ];

          logRecipeDebug('supplemental-validation-result', {
            ...supplementalMerge.supplementalValidation,
            finalMergedRecipeCount: finalValidRecipes.length,
          });
        } else {
          logRecipeDebug('supplemental-validation-result', {
            canMakeRecipe: false,
            finalMergedRecipeCount: finalValidRecipes.length,
          });
        }
      } catch (supplementalError) {
        console.warn('Supplemental recipe discovery failed', supplementalError);
        logRecipeDebug('supplemental-validation-result', {
          error: 'Supplemental recipe discovery failed',
          finalMergedRecipeCount: finalValidRecipes.length,
        });
      }
    }

    const recipes = await Promise.all(
      finalValidRecipes
        .slice(0, RECIPES_PER_REQUEST)
        .map(convertRecipeCandidateToResponse)
    );

    logRecipeDebug('validated-final-response', {
      canMakeRecipe: true,
      recipes,
      rejectedRecipes: finalRejectedRecipes,
      finalRecipeCount: recipes.length,
    });

    return res.status(200).json({ recipes, recipe: recipes[0] });
  } catch (error: any) {
    console.error('Error in POST /api/recipe', error);

    if (error?.status === 401) {
      return res.status(500).json({ error: 'The OpenAI API key is invalid.' });
    }

    if (error?.status === 403) {
      return res.status(500).json({ error: 'This OpenAI API key does not have permission to generate recipes.' });
    }

    if (error?.status === 404) {
      return res.status(500).json({ error: `The OpenAI model "${OPENAI_MODEL}" is not available for this account.` });
    }

    if (error?.status === 429) {
      return res.status(500).json({ error: 'OpenAI could not generate a recipe because the account hit a usage or billing limit.' });
    }

    if (error instanceof SyntaxError) {
      return res.status(502).json({ error: 'OpenAI returned a recipe that could not be read.' });
    }

    if (error instanceof Error && error.message === 'OpenAI did not return a recipe.') {
      return res.status(502).json({ error: 'OpenAI did not return a recipe.' });
    }

    return res.status(500).json({ error: 'Unable to generate recipe ideas right now.' });
  }
}
