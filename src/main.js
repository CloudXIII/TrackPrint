import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import 'leaflet/dist/leaflet.css'
import '@tabler/icons-webfont/dist/tabler-icons.css'
import '@/assets/styles/main.scss'

import App from '@/App.vue'

const THEME_STORAGE_KEY = 'trackprint-theme'

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const initialTheme = getInitialTheme()
document.documentElement.dataset.theme = initialTheme
document.documentElement.style.colorScheme = initialTheme

// Router is wired in for future extensibility.
// To add a new page: import a new view component and push to routes[].
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // When adding a second page, move the App layout to src/views/HomeView.vue
      // and replace App here with HomeView. Then add <RouterView /> to App.vue.
      component: { render: () => null },
    },
  ],
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
