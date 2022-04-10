import * as Natural from "natural";

export type UnitInfo = {
    abbreviations: Array<string>
    synonyms: Array<string>
    target: UnitType
}

export enum UnitType {
    MILLIGRAM = 'mg', GRAM = 'g', KILOGRAM = 'kg',
    OUNCE = 'oz', POUND = 'lb',
    MILLILITER = 'ml', LITER = 'l', TEASPOON = 'tsp', TABLESPOON = 'tbsp', FLUID_OUNCE = 'fl oz',
    CUP = 'cup', PINT = 'pt', QUART = 'qt', GALLON = 'gal',
    PIECE = 'piece', PINCH = 'pinch'
}

type Units = { [key: string]: UnitInfo }

export const baseUnits: Units = {
    /*
     | mass
     */
    milligram: {
        abbreviations: ['mg'],
        synonyms: ['milligram'],
        target: UnitType.MILLIGRAM
    },
    gram: {
        abbreviations: ['g'],
        synonyms: ['gram'],
        target: UnitType.GRAM
    },
    kilogram: {
        abbreviations: ['kg'],
        synonyms: ['kilo', 'kilogram'],
        target: UnitType.KILOGRAM
    },
    /*
     | weight
     */
    ounce: {
        abbreviations: ['oz'],
        synonyms: ['ounce'],
        target: UnitType.OUNCE
    },
    pound: {
        abbreviations: ['lb'],
        synonyms: ['pound'],
        target: UnitType.POUND
    },
    /*
     | volume
     */
    milliliter: {
        abbreviations: ['ml'],
        synonyms: ['milliliter'],
        target: UnitType.MILLILITER
    },
    liter: {
        abbreviations: ['l'],
        synonyms: ['litre', 'liter'],
        target: UnitType.LITER
    },
    teaspoon: {
        abbreviations: ['tsp', 'tspn'],
        synonyms: ['teaspoon'],
        target: UnitType.TEASPOON
    },
    tablespoon: {
        abbreviations: ['tbsp', 'tbspn'],
        synonyms: ['tablespoon'],
        target: UnitType.TABLESPOON
    },
    fluid_ounce: {
        abbreviations: ['floz', 'fl oz'],
        synonyms: ['fluid ounce'],
        target: UnitType.FLUID_OUNCE
    },
    cup: {
        abbreviations: ['cp'],
        synonyms: ['cup'],
        target: UnitType.CUP
    },
    pint: {
        abbreviations: ['pt'],
        synonyms: ['pint'],
        target: UnitType.PINT
    },
    quart: {
        abbreviations: ['qt'],
        synonyms: ['quart'],
        target: UnitType.QUART
    },
    gallon: {
        abbreviations: ['gl', 'gal'],
        synonyms: ['gallon'],
        target: UnitType.GALLON
    },
    /*
     | misc
     */
    piece: {
        abbreviations: ['pce', 'pkg'],
        synonyms: ['piece', 'package'],
        target: UnitType.PIECE
    },
    pinch: {
        abbreviations: ['pnch', 'tch'],
        synonyms: ['pinch', 'touch'],
        target: UnitType.PINCH
    }
}

const inflector = new Natural.NounInflector()
const phonetics = Natural.DoubleMetaphone

// for each of the synonyms, add its plural form
export const pluralUnits: Units = Object.entries(baseUnits).reduce((obj, [name, info]) => ({
        ...obj,
        [name]: {
            abbreviations: info.abbreviations.map(abbr => inflector.pluralize(abbr)),
            synonyms: info.synonyms.map(syn => inflector.pluralize(syn)),
            target: info.target
        }
    }),
    {} as Units
)

export const phoneticUnits: Units = Object.entries(baseUnits).reduce((obj, [name, info]) => ({
        ...obj,
        [name]: {
            abbreviations: info.abbreviations,
            synonyms: info.synonyms.map(syn => phonetics.process(syn)[0].toLocaleLowerCase()),
            target: info.target
        }
    }),
    {} as Units
)