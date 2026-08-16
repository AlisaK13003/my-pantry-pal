import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { ChatCompletionCreateParams } from 'openai/resources/index.mjs';
import { randomUUID } from 'crypto';

const MIN_RECIPE_ITEMS = 5;
const OPENAI_MODEL = process.env.OPENAI_RECIPE_MODEL || 'gpt-4o-mini';
const INCOMPATIBLE_RECIPE_ERROR = 'Could not generate a realistic recipe. Please try adding more compatible ingredients.';

interface PantryItemInput {
  name: string;
  quantity?: number | null;
  expirationDate?: string;
  unit?: string;
}

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

interface NoRecipeCandidate {
  canMakeRecipe: false;
  reason?: string;
}

interface RecipeCandidate {
  canMakeRecipe: true;
  title: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  directions: string[];
  suggestions: string;
  imageQuery: string;
}

type RecipeGenerationResult = RecipeCandidate | NoRecipeCandidate;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const isPantryItem = (item: unknown): item is PantryItemInput => {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const candidate = item as Partial<PantryItemInput>;
  return (
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    (
      candidate.quantity === undefined ||
      candidate.quantity === null ||
      (typeof candidate.quantity === 'number' && Number.isFinite(candidate.quantity))
    )
  );
};

const isRecipeGenerationResult = (recipe: unknown): recipe is RecipeGenerationResult => {
  if (!recipe || typeof recipe !== 'object') {
    return false;
  }

  const candidate = recipe as Partial<RecipeGenerationResult>;

  if (typeof candidate.canMakeRecipe !== 'boolean') {
    return false;
  }

  if (!candidate.canMakeRecipe) {
    const noRecipe = candidate as Partial<NoRecipeCandidate>;
    return noRecipe.reason === undefined || typeof noRecipe.reason === 'string';
  }

  return (
    typeof candidate.title === 'string' &&
    candidate.title.trim().length > 0 &&
    typeof candidate.prepTime === 'string' &&
    typeof candidate.cookTime === 'string' &&
    typeof candidate.servings === 'string' &&
    Array.isArray(candidate.ingredients) &&
    candidate.ingredients.every((ingredient) => typeof ingredient === 'string') &&
    Array.isArray(candidate.directions) &&
    candidate.directions.every((step) => typeof step === 'string') &&
    typeof candidate.suggestions === 'string' &&
    typeof candidate.imageQuery === 'string' &&
    candidate.imageQuery.trim().length > 0
  );
};

const formatPantryItems = (items: PantryItemInput[]) =>
  items
    .map((item) => {
      const unit = item.unit && item.unit !== 'units' ? ` ${item.unit}` : '';
      const expiration = item.expirationDate ? `, expires ${item.expirationDate}` : '';
      const quantity = typeof item.quantity === 'number' ? `: ${item.quantity}${unit}` : '';
      return `${item.name}${quantity}${expiration}`;
    })
    .join('\n');

const containsAny = (text: string, terms: string[]) =>
  terms.some((term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`, 'i').test(text));

const hasObviousIncompatiblePairing = (recipe: RecipeCandidate) => {
  const recipeText = [
    recipe.title,
    ...recipe.ingredients,
    ...recipe.directions,
    recipe.suggestions,
  ].join(' ');

  const hasSeafood = containsAny(recipeText, [
    'anchovy',
    'crab',
    'fish',
    'lobster',
    'salmon',
    'sardine',
    'scallop',
    'shrimp',
    'tilapia',
    'tuna',
  ]);
  const hasMeat = containsAny(recipeText, [
    'bacon',
    'beef',
    'chicken',
    'ham',
    'meatball',
    'pork',
    'sausage',
    'steak',
    'turkey',
  ]);
  const hasDessertSweet = containsAny(recipeText, [
    'brownie',
    'cake',
    'candy',
    'caramel',
    'chocolate',
    'cookie',
    'frosting',
    'gummy',
    'marshmallow',
    'pudding',
    'sprinkle',
  ]);
  const hasWateryFruit = containsAny(recipeText, [
    'cantaloupe',
    'honeydew',
    'melon',
    'watermelon',
  ]);
  const hasSourFermented = containsAny(recipeText, [
    'kimchi',
    'sauerkraut',
  ]);
  const treatsSweetAsSeparateSide = /dessert|on the side|dipped|drizzle/i.test(recipeText) && hasDessertSweet;

  return (
    ((hasSeafood || hasMeat) && (hasDessertSweet || treatsSweetAsSeparateSide)) ||
    (hasSeafood && hasWateryFruit && hasSourFermented)
  );
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, only POST requests are accepted.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Recipe generation is not configured yet.' });
  }

  const pantryItems = req.body?.pantry_items;

  if (!Array.isArray(pantryItems)) {
    return res.status(400).json({ error: 'Pantry items must be sent as a list.' });
  }

  const validPantryItems = pantryItems.filter(isPantryItem);

  if (validPantryItems.length < MIN_RECIPE_ITEMS) {
    return res.status(400).json({
      error: `Add at least ${MIN_RECIPE_ITEMS} ingredients before generating recipe ideas.`,
    });
  }

  const payload: ChatCompletionCreateParams = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a practical home cooking assistant. Return only valid JSON that matches the requested shape. Keep recipes realistic, detailed, appetizing, and beginner-friendly for a normal home kitchen. Never invent joke, novelty, gross, or incompatible food pairings just to use the available ingredients.',
      },
      {
        role: 'user',
        content: `Decide whether these pantry items can make one realistic, recognizable, appetizing recipe.

Rules:
- A valid recipe must use at least 3 compatible pantry items from the list.
- Basic staples like water, salt, pepper, and oil do not count toward the 3 compatible pantry items.
- Do not combine ingredients that clash just because they are present.
- Ignore unrelated snack, candy, dessert, or fruit ingredients when they do not fit the main dish.
- Do not add a separate dessert or side just to use an incompatible ingredient.
- Never combine seafood or meat with chocolate, marshmallows, candy, or other dessert ingredients.
- If the list cannot make a sensible recipe, return canMakeRecipe false with a short reason.
- If it can, create one satisfying recipe. The recipe does not need to use every item.

Make it useful for someone who is not very confident at cooking:
- include realistic amounts
- include 5 to 7 clear directions
- mention visual or timing cues where helpful
- avoid assuming special equipment
- keep the recipe practical for a weeknight meal

Pantry items:
${formatPantryItems(validPantryItems)}

Return JSON with this shape:
{
  "canMakeRecipe": true,
  "title": "Recipe name",
  "prepTime": "10 minutes",
  "cookTime": "20 minutes",
  "servings": "2 servings",
  "ingredients": ["ingredient with amount"],
  "directions": ["clear beginner-friendly step 1", "clear beginner-friendly step 2"],
  "suggestions": "Two or three helpful sentences about substitutions, serving, or storage.",
  "imageQuery": "short visual search phrase for this dish, like creamy tomato pasta"
}

If the pantry items cannot make a realistic recipe, return JSON with this shape instead:
{
  "canMakeRecipe": false,
  "reason": "Could not make a realistic recipe from these ingredients."
}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 600,
  };

  try {
    const response = await openai.chat.completions.create(payload);
    const content = response.choices[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: 'OpenAI did not return a recipe.' });
    }

    const parsedRecipe = JSON.parse(content);

    if (!isRecipeGenerationResult(parsedRecipe)) {
      return res.status(502).json({ error: 'OpenAI returned an unexpected recipe format.' });
    }

    if (!parsedRecipe.canMakeRecipe) {
      return res.status(422).json({
        error: parsedRecipe.reason || INCOMPATIBLE_RECIPE_ERROR,
      });
    }

    if (hasObviousIncompatiblePairing(parsedRecipe)) {
      return res.status(422).json({
        error: INCOMPATIBLE_RECIPE_ERROR,
      });
    }

    const recipePhoto = await getRecipePhoto(parsedRecipe.imageQuery);

    const recipe: RecipeResponse = {
      title: parsedRecipe.title,
      prepTime: parsedRecipe.prepTime,
      cookTime: parsedRecipe.cookTime,
      servings: parsedRecipe.servings,
      ingredients: parsedRecipe.ingredients,
      directions: parsedRecipe.directions,
      suggestions: parsedRecipe.suggestions,
      imageQuery: parsedRecipe.imageQuery,
      id: randomUUID(),
      imageUrl: recipePhoto.imageUrl,
      imageAttribution: recipePhoto.attribution,
    };

    return res.status(200).json({ recipe });
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

    return res.status(500).json({ error: 'Unable to generate recipe ideas right now.' });
  }
}
