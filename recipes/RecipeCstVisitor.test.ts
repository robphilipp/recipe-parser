import {convertText, toIngredients, toRecipe} from "./RecipeCstVisitor";
import {Unit} from "./lexer/Units";
import {ParseType} from "./ParseType";

describe("when creating an ast", () => {
    it("should be able to build recipe from ingredients", () => {
        const input = `1 1/2 cp all-purpose flour
        1 tsp vanilla extract,
        1 cup milk
        1 egg`

        const {result: ingredients, errors} = toIngredients(input)
        expect(ingredients).toEqual([
                {amount: {quantity: 1.5, unit: Unit.CUP}, ingredient: 'all-purpose flour', section: null, brand: null},
                {amount: {quantity: 1, unit: Unit.TEASPOON}, ingredient: 'vanilla extract', section: null, brand: null},
                {amount: {quantity: 1, unit: Unit.CUP}, ingredient: 'milk', section: null, brand: null},
                {amount: {quantity: 1, unit: Unit.PIECE}, ingredient: 'egg', section: null, brand: null},
            ])
        expect(errors).toHaveLength(1)
        expect(errors[0]).toEqual({
            offset: 56,
            line: 2,
            column: 30,
            length: 1,
            message: "unexpected character: ->,<- at offset: 56, skipped 1 characters."
        })
        expect(input[56]).toBe(',')
    })
    it("should be able to build recipe from ingredients that are part of a list", () => {
        const input = `- 1 1/2 cp all-purpose flour
        - 1 tsp vanilla extract,
        2) 1 cup milk
        1. 1 egg`

        const {result: ingredients, errors} = toIngredients(input)
        expect(true).toBeTruthy()
        expect(ingredients).toEqual([
                {amount: {quantity: 1.5, unit: Unit.CUP}, ingredient: 'all-purpose flour', section: null, brand: null},
                {amount: {quantity: 1, unit: Unit.TEASPOON}, ingredient: 'vanilla extract', section: null, brand: null},
                {amount: {quantity: 1, unit: Unit.CUP}, ingredient: 'milk', section: null, brand: null},
                {amount: {quantity: 1, unit: Unit.PIECE}, ingredient: 'egg', section: null, brand: null},
            ])
        expect(errors).toHaveLength(1)
        expect(errors[0]).toEqual({
            offset: 60,
            line: 2,
            column: 32,
            length: 1,
            message: "unexpected character: ->,<- at offset: 60, skipped 1 characters."
        })
        expect(input[60]).toBe(',')
    })
    it("should be able to build recipe from ingredients with section headers", () => {
        const input = `#dough#
            1 1/2 cp all-purpose flour
            1 tsp vanilla extract,
            # sauce #
            1 cup milk
            1 egg`

        const {result: ingredients, errors} = toIngredients(input)
        expect(true).toBeTruthy()
        expect(ingredients).toEqual([
                {amount: {quantity: 1.5, unit: Unit.CUP}, ingredient: 'all-purpose flour', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: Unit.TEASPOON}, ingredient: 'vanilla extract', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: Unit.CUP}, ingredient: 'milk', section: 'sauce', brand: null},
                {amount: {quantity: 1, unit: Unit.PIECE}, ingredient: 'egg', section: 'sauce', brand: null},
            ])
        expect(errors).toHaveLength(1)
        expect(errors[0]).toEqual({
            offset: 80,
            line: 3,
            column: 34,
            length: 1,
            message: "unexpected character: ->,<- at offset: 80, skipped 1 characters."
        })
        expect(input[80]).toBe(',')
    })
    it("should be able to build recipe from ingredients with section headers as newlines", () => {
        const input = `  
            dough
            1 1/2 cp all-purpose flour
            1 tsp vanilla extract,
            sauce
            ⅛ ℓ milk
            1 egg`

        const {result: ingredients, errors} = toIngredients(input)
        expect(true).toBeTruthy()
        expect(ingredients).toEqual([
                {amount: {quantity: 1.5, unit: Unit.CUP}, ingredient: 'all-purpose flour', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: Unit.TEASPOON}, ingredient: 'vanilla extract', section: 'dough', brand: null},
                {amount: {quantity: 0.125, unit: Unit.LITER}, ingredient: 'milk', section: 'sauce', brand: null},
                {amount: {quantity: 1, unit: Unit.PIECE}, ingredient: 'egg', section: 'sauce', brand: null},
            ])
        expect(errors).toHaveLength(1)
        expect(errors[0]).toEqual({
            offset: 93,
            line: 3,
            column: 34,
            length: 1,
            message: "unexpected character: ->,<- at offset: 93, skipped 1 characters."
        })
        expect(input[93]).toBe(',')
    })
    it("should be able to build recipe from ingredients with section headers as newlines, de-dup sections", () => {
        const input = `dough
            1 1/2 cp all-purpose flour
            1 tsp vanilla extract,
            sauce
            1 cup milk
            1 egg`

        const {result: ingredients, errors} = toIngredients(input, {deDupSections: true})
        expect(ingredients).toEqual([
                {amount: {quantity: 1.5, unit: Unit.CUP}, ingredient: 'all-purpose flour', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: Unit.TEASPOON}, ingredient: 'vanilla extract', section: null, brand: null},
                {amount: {quantity: 1, unit: Unit.CUP}, ingredient: 'milk', section: 'sauce', brand: null},
                {amount: {quantity: 1, unit: Unit.PIECE}, ingredient: 'egg', section: null, brand: null},
            ])
        expect(errors).toHaveLength(1)
        expect(errors[0]).toEqual({
            offset: 78,
            line: 2,
            column: 34,
            length: 1,
            message: "unexpected character: ->,<- at offset: 78, skipped 1 characters."
        })
        expect(input[78]).toBe(',')
    })
    it("should be able to parse the piri piri chicken recipe", () => {
        const input = `Ingredients
        Powder
            1. 2 tbsp sugar
            2) 1 tbsp paprika
            1 tbsp coriander
            1 tbsp cumin
            1 1/2 tbsp salt
            2 tbsps new mexico chile powder
            Sauce
            3 cloves garlic
            8 fresno peppers
            1/3 cup lemon juice
            1/4 cup red wine vinegar
            Chicken
            1 whole chicken
            Steps
            Spice rub
1. 1 tbsp ground coriander
2. 1.25 tbsp ground sweet paprika
3. 1 tbsp ground cumin
4. 1.5 tbsp salt
5. 2 tbsp of New Mexico Chile powder or Chile powder of your choice
6. Mix together and table out 2 tablespoon of spice for rubbing then put the rest into food processor
Sauce
7. Spice rub powder, Fresno pepper (keep some seeds to adjust the spiciness you like)
8. add 3 cloves of garlic and 2 tbsp of sugar then pause with food processor until the sauce is chopped
9. Pour 1/4 cup red wine and 1/3 cup lemon juice into the food processor then pulse the sauce.
Instructions
10. Reserve 1/4 cup of sauce with juice and brush sauce on the chicken skin. Marinate on the chicken for 45 mins.
11. Put on a tray with salt on bottom and rack on top put chicken on the rack.
12. Set oven at 425 degree F and roast for 45-50 mins. Then take out the chicken and brush with 2 tbsp of another layer of pepper sauce. Put back into oven for another 10-15 mins. Then take the chicken out and rest/cool for 10 mins.
13. Add 1 cup cilantro with leaves and stems to the sauce then put one last brushing on the chicken. Ready to serve`
        const {result: recipe, errors} = toRecipe(input, {deDupSections: true, gimmeANewLexer: true, gimmeANewParser: true})
        expect(recipe).toEqual({
            type: "recipe",
            ingredients: [
                {amount: {quantity: 2, unit: Unit.TABLESPOON}, ingredient: 'sugar', section: 'Powder', brand: null},
                {amount: {quantity: 1, unit: Unit.TABLESPOON}, ingredient: 'paprika', section: null, brand: null},
                {amount: {quantity: 1, unit: Unit.TABLESPOON}, ingredient: 'coriander', section: null, brand: null},
                {amount: {quantity: 1, unit: Unit.TABLESPOON}, ingredient: 'cumin', section: null, brand: null},
                {amount: {quantity: 1.5, unit: Unit.TABLESPOON}, ingredient: 'salt', section: null, brand: null},
                {amount: {quantity: 2, unit: Unit.TABLESPOON}, ingredient: 'new mexico chile powder', section: null, brand: null},

                {amount: {quantity: 3, unit: Unit.PIECE}, ingredient: 'cloves garlic', section: 'Sauce', brand: null},
                {amount: {quantity: 8, unit: Unit.PIECE}, ingredient: 'fresno peppers', section: null, brand: null},
                {amount: {quantity: 0.3333333333333333, unit: Unit.CUP}, ingredient: 'lemon juice', section: null, brand: null},
                {amount: {quantity: 0.25, unit: Unit.CUP}, ingredient: 'red wine vinegar', section: null, brand: null},

                {amount: {quantity: 1, unit: Unit.PIECE}, ingredient: 'whole chicken', section: 'Chicken', brand: null},
            ],
            steps: [
                {id: "1.", step: "1 tbsp ground coriander", title: "Spice rub"},
                {id: "2.", step: "1.25 tbsp ground sweet paprika", title: null},
                {id: "3.", step: "1 tbsp ground cumin", title: null},
                {id: "4.", step: "1.5 tbsp salt", title: null},
                {id: "5.", step: "2 tbsp of New Mexico Chile powder or Chile powder of your choice", title: null},
                {id: "6.", step: "Mix together and table out 2 tablespoon of spice for rubbing then put the rest into food processor", title: null},
                {id: "7.", step: "Spice rub powder, Fresno pepper (keep some seeds to adjust the spiciness you like)", title: "Sauce"},
                {id: "8.", step: "add 3 cloves of garlic and 2 tbsp of sugar then pause with food processor until the sauce is chopped", title: null},
                {id: "9.", step: "Pour 1/4 cup red wine and 1/3 cup lemon juice into the food processor then pulse the sauce.", title: null},
                {id: "10.", step: "Reserve 1/4 cup of sauce with juice and brush sauce on the chicken skin. Marinate on the chicken for 45 mins.", title: "Instructions"},
                {id: "11.", step: "Put on a tray with salt on bottom and rack on top put chicken on the rack.", title: null},
                {id: "12.", step: "Set oven at 425 degree F and roast for 45-50 mins. Then take out the chicken and brush with 2 tbsp of another layer of pepper sauce. Put back into oven for another 10-15 mins. Then take the chicken out and rest/cool for 10 mins.", title: null},
                {id: "13.", step: "Add 1 cup cilantro with leaves and stems to the sauce then put one last brushing on the chicken. Ready to serve", title: null}            ]
        })
        expect(errors).toHaveLength(0)
    })
    it("should be able to parse accents and character modifiers", () => {
        const input = `Pöwder
2 tbsps sugar
1 tbsp paprika
3 cloves garlic
1 tbsp salt
1 tbsp coriander
1 tbsp cumin
2 tbsps New Mexico Chile powder or CA Chile powder
Sauce
8 Fresno pepper or Jalapeño or red cherry peppers
⅓ cup lemon juice
Chicken
¼ cup red wine vinegar
1 whole chicken`

        const {result: ingredients, errors} = toIngredients(input, {deDupSections: true, gimmeANewParser: true, gimmeANewLexer: true})
        expect(errors).toHaveLength(0)
        expect(ingredients).toEqual([
            {amount: {quantity: 2, unit: Unit.TABLESPOON}, ingredient: 'sugar', section: 'Pöwder', brand: null},
            {amount: {quantity: 1, unit: Unit.TABLESPOON}, ingredient: 'paprika', section: null, brand: null},
            {amount: {quantity: 3, unit: Unit.PIECE}, ingredient: 'cloves garlic', section: null, brand: null},
            {amount: {quantity: 1, unit: Unit.TABLESPOON}, ingredient: 'salt', section: null, brand: null},
            {amount: {quantity: 1, unit: Unit.TABLESPOON}, ingredient: 'coriander', section: null, brand: null},
            {amount: {quantity: 1, unit: Unit.TABLESPOON}, ingredient: 'cumin', section: null, brand: null},
            {amount: {quantity: 2, unit: Unit.TABLESPOON}, ingredient: 'New Mexico Chile powder or CA Chile powder', section: null, brand: null},
            {amount: {quantity: 8, unit: Unit.PIECE}, ingredient: 'Fresno pepper or Jalapeño or red cherry peppers', section: 'Sauce', brand: null},
            {amount: {quantity: 0.3333333333333333, unit: Unit.CUP}, ingredient: 'lemon juice', section: null, brand: null},
            {amount: {quantity: 0.25, unit: Unit.CUP}, ingredient: 'red wine vinegar', section: 'Chicken', brand: null},
            {amount: {quantity: 1, unit: Unit.PIECE}, ingredient: 'whole chicken', section: null, brand: null},
        ])
    })
})