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
  findCompatibleSubsetHints,
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

test('Prompt requires subset discovery without hard-coded recipe examples', () => {
  const prompt = buildRecipePrompt(pantry([
    'Banana',
    'Rice Flour',
    'Shredded Coconut',
    'Sugar',
    'Baking Powder',
    'Vegetable Oil',
  ]), []);

  assert.match(prompt, /compatible subsets/i);
  assert.doesNotMatch(prompt, /gluay|thai fried bananas/i);
});
