import {CstNode, CstParser} from 'chevrotain'
import {lex, tokenVocabulary} from './SelectLexer';

const {Select, From, Where, Identifier, Integer, GreaterThan, LessThan, Comma} = tokenVocabulary

/**
 * Represents the grammar for the simple select statement
 */
export class SelectParser extends CstParser {

    constructor() {
        super(tokenVocabulary)

        this.performSelfAnalysis()
    }
    selectStatement = this.RULE("selectStatement", () => {
        this.SUBRULE(this.selectClause)
        this.SUBRULE(this.fromClause)
        this.OPTION(() => {
            this.SUBRULE(this.whereClause)
        })
    })
    selectClause = this.RULE("selectClause", () => {
        this.CONSUME(Select)
        this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => {
                this.CONSUME(Identifier)
            }
        })
    })
    fromClause = this.RULE("fromClause", () => {
        this.CONSUME(From)
        this.CONSUME(Identifier)
    })
    whereClause = this.RULE("whereClause", () => {
        this.CONSUME(Where)
        this.SUBRULE(this.expression)
    })
    expression = this.RULE("expression", () => {
        this.SUBRULE(this.atomicExpression, {LABEL: "lhs"})
        this.SUBRULE(this.relationalOperator)
        this.SUBRULE2(this.atomicExpression, {LABEL: "rhs"})
    })
    atomicExpression = this.RULE("atomicExpression", () => {
        this.OR([
            {ALT: () => this.CONSUME(Integer)},
            {ALT: () => this.CONSUME(Identifier)}
        ])
    })
    relationalOperator = this.RULE("relationalOperator", () => {
        this.OR([
            {ALT: () => this.CONSUME(GreaterThan)},
            {ALT: () => this.CONSUME(LessThan)}
        ])
    })
}

const parserInstance = new SelectParser()

/**
 * Calls the lexer on the input string, and then parses the tokens from the lexer
 * @param input
 */
export function parse(input: string): {parserInstance: SelectParser, cst: CstNode} {
    const lexResult = lex(input)

    parserInstance.input = lexResult.tokens

    const cst = parserInstance.selectStatement()

    // if (parserInstance.errors.length > 0) {
    //     throw Error(`Error parsing; errors: ${parserInstance.errors}`)
    // }

    return {parserInstance, cst}
}