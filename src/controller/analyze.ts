import type { ProgramNode } from 'rollup'
import { walk } from 'estree-walker'
import type { CallExpression } from 'estree'

export interface Analyzed {
  ast: ProgramNode
  code: string
  callExpressionNodes: CallExpression[]
}

/**
 * str2au 语法分析器
 */
export function analyze(ast: ProgramNode, code: string): Analyzed {
  const callExpressionNodes = [] as CallExpression[]

  // 遍历语法树，找到所有的 str2au() 语句
  walk(ast, {
    enter(node) {
      if (node.type === 'CallExpression') {
        // 确定node 是 CallExpression 类型
        const callExpressionNode = node as CallExpression

        if (callExpressionNode.callee.type === 'Identifier' && callExpressionNode.callee.name === 'str2au')
          callExpressionNodes.push(callExpressionNode)
      }
    },
  })

  return { ast, code, callExpressionNodes }
}
