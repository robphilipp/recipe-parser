import {parse} from "./RecipeParser";
import {CstNode, IToken} from "chevrotain";
import {INGREDIENTS_HEADER, STEPS_HEADER} from "./lexer/matchers";
import {ParseType} from "./ParseType";

describe("when parsing a recipe", () => {
    it("should work", () => {
        const {parserInstance, cst} = parse("1 1/2 cp all purpose flour", {inputType: ParseType.INGREDIENTS})

        expect(true).toBeTruthy()
        expect(cst).toBeDefined()
        expect(cst.name).toBe('ingredients')
        expect(cst.children).toBeDefined()
        expect(cst.children.ingredientItem).toBeDefined()
        expect(cst.children.ingredientItem).toHaveLength(1)

        const ingredientItem: CstNode = cst.children.ingredientItem[0] as CstNode
        expect(ingredientItem.name).toBe('ingredientItem')
        expect(ingredientItem.children.amount).toHaveLength(1)

        const {amount, ingredient} = ingredientItem.children

        // amount
        expect(amount).toHaveLength(1)
        const amountItem = amount[0] as CstNode
        expect(amountItem.name).toBe('amount')
        expect(amountItem.children.Amount).toHaveLength(1)
        const amountElement = amountItem.children.Amount[0] as IToken
        expect(amountElement.image).toBe('1 1/2 cp')
        expect(amountElement.tokenType.name).toBe('Amount')
        expect(amountElement.payload).toEqual({quantity: [3, 2], unit: 'cup'})

        // ingredient
        expect(ingredientItem.children.ingredient).toHaveLength(1)
        const ingredientI = ingredient[0] as CstNode
        expect(ingredientI.name).toBe('ingredient')
        expect(ingredientI.children.Word).toHaveLength(3)
        const ingredientElements = ingredientI.children.Word as Array<IToken>
        expect(ingredientElements[0].image).toBe('all')
        expect(ingredientElements[0].tokenType.name).toBe('Word')
        expect(ingredientElements[1].image).toBe('purpose')
        expect(ingredientElements[1].tokenType.name).toBe('Word')
        expect(ingredientElements[2].image).toBe('flour')
        expect(ingredientElements[2].tokenType.name).toBe('Word')
    })

    it("should work for multiple items", () => {
        const {parserInstance, cst} = parse(
            `1 1/2 cp all-purpose flour\n1 tsp vanilla extract`,
            {inputType: ParseType.INGREDIENTS, gimmeANewParser: true, gimmeANewLexer: true}
        )

        expect(true).toBeTruthy()
        expect(cst).toBeDefined()
        expect(cst.name).toBe('ingredients')
        expect(cst.children).toBeDefined()
        expect(cst.children.ingredientItem).toBeDefined()
        expect(cst.children.ingredientItem).toHaveLength(2)
    })
    it("should work for multiple items and sections", () => {
        const {parserInstance, cst} = parse(
            `1 lb sugar#dough\n1 1/2 cp all-purpose flour\n1 tsp vanilla extract#sauce#\n1 cup milk`,
            {inputType: ParseType.INGREDIENTS, gimmeANewParser: true, gimmeANewLexer: true}
        )

        expect(cst.name).toBe('ingredients')
        expect(cst.children).toBeDefined()
        expect(cst.children.ingredientItem).toBeDefined()
        expect(cst.children.ingredientItem).toHaveLength(1)

        /* INGREDIENT without a section */
        const ingredientItemNode = cst.children.ingredientItem[0] as CstNode
        expect(ingredientItemNode.name).toBe("ingredientItem")
        expect(ingredientItemNode.children.amount).toHaveLength(1)
        expect(ingredientItemNode.children.ingredient).toHaveLength(1)
        expect(cst.children.ingredientsSection).toHaveLength(2)

        /* DOUGH SECTION */
        const dough = cst.children.ingredientsSection[0] as CstNode
        expect(dough.name).toBe("ingredientsSection")
        expect(dough.children.SectionHeader).toHaveLength(1)
        expect(dough.children.ingredientItem).toHaveLength(2)

        const doughSection = dough.children.SectionHeader[0] as IToken
        expect(doughSection.image).toBe("#dough")
        expect(doughSection.payload).toEqual({header: "dough"})

        // 1.5 cups flour
        const flour = dough.children.ingredientItem[0] as CstNode
        expect(flour.name).toBe("ingredientItem")
        expect(flour.children.amount).toHaveLength(1)
        expect(flour.children.ingredient).toHaveLength(1)

        const flourAmount = flour.children.amount[0] as CstNode
        expect(flourAmount.name).toBe("amount")
        expect(flourAmount.children.Amount).toHaveLength(1)
        const flourAmountToken = flourAmount.children.Amount[0] as IToken
        expect(flourAmountToken.image).toBe("1 1/2 cp")
        expect(flourAmountToken.payload).toEqual({quantity: [3, 2], unit: "cup"})

        const flourIngredient = flour.children.ingredient[0] as CstNode
        expect(flourIngredient.name).toBe("ingredient")
        expect(flourIngredient.children.Word).toHaveLength(2)
        const flourIngredientTokens = flourIngredient.children.Word as Array<IToken>
        expect(flourIngredientTokens.map(tkn => tkn.image)).toEqual(["all-purpose", "flour"])

        // 1 tsp vanilla
        const vanilla = dough.children.ingredientItem[1] as CstNode
        expect(vanilla.name).toBe("ingredientItem")
        expect(vanilla.children.amount).toHaveLength(1)
        expect(vanilla.children.ingredient).toHaveLength(1)

        const vanillaAmount = vanilla.children.amount[0] as CstNode
        expect(vanillaAmount.name).toBe("amount")
        expect(vanillaAmount.children.Amount).toHaveLength(1)
        const vanillaAmountToken = vanillaAmount.children.Amount[0] as IToken
        expect(vanillaAmountToken.image).toBe("1 tsp")
        expect(vanillaAmountToken.payload).toEqual({quantity: [1, 1], unit: "tsp"})

        const vanillaIngredient = vanilla.children.ingredient[0] as CstNode
        expect(vanillaIngredient.name).toBe("ingredient")
        expect(vanillaIngredient.children.Word).toHaveLength(2)
        const vanillaIngredientTokens = vanillaIngredient.children.Word as Array<IToken>
        expect(vanillaIngredientTokens.map(tkn => tkn.image)).toEqual(["vanilla", "extract"])

        /* SAUCE SECTION */
        const sauce = cst.children.ingredientsSection[1] as CstNode
        expect(sauce.name).toBe("ingredientsSection")
        expect(sauce.children.SectionHeader).toHaveLength(1)
        expect(sauce.children.ingredientItem).toHaveLength(1)

        const sauceSection = sauce.children.SectionHeader[0] as IToken
        expect(sauceSection.image).toBe("#sauce#")
        expect(sauceSection.payload).toEqual({header: "sauce"})

        // 1 cup milk
        const milk = sauce.children.ingredientItem[0] as CstNode
        expect(milk.name).toBe("ingredientItem")
        expect(milk.children.amount).toHaveLength(1)
        expect(milk.children.ingredient).toHaveLength(1)

        const milkAmount = milk.children.amount[0] as CstNode
        expect(milkAmount.name).toBe("amount")
        expect(milkAmount.children.Amount).toHaveLength(1)
        const milkAmountToken = milkAmount.children.Amount[0] as IToken
        expect(milkAmountToken.image).toBe("1 cup")
        expect(milkAmountToken.payload).toEqual({quantity: [1, 1], unit: "cup"})

        const milkIngredient = milk.children.ingredient[0] as CstNode
        expect(milkIngredient.name).toBe("ingredient")
        expect(milkIngredient.children.Word).toHaveLength(1)
        const milkIngredientTokens = milkIngredient.children.Word as Array<IToken>
        expect(milkIngredientTokens.map(tkn => tkn.image)).toEqual(["milk"])

    })
    it("should work for multiple items and sections without #header", () => {
        const {parserInstance, cst} = parse(`1 lb sugar
dough me
1 1/2 cp all-purpose flour
1 tsp vanilla extract
sauce
1 ℓ milk`, {inputType: ParseType.INGREDIENTS, gimmeANewParser: true, gimmeANewLexer: true})

        expect(cst.name).toBe('ingredients')
        expect(cst.children).toBeDefined()
        expect(cst.children.ingredientItem).toBeDefined()
        expect(cst.children.ingredientItem).toHaveLength(1)

        /* INGREDIENT without a section */
        const ingredientItemNode = cst.children.ingredientItem[0] as CstNode
        expect(ingredientItemNode.name).toBe("ingredientItem")
        expect(ingredientItemNode.children.amount).toHaveLength(1)
        expect(ingredientItemNode.children.ingredient).toHaveLength(1)
        expect(cst.children.ingredientsSection).toHaveLength(2)

        /* DOUGH SECTION */
        const dough = cst.children.ingredientsSection[0] as CstNode
        expect(dough.name).toBe("ingredientsSection")
        expect(dough.children.SectionHeader).toHaveLength(1)
        expect(dough.children.ingredientItem).toHaveLength(2)

        const doughSection = dough.children.SectionHeader[0] as IToken
        expect(doughSection.image).toBe("dough me\n")
        expect(doughSection.payload).toEqual({header: "dough me"})

        // 1.5 cups flour
        const flour = dough.children.ingredientItem[0] as CstNode
        expect(flour.name).toBe("ingredientItem")
        expect(flour.children.amount).toHaveLength(1)
        expect(flour.children.ingredient).toHaveLength(1)

        const flourAmount = flour.children.amount[0] as CstNode
        expect(flourAmount.name).toBe("amount")
        expect(flourAmount.children.Amount).toHaveLength(1)
        const flourAmountToken = flourAmount.children.Amount[0] as IToken
        expect(flourAmountToken.image).toBe("1 1/2 cp")
        expect(flourAmountToken.payload).toEqual({quantity: [3, 2], unit: "cup"})

        const flourIngredient = flour.children.ingredient[0] as CstNode
        expect(flourIngredient.name).toBe("ingredient")
        expect(flourIngredient.children.Word).toHaveLength(2)
        const flourIngredientTokens = flourIngredient.children.Word as Array<IToken>
        expect(flourIngredientTokens.map(tkn => tkn.image)).toEqual(["all-purpose", "flour"])

        // 1 tsp vanilla
        const vanilla = dough.children.ingredientItem[1] as CstNode
        expect(vanilla.name).toBe("ingredientItem")
        expect(vanilla.children.amount).toHaveLength(1)
        expect(vanilla.children.ingredient).toHaveLength(1)

        const vanillaAmount = vanilla.children.amount[0] as CstNode
        expect(vanillaAmount.name).toBe("amount")
        expect(vanillaAmount.children.Amount).toHaveLength(1)
        const vanillaAmountToken = vanillaAmount.children.Amount[0] as IToken
        expect(vanillaAmountToken.image).toBe("1 tsp")
        expect(vanillaAmountToken.payload).toEqual({quantity: [1, 1], unit: "tsp"})

        const vanillaIngredient = vanilla.children.ingredient[0] as CstNode
        expect(vanillaIngredient.name).toBe("ingredient")
        expect(vanillaIngredient.children.Word).toHaveLength(2)
        const vanillaIngredientTokens = vanillaIngredient.children.Word as Array<IToken>
        expect(vanillaIngredientTokens.map(tkn => tkn.image)).toEqual(["vanilla", "extract"])

        /* SAUCE SECTION */
        const sauce = cst.children.ingredientsSection[1] as CstNode
        expect(sauce.name).toBe("ingredientsSection")
        expect(sauce.children.SectionHeader).toHaveLength(1)
        expect(sauce.children.ingredientItem).toHaveLength(1)

        const sauceSection = sauce.children.SectionHeader[0] as IToken
        expect(sauceSection.image).toBe("sauce\n")
        expect(sauceSection.payload).toEqual({header: "sauce"})

        // 1 cup milk
        const milk = sauce.children.ingredientItem[0] as CstNode
        expect(milk.name).toBe("ingredientItem")
        expect(milk.children.amount).toHaveLength(1)
        expect(milk.children.ingredient).toHaveLength(1)

        const milkAmount = milk.children.amount[0] as CstNode
        expect(milkAmount.name).toBe("amount")
        expect(milkAmount.children.Amount).toHaveLength(1)
        const milkAmountToken = milkAmount.children.Amount[0] as IToken
        expect(milkAmountToken.image).toBe("1 ℓ")
        expect(milkAmountToken.payload).toEqual({quantity: [1, 1], unit: "l"})

        const milkIngredient = milk.children.ingredient[0] as CstNode
        expect(milkIngredient.name).toBe("ingredient")
        expect(milkIngredient.children.Word).toHaveLength(1)
        const milkIngredientTokens = milkIngredient.children.Word as Array<IToken>
        expect(milkIngredientTokens.map(tkn => tkn.image)).toEqual(["milk"])

    })
    it("should be able to parse ingredients with list item ids", () => {
        const input = `- 1 1/2 cp all-purpose flour
        - 1 tsp vanilla extract,
        2) 1 cup milk
        1. 1 egg`
        const {parserInstance, cst} = parse(input, {inputType: ParseType.INGREDIENTS, gimmeANewLexer: true, gimmeANewParser: true})

        expect(cst).toBeDefined()
        expect(cst.name).toBe('ingredients')
    })
    it("should be able to parse steps with list item ids", () => {
        const input = `* put the flour into a large mixing bowl
        - add the egg and whisk,
        • add the milk and whisk,
        2) add the vanilla extract
        1. whisk until a smooth batter`
        const {parserInstance, cst} = parse(input, {inputType: ParseType.STEPS, gimmeANewLexer: true, gimmeANewParser: true})

        expect(cst).toBeDefined()
        expect(cst.name).toBe('steps')
        expect(cst.children.stepItem.length).toBe(5)
    })
    it("should work for sections containing items", () => {
        // const {parserInstance, cst} = parse(`1 lb sugar\ndough me\n1 1/2 cp all-purpose flour\n1 tsp vanilla extract\nsauce\n1 cup milk\n`)
        const {parserInstance, cst} = parse(`ingredients
        dough me
1 1/2 cp all-purpose flour
1 tsp vanilla extract
sauce
1 cup milk
steps
dough
1. first step for the Dough
2. second step for the Dough
sauce
1) saucy first step is a tough one
* saucy2 second step is easy`, {gimmeANewLexer: true, gimmeANewParser: true})

        expect(cst.name).toBe('sections')
        expect(cst.children).toBeDefined()

        /* PARTS */
        expect(cst.children.IngredientsSectionHeader).toBeDefined()
        expect((cst.children.IngredientsSectionHeader[0] as IToken).tokenType.name).toBe("IngredientsSectionHeader")
        expect((cst.children.IngredientsSectionHeader[0] as IToken).payload.header).toBe(INGREDIENTS_HEADER)
        expect(cst.children.ingredients).toBeDefined()
        expect(cst.children.ingredients).toHaveLength(1)

        expect(cst.children.StepsSectionHeader).toBeDefined()
        expect((cst.children.StepsSectionHeader[0] as IToken).tokenType.name).toBe("StepsSectionHeader")
        expect((cst.children.StepsSectionHeader[0] as IToken).payload.header).toBe(STEPS_HEADER)
        expect(cst.children.steps).toBeDefined()
        expect(cst.children.steps).toHaveLength(1)

        /* INGREDIENTS PART */
        const ingredientsNode = cst.children.ingredients[0] as CstNode
        expect(ingredientsNode.name).toBe(INGREDIENTS_HEADER)
        expect(ingredientsNode.children.ingredientsSection).toHaveLength(2)

        const ingredientSections = ingredientsNode.children.ingredientsSection

        /* DOUGH SECTION */
        const dough = ingredientSections[0] as CstNode
        expect(dough.name).toBe("ingredientsSection")
        expect(dough.children.SectionHeader).toHaveLength(1)
        expect(dough.children.ingredientItem).toHaveLength(2)

        const doughSection = dough.children.SectionHeader[0] as IToken
        expect(doughSection.image).toBe("dough me\n")
        expect(doughSection.payload).toEqual({header: "dough me"})

        // 1.5 cups flour
        const flour = dough.children.ingredientItem[0] as CstNode
        expect(flour.name).toBe("ingredientItem")
        expect(flour.children.amount).toHaveLength(1)
        expect(flour.children.ingredient).toHaveLength(1)

        const flourAmount = flour.children.amount[0] as CstNode
        expect(flourAmount.name).toBe("amount")
        expect(flourAmount.children.Amount).toHaveLength(1)
        const flourAmountToken = flourAmount.children.Amount[0] as IToken
        expect(flourAmountToken.image).toBe("1 1/2 cp")
        expect(flourAmountToken.payload).toEqual({quantity: [3, 2], unit: "cup"})

        const flourIngredient = flour.children.ingredient[0] as CstNode
        expect(flourIngredient.name).toBe("ingredient")
        expect(flourIngredient.children.Word).toHaveLength(2)
        const flourIngredientTokens = flourIngredient.children.Word as Array<IToken>
        expect(flourIngredientTokens.map(tkn => tkn.image)).toEqual(["all-purpose", "flour"])

        // 1 tsp vanilla
        const vanilla = dough.children.ingredientItem[1] as CstNode
        expect(vanilla.name).toBe("ingredientItem")
        expect(vanilla.children.amount).toHaveLength(1)
        expect(vanilla.children.ingredient).toHaveLength(1)

        const vanillaAmount = vanilla.children.amount[0] as CstNode
        expect(vanillaAmount.name).toBe("amount")
        expect(vanillaAmount.children.Amount).toHaveLength(1)
        const vanillaAmountToken = vanillaAmount.children.Amount[0] as IToken
        expect(vanillaAmountToken.image).toBe("1 tsp")
        expect(vanillaAmountToken.payload).toEqual({quantity: [1, 1], unit: "tsp"})

        const vanillaIngredient = vanilla.children.ingredient[0] as CstNode
        expect(vanillaIngredient.name).toBe("ingredient")
        expect(vanillaIngredient.children.Word).toHaveLength(2)
        const vanillaIngredientTokens = vanillaIngredient.children.Word as Array<IToken>
        expect(vanillaIngredientTokens.map(tkn => tkn.image)).toEqual(["vanilla", "extract"])

        /* SAUCE SECTION */
        const sauce = ingredientSections[1] as CstNode
        expect(sauce.name).toBe("ingredientsSection")
        expect(sauce.children.SectionHeader).toHaveLength(1)
        expect(sauce.children.ingredientItem).toHaveLength(1)

        const sauceSection = sauce.children.SectionHeader[0] as IToken
        expect(sauceSection.image).toBe("sauce\n")
        expect(sauceSection.payload).toEqual({header: "sauce"})

        // 1 cup milk
        const milk = sauce.children.ingredientItem[0] as CstNode
        expect(milk.name).toBe("ingredientItem")
        expect(milk.children.amount).toHaveLength(1)
        expect(milk.children.ingredient).toHaveLength(1)

        const milkAmount = milk.children.amount[0] as CstNode
        expect(milkAmount.name).toBe("amount")
        expect(milkAmount.children.Amount).toHaveLength(1)
        const milkAmountToken = milkAmount.children.Amount[0] as IToken
        expect(milkAmountToken.image).toBe("1 cup")
        expect(milkAmountToken.payload).toEqual({quantity: [1, 1], unit: "cup"})

        const milkIngredient = milk.children.ingredient[0] as CstNode
        expect(milkIngredient.name).toBe("ingredient")
        expect(milkIngredient.children.Word).toHaveLength(1)
        const milkIngredientTokens = milkIngredient.children.Word as Array<IToken>
        expect(milkIngredientTokens.map(tkn => tkn.image)).toEqual(["milk"])

        /* STEPS PART */
        const stepsNode = cst.children.steps[0] as CstNode
        expect(stepsNode.name).toBe(STEPS_HEADER)

        const stepSections = stepsNode.children.stepsSection
        expect(stepSections).toHaveLength(2)

        /* STEPS - DOUGH */
        const stepsDough = stepSections[0] as CstNode
        expect(stepsDough.name).toBe("stepsSection")
        expect(stepsDough.children.SectionHeaderInStep).toHaveLength(1)
        expect(stepsDough.children.stepItem).toHaveLength(2)

        const doughStepsItems = stepsDough.children.stepItem as Array<CstNode>
        const doughStepOne = doughStepsItems[0] as CstNode
        expect((doughStepOne.children.stepListItemId[0] as CstNode).name).toBe("stepListItemId")
        const doughStepOneListItem = doughStepOne.children.stepListItemId[0] as CstNode
        expect((doughStepOneListItem.children.StepListItemId[0] as IToken).image).toBe("1.")

        const doughStepOneStepItem = (doughStepOne.children.step[0] as CstNode).children.Step as Array<IToken>
        expect(doughStepOneStepItem.map(tkn => tkn.image).join(" ")).toBe("first step for the Dough")

        const doughStepTwo = doughStepsItems[1] as CstNode
        expect((doughStepTwo.children.stepListItemId[0] as CstNode).name).toBe("stepListItemId")
        const doughStepTwoListItem = doughStepTwo.children.stepListItemId[0] as CstNode
        expect((doughStepTwoListItem.children.StepListItemId[0] as IToken).image).toBe("2.")

        const doughStepTwoStepItem = (doughStepTwo.children.step[0] as CstNode).children.Step as Array<IToken>
        expect(doughStepTwoStepItem.map(tkn => tkn.image).join(" ")).toBe("second step for the Dough")

        /* STEPS - SAUCE */
        const stepsSauce = stepSections[1] as CstNode
        expect(stepsSauce.name).toBe("stepsSection")
        expect(stepsSauce.children.SectionHeaderInStep).toHaveLength(1)
        expect(stepsSauce.children.stepItem).toHaveLength(2)

        const sauceStepsItems = stepsSauce.children.stepItem as Array<CstNode>
        const sauceStepOne = sauceStepsItems[0] as CstNode

        expect((sauceStepOne.children.stepListItemId[0] as CstNode).name).toBe("stepListItemId")
        expect(sauceStepOne.name).toBe("stepItem")
        const sauceStepOneListItem = sauceStepOne.children.stepListItemId[0] as CstNode
        expect((sauceStepOneListItem.children.StepListItemId[0] as IToken).image).toBe("1)")

        const sauceStepOneStepItem = (sauceStepOne.children.step[0] as CstNode).children.Step as Array<IToken>
        expect(sauceStepOneStepItem.map(tkn => tkn.image).join(" ")).toBe("saucy first step is a tough one")

        const sauceStepTwo = sauceStepsItems[1] as CstNode
        expect((sauceStepTwo.children.stepListItemId[0] as CstNode).name).toBe("stepListItemId")
        const sauceStepTwoListItem = sauceStepTwo.children.stepListItemId[0] as CstNode
        expect((sauceStepTwoListItem.children.StepListItemId[0] as IToken).image).toBe("* ")
        expect((sauceStepTwoListItem.children.StepListItemId[0] as IToken).payload.id).toBe("*")

        const sauceStepTwoStepItem = (sauceStepTwo.children.step[0] as CstNode).children.Step as Array<IToken>
        expect(sauceStepTwoStepItem.map(tkn => tkn.image).join(" ")).toBe("saucy2 second step is easy")
    })
    it("should be able to parse steps with punctuation", () => {
        const input = `Steps
Spice rub
1. 1 tbsp ground coriander
2. 1.25 tbsp ground sweet paprika
3. 1 tbsp ground cumin
4. 1.5 tbsp salt
5. 2 tbsp of New Mexico Chile powder or Chile powder of your choice
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
`
        const {parserInstance, cst} = parse(input)

        expect(cst.name).toBe("sections")
    })
})