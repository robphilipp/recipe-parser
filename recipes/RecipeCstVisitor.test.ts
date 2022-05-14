import {toRecipe} from "./RecipeCstVisitor";
import {UnitType} from "./lexer/Units";
import {ParseType} from "./RecipeParser";

describe("when creating an ast", () => {
    it("should be able to build recipe from ingredients", () => {
        const input = `1 1/2 cp all-purpose flour
        1 tsp vanilla extract,
        1 cup milk
        1 egg`

        const {recipe, errors} = toRecipe(input, {inputType: ParseType.INGREDIENTS})
        expect(true).toBeTruthy()
        expect(recipe).toEqual([
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg', section: null, brand: null},
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

        const {recipe, errors} = toRecipe(input, {inputType: ParseType.INGREDIENTS})
        expect(true).toBeTruthy()
        expect(recipe).toEqual([
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg', section: null, brand: null},
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

        const {recipe, errors} = toRecipe(input, {inputType: ParseType.INGREDIENTS})
        expect(true).toBeTruthy()
        expect(recipe).toEqual([
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk', section: 'sauce', brand: null},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg', section: 'sauce', brand: null},
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
            1 cup milk
            1 egg`

        const {recipe, errors} = toRecipe(input, {inputType: ParseType.INGREDIENTS})
        expect(true).toBeTruthy()
        expect(recipe).toEqual([
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk', section: 'sauce', brand: null},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg', section: 'sauce', brand: null},
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

        const {recipe, errors} = toRecipe(input, {deDupSections: true, inputType: ParseType.INGREDIENTS})
        expect(recipe).toEqual([
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk', section: 'sauce', brand: null},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg', section: null, brand: null},
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
            Sauce
            1. first step
            2. second step
            Chicken
            3) third step
            `
        const {recipe, errors} = toRecipe(input, {deDupSections: true})
        expect(recipe).toEqual({
            type: "recipe",
            ingredients: [
                {amount: {quantity: 2, unit: UnitType.TABLESPOON}, ingredient: 'sugar', section: 'Powder', brand: null},
                {amount: {quantity: 1, unit: UnitType.TABLESPOON}, ingredient: 'paprika', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.TABLESPOON}, ingredient: 'coriander', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.TABLESPOON}, ingredient: 'cumin', section: null, brand: null},
                {amount: {quantity: 1.5, unit: UnitType.TABLESPOON}, ingredient: 'salt', section: null, brand: null},
                {amount: {quantity: 2, unit: UnitType.TABLESPOON}, ingredient: 'new mexico chile powder', section: null, brand: null},

                {amount: {quantity: 3, unit: UnitType.PIECE}, ingredient: 'cloves garlic', section: 'Sauce', brand: null},
                {amount: {quantity: 8, unit: UnitType.PIECE}, ingredient: 'fresno peppers', section: null, brand: null},
                {amount: {quantity: 0.3333333333333333, unit: UnitType.CUP}, ingredient: 'lemon juice', section: null, brand: null},
                {amount: {quantity: 0.25, unit: UnitType.CUP}, ingredient: 'red wine vinegar', section: null, brand: null},

                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'whole chicken', section: 'Chicken', brand: null},
            ],
            steps: [
                {id: "1.", step: "first step", title: "Sauce"},
                {id: "2.", step: "second step", title: null},
                {id: "3)", step: "third step", title: "Chicken"},
            ]
        })
        expect(errors).toHaveLength(0)
    })
})