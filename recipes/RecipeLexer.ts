import {createToken, ILexingResult, Lexer, TokenType} from 'chevrotain'
import * as Natural from 'natural'
import {enrichedUnits} from "./Units";
import XRegExp from "xregexp";

/* -- ingredients

in ABNF (https://matt.might.net/articles/grammars-bnf-ebnf/)

<ingredient> ::= [<item_id> <whitespace>] <amount>

white_space = *( " " / "\t" )
list_item_id = ( [ "(" ] number [ "." / ")" / ":" ] ) / ( [ "-" / "*" / "•" ])

amount = [modifier] [white_space] quantity [white_space] [unit] [ "." ]
modifier :== approx / approximately / about / "~" / around
quantity = number / fraction
unit = (cup / tsp / tbsp (.... see units in recipes ui))["."]

number = integer / decimal
integer :: = 0 / (natural_digit *digit)
decimal :: integer "." 1*digit
fraction = integer "/" natural_digit *digit
natural_digit = 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9
digit = 0 / natural_digit
 */

type RegExpParts = {
    fragments: Record<string, XRegExp.Pattern>
    add: (partName: string, pattern: string) => RegExpParts
    regex: (partName: string) => RegExp
}

function emptyRegexParts(): RegExpParts {
    return {
        fragments: {},
        add: function(this: RegExpParts, partName: string, pattern: string): RegExpParts {
            return {
                ...this,
                fragments: {
                    ...this.fragments,
                    [partName]: XRegExp.build(pattern, this.fragments)
                }
            }
        },
        regex: function(this: RegExpParts, partName: string, flags?: string): RegExp {
            return XRegExp.build(partName, this.fragments, flags)
        }
    }
}

const regexParts = emptyRegexParts()
    .add("NaturalNumberPart", "[1-9]\\d*")
    .add("IntegerPart", "0|[1-9]\\d*")
    .add("FractionalPart", "\\.\\d+")
    // .add("NaturalNumberPart", /[1-9]\d*/.source)
    // .add("IntegerPart", /0|[1-9]\d*/.source)
    // .add("FractionalPart", /\.\d+/.source)
    .add("UnitsPart", Object.values(enrichedUnits).flatMap(unitInfo => unitInfo.synonyms.join("|")).join("|"))

// const Integer = createToken({name: "Integer", pattern: /0|[1-9]\d*/.source})
// const Decimal = createToken({name: "Decimal", pattern: /0|[1-9]\d*\.\d+/, longer_alt: Integer})
// const Fraction = createToken({name: "Fraction", pattern: /(0|[1-9]\d*)\/(0|[1-9]\d*)/, longer_alt: Integer})
const Integer = createToken({
    name: "Integer",
    pattern: regexParts.regex("{{IntegerPart}}")
})
const Decimal = createToken({
    name: "Decimal",
    pattern: regexParts.regex("{{IntegerPart}}{{FractionalPart}}"),
    longer_alt: Integer
})
const Fraction = createToken({
    name: "Fraction",
    pattern: regexParts.regex("{{IntegerPart}}/{{NaturalNumberPart}}"),
    longer_alt: Integer
})
const Unit = createToken({
    name: "Unit",
    pattern: regexParts.regex("{{UnitsPart}}")
})
const WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED})
const ListItemId = createToken({name: "ListItemId", pattern: /(\(?\d+[.):]?)|[*•-]?/, group: Lexer.SKIPPED})

// order matters!
export const recipeTokens = [
    WhiteSpace,
    Fraction, Decimal, Integer,
    Unit
]

export const recipeTokenVocabulary = recipeTokens.reduce((vocab, token) => {
    vocab[token.name] = token
    return vocab
}, {} as {[key: string]: TokenType})

const RecipeLexer = new Lexer(recipeTokens)

export function lex(input: string): ILexingResult {
    const result = RecipeLexer.tokenize(input)

    // if(result.errors.length > 0) {
    //     throw Error(`Failed lexing with errors: ${result.errors.map(error => error.message).join(";")}`)
    // }

    return result
}