import { ref, computed, watch, nextTick, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { MOBILE_MAP_SHEET_ENTRANCE_MS } from '@/constants/index.ts'

/** Entrance/exit height animation for the mobile map bottom sheet. */
export function useSheetHeightAnimation(
  targetHeight: ComputedRef<number>,
  entrance: Ref<boolean | undefined>,
  exiting: Ref<boolean | undefined>,
  onExitComplete: () => void,
) {
  const isHeightAnimating = ref(false)
  const animatedHeight = ref<number | null>(null)
  const layoutSettled = ref(!entrance.value)
  let heightAnimTimer: ReturnType<typeof setTimeout> | null = null

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
    runHeightAnimation(from, 0, onExitComplete)
  }

  watch(
    entrance,
    (enabled) => {
      if (enabled) startEntrance()
      else if (!exiting.value) {
        clearHeightAnimTimer()
        animatedHeight.value = null
        isHeightAnimating.value = false
        layoutSettled.value = true
      }
    },
    { immediate: true },
  )

  watch(exiting, (enabled) => {
    if (enabled) startExit()
  })

  onUnmounted(clearHeightAnimTimer)

  return { displayHeight, isHeightAnimating, layoutSettled }
}
