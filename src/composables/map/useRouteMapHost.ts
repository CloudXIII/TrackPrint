import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouteMap } from '@/composables/map/useRouteMap.ts'
import { useMobileSheetContext } from '@/composables/map/useMobileSheetContext.ts'
import type { GeoLocation, RoutePoint } from '@/types/index.ts'

/**
 * Provider-specific map operations. The host composable depends only on this
 * abstraction (DIP), so the orchestration logic is shared across map providers.
 */
export interface RouteMapDriver {
  /** Create the underlying map; resolves once it is ready to draw on. */
  mount(): Promise<void> | void
  /** Render the route polyline and from/to markers, then frame the route. */
  drawRoute(coords: RoutePoint[]): void
  /** Remove the current route overlays. */
  clearRoute(): void
  /** Show the default regional view (used when there is no route). */
  showMarketView(): void
  /** Centre on a single picked location (used before a route exists). */
  focusLocation(loc: GeoLocation): void
  /** Recompute size only (e.g. the container collapsed/expanded). */
  resize(): void
  /** Recompute size and refit/recenter the current view (container resized). */
  handleResize(): void
  /** React to a dark-mode toggle. Optional: providers with reactive theming omit it. */
  applyTheme?(): void
  /** Enable or disable pan/zoom while the mobile sheet is collapsed. */
  setInteractionEnabled?(enabled: boolean): void
  /** Tear down the map and overlays. */
  destroy(): void
}

const DEFAULT_ERROR = 'Could not load the map'

/**
 * Shared lifecycle for route map components: waits for the shell to have a size,
 * mounts the provider via the driver, then keeps the view in sync with trip and
 * UI state. All provider specifics live in the driver passed by the component.
 */
export function useRouteMapHost(
  createDriver: (ctx: ReturnType<typeof useRouteMap>) => RouteMapDriver,
  getMapShell: () => HTMLElement | null,
) {
  const ctx = useRouteMap()
  const { polyline, from, market, darkMode, collapsed } = ctx
  const driver = createDriver(ctx)

  const mapReady = ref(false)
  const loadError = ref<string | null>(null)
  const { inSheet, layoutSettled: sheetLayoutSettled, overlay: sheetOverlay, mapInteractive: sheetMapInteractive } =
    useMobileSheetContext()

  const shellClass = computed(() => ({
    'route-map-shell--in-sheet': inSheet.value,
    'route-map-shell--sheet-overlay': sheetOverlay.value,
    'route-map-shell--interaction-locked': !sheetMapInteractive.value,
  }))

  let resizeObserver: ResizeObserver | null = null
  let mountObserver: ResizeObserver | null = null

  function shellHasSize() {
    const el = getMapShell()
    return Boolean(el && el.clientWidth > 0 && el.clientHeight > 0)
  }

  function refreshMapLayout() {
    if (!mapReady.value) return
    nextTick(() => {
      requestAnimationFrame(() => driver.handleResize())
    })
  }

  function renderCurrentView() {
    if (polyline.value.length) driver.drawRoute(polyline.value)
    else driver.showMarketView()
  }

  function attachResizeObserver() {
    const el = getMapShell()
    if (!el || resizeObserver) return

    resizeObserver = new ResizeObserver(() => {
      if (mapReady.value) driver.handleResize()
    })
    resizeObserver.observe(el)
  }

  async function tryMount() {
    if (mapReady.value || !shellHasSize()) return

    try {
      await driver.mount()
      mapReady.value = true
      mountObserver?.disconnect()
      mountObserver = null
      attachResizeObserver()
      renderCurrentView()
      driver.setInteractionEnabled?.(sheetMapInteractive.value)
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : DEFAULT_ERROR
    }
  }

  function attachMountObserver() {
    if (mapReady.value || !getMapShell()) return

    if (shellHasSize()) {
      void tryMount()
      return
    }

    mountObserver?.disconnect()
    const el = getMapShell()
    if (!el) return

    mountObserver = new ResizeObserver(() => void tryMount())
    mountObserver.observe(el)
  }

  watch(polyline, (coords) => {
    if (!mapReady.value) return
    if (!coords?.length) {
      driver.clearRoute()
      driver.showMarketView()
      return
    }
    driver.drawRoute(coords)
  })

  watch(from, (loc) => {
    if (!mapReady.value || polyline.value.length) return
    if (loc) driver.focusLocation(loc)
    else driver.showMarketView()
  })

  watch(market, () => {
    if (mapReady.value) driver.showMarketView()
  })

  watch(darkMode, () => {
    if (mapReady.value) driver.applyTheme?.()
  })

  watch(collapsed, () => {
    if (mapReady.value) driver.resize()
  })

  watch(sheetLayoutSettled, (settled) => {
    if (!settled) return
    refreshMapLayout()
  })

  watch(sheetMapInteractive, (interactive) => {
    if (mapReady.value) driver.setInteractionEnabled?.(interactive)
  })

  onMounted(() => {
    nextTick(() => attachMountObserver())
  })

  onUnmounted(() => {
    mountObserver?.disconnect()
    mountObserver = null
    resizeObserver?.disconnect()
    resizeObserver = null
    driver.destroy()
  })

  return { mapReady, loadError, polyline, from, to: ctx.to, market, darkMode, shellClass }
}
