import {parse, RecipeParser} from "./RecipeParser";
import {UnitType} from "./Units";
import {CstChildrenDictionary, CstElement, CstNode, ILexingError, IToken} from "chevrotain";
import {Fraction} from "./Numbers";

// a new parser instance with the concrete syntax tree (CST) output (enabled by default)
const parserInstance = new RecipeParser()

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

// the base visitor class
const BaseRecipeVisitor = parserInstance.getBaseCstVisitorConstructor<RecipeParser, any>()

export class RecipeCstVisitor extends BaseRecipeVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    ingredients(ctx: IngredientsContext): Partial<RecipeAst> {
        // there are one or more ingredients, so we need to run through the list
        const ingredients = ctx.ingredientItem.map(cstNode => this.visit(cstNode))
        return {
            type: 'ingredients',
            ingredients
        }
    }

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
            amount, ingredient
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

const toAstVisitorInstance = new RecipeCstVisitor()

export type RecipeResult = {
    recipe: RecipeAst,
    errors: Array<ILexingError>
}

export function toRecipe(text: string): RecipeResult {
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
}

type IngredientItemIdContext = CstChildrenDictionary & {
    ingredientItemId: IToken
}

type IngredientItemContext = CstChildrenDictionary & {
    ingredientItemId: IToken
    amount: Array<CstNode>
    ingredient: Array<CstNode>
}

type AmountContext = CstChildrenDictionary & {
    Amount: Array<IToken>
}

type QuantityContext = CstChildrenDictionary & {
    quantity: Fraction
}

type UnitContext = CstChildrenDictionary & {
    unit: UnitType
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

type IngredientAst = {
    type: string
    ingredientItemId: string
    amount: AmountType
    ingredient: IngredientType
}

type IngredientItemType = {
    amount: AmountType
    ingredient: string
}

type AmountType = {
    // quantity: Fraction
    quantity: number
    unit: UnitType
}

type IngredientType = {
    ingredient: string
}