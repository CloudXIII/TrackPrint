<script setup lang="ts">
import { ref, computed, toRef, watch, nextTick, onUnmounted, provide } from 'vue'
import { MOBILE_MAP_SHEET_ENTRANCE_MS, MOBILE_MAP_SHEET_LAYOUT_READY_KEY } from '@/constants/index.ts'
import { useMobileBottomSheet } from '@/composables/useMobileBottomSheet.ts'
import TablerIcon from '@/components/TablerIcon.vue'

const snapIndex = defineModel<number>({ default: 0 })

const props = defineProps<{
  snapPoints: number[]
  availableHeight: number
  /** Show route-map invite on the handle (results phase). */
  invite?: boolean
  /** Map fills the sheet behind the handle (collapsed results peek). */
  overlayContent?: boolean
  /** Animate height from 0 to the peek snap point on mount. */
  entrance?: boolean
  /** Animate height down to 0 before unmount (return to config). */
  exiting?: boolean
}>()

const emit = defineEmits<{
  exitComplete: []
}>()

const availableHeight = toRef(props, 'availableHeight')
const snapPoints = toRef(props, 'snapPoints')

const {
  isDragging,
  targetHeight,
  onHandlePointerDown,
} = useMobileBottomSheet(availableHeight, snapPoints, snapIndex)

const isHeightAnimating = ref(false)
const animatedHeight = ref<number | null>(null)
let heightAnimTimer: ReturnType<typeof setTimeout> | null = null

/** Flips true when the sheet entrance height animation has settled — triggers a map refit. */
const layoutSettled = ref(!props.entrance)
provide(MOBILE_MAP_SHEET_LAYOUT_READY_KEY, layoutSettled)

const peekHeight = computed(() => {
  if (!snapPoints.value.length || availableHeight.value <= 0) return 0
  const minFrac = Math.min(...snapPoints.value)
  return Math.round(availableHeight.value * minFrac)
})

const displayHeight = computed(() => {
  if (animatedHeight.value !== null) return animatedHeight.value
  return targetHeight.value
})

function clearHeightAnimTimer() {
  if (heightAnimTimer) {
    clearTimeout(heightAnimTimer)
    heightAnimTimer = null
  }
}

function runHeightAnimation(from: number, to: number, onComplete?: () => void) {
  clearHeightAnimTimer()
  isHeightAnimating.value = true
  animatedHeight.value = from

  void nextTick().then(() => {
    requestAnimationFrame(() => {
      animatedHeight.value = to
    })
  })

  heightAnimTimer = setTimeout(() => {
    heightAnimTimer = null
    animatedHeight.value = null
    isHeightAnimating.value = false
    onComplete?.()
  }, MOBILE_MAP_SHEET_ENTRANCE_MS)
}

function startEntrance() {
  layoutSettled.value = false
  runHeightAnimation(0, targetHeight.value, () => {
    layoutSettled.value = true
  })
}

function startExit() {
  const from = animatedHeight.value ?? targetHeight.value
  runHeightAnimation(from, 0, () => emit('exitComplete'))
}

watch(
  () => props.entrance,
  (enabled) => {
    if (enabled) startEntrance()
    else if (!props.exiting) {
      clearHeightAnimTimer()
      animatedHeight.value = null
      isHeightAnimating.value = false
      layoutSettled.value = true
    }
  },
  { immediate: true },
)

watch(
  () => props.exiting,
  (enabled) => {
    if (enabled) startExit()
  },
)

onUnmounted(clearHeightAnimTimer)
</script>

<template>
  <div
    class="mobile-bottom-sheet"
    :class="{
      'mobile-bottom-sheet--dragging': isDragging,
      'mobile-bottom-sheet--invite': invite,
      'mobile-bottom-sheet--overlay': overlayContent,
      'mobile-bottom-sheet--animating': isHeightAnimating,
    }"
    :style="{
      height: `${displayHeight}px`,
      '--sheet-peek-height': `${peekHeight}px`,
    }"
  >
    <div
      class="mobile-bottom-sheet__handle"
      role="separator"
      aria-orientation="horizontal"
      :aria-label="invite ? 'Swipe up to view your route on the map' : 'Drag up to view the route map'"
      @pointerdown="onHandlePointerDown"
    >
      <span class="mobile-bottom-sheet__grip" aria-hidden="true" />

      <div v-if="invite" class="mobile-bottom-sheet__invite">
        <TablerIcon name="map" :size="16" class="mobile-bottom-sheet__invite-icon" />
        <span class="mobile-bottom-sheet__invite-text">Swipe up to see your route</span>
        <TablerIcon name="chevron-up" :size="16" class="mobile-bottom-sheet__invite-chevron" />
      </div>
    </div>

    <div class="mobile-bottom-sheet__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mobile-bottom-sheet {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border-radius: $radius-xl $radius-xl 0 0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.14);
  transition: height 280ms cubic-bezier(0.4, 0, 0.2, 1);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  overflow: hidden;

  &--animating:not(.mobile-bottom-sheet--dragging) {
    transition: height 420ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  &--dragging {
    transition: none;
  }

  &--invite {
    box-shadow: 0 -4px 24px rgba($green-700, 0.18);

    &:not(.mobile-bottom-sheet--dragging) .mobile-bottom-sheet__grip {
      animation: sheet-grip-bounce 2.4s ease-in-out infinite;
    }

    &:not(.mobile-bottom-sheet--dragging) .mobile-bottom-sheet__invite-chevron {
      animation: sheet-chevron-nudge 2.4s ease-in-out infinite;
    }
  }

  &--overlay {
    position: relative;

    .mobile-bottom-sheet__content {
      position: absolute;
      inset: 0;
      z-index: 0;
      // Keep the map at peek size while the sheet height animates from 0.
      min-height: var(--sheet-peek-height, 0);

      :deep(.leaflet-control-zoom),
      :deep(.leaflet-control-attribution),
      :deep(.gm-style-cc),
      :deep(.gm-bundled-control),
      :deep(gmp-internal-camera-control) {
        display: none !important;
      }

      :deep(.route-map__hint) {
        display: none;
      }

      :deep(.route-map-shell),
      :deep(.route-map) {
        filter: blur(6px);
        transform: scale(1.015);
      }
    }

    .mobile-bottom-sheet__handle {
      position: relative;
      z-index: 1;
      background: var(--surface-sheet-handle-overlay);
      border-bottom: none;
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(8px);
    }
  }

  &__handle {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-1;
    padding: $space-2 $space-4;
    cursor: grab;
    touch-action: none;
    user-select: none;
    background: var(--surface-sheet-handle);
    border-bottom: 1px solid var(--border-subtle);

    &:active {
      cursor: grabbing;
    }
  }

  &__grip {
    display: block;
    width: 40px;
    height: 4px;
    border-radius: $radius-pill;
    background: $green-500;
  }

  &__invite {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    width: 100%;
    max-width: 100%;
    padding: 0 $space-1;
  }

  &__invite-icon {
    flex-shrink: 0;
    color: var(--text-brand);
  }

  &__invite-text {
    font-size: $text-xs;
    font-weight: 600;
    color: var(--text-brand);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__invite-chevron {
    flex-shrink: 0;
    color: $green-500;
  }

  &__content {
    flex: 1;
    min-height: 0;
    overflow: hidden;

    :deep(.route-map-shell),
    :deep(.route-map) {
      transition: filter 220ms ease, transform 220ms ease;
      will-change: filter, transform;
    }

    :deep(.route-map-shell) {
      height: 100%;
      min-height: 0;
      border-radius: 0;
      box-shadow: none;
    }

    :deep(.route-map) {
      height: 100%;
      min-height: 0;
      border-radius: 0;
    }
  }
}

@keyframes sheet-grip-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@keyframes sheet-chevron-nudge {
  0%, 100% { transform: translateY(0); opacity: 0.7; }
  50% { transform: translateY(-3px); opacity: 1; }
}
</style>
