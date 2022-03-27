import {createToken, ILexingResult, Lexer, TokenType} from 'chevrotain'

const Identifier = createToken({name: "Identifier", pattern: /[a-zA-Z]\w*/},)
const Select = createToken({name: "Select", pattern: /SELECT/, longer_alt: Identifier})
const From = createToken({name: "From", pattern: /FROM/, longer_alt: Identifier})
const Where = createToken({name: "Where", pattern: /WHERE/, longer_alt: Identifier})

const Comma = createToken({name: "Comma", pattern: /,/})
const Integer = createToken({name: "Integer", pattern: /0|[1-9]\d*/})
const GreaterThan = createToken({name: "GreaterThan", pattern: />/})
const LessThan = createToken({name: "LessThan", pattern: /</})

const WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED})

// note we are placing WhiteSpace first as it is very common thus it will speed up the lexer.
export const tokens = [
    WhiteSpace,
    // "keywords" appear before the Identifier
    Select, From, Where, Comma,
    // The Identifier must appear after the keywords because all keywords are valid identifiers.
    Identifier, Integer, GreaterThan, LessThan
]

export const tokenVocabulary = tokens.reduce((vocab, token) => {
    vocab[token.name] = token
    return vocab
}, {} as {[key: string]: TokenType})

const SelectLexer = new Lexer(tokens)

/**
 * Runs the lexer on the input string
 * @param input
 */
export function lex(input: string): ILexingResult {
    const result = SelectLexer.tokenize(input)

    if(result.errors.length > 0) {
        throw Error(`Failed lexing with errors: ${result.errors}`)
    }

    return result
}

