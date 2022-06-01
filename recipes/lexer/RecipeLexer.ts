import {createToken, ILexingResult, IMultiModeLexerDefinition, Lexer, TokenType} from 'chevrotain'
import {regexParts} from "./RegExpParts";
import {
    amountMatcher,
    matchFraction,
    matchIngredientsSection,
    matchListItemId,
    matchQuantity, matchSection,
    matchSectionIngredients,
    matchStepsSection,
    matchUnicodeFraction, stepMatcher,
    unitMatcher
} from "./matchers";
import {ParseType} from "../ParseType";

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
const Step = createToken({
    name: "Step",
    pattern: stepMatcher,
    // pattern: regexParts.regex("(({{IntegerPart}}[ \t]+)|{{IntegerPart}}{{FractionalPart}}|{{RangePart}}|{{IntegerPart}}/{{NaturalNumberPart}}|{{StepPart}})+"),
    // pattern: regexParts.regex("{{StepPart}}"),
    line_breaks: false
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
    // pattern: /(\(?\d+((.\))|[.):]))|[*•-]\w*/,
    pattern: matchListItemId,
    longer_alt: Decimal,
    line_breaks: false
})
const StepListItemId = createToken({
    name: "StepListItemId",
    // name: "ListItemId",
    // pattern: /(\(?\d+((.\))|[.):]))|[*•-]\w*/,
    pattern: matchListItemId,
    longer_alt: Step,
    // longer_alt: Decimal,
    line_breaks: false
})
const SectionHeader = createToken({
    name: "SectionHeader",
    pattern: matchSectionIngredients,
    longer_alt: Word,
    line_breaks: false
})
const SectionHeaderInStep = createToken({
    name: "SectionHeaderInStep",
    pattern: matchSection,
    longer_alt: Step,
    line_breaks: false
})

// const Punctuation = createToken({
//     name: "Punctuation",
//     pattern: regexParts.regex("{{Punctuation}}"),
//     longer_alt: ListItemId,
//     line_breaks: false,
//     group: Lexer.SKIPPED
// })

/*
 | SECTIONS
 */
// const IngredientsSectionHeader = createToken({
//     name: "IngredientsSectionHeader",
//     pattern: matchIngredientsSection,
//     line_breaks: false,
//     // push_mode: "ingredients_mode",
//     longer_alt: SectionHeader
// })
//
// const StepsSectionHeader = createToken({
//     name: "StepsSectionHeader",
//     pattern: matchStepsSection,
//     line_breaks: false,
//     // push_mode: "steps_mode",
//     longer_alt: SectionHeaderInStep
// })
//
// const EnterRecipes = createToken({
//     name: "EnterRecipes",
//     // pattern: matchSection,
//     push_mode: "recipes_mode"
// })

// const ExitRecipes = createToken({
//     name: "ExitRecipes",
//     pattern: matchIngredientsSection,
//     pop_mode: true
// })

// const EnterIngredients = createToken({
//     name: "EnterIngredients",
//     pattern: matchIngredientsSection,
//     push_mode: "ingredients_mode",
//     line_breaks: false
// })
const EnterIngredients = createToken({
    name: "IngredientsSectionHeader",
    pattern: matchIngredientsSection,
    line_breaks: false,
    push_mode: "ingredients_mode",
    longer_alt: SectionHeader
})


const ExitIngredients = createToken({
    name: "ExitIngredients",
    pattern: matchStepsSection,
    pop_mode: true,
    line_breaks: false
})
// const EnterSteps = createToken({
//     name: "EnterSteps",
//     pattern: matchStepsSection,
//     push_mode: "steps_mode",
//     line_breaks: false
// })
const EnterSteps = createToken({
    name: "StepsSectionHeader",
    pattern: matchStepsSection,
    line_breaks: false,
    push_mode: "steps_mode",
    longer_alt: SectionHeaderInStep
})


const ExitSteps = createToken({
    name: "ExitSteps",
    pattern: matchIngredientsSection,
    pop_mode: true,
    line_breaks: false,
    // longer_alt: SectionHeader
})

/**
 * Holds the tokens used to parse the recipe. **Note** that the *order* in which these appear *matters*.
 */
const recipeTokenTypes = [
    // SectionHeader,
    // IngredientsSectionHeader,
    // StepsSectionHeader,
    EnterIngredients,
    EnterSteps,
    SectionHeader,
    SectionHeaderInStep
]

const ingredientTokenTypes = [
    NewLine,
    WhiteSpace,
    ListItemId,
    Amount, Quantity, WholeFraction, UnicodeFraction, Fraction, Decimal, Integer,
    Unit,
    // IngredientsSectionHeader,
    // StepsSectionHeader,
    SectionHeader,
    // ExitIngredients,
    // EnterSteps,
    Word,
]

const stepTokenTypes = [
    NewLine,
    WhiteSpace,
    StepListItemId,
    // ListItemId,
    // Amount,
    // Quantity, WholeFraction, UnicodeFraction, Fraction, Decimal, Integer,
    // Unit,
    SectionHeaderInStep,
    Step,
    // Word,
    // Decimal, Integer, UnicodeFraction,

    // NewLine,
    // WhiteSpace,
    // ListItemId,
    // Amount, Quantity, WholeFraction, UnicodeFraction, Fraction, Decimal, Integer,
    // Unit,
    // SectionHeader,
    // Word,
]

const recipeTokens = {
    modes: {
        recipe_mode: recipeTokenTypes,
        ingredients_mode: [EnterSteps, ...ingredientTokenTypes, ExitIngredients, SectionHeaderInStep],// StepsSectionHeader],//, EnterSteps],
        steps_mode: [EnterIngredients, ...stepTokenTypes, ExitSteps],//IngredientsSectionHeader], //EnterIngredients]
        // ingredients_mode: [...ingredientTokenTypes, ExitIngredients, EnterSteps],// StepsSectionHeader],//, EnterSteps],
        // steps_mode: [...stepTokenTypes, ExitSteps, EnterIngredients],//IngredientsSectionHeader], //EnterIngredients]
    },

    defaultMode: "recipe_mode"
}

export function recipeTokensFor(inputType: ParseType = ParseType.RECIPE): Array<TokenType> | IMultiModeLexerDefinition {
    switch (inputType) {
        case ParseType.RECIPE:
            return recipeTokens
        case ParseType.INGREDIENTS:
            return ingredientTokenTypes
        case ParseType.STEPS:
            return stepTokenTypes
    }
}

// /**
//  * Holds the tokens used to parse the recipe. **Note** that the *order* in which these appear *matters*.
//  */
// export const recipeTokens = [
//     NewLine,
//     WhiteSpace,
//     ListItemId,
//     Amount, Quantity, WholeFraction, UnicodeFraction, Fraction, Decimal, Integer,
//     Unit,
//     IngredientsSectionHeader,
//     StepsSectionHeader,
//     SectionHeader,
//     Word,
// ]

// export const recipeTokenVocabulary = recipeTokens.reduce((vocab, token) => {
//     vocab[token.name] = token
//     return vocab
// }, {} as { [key: string]: TokenType })

export const recipeTokenVocabulary = Object
    .values(recipeTokens.modes)
    .flatMap(tokens => tokens)
    .reduce((vocab, token) => {
            vocab[token.name] = token
            return vocab
        },
        {} as { [key: string]: TokenType }
    )


let recipeLexer: Lexer

export type LexerOptions = {
    inputType?: ParseType,
    logWarnings?: boolean,
    gimmeANewLexer?: boolean
}

const defaultOptions: LexerOptions = {
    inputType: ParseType.RECIPE,
    logWarnings: false,
    gimmeANewLexer: false
}

/**
 * Converts the input text into a lexing result that can be parsed into an AST or CST.
 * @param input The input string
 * @param [options = defaultOptions] Options for lexing the text
 * @return The {@link ILexingResult} object holding the result of the lexing operation
 */
export function lex(
    input: string,
    options: LexerOptions = defaultOptions
): ILexingResult {
    const {
        inputType = ParseType.RECIPE,
        logWarnings = false,
        gimmeANewLexer = false
    } = options

    if (recipeLexer === undefined || gimmeANewLexer) {
        recipeLexer = new Lexer(recipeTokensFor(inputType))
    }
    const result = recipeLexer.tokenize(input)

    if (logWarnings && result.errors.length > 0) {
        console.warn(`Failed lexing with errors: ${result.errors.map(error => error.message).join(";")}`)
    }

    return result
}
