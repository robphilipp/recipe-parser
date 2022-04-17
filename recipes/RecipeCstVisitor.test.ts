import {toAst} from "./RecipeCstVisitor";

describe("when creating an ast", () => {
    it("should work", () => {
        const result = toAst(`1 1/2 cp all-purpose flour
        1 tsp vanilla extract`)
        expect(true).toBeTruthy()
    })
})