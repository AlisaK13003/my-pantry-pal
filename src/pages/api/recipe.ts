import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { ChatCompletionCreateParams } from 'openai/resources/index.mjs';
import { randomUUID } from 'crypto';

const MIN_RECIPE_ITEMS = 5;
const OPENAI_MODEL = process.env.OPENAI_RECIPE_MODEL || 'gpt-4o-mini';

interface PantryItemInput {
  name: string;
  quantity: number;
  expirationDate?: string;
  unit?: string;
}

interface RecipeResponse {
  id: string;
  title: string;
  ingredients: string[];
  directions: string[];
  suggestions: string;
}

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
    typeof candidate.quantity === 'number' &&
    Number.isFinite(candidate.quantity)
  );
};

const isRecipeResponse = (recipe: unknown): recipe is RecipeResponse => {
  if (!recipe || typeof recipe !== 'object') {
    return false;
  }

  const candidate = recipe as Partial<RecipeResponse>;
  return (
    typeof candidate.title === 'string' &&
    candidate.title.trim().length > 0 &&
    Array.isArray(candidate.ingredients) &&
    candidate.ingredients.every((ingredient) => typeof ingredient === 'string') &&
    Array.isArray(candidate.directions) &&
    candidate.directions.every((step) => typeof step === 'string') &&
    typeof candidate.suggestions === 'string'
  );
};

const formatPantryItems = (items: PantryItemInput[]) =>
  items
    .map((item) => {
      const unit = item.unit && item.unit !== 'units' ? ` ${item.unit}` : '';
      const expiration = item.expirationDate ? `, expires ${item.expirationDate}` : '';
      return `${item.name}: ${item.quantity}${unit}${expiration}`;
    })
    .join('\n');

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
          'You are a practical home cooking assistant. Return only valid JSON that matches the requested shape. Keep recipes realistic for a normal home kitchen.',
      },
      {
        role: 'user',
        content: `Create one simple recipe using some of these pantry items. The recipe does not need to use every item.

Pantry items:
${formatPantryItems(validPantryItems)}

Return JSON with this shape:
{
  "title": "Recipe name",
  "ingredients": ["ingredient with amount"],
  "directions": ["short step 1", "short step 2"],
  "suggestions": "One short note about substitutions, serving, or storage."
}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 600,
  };

  try {
    const response = await openai.chat.completions.create(payload);
    const content = response.choices[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: 'OpenAI did not return a recipe.' });
    }

    const parsedRecipe = JSON.parse(content);

    if (!isRecipeResponse(parsedRecipe)) {
      return res.status(502).json({ error: 'OpenAI returned an unexpected recipe format.' });
    }

    const recipe: RecipeResponse = {
      ...parsedRecipe,
      id: randomUUID(),
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
