<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  shellClass?: Record<string, boolean>
  loadError?: string | null
  showHint?: boolean
  showError?: boolean
}>()

const mapShell = ref<HTMLElement | null>(null)

defineExpose({ mapShell })
</script>

<template>
  <div class="route-map-shell" :class="shellClass">
    <div ref="mapShell" class="route-map">
      <slot name="map" />

      <div v-if="showError && loadError" class="route-map__error">
        <slot name="error" :message="loadError" />
      </div>

      <Transition name="fade">
        <div v-if="showHint" class="route-map__hint" aria-hidden="true">
          <slot name="hint" />
        </div>
      </Transition>
    </div>
  </div>
</template>
