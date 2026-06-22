<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRouteMapHost } from '@/composables/useRouteMapHost.ts'
import { BRAND_COLORS } from '@/config/brandColors.ts'
import { GOOGLE_MAP_DARK_STYLES } from '@/config/googleMapStyles.ts'
import { GOOGLE_MARKET_VIEWS } from '@/config/mapViews.ts'
import { loadGoogleMapsJs } from '@/services/googleMaps/loader.ts'
import { MAP_FIT_PADDING_PX, MAP_MIN_ZOOM_LOCATION } from '@/constants/index.ts'
import TablerIcon from '@/components/TablerIcon.vue'
import type { GeoLocation, RoutePoint } from '@/types/index.ts'

type GoogleLatLng = { lat: number; lng: number }

interface GoogleMapOverlay {
  setMap(map: GoogleMapInstance | null): void
}

interface GooglePolyline extends GoogleMapOverlay {
  getPath(): { forEach: (fn: (latLng: unknown) => void) => void }
}

interface GoogleMapInstance {
  setCenter(center: GoogleLatLng): void
  setZoom(zoom: number): void
  setOptions(options: { styles?: readonly unknown[] }): void
  fitBounds(bounds: unknown, padding: { top: number; right: number; bottom: number; left: number }): void
}

const gmaps = () => google!.maps as Record<string, new (...args: unknown[]) => unknown> & Record<string, unknown>

const FIT_PADDING = {
  top: MAP_FIT_PADDING_PX,
  right: MAP_FIT_PADDING_PX,
  bottom: MAP_FIT_PADDING_PX,
  left: MAP_FIT_PADDING_PX,
}

const mapHost = ref<HTMLElement | null>(null)

const { mapShell, mapReady, loadError, polyline } = useRouteMapHost(({ polyline, from, to, market, darkMode }) => {
  let map: GoogleMapInstance | null = null
  let routePolyline: GooglePolyline | null = null
  let fromMarker: GoogleMapOverlay | null = null
  let toMarker: GoogleMapOverlay | null = null

  function latLngFromPoint(point: RoutePoint | { lat: number; lng?: number; lon?: number }) {
    if (Array.isArray(point)) return { lat: point[0], lng: point[1] }
    return { lat: point.lat, lng: point.lng ?? point.lon }
  }

  function whenMapReady(fn: (m: GoogleMapInstance) => void) {
    nextTick(() => {
      requestAnimationFrame(() => {
        if (!map) return
        ;(gmaps().event as unknown as { trigger: (m: unknown, e: string) => void }).trigger(map, 'resize')
        fn(map)
      })
    })
  }

  function makeMarker(position: GoogleLatLng, fillColor: string) {
    const Marker = gmaps().Marker as new (opts: unknown) => GoogleMapOverlay
    return new Marker({
      position,
      map,
      icon: {
        path: (gmaps().SymbolPath as unknown as { CIRCLE: unknown }).CIRCLE,
        scale: 8,
        fillColor,
        fillOpacity: 1,
        strokeColor: BRAND_COLORS.markerRing,
        strokeWeight: 2.5,
      },
    })
  }

  function fitRouteView() {
    if (!map || !routePolyline) return
    const bounds = new (gmaps().LatLngBounds as new () => { extend: (ll: unknown) => void })()
    routePolyline.getPath().forEach((latLng: unknown) => bounds.extend(latLng))
    map.fitBounds(bounds, FIT_PADDING)
  }

  function clearRoute() {
    routePolyline?.setMap(null)
    fromMarker?.setMap(null)
    toMarker?.setMap(null)
    routePolyline = fromMarker = toMarker = null
  }

  function showMarketView() {
    if (!map || polyline.value.length) return
    const view = GOOGLE_MARKET_VIEWS[market.value] ?? GOOGLE_MARKET_VIEWS.uk
    map.setCenter(view.center)
    map.setZoom(view.zoom)
  }

  function drawRoute(coords: RoutePoint[]) {
    if (!map || !coords?.length) return
    clearRoute()

    const path = coords.map(latLngFromPoint)
    const Polyline = gmaps().Polyline as new (opts: unknown) => GooglePolyline
    routePolyline = new Polyline({
      path,
      strokeColor: BRAND_COLORS.route,
      strokeWeight: 4,
      strokeOpacity: 0.85,
      map,
    })

    if (from.value) {
      fromMarker = makeMarker({ lat: from.value.lat, lng: from.value.lon }, BRAND_COLORS.fromMarker)
    }

    if (to.value) {
      toMarker = makeMarker({ lat: to.value.lat, lng: to.value.lon }, BRAND_COLORS.toMarker)
    }

    fitRouteView()
  }

  function focusLocation(loc: GeoLocation) {
    if (!map) return
    map.setCenter({ lat: loc.lat, lng: loc.lon })
    map.setZoom(MAP_MIN_ZOOM_LOCATION)
  }

  function applyTheme() {
    if (!map) return
    map.setOptions({ styles: darkMode.value ? GOOGLE_MAP_DARK_STYLES : [] })
  }

  function resize() {
    whenMapReady(() => {})
  }

  function handleResize() {
    whenMapReady(() => {
      if (polyline.value.length) fitRouteView()
      else showMarketView()
    })
  }

  async function mount() {
    await loadGoogleMapsJs()

    const Map = gmaps().Map as new (el: HTMLElement | null, opts: unknown) => GoogleMapInstance
    map = new Map(mapHost.value, {
      center: GOOGLE_MARKET_VIEWS.uk.center,
      zoom: GOOGLE_MARKET_VIEWS.uk.zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      styles: darkMode.value ? GOOGLE_MAP_DARK_STYLES : [],
    })
  }

  function destroy() {
    clearRoute()
    map = null
  }

  return { mount, drawRoute, clearRoute, showMarketView, focusLocation, resize, handleResize, applyTheme, destroy }
})
</script>

<template>
  <div class="route-map-shell">
    <div ref="mapShell" class="route-map">
      <div ref="mapHost" class="route-map__map" role="region" aria-label="Trip route map" />

      <div v-if="loadError" class="route-map__error">
        <TablerIcon name="alert-circle" :size="18" />
        <span>{{ loadError }}</span>
      </div>

      <Transition name="fade">
        <div v-if="mapReady && !polyline.length && !loadError" class="route-map__hint" aria-hidden="true">
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

  &__hint,
  &__error {
    position: absolute;
    bottom: $space-4;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-3;
    border-radius: $radius-pill;
    box-shadow: $shadow-sm;
    z-index: 2;
    max-width: calc(100% - #{$space-6});
    text-align: center;
  }

  &__hint {
    background: rgba($white, 0.92);
    pointer-events: none;
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

  &__error {
    background: rgba($white, 0.96);
    color: $gray-600;
    font-size: $text-sm;

    .tabler-icon {
      flex-shrink: 0;
      color: $green-700;
    }
  }
}
</style>
