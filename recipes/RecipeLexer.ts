import {createToken, ILexingResult, Lexer, TokenType} from 'chevrotain'
import {baseUnits, phoneticUnits, pluralUnits, UnitInfo} from "./Units";
import {CustomPatternMatcherReturn} from "@chevrotain/types";
import {fractionFromUnicode, isValidFraction} from "./Numbers";
import {regexParts} from "./RegExpParts";


/* -- ingredients

in ABNF (https://matt.might.net/articles/grammars-bnf-ebnf/)

ingredient_item = [ingredient_item_id 1*whitespace] amount ingredient

white_space = *( " " / "\t" )
ingredient_item_id = ( [ "(" ] number [ "." / ")" / ":" ] ) / ( [ "-" / "*" / "•" ])

amount = [modifier] [white_space] quantity [white_space] [unit] [ "." ]
modifier :== approx / approximately / about / "~" / around
quantity = number / fraction
unit = (cup / tsp / tbsp (.... see units in recipes ui))["."]

ingredient = *word newline
word = 1*("w" / "." / "'" / "(" / ")" / "[" / "]" / "{" / "}" / "-")
newline = "\n" / | "\r\n"

number = integer / decimal / (integer unicode_fraction)
integer :: = 0 / (natural_digit *digit)
decimal :: integer "." 1*digit
fraction = integer "/" natural_digit *digit
natural_digit = 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9
digit = 0 / natural_digit
unicode_fraction = \u00BC | \u00BD | \u00BE | ...
 */

/*
 | NUMBERS
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

const WholeFraction = createToken({
    name: "WholeFraction",
    pattern: matchFraction,
    longer_alt: Fraction,
    line_breaks: false
})
const Quantity = createToken({
    name: "Quantity",
    pattern: matchQuantity,
    line_breaks: false,
    longer_alt: WholeFraction
})

const Unit = createToken({
    name: "Unit",
    pattern: unitMatcher,
    line_breaks: false
})

const Amount = createToken({
    name: "Amount",
    pattern: amountMatcher,
    line_breaks: false,
    longer_alt: Quantity
})

const Word = createToken({
    name: "Word",
    pattern: regexParts.regex("{{WordPart}}")
})
const WhiteSpace = createToken({
    name: "WhiteSpace",
    // pattern: /\s+/,
    pattern: regexParts.regex("{{WhiteSpace}}"),
    group: Lexer.SKIPPED
})
const NewLine = createToken({
    name: "NewLine",
    pattern: regexParts.regex("{{NewLine}}"),
    group: Lexer.SKIPPED
})
const ListItemId = createToken({
    name: "ListItemId",
    pattern: /(\(?\d+((.\))|[.):]))|[*•-]/,
    longer_alt: Decimal,
})
const SectionHeader = createToken({
    name: "SectionHeader",
    pattern: regexParts.regex("{{SectionHeader}}"),
    longer_alt: Word,
    line_breaks: true
})

/**
 * Holds the tokens used to parse the recipe. **Note** that the *order* in which these appear *matters*.
 */
export const recipeTokens = [
    // NewLine,
    SectionHeader,
    WhiteSpace,
    ListItemId,
    Amount, Quantity, WholeFraction, UnicodeFraction, Fraction, Decimal, Integer,
    Unit,
    Word
]

export const recipeTokenVocabulary = recipeTokens.reduce((vocab, token) => {
    vocab[token.name] = token
    return vocab
}, {} as { [key: string]: TokenType })


// todo see multi-mode lexing https://github.com/Chevrotain/chevrotain/blob/master/examples/lexer/multi_mode_lexer/multi_mode_lexer.js
//      so that each section have a mode

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

/*
 | MATCHING FUNCTIONS
 */

/**
 * Matches a quantity, which could be a whole number and a fraction, a whole number and a unicode
 * fraction, a fraction, a unicode fraction, an integer, or a decimal.
 * @param text The text to search
 * @param startOffset The current offset into the text
 * @return A quantity, if found, or null if not found
 */
function matchQuantity(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    const fraction = matchFraction(text, startOffset)
    if (fraction !== null) {
        return fraction
    }
    const unicode = matchUnicodeFraction(text, startOffset)
    if (unicode !== null) {
        return unicode
    }

    const number = text.slice(startOffset)
        .match(regexParts.regex("^({{IntegerPart}}{{FractionalPart}}|{{IntegerPart}})"))
    if (number !== null) {
        return [number[0]]
    }

    return null
}

/**
 * Attempts to match fractions. The fractions can be expressed whole integers plus a fractional part,
 * or an integer divided by a natural number.
 * @param text The text to parse
 * @param startOffset The current offset in the text
 * @return The result if found or null if not found. Adds a tuple to the payload that holds the overall
 * numerator and denominator. For example, if the text is "2 3/5" then the payload would be "[13, 5]"
 * which represents "13/5"
 */
function matchFraction(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    const currentText = text.slice(startOffset)
    // when the number has an integer and a fraction (e.g. 1 1/4), then parse them into
    // that same token. we attempt to match an integer part (plus trailing whitespace)
    const wholeAndFraction = currentText.match(regexParts.regex("{{IntegerPart}} {{IntegerPart}}/{{NaturalNumberPart}}"))
    if (wholeAndFraction !== null) {
        const [whole, fraction] = wholeAndFraction[0].split(' ')
        const [numerator, denominator] = fraction.split('/').map(str => parseInt(str))

        if (isValidFraction([numerator, denominator])) {
            const result: CustomPatternMatcherReturn = [wholeAndFraction[0]]
            result.payload = [parseInt(whole) * denominator + numerator, denominator]
            return result
        }
    }

    // no leading whole number, so attempt to parse the fraction
    const fraction = currentText.match(regexParts.regex("{{IntegerPart}}/{{NaturalNumberPart}}"))
    if (fraction !== null) {
        const [numerator, denominator] = fraction[0].split('/').map(str => parseInt(str))

        if (isValidFraction([numerator, denominator])) {
            const result: CustomPatternMatcherReturn = [fraction[0]]
            result.payload = [numerator, denominator]
            return result
        }

    }

    return null
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
    const currentText = text.slice(startOffset)

    // when the number has an integer and a unicode fraction (e.g. 1¼ or 1 ¼), then parse them into
    // that same token. we attempt to match an integer part (plus trailing whitespace)
    const integerMatch = currentText.match(/0|[1-9]\d*\s*/)
    if (integerMatch !== null) {
        const integer = integerMatch[0]
        // deal with possible spaces between the integer and unicode fraction
        let i = 0
        let nextChar: string
        do {
            nextChar = text.charAt(startOffset + integer.length + i)
            i++
        } while (nextChar === ' ')

        const [numerator, denominator] = fractionFromUnicode(nextChar)
        if (isValidFraction([numerator, denominator])) {
            const result: CustomPatternMatcherReturn = [text.slice(startOffset, startOffset + integer.length + i)]
            result.payload = [parseInt(integer) * denominator + numerator, denominator]
            // result.payload = [parseInt(currentChar.trim()) * denominator + numerator, denominator]
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
 * @return A pattern matching result if the text matches the unit or null if there is no match
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

/**
 * Matcher for the amount of an ingredient (quantity, unit)
 * @param text The text to search
 * @param startOffset The current location in the text
 * @return The matcher return with a payload if found; otherwise null
 */
function amountMatcher(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    const quantity = matchQuantity(text, startOffset)
    if (quantity !== null) {
        const unit = unitMatcher(text, startOffset + quantity[0].length + 1)
        if (unit !== null) {
            const result: CustomPatternMatcherReturn = [text.slice(startOffset, startOffset + quantity[0].length + unit[0].length + 1)]
            result.payload = {
                quantity: quantity.payload,
                unit: unit.payload
            }
            return result
        }
    }

    return null
}