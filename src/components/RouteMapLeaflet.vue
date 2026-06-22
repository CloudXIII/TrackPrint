<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import L from 'leaflet'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import { useRouteMapHost } from '@/composables/useRouteMapHost.ts'
import { BRAND_COLORS } from '@/config/brandColors.ts'
import { LEAFLET_MARKET_VIEWS, OSM_TILE_ATTRIBUTION, OSM_TILE_URLS } from '@/config/mapViews.ts'
import { MAP_FIT_PADDING_PX, MAP_MIN_ZOOM_LOCATION, MAP_ROUTE_VIEW_DURATION_S } from '@/constants/index.ts'
import TablerIcon from '@/components/TablerIcon.vue'
import type { GeoLocation, RoutePoint } from '@/types/index.ts'

const MARKET_VIEWS = LEAFLET_MARKET_VIEWS

const MAP_INIT = {
  center: [...MARKET_VIEWS.uk.center] as [number, number],
  zoom:   MARKET_VIEWS.uk.zoom,
}

const ROUTE_VIEW_ANIM = {
  padding: [MAP_FIT_PADDING_PX, MAP_FIT_PADDING_PX] as [number, number],
  animate: true,
  duration: MAP_ROUTE_VIEW_DURATION_S,
  easeLinearity: 0.22,
}

const VIEW_INSTANT = {
  padding: [MAP_FIT_PADDING_PX, MAP_FIT_PADDING_PX] as [number, number],
  animate: false,
}

const mapRef = ref<{ leafletObject?: L.Map } | null>(null)
const mountReady = ref(false)
let resolveReady: (() => void) | null = null

function onMapReady() {
  resolveReady?.()
  resolveReady = null
}

const { mapShell, polyline, darkMode } = useRouteMapHost(({ polyline, from, to, market }) => {
  let routeLine: L.Polyline | null = null
  let fromMarker: L.CircleMarker | null = null
  let toMarker: L.CircleMarker | null = null
  let routeAnimating = false
  let pendingRefit = false

  function getMap(): L.Map | null {
    return mapRef.value?.leafletObject as L.Map | null ?? null
  }

  function whenMapReady(fn: (map: L.Map) => void) {
    nextTick(() => {
      requestAnimationFrame(() => {
        const map = getMap()
        if (!map) return
        map.invalidateSize()
        fn(map)
      })
    })
  }

  function clearRoute() {
    routeLine?.remove()
    fromMarker?.remove()
    toMarker?.remove()
    routeLine = fromMarker = toMarker = null
  }

  function showMarketView() {
    if (polyline.value.length) return
    const view = MARKET_VIEWS[market.value] ?? MARKET_VIEWS.uk
    whenMapReady((map) => {
      map.setView(view.center, view.zoom, { animate: false })
    })
  }

  function finishRouteAnimation() {
    routeAnimating = false
    if (!pendingRefit) return
    pendingRefit = false
    if (polyline.value.length) fitRouteView(false)
    else showMarketView()
  }

  function fitRouteView(animated = false) {
    if (!routeLine) return
    const line = routeLine
    const opts = animated ? ROUTE_VIEW_ANIM : VIEW_INSTANT
    if (animated) routeAnimating = true
    whenMapReady((map) => {
      map.fitBounds(line.getBounds(), opts)
      if (animated) {
        setTimeout(finishRouteAnimation, ROUTE_VIEW_ANIM.duration * 1000 + 50)
      }
    })
  }

  function makeCircleMarker(map: L.Map, lat: number, lon: number, fillColor: string) {
    return L.circleMarker([lat, lon], {
      radius:      8,
      fillColor,
      color:       BRAND_COLORS.markerRing,
      weight:      2.5,
      fillOpacity: 1,
    }).addTo(map)
  }

  function drawRoute(coords: RoutePoint[]) {
    const map = getMap()
    if (!map || !coords?.length) return
    clearRoute()

    routeLine = L.polyline(coords, { color: BRAND_COLORS.route, weight: 4, opacity: 0.85 })
    routeLine.addTo(map)

    if (from.value) {
      fromMarker = makeCircleMarker(map, from.value.lat, from.value.lon, BRAND_COLORS.fromMarker)
    }

    if (to.value) {
      toMarker = makeCircleMarker(map, to.value.lat, to.value.lon, BRAND_COLORS.toMarker)
    }

    fitRouteView(false)
  }

  function focusLocation(loc: GeoLocation) {
    whenMapReady((map) => {
      map.setView([loc.lat, loc.lon], MAP_MIN_ZOOM_LOCATION, { animate: false })
    })
  }

  function resize() {
    whenMapReady((map) => map.invalidateSize())
  }

  function handleResize() {
    whenMapReady((map) => map.invalidateSize())
    if (routeAnimating) {
      pendingRefit = true
      return
    }
    if (polyline.value.length) fitRouteView(false)
    else showMarketView()
  }

  function mount() {
    return new Promise<void>((resolve) => {
      resolveReady = resolve
      mountReady.value = true
    })
  }

  function destroy() {
    clearRoute()
    getMap()?.remove()
  }

  return { mount, drawRoute, clearRoute, showMarketView, focusLocation, resize, handleResize, destroy }
})

const tileUrl = computed(() => OSM_TILE_URLS[darkMode.value ? 'dark' : 'light'])
const tileAttribution = computed(() => OSM_TILE_ATTRIBUTION[darkMode.value ? 'dark' : 'light'])
</script>

<template>
  <div class="route-map-shell">
    <div ref="mapShell" class="route-map">
      <LMap
        v-if="mountReady"
        ref="mapRef"
        class="route-map__map"
        :zoom="MAP_INIT.zoom"
        :center="MAP_INIT.center"
        :options="{ zoomControl: true, attributionControl: true }"
        @ready="onMapReady"
      >
        <LTileLayer
          :key="tileUrl"
          :url="tileUrl"
          :attribution="tileAttribution"
          layer-type="base"
          name="Base map"
        />
      </LMap>

      <Transition name="fade">
        <div v-if="!polyline.length" class="route-map__hint" aria-hidden="true">
          <TablerIcon name="route" :size="18" />
          <span>Calculate a trip to see your route</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.route-map-shell {
  height: 100%;
  min-height: 0;
  border-radius: $radius-xl;
  box-shadow: $shadow-panel;

  @media (min-width: $bp-tablet) {
    min-height: 240px;
  }
}

.route-map {
  position: relative;
  border-radius: $radius-xl;
  overflow: hidden;
  background: $gray-100;
  height: 100%;
  min-height: 0;

  @media (min-width: $bp-tablet) {
    min-height: 240px;
  }

  &__map {
    width: 100%;
    height: 100%;
  }

  &__hint {
    position: absolute;
    bottom: $space-4;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-3;
    border-radius: $radius-pill;
    background: rgba($white, 0.92);
    box-shadow: $shadow-sm;
    pointer-events: none;
    z-index: 1000;
    white-space: nowrap;

    .tabler-icon {
      font-size: 1rem;
      color: $green-500;
    }

    span {
      font-size: $text-sm;
      color: $gray-600;
    }
  }
}
</style>

<style lang="scss">
/* Leaflet panes render outside scoped boundaries — target via shell wrapper. */
.route-map-shell .leaflet-pane   { z-index: 1; }
.route-map-shell .leaflet-top,
.route-map-shell .leaflet-bottom { z-index: 2; }
</style>
