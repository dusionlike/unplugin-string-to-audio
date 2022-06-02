import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { SpeechConfig, SpeechSynthesisOutputFormat, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk'
// import { createUnimport } from 'unimport'
// import $ from 'gogocode'
// import * as t from '@babel/types'
import copyStr2au from './copy-str2au-loader'

function synthesizeSpeech(text: string, _config: MyConfig) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const speechConfig = SpeechConfig.fromSubscription(_config.SubscriptionKey, _config.ServiceRegion)
    // 设置音频格式
    speechConfig.speechSynthesisOutputFormat = _config.outputFormat

    // const audioConfig = AudioConfig.fromAudioFileOutput(filePath);
    const synthesizer = new SpeechSynthesizer(speechConfig)

    let ssml: string
    if (/<.+>.*<\/.+>/s.test(text)) {
      ssml = text
    }
    else {
      if (_config.compiler.default) {
        ssml = _config.compiler.default(text)
      }
      else {
        ssml = `
                <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
                    <voice name="${_config.name}" style="${_config.style}">
                        ${text}
                    </voice>
                </speak>
                `
      }
    }
    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        synthesizer.close()
        if (result && result.audioData)
          resolve(result.audioData)
        else
          throw new Error('结果为空')
      },
      (error) => {
        reject(error)
        // console.log(error);
        synthesizer.close()
      },
    )
  })
}

const def_config = {
  /** 密钥 */
  SubscriptionKey: '',
  /** 区域代码 */
  ServiceRegion: '',
  /** 发音人 默认zh-CN-XiaoxiaoNeural */
  name: 'zh-CN-XiaoxiaoNeural',
  /** 说话风格 */
  style: 'customerservice',
  /** 输出文件类型 */
  outputFormat: SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3,
  /** 缓存文件的目录，由于create-react-app中限制了scr外的文件引入，所以这里要改成./src/auTem */
  temPath: './src/auTem',
  /** ile-loader是否开启了`esModule`，如果require返回{default:string}，则要设置成true */
  esModule: false,
  compiler: {} as Record<string, Function>,
  copyToCompilers: [] as string[],
}

type MyConfig = typeof def_config

let aumap: AuMap

type AuMap = Record<string, string>

export async function runStr2au(source: string, config: MyConfig) {
  config = { ...def_config, ...config }

  let strlist = source.match(/str2au\([^\)]+?\)/g)

  if (!strlist)
    return source

  if (config.copyToCompilers && config.copyToCompilers.length)
    source = copyStr2au(source, strlist, config.copyToCompilers)
  strlist = source.match(/str2au\([^\)]+?\)/g)
  if (!strlist)
    return source

  const temPath = config.temPath
  const auconfigPath = path.join(temPath, 'aumap.json')
  if (!aumap) {
    if (!fs.existsSync(auconfigPath)) {
      if (!fs.existsSync(temPath))
        fs.mkdirSync(temPath, { recursive: true })
      aumap = {}
    }
    else {
      aumap = JSON.parse(fs.readFileSync(auconfigPath, 'utf-8'))
    }
  }

  let rex = ''

  /** 文字转语音 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function str2au(str: string, compilerName?: string) {
    if (compilerName && !/<.+>.*<\/.+>/s.test(str))
      str = config.compiler[compilerName](str)

    return [
      str
        .replace(/[\t\r\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      compilerName,
    ]
  }

  for (const funStr of strlist) {
    // $(funStr)
    //   .find('str2au()')
    //   .each((item) => {
    //     const args = (item.attr('arguments') as t.Node[]).map((it) => {
    //       if (it.type === 'Identifier') {
    //         throw new Error('不支持动态赋值')
    //       }
    //       else if (it.type === 'TemplateLiteral') {
    //         if (it.expressions.length)
    //           throw new Error('不支持动态赋值')
    //         return it.quasis[0].value.raw
    //       }
    //       else if (it.type === 'StringLiteral') {
    //         return it.value
    //       }
    //       throw new Error('未知错误')
    //     })
    //     str2au(args[0], args[1])
    //     item.replaceBy()
    //   })
    rex = funStr
    // eslint-disable-next-line no-eval
    const [str, compilerName] = eval(funStr) as string[]

    if (!aumap[str] || !fs.existsSync(path.resolve(aumap[str]).replace(/\\/g, '/'))) {
      // runCount++;
      // console.log(str);
      const arr = await tryAgain(synthesizeSpeech)(str, config)
      const hs = md5(str)
      if (compilerName) {
        const ff = path.join(temPath, compilerName || '')
        if (!fs.existsSync(ff))
          fs.mkdirSync(ff)
      }
      const filePath = path.join(temPath, compilerName || '', `${hs}.mp3`)
      aumap[str] = filePath.replace(/\\/g, '/')
      /** 将mp3文件写入缓存 */
      fs.writeFileSync(filePath, Buffer.from(arr))
      /** 更新json文件 */
      fs.writeFileSync(auconfigPath, JSON.stringify(aumap, null, 2))
    }
    /** 文本替换 */
    // source = source.replace(rex, `require("${path.resolve(aumap[str]).replace(/\\/g, '/')}")${config.esModule ? '.default' : ''}`)

    const moduleName = `__${md5(aumap[str])}`
    // const { injectImports } = createUnimport({
    //   imports: [{ name: moduleName, from: path.resolve(aumap[str]).replace(/\\/g, '/') }],
    // })
    source = `import ${moduleName} from '${path.resolve(aumap[str]).replace(/\\/g, '/')}';${source.replace(rex, moduleName)}`
  }

  return source
}

function md5(str: string) {
  // 以md5的格式创建一个哈希值
  const hash = crypto.createHash('md5')
  return hash.update(str).digest('hex').substr(0, 8)
}

const sleep = (timeout: number) => new Promise(resolve => setTimeout(resolve, timeout))

function tryAgain<T extends Function>(fn: T, againCount = 3): T {
  const fn2 = async (...args: any[]): Promise<any> => {
    try {
      return await fn(...args)
    }
    catch (error) {
      console.error(error)
      againCount--
      if (againCount >= 0) {
        console.error(`文字转语音出错，正在重试第${3 - againCount}次`)
        await sleep(5000)
        return await fn2(...args)
      }
    }
  }
  return fn2 as unknown as T
}
