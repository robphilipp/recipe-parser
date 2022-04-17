import {parse, RecipeParser} from "./RecipeParser";
import {UnitType} from "./Units";
import {CstChildrenDictionary, CstElement, CstNode, IToken} from "chevrotain";
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
        const ingredients = this.visit(ctx.ingredientItem)

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
        return {quantity, unit}
    }

    ingredient(ctx: IngredientContext): string {
        return ctx.Word.map(i => i.image).join(" ")
    }
}

const toAstVisitorInstance = new RecipeCstVisitor()

export function toAst(text: string): RecipeAst {
    const {cst} = parse(text)
    return toAstVisitorInstance.visit(cst)
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
    quantity: Fraction
    unit: UnitType
}

type IngredientType = {
    ingredient: string
}