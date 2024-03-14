import { createFilter } from '@rollup/pluginutils'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import { runStr2au } from './loader/string-to-audio-loader'
import type { Options } from './types'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const filter = createFilter(['**/*.vue', '**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'], [/[/\\]node_modules[/\\]/, /[/\\]\.git[/\\]/, /[/\\]\.nuxt[/\\]/])
  return {
    name: 'unplugin-string-to-audio',
    transformInclude(id) {
      return filter(id)
    },
    async transform(code, id) {
      return await runStr2au(code, options as any, id)
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
