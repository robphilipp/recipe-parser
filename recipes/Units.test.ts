import {enrichedUnits, UnitType} from "./Units";

describe("when expanding the base units", () => {
    it("should add plurals", () => {
        expect(enrichedUnits.liter.synonyms).toEqual(['l', 'ls', 'litre', 'litres', 'liter', 'liters'])
        expect(enrichedUnits.liter.target).toBe(UnitType.LITER)
    })
})