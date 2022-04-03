export type Fraction = [numerator: number, denominator: number]

/**
 * For the limited set of unicode fractions, returns a (numerator, denominator) tuple.
 * @param unicode The unicode character
 * @return a (numerator, denominator) tuple associated with the unicode fraction, or a (NaN, NaN) tuple
 * if not found.
 * @see invalidFraction
 * @see isValidFraction
 * @see asDecimal
 */
export function fractionFromUnicode(unicode: string): Fraction {
    switch (unicode) {
        case '⅒':
            return [1, 10]

        case '⅑':
            return [1, 9]

        case '⅛':
            return [1, 8]

        case '⅐':
            return [1, 7]

        case '⅙':
            return [1, 6]

        case '⅕':
            return [1, 5]

        case '¼':
            return [1, 4]

        case '⅓':
            return [1, 3]

        case '⅜':
            return [3, 8]

        case '⅖':
            return [2, 5]

        case '½':
            return [1, 2]

        case '⅗':
            return [3, 5]

        case '⅔':
            return [2, 3]

        case '⅝':
            return [5, 8]

        case '¾':
            return [3, 4]

        case '⅘':
            return [4, 5]

        case '⅚':
            return [5, 6]

        case '⅞':
            return [7, 8]

        default:
            return invalidFraction()
    }
}

/**
 * @return A tuple that represents an invalid fraction
 * @see isValidFraction
 */
export function invalidFraction(): Fraction {
    return [NaN, NaN]
}

/**
 * @param tuple The fraction tuple to test
 * @return `true` if the tuple represents a valid fraction; `false` if the tuple does not
 * represent a valid fraction
 * @see invalidFraction
 */
export function isValidFraction(tuple: Fraction): boolean {
    const [numerator, denominator] = tuple
    return !isNaN(numerator) && !isNaN(denominator)
}

/**
 * @param tuple The fraction tuple to convert to a decimal representation
 * @return A decimal representation of the fraction tuple, when the tuple is a valid representation
 * of a fraction; `NaN` when the fraction tuple is not a valid representation of a fraction
 * @see isValidFraction
 */
export function asDecimal(tuple: Fraction): number {
    if (isValidFraction(tuple)) {
        return tuple[0] / tuple[1]
    }
    return NaN
}

