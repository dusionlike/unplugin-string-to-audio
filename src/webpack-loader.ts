import type { LoaderDefinitionFunction } from 'webpack'
import { runStr2au } from './loader/string-to-audio-loader'

const loader = function (source) {
  if (typeof source !== 'string')
    return source
  const option = this.getOptions()
  return runStr2au(source, option as any)
} as LoaderDefinitionFunction

export default loader
