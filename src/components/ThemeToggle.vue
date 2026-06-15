<script setup>
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/uiStore.js'

const uiStore = useUiStore()
const { darkMode } = storeToRefs(uiStore)
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-pressed="darkMode"
    @click="uiStore.toggleDarkMode()"
  >
    <i :class="['ti', darkMode ? 'ti-sun' : 'ti-moon']" aria-hidden="true" />
  </button>
</template>

<style lang="scss" scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: $control-size-sm;
  height: $control-size-sm;
  border-radius: $radius-pill;
  background: rgba($white, 0.15);
  color: rgba($white, 0.85);
  transition: background $transition-fast, color $transition-fast, transform $transition-fast;

  .ti {
    font-size: 1.125rem;
  }

  &:hover {
    background: rgba($white, 0.22);
    color: $white;
  }

  &:active {
    transform: scale(0.94);
  }
}
</style>
