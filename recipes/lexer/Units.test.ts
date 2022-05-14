import {pluralUnits, Unit} from "./Units";

describe("when expanding the base units", () => {
    it("should have plurals for synonyms", () => {
        expect(pluralUnits.liter.synonyms).toEqual(['litres', 'liters'])
    })
    it("should have plurals for targets", () => {
        expect(pluralUnits.liter.target).toBe(Unit.LITER)
    })
})