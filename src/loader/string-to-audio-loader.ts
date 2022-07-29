import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { SpeechConfig, SpeechSynthesisOutputFormat, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk'
// import { createUnimport } from 'unimport'
import $ from 'gogocode'
import type * as t from '@babel/types'

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
  converter: undefined,
}

export type MyConfig = typeof def_config

let aumap: AuMap

type AuMap = Record<string, string>

const getStrVal = (node: t.Node) => {
  if (node.type === 'Identifier') {
    throw new Error('不支持动态赋值')
  }
  else if (node.type === 'TemplateLiteral') {
    if (node.expressions.length)
      throw new Error('不支持动态赋值')
    return node.quasis[0].value.raw
  }
  else if (node.type === 'StringLiteral') {
    return node.value
  }
  throw new Error('未知错误')
}

export async function runStr2au(source: string, config: MyConfig, id = '') {
  const argsx: string[][] = []

  // 查找str2au方法调用，并获取其参数存下来
  let rootAst: $.GoGoAST
  let scriptAst: $.GoGoAST

  if (/\.vue/.test(id)) {
    rootAst = $(source, { parseOptions: { language: 'vue', sourceType: 'module' } })
    scriptAst = rootAst.find('<script></script>')
    if (!scriptAst.length)
      scriptAst = rootAst.find('<script setup></script>')
    if (!scriptAst.length) {
      rootAst = $(source, { parseOptions: { sourceType: 'module' } })
      scriptAst = rootAst
    }
    if (!scriptAst.length)
      return source
  }
  else {
    rootAst = $(source, { parseOptions: { sourceType: 'module' } })
    scriptAst = rootAst
  }

  const ast = scriptAst.find('str2au()')
    .each((item) => {
      const args = (item.attr('arguments') as t.Node[]).map((it) => {
        return getStrVal(it)
      })
      argsx.push(args)
    })

  // 不需要处理，直接返回
  if (!argsx.length)
    return source

  config = { ...def_config, ...config }

  // 建文件夹和aumap.json
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

  // 转换的音频路径
  const resList: (string | string[])[] = []

  async function getAudio(str: string, compilerName?: string) {
    str = str.replace(/[\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim()
    if (!aumap[str] || !fs.existsSync(path.resolve(aumap[str]).replace(/\\/g, '/'))) {
      const arr = await tryAgain(config.converter || synthesizeSpeech)(str, config)
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
    return str
  }

  for (const args of argsx) {
    const [str, compilerName] = args

    // 如果有compilerName，忽略copyToCompilers
    if (!compilerName && config.copyToCompilers.length) {
      const res: string[] = []
      for (const _compilerName of config.copyToCompilers) {
        const _str = config.compiler[_compilerName](str)
        res.push(await getAudio(_str, _compilerName))
      }
      resList.push(res)
    }
    else {
      resList.push(await getAudio(str, compilerName))
    }
  }

  const shuldImportList = new Set<string>()

  // 替换字符串
  ast.each((item, index) => {
    const res = resList[index]
    if (typeof res === 'string')
      item.replaceBy(getAudioModuleName(res))
    else
      item.replaceBy(`[${res.map(str => getAudioModuleName(str)).toString()}]`)
  })

  function getAudioModuleName(str: string) {
    const moduleName = `__${md5(aumap[str])}`
    shuldImportList.add(`import ${moduleName} from '${path.resolve(aumap[str]).replace(/\\/g, '/')}';`)
    return moduleName
  }

  // 写入import
  shuldImportList.forEach(item => scriptAst.before(item))
  return rootAst.generate()
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
