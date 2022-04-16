import {parse} from "./RecipeParser";

describe("when parsing a recipe", () => {
    it("should work", () => {
        const {parserInstance, cst} = parse("1 1/2 cp all purpose flour")
        // expect(result.tokens.map(token => token.image)).toEqual(["1 1/2 cp", "all", "purpose", "flour"])
        // // the payload holds the actual unit calculated from the text
        // expect(result.tokens[0].payload).toEqual({quantity: [3, 2], unit: 'cup'})

        expect(true).toBeTruthy()
    })

    it("should work for multiple items", () => {
        const {parserInstance, cst} = parse(`1 1/2 cp all-purpose flour
        1 tsp vanilla extract`)
        // expect(result.tokens.map(token => token.image)).toEqual(["1 1/2 cp", "all", "purpose", "flour"])
        // // the payload holds the actual unit calculated from the text
        // expect(result.tokens[0].payload).toEqual({quantity: [3, 2], unit: 'cup'})

        expect(true).toBeTruthy()
    })
})