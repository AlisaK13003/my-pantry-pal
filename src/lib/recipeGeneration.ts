export const MIN_RECIPE_ITEMS = 5;
export const RECIPES_PER_REQUEST = 3;
export const INCOMPATIBLE_RECIPE_ERROR = 'Could not generate a realistic recipe. Please try adding more compatible ingredients.';
export const INVENTED_INGREDIENT_ERROR = 'Could not generate a recipe using only your pantry items. Please add more ingredients and try again.';

const MEASUREMENT_WORDS = new Set([
  'bag',
  'bags',
  'bottle',
  'bottles',
  'box',
  'boxes',
  'can',
  'cans',
  'clove',
  'cloves',
  'cup',
  'cups',
  'dash',
  'dashes',
  'drained',
  'for',
  'g',
  'garnish',
  'gram',
  'grams',
  'kg',
  'lb',
  'lbs',
  'liter',
  'liters',
  'ml',
  'oz',
  'ounce',
  'ounces',
  'piece',
  'pieces',
  'pinch',
  'pinches',
  'sliced',
  'small',
  'tablespoon',
  'tablespoons',
  'tbsp',
  'teaspoon',
  'teaspoons',
  'to',
  'taste',
  'tsp',
]);

const PANTRY_DESCRIPTOR_WORDS = new Set([
  'canned',
  'fresh',
  'frozen',
  'shredded',
]);

const INGREDIENT_PREP_WORDS = new Set([
  'chopped',
  'cold',
  'cooked',
  'crushed',
  'cut',
  'diced',
  'halved',
  'ice',
  'minced',
  'peeled',
  'ripe',
  'sauce',
  'thinly',
]);

const ALLOWED_BASIC_INGREDIENT_WORDS = new Set([
  'water',
]);

const ALLOWED_SEASONING_WORDS = new Set([
  'allspice',
  'basil',
  'bay',
  'cardamom',
  'cayenne',
  'chili',
  'chive',
  'cilantro',
  'cinnamon',
  'clove',
  'coriander',
  'cumin',
  'curry',
  'dill',
  'flake',
  'flakes',
  'garam',
  'ginger',
  'herb',
  'herbs',
  'leaf',
  'masala',
  'mint',
  'nutmeg',
  'oregano',
  'paprika',
  'parsley',
  'pepper',
  'powder',
  'red',
  'rosemary',
  'sage',
  'salt',
  'seasoning',
  'spice',
  'spices',
  'thyme',
  'turmeric',
]);

const PASTA_WORDS = new Set(['pasta', 'spaghetti', 'noodle', 'noodles', 'linguine', 'fettuccine', 'penne']);
const TOMATO_WORDS = new Set(['tomato', 'tomatoes']);
const AROMATIC_WORDS = new Set(['garlic', 'onion', 'onions', 'shallot', 'shallots']);
const FAT_WORDS = new Set(['oil', 'butter', 'ghee']);
const FRYING_FAT_WORDS = new Set(['oil']);
const SWEET_FRUIT_WORDS = new Set(['banana', 'bananas', 'plantain', 'plantains', 'apple', 'apples', 'peach', 'peaches']);
const FLOUR_WORDS = new Set(['flour', 'starch']);
const SWEETENER_WORDS = new Set(['sugar', 'honey', 'syrup']);
const LEAVENING_WORDS = new Set(['baking', 'powder', 'soda']);
const COATING_WORDS = new Set(['coconut', 'sesame', 'seed', 'seeds']);

export interface PantryItemInput {
  name: string;
  quantity?: number | null;
  expirationDate?: string;
  unit?: string;
}

export interface NoRecipeCandidate {
  canMakeRecipe: false;
  reason?: string;
}

export interface RecipeCandidate {
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

export interface RecipeBatchCandidate {
  canMakeRecipe: true;
  recipes: RecipeCandidate[];
}

export interface RecipeRejection {
  title: string;
  reason: 'duplicate' | 'incompatible' | 'outside-pantry';
  details?: string[];
}

export type RecipeGenerationResult = RecipeBatchCandidate | RecipeCandidate | NoRecipeCandidate;

export const isPantryItem = (item: unknown): item is PantryItemInput => {
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

export const isRecipeCandidate = (recipe: unknown): recipe is RecipeCandidate => {
  if (!recipe || typeof recipe !== 'object') {
    return false;
  }

  const candidate = recipe as Partial<RecipeCandidate>;

  return (
    candidate.canMakeRecipe === true &&
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

export const isRecipeGenerationResult = (recipe: unknown): recipe is RecipeGenerationResult => {
  if (!recipe || typeof recipe !== 'object') {
    return false;
  }

  const candidate = recipe as Partial<RecipeGenerationResult>;

  if (!candidate.canMakeRecipe) {
    const noRecipe = candidate as Partial<NoRecipeCandidate>;
    return noRecipe.reason === undefined || typeof noRecipe.reason === 'string';
  }

  const batchCandidate = candidate as Partial<RecipeBatchCandidate>;

  if (Array.isArray(batchCandidate.recipes)) {
    return batchCandidate.recipes.length > 0 && batchCandidate.recipes.every(isRecipeCandidate);
  }

  return isRecipeCandidate(recipe);
};

export const getCandidateRecipes = (generationResult: RecipeGenerationResult): RecipeCandidate[] => {
  if (!generationResult.canMakeRecipe) {
    return [];
  }

  return 'recipes' in generationResult ? generationResult.recipes : [generationResult];
};

export const formatPantryItems = (items: PantryItemInput[]) =>
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

const singularizeToken = (token: string) => {
  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if ((/(ches|shes|xes|zes|ses)$/).test(token) && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith('oes') && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
};

export const getIngredientTokens = (text: string, options: { removePantryDescriptors?: boolean } = {}) =>
  text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .map(singularizeToken)
    .filter((token) =>
      token &&
      token !== 'and' &&
      !MEASUREMENT_WORDS.has(token) &&
      !INGREDIENT_PREP_WORDS.has(token) &&
      (!options.removePantryDescriptors || !PANTRY_DESCRIPTOR_WORDS.has(token))
    );

const itemHasAnyToken = (item: PantryItemInput, tokens: Set<string>) =>
  getIngredientTokens(item.name, { removePantryDescriptors: true }).some((token) => tokens.has(token));

const getFirstItemWithAnyToken = (items: PantryItemInput[], tokens: Set<string>) =>
  items.find((item) => itemHasAnyToken(item, tokens));

const pushUniqueItem = (items: PantryItemInput[], item: PantryItemInput | undefined) => {
  if (item && !items.some((existingItem) => existingItem.name.toLowerCase() === item.name.toLowerCase())) {
    items.push(item);
  }
};

export const findCompatibleSubsetHints = (pantryItems: PantryItemInput[]) => {
  const hints: string[][] = [];

  const pasta = getFirstItemWithAnyToken(pantryItems, PASTA_WORDS);
  const tomato = getFirstItemWithAnyToken(pantryItems, TOMATO_WORDS);
  const aromaticItems = pantryItems.filter((item) => itemHasAnyToken(item, AROMATIC_WORDS)).slice(0, 3);
  const fat = getFirstItemWithAnyToken(pantryItems, FAT_WORDS);
  const salt = getFirstItemWithAnyToken(pantryItems, new Set(['salt']));

  if (pasta && tomato && (aromaticItems.length > 0 || fat || salt)) {
    const subset: PantryItemInput[] = [];
    pushUniqueItem(subset, pasta);
    pushUniqueItem(subset, tomato);
    aromaticItems.forEach((item) => pushUniqueItem(subset, item));
    pushUniqueItem(subset, fat);
    pushUniqueItem(subset, salt);

    if (subset.length >= 3) {
      hints.push(subset.map((item) => item.name));
    }
  }

  const fruit = getFirstItemWithAnyToken(pantryItems, SWEET_FRUIT_WORDS);
  const flour = getFirstItemWithAnyToken(pantryItems, FLOUR_WORDS);
  const fryingFat = getFirstItemWithAnyToken(pantryItems, FRYING_FAT_WORDS);
  const sweetener = getFirstItemWithAnyToken(pantryItems, SWEETENER_WORDS);
  const leavening = getFirstItemWithAnyToken(pantryItems, LEAVENING_WORDS);
  const coatingItems = pantryItems.filter((item) => itemHasAnyToken(item, COATING_WORDS)).slice(0, 3);

  if (fruit && flour && fryingFat && (sweetener || leavening || coatingItems.length > 0)) {
    const subset: PantryItemInput[] = [];
    pushUniqueItem(subset, fruit);
    pushUniqueItem(subset, flour);
    pushUniqueItem(subset, fryingFat);
    pushUniqueItem(subset, sweetener);
    pushUniqueItem(subset, leavening);
    coatingItems.forEach((item) => pushUniqueItem(subset, item));
    pushUniqueItem(subset, salt);

    if (subset.length >= 3) {
      hints.push(subset.map((item) => item.name));
    }
  }

  return hints;
};

export const recipeIngredientIsAllowed = (ingredient: string, pantryItems: PantryItemInput[]) => {
  const ingredientTokens = getIngredientTokens(ingredient);

  if (ingredientTokens.length === 0) {
    return true;
  }

  if (ingredientTokens.every((token) => ALLOWED_SEASONING_WORDS.has(token))) {
    return true;
  }

  if (ingredientTokens.every((token) => ALLOWED_BASIC_INGREDIENT_WORDS.has(token))) {
    return true;
  }

  return pantryItems.some((item) => {
    const pantryTokens = getIngredientTokens(item.name, { removePantryDescriptors: true });

    if (pantryTokens.length === 0) {
      return false;
    }

    const ingredientTokenSet = new Set(ingredientTokens);
    const pantryTokenSet = new Set(pantryTokens);
    const containsFullPantryItem = pantryTokens.every((token) => ingredientTokenSet.has(token));
    const isExactOrDescriptorShortenedMatch =
      ingredientTokens.every((token) => pantryTokenSet.has(token)) &&
      ingredientTokens.length === pantryTokens.length;

    return containsFullPantryItem || isExactOrDescriptorShortenedMatch;
  });
};

export const getInventedIngredients = (recipe: RecipeCandidate, pantryItems: PantryItemInput[]) =>
  recipe.ingredients.filter((ingredient) => !recipeIngredientIsAllowed(ingredient, pantryItems));

export const normalizeRecipeTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word.endsWith('s') && word.length > 3 ? word.slice(0, -1) : word))
    .join(' ');

export const hasObviousIncompatiblePairing = (recipe: RecipeCandidate) => {
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

export const validateRecipeCandidates = (
  candidateRecipes: RecipeCandidate[],
  pantryItems: PantryItemInput[],
  excludedRecipeTitles: string[]
) => {
  const seenRecipeTitles = new Set(excludedRecipeTitles.map(normalizeRecipeTitle));
  const validRecipes: RecipeCandidate[] = [];
  const rejectedRecipes: RecipeRejection[] = [];

  for (const candidateRecipe of candidateRecipes) {
    const normalizedTitle = normalizeRecipeTitle(candidateRecipe.title);

    if (seenRecipeTitles.has(normalizedTitle)) {
      rejectedRecipes.push({
        title: candidateRecipe.title,
        reason: 'duplicate',
      });
      continue;
    }

    if (hasObviousIncompatiblePairing(candidateRecipe)) {
      rejectedRecipes.push({
        title: candidateRecipe.title,
        reason: 'incompatible',
      });
      continue;
    }

    const inventedIngredients = getInventedIngredients(candidateRecipe, pantryItems);

    if (inventedIngredients.length > 0) {
      rejectedRecipes.push({
        title: candidateRecipe.title,
        reason: 'outside-pantry',
        details: inventedIngredients,
      });
      continue;
    }

    seenRecipeTitles.add(normalizedTitle);
    validRecipes.push(candidateRecipe);
  }

  return {
    validRecipes,
    rejectedRecipes,
  };
};

export const buildRecipePrompt = (validPantryItems: PantryItemInput[], excludedRecipeTitles: string[]) => {
  const subsetHints = findCompatibleSubsetHints(validPantryItems);
  const subsetHintText = subsetHints.length > 0
    ? subsetHints.map((subset, index) => `${index + 1}. ${subset.join(', ')}`).join('\n')
    : 'None detected by the app-side pre-check. Still use your own cooking knowledge before returning false.';

  return `You are a practical recipe generator.

Your task is to find sensible recipes that can be made from compatible subsets of the user's pantry.

Critical decision rules:
- Evaluate compatible subsets of the pantry, not the pantry as a whole.
- Return up to ${RECIPES_PER_REQUEST} distinct recipes in one response.
- Each valid recipe must use at least 3 compatible pantry items from the list.
- Pantry ingredients are optional. A recipe does not need to use every pantry item.
- Unrelated or incompatible pantry items must be ignored rather than causing the request to fail.
- Before returning canMakeRecipe false, actively search the pantry for reasonable subsets that form known dishes or sensible conventional recipes.
- If even one reasonable subset can make a practical recipe, top-level canMakeRecipe must be true.
- Return canMakeRecipe false only when no reasonable subset of the available pantry can make a sensible recipe.
- Prefer known dishes and established flavor combinations over invented combinations.
- Use broad cooking knowledge across cuisines.
- Do not force ingredients together just to use more pantry items.
- Do not create an unrelated dessert or side merely to consume incompatible ingredients.
- Never combine seafood or meat with chocolate, marshmallows, candy, or other dessert ingredients solely for ingredient coverage.
- The ingredients list must only include pantry items from the list, plus salt, pepper, dried herbs, spices, and water.
- Water may be used as a basic cooking necessity even if it is not listed in the pantry.
- Do not add bread, oil, butter, milk, eggs, flour, sugar, sauces, garnishes, or any other ingredient unless it appears in the pantry list.
- Do not return any recipe whose title is already listed in "Already shown recipe titles."
- If one obvious recipe is excluded, search for another valid subset or another genuinely different recipe before returning failure.

Potential compatible subsets found by app-side pre-check:
${subsetHintText}

Recipe quality:
- use realistic ingredient amounts
- use only ingredients that naturally belong in the recipe
- provide 5 to 7 clear directions
- include timing or visual cues where useful
- avoid requiring specialized equipment
- keep recipes practical for someone who is not very confident at cooking
- prefer weeknight-friendly preparation when possible

Pantry items:
${formatPantryItems(validPantryItems)}

Already shown recipe titles:
${excludedRecipeTitles.length > 0 ? excludedRecipeTitles.join('\n') : 'None'}

Return JSON with this shape:
{
  "canMakeRecipe": true,
  "recipes": [
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
  ]
}

If no pantry subset can make a realistic recipe, return JSON with this shape instead:
{
  "canMakeRecipe": false,
  "reason": "Could not make a realistic recipe from these ingredients."
}

Important final check before responding:
1. Did you search for compatible subsets rather than judge the whole pantry?
2. Is there at least one subset that can form a sensible recipe?
3. If yes, canMakeRecipe must be true.
4. If returning false, are you certain no reasonable subset works?`;
};
