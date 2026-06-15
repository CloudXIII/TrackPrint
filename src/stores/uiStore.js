// [I] Components that only care about UI state (market toggle, collapsed form)
// never import tripStore and are never burdened by trip/result data.
import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_STORAGE_KEY = 'trackprint-theme'

function readInitialDarkMode() {
  return document.documentElement.dataset.theme === 'dark'
}

export const useUiStore = defineStore('ui', () => {
  const market           = ref('uk')   // 'uk' | 'eu'
  const collapsed        = ref(false)  // form card collapsed after Calculate
  const leftColumnHeight = ref(null)   // px — locked on first Calculate (desktop)
  const darkMode         = ref(readInitialDarkMode())

  function setMarket(m)      { market.value = m }
  function setCollapsed(val) { collapsed.value = val }

  function applyTheme(isDark) {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }

  function setDarkMode(value) {
    darkMode.value = value
    applyTheme(value)
    localStorage.setItem(THEME_STORAGE_KEY, value ? 'dark' : 'light')
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode.value)
  }

  /** Lock left-column height synchronously BEFORE collapse animation starts. */
  function lockLeftColumnHeight(h) {
    if (h > 0) leftColumnHeight.value = Math.round(h)
  }

  return {
    market, collapsed, leftColumnHeight, darkMode,
    setMarket, setCollapsed, lockLeftColumnHeight, setDarkMode, toggleDarkMode,
  }
})
