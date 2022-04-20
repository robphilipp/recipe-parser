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
        const {parserInstance, cst} = parse(`#dough#1 1/2 cp all-purpose flour\n1 tsp vanilla extract#sauce#\n1 cup milk`)

        expect(cst.name).toBe('ingredients')
        expect(cst.children).toBeDefined()
        expect(cst.children.ingredientItem).toBeDefined()
        expect(cst.children.ingredientItem).toHaveLength(3)
    })
})