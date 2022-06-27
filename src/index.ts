import { createFilter } from '@rollup/pluginutils'
import { createUnplugin } from 'unplugin'
import { runStr2au } from './loader/string-to-audio-loader'
import type { Options } from './types'
// import MagicString from 'magic-string'

export default createUnplugin<Options>((options, meta) => {
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
})
