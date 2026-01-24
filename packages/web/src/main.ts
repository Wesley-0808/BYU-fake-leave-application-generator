import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App'
import './style.less'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
