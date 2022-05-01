import {CstNode, CstParser, ILexingResult} from "chevrotain";
import {lex, recipeTokenVocabulary} from "./lexer/RecipeLexer";

const {ListItemId, Amount, Word, SectionHeader, IngredientsSectionHeader, StepsSectionHeader} = recipeTokenVocabulary

export enum RuleName {
    SECTIONS = "sections",

    INGREDIENTS = "ingredients",
    INGREDIENTS_SECTION = "ingredientsSection",
    INGREDIENT_ITEM = "ingredientItem",
    INGREDIENT = "ingredient",
    AMOUNT = "amount",

    STEPS = "steps",
    STEPS_SECTION = "stepsSection",
    STEP_ITEM = "stepItem",
    STEP = "step",

    LIST_ITEM_ID = "listItemId"
}
/**
 * Constructs a concrete syntax tree that holds the [ingredients] element as root. The [ingredients]
 * can have children of type [ingredient-items] or [section]. The [section] has [ingredient-item] as
 * children. The [ingredient-item] have children [ingredient-item-id], [amount], and [ingredient]. The
 * [ingredient-item-id] is an optional leaf. The [amount] has children [quantity] and [unit]. And the
 * [ingredient] holds the ingredient. ![cst-nodes](../docs/images/cst-node-types.png)
 */
export class RecipeParser extends CstParser {
    constructor() {
        // super(multiModeLexerDefinition);
        super(recipeTokenVocabulary);

        this.performSelfAnalysis()
    }

    // list of sections (i.e. ingredients, steps, etc) that match the modes of the
    // lexer. these are the elements of a recipe (i.e. story, meta, ingredients,
    // steps, notes).
    sections = this.RULE(RuleName.SECTIONS, () => {
        this.AT_LEAST_ONE({
            DEF: () => {
                this.OR([
                    {
                        GATE: () => this.LA(1).tokenType === IngredientsSectionHeader,
                        ALT: () => {
                            this.CONSUME(IngredientsSectionHeader)
                            this.SUBRULE(this.ingredients)
                        }
                    },
                    {
                        GATE: () => this.LA(1).tokenType === StepsSectionHeader,
                        ALT: () => {
                            this.CONSUME(StepsSectionHeader)
                            this.SUBRULE(this.steps)
                        }
                    }
                ])
            }
        })
    })

    // NOTE: you can also start the parser at "ingredients" or "steps" rather than at
    //       "sections"
    //
    // list of ingredients can either have a section header, or an ingredient. if it has
    // a section header, then under that section header, there could be more ingredients
    ingredients = this.RULE(RuleName.INGREDIENTS, () => {
        this.AT_LEAST_ONE({
            DEF: () => {
                this.OR([
                    {
                        GATE: () => this.LA(1).tokenType === SectionHeader,
                        ALT: () => this.SUBRULE(this.ingredientsSection)

                    },
                    {
                        ALT: () => this.SUBRULE(this.ingredientItem)
                    }
                ])
            }
        })
    })

    // list of steps can either have a section header, or a step. if it has
    // a section header, then under that section header, there could be more steps.
    steps = this.RULE(RuleName.STEPS, () => {
        this.AT_LEAST_ONE({
            DEF: () => {
                this.OR([
                    {
                        GATE: () => this.LA(1).tokenType === SectionHeader,
                        ALT: () => this.SUBRULE(this.stepsSection)
                    },
                    {
                        ALT: () => this.SUBRULE(this.stepItem)
                    }
                ])
            }
        })
    })

    // a section in the ingredient list. for example, the ingredients to make a dough, or a sauce.
    // want the section to be the parent node to the ingredients that follow, until a new section
    // header is encountered.
    ingredientsSection = this.RULE(RuleName.INGREDIENTS_SECTION, () => {
        this.CONSUME(SectionHeader)
        this.AT_LEAST_ONE({
            DEF: () => {
                this.SUBRULE(this.ingredientItem)
            }
        })
    })

    // a section in the steps list. for example, the steps to make a dough, or a sauce.
    // want the section to be the parent node to the steps that follow, until a new section
    // header is encountered.
    stepsSection = this.RULE(RuleName.STEPS_SECTION, () => {
        this.CONSUME(SectionHeader)
        this.AT_LEAST_ONE({
            DEF: () => {
                this.SUBRULE(this.stepItem)
            }
        })
    })

    // an ingredient, possibly as a numbered or bulleted list
    ingredientItem = this.RULE(RuleName.INGREDIENT_ITEM, () => {
        this.OPTION(() => {
            this.SUBRULE(this.listItemId)
        })
        this.SUBRULE(this.amount)
        this.SUBRULE(this.ingredient)
    })

    // a step, possibly as a number or bulleted list
    stepItem = this.RULE(RuleName.STEP_ITEM, () => {
        this.OPTION(() => {
            this.SUBRULE(this.listItemId)
        })
        this.SUBRULE(this.step)
    })

    // the number or bullet of the list
    listItemId = this.RULE(RuleName.LIST_ITEM_ID, () => {
        this.CONSUME(ListItemId)
    })

    // the amount (e.g. 1 cup)
    amount = this.RULE(RuleName.AMOUNT, () => {
        this.CONSUME(Amount)
    })

    // the ingredient (e.g. all-purpose flour)
    ingredient = this.RULE(RuleName.INGREDIENT, () => {
        this.AT_LEAST_ONE({
            DEF: () => {
                this.CONSUME(Word)
            }
        })
    })

    // the step instructions
    step = this.RULE(RuleName.STEP, () => {
        this.AT_LEAST_ONE({
            DEF: () => this.CONSUME(Word)
        })
    })
}

let parserInstance: RecipeParser

export type RecipeParseResult = {
    parserInstance: RecipeParser,
    cst: CstNode,
    lexingResult: ILexingResult
}

export function parse(input: string): RecipeParseResult {
    if (parserInstance === undefined) {
        parserInstance = new RecipeParser()
    } else {
        parserInstance.reset()
    }

    const lexingResult = lex(input)

    parserInstance.input = lexingResult.tokens

    // const cst = parserInstance["sections"]()
    const cst = parserInstance.sections()

    return {parserInstance, cst, lexingResult}
}
