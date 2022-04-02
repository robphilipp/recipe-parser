import {createToken, ILexingResult, Lexer, TokenPattern, TokenType} from 'chevrotain'
import * as Natural from 'natural'
import {baseUnits, phoneticUnits, pluralUnits, UnitInfo} from "./Units";
import XRegExp from "xregexp";
import {CustomPatternMatcherReturn} from "@chevrotain/types";

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
        add: function (this: RegExpParts, partName: string, pattern: string): RegExpParts {
            return {
                ...this,
                fragments: {
                    ...this.fragments,
                    [partName]: XRegExp.build(pattern, this.fragments)
                }
            }
        },
        regex: function (this: RegExpParts, partName: string, flags?: string): RegExp {
            return XRegExp.build(partName, this.fragments, flags)
        }
    }
}

const regexParts = emptyRegexParts()
    .add("NaturalNumberPart", /[1-9]\d*/.source)
    .add("IntegerPart", /0|[1-9]\d*/.source)
    .add("FractionalPart", /\.\d+/.source)
    .add("UnitsPart", /(fl oz)|(fluid ounce)|([a-zA-Z]+\.?)/.source)
    .add("IngredientTextPart", /[a-zA-Z]+/.source)
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
const IngredientText = createToken({
    name: "IngredientText",
    pattern: regexParts.regex("{{IngredientTextPart}}")
})
const Unit = createToken({
    name: "Unit",
    pattern: unitMatcher,
    // pattern: regexParts.regex("{{UnitsPart}}"),
    // longer_alt: IngredientText
    line_breaks: true
})
const WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED})
const ListItemId = createToken({
    name: "ListItemId",
    pattern: /(\(?\d+((.\))|[.):]))|[*•-]/,
    longer_alt: Decimal,
    // group: Lexer.SKIPPED
})

// order matters!
export const recipeTokens = [
    WhiteSpace,
    ListItemId,
    Fraction, Decimal, Integer,
    Unit,
    IngredientText
]

export const recipeTokenVocabulary = recipeTokens.reduce((vocab, token) => {
    vocab[token.name] = token
    return vocab
}, {} as { [key: string]: TokenType })

const RecipeLexer = new Lexer(recipeTokens)

export function lex(input: string): ILexingResult {
    const result = RecipeLexer.tokenize(input)

    if (result.errors.length > 0) {
        console.warn(`Failed lexing with errors: ${result.errors.map(error => error.message).join(";")}`)
        // throw Error(`Failed lexing with errors: ${result.errors.map(error => error.message).join(";")}`)
    }

    return result
}

function matchingUnit(
    text: string,
    startOffset: number,
    units: Array<[string, UnitInfo]>,
    extractor: (unit: UnitInfo) => Array<string>
): [matched: string, info: [string, UnitInfo]] | undefined {
    for (let i = 0; i < units.length; ++i) {
        const unitNames = extractor(units[i][1])
        const name = unitNames.find(syn => text.startsWith(`${syn}${text.length > startOffset + syn.length ? ' ' : ''}`, startOffset))
        if (name !== undefined) {
            return [name, units[i]]
        }
    }
    return undefined
}

function unitMatcher(text: string, startOffset: number): CustomPatternMatcherReturn | RegExpExecArray | null {
    // try (in order) plural synonyms, singular synonyms, phonetic names
    // const synonym = Object.entries(pluralUnits)
    //     .concat(Object.entries(baseUnits))
    //     .find(([, info]) => info.synonyms
    //         .findIndex(syn => text.startsWith(`${syn}${text.length > startOffset + syn.length ? ' ' : ''}`, startOffset)) > -1
    //         // .findIndex(syn => text.startsWith(`${syn}${text.length > startOffset + syn.length ? ' ' : ''}`, startOffset)) > -1
    //     )
    // if (synonym !== undefined) {
    //     const result: CustomPatternMatcherReturn = [synonym[1].target]
    //     result.payload = synonym
    //     return [synonym[1].target]
    // }
    const synonym = matchingUnit(
        text,
        startOffset,
        Object.entries(pluralUnits).concat(Object.entries(baseUnits)),
        unit => unit.synonyms
    )
    if (synonym !== undefined) {
        const result: CustomPatternMatcherReturn = [synonym[0]]
        result.payload = synonym[1][1].target
        return result
    }

    const abbreviation = matchingUnit(
        text,
        startOffset,
        Object.entries(pluralUnits).concat(Object.entries(baseUnits)),
        unit => unit.abbreviations
    )
    if (abbreviation !== undefined) {
        const result: CustomPatternMatcherReturn = [abbreviation[0]]
        result.payload = abbreviation[1][1].target
        return result
    }

    // // try (in order) plural abbreviations, singular abbreviations
    // const abbreviation = Object.entries(pluralUnits)
    //     .concat(Object.entries(baseUnits))
    //     .find(([, info]) => info.abbreviations
    //         .findIndex(syn => text.startsWith(`${syn}${text.length > startOffset + syn.length ? ' ' : ''}`, startOffset)) > -1
    //     )
    // if (abbreviation !== undefined) {
    //     return [abbreviation[1].target]
    // }

    // check phonetics as a last resort
    const phonetics = matchingUnit(text, startOffset, Object.entries(phoneticUnits), unit => unit.synonyms)
    if (phonetics !== undefined) {
        const result: CustomPatternMatcherReturn = [phonetics[0]]
        result.payload = phonetics[1][1].target
        return result
    }
    // const phonetics = (Object.entries(phoneticUnits))
    //     .find(([, info]) => info.synonyms
    //         .findIndex(syn => text.startsWith(`${syn}${text.length > startOffset + syn.length ? ' ' : ''}`, startOffset)) > -1
    //     )
    // if (phonetics !== undefined) {
    //     return [phonetics[1].target]
    // }

    // no match
    return null
}
// function unitMatcher(text: string, startOffset: number): [matchedString: string] | null {
//     // try (in order) plural synonyms, singular synonyms, phonetic names
//     const synonym = Object.entries(pluralUnits)
//         .concat(Object.entries(baseUnits))
//         .find(([, info]) => info.synonyms
//             .findIndex(syn => text.startsWith(`${syn}${text.length > startOffset + syn.length ? ' ' : ''}`, startOffset)) > -1
//         )
//     if (synonym !== undefined) {
//         return [synonym[1].target]
//     }
//
//     // try (in order) plural abbreviations, singular abbreviations
//     const abbreviation = Object.entries(pluralUnits)
//         .concat(Object.entries(baseUnits))
//         .find(([, info]) => info.abbreviations
//             .findIndex(syn => text.startsWith(`${syn}${text.length > startOffset + syn.length ? ' ' : ''}`, startOffset)) > -1
//         )
//     if (abbreviation !== undefined) {
//         return [abbreviation[1].target]
//     }
//
//     // check phonetics as a last resort
//     const phonetics = (Object.entries(phoneticUnits))
//         .find(([, info]) => info.synonyms
//             .findIndex(syn => text.startsWith(`${syn}${text.length > startOffset + syn.length ? ' ' : ''}`, startOffset)) > -1
//         )
//     if (phonetics !== undefined) {
//         return [phonetics[1].target]
//     }
//
//     // no match
//     return null
// }
