import {createToken, ILexingResult, Lexer, TokenType} from 'chevrotain'
import {baseUnits, phoneticUnits, pluralUnits, UnitInfo} from "./Units";
import XRegExp from "xregexp";
import {CustomPatternMatcherReturn} from "@chevrotain/types";
import {fractionFromUnicode, isValidFraction} from "./Numbers";

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
const UnicodeFraction = createToken({
    name: "UnicodeFraction",
    pattern: matchUnicodeFraction,
    line_breaks: false
})
const IngredientText = createToken({
    name: "IngredientText",
    pattern: regexParts.regex("{{IngredientTextPart}}")
})
const Unit = createToken({
    name: "Unit",
    pattern: unitMatcher,
    line_breaks: true
})
const WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED})
const ListItemId = createToken({
    name: "ListItemId",
    pattern: /(\(?\d+((.\))|[.):]))|[*•-]/,
    longer_alt: Decimal,
})

// order matters!
export const recipeTokens = [
    WhiteSpace,
    ListItemId,
    UnicodeFraction, Fraction, Decimal, Integer,
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

/**
 *
 * @param text
 * @param startOffset
 */
function matchUnicodeFraction(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    const currentChar = text.charAt(startOffset)

    const [numerator, denominator] = fractionFromUnicode(currentChar)
    if (isValidFraction([numerator, denominator])) {
        const result: CustomPatternMatcherReturn = [currentChar]
        result.payload = [numerator, denominator]
        return result
    }
    return null
}

/**
 * Attempts to match the units to the current location in the text
 * @param text The text to search
 * @param startOffset The current location in the text
 * @return A pattern matching result if the text matches the unit or null if there is not match
 */
function unitMatcher(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    // try (in order) plural synonyms, singular synonyms, phonetic names
    const synonym = matchingSynonym(text, startOffset, Object.entries(pluralUnits).concat(Object.entries(baseUnits)))
    if (synonym !== undefined) {
        return synonym
    }

    // try (in order) plural abbreviations, singular abbreviations
    const abbreviation = matchingAbbreviation(
        text,
        startOffset,
        Object.entries(pluralUnits).concat(Object.entries(baseUnits)),
    )
    if (abbreviation !== undefined) {
        return abbreviation
    }

    // check phonetics as a last resort
    const phonetics = matchingSynonym(text, startOffset, Object.entries(phoneticUnits))
    if (phonetics !== undefined) {
        return phonetics
    }

    // no match
    return null
}

/**
 * Attempts to find the synonym that matches the current location in the text
 * @param text The text to search
 * @param startOffset The current location in the text
 * @param units The array `(field_name, unit_info)` pairs
 * @return A custom pattern match result if found or undefined if not found
 */
function matchingSynonym(
    text: string,
    startOffset: number,
    units: Array<[string, UnitInfo]>
): CustomPatternMatcherReturn | undefined {
    const synonym = matchingUnit(text, startOffset, units, unit => unit.synonyms)
    if (synonym !== undefined) {
        const result: CustomPatternMatcherReturn = [synonym[0]]
        result.payload = synonym[1][1].target
        return result
    }
    return undefined
}

/**
 * Attempts to find the abbreviation that matches the current location in the text
 * @param text The text to search
 * @param startOffset The current location in the text
 * @param units The array `(field_name, unit_info)` pairs
 * @return A custom pattern match result if found or undefined if not found
 */
function matchingAbbreviation(
    text: string,
    startOffset: number,
    units: Array<[string, UnitInfo]>
): CustomPatternMatcherReturn | undefined {
    const abbreviation = matchingUnit(text, startOffset, units, unit => unit.abbreviations)
    if (abbreviation !== undefined) {
        const result: CustomPatternMatcherReturn = [abbreviation[0]]
        result.payload = abbreviation[1][1].target
        return result
    }
    return undefined
}

/**
 * Attempts to find the matching unit for the current location in the text
 * @param text The text to search
 * @param startOffset The current location in the text
 * @param units The array `(field_name, unit_info)` pairs
 * @param extractor The extractor for pulling the unit values (synonyms or abbreviations) from the
 * unit info object.
 * @return A tuple holding the matched text and the matched unit info
 */
function matchingUnit(
    text: string,
    startOffset: number,
    units: Array<[fiedlName: string, info: UnitInfo]>,
    extractor: (unit: UnitInfo) => Array<string>
): [matched: string, info: [string, UnitInfo]] | undefined {
    for (let i = 0; i < units.length; ++i) {
        const unitNames = extractor(units[i][1])
        const name = unitNames.find(
            syn => text.startsWith(`${syn}${text.length > startOffset + syn.length ? ' ' : ''}`, startOffset)
        )
        if (name !== undefined) {
            return [name, units[i]]
        }
    }
    return undefined
}
