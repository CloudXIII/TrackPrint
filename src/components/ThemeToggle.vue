<script setup lang="ts">
import { useTheme } from '@/composables/useTheme.ts'
import TablerIcon from '@/components/TablerIcon.vue'

const { darkMode, toggleDarkMode } = useTheme()
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-pressed="darkMode"
    @click="toggleDarkMode"
  >
    <TablerIcon :name="darkMode ? 'sun' : 'moon'" :size="18" />
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

  &:hover {
    background: rgba($white, 0.22);
    color: $white;
  }

  &:active {
    transform: scale(0.94);
  }
}
</style>
