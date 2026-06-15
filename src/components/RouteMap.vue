<script setup>
import { ref, watch, onUnmounted, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import L from 'leaflet'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import { useTripStore } from '@/stores/tripStore.js'
import { useUiStore } from '@/stores/uiStore.js'
import { BRAND_COLORS } from '@/config/brandColors.js'

const tripStore = useTripStore()
const uiStore   = useUiStore()
const { polyline, from, to } = storeToRefs(tripStore)
const { darkMode, market, collapsed } = storeToRefs(uiStore)

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
}

const TILE_ATTRIBUTION = {
  light: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
  dark:  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
}

const MARKET_VIEWS = {
  uk: { center: [54.0, -2.5], zoom: 6 },
  eu: { center: [50.5, 9.5],  zoom: 5 },
}

// Static props only — vue-leaflet re-applies reactive center/zoom and overrides
// imperative fitBounds / setView calls made elsewhere.
const MAP_INIT = {
  center: [...MARKET_VIEWS.uk.center],
  zoom:   MARKET_VIEWS.uk.zoom,
}

const ROUTE_VIEW_ANIM = {
  padding: [32, 32],
  animate: true,
  duration: 1.25,
  easeLinearity: 0.22,
}

const VIEW_INSTANT = {
  padding: [32, 32],
  animate: false,
}

const tileUrl = computed(() => TILE_URLS[darkMode.value ? 'dark' : 'light'])

const tileAttribution = computed(() => TILE_ATTRIBUTION[darkMode.value ? 'dark' : 'light'])

const mapRef   = ref(null)
const mapShell = ref(null)
const mapReady = ref(false)

let routeLine  = null
let fromMarker = null
let toMarker   = null
let resizeObserver = null
let routeAnimating = false

function getMap() {
  return mapRef.value?.leafletObject ?? null
}

function whenMapReady(fn) {
  nextTick(() => {
    requestAnimationFrame(() => {
      const map = getMap()
      if (!map) return
      map.invalidateSize()
      fn(map)
    })
  })
}

function clearOverlays() {
  routeLine?.remove()
  fromMarker?.remove()
  toMarker?.remove()
  routeLine = fromMarker = toMarker = null
}

function setMarketView() {
  if (polyline.value.length) return
  const view = MARKET_VIEWS[market.value] ?? MARKET_VIEWS.uk
  whenMapReady((map) => {
    map.setView(view.center, view.zoom, { animate: false })
  })
}

function fitRouteView(animated = false) {
  if (!routeLine) return
  const opts = animated ? ROUTE_VIEW_ANIM : VIEW_INSTANT
  if (animated) routeAnimating = true
  whenMapReady((map) => {
    map.fitBounds(routeLine.getBounds(), opts)
    if (animated) {
      setTimeout(() => { routeAnimating = false }, ROUTE_VIEW_ANIM.duration * 1000 + 50)
    }
  })
}

function makeCircleMarker(map, lat, lon, fillColor) {
  return L.circleMarker([lat, lon], {
    radius:      8,
    fillColor,
    color:       BRAND_COLORS.markerRing,
    weight:      2.5,
    fillOpacity: 1,
  }).addTo(map)
}

function drawRoute(coords) {
  const map = getMap()
  if (!map || !coords?.length) return
  clearOverlays()

  routeLine = L.polyline(coords, { color: BRAND_COLORS.route, weight: 4, opacity: 0.85 })
  routeLine.addTo(map)

  if (from.value) {
    fromMarker = makeCircleMarker(map, from.value.lat, from.value.lon, BRAND_COLORS.fromMarker)
  }

  if (to.value) {
    toMarker = makeCircleMarker(map, to.value.lat, to.value.lon, BRAND_COLORS.toMarker)
  }

  fitRouteView(true)
}

function attachResizeObserver() {
  const el = mapShell.value
  if (!el || resizeObserver) return

  resizeObserver = new ResizeObserver(() => {
    if (!mapReady.value) return
    whenMapReady((map) => map.invalidateSize())
    if (routeAnimating) return
    if (polyline.value.length) fitRouteView()
    else setMarketView()
  })
  resizeObserver.observe(el)
}

function onMapReady() {
  mapReady.value = true
  attachResizeObserver()

  if (polyline.value.length) drawRoute(polyline.value)
  else setMarketView()
}

watch(polyline, (coords) => {
  if (!mapReady.value) return
  if (!coords?.length) {
    clearOverlays()
    setMarketView()
    return
  }
  drawRoute(coords)
})

watch(from, (loc) => {
  if (!mapReady.value || polyline.value.length) return
  if (loc) {
    whenMapReady((map) => {
      map.setView([loc.lat, loc.lon], 10, { animate: false })
    })
  } else {
    setMarketView()
  }
})

watch(market, () => {
  if (!mapReady.value) return
  setMarketView()
})

watch(collapsed, () => {
  if (!mapReady.value) return
  whenMapReady((map) => map.invalidateSize())
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  clearOverlays()
  getMap()?.remove()
})
</script>

<template>
  <div class="route-map-shell">
    <div ref="mapShell" class="route-map">
      <LMap
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
          <i class="ti ti-route" />
          <span>Enter a trip to see your route</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.route-map-shell {
  height: 100%;
  min-height: 240px;
  border-radius: $radius-xl;
  box-shadow: $shadow-panel;

  @media (min-width: $bp-tablet) {
    min-height: 0;
  }
}

.route-map {
  position: relative;
  border-radius: $radius-xl;
  overflow: hidden;
  background: $gray-100;
  height: 100%;
  min-height: 240px;

  @media (min-width: $bp-tablet) {
    min-height: 0;
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

    .ti {
      font-size: 1rem;
      color: $green-500;
    }

    span {
      font-size: $text-sm;
      color: $gray-600;
    }
  }
}

:deep(.leaflet-pane)   { z-index: 1; }
:deep(.leaflet-top),
:deep(.leaflet-bottom) { z-index: 2; }
</style>
