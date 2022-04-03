import {createToken, ILexingResult, Lexer, TokenType} from 'chevrotain'
import {baseUnits, phoneticUnits, pluralUnits, UnitInfo} from "./Units";
import XRegExp from "xregexp";
import {CustomPatternMatcherReturn} from "@chevrotain/types";
import {fractionFromUnicode, isValidFraction} from "./Numbers";

/**
 * Immutable.
 *
 * Type for managing the regular expression parts for using {@link XRegExp}.
 *
 * Use the {@link newRegexParts} factory function to create a new {@link RegExpParts}
 * object.
 *
 * @see newRegexParts
 */
type RegExpParts = {
    /**
     * Holds the fragments that can be used to generate regular and combine
     * regular expressions.
     */
    readonly fragments: Record<string, XRegExp.Pattern>
    /**
     * Method for adding a new pattern to the fragments
     * @param partName The name of the new pattern
     * @param pattern The regex pattern string
     * @return A new {@link RegExpParts} object
     */
    add: (partName: string, pattern: string) => RegExpParts
    /**
     * Returns the regular expression associated with the pattern name
     * @param partName The name of the pattern
     * @return A regular expression
     */
    regex: (partName: string) => RegExp
}

/**
 * Creates a new (empty) {@link RegExpParts} object
 */
function newRegexParts(): RegExpParts {
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

const regexParts = newRegexParts()
    .add("NaturalNumberPart", /[1-9]\d*/.source)
    .add("IntegerPart", /0|[1-9]\d*/.source)
    .add("FractionalPart", /\.\d+/.source)
    .add("UnitsPart", /(fl oz)|(fluid ounce)|([a-zA-Z]+\.?)/.source)
    .add("WordPart", /[a-zA-Z]+/.source)
/* -- ingredients

in ABNF (https://matt.might.net/articles/grammars-bnf-ebnf/)

<ingredient> ::= [<item_id> <whitespace>] <amount>

white_space = *( " " / "\t" )
list_item_id = ( [ "(" ] number [ "." / ")" / ":" ] ) / ( [ "-" / "*" / "•" ])

amount = [modifier] [white_space] quantity [white_space] [unit] [ "." ]
modifier :== approx / approximately / about / "~" / around
quantity = number / fraction
unit = (cup / tsp / tbsp (.... see units in recipes ui))["."]

number = integer / decimal / (integer unicode_fraction)
integer :: = 0 / (natural_digit *digit)
decimal :: integer "." 1*digit
fraction = integer "/" natural_digit *digit
natural_digit = 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9
digit = 0 / natural_digit
unicode_fraction = \u00BC | \u00BD | \u00BE | ...
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
const Word = createToken({
    name: "IngredientText",
    pattern: regexParts.regex("{{WordPart}}")
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

/**
 * Holds the tokens used to parse the recipe. **Note** that the *order* in which these appear *matters*.
 */
export const recipeTokens = [
    WhiteSpace,
    ListItemId,
    UnicodeFraction, Fraction, Decimal, Integer,
    Unit,
    Word
]

export const recipeTokenVocabulary = recipeTokens.reduce((vocab, token) => {
    vocab[token.name] = token
    return vocab
}, {} as { [key: string]: TokenType })

const RecipeLexer = new Lexer(recipeTokens)

/**
 * Converts the input text into a lexing result that can be parsed into an AST or CST.
 * @param input The input string
 * @return The {@link ILexingResult} object holding the result of the lexing operation
 */
export function lex(input: string): ILexingResult {
    const result = RecipeLexer.tokenize(input)

    if (result.errors.length > 0) {
        console.warn(`Failed lexing with errors: ${result.errors.map(error => error.message).join(";")}`)
        // throw Error(`Failed lexing with errors: ${result.errors.map(error => error.message).join(";")}`)
    }

    return result
}

/**
 * Attempts to match [unicode fractions](https://www.compart.com/en/unicode/decomposition/%3Cfraction%3E).
 * @param text The total text to parse
 * @param startOffset The lexer's current position (offset) in the text
 * @return The match, with the payload set to the {@link Fraction} numerator and denominator; or `null`
 * if the unicode character at the current position is not a "vulgar fraction"
 */
function matchUnicodeFraction(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    // the character at the current lexer position
    const currentChar = text.charAt(startOffset)

    // when the number has an integer and a unicode fraction (e.g. 1¼ or 1 ¼), then parse them into
    // that same token. we attempt to match an integer part (plus trailing whitespace)
    const integerMatch = text.match(/0|[1-9]\d*\s*/)
    if (integerMatch !== null) {
        const integer = integerMatch[0]
        // plus 1 for the space
        const nextChar = text.charAt(startOffset + integer.length)

        const [numerator, denominator] = fractionFromUnicode(nextChar)
        if (isValidFraction([numerator, denominator])) {
            const result: CustomPatternMatcherReturn = [text.slice(startOffset, startOffset + integer.length + 1)]
            result.payload = [parseInt(currentChar.trim()) * denominator + numerator, denominator]
            return result
        }
    }

    // maybe it's just a unicode character
    const [numerator, denominator] = fractionFromUnicode(currentChar)
    if (isValidFraction([numerator, denominator])) {
        const result: CustomPatternMatcherReturn = [currentChar]
        result.payload = [numerator, denominator]
        return result
    }

    // nope, not a match
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