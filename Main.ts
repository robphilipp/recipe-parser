import {Lexer} from 'chevrotain'
import {lex, tokens} from "./select/SelectLexer";
import {SelectParser} from "./select/SelectParser";

// const {lexer, tokens} = createSelectLexer()

const inputText = "SELECT column1 FROM table2"

export const lexingResult = lex(inputText)

const parser = new SelectParser(tokens)
parser.input = lexingResult.tokens
export const cstNode = parser.selectStatement();
console.log(cstNode)

if (parser.errors.length > 0) {
    throw new Error("failed to parse")
}



/*
    Parsing
    selectStatement : selectClause fromClause (whereClause)?
    selectClause : "SELECT" Identifier ("," Identifier)*
    fromClause : "FROM" Identifier
    whereClause : "WHERE" expression
    expression : atomicExpression relationalOperator atomicExpression

    atomicExpression : Integer | Identifier
    relationalOperator : ">" | "<"
 */