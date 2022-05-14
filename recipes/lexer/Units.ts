import * as Natural from "natural";

export type UnitInfo = {
    abbreviations: Array<string>
    synonyms: Array<string>
    target: Unit
}

export enum Unit {
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
        target: Unit.MILLIGRAM
    },
    gram: {
        abbreviations: ['g'],
        synonyms: ['gram'],
        target: Unit.GRAM
    },
    kilogram: {
        abbreviations: ['kg'],
        synonyms: ['kilo', 'kilogram'],
        target: Unit.KILOGRAM
    },
    /*
     | weight
     */
    ounce: {
        abbreviations: ['oz'],
        synonyms: ['ounce'],
        target: Unit.OUNCE
    },
    pound: {
        abbreviations: ['lb'],
        synonyms: ['pound'],
        target: Unit.POUND
    },
    /*
     | volume
     */
    milliliter: {
        abbreviations: ['ml'],
        synonyms: ['milliliter'],
        target: Unit.MILLILITER
    },
    liter: {
        abbreviations: ['l'],
        synonyms: ['litre', 'liter'],
        target: Unit.LITER
    },
    teaspoon: {
        abbreviations: ['tsp', 'tspn'],
        synonyms: ['teaspoon'],
        target: Unit.TEASPOON
    },
    tablespoon: {
        abbreviations: ['tbsp', 'tbspn'],
        synonyms: ['tablespoon'],
        target: Unit.TABLESPOON
    },
    fluid_ounce: {
        abbreviations: ['floz', 'fl oz'],
        synonyms: ['fluid ounce'],
        target: Unit.FLUID_OUNCE
    },
    cup: {
        abbreviations: ['cp'],
        synonyms: ['cup'],
        target: Unit.CUP
    },
    pint: {
        abbreviations: ['pt'],
        synonyms: ['pint'],
        target: Unit.PINT
    },
    quart: {
        abbreviations: ['qt'],
        synonyms: ['quart'],
        target: Unit.QUART
    },
    gallon: {
        abbreviations: ['gl', 'gal'],
        synonyms: ['gallon'],
        target: Unit.GALLON
    },
    /*
     | misc
     */
    piece: {
        abbreviations: ['pce', 'pkg'],
        synonyms: ['piece', 'package'],
        target: Unit.PIECE
    },
    pinch: {
        abbreviations: ['pnch', 'tch'],
        synonyms: ['pinch', 'touch'],
        target: Unit.PINCH
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