import {CstChildrenDictionary, CstNode, IToken} from "chevrotain";
import {parse, SelectParser} from "./SelectParser";

// a new parser instance with the concrete syntax tree (CST) output (enabled by default)
const parserInstance = new SelectParser()

// the base visitor class
const BaseSqlVisitor = parserInstance.getBaseCstVisitorConstructor<SelectParser, any>()

type SelectStatementContext = CstChildrenDictionary & {
    selectClause: Array<CstNode>
    fromClause: Array<CstNode>
    whereClause: Array<CstNode>
}

type SelectClauseContext = CstChildrenDictionary & {
    Select: Array<IToken>
    Identifier: Array<IToken>
}

type FromClauseContext = CstChildrenDictionary & {
    From: Array<IToken>
    Identifier: Array<IToken>
}

type WhereClauseContext = CstChildrenDictionary & {
    expression: Array<CstNode>
}

type ExpressionContext = CstChildrenDictionary & {
    lhs: Array<CstNode>
    relationalOperator: CstNode
    rhs: Array<CstNode>
}

type AtomicExpressionContext = CstChildrenDictionary & {
    Integer: Array<IToken>
    Identifier: Array<IToken>
}

type RelationalOperatorContext = CstChildrenDictionary & {
    GreaterThan: Array<IToken>
    LessThan: Array<IToken>
}


export class SqlToAstVisitor extends BaseSqlVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    selectStatement(ctx: SelectStatementContext) {
        // this.visit is used to visit non-terminal nodes (i.e. they have children) and
        // will invoke the correct visit method for each child CST node
        const select = this.visit(ctx.selectClause)

        // this.visit can work on either a CstNode or an Array<CstNodes>.
        const from = this.visit(ctx.fromClause)

        // this.visit will ignore empty arrays when the clause is optional
        const where = this.visit(ctx.whereClause)

        return {
            type: "SELECT_SMT",
            selectClause: select,
            fromClause: from,
            whereClause: where
        }
    }

    selectClause(ctx: SelectClauseContext) {
        const columns = ctx.Identifier.map((token: IToken) => token.image)

        return {
            type: "SELECT_CLAUSE",
            columns
        }
    }

    fromClause(ctx: FromClauseContext) {
        const tableName = ctx.Identifier[0].image

        return {
            type: "FROM_CLAUSE",
            table: tableName
        }
    }

    whereClause(ctx: WhereClauseContext) {
        const condition = this.visit(ctx.expression)
        return {
            type: "WHERE_CLAUSE",
            condition
        }
    }

    expression(ctx: ExpressionContext) {
        const lhs = this.visit(ctx.lhs[0])
        const operator = this.visit(ctx.relationalOperator)
        const rhs = this.visit(ctx.rhs[0])
        return {
            type: "EXPRESSION",
            lhs, operator, rhs
        }
    }

    atomicExpression(ctx: AtomicExpressionContext) {
        if (ctx.Integer) {
            return ctx.Integer[0].image
        }
        return ctx.Identifier[0].image
    }

    relationalOperator(ctx: RelationalOperatorContext) {
        if (ctx.GreaterThan) {
            return ctx.GreaterThan[0].image
        }
        return ctx.LessThan[0].image
    }
}

const toAstVisitorInstance = new SqlToAstVisitor()

export function toAst(input: string) {
    const {parserInstance, cst} = parse(input)
    // automatically creates the CST when parsing
    // const cst = parseResult.selectStatement()

    const ast = toAstVisitorInstance.visit(cst)
    return ast
}