import * as Natural from "natural";

type UnitInfo = {
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
        synonyms: ['mg', 'milligram'],
        target: UnitType.MILLIGRAM
    },
    gram: {
        synonyms: ['g', 'gram'],
        target: UnitType.GRAM
    },
    kilogram: {
        synonyms: ['kg', 'kilo', 'kilogram'],
        target: UnitType.KILOGRAM
    },
    /*
     | weight
     */
    ounce: {
        synonyms: ['oz', 'ounce'],
        target: UnitType.OUNCE
    },
    pound: {
        synonyms: ['lb', 'pound'],
        target: UnitType.POUND
    },
    /*
     | volume
     */
    milliliter: {
        synonyms: ['ml', 'milliliter'],
        target: UnitType.MILLILITER
    },
    liter: {
        synonyms: ['l', 'litre', 'liter'],
        target: UnitType.LITER
    },
    teaspoon: {
        synonyms: ['tsp', 'tspn', 'teaspoon'],
        target: UnitType.TEASPOON
    },
    tablespoon: {
        synonyms: ['tbsp', 'tbspn', 'tablespoon'],
        target: UnitType.TABLESPOON
    },
    fluid_ounce: {
        synonyms: ['floz', 'fl oz', 'fluid ounce'],
        target: UnitType.FLUID_OUNCE
    },
    cup: {
        synonyms: ['cp', 'cup'],
        target: UnitType.CUP
    },
    pint: {
        synonyms: ['pt', 'pint'],
        target: UnitType.PINT
    },
    quart: {
        synonyms: ['qt', 'quart'],
        target: UnitType.QUART
    },
    gallon: {
        synonyms: ['gl', 'gal', 'gallon'],
        target: UnitType.GALLON
    },
    /*
     | misc
     */
    piece: {
        synonyms: ['pce', 'piece', 'pkg', 'package'],
        target: UnitType.PIECE
    },
    pinch: {
        synonyms: ['pnch', 'pinch'],
        target: UnitType.PINCH
    }
}

// const stemmer = Natural.PorterStemmer
const inflector = new Natural.NounInflector()

// for each of the synonyms, add its plural form
export const enrichedUnits: Units = Object.entries(baseUnits).reduce((obj, [name, info]) => {
    const synonyms: Array<string> = info.synonyms.reduce(
        (expanded, synonym) => [
            ...expanded,
            synonym,
            inflector.pluralize(synonym),
        ], new Array<string>()
    )
    return {...obj, [name]: {synonyms, target: info.target}}
}, {} as Units)
