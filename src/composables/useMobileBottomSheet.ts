import { ref, computed, type Ref } from 'vue'
import {
  MOBILE_MAP_SHEET_MIN_HEIGHT_PX,
  MOBILE_MAP_SHEET_PEEK,
  MOBILE_SHEET_TAP_THRESHOLD_PX,
} from '@/constants/index.ts'

/** Drag + snap logic for the mobile map bottom sheet. */
export function useMobileBottomSheet(
  availableHeight: Ref<number>,
  snapFractions: Ref<number[]>,
  snapIndex: Ref<number>,
) {
  const isDragging = ref(false)
  const dragHeight = ref<number | null>(null)
  const pointerStartY = ref(0)
  const pointerStartHeight = ref(0)

  function heightForFraction(fraction: number) {
    if (availableHeight.value <= 0) return MOBILE_MAP_SHEET_MIN_HEIGHT_PX
    return Math.round(availableHeight.value * fraction)
  }

  const minHeight = computed(() => {
    const minFrac = Math.min(...snapFractions.value)
    return heightForFraction(minFrac)
  })

  const maxHeight = computed(() => {
    const maxFrac = Math.max(...snapFractions.value)
    return heightForFraction(maxFrac)
  })

  const targetHeight = computed(() => {
    if (availableHeight.value <= 0) return MOBILE_MAP_SHEET_MIN_HEIGHT_PX

    if (dragHeight.value !== null) {
      return Math.max(minHeight.value, Math.min(maxHeight.value, dragHeight.value))
    }

    const fraction = snapFractions.value[snapIndex.value]
      ?? snapFractions.value.at(-1)
      ?? MOBILE_MAP_SHEET_PEEK
    return heightForFraction(fraction)
  })

  function snapToNearest(height: number) {
    let nearestIndex = snapIndex.value
    let nearestDistance = Infinity

    snapFractions.value.forEach((fraction, index) => {
      const snapHeight = heightForFraction(fraction)
      const distance = Math.abs(snapHeight - height)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })

    snapIndex.value = nearestIndex
  }

  function onHandlePointerDown(event: PointerEvent) {
    isDragging.value = true
    pointerStartY.value = event.clientY
    pointerStartHeight.value = targetHeight.value
    dragHeight.value = pointerStartHeight.value
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    window.addEventListener('pointermove', onWindowPointerMove)
    window.addEventListener('pointerup', onWindowPointerUp)
    window.addEventListener('pointercancel', onWindowPointerUp)
  }

  function onWindowPointerMove(event: PointerEvent) {
    if (!isDragging.value) return
    const delta = pointerStartY.value - event.clientY
    dragHeight.value = Math.max(
      minHeight.value,
      Math.min(maxHeight.value, pointerStartHeight.value + delta),
    )
  }

  function onWindowPointerUp() {
    if (!isDragging.value) return
    isDragging.value = false
    window.removeEventListener('pointermove', onWindowPointerMove)
    window.removeEventListener('pointerup', onWindowPointerUp)
    window.removeEventListener('pointercancel', onWindowPointerUp)

    const currentHeight = dragHeight.value ?? targetHeight.value
    const moved = Math.abs(currentHeight - pointerStartHeight.value)
    dragHeight.value = null

    // Tap toggles between map peek and full map.
    if (moved < MOBILE_SHEET_TAP_THRESHOLD_PX) {
      snapIndex.value = snapIndex.value === 0 ? snapFractions.value.length - 1 : 0
      return
    }

    snapToNearest(currentHeight)
  }

  return {
    isDragging,
    targetHeight,
    onHandlePointerDown,
  }
}
