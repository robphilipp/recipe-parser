import {asDecimal, fractionFromUnicode, invalidFraction, isValidFraction} from "./Numbers";

describe("when working with unicode fractions", () => {
    it("should be able to find fraction for 1/10 unicode fractions", () => {
        expect(fractionFromUnicode('⅒')).toEqual([1, 10])
        expect(fractionFromUnicode('\u2152')).toEqual([1, 10])
    })
    it("should be able to find fraction for 1/9 unicode fractions", () => {
        expect(fractionFromUnicode('⅑')).toEqual([1, 9])
        expect(fractionFromUnicode('\u2151')).toEqual([1, 9])
    })
    it("should be able to find fraction for 1/8 unicode fractions", () => {
        expect(fractionFromUnicode('⅛')).toEqual([1, 8])
        expect(fractionFromUnicode('\u215B')).toEqual([1, 8])
    })
    it("should be able to find fraction for 1/7 unicode fractions", () => {
        expect(fractionFromUnicode('⅐')).toEqual([1, 7])
        expect(fractionFromUnicode('\u2150')).toEqual([1, 7])
    })
    it("should be able to find fraction for 1/6 unicode fractions", () => {
        expect(fractionFromUnicode('⅙')).toEqual([1, 6])
        expect(fractionFromUnicode('\u2159')).toEqual([1, 6])
    })
    it("should be able to find fraction for 1/5 unicode fractions", () => {
        expect(fractionFromUnicode('⅕')).toEqual([1, 5])
        expect(fractionFromUnicode('\u2155')).toEqual([1, 5])
    })
    it("should be able to find fraction for 1/4 unicode fractions", () => {
        expect(fractionFromUnicode('¼')).toEqual([1, 4])
        expect(fractionFromUnicode('\u00BC')).toEqual([1, 4])
    })
    it("should be able to find fraction for 1/3 unicode fractions", () => {
        expect(fractionFromUnicode('⅓')).toEqual([1, 3])
        expect(fractionFromUnicode('\u2153')).toEqual([1, 3])
    })
    it("should be able to find fraction for 3/8 unicode fractions", () => {
        expect(fractionFromUnicode('⅜')).toEqual([3, 8])
        expect(fractionFromUnicode('\u215C')).toEqual([3, 8])
    })
    it("should be able to find fraction for 2/5 unicode fractions", () => {
        expect(fractionFromUnicode('⅖')).toEqual([2, 5])
        expect(fractionFromUnicode('\u2156')).toEqual([2, 5])
    })
    it("should be able to find fraction for 1/2 unicode fractions", () => {
        expect(fractionFromUnicode('½')).toEqual([1, 2])
        expect(fractionFromUnicode('\u00BD')).toEqual([1, 2])
    })
    it("should be able to find fraction for 3/5 unicode fractions", () => {
        expect(fractionFromUnicode('⅗')).toEqual([3, 5])
        expect(fractionFromUnicode('\u2157')).toEqual([3, 5])
    })
    it("should be able to find fraction for 2/3 unicode fractions", () => {
        expect(fractionFromUnicode('⅔')).toEqual([2, 3])
        expect(fractionFromUnicode('\u2154')).toEqual([2, 3])
    })
    it("should be able to find fraction for 5/8 unicode fractions", () => {
        expect(fractionFromUnicode('⅝')).toEqual([5, 8])
        expect(fractionFromUnicode('\u215D')).toEqual([5, 8])
    })
    it("should be able to find fraction for 3/4 unicode fractions", () => {
        expect(fractionFromUnicode('¾')).toEqual([3, 4])
        expect(fractionFromUnicode('\u00BE')).toEqual([3, 4])
    })
    it("should be able to find fraction for 4/5 unicode fractions", () => {
        expect(fractionFromUnicode('⅘')).toEqual([4, 5])
        expect(fractionFromUnicode('\u2158')).toEqual([4, 5])
    })
    it("should be able to find fraction for 5/6 unicode fractions", () => {
        expect(fractionFromUnicode('⅚')).toEqual([5, 6])
        expect(fractionFromUnicode('\u215A')).toEqual([5, 6])
    })
    it("should be able to find fraction for 7/8 unicode fractions", () => {
        expect(fractionFromUnicode('⅞')).toEqual([7, 8])
        expect(fractionFromUnicode('\u215E')).toEqual([7, 8])
    })
    it("should be able to find fraction for 7/8 unicode fractions", () => {
        expect(fractionFromUnicode('⅞')).toEqual([7, 8])
        expect(fractionFromUnicode('\u215E')).toEqual([7, 8])
    })
    it("should return an invalid-fraction tuple when the unicode is not a fraction", () => {
        expect(fractionFromUnicode('\u2463')).toEqual(invalidFraction())
    })
    it("should return true when unicode a fraction", () => {
        expect(isValidFraction(fractionFromUnicode('\u215E'))).toBeTruthy()
    })
    it("should return false when unicode a fraction", () => {
        expect(isValidFraction(fractionFromUnicode('\u2463'))).toBeFalsy()
    })
})

describe("when converting (numerator, denominator)", () => {
    it("should be able to convert valid tuple into a fraction", () => {
        expect(asDecimal([1, 2])).toBe(0.5)
        expect(asDecimal([1, 9])).toBeCloseTo(1/9)
    })

    it("should be able to convert invalid tuple into a fraction", () => {
        expect(asDecimal([NaN, NaN])).toBeNaN()
    })
})