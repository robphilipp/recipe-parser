import {lex} from "./RecipeLexer";

describe("when using the recipe lexer for ingredients", () => {
    it("should be able to tokenize a list of valid numbers", () => {
        const result = lex("0.333 314 3/2")
        expect(result.tokens.map(token => token.image)).toEqual(["0.333", "314", "3/2"])
    })
    it("should be able to tokenize a list of valid numbers with one invalid number", () => {
        const result = lex("0.333 314 3/2 3.2/4")
        expect(result.tokens.map(token => token.image)).toEqual(["0.333", "314", "3/2", "3.2", "/4"])
        expect(result.tokens[3].tokenType.name).toBe("Decimal")
        expect(result.tokens[4].tokenType.name).toBe("Word")
    })
    it("should be able to tokenize a list of number and units", () => {
        const result = lex("1/2 cup 4 gal fl oz")
        expect(result.tokens.map(token => token.image))
            .toEqual(["1/2", "cup", "4", "gal", "fl oz"])
    })
    it("should be able to tokenize an ingredient with full name", () => {
        const result = lex("1/2 gallon milk")
        expect(result.tokens.map(token => token.image)).toEqual(["1/2", "gallon", "milk"])
        // the payload holds the actual unit calculated from the text
        expect(result.tokens[1].payload).toBe("gal")
    })
    it("should be able to tokenize an ingredient", () => {
        const result = lex("1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["1/2", "cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with phonetics for cup", () => {
        const result = lex("1 1/2 cp all purpose flour")
        expect(result.tokens.map(token => token.image)).toEqual(["1", "1/2", "cp", "all", "purpose", "flour"])
        // the payload holds the actual unit calculated from the text
        expect(result.tokens[2].payload).toBe('cup')
    })
    it("should be able to tokenize an ingredient with for ¼ cup", () => {
        const result = lex("¼ cup all purpose flour")
        expect(result.tokens.map(token => token.image)).toEqual(["¼", "cup", "all", "purpose", "flour"])
        // the payload holds the actual unit calculated from the text
        expect(result.tokens[1].payload).toBe('cup')
        expect(result.tokens[0].payload).toEqual([1, 4])
    })
    it("should be able to tokenize an ingredient with for 1 ¼ cup", () => {
        const result = lex("1 ¼ cup all purpose flour")
        expect(result.tokens.map(token => token.image)).toEqual(["1 ¼", "cup", "all", "purpose", "flour"])
        // the payload holds the actual unit calculated from the text
        expect(result.tokens[1].payload).toBe('cup')
        expect(result.tokens[0].payload).toEqual([5, 4])
    })
    it("should be able to tokenize an ingredient with for 1¼ cup", () => {
        const result = lex("1¼ cup all purpose flour")
        expect(result.tokens.map(token => token.image)).toEqual(["1¼", "cup", "all", "purpose", "flour"])
        // the payload holds the actual unit calculated from the text
        expect(result.tokens[1].payload).toBe('cup')
        expect(result.tokens[0].payload).toEqual([5, 4])
    })
    it("should be able to tokenize an ingredient with phonetics for pint", () => {
        const result = lex("1/2 pnt all purpose flour")
        expect(result.tokens.map(token => token.image)).toEqual(["1/2", "pnt", "all", "purpose", "flour"])
        // the payload holds the actual unit calculated from the text, but in this case, pnt is matches
        // the phonetic value for pound and pint, and because pound appears first, it calculates it as pound.
        expect(result.tokens[1].payload).toBe('lb')
    })
    it("should be able to tokenize an ingredient with 1)", () => {
        const result = lex("1) 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["1)", "1/2", "cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with 1.", () => {
        const result = lex("1. 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["1.", "1/2", "cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with 10:", () => {
        const result = lex("10: 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["10:", "1/2", "cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with (1.)", () => {
        const result = lex("(1.) 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["(1.)", "1/2", "cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with 1.)", () => {
        const result = lex("1.) 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["1.)", "1/2", "cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with (100)", () => {
        const result = lex("(100) 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["(100)", "1/2", "cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with *", () => {
        const result = lex("* 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["*", "1/2", "cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with •", () => {
        const result = lex(" •    1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["•", "1/2", "cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with -", () => {
        const result = lex("- 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["-", "1/2", "cup", "all", "purpose", "flour"])
    })
})

describe("when using the recipe lexer for section headers", () => {
    it("should be able to lex a section header", () => {
        const result = lex(`\nSection Header\n`)
        expect(result.tokens.map(token => token.image)).toEqual(["\nSection Header\n"])
    })
    it("should be able to lex a section header and several ingredients", () => {
        const result = lex(`\nSection Header\n- 1/2 cup all purpose flour\n1 ¼ cup whole milk`)
        expect(result.tokens.map(token => token.image))
            .toEqual(['\nSection Header\n', "-", "1/2", "cup", "all", "purpose", "flour", "1 ¼", "cup", "whole", "milk"])
    })
})