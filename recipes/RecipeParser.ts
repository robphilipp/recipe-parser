import {CstNode, CstParser, ILexingResult} from "chevrotain";
import {lex, recipeTokenVocabulary} from "./RecipeLexer";

const {IngredientItemId, Amount, Word, SectionHeader} = recipeTokenVocabulary

/**
 * Constructs a concrete syntax tree that holds the [ingredients] element as root. The [ingredients]
 * can have children of type [ingredient-items] or [section]. The [section] has [ingredient-item] as
 * children. The [ingredient-item] have children [ingredient-item-id], [amount], and [ingredient]. The
 * [ingredient-item-id] is an optional leaf. The [amount] has children [quantity] and [unit]. And the
 * [ingredient] holds the ingredient. ![cst-nodes](../docs/images/cst-node-types.png)
 */
export class RecipeParser extends CstParser {
    constructor() {
        super(recipeTokenVocabulary);

        this.performSelfAnalysis()
    }

    // list of ingredients can either have a section header, or an ingredient. if it has
    // a section header, then under that section header, there could be more ingredients
    ingredients = this.RULE("ingredients", () => {
        this.AT_LEAST_ONE({
            DEF: () => {
                this.OR([
                    {
                        GATE: () => this.LA(1).tokenType === SectionHeader, ALT: () => {
                            this.SUBRULE(this.section)
                        }
                    },
                    {ALT: () => this.SUBRULE(this.ingredientItem)}
                ])
            }
        })
    })
    // a section in the ingredient list. for example, the ingredients to make a dough, or a sauce.
    // want the section to be the parent node to the ingredients that follow, until a new section
    // header is encountered.
    section = this.RULE("section", () => {
        this.CONSUME(SectionHeader)
        this.AT_LEAST_ONE({
            DEF: () => {
                this.SUBRULE(this.ingredientItem)
            }
        })
    })
    // an ingredient, possibly as a numbered or bulleted list
    ingredientItem = this.RULE("ingredientItem", () => {
        this.OPTION(() => {
            this.SUBRULE(this.ingredientItemId)
        })
        this.SUBRULE(this.amount)
        this.SUBRULE(this.ingredient)
    })
    // the number or bullet of the list
    ingredientItemId = this.RULE("ingredientItemId", () => {
        this.CONSUME(IngredientItemId)
    })
    // the amount (e.g. 1 cup)
    amount = this.RULE("amount", () => {
        this.CONSUME(Amount)
    })
    // the ingredient (e.g. all-purpose flour)
    ingredient = this.RULE("ingredient", () => {
        this.AT_LEAST_ONE({
            DEF: () => {
                this.CONSUME(Word)
            }
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

    const cst = parserInstance.ingredients()

    return {parserInstance, cst, lexingResult}
}
