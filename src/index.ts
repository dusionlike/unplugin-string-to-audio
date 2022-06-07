import { createUnplugin } from 'unplugin'
import { runStr2au } from './loader/string-to-audio-loader'
import type { Options } from './types'

export default createUnplugin<Options>((options, meta) => {
  return {
    name: 'unplugin-string-to-audio',
    transformInclude(id) {
      // 排除node_modules
      if (id.includes('node_modules'))
        return false
      return /(\.vue|\.ts|\.js|\.tsx|\.jsx)$/.test(id)
    },
    async transform(code, id) {
      if (meta.framework === 'webpack') {
        if (/\.vue$/.test(id))
          return code
        if (/\.vue\?vue&type=script/.test(id)) {
          const jscodes = code.match(/(?<=<script.*?>)([\s\S]+?)(?=<\/script>)/img)
          if (jscodes?.length) {
            for (const jscode of jscodes) {
              const resCode = await runStr2au(jscode, options as any)
              code = code.replace(jscode, () => resCode)
            }
          }
          return code
        }
        else if (/\.vue\?vue/.test(id)) {
          return code
        }
      }

      return await runStr2au(code, options as any)
    },
  }
})
