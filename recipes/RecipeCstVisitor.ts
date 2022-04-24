import {parse, RecipeParser, RecipeParseResult} from "./RecipeParser";
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

// a new parser instance with the concrete syntax tree (CST) output (enabled by default)
const parserInstance = new RecipeParser()

export type RecipeResult = {
    recipe: RecipeAst,
    errors: Array<ILexingError>
}

// the base visitor class
const BaseRecipeVisitor = parserInstance.getBaseCstVisitorConstructor<RecipeParser, any>()

/**
 * The visitor that constructs the
 */
export class RecipeCstVisitor extends BaseRecipeVisitor {
    constructor(deDupSections: boolean = false) {
        super()
        this.validateVisitor()

        this.deDupSections = deDupSections
    }

    deDupSections = false

    ingredients(ctx: IngredientsContext): Partial<RecipeAst> {
        // there are one or more ingredients, so we need to run through the list
        const ingredients = ctx.ingredientItem?.map(cstNode => this.visit(cstNode)) || []
        const sections = ctx.section?.flatMap(cstNode => this.visit(cstNode)) || []
        return {
            type: 'ingredients',
            ingredients: [...ingredients, ...sections]
        }
    }

    section(ctx: SectionContext): Array<IngredientItemType> {
        const section = ctx.SectionHeader[0].payload
        const ingredients = ctx.ingredientItem.map(cstNode => this.visit(cstNode))
        // when user only wants the first ingredient to have the section header set, then de-dup it true
        if (this.deDupSections && ingredients.length > 0) {
            const updated = ingredients.map(ingredient => ({...ingredient, section: null, brand: null}))
            updated[0].section = section.header
            return updated
        }
        return ingredients.map(ingredient => ({...ingredient, section: section.header, brand: null}))
    }

    // noinspection JSUnusedGlobalSymbols
    ingredientItemId(ctx: IngredientItemIdContext): { ingredientItemId: string } {
        const ingredientItemId = ctx.ingredientItemId.image
        return {
            ingredientItemId
        }
    }

    ingredientItem(ctx: IngredientItemContext): IngredientItemType {
        const amount = this.visit(ctx.amount)
        const ingredient = this.visit(ctx.ingredient)

        return {
            amount, ingredient, section: null, brand: null
        }
    }

    amount(ctx: AmountContext): AmountType {
        const {quantity, unit} = ctx.Amount[0].payload
        const [numerator, denominator] = quantity
        return {quantity: numerator / denominator, unit}
    }

    ingredient(ctx: IngredientContext): string {
        return ctx.Word.map(i => i.image).join(" ")
    }
}
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
