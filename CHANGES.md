# recipe-parser version history

## version 1.1.0 (cleaned-up return types; fixed steps parsing)

1. Fixed the way steps were parsed that restricted special characters and made the parsing quirky overall. Now the lexer is a multi-mode lexer so that the steps can really be free form. 
2. Updated the return types from the `toRecipe`, `toIngredients`, and `toSteps` functions so that they return a type specific to the action. This cleans up the typing, making it altogether less confusing.
3. Parser and CST visitor now takes parser options to select the input-type (recipe, steps, ingredients) and whether to create a new lexer and/or parser.

## version 1.0.0 (parsing functions renamed)

1. The `toRecipe(...)` function has been renamed to `convertText(...)`, but I encourage you to use the new `toRecipe(..)`, `toIngredients(...)`, and the `toSteps(...)` functions instead.
2. The `RecipeResult` type is now parameterized by the return type (i.e. `Recipe`, `Array<Ingredient>`, and `Array<Step>`), and the field `recipe` has been renamed to `result`.
3. Added functions `toRecipe(..)`, `toIngredients(...)`, and the `toSteps(...)` that return a `RecipeResult<Recipe>`, `RecipeResult<Array<Ingredients>>` and a `RecipeResult<Array<Step>>`, respectively.

## version 0.1.2 (fixed typing in RecipeResult)

Fixed the typing in the `RecipeResult` so that it is either a full `Recipe`, or when the
input type is for ingredients, then `Array<Ingredient>`, or when the input type is for steps,
then an `Array<Step>`.

## version 0.1.1 (accented characters)

Updated the regular expressions used for lexing to allow accented characters in ingredients and sections.

## version 0.1.0 (initial version)

Initial version that parses a recipe consisting of ingredients and steps, or the ingredients, or the steps, separately. 