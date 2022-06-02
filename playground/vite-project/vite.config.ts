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
  })],
})
