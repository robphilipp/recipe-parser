import {toRecipe} from "./RecipeCstVisitor";
import {UnitType} from "./Units";

describe("when creating an ast", () => {
    it("should be able to build recipe from ingredients", () => {
        const input = `1 1/2 cp all-purpose flour
        1 tsp vanilla extract,
        1 cup milk
        1 egg`

        const {recipe, errors} = toRecipe(input)
        expect(true).toBeTruthy()
        expect(recipe).toEqual({
            type: "ingredients",
            ingredients: [
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg', section: null, brand: null},
            ]})
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

        const {recipe, errors} = toRecipe(input)
        expect(true).toBeTruthy()
        expect(recipe).toEqual({
            type: "ingredients",
            ingredients: [
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg', section: null, brand: null},
            ]})
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
#sauce#
1 cup milk
1 egg`

        const {recipe, errors} = toRecipe(input)
        expect(true).toBeTruthy()
        expect(recipe).toEqual({
            type: "ingredients",
            ingredients: [
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk', section: 'sauce', brand: null},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg', section: 'sauce', brand: null},
            ]})
        expect(errors).toHaveLength(1)
        expect(errors[0]).toEqual({
            offset: 56,
            line: 3,
            column: 22,
            length: 1,
            message: "unexpected character: ->,<- at offset: 56, skipped 1 characters."
        })
        expect(input[56]).toBe(',')
    })
    it("should be able to build recipe from ingredients with section headers as newlines", () => {
        const input = `dough
1 1/2 cp all-purpose flour
1 tsp vanilla extract,
sauce
1 cup milk
1 egg`

        const {recipe, errors} = toRecipe(input)
        expect(true).toBeTruthy()
        expect(recipe).toEqual({
            type: "ingredients",
            ingredients: [
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk', section: 'sauce', brand: null},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg', section: 'sauce', brand: null},
            ]})
        expect(errors).toHaveLength(1)
        expect(errors[0]).toEqual({
            offset: 54,
            line: 2,
            column: 22,
            length: 1,
            message: "unexpected character: ->,<- at offset: 54, skipped 1 characters."
        })
        expect(input[54]).toBe(',')
    })
    it("should be able to build recipe from ingredients with section headers as newlines, de-dup sections", () => {
        const input = `dough
1 1/2 cp all-purpose flour
1 tsp vanilla extract,
sauce
1 cup milk
1 egg`

        const {recipe, errors} = toRecipe(input, true)
        expect(true).toBeTruthy()
        expect(recipe).toEqual({
            type: "ingredients",
            ingredients: [
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour', section: 'dough', brand: null},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract', section: null, brand: null},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk', section: 'sauce', brand: null},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg', section: null, brand: null},
            ]})
        expect(errors).toHaveLength(1)
        expect(errors[0]).toEqual({
            offset: 54,
            line: 2,
            column: 22,
            length: 1,
            message: "unexpected character: ->,<- at offset: 54, skipped 1 characters."
        })
        expect(input[54]).toBe(',')
    })
})