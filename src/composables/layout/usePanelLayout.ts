import { ref, computed, onMounted, onUnmounted, nextTick, type Ref, type ComponentPublicInstance } from 'vue'
import { DESKTOP_BREAKPOINT } from '@/constants/index.ts'
import { useFormCollapse } from '@/composables/layout/useFormCollapse.ts'
import { useTripState } from '@/composables/trip/useTripState.ts'

/** Desktop panel height sync and results visibility — layout concern only. */
export function usePanelLayout(tripFormRef: Ref<ComponentPublicInstance | null>) {
  const { collapsed } = useFormCollapse()
  const { hasResults } = useTripState()

  const leftColumnHeight = ref<number | null>(null)
  const isDesktop = ref(false)
  let mediaQuery: MediaQueryList | null = null

  const showResults = computed(
    () => hasResults.value && collapsed.value,
  )

  const isPanelFixed = computed(
    () => isDesktop.value && leftColumnHeight.value !== null,
  )

  const panelsStyle = computed(() => {
    if (!isPanelFixed.value) return {}
    return { '--panel-height': `${leftColumnHeight.value}px` }
  })

  const leftColumnClass = computed(() => ({
    'layout-column--split': showResults.value,
  }))

  function measureFormHeight(): number {
    const el = tripFormRef.value?.$el as HTMLElement | undefined
    if (!el) return 0
    return el.offsetHeight
  }

  async function syncPanelHeight() {
    if (!isDesktop.value) return
    await nextTick()
    await nextTick()
    const height = measureFormHeight()
    if (height > 0 && !leftColumnHeight.value) {
      leftColumnHeight.value = Math.round(height)
    }
  }

  function lockColumnHeight() {
    if (!leftColumnHeight.value) syncPanelHeight()
  }

  async function onMediaChange(event: MediaQueryListEvent) {
    isDesktop.value = event.matches
    if (event.matches) await syncPanelHeight()
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT)
    isDesktop.value = mediaQuery.matches
    mediaQuery.addEventListener('change', onMediaChange)
    requestAnimationFrame(() => syncPanelHeight())
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', onMediaChange)
  })

  return {
    showResults,
    isPanelFixed,
    panelsStyle,
    leftColumnClass,
    lockColumnHeight,
  }
}
