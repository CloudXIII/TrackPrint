import { DEFAULT_MARKET } from '@/constants/index.ts'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MarketId } from '@/types/index.ts'

export const useUiStore = defineStore('ui', () => {
  const market = ref<MarketId>(DEFAULT_MARKET as MarketId)
  const collapsed = ref(false)
  const darkMode = ref(false)

  function setMarket(value: MarketId) {
    market.value = value
  }

  function setCollapsed(value: boolean) {
    collapsed.value = value
  }

  function setDarkMode(value: boolean) {
    darkMode.value = value
  }

  return {
    market,
    collapsed,
    darkMode,
    setMarket,
    setCollapsed,
    setDarkMode,
  }
})
