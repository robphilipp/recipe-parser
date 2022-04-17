import {pluralUnits, UnitType} from "./Units";

describe("when expanding the base units", () => {
    it("should add plurals", () => {
        expect(pluralUnits.liter.synonyms).toEqual(['litres', 'liters'])
        expect(pluralUnits.liter.target).toBe(UnitType.LITER)
    })
})