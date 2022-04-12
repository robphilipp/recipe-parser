import {CstNode, CstParser} from "chevrotain";
import {lex, recipeTokens, recipeTokenVocabulary} from "./RecipeLexer";

/* -- ingredients

in ABNF (https://matt.might.net/articles/grammars-bnf-ebnf/)

ingredient_item = [ingredient_item_id 1*whitespace] amount ingredient

white_space = *( " " / "\t" )
ingredient_item_id = ( [ "(" ] number [ "." / ")" / ":" ] ) / ( [ "-" / "*" / "•" ])

amount = [modifier] [white_space] quantity [white_space] [unit] [ "." ]
modifier :== approx / approximately / about / "~" / around
quantity = number / fraction
unit = (cup / tsp / tbsp (.... see units in recipes ui))["."]

ingredient = *word newline
word = 1*("w" / "." / "'" / "(" / ")" / "[" / "]" / "{" / "}" / "-")
newline = "\n" / | "\r\n"

number = integer / decimal / (integer unicode_fraction)
integer :: = 0 / (natural_digit *digit)
decimal :: integer "." 1*digit
fraction = integer "/" natural_digit *digit
natural_digit = 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9
digit = 0 / natural_digit
unicode_fraction = \u00BC | \u00BD | \u00BE | ...
 */

const {Ingredient, IngredientItemId, Amount, Word} = recipeTokenVocabulary

export class RecipeParser extends CstParser {
    constructor() {
        super(recipeTokenVocabulary);

        this.performSelfAnalysis()
    }

    ingredientItem = this.RULE("ingredientItem", () => {
        this.OPTION(() => {
            this.SUBRULE(this.ingredientItemId)
        })
        this.SUBRULE(this.amount)
        this.SUBRULE(this.ingredient)
    })
    ingredientItemId = this.RULE("ingredientItemId", () => {
        this.CONSUME(IngredientItemId)
    })
    amount = this.RULE("amount", () => {
        this.CONSUME(Amount)
    })
    ingredient = this.RULE("ingredient", () => {
        // this.CONSUME(Ingredient)
        this.AT_LEAST_ONE({
            DEF: () => {
                this.CONSUME(Word)
            }
        })
    })
}

const parserInstance = new RecipeParser()

export function parse(input: string): {parserInstance: RecipeParser, cst: CstNode} {
    const lexResult = lex(input)

    parserInstance.input = lexResult.tokens

    const cst = parserInstance.ingredientItem()

    return {parserInstance, cst}
}