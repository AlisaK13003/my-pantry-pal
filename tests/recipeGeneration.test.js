const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const loadRecipeGenerationModule = () => {
  const sourcePath = path.join(__dirname, '..', 'src', 'lib', 'recipeGeneration.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  const context = vm.createContext({
    exports: module.exports,
    module,
    require,
    console,
    Set,
    RegExp,
    Number,
  });

  new vm.Script(output.outputText, { filename: sourcePath }).runInContext(context);
  return module.exports;
};

const {
  buildRecipePrompt,
  buildSupplementalRecipePrompt,
  findCompatibleSubsetHints,
  mergeSupplementalRecipeCandidates,
  shouldRequestSupplementalRecipes,
  validateRecipeCandidates,
} = loadRecipeGenerationModule();

const pantry = (names) => names.map((name) => ({ name }));

const pastaRecipe = {
  canMakeRecipe: true,
  title: 'Simple Tomato-Garlic Spaghetti',
  prepTime: '10 minutes',
  cookTime: '20 minutes',
  servings: '2 servings',
  ingredients: [
    '200g spaghetti',
    '2 cups crushed tomatoes',
    '2 cloves garlic, minced',
    '1 onion, diced',
    '1 tablespoon vegetable oil',
    'Salt to taste',
  ],
  directions: [
    'Boil the spaghetti in salted water until al dente.',
    'Warm the vegetable oil in a pan over medium heat.',
    'Cook onion until soft and translucent.',
    'Add garlic and cook until fragrant.',
    'Stir in the tomatoes and simmer until slightly thickened.',
    'Toss the spaghetti with the sauce and serve warm.',
  ],
  suggestions: 'Add pepper or dried herbs if you have them.',
  imageQuery: 'tomato garlic spaghetti',
};

const fritterRecipe = {
  canMakeRecipe: true,
  title: 'Coconut Banana Fritters',
  prepTime: '10 minutes',
  cookTime: '15 minutes',
  servings: '2 servings',
  ingredients: [
    '2 bananas, sliced',
    '1 cup rice flour',
    '1/2 cup shredded coconut',
    '2 tablespoons sugar',
    '1 teaspoon baking powder',
    '1/2 cup water',
    'Vegetable oil for frying',
  ],
  directions: [
    'Whisk rice flour, sugar, baking powder, and water into a thick batter.',
    'Fold in shredded coconut until evenly mixed.',
    'Heat vegetable oil in a shallow pan until a small drop of batter sizzles.',
    'Dip banana slices in the batter.',
    'Fry until golden on both sides.',
    'Drain briefly and serve warm.',
  ],
  suggestions: 'Plantains can be used instead of bananas if they are ripe.',
  imageQuery: 'banana coconut fritters',
};

const hummusRecipe = {
  canMakeRecipe: true,
  title: 'Lemon Garlic Hummus',
  prepTime: '10 minutes',
  cookTime: '0 minutes',
  servings: '4 servings',
  ingredients: [
    '1 can chickpeas, drained',
    '1/3 cup tahini',
    '2 tablespoons lemon juice',
    '1 clove garlic',
    '2 tablespoons olive oil',
    'Salt to taste',
    'Water as needed',
  ],
  directions: [
    'Add chickpeas, tahini, lemon juice, garlic, olive oil, and salt to a food processor.',
    'Blend until the mixture starts to smooth out.',
    'Add water one tablespoon at a time until the hummus is creamy.',
    'Taste and adjust salt if needed.',
    'Spoon into a bowl and drizzle with a little olive oil if desired.',
  ],
  suggestions: 'Serve chilled or at room temperature.',
  imageQuery: 'lemon garlic hummus',
};

test('Case A: mixed pantry with valid pasta subset returns a valid pasta recipe', () => {
  const items = pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
    'Strawberry Jam',
    'Dill Pickles',
    'Vanilla Ice Cream',
  ]);

  const hints = findCompatibleSubsetHints(items);
  const result = validateRecipeCandidates([pastaRecipe], items, []);

  assert.ok(hints.some((subset) => subset.includes('Spaghetti') && subset.includes('Tomatoes')));
  assert.equal(result.validRecipes.length, 1);
  assert.match(result.validRecipes[0].title, /spaghetti/i);
});

test('Case B: mixed pantry with valid fried-banana-style subset returns true', () => {
  const items = pantry([
    'Banana',
    'Plantains',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
    'Vegetable Oil',
    'Blue Cheese',
    'Dill Pickles',
  ]);

  const hints = findCompatibleSubsetHints(items);
  const result = validateRecipeCandidates([fritterRecipe], items, []);

  assert.ok(hints.some((subset) => subset.includes('Banana') && subset.includes('Rice Flour')));
  assert.equal(result.validRecipes.length, 1);
});

test('Case C: multiple valid subsets can return recipes from both groups', () => {
  const items = pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
    'Banana',
    'Plantains',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
    'Sesame Seeds',
    'Dill Pickles',
  ]);

  const hints = findCompatibleSubsetHints(items);
  const result = validateRecipeCandidates([pastaRecipe, fritterRecipe], items, []);

  assert.ok(hints.length >= 2);
  assert.deepEqual(Array.from(result.validRecipes, (recipe) => recipe.title), [
    pastaRecipe.title,
    fritterRecipe.title,
  ]);
});

test('Case D: genuinely unusable pantry has no subset hint and rejects absurd combinations', () => {
  const items = pantry([
    'Canned Sardines',
    'Banana',
    'Strawberry Jam',
    'Marshmallows',
    'Blue Cheese',
  ]);
  const absurdRecipe = {
    ...fritterRecipe,
    title: 'Sardine Marshmallow Banana Salad',
    ingredients: [
      '1 can canned sardines',
      '1 banana, sliced',
      '2 tablespoons strawberry jam',
      '1 cup marshmallows',
    ],
    suggestions: 'Serve cold.',
  };

  const hints = findCompatibleSubsetHints(items);
  const result = validateRecipeCandidates([absurdRecipe], items, []);

  assert.equal(hints.length, 0);
  assert.equal(result.validRecipes.length, 0);
  assert.equal(result.rejectedRecipes[0].reason, 'incompatible');
});

test('Case E: excluded title is skipped while another valid recipe survives', () => {
  const items = pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
    'Banana',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
  ]);

  const result = validateRecipeCandidates([pastaRecipe, fritterRecipe], items, [pastaRecipe.title]);

  assert.deepEqual(Array.from(result.validRecipes, (recipe) => recipe.title), [fritterRecipe.title]);
  assert.equal(result.rejectedRecipes[0].reason, 'duplicate');
});

test('Global cuisine Case A: prompt requires established-dish search before generic pancakes', () => {
  const prompt = buildRecipePrompt(pantry([
    'Banana',
    'Plantains',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
    'Vegetable Oil',
  ]), []);

  assert.match(prompt, /cultural and international dish discovery/i);
  assert.match(prompt, /required step before inventing a generic recipe/i);
  assert.match(prompt, /poor candidate selection:\n- Generic banana pancakes/i);
  assert.match(prompt, /fried banana and plantain preparations/i);
  assert.match(prompt, /not to always generate Thai fried bananas/i);
});

test('Global cuisine Case B: obvious Western dish can stay simple', () => {
  const prompt = buildRecipePrompt(pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
  ]), []);

  assert.match(prompt, /do not force an international framing/i);
  assert.match(prompt, /strong match to a conventional established recipe/i);
});

test('Global cuisine Case C: generic recipes are allowed when no cultural match is legitimate', () => {
  const prompt = buildRecipePrompt(pantry([
    'Potatoes',
    'Carrots',
    'Vegetable Oil',
    'Salt',
    'Pepper',
  ]), []);
  const genericRecipe = {
    canMakeRecipe: true,
    title: 'Simple Roasted Potatoes and Carrots',
    prepTime: '10 minutes',
    cookTime: '30 minutes',
    servings: '2 servings',
    ingredients: [
      '2 potatoes, chopped',
      '2 carrots, chopped',
      '1 tablespoon vegetable oil',
      'Salt and pepper to taste',
    ],
    directions: [
      'Heat the oven to 400°F.',
      'Cut the potatoes and carrots into even pieces.',
      'Toss them with vegetable oil, salt, and pepper.',
      'Spread them on a baking sheet.',
      'Roast until browned and tender.',
    ],
    suggestions: 'Serve warm as a simple side dish.',
    imageQuery: 'roasted potatoes carrots',
  };
  const result = validateRecipeCandidates([genericRecipe], pantry([
    'Potatoes',
    'Carrots',
    'Vegetable Oil',
    'Salt',
    'Pepper',
  ]), []);

  assert.match(prompt, /sensible original recipe/i);
  assert.match(prompt, /do not invent a cultural origin/i);
  assert.equal(result.validRecipes.length, 1);
});

test('Global cuisine Case D: mixed pantry keeps separate subsets and ignores unrelated items', () => {
  const items = pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
    'Banana',
    'Plantains',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
    'Strawberry Jam',
    'Dill Pickles',
    'Blue Cheese',
    'Vanilla Ice Cream',
  ]);

  const hints = findCompatibleSubsetHints(items);
  const result = validateRecipeCandidates([pastaRecipe, fritterRecipe], items, []);

  assert.ok(hints.some((subset) => subset.includes('Spaghetti') && subset.includes('Tomatoes')));
  assert.ok(hints.some((subset) => subset.includes('Banana') && subset.includes('Rice Flour')));
  assert.equal(result.validRecipes.length, 2);
});

test('Recipe count prompt asks the model not to stop early at 1 or 2 recipes', () => {
  const prompt = buildRecipePrompt(pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
    'Banana',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
  ]), []);

  assert.match(prompt, /Recipe count and discovery/i);
  assert.match(prompt, /Do not stop searching after finding only 1 or 2 recipes/i);
  assert.match(prompt, /fermented, pickled, preserved, marinated, chilled, and uncooked/i);
  assert.match(prompt, /Returning fewer than 3 recipes is acceptable only/i);
});

test('Three-cluster pantry can retain three distinct valid recipes', () => {
  const items = pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
    'Banana',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
    'Chickpeas',
    'Tahini',
    'Lemon Juice',
    'Olive Oil',
  ]);

  const result = validateRecipeCandidates([pastaRecipe, fritterRecipe, hummusRecipe], items, []);

  assert.equal(result.validRecipes.length, 3);
  assert.deepEqual(Array.from(result.validRecipes, (recipe) => recipe.title), [
    pastaRecipe.title,
    fritterRecipe.title,
    hummusRecipe.title,
  ]);
});

test('Only two legitimate recipes remain two instead of accepting a poor third', () => {
  const items = pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
    'Banana',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
  ]);
  const outsidePantryRecipe = {
    ...hummusRecipe,
    title: 'Lemon Garlic Hummus',
  };

  const result = validateRecipeCandidates([pastaRecipe, fritterRecipe, outsidePantryRecipe], items, []);

  assert.equal(result.validRecipes.length, 2);
  assert.equal(result.rejectedRecipes[0].reason, 'outside-pantry');
});

test('First call returns two and supplemental call can fill one more', () => {
  const items = pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
    'Banana',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
    'Chickpeas',
    'Tahini',
    'Lemon Juice',
    'Olive Oil',
  ]);
  const firstPass = validateRecipeCandidates([pastaRecipe, fritterRecipe], items, []);
  const merged = mergeSupplementalRecipeCandidates(firstPass.validRecipes, [hummusRecipe], items, []);

  assert.equal(shouldRequestSupplementalRecipes(firstPass.validRecipes.length), true);
  assert.equal(merged.recipes.length, 3);
  assert.deepEqual(Array.from(merged.recipes, (recipe) => recipe.title), [
    pastaRecipe.title,
    fritterRecipe.title,
    hummusRecipe.title,
  ]);
});

test('Supplemental duplicate is rejected and original valid recipes remain', () => {
  const items = pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
    'Banana',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
  ]);
  const firstPass = validateRecipeCandidates([pastaRecipe, fritterRecipe], items, []);
  const renamedDuplicate = {
    ...pastaRecipe,
    title: 'Simple Tomato Garlic Spaghetti',
  };
  const merged = mergeSupplementalRecipeCandidates(firstPass.validRecipes, [renamedDuplicate], items, []);

  assert.equal(merged.recipes.length, 2);
  assert.equal(merged.supplementalValidation.rejectedRecipes[0].reason, 'duplicate');
});

test('Supplemental outside-pantry result is rejected normally', () => {
  const items = pantry([
    'Spaghetti',
    'Tomatoes',
    'Garlic',
    'Onions',
    'Vegetable Oil',
    'Salt',
    'Banana',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
  ]);
  const firstPass = validateRecipeCandidates([pastaRecipe, fritterRecipe], items, []);
  const merged = mergeSupplementalRecipeCandidates(firstPass.validRecipes, [hummusRecipe], items, []);

  assert.equal(merged.recipes.length, 2);
  assert.equal(merged.supplementalValidation.rejectedRecipes[0].reason, 'outside-pantry');
});

test('First response with three valid recipes does not need supplemental discovery', () => {
  assert.equal(shouldRequestSupplementalRecipes(3), false);
  assert.equal(shouldRequestSupplementalRecipes(2), true);
  assert.equal(shouldRequestSupplementalRecipes(1), true);
  assert.equal(shouldRequestSupplementalRecipes(0), false);
});

test('Supplemental prompt tells the model what was already found', () => {
  const prompt = buildSupplementalRecipePrompt(
    pantry([
      'Spaghetti',
      'Tomatoes',
      'Garlic',
      'Onions',
      'Vegetable Oil',
      'Salt',
      'Banana',
      'Rice Flour',
      'Shredded Coconut',
      'Sugar',
      'Baking Powder',
      'Chickpeas',
      'Tahini',
      'Lemon Juice',
      'Olive Oil',
    ]),
    [pastaRecipe.title, fritterRecipe.title],
    [pastaRecipe, fritterRecipe],
    1
  );

  assert.match(prompt, /Supplemental discovery request/i);
  assert.match(prompt, /We still have room for 1 additional recipe/i);
  assert.match(prompt, /Do not repeat or lightly rename/i);
  assert.match(prompt, /different ingredient cluster, cuisine, or preparation method/i);
});
