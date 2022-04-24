import {RecipeParser, RecipeParseResult} from "./RecipeParser";
import {UnitType} from "./Units";
import {CstChildrenDictionary, CstNode, ILexingError, IToken} from "chevrotain";
import {lex} from "./RecipeLexer";

type Amount = {
    value: number
    unit: UnitType
}

type Ingredient = {
    id: string
    section: string | null
    name: string
    brand: string | null
    amount: Amount
}

/**
 * The result of the lexing, parsing, and visiting.
 */
export type RecipeResult = {
    recipe: RecipeAst,
    errors: Array<ILexingError>
}

// a new parser instance that will hold the concrete syntax tree (CST) output (enabled by default)
// when the parsing is complete
const parserInstance = new RecipeParser()
// the base visitor class used to convert the CST into the RecipeResult object
const BaseRecipeVisitor = parserInstance.getBaseCstVisitorConstructor<RecipeParser, any>()

/**
 * The visitor that constructs the
 */
export class RecipeCstVisitor extends BaseRecipeVisitor {

    /**
     * @param deDupSections When `true`, then only the first ingredient in each section will have
     * the section property set and the remaining ingredients will have null. When `false` each
     * ingredient will have the section field set to the current section (or null if not part of
     * a section)
     * @constructor
     */
    constructor(deDupSections: boolean = false) {
        super()
        this.validateVisitor()

        this.deDupSections = deDupSections
    }

    // whether only the first ingredient will have the current section property set
    readonly deDupSections

    /**
     * Entry point for the ingredients
     * @param context The ingredient context that holds the ingredients and sections
     * @return The recipe object
     */
    ingredients(context: IngredientsContext): RecipeAst {
        // there are one or more ingredients, so we need to run through the list
        const ingredients = context.ingredientItem?.map(cstNode => this.visit(cstNode)) || []
        const sections = context.section?.flatMap(cstNode => this.visit(cstNode)) || []
        return {
            type: 'ingredients',
            ingredients: [...ingredients, ...sections]
        }
    }

    /**
     * Visited for the section nodes. A section has a header and a list of ingredients, which are
     * visited from here.
     * @param context The section context that holds the sections and the list of ingredients that
     * belong to that section.
     * @return An array of ingredient items (list id, amount, ingredient, section, brand)
     */
    section(context: SectionContext): Array<IngredientItemType> {
        const section = context.SectionHeader[0].payload
        const ingredients = context.ingredientItem.map(cstNode => this.visit(cstNode))
        // when user only wants the first ingredient to have the section header set, then de-dup it true
        if (this.deDupSections && ingredients.length > 0) {
            const updated = ingredients.map(ingredient => ({...ingredient, section: null, brand: null}))
            updated[0].section = section.header
            return updated
        }
        return ingredients.map(ingredient => ({...ingredient, section: section.header, brand: null}))
    }

    /**
     * Called by the ingredient item visitor and the shamelessly ignored to pull out the ingredient-item's
     * list ID (i.e. 1. or 1) or * or -, etc).
     * @param context The context holding the ingredient-item's list ID, if it has one
     * @return The ingredient-item's list ID
     */
    // noinspection JSUnusedGlobalSymbols
    ingredientItemId(context: IngredientItemIdContext): { ingredientItemId: string } {
        const ingredientItemId = context.ingredientItemId.image
        return {
            ingredientItemId
        }
    }

    /**
     * Visited for ingredient-items
     * @param context The ingredient item context that holds the amount, ingredient, section, and brand
     * @return The ingredient item
     */
    ingredientItem(context: IngredientItemContext): IngredientItemType {
        const amount = this.visit(context.amount)
        const ingredient = this.visit(context.ingredient)

        return {
            amount, ingredient, section: null, brand: null
        }
    }

    /**
     * Visited by the ingredient item for the amount, which is the quantity and unit
     * @param context The context holding the quantity and the unit
     * @return The amount
     */
    amount(context: AmountContext): AmountType {
        const {quantity, unit} = context.Amount[0].payload
        const [numerator, denominator] = quantity
        return {quantity: numerator / denominator, unit}
    }

    /**
     * Visited by the ingredient item for the ingredient (as list of words).
     * @param context The context holding the list of words representing the ingredient
     * @return The string of the concatenated words representing the ingredient
     */
    ingredient(context: IngredientContext): string {
        return context.Word.map(i => i.image).join(" ")
    }
}

// singleton recipe object that can be recreated with a different configuration
let toAstVisitorInstance: RecipeCstVisitor

/**
 * Converts the text to a list of recipe ingredients with optional sections.
 * @param text The text to convert into a recipe object
 * @param deDupSections When set to `true` only sets the section of the first ingredient of each
 * section to current section.
 * @return A recipe result holding the recipe object and any parsing errors
 */
export function toRecipe(text: string, deDupSections: boolean = false): RecipeResult {
    if (toAstVisitorInstance === undefined || toAstVisitorInstance.deDupSections !== deDupSections) {
        toAstVisitorInstance = new RecipeCstVisitor(deDupSections)
    }

    function parse(input: string): RecipeParseResult {
        if (parserInstance !== undefined) {
            parserInstance.reset()
        }
        if (parserInstance === null) throw Error("Parser instance is null")

        const lexingResult = lex(input)

        parserInstance.input = lexingResult.tokens

        const cst = parserInstance.ingredients()

        return {parserInstance, cst, lexingResult}
    }

    const {cst, lexingResult} = parse(text)

    return {
        recipe: toAstVisitorInstance.visit(cst),
        errors: lexingResult.errors
    }
}

/*
 | SUPPORTING TYPES
 */
type IngredientsContext = CstChildrenDictionary & {
    ingredientItem: Array<CstNode>
    section: Array<CstNode>
}

type IngredientItemIdContext = CstChildrenDictionary & {
    ingredientItemId: IToken
}

type SectionContext = CstChildrenDictionary & {
    SectionHeader: Array<IToken>
    ingredientItem: Array<CstNode>
}

type IngredientItemContext = CstChildrenDictionary & {
    ingredientItemId: IToken
    amount: Array<CstNode>
    ingredient: Array<CstNode>
}

type AmountContext = CstChildrenDictionary & {
    Amount: Array<IToken>
}

type IngredientContext = CstChildrenDictionary & {
    Word: Array<IToken>
}

/*
 | RETURN TYPES
 */
type RecipeAst = {
    type: string
    ingredients: Array<Ingredient>
}

type IngredientItemType = {
    amount: AmountType
    ingredient: string
    section: string | null
    brand: string | null
}

type AmountType = {
    quantity: number
    unit: UnitType
}
