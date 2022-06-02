import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import StringToAudio from '../../src/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), StringToAudio({
    /** 密钥 */
    SubscriptionKey: '2b195c5751be49a3a31530026c706a20',
    /** 区域代码 */
    ServiceRegion: 'eastasia',
    /** 发音人 默认zh-CN-XiaoxiaoNeural */
    // name: 'zh-CN-XiaoxiaoNeural',
    // name: 'zh-CN-XiaoyouNeural',
    /** 说话风格 默认customerservice(客服) */
    // style: 'customerservice',
    copyToCompilers: ['kefu', 'yunxi'],
    compiler: {
      kefu(text: string) {
        return `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
        <voice name="zh-CN-XiaoxiaoNeural" style="customerservice">
          <prosody rate="-10%">${text}</prosody>
        </voice>
    </speak>
        `
      },
      yunxi(text: string) {
        return `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
        <voice name="zh-CN-YunxiNeural">
            ${text}
        </voice>
    </speak>
        `
      },
    },
  })],
})
