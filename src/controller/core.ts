import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import { SpeechConfig, SpeechSynthesisOutputFormat, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk'
import MagicString from 'magic-string'
import YAML from 'yaml'
import type { AudioModule, Options } from '../types'
import type { Analyzed } from './analyze'
import { SimpleQueue } from './queue'

const def_config = {
  SubscriptionKey: '',
  ServiceRegion: '',
  name: 'zh-CN-XiaoxiaoNeural',
  style: 'customerservice',
  outputFormat: SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3,
  temPath: './src/auTem',
  audioModules: [{ name: 'default' }] as AudioModule[],
}

const queue = new SimpleQueue()

function saveCacheYml(filePath: string, data: Record<string, string>) {
  queue.addTask(async () => {
    let localData: Record<string, string> = {}
    if (fs.existsSync(filePath))
      localData = YAML.parse(await fs.promises.readFile(filePath, 'utf8')) || {}

    for (const key in data) {
      if (data[key] || localData[key] === undefined)
        localData[key] = data[key]
    }
    await fs.promises.writeFile(filePath, YAML.stringify(localData))
  })
}

export async function runStr2au(analyzed: Analyzed, options?: Options) {
  const ms = new MagicString(analyzed.code)

  const config = { ...def_config, ...options }

  const speechConfig = SpeechConfig.fromSubscription(config.SubscriptionKey, config.ServiceRegion)
  // 设置音频格式
  speechConfig.speechSynthesisOutputFormat = config.outputFormat

  const baseTemPath = config.temPath
  const auYamlDirMap = {} as { [key: string]: string }
  const auYamlMap = {} as { [key: string]: Record<string, string> }
  for (const audioModule of config.audioModules) {
    const auYamlDir = audioModule.name === 'default'
      ? baseTemPath
      : path.join(baseTemPath, audioModule.name)
    if (!fs.existsSync(auYamlDir))
      fs.mkdirSync(auYamlDir, { recursive: true })
    auYamlDirMap[audioModule.name] = auYamlDir
    const auYamlPath = path.join(auYamlDir, `${audioModule.name}.yaml`)
    if (!fs.existsSync(auYamlPath))
      auYamlMap[audioModule.name] = {}
    else
      auYamlMap[audioModule.name] = YAML.parse(await fs.promises.readFile(auYamlPath, 'utf8')) as Record<string, string> || {}
  }

  const audioSet = new Set<string>()

  for (const callExpressionNode of analyzed.callExpressionNodes) {
    if (callExpressionNode.arguments[0].type !== 'Literal')
      throw new Error('不支持动态赋值')

    const oriText = callExpressionNode.arguments[0].value
    if (typeof oriText !== 'string')
      throw new Error('参数类型错误')

    const audioList: string[] = []

    for (const audioModule of config.audioModules) {
      // 转换文字
      const currentText = audioModule.transformText
        ? await audioModule.transformText(oriText)
        : oriText

      let ssml = ''

      if (currentText) {
        if (audioModule.transformSSML) {
          ssml = await audioModule.transformSSML(currentText)
        }
        else {
          ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
            <voice name="${config.name}" style="${config.style}">
                ${currentText}
            </voice>
        </speak>
        `
        }
      }

      const auYamlDir = auYamlDirMap[audioModule.name]
      const auYaml = auYamlMap[audioModule.name]

      if (!auYaml[oriText]) {
        if (!ssml) {
          // 允许用户自定义空字符串
          auYaml[oriText] = ''
        }
        else {
          const dataPath = path.join(auYamlDir, `${md5(`${audioModule.name}_${currentText}`)}.mp3`)
          if (!fs.existsSync(dataPath)) {
            const audioData = await tryAgain(synthesizeSpeech)(ssml, speechConfig)
            await fs.promises.writeFile(dataPath, Buffer.from(audioData))
          }
          auYaml[oriText] = dataPath.split(/\\/g).join('/')
        }
      }

      audioList.push(auYaml[oriText])
    }

    // 最上方添加 import
    const importNameList = audioList.map((item) => {
      if (!item || item.startsWith('http:') || item.startsWith('data:') || item.startsWith('file:'))
        return `'${item}'`
      const moduleName = `__${md5(item)}`
      if (!audioSet.has(moduleName)) {
        audioSet.add(moduleName)
        ms.prepend(`import ${moduleName} from '${path.resolve(item).replace(/\\/g, '/')}'\n`)
      }
      return moduleName
    })

    // 替换代码
    const audioListStr = `[${importNameList.join(', ')}]`

    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    const { start, end } = callExpressionNode
    ms.overwrite(start, end, audioListStr)
  }

  // 保存yaml
  for (const audioModule of config.audioModules) {
    const auYamlDir = auYamlDirMap[audioModule.name]
    const auYaml = auYamlMap[audioModule.name]
    const auYamlPath = path.join(auYamlDir, `${audioModule.name}.yaml`)
    saveCacheYml(auYamlPath, auYaml)
  }

  return {
    code: ms.toString(),
    map: ms.generateMap({ hires: true }),
  }
}

function synthesizeSpeech(ssml: string, speechConfig: SpeechConfig) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const synthesizer = new SpeechSynthesizer(speechConfig)
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

function md5(str: string) {
  // 以md5的格式创建一个哈希值
  const hash = crypto.createHash('md5')
  return hash.update(str).digest('hex').slice(0, 16)
}

const sleep = (timeout: number) => new Promise(resolve => setTimeout(resolve, timeout))

// eslint-disable-next-line ts/no-unsafe-function-type
function tryAgain<T extends Function>(fn: T, againCount = 10): T {
  const fn2 = async (...args: any[]): Promise<any> => {
    try {
      return await fn(...args)
    }
    catch (error) {
      console.error(error)
      againCount--
      if (againCount >= 0) {
        console.error(`文字转语音出错，正在重试第${10 - againCount}次`)
        await sleep(5000)
        return await fn2(...args)
      }
    }
  }
  return fn2 as unknown as T
}
