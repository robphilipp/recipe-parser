/*
 | MATCHING FUNCTIONS
 */

import {CustomPatternMatcherReturn} from "@chevrotain/types";
import {regexParts} from "./RegExpParts";
import {Fraction, fractionFromUnicode, isValidFraction} from "./Numbers";
import {baseUnits, pluralUnits, UnitInfo, Unit} from "./Units";
import pluralize from "pluralize"

/**
 * Matches a quantity, which could be a whole number and a fraction, a whole number and a unicode
 * fraction, a fraction, a unicode fraction, an integer, or a decimal.
 * @param text The text to search
 * @param startOffset The current offset into the text
 * @return A quantity, if found, or null if not found
 */
export function matchQuantity(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    const slang = matchSlangQuantities(text, startOffset)
    if (slang !== null) {
        return slang
    }
    const fraction = matchFraction(text, startOffset)
    if (fraction !== null) {
        return fraction
    }
    const unicode = matchUnicodeFraction(text, startOffset)
    if (unicode !== null) {
        return unicode
    }

    const matched = text.slice(startOffset)
        .match(regexParts.regex("^({{IntegerPart}}{{FractionalPart}}|{{IntegerPart}})"))
    if (matched !== null) {
        const result: CustomPatternMatcherReturn = [matched[0]]
        result.payload = [parseFloat(matched[0]), 1]
        return result
    }

    return null
}

// the supported slang quantities
export const slangQuantities: Array<[string, Fraction]> = [
    ['a couple', [2, 1]], ['a few', [3, 1]], ['several', [3, 1]]//, ['an', [1, 1]], ['a', [1, 1]],
]

/**
 * Matcher for slang quantities. For example, "a pinch" is 1 pinch, "a couple" is 2, "a few" is 3,
 * and "several" is also 3.
 * @param text The text to parse
 * @param startOffset The current offset in the text
 * @return The result if found or null if not found. Adds a tuple to the payload that holds the overall
 * numerator and denominator. For example, if the text is "a couple" then the payload would be `[2, 1]`
 * which represents `2`
 */
export function matchSlangQuantities(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    for (let [slang, fraction] of slangQuantities) {
        if (text.startsWith(slang, startOffset)) {
            const result: CustomPatternMatcherReturn = [slang]
            result.payload = fraction
            return result
        }
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
export function matchFraction(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    const currentText = text.slice(startOffset)
    // when the number has an integer and a fraction (e.g. 1 1/4), then parse them into
    // that same token. we attempt to match an integer part (plus trailing whitespace)
    const wholeAndFraction = currentText.match(regexParts.regex("^{{IntegerPart}} {{IntegerPart}}/{{NaturalNumberPart}}"))
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
    const fraction = currentText.match(regexParts.regex("^{{IntegerPart}}/{{NaturalNumberPart}}"))
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
export function matchUnicodeFraction(text: string, startOffset: number): CustomPatternMatcherReturn | null {
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
export function unitMatcher(text: string, startOffset: number): CustomPatternMatcherReturn | null {
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
    // const phonetics = matchingSynonym(text, startOffset, Object.entries(phoneticUnits))
    // if (phonetics !== undefined) {
    //     return phonetics
    // }

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
export function matchingSynonym(
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
export function matchingAbbreviation(
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
export function matchingUnit(
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
export function amountMatcher(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    // in case there are slang expressions such as "a pinch", "a touch", "to taste"
    const slang = matchSlangAmounts(text, startOffset)
    if (slang !== null) {
        return slang
    }

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
        } else {
            // units are empty, so we assume that this is a piece (e.g. 1 egg, 1 banana,
            // 2 apples, etc)
            const result: CustomPatternMatcherReturn = [quantity[0]]
            result.payload = {
                quantity: quantity.payload,
                unit: Unit.PIECE
            }
            return result
        }
    }

    return null
}

/**
 * Attempts to match the section header.
 * @param text The text to search
 * @param startOffset The current location in the text
 * @return The matcher return with a payload if found; otherwise null
 */
export function matchSectionIngredients(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    // if the text matches an amount, then we don't want the section to match
    if (amountMatcher(text, startOffset) !== null) return null

    return matchSection(text,startOffset)

    // const match = regexParts.regex("^#[ \t]*{{SectionHeader}}([ \t]*#)?").exec(text.slice(startOffset))
    // if (match !== null) {
    //     const result: CustomPatternMatcherReturn = [match[0]]
    //     result.payload = {
    //         header: match[0]
    //             .replace(/^#[ \t]*/, '')
    //             .replace(/[ \t]*#$/, '')
    //     }
    //     return result
    // }
    //
    // const matchLineBased = regexParts
    //     .regex("^{{NewLine}}*{{SectionHeader}}{{NewLine}}")
    //     .exec(text.slice(startOffset))
    // if (matchLineBased !== null && (isLeadingValid(text, startOffset) || startOffset === 0)) {
    //     const result: CustomPatternMatcherReturn = [matchLineBased[0]]
    //     result.payload = {
    //         header: matchLineBased[0].replace(/[\n\r]/g, '')
    //     }
    //     return result
    // }
    // return null
}

export function matchSection(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    const match = regexParts.regex("^#[ \t]*{{SectionHeader}}([ \t]*#)?").exec(text.slice(startOffset))
    if (match !== null) {
        const result: CustomPatternMatcherReturn = [match[0]]
        result.payload = {
            header: match[0]
                .replace(/^#[ \t]*/, '')
                .replace(/[ \t]*#$/, '')
        }
        return result
    }

    const matchLineBased = regexParts
        .regex("^{{NewLine}}*{{SectionHeader}}{{NewLine}}")
        .exec(text.slice(startOffset))
    if (matchLineBased !== null && (isLeadingValid(text, startOffset) || startOffset === 0)) {
        const result: CustomPatternMatcherReturn = [matchLineBased[0]]
        result.payload = {
            header: matchLineBased[0].replace(/[\n\r]/g, '')
        }
        return result
    }
    return null
}

export function matchListItemId(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    const match = /^(\(?\d+((\.\))|[.):]))|^[*•-](?:[ \t]+)/.exec(text.slice(startOffset))
    if (match !== null) {
        const result: CustomPatternMatcherReturn = [match[0]]
        result.payload = {
            id: match[0]
                .replace(/[ \t]*/g, '')
        }
        return result
    }
    return null
}

/**
 * Determines whether there are just has leading spaces or tabs after the newline
 * @param text The text to search
 * @param startOffset The current location in the text
 * @return `true` if there are just leading spaces or table after the newline
 */
export function isLeadingValid(text: string, startOffset: number): boolean {
    if (startOffset === 0) return true
    if (text.charAt(startOffset-1) === ' ' || text.charAt(startOffset-1) === '\t') {
        return isLeadingValid(text, startOffset-1)
    }
    return text.charAt(startOffset - 1) == '\n';
}

/*
 | recipe parts (sections)
 */

const ingredientSynonyms = ['ingredient list', 'ingredient']
    .flatMap(synonym => [synonym, pluralize(synonym)])

export const INGREDIENTS_HEADER = "ingredients"

/**
 * Attempts to match an ingredients' section header
 * @param text The text
 * @param startOffset The current location in the text
 * @return The pattern match result if found, or null otherwise
 */
export function matchIngredientsSection(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    const result = matchSectionIngredients(text, startOffset)
    if (result !== null && ingredientSynonyms.indexOf(result.payload.header.toLowerCase()) >= 0) {
        result.payload = {header: INGREDIENTS_HEADER}
        return result
    }
    return null
}


const stepsSynonyms = ['step', 'method', 'process', 'instruction']
    .flatMap(synonym => [synonym, pluralize(synonym)])

export const STEPS_HEADER = "steps"

/**
 * Attempts to match a steps' section header
 * @param text The text
 * @param startOffset The current location in the text
 * @return The pattern match result if found, or null otherwise
 */
export function matchStepsSection(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    const result = matchSectionIngredients(text, startOffset)
    if (result !== null && stepsSynonyms.indexOf(result.payload.header.toLowerCase()) >= 0) {
        result.payload = {header: STEPS_HEADER}
        return result
    }
    return null
}



/**
 * Slang amounts
 */
type SlangAmount = {
    slang: string
    quantity: Fraction
    unit: Unit
}
const slangAmounts: Array<SlangAmount> = [
    {slang: 'a pinch', quantity: [1, 1], unit: Unit.PINCH},
    {slang: 'a touch', quantity: [1, 1], unit: Unit.PINCH},
    {slang: 'to taste', quantity: [1, 1], unit: Unit.PINCH},
]

/**
 * Matcher for slang amounts (e.g. a pinch, a touch, etc)
 * @param text The text to search
 * @param startOffset The current location in the text
 * @return The matcher return with a payload if found; otherwise null
 */
export function matchSlangAmounts(text: string, startOffset: number): CustomPatternMatcherReturn | null {
    for (let {slang, quantity, unit} of slangAmounts) {
        if (text.startsWith(slang, startOffset)) {
            const result: CustomPatternMatcherReturn = [slang]
            result.payload = {quantity, unit}
            return result
        }
    }
    return null
}
