import type { SpeechSynthesisOutputFormat } from 'microsoft-cognitiveservices-speech-sdk'

export interface Options {
  /** 密钥 */
  SubscriptionKey?: string
  /** 区域代码 */
  ServiceRegion?: string
  /** 发音人 默认zh-CN-XiaoxiaoNeural */
  name?: string
  /** 说话风格 */
  style?: string
  /** 输出文件类型 */
  outputFormat?: SpeechSynthesisOutputFormat
  /** 缓存文件的目录，由于create-react-app中限制了scr外的文件引入，所以这里要改成./src/auTem */
  temPath?: string
  /** ile-loader是否开启了`esModule`，如果require返回{default:string}，则要设置成true */
  esModule?: false
  compiler?: Record<string, Function>
  copyToCompilers?: string[]
  converter?: (text: string, options: Options) => Promise<Buffer>
}
