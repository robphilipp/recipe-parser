import {lex} from "./RecipeLexer";

describe("when using the recipe lexer", () => {
    it("should be able to tokenize a list of valid numbers", () => {
        const result = lex("0.333 314 3/2")
        expect(result.tokens.map(token => token.image)).toEqual(["0.333", "314", "3/2"])
    })
    it("should be able to tokenize a list of valid numbers with one invalid number", () => {
        const result = lex("0.333 314 3/2 3.2/4")
        expect(result.tokens.map(token => token.image).slice(0,3)).toEqual(["0.333", "314", "3/2"])
        expect(result.errors.length).toBe(1)
        expect(result.errors[0].message).toBe("unexpected character: ->/<- at offset: 17, skipped 1 characters.")
    })
})