import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { THEME_STORAGE_KEY } from '@/constants/index.ts'
import { useUiStore } from '@/stores/uiStore.ts'

function applyThemeToDom(isDark: boolean) {
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

/** Dark/light theme preference — DOM and localStorage side effects live here, not in the store. */
export function useTheme() {
  const uiStore = useUiStore()
  const { darkMode } = storeToRefs(uiStore)

  function setDarkMode(value: boolean) {
    uiStore.setDarkMode(value)
    applyThemeToDom(value)
    localStorage.setItem(THEME_STORAGE_KEY, value ? 'dark' : 'light')
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode.value)
  }

  function syncInitialState() {
    const isDark = document.documentElement.dataset.theme === 'dark'
    uiStore.setDarkMode(isDark)
  }

  return {
    darkMode,
    setDarkMode,
    toggleDarkMode,
    syncInitialState,
  }
}

/** Call once at app root to align Pinia with the theme set in main.ts before mount. */
export function useThemeInit() {
  const { syncInitialState } = useTheme()

  onMounted(() => {
    syncInitialState()
  })
}
