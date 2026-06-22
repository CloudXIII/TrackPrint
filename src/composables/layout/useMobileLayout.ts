import { ref, computed, watch, onMounted, onUnmounted, nextTick, type Ref } from 'vue'
import {
  DESKTOP_BREAKPOINT,
  MOBILE_FORM_COLLAPSE_MS,
  MOBILE_MAP_SHEET_PEEK,
  MOBILE_MAP_SHEET_FULL,
  MOBILE_MAP_SHEET_PEEK_RESULTS_PX,
} from '@/constants/index.ts'

/** Mobile shell: breakpoint sync, sheet snap points, form/map transition state. */
export function useMobileLayout(
  showResults: Ref<boolean>,
  collapsed: Ref<boolean>,
) {
  const mobileShellRef = ref<HTMLElement | null>(null)
  const sheetSnapIndex = ref(0)
  const showMapSheet = ref(false)
  const mapSheetExiting = ref(false)
  const isMobile = ref(false)
  const mobileAvailableHeight = ref(0)
  const formReturning = ref(false)

  let mobileMediaQuery: MediaQueryList | null = null
  let mobileShellObserver: ResizeObserver | null = null
  let formReturningTimer: ReturnType<typeof setTimeout> | null = null

  const sheetSnapPoints = computed(() => {
    const resultsPhase = showResults.value || mapSheetExiting.value || formReturning.value
    if (resultsPhase && mobileAvailableHeight.value > 0) {
      return [
        MOBILE_MAP_SHEET_PEEK_RESULTS_PX / mobileAvailableHeight.value,
        MOBILE_MAP_SHEET_FULL,
      ]
    }
    return [MOBILE_MAP_SHEET_PEEK, MOBILE_MAP_SHEET_FULL]
  })

  const mapSheetCollapsed = computed(
    () => (showResults.value || mapSheetExiting.value) && sheetSnapIndex.value === 0,
  )

  const mobileResultsTransition = {
    enter: MOBILE_FORM_COLLAPSE_MS,
    leave: 0,
  } as const

  const mobileReturnPhase = computed(
    () => formReturning.value || mapSheetExiting.value,
  )

  const mobileContentSplit = computed(
    () => showResults.value || mobileReturnPhase.value,
  )

  function clearFormReturningTimer() {
    if (formReturningTimer) {
      clearTimeout(formReturningTimer)
      formReturningTimer = null
    }
  }

  function syncIsMobile(event?: MediaQueryListEvent) {
    isMobile.value = event ? !event.matches : !window.matchMedia(DESKTOP_BREAKPOINT).matches
  }

  function updateMobileAvailableHeight() {
    mobileAvailableHeight.value = mobileShellRef.value?.clientHeight ?? 0
  }

  function setupMobileShellObserver() {
    mobileShellObserver?.disconnect()
    if (!mobileShellRef.value) return

    mobileShellObserver = new ResizeObserver(updateMobileAvailableHeight)
    mobileShellObserver.observe(mobileShellRef.value)
    updateMobileAvailableHeight()
  }

  function onMapSheetExitComplete() {
    mapSheetExiting.value = false
    showMapSheet.value = false
  }

  watch(isMobile, async (mobile) => {
    if (mobile) {
      await nextTick()
      setupMobileShellObserver()
    } else {
      mobileShellObserver?.disconnect()
    }
  })

  watch(collapsed, (isCollapsed, wasCollapsed) => {
    if (!isMobile.value) return

    if (wasCollapsed && !isCollapsed) {
      formReturning.value = true
      clearFormReturningTimer()
      formReturningTimer = setTimeout(() => {
        formReturning.value = false
        formReturningTimer = null
      }, MOBILE_FORM_COLLAPSE_MS)
      return
    }

    if (isCollapsed) {
      formReturning.value = false
      clearFormReturningTimer()
    }
  })

  watch(showResults, (show) => {
    sheetSnapIndex.value = 0

    if (!isMobile.value) {
      showMapSheet.value = false
      mapSheetExiting.value = false
      return
    }

    if (show) {
      mapSheetExiting.value = false
      showMapSheet.value = true
    } else if (showMapSheet.value && !mapSheetExiting.value) {
      mapSheetExiting.value = true
    }
  })

  onMounted(() => {
    mobileMediaQuery = window.matchMedia(DESKTOP_BREAKPOINT)
    syncIsMobile()
    mobileMediaQuery.addEventListener('change', syncIsMobile)

    if (isMobile.value) {
      nextTick().then(setupMobileShellObserver)
    }
  })

  onUnmounted(() => {
    mobileMediaQuery?.removeEventListener('change', syncIsMobile)
    mobileShellObserver?.disconnect()
    clearFormReturningTimer()
  })

  return {
    mobileShellRef,
    sheetSnapIndex,
    showMapSheet,
    mapSheetExiting,
    isMobile,
    mobileAvailableHeight,
    sheetSnapPoints,
    mapSheetCollapsed,
    mobileResultsTransition,
    mobileReturnPhase,
    mobileContentSplit,
    onMapSheetExitComplete,
  }
}
