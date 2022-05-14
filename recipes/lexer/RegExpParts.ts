import XRegExp from "xregexp";

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
    .add("SectionHeader", /[\t\w ]+/.source)
    .add("NewLine", /(\n|\r\n)/.source)
    .add("WhiteSpace", /\s+/.source)
    .add("NaturalNumberPart", /[1-9]\d*/.source)
    .add("IntegerPart", /0|[1-9]\d*/.source)
    .add("FractionalPart", /\.\d+/.source)
    .add("UnitsPart", /(fl oz)|(fluid ounce)|([a-zA-Z]+\.?)/.source)
    .add("WordPart", /[\w.'/()\[\]{}-]+/.source)
