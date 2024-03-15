import { createFilter } from '@rollup/pluginutils'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { ProgramNode } from 'rollup'
import type { Options } from './types'
import { analyze } from './controller/analyze'
import { runStr2au } from './controller/core'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const filter = createFilter(['**/*.vue', '**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'], [/[/\\]node_modules[/\\]/, /[/\\]\.git[/\\]/, /[/\\]\.nuxt[/\\]/])
  return {
    name: 'unplugin-string-to-audio',
    transformInclude(id) {
      return filter(id)
    },
    async transform(code) {
      const ast = this.parse(code) as ProgramNode
      const analyzed = analyze(ast, code)
      if (!analyzed.callExpressionNodes.length)
        return code

      return await runStr2au(analyzed, options)
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
