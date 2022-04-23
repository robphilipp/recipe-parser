import {CstNode, CstParser, ILexingResult} from "chevrotain";
import {lex, recipeTokenVocabulary} from "./RecipeLexer";

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

const parserInstance = new RecipeParser()

export type RecipeParseResult = {
    parserInstance: RecipeParser,
    cst: CstNode,
    lexingResult: ILexingResult
}

export function parse(input: string): RecipeParseResult {
    const lexingResult = lex(input)

    parserInstance.input = lexingResult.tokens

    const cst = parserInstance.ingredients()

    return {parserInstance, cst, lexingResult}
}

// import {CstNode, CstParser, ILexingResult} from "chevrotain";
// import {lex, recipeTokenVocabulary} from "./RecipeLexer";
//
// /* -- ingredients
//
// in ABNF (https://matt.might.net/articles/grammars-bnf-ebnf/)
//
// ingredient_item = [ingredient_item_id 1*whitespace] amount ingredient
//
// white_space = *( " " / "\t" )
// ingredient_item_id = ( [ "(" ] number [ "." / ")" / ":" ] ) / ( [ "-" / "*" / "•" ])
//
// amount = [modifier] [white_space] quantity [white_space] [unit] [ "." ]
// modifier :== approx / approximately / about / "~" / around
// quantity = number / fraction
// unit = (cup / tsp / tbsp (.... see units in recipes ui))["."]
//
// ingredient = *word newline
// word = 1*("w" / "." / "'" / "(" / ")" / "[" / "]" / "{" / "}" / "-")
// newline = "\n" / | "\r\n"
//
// number = integer / decimal / (integer unicode_fraction)
// integer :: = 0 / (natural_digit *digit)
// decimal :: integer "." 1*digit
// fraction = integer "/" natural_digit *digit
// natural_digit = 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9
// digit = 0 / natural_digit
// unicode_fraction = \u00BC | \u00BD | \u00BE | ...
//  */
//
// const {IngredientItemId, Amount, Word, SectionHeader, NewLine} = recipeTokenVocabulary
//
// /**
//  * Constructs a concrete syntax tree that holds the [ingredients] element as root. The [ingredients]
//  * can have children of type [ingredient-items] or [section]. The [section] has [ingredient-item] as
//  * children. The [ingredient-item] have children [ingredient-item-id], [amount], and [ingredient]. The
//  * [ingredient-item-id] is an optional leaf. The [amount] has children [quantity] and [unit]. And the
//  * [ingredient] holds the ingredient. ![cst-nodes](../docs/images/cst-node-types.png)
//  */
// export class RecipeParser extends CstParser {
//     constructor() {
//         super(recipeTokenVocabulary);
//
//         this.performSelfAnalysis()
//     }
//
//     // list of ingredients can either have a section header, or an ingredient. if it has
//     // a section header, then under that section header, there could be more ingredients
//     ingredients = this.RULE("ingredients", () => {
//         this.AT_LEAST_ONE({
//             DEF: () => {
//                 this.OR([
//                     {
//                         GATE: () => {
//                             return this.LA(1).tokenType === NewLine &&
//                                 this.LA(2).tokenType !== Amount
//                             // this.LA(2).tokenType === Word &&
//                             // this.LA(3).tokenType === NewLine
//                         },
//                         ALT: () => {
//                             this.SUBRULE(this.section)
//                         }
//                     },
//                     {
//                         GATE: () => this.LA(1).tokenType === SectionHeader,
//                         ALT: () => {
//                             this.SUBRULE2(this.section)
//                         }
//                     },
//                     {
//                         ALT: () => {
//                             this.SUBRULE(this.ingredientItem)
//                         }
//                     }
//                 ])
//             }
//         })
//     })
//     // a section in the ingredient list. for example, the ingredients to make a dough, or a sauce.
//     // want the section to be the parent node to the ingredients that follow, until a new section
//     // header is encountered.
//     section = this.RULE("section", () => {
//         this.OR([
//             {
//                 ALT: () => {
//                     this.OPTION(() => {
//                         this.CONSUME5(NewLine)
//                     })
//                     this.CONSUME(SectionHeader)
//                     this.AT_LEAST_ONE({
//                         DEF: () => {
//                             this.CONSUME(NewLine)
//                             this.SUBRULE(this.ingredientItem)
//                             // this.CONSUME(NewLine)
//                         }
//                     })
//                     // this.OPTION(() => {
//                     //     this.CONSUME2(NewLine)
//                     // })
//                 }
//             },
//             {
//                 ALT: () => {
//                     this.CONSUME3(NewLine)
//                     this.AT_LEAST_ONE2({
//                         DEF: () => {
//                             this.CONSUME(Word)
//                         }
//                     })
//                     this.CONSUME4(NewLine)
//                     this.AT_LEAST_ONE3({
//                         DEF: () => {
//                             this.SUBRULE3(this.ingredientItem)
//                             // this.CONSUME4(NewLine)
//                         }
//                     })
//                     // this.OPTION(() => {
//                     //     this.CONSUME5(NewLine)
//                     // })
//                 }
//             },
//         ])
//     })
//     // section = this.RULE("section", () => {
//     //     this.CONSUME(SectionHeader)
//     //     this.AT_LEAST_ONE({
//     //         DEF: () => {
//     //             this.SUBRULE(this.ingredientItem)
//     //         }
//     //     })
//     // })
//     // an ingredient, possibly as a numbered or bulleted list
//     ingredientItem = this.RULE("ingredientItem", () => {
//         this.OPTION(() => {
//             this.CONSUME(NewLine)
//         })
//         this.OPTION2(() => {
//             this.SUBRULE(this.ingredientItemId)
//         })
//         this.SUBRULE(this.amount)
//         this.SUBRULE(this.ingredient)
//     })
//
//     // the number or bullet of the list
//     ingredientItemId = this.RULE("ingredientItemId", () => {
//         this.CONSUME(IngredientItemId)
//     })
//     // the amount (e.g. 1 cup)
//     amount = this.RULE("amount", () => {
//         this.CONSUME(Amount)
//     })
//     // the ingredient (e.g. all-purpose flour)
//     ingredient = this.RULE("ingredient", () => {
//         this.AT_LEAST_ONE({
//             DEF: () => {
//                 this.CONSUME(Word)
//             }
//         })
//     })
//     // // new line
//     // newline = this.RULE("newline", () => {
//     //     this.CONSUME(NewLine)
//     // })
// }
//
// const parserInstance = new RecipeParser()
//
// export type RecipeParseResult = {
//     parserInstance: RecipeParser,
//     cst: CstNode,
//     lexingResult: ILexingResult
// }
//
// export function parse(input: string): RecipeParseResult {
//     const lexingResult = lex(input)
//
//     parserInstance.input = lexingResult.tokens
//
//     const cst = parserInstance.ingredients()
//
//     return {parserInstance, cst, lexingResult}
// }
