import type { SpeechSynthesisOutputFormat } from 'microsoft-cognitiveservices-speech-sdk'

export interface AudioModule {
  name: string
  transformSSML?: (ssml: string) => string | Promise<string>
  transformText?: (text: string) => string | Promise<string>
}

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
  /** 模块 */
  audioModules?: AudioModule[]
}
