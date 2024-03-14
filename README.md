# unplugin-string-to-audio

## Why?

我们程序有时候需要播放一些引导语音，浏览器自带的文字转语音比较拉跨，调用在线的接口既不划算断网时也用不了，
所以需要将语音提前录下来放到资源文件里面，然后再代码里面引用文件路径播放，
但是这个操作太繁琐了，所以有了这个插件。

unplugin-string-to-audio 统一插件，使用unplugin，同时支持vite webpack，使用微软的[文本转语音](https://azure.microsoft.com/zh-cn/services/cognitive-services/text-to-speech/#features)接口，在打包过程中自动将字符串转换为语音文件并添加到最终的打包文件里面。

## 使用方法
安装
```bash
yarn add unplugin-string-to-audio -D
```
或者
```bash
npm i unplugin-string-to-audio -D
```

默认配置
```js
const options = {
  /** 密钥 */
  SubscriptionKey: '15459205df9c442f9cc71d26430fbbc0',
  /** 区域代码 */
  ServiceRegion: 'eastasia',
  /** 发音人 默认zh-CN-XiaoxiaoNeural */
  name: 'zh-CN-XiaoxiaoNeural',
  /** 说话风格 默认customerservice(客服) */
  style: 'cheerful',
  /** 缓存文件的目录，由于create-react-app中限制了scr外的文件引入，所以这里要改成./src/auTem */
  tmpPath: './src/auTem',
  /**
   * 自定义转换器，返回一个音频数据
   * (text, options) => Promise<Buffer>
   */
  converter: null
}
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import StringToAudio from 'unplugin-string-to-audio/vite'

export default defineConfig({
  plugins: [
    StringToAudio({ /* options */ }),
  ],
})
```

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import StringToAudio from 'unplugin-string-to-audio/rollup'

export default {
  plugins: [
    StringToAudio({ /* options */ }),
  ],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
const { default: StringToAudio } = require('unplugin-string-to-audio/webpack')

module.exports = {
  /* ... */
  plugins: [
    StringToAudio({ /* options */ })
  ]
}
```

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
const { default: StringToAudio } = require('unplugin-string-to-audio/webpack')

module.exports = {
  configureWebpack: {
    plugins: [
      StringToAudio({ /* options */ }),
    ],
  },
}
```

<br></details>

如果是使用typescript，可能需要添加声明
```
declare function str2au(text: string, compilerName?: string): string
```

然后代码中的`str2au('xxx')`会被转换成音频的路径

比如
```
let audio = new Audio()
audio.src = str2au('大家好')
audio.play()
```
=>
```
let audio = new Audio()
audio.src = require("xxx/auTem/xxxx.mp3")
audio.play()
```

然后就可以愉快地撸代码啦

## 语音合成标记语言 SSML

还可以使用语音合成标记语言 [SSML](https://docs.microsoft.com/zh-cn/azure/cognitive-services/speech-service/speech-synthesis-markup?tabs=csharp)来生成音频，如
：
```
audio.src = str2au(`
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
    <voice name="zh-CN-XiaoyouNeural">
        下次一定
    </voice>
    <voice name="zh-HK-HiuMaanNeural">
        下次也不一定
    </voice>
</speak>
`)
```

上述代码会生成前面是用`zh-CN-XiaoyouNeural`(童声)说的"下次一定"，后面用`zh-HK-HiuMaanNeural`(粤语)说的"下次也不一定".

## compiler 预处理器

compiler 允许注册一个预处理器，可以配合SSML使用，比如：

```
{
    /**密钥 */
    SubscriptionKey: 'xxxxxxxxxxxxxxxx',
    /**区域代码 */
    ServiceRegion: 'xxxx',
    ...
    compiler:{
      children(text){
          return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
          <voice name="zh-CN-XiaoyouNeural">
              ${text}
          </voice>
      </speak>
          `
      },
      yueyu(text){
          return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
          <voice name="zh-HK-HiuMaanNeural">
              ${text}
          </voice>
      </speak>
          `
      }
    }
}
```

然后在代码中就可以直接使用

```
// 第二个参数是配置时注册的预处理器
audio.src = str2au('大家好，我是小孩子', 'children')
// or
audio.src = str2au('大家好，我说的是粤语', 'yueyu')
```

> 名字为default的compiler会覆盖默认的配置

## 配置

|属性|说明|类型|可选值|默认值|
|:-:|:--|:--|:--|:--|
|**SubscriptionKey**|密钥|String|无|无|
|**ServiceRegion**|区域代码|String|无|无|
|**name**|发音人|String|见[神经语音](https://docs.microsoft.com/zh-cn/azure/cognitive-services/speech-service/language-support#neural-voices)|zh-CN-XiaoxiaoNeural|
|**style**|说话风格，默认customerservice(客服)|String|见[调整讲话风格](https://docs.microsoft.com/zh-cn/azure/cognitive-services/speech-service/speech-synthesis-markup?tabs=csharp#adjust-speaking-styles)|customerservice|
|**outputFormat**|输出文件类型|Number|见[Fields](https://docs.microsoft.com/zh-cn/javascript/api/microsoft-cognitiveservices-speech-sdk/speechsynthesisoutputformat?view=azure-node-latest#fields)|3|
|**temPath**|缓存文件的目录，由于create-react-app中限制了scr外的文件引入，所以这里要改成./src/auTem|String|-|./src/auTem|
|**esModule**|file-loader是否开启了`esModule`，如果require返回{default:string}，则要设置成true|Boolean|boolean|false|
|**compiler**|预处理器|Object|无|无|

## 注意

> 接口密钥可以去[微软azure](https://portal.azure.com/)申请，如果有一张visa或者万事达信用卡就能白嫖200美元额度，语音服务也有免费的定价，但是会有1分钟只能调用20次等限制。测试可以先用我建的免费的资源

```
{
  SubscriptionKey: '15459205df9c442f9cc71d26430fbbc0',
  /** 区域代码 */
  ServiceRegion: 'eastasia',
}
```

> 项目根目录`auTem`文件夹里面是语音缓存，当有缓存的时候就不会再调接口，请不要删掉它。

## License

[MIT](./LICENSE) License
