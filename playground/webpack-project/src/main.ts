import { createApp } from 'vue'
import App from './App.vue'

const au = str2au('测试一下2')
console.warn(au)

createApp(App).mount('#app')
