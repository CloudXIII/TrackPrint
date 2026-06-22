import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'leaflet/dist/leaflet.css'
import '@/assets/styles/main.scss'

import App from '@/App.vue'
import { THEME_STORAGE_KEY } from '@/constants/index.ts'

type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const initialTheme = getInitialTheme()
document.documentElement.dataset.theme = initialTheme
document.documentElement.style.colorScheme = initialTheme

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
