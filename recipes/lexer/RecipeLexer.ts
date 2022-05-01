import {createToken, ILexingResult, Lexer, TokenType, TokenVocabulary} from 'chevrotain'
import {regexParts} from "./RegExpParts";
import {
    amountMatcher, matchIngredientsSection,
    matchFraction,
    matchQuantity,
    matchUnicodeFraction,
    matchSection,
    unitMatcher, matchStepsSection
} from "./matchers";

/*
 | LEXER MODES (enter, exit)
 */
const INGREDIENTS_MODE = "ingredients_mode"
const STEPS_MODE = "steps_mode"

const EnterIngredients = createToken({
    name: "EnterIngredients",
    pattern: matchIngredientsSection,
    line_breaks: false,
    push_mode: INGREDIENTS_MODE
})

const EnterSteps = createToken({
    name: "EnterSteps",
    pattern: matchStepsSection,
    line_breaks: false,
    push_mode: STEPS_MODE
})

/*
 | NUMBERS
 */
const Integer = createToken({
    name: "Integer",
    pattern: regexParts.regex("{{IntegerPart}}")
})
const Decimal = createToken({
    name: "Decimal",
    pattern: regexParts.regex("{{IntegerPart}}{{FractionalPart}}"),
    longer_alt: Integer
})
const Fraction = createToken({
    name: "Fraction",
    pattern: regexParts.regex("{{IntegerPart}}/{{NaturalNumberPart}}"),
    longer_alt: Integer
})
const UnicodeFraction = createToken({
    name: "UnicodeFraction",
    pattern: matchUnicodeFraction,
    line_breaks: false
})

const WholeFraction = createToken({
    name: "WholeFraction",
    pattern: matchFraction,
    longer_alt: Fraction,
    line_breaks: false
})
const Quantity = createToken({
    name: "Quantity",
    pattern: matchQuantity,
    line_breaks: false,
    longer_alt: WholeFraction
})

const Unit = createToken({
    name: "Unit",
    pattern: unitMatcher,
    line_breaks: false
})

const Amount = createToken({
    name: "Amount",
    pattern: amountMatcher,
    line_breaks: false,
    longer_alt: Quantity
})

const Word = createToken({
    name: "Word",
    pattern: regexParts.regex("{{WordPart}}")
})
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: regexParts.regex("{{WhiteSpace}}"),
    group: Lexer.SKIPPED
})
const NewLine = createToken({
    name: "NewLine",
    pattern: regexParts.regex("{{NewLine}}"),
    group: Lexer.SKIPPED
})
const ListItemId = createToken({
    name: "ListItemId",
    pattern: /(\(?\d+((.\))|[.):]))|[*•-]\w*/,
    longer_alt: Decimal,
})
const SectionHeader = createToken({
    name: "SectionHeader",
    pattern: matchSection,
    longer_alt: Word,
    line_breaks: false
})

/*
 | SECTIONS
 */
const IngredientsSectionHeader = createToken({
    name: "IngredientsSectionHeader",
    pattern: matchIngredientsSection,
    line_breaks: false,
    longer_alt: SectionHeader
})

const StepsSectionHeader = createToken({
    name: "StepsSectionHeader",
    pattern: matchStepsSection,
    line_breaks: false,
    longer_alt: SectionHeader
})


// /**
//  * Holds the tokens used to parse the recipe. **Note** that the *order* in which these appear *matters*.
//  */
// export const multiModeLexerDefinition = {
//     modes: {
//         [INGREDIENTS_MODE]: [
//             NewLine,
//             WhiteSpace,
//             ListItemId,
//             Amount, Quantity, WholeFraction, UnicodeFraction, Fraction, Decimal, Integer,
//             Unit,
//             IngredientsSectionHeader,
//             StepsSectionHeader,
//             SectionHeader,
//             Word,
//         ],
//         [STEPS_MODE]: [
//             NewLine,
//             WhiteSpace,
//             ListItemId,
//             // EnterIngredients,
//             // EnterSteps,
//             StepsSectionHeader,
//             SectionHeader,
//             Word
//         ]
//     },
//     defaultMode: INGREDIENTS_MODE
// }
/**
 * Holds the tokens used to parse the recipe. **Note** that the *order* in which these appear *matters*.
 */
export const recipeTokens = [
    NewLine,
    WhiteSpace,
    ListItemId,
    Amount, Quantity, WholeFraction, UnicodeFraction, Fraction, Decimal, Integer,
    Unit,
    IngredientsSectionHeader,
    StepsSectionHeader,
    SectionHeader,
    Word,
]

// export const recipeTokenVocabulary = Object
//     .values(multiModeLexerDefinition.modes)
//     .flatMap(values => values)
//     .reduce((vocab, token) => {
//         vocab[token.name] = token
//         return vocab
//     }, {} as { [key: string]: TokenType })
export const recipeTokenVocabulary = recipeTokens.reduce((vocab, token) => {
    vocab[token.name] = token
    return vocab
}, {} as { [key: string]: TokenType })


// todo see multi-mode lexing https://github.com/Chevrotain/chevrotain/blob/master/examples/lexer/multi_mode_lexer/multi_mode_lexer.js
//      so that each section have a mode

let recipeLexer: Lexer

/**
 * Converts the input text into a lexing result that can be parsed into an AST or CST.
 * @param input The input string
 * @param [logWarnings = false] When set to `true` then logs warning to the console, otherwise
 * does not log warnings. Warning and errors are reported in the returned object in either case.
 * @return The {@link ILexingResult} object holding the result of the lexing operation
 */
export function lex(input: string, logWarnings: boolean = false): ILexingResult {
    if (recipeLexer === undefined) {
        // recipeLexer = new Lexer(multiModeLexerDefinition)
        recipeLexer = new Lexer(recipeTokens)
    }
    const result = recipeLexer.tokenize(input)

    if (logWarnings && result.errors.length > 0) {
        console.warn(`Failed lexing with errors: ${result.errors.map(error => error.message).join(";")}`)
    }

    return result
}
