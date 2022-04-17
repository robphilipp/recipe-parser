import {toAst} from "./RecipeCstVisitor";
import {UnitType} from "./Units";

describe("when creating an ast", () => {
    it("should work", () => {
        const result = toAst(`1 1/2 cp all-purpose flour
        1 tsp vanilla extract,
        1 cup milk
        1 egg`)
        expect(true).toBeTruthy()
        expect(result).toEqual({
            type: "ingredients",
            ingredients: [
                {amount: {quantity: 1.5, unit: UnitType.CUP}, ingredient: 'all-purpose flour'},
                {amount: {quantity: 1, unit: UnitType.TEASPOON}, ingredient: 'vanilla extract'},
                {amount: {quantity: 1, unit: UnitType.CUP}, ingredient: 'milk'},
                {amount: {quantity: 1, unit: UnitType.PIECE}, ingredient: 'egg'},
            ]})
    })
})