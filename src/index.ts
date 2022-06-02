import { createUnplugin } from 'unplugin'
import { runStr2au } from './loader/string-to-audio-loader'
import type { Options } from './types'

export default createUnplugin<Options>(options => ({
  name: 'unplugin-string-to-audio',
  transformInclude(id) {
    return /(\.vue|\.ts|\.js|\.tsx|\.jsx)$/.test(id)
  },
  async transform(code) {
    return await runStr2au(code, options as any)
  },
}))
