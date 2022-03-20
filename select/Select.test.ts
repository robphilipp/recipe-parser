import {parse} from "./SelectParser";
import {toAst} from "./SqlToAstVisitor";

describe("when parsing", () => {
    // const {lexer, tokens} = createSelectLexer()
    // const parser = new SelectParser()


    it("should be able to parse a valid sql statement", () => {
        // parser.input = lex("SELECT column1 FROM table2 WHERE column1 > 10").tokens
        // const output = parser.selectStatement()
        const {parserInstance: parser} = parse("SELECT column1 FROM table2 WHERE column1 > 10")
        expect(parser.errors.length).toBe(0)
    })

    it("should not be able to parse a valid sql statement", () => {
        // parser.input = lex("SELECT column1, FROM table2").tokens
        // parser.selectStatement()
        const {parserInstance: parser} = parse("SELECT column1, FROM table2")
        expect(parser.errors.length).toBe(1)
    })
})

describe("doing semantics", () => {
    it("should be able to create the AST", () => {
        const ast = toAst("SELECT column1 FROM table2 WHERE column1 > 10")
        expect(ast).toBeDefined()
    })

})