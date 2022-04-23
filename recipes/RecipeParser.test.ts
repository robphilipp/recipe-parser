import {parse} from "./RecipeParser";
import {CstElement, CstNode, IToken} from "chevrotain";

describe("when parsing a recipe", () => {
    it("should work", () => {
        const {parserInstance, cst} = parse("1 1/2 cp all purpose flour")
        // expect(result.tokens.map(token => token.image)).toEqual(["1 1/2 cp", "all", "purpose", "flour"])
        // // the payload holds the actual unit calculated from the text
        // expect(result.tokens[0].payload).toEqual({quantity: [3, 2], unit: 'cup'})

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
        const {parserInstance, cst} = parse(`1 1/2 cp all-purpose flour\n1 tsp vanilla extract`)

        expect(true).toBeTruthy()
        expect(cst).toBeDefined()
        expect(cst.name).toBe('ingredients')
        expect(cst.children).toBeDefined()
        expect(cst.children.ingredientItem).toBeDefined()
        expect(cst.children.ingredientItem).toHaveLength(2)
    })
    it("should work for multiple items and sections", () => {
        const {
            parserInstance,
            cst
        } = parse(`1 lb sugar#dough\n1 1/2 cp all-purpose flour\n1 tsp vanilla extract#sauce#\n1 cup milk`)

        expect(cst.name).toBe('ingredients')
        expect(cst.children).toBeDefined()
        expect(cst.children.ingredientItem).toBeDefined()
        expect(cst.children.ingredientItem).toHaveLength(1)

        /* INGREDIENT without a section */
        const ingredientItemNode = cst.children.ingredientItem[0] as CstNode
        expect(ingredientItemNode.name).toBe("ingredientItem")
        expect(ingredientItemNode.children.amount).toHaveLength(1)
        expect(ingredientItemNode.children.ingredient).toHaveLength(1)
        expect(cst.children.section).toHaveLength(2)

        /* DOUGH SECTION */
        const dough = cst.children.section[0] as CstNode
        expect(dough.name).toBe("section")
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
        const sauce = cst.children.section[1] as CstNode
        expect(sauce.name).toBe("section")
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
        // const {parserInstance, cst} = parse(`1 lb sugar\ndough me\n1 1/2 cp all-purpose flour\n1 tsp vanilla extract\nsauce\n1 cup milk\n`)
        const {parserInstance, cst} = parse(`1 lb sugar
dough me
1 1/2 cp all-purpose flour
1 tsp vanilla extract
sauce
1 cup milk`
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
        expect(cst.children.section).toHaveLength(2)

        /* DOUGH SECTION */
        const dough = cst.children.section[0] as CstNode
        expect(dough.name).toBe("section")
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
        const sauce = cst.children.section[1] as CstNode
        expect(sauce.name).toBe("section")
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

    })
    it("should work for sections containing items", () => {
        // const {parserInstance, cst} = parse(`1 lb sugar\ndough me\n1 1/2 cp all-purpose flour\n1 tsp vanilla extract\nsauce\n1 cup milk\n`)
        const {parserInstance, cst} = parse(`dough me
1 1/2 cp all-purpose flour
1 tsp vanilla extract
sauce
1 cup milk`
        )

        expect(cst.name).toBe('ingredients')
        expect(cst.children).toBeDefined()

        /* DOUGH SECTION */
        const dough = cst.children.section[0] as CstNode
        expect(dough.name).toBe("section")
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
        const sauce = cst.children.section[1] as CstNode
        expect(sauce.name).toBe("section")
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

    })
})