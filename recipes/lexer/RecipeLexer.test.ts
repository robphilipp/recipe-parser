import {lex} from "./RecipeLexer";
import {ParseType} from "../ParseType";
import {parse} from "../RecipeParser";

describe("when using the recipe lexer for ingredients", () => {
    it("should be able to tokenize a list of valid numbers", () => {
        const result = lex("0.333 314 3/2", {inputType: ParseType.INGREDIENTS, logWarnings: false})
        expect(result.tokens.map(token => token.image)).toEqual(["0.333", "314 3/2"])
    })
    it("should be able to tokenize a list of valid numbers with one invalid number", () => {
        const result = lex("0.333 314 3/2 3.2/4")
        expect(result.tokens.map(token => token.image)).toEqual(["0.333", "314 3/2", "3.2", "/4"])
        expect(result.tokens[2].tokenType.name).toBe("Decimal")
        expect(result.tokens[3].tokenType.name).toBe("Word")
    })
    it("should be able to tokenize a list of number and units", () => {
        const result = lex("1/2 cup 4 gal fl oz")
        expect(result.tokens.map(token => token.image))
            .toEqual(["1/2 cup", "4 gal", "fl oz"])
    })
    it("should be able to tokenize an ingredient with full name", () => {
        const result = lex("1/2 gallon milk")
        expect(result.tokens.map(token => token.image)).toEqual(["1/2 gallon", "milk"])
        // the payload holds the actual unit calculated from the text
        expect(result.tokens[0].payload).toEqual({quantity: [1, 2], unit: "gal"})
    })
    it("should be able to tokenize an ingredient", () => {
        const result = lex("1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["1/2 cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with phonetics for cup", () => {
        const result = lex("1 1/2 cp all purpose flour")
        expect(result.tokens.map(token => token.image)).toEqual(["1 1/2 cp", "all", "purpose", "flour"])
        // the payload holds the actual unit calculated from the text
        expect(result.tokens[0].payload).toEqual({quantity: [3, 2], unit: 'cup'})
    })
    it("should be able to tokenize an ingredient with for ¼ cup", () => {
        const result = lex("¼ cup all purpose flour")
        expect(result.tokens.map(token => token.image)).toEqual(["¼ cup", "all", "purpose", "flour"])
        // the payload holds the actual unit calculated from the text
        expect(result.tokens[0].payload).toEqual({quantity: [1, 4], unit: 'cup'})
    })
    it("should be able to tokenize an ingredient with for 1 ¼ cup", () => {
        const result = lex("11 ¼ cup all purpose flour")
        expect(result.tokens.map(token => token.image)).toEqual(["11 ¼ cup", "all", "purpose", "flour"])
        // the payload holds the actual unit calculated from the text
        expect(result.tokens[0].payload).toEqual({quantity: [45, 4], unit: 'cup'})
    })
    it("should be able to tokenize an ingredient with for 1¼ cup", () => {
        const result = lex("1¼ cup all purpose flour")
        expect(result.tokens.map(token => token.image)).toEqual(["1¼ cup", "all", "purpose", "flour"])
        // the payload holds the actual unit calculated from the text
        expect(result.tokens[0].payload).toEqual({quantity: [5, 4], unit: 'cup'})
    })
    it("should be able to tokenize an ingredient with 1)", () => {
        const result = lex("1) 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["1)", "1/2 cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with -50)", () => {
        const result = lex("-50 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["-50", "1/2 cup", "all", "purpose", "flour"])
        expect(result.tokens.map(token => token.tokenType.name))
            .toEqual(["Word", "Amount", "Word", "Word", "Word"])
    })
    it("should be able to tokenize an ingredient with - 50)", () => {
        const result = lex("- 50 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["- ", "50 1/2 cup", "all", "purpose", "flour"])
        expect(result.tokens[0].payload.id).toEqual("-")
        expect(result.tokens.map(token => token.tokenType.name))
            .toEqual(["ListItemId", "Amount", "Word", "Word", "Word"])
    })
    it("should be able to tokenize an ingredient with 1.", () => {
        const result = lex("1. 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["1.", "1/2 cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with 10:", () => {
        const result = lex("10: 1 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["10:", "1 1/2 cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with (1.)", () => {
        const result = lex("(1.) 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["(1.)", "1/2 cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with 1.)", () => {
        const result = lex("1.) 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["1.)", "1/2 cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with (100)", () => {
        const result = lex("(100) 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["(100)", "1/2 cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with *", () => {
        const result = lex("* 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["* ", "1/2 cup", "all", "purpose", "flour"])
        expect(result.tokens[0].payload.id).toEqual("*")
    })
    it("should be able to tokenize an ingredient with •", () => {
        const result = lex(" •    1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["•    ", "1/2 cup", "all", "purpose", "flour"])
    })
    it("should be able to tokenize an ingredient with -", () => {
        const result = lex("- 1/2 cup all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["- ", "1/2 cup", "all", "purpose", "flour"])
        expect(result.tokens[0].payload.id).toEqual("-")
        expect(result.tokens.map((token => token.tokenType.name)))
            .toEqual(["ListItemId", "Amount", "Word", "Word", "Word"])
    })
    it("should be able to tokenize an ingredient with slang and list", () => {
        const result = lex("- a couple pinches all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["- ", "a couple pinches", "all", "purpose", "flour"])
        expect(result.tokens[0].payload.id).toEqual("-")
        expect(result.tokens[1].payload).toEqual({quantity: [2, 1], unit: 'pinch'})
    })
    it("should be able to tokenize an ingredient with slang no list", () => {
        const result = lex("a couple pinches all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["a couple pinches", "all", "purpose", "flour"])
        expect(result.tokens[0].payload).toEqual({quantity: [2, 1], unit: 'pinch'})
    })
    it("should be able to tokenize an ingredient with slang several", () => {
        const result = lex("several pinches all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["several pinches", "all", "purpose", "flour"])
        expect(result.tokens[0].payload).toEqual({quantity: [3, 1], unit: 'pinch'})
    })
    it("should be able to tokenize an ingredient with slang a few", () => {
        const result = lex("a few pinches all purpose flour")
        expect(result.tokens.map(token => token.image))
            .toEqual(["a few pinches", "all", "purpose", "flour"])
        expect(result.tokens[0].payload).toEqual({quantity: [3, 1], unit: 'pinch'})
    })
    it("should be able to tokenize an ingredient with slang a pinch", () => {
        const result = lex("a pinch all purpose flour")
        expect(result.tokens.map(token => token.image)).toEqual(["a pinch", "all", "purpose", "flour"])
        expect(result.tokens[0].payload).toEqual({quantity: [1, 1], unit: 'pinch'})
    })
    it("should be able to tokenize pieces", () => {
        const result = lex("1 egg")
        expect(result.tokens.map(token => token.image)).toEqual(["1", "egg"])
        expect(result.tokens[0].payload).toEqual({quantity: [1, 1], unit: 'piece'})
    })
    it("should be able to tokenize steps with list items", () => {
        const input = `* put the flour into a large mixing bowl
        - add the egg and whisk,
        • add the milk and whisk,
        2) add the vanilla extract
        1. whisk until a smooth batter`
        const result = lex(input, {inputType: ParseType.STEPS})
        expect(result.tokens.length).toBe(10)
        expect(result.tokens.map(token => token.image)).toEqual([
            "* ", "put the flour into a large mixing bowl",
            "- ", "add the egg and whisk,",
            "• ", "add the milk and whisk,",
            "2)", "add the vanilla extract",
            "1.", "whisk until a smooth batter"
        ])
        expect(result.tokens.map(token => token.tokenType.name)).toEqual([
            "ListItemId", "Step",
            "ListItemId", "Step",
            "ListItemId", "Step",
            "ListItemId", "Step",
            "ListItemId", "Step",
        ])
    })
})

describe("when using the recipe lexer for section headers", () => {
    it("should be able to lex a section header", () => {
        const result = lex(`#Section Header#`)
        expect(result.tokens.map(token => token.image)).toEqual(["#Section Header#"])
    })
    it("should be able to lex a section header and several ingredients", () => {
        const result = lex(`#Section Header#\n- 1/2 cup all purpose flour\n1 ¼ cup whole milk`)
        expect(result.tokens.map(token => token.image))
            .toEqual(['#Section Header#', "- ", "1/2 cup", "all", "purpose", "flour", "1 ¼ cup", "whole", "milk"])
        expect(result.tokens[2].payload).toEqual({quantity: [1, 2], unit: 'cup'})
        expect(result.tokens[6].payload).toEqual({quantity: [5, 4], unit: 'cup'})
    })
    it("should be able to lex a several ingredients", () => {
        const result = lex(`1 1/2 cup all purpose flour\n1 tsp vanilla`)
        expect(result.tokens.map(token => token.image))
            .toEqual(["1 1/2 cup", "all", "purpose", "flour", "1 tsp", "vanilla"])
        expect(result.tokens[0].payload).toEqual({quantity: [3, 2], unit: 'cup'})
        expect(result.tokens[4].payload).toEqual({quantity: [1, 1], unit: 'tsp'})
    })
    it("should be able to lex a multi-line set of ingredients with section headers", () => {
        const {tokens} = lex(`1 lb sugar#dough\n1 1/2 cp all-purpose flour\n1 tsp vanilla extract#sauce#\n1 cup milk`)
        expect(tokens.map(tkn => tkn.image)).toEqual([
            "1 lb", "sugar", "#dough", "1 1/2 cp", "all-purpose", "flour", "1 tsp", "vanilla", "extract", "#sauce#", "1 cup", "milk"
        ])
        expect(tokens.map(tkn => tkn.tokenType.name)).toEqual([
            "Amount", "Word", "SectionHeader", "Amount", "Word", "Word", "Amount", "Word", "Word", "SectionHeader", "Amount", "Word"
        ])
    })
    it("should be able to lex a multi-line set of ingredients with section newline headers", () => {
        const {tokens} = lex(`1 lb sugar\ndough\n1 1/2 cp all-purpose flour\n1 tsp vanilla extract\nsauce\n1 cup milk`)
        expect(tokens.map(tkn => tkn.image)).toEqual([
            "1 lb", "sugar", "dough\n", "1 1/2 cp", "all-purpose", "flour", "1 tsp", "vanilla", "extract", "sauce\n", "1 cup", "milk"
        ])
        expect(tokens.map(tkn => tkn.tokenType.name)).toEqual([
            "Amount", "Word", "SectionHeader", "Amount", "Word", "Word", "Amount", "Word", "Word", "SectionHeader", "Amount", "Word"
        ])
    })
    it("should be able to lex multi-line set of steps with section and newline headers", () => {
        const {tokens} = lex(`Spice rub
1. 1 tbsp ground coriander
2. 1.25 tbsp ground sweet paprika
3. 1 tbsp ground cumin
4. 1.5 tbsp salt
5. 2 tbsp of New Mexico Chile powder; or, Chile powder of your choice
6. Mix together and table out 2 tablespoon of spice for rubbing then put the rest into food processor
Sauce
7. Spice rub powder, Fresno pepper (keep some seeds to adjust the spiciness you like)
8. add 3 cloves of garlic  and 2 tbsp of sugar then pause with food processor until the sauce is chopped
9. Pour 1/4 cup red wine and 1/3 cup lemon juice into the food processor then pulse the sauce.
Instructions
10. Reserve 1/4 cup of sauce with juice and brush sauce on the chicken skin. Marinate on the chicken for 45 mins.
11. Put on a tray with salt on bottom and rack on top put chicken on the rack.
12. Set oven at 425 degree F and roast for 45-50 mins. Then take out the chicken and brush with 2 tbsp of another layer of pepper sauce. Put back into oven for another 10-15 mins. Then take the chicken out and rest/cool for 10 mins.
13. Add 1 cup cilantro with leaves and stems to the sauce then put one last brushing on the chicken. Ready to serve
`, {inputType: ParseType.STEPS, logWarnings: false, gimmeANewLexer: true})
        expect(tokens.map(tkn => tkn.image)).toEqual([
            "Spice rub\n",
            "1.","1 tbsp ground coriander",
            "2.","1.25 tbsp ground sweet paprika",
            "3.","1 tbsp ground cumin",
            "4.","1.5 tbsp salt",
            "5.","2 tbsp of New Mexico Chile powder; or, Chile powder of your choice",
            "6.","Mix together and table out 2 tablespoon of spice for rubbing then put the rest into food processor",
            "Sauce\n",
            "7.","Spice rub powder, Fresno pepper (keep some seeds to adjust the spiciness you like)",
            "8.","add 3 cloves of garlic  and 2 tbsp of sugar then pause with food processor until the sauce is chopped",
            "9.","Pour 1/4 cup red wine and 1/3 cup lemon juice into the food processor then pulse the sauce.",
            "Instructions\n",
            "10.","Reserve 1/4 cup of sauce with juice and brush sauce on the chicken skin. Marinate on the chicken for 45 mins.",
            "11.","Put on a tray with salt on bottom and rack on top put chicken on the rack.",
            "12.","Set oven at 425 degree F and roast for 45-50 mins. Then take out the chicken and brush with 2 tbsp of another layer of pepper sauce. Put back into oven for another 10-15 mins. Then take the chicken out and rest/cool for 10 mins.",
            "13.","Add 1 cup cilantro with leaves and stems to the sauce then put one last brushing on the chicken. Ready to serve"
        ])
        expect(tokens.map(tkn => tkn.tokenType.name)).toEqual([
            "SectionHeaderInStep",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "SectionHeaderInStep",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "SectionHeaderInStep",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step"
        ])
    })
    it("should be able to lex multi-line set of ingredients andsteps with section and newline headers", () => {
        const {tokens} = lex(`Ingredients
        Powder
            1. 2 tbsp sugar
            2) 1 tbsp paprika
            1 tbsp coriander
            1 tbsp cumin
            1 1/2 tbsp salt
            2 tbsps new mexico chile powder
            Sauce
            3 cloves garlic
            8 fresno peppers
            1/3 cup lemon juice
            1/4 cup red wine vinegar
            Chicken
            1 whole chicken
            Steps
Spice rub
1. 1 tbsp ground coriander
2. 1.25 tbsp ground sweet paprika
3. 1 tbsp ground cumin
4. 1.5 tbsp salt
5. 2 tbsp of New Mexico Chile powder; or Chile powder of your choice
6. Mix together and table out 2 tablespoon of spice for rubbing then put the rest into food processor
Sauce
7. Spice rub powder, Fresno pepper (keep some seeds to adjust the spiciness you like)
8. add 3 cloves of garlic  and 2 tbsp of sugar then pause with food processor until the sauce is chopped
9. Pour 1/4 cup red wine and 1/3 cup lemon juice into the food processor then pulse the sauce.
Instructions
10. Reserve 1/4 cup of sauce with juice and brush sauce on the chicken skin. Marinate on the chicken for 45 mins.
11. Put on a tray with salt on bottom and rack on top put chicken on the rack.
12. Set oven at 425 degree F and roast for 45-50 mins. Then take out the chicken and brush with 2 tbsp of another layer of pepper sauce. Put back into oven for another 10-15 mins. Then take the chicken out and rest/cool for 10 mins.
13. Add 1 cup cilantro with leaves and stems to the sauce then put one last brushing on the chicken. Ready to serve
`, {inputType: ParseType.RECIPE, logWarnings: false, gimmeANewLexer: true})
        expect(tokens.map(tkn => tkn.image)).toEqual([
            "Ingredients\n",
            "Powder\n",
            "1.","2 tbsp","sugar",
            "2)","1 tbsp","paprika",
            "1 tbsp","coriander",
            "1 tbsp","cumin",
            "1 1/2 tbsp",
            "salt",
            "2 tbsps","new","mexico","chile","powder",
            "Sauce\n",
            "3","cloves","garlic",
            "8","fresno","peppers",
            "1/3 cup","lemon","juice",
            "1/4 cup","red","wine","vinegar",
            "Chicken\n","1","whole","chicken",
            "Steps\n",
            "Spice rub\n",
            "1.","1 tbsp ground coriander",
            "2.","1.25 tbsp ground sweet paprika",
            "3.","1 tbsp ground cumin",
            "4.","1.5 tbsp salt",
            "5.","2 tbsp of New Mexico Chile powder; or Chile powder of your choice",
            "6.","Mix together and table out 2 tablespoon of spice for rubbing then put the rest into food processor",
            "Sauce\n",
            "7.","Spice rub powder, Fresno pepper (keep some seeds to adjust the spiciness you like)",
            "8.","add 3 cloves of garlic  and 2 tbsp of sugar then pause with food processor until the sauce is chopped",
            "9.","Pour 1/4 cup red wine and 1/3 cup lemon juice into the food processor then pulse the sauce.",
            "Instructions\n",
            "10.","Reserve 1/4 cup of sauce with juice and brush sauce on the chicken skin. Marinate on the chicken for 45 mins.",
            "11.","Put on a tray with salt on bottom and rack on top put chicken on the rack.",
            "12.","Set oven at 425 degree F and roast for 45-50 mins. Then take out the chicken and brush with 2 tbsp of another layer of pepper sauce. Put back into oven for another 10-15 mins. Then take the chicken out and rest/cool for 10 mins.",
            "13.","Add 1 cup cilantro with leaves and stems to the sauce then put one last brushing on the chicken. Ready to serve"
        ])
        expect(tokens.map(tkn => tkn.tokenType.name)).toEqual([
            "IngredientsSectionHeader",
            "SectionHeader",
            "ListItemId","Amount","Word",
            "ListItemId","Amount","Word",
            "Amount","Word",
            "Amount","Word",
            "Amount","Word",
            "Amount","Word","Word","Word","Word",
            "SectionHeader",
            "Amount","Word","Word",
            "Amount","Word","Word",
            "Amount","Word","Word",
            "Amount","Word","Word","Word",
            "SectionHeader",
            "Amount","Word","Word",
            "StepsSectionHeader",
            "SectionHeaderInStep",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "SectionHeaderInStep",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "SectionHeaderInStep",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step",
            "ListItemId","Step"
        ])
    })
})