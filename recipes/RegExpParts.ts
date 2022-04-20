import XRegExp from "xregexp";

/* -- ingredients

in ABNF (https://matt.might.net/articles/grammars-bnf-ebnf/)

section = "/n" section_header "/n" (1*ingredient / 1*step / story / timing / note / yield / rating)

section_header = 1*word

ingredient = [list_item_id whitespace] amount

white_space = *( " " / "\t" )
list_item_id = ( [ "(" ] number [ "." / ")" / ":" ] ) / ( [ "-" / "*" / "•" ])

amount = [modifier] [white_space] quantity [white_space] [unit] [ "." ]
modifier = approx / approximately / about / "~" / around
quantity = number / fraction
unit = (cup / tsp / tbsp (.... see units in recipes ui))["."]

number = integer / decimal / (integer unicode_fraction)
integer :: = 0 / (natural_digit *digit)
decimal :: integer "." 1*digit
fraction = integer "/" natural_digit *digit
natural_digit = 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9
digit = 0 / natural_digit
unicode_fraction = \u00BC | \u00BD | \u00BE | ...
 */


/**
 * Immutable.
 *
 * Type for managing the regular expression parts for using {@link XRegExp}.
 *
 * Use the {@link newRegexParts} factory function to create a new {@link RegExpParts}
 * object.
 *
 * @interface RegExpParts
 * @property fragments Holds the fragments that can be used to generate regular and combine
 * regular expressions.
 * @property add Method for adding a new pattern.
 * @property regex Method that returns the regular expression for the specified pattern name
 *
 * @see newRegexParts
 */
export type RegExpParts = {
    /**
     * Holds the fragments that can be used to generate regular and combine
     * regular expressions.
     */
    readonly fragments: Record<string, XRegExp.Pattern>
    /**
     * Method for adding a new pattern to the fragments
     * @param partName The name of the new pattern
     * @param pattern The regex pattern string
     * @return A new {@link RegExpParts} object
     */
    add: (partName: string, pattern: string) => RegExpParts
    /**
     * Returns the regular expression associated with the pattern name
     * @param partName The name of the pattern
     * @return A regular expression
     */
    regex: (partName: string) => RegExp
}

/**
 * Creates a new (empty) {@link RegExpParts} object
 */
export function newRegexParts(): RegExpParts {
    return {
        fragments: {},
        add: function (this: RegExpParts, partName: string, pattern: string): RegExpParts {
            return {
                ...this,
                fragments: {
                    ...this.fragments,
                    [partName]: XRegExp.build(pattern, this.fragments)
                }
            }
        },
        regex: function (this: RegExpParts, partName: string, flags?: string): RegExp {
            return XRegExp.build(partName, this.fragments, flags)
        }
    }
}

export const regexParts = newRegexParts()
    .add("SectionHeader", /#\w+[\w ]*#/.source)
    // .add("SectionHeader", /#\w+[\w ]*(\n|\r\n)/.source)
    // .add("SectionHeader", /(\n|\r\n)\w+[\w ]*(\n|\r\n)/.source)
    // .add("SectionHeader", /(\n|\r\n)\w+[\w ]*(\n|\r\n)/.source)
    .add("WhiteSpace", /\s+/.source)
    .add("NaturalNumberPart", /[1-9]\d*/.source)
    .add("IntegerPart", /0|[1-9]\d*/.source)
    .add("FractionalPart", /\.\d+/.source)
    .add("UnitsPart", /(fl oz)|(fluid ounce)|([a-zA-Z]+\.?)/.source)
    .add("WordPart", /[\w.'/()\[\]{}-]+/.source)
    // a section header should be on its own line
    .add("NewLine", /(\n|\r\n)/.source)
    // .add("SectionHeader", /^(\n|\r\n)\w+[\w ]*(\n|\r\n)$/.source)
