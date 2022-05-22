# recipe-parser version history

## version 0.1.2 (fixed typing in RecipeResult)

Fixed the typing in the `RecipeResult` so that it is either a full `Recipe`, or when the
input type is for ingredients, then `Array<Ingredient>`, or when the input type is for steps,
then an `Array<Step>`.

## version 0.1.1 (accented characters)

Updated the regular expressions used for lexing to allow accented characters in ingredients and sections.

## version 0.1.0 (initial version)

Initial version that parses a recipe consisting of ingredients and steps, or the ingredients, or the steps, separately. 