import {parse, RecipeParser} from "./RecipeParser";
import {Unit} from "./lexer/Units";
import {CstChildrenDictionary, CstNode, ILexingError, IToken} from "chevrotain";
import {ParseType} from "./ParseType";


/**
 * The result of the lexing, parsing, and visiting.
 */
export type ConvertResult<R extends Recipe | Array<Ingredient> | Array<Step>> = {
    result: R,
    errors: Array<ILexingError>
}

// type alias for returning the recipe
export type RecipeResult = ConvertResult<Recipe>
// type alias for returning a list of ingredients
export type IngredientsResult = ConvertResult<Array<Ingredient>>
// type alias for returning a list of steps
export type StepsResult = ConvertResult<Array<Step>>

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
     * The entry method for converting the entire recipe text into an object
     * @param context The context holding the parts of the recipe
     * @return The recipe object or a fragment of the recipe object
     */
    sections(context: SectionsContext): Recipe {
        const ingredients = context.ingredients?.flatMap(cstNode => this.visit(cstNode))
        const steps = context.steps?.flatMap(cstNode => this.visit(cstNode))
        return {
            type: 'recipe',
            ingredients,
            steps
        }
    }

    /**
     * Entry point for the ingredients
     * @param context The ingredient context that holds the ingredients and sections
     * @return A list of ingredients
     */
    ingredients(context: IngredientsContext): Array<Ingredient> {
        // there are one or more ingredients, so we need to run through the list
        const ingredients = context.ingredientItem?.map(cstNode => this.visit(cstNode)) || []
        const sections = context.ingredientsSection?.flatMap(cstNode => this.visit(cstNode)) || []
        return [...ingredients, ...sections]
    }

    /**
     * Entry point for the steps (instructions)
     * @param context The steps context that holds the steps and sections
     * @return A list of steps
     */
    steps(context: StepsContext): Array<Step> {
        // there are one or more steps, so we need to run through the list
        const steps = context.stepItem?.map(cstNode => this.visit(cstNode)) || []
        const sections = context.stepsSection?.flatMap(cstNode => this.visit(cstNode)) || []
        return [...steps, ...sections]
    }

    /**
     * Visited for the ingredients nodes. A section has a header and a list of ingredients, which are
     * visited from here.
     * @param context The ingredients section context that holds the sections and the list of
     * ingredients that belong to that section.
     * @return An array of ingredient items (list id, amount, ingredient, section, brand)
     */
    ingredientsSection(context: IngredientsSectionContext): Array<Ingredient> {
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
     * Visited for steps nodes. A section has a header and list of steps, which are visited from here.
     * @param context The steps section context that holds the steps and steps section.
     * @return An array of steps items (list id, step)
     */
    stepsSection(context: StepsSectionContext): Array<Step> {
        const title = context.SectionHeaderInStep[0].payload
        const steps = context.stepItem.map(cstNode => this.visit(cstNode))
        // when user only wants the first step to have the section header set, then de-dup it true
        if (this.deDupSections && steps.length > 0) {
            const updated = steps.map(step => ({...step, title: null}))
            updated[0].title = title.header
            return updated
        }
        return steps.map(step => ({...step, title: title.section, brand: null}))
    }

    /**
     * Called by the ingredient item visitor and the shamelessly ignored to pull out the ingredient-item's
     * list ID (i.e. 1. or 1) or * or -, etc).
     * @param context The context holding the ingredient-item's list ID, if it has one
     * @return The ingredient-item's list ID
     */
    listItemId(context: ListItemIdContext): string {
        return context.ListItemId[0].image
    }

    /**
     * Called by the step item visitor and the shamelessly ignored to pull out the ingredient-item's
     * list ID (i.e. 1. or 1) or * or -, etc).
     * @param context The context holding the ingredient-item's list ID, if it has one
     * @return The ingredient-item's list ID
     */
    stepListItemId(context: StepListItemIdContext): string {
        return context.StepListItemId[0].image
    }

    /**
     * Visited for ingredient-items
     * @param context The ingredient item context that holds the amount, ingredient, section, and brand
     * @return The ingredient item
     */
    ingredientItem(context: IngredientItemContext): Ingredient {
        const amount = this.visit(context.amount)
        const ingredient = this.visit(context.ingredient)

        return {
            amount, ingredient, section: null, brand: null
        }
    }

    /**
     * Visited for step-items
     * @param context The step item context that holds the step ID and the step (instructions)
     * @return The step item
     */
    stepItem(context: StepItemContext): Step {
        const stepListItemId = this.visit(context.stepListItemId)
        const step = this.visit(context.step)
        return {id: stepListItemId, step, title: null}
    }

    /**
     * Visited by the ingredient item for the amount, which is the quantity and unit
     * @param context The context holding the quantity and the unit
     * @return The amount
     */
    amount(context: AmountContext): Amount {
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

    /**
     * Visited by the step item for the step (instructions a as list of words).
     * @param context The context holding the list of words representing the step
     * @return The string of the concatenated words representing the strp
     */
    step(context: StepContext): string {
        return context.Step[0].image
    }
}


/*
 | SUPPORTING TYPES
 */
type SectionsContext = CstChildrenDictionary & {
    ingredients: Array<CstNode>
    steps: Array<CstNode>
}

type IngredientsContext = CstChildrenDictionary & {
    ingredientItem: Array<CstNode>
    ingredientsSection: Array<CstNode>
}

type StepsContext = CstChildrenDictionary & {
    stepItem: Array<CstNode>
    stepsSection: Array<CstNode>
}

type ListItemIdContext = CstChildrenDictionary & {
    ListItemId: Array<IToken>
}

type StepListItemIdContext = CstChildrenDictionary & {
    StepListItemId: Array<IToken>
}

type IngredientsSectionContext = CstChildrenDictionary & {
    SectionHeader: Array<IToken>
    ingredientItem: Array<CstNode>
}

type StepsSectionContext = CstChildrenDictionary & {
    SectionHeaderInStep: Array<IToken>
    stepItem: Array<CstNode>
}

type IngredientItemContext = CstChildrenDictionary & {
    ingredientItemId: IToken
    amount: Array<CstNode>
    ingredient: Array<CstNode>
}

type StepItemContext = CstChildrenDictionary & {
    stepListItemId: Array<CstNode>
    step: Array<CstNode>
}

type AmountContext = CstChildrenDictionary & {
    Amount: Array<IToken>
}

type IngredientContext = CstChildrenDictionary & {
    Word: Array<IToken>
}

type StepContext = CstChildrenDictionary & {
    stepListItemId: IToken
    Step: Array<IToken>
}

/*
 | RETURN TYPES
 */
export type Recipe = {
    type: string
    ingredients: Array<Ingredient>
    steps: Array<Step>
}

export type Ingredient = {
    amount: Amount
    ingredient: string
    section: string | null
    brand: string | null
}

export type Step = {
    id: string
    title: string | null
    step: string
}

export type Amount = {
    quantity: number
    unit: Unit
}



// singleton recipe object that can be recreated with a different configuration
let toAstVisitorInstance: RecipeCstVisitor

export type Options = {
    // The thing that the input text represents: a whole recipe, a list of ingredients,
    // or a list of steps.
    inputType?: ParseType
    // When set to `true` only sets the section of the first ingredient of each
    // section to current section.
    deDupSections?: boolean
    // When set to `true` then logs warning to the console, otherwise
    // does not log warnings. Warning and errors are reported in the returned object
    // in either case.
    logWarnings?: boolean,
    gimmeANewLexer?: boolean
    gimmeANewParser?: boolean
}

export const defaultOptions: Options = {
    inputType: ParseType.RECIPE,
    deDupSections: false,
    logWarnings: false,
    gimmeANewLexer: false,
    gimmeANewParser: false
}

/**
 * Converts the text to a list of recipe ingredients with optional sections. This is the
 * function to call to convert a test recipe into a recipe object.
 * @param text The text to convert into a recipe object
 * @param [inputType = ParseType.RECIPE] The optional input type (i.e. ingredients, steps, recipe).
 * @param [options = defaultOptions] The options used for parsing the text into a
 * recipe or recipe fragment.
 * @return A recipe result holding the recipe object and any parsing errors
 */
export function convertText(
    text: string,
    options: Options = defaultOptions
): ConvertResult<Recipe | Array<Ingredient> | Array<Step>> {
    const {
        inputType = ParseType.RECIPE,
        deDupSections = false,
        logWarnings = false,
        gimmeANewParser = false,
        gimmeANewLexer = false
    } = options

    if (toAstVisitorInstance === undefined || toAstVisitorInstance.deDupSections !== deDupSections) {
        toAstVisitorInstance = new RecipeCstVisitor(deDupSections)
    }

    const {cst, lexingResult} = parse(text, {inputType, logWarnings, gimmeANewLexer, gimmeANewParser})

    return {
        result: toAstVisitorInstance.visit(cst),
        errors: lexingResult.errors
    }
}

/**
 * Converts the text into a {@link Recipe} that holds an array of {@link Ingredient} and
 * an array of {@link Step}.
 * @param text The text to convert into a recipe object
 * @param [options = defaultOptions] The options used for parsing the text into a
 * recipe or recipe fragment.
 * @return A {@link ConvertResult<Recipe>} holding the parsed text
 * @see toIngredients
 * @see toSteps
 */
export function toRecipe(text: string, options: Options = defaultOptions): RecipeResult {
    return convertText(text, {...options, inputType: ParseType.RECIPE}) as RecipeResult
}

/**
 * Converts the text into an array of {@link Ingredient}
 * @param text The text to convert into an array of ingredients
 * @param [options = defaultOptions] The options used for parsing the text into a
 * recipe or recipe fragment.
 * @return A {@link ConvertResult<Recipe>} holding the parsed text
 * @see toRecipe
 * @see toSteps
 */
export function toIngredients(text: string, options: Options = defaultOptions): IngredientsResult {
    return convertText(text, {...options, inputType: ParseType.INGREDIENTS}) as IngredientsResult
}

/**
 * Converts the text into an array of {@link Step}.
 * @param text The text to convert into an array of steps
 * @param [options = defaultOptions] The options used for parsing the text into a
 * recipe or recipe fragment.
 * @return A {@link ConvertResult<Recipe>} holding the parsed text
 * @see toRecipe
 * @see toIngredients
 */
export function toSteps(text: string, options: Options = defaultOptions): StepsResult {
    return convertText(text, {...options, inputType: ParseType.STEPS}) as StepsResult
}
