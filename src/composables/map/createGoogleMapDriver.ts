import { BRAND_COLORS } from '@/config/brandColors.ts'
import { GOOGLE_MAP_DARK_STYLES } from '@/config/googleMapStyles.ts'
import { GOOGLE_MARKET_VIEWS } from '@/config/mapViews.ts'
import {
  MAP_MARKER_RADIUS,
  MAP_MARKER_STROKE_WEIGHT,
  MAP_ROUTE_STROKE_OPACITY,
  MAP_ROUTE_STROKE_WEIGHT,
} from '@/constants/map.ts'
import { MAP_FIT_PADDING_PX, MAP_MIN_ZOOM_LOCATION } from '@/constants/index.ts'
import type { RouteMapDriver } from '@/composables/map/useRouteMapHost.ts'
import type { RouteMapDriverContext } from '@/composables/map/mapDriverContext.ts'
import { loadGoogleMapsJs } from '@/services/googleMaps/loader.ts'
import type { GeoLocation, RoutePoint } from '@/types/index.ts'
import type {
  GoogleLatLng,
  GoogleMapInstance,
  GoogleMapOverlay,
  GoogleMapsApi,
  GooglePolyline,
} from '@/types/google-maps.ts'

const FIT_PADDING = {
  top: MAP_FIT_PADDING_PX,
  right: MAP_FIT_PADDING_PX,
  bottom: MAP_FIT_PADDING_PX,
  left: MAP_FIT_PADDING_PX,
}

export interface GoogleMapDriverOptions extends RouteMapDriverContext {
  getMapHost: () => HTMLElement | null
  loadMaps?: () => Promise<unknown>
  getGoogleMaps?: () => GoogleMapsApi
}

function runWhenReady(fn: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn)
  })
}

function latLngFromPoint(point: RoutePoint | { lat: number; lng?: number; lon?: number }): GoogleLatLng {
  if (Array.isArray(point)) return { lat: point[0], lng: point[1] }
  return { lat: point.lat, lng: point.lng ?? point.lon! }
}

/** Google Maps route-map driver — no Vue dependencies; inject APIs for tests. */
export function createGoogleMapDriver(options: GoogleMapDriverOptions): RouteMapDriver {
  const {
    getMapHost,
    getPolyline,
    getFrom,
    getTo,
    getMarket,
    getDarkMode,
    loadMaps = loadGoogleMapsJs,
    getGoogleMaps = () => google!.maps as GoogleMapsApi,
  } = options

  let map: GoogleMapInstance | null = null
  let routePolyline: GooglePolyline | null = null
  let fromMarker: GoogleMapOverlay | null = null
  let toMarker: GoogleMapOverlay | null = null

  function gmaps(): GoogleMapsApi {
    return getGoogleMaps()
  }

  function whenMapReady(fn: (m: GoogleMapInstance) => void): void {
    runWhenReady(() => {
      if (!map) return
      ;(gmaps().event as unknown as { trigger: (m: unknown, e: string) => void }).trigger(map, 'resize')
      fn(map)
    })
  }

  function makeMarker(position: GoogleLatLng, fillColor: string): GoogleMapOverlay {
    const Marker = gmaps().Marker as new (opts: unknown) => GoogleMapOverlay
    return new Marker({
      position,
      map,
      icon: {
        path: (gmaps().SymbolPath as unknown as { CIRCLE: unknown }).CIRCLE,
        scale: MAP_MARKER_RADIUS,
        fillColor,
        fillOpacity: 1,
        strokeColor: BRAND_COLORS.markerRing,
        strokeWeight: MAP_MARKER_STROKE_WEIGHT,
      },
    })
  }

  function fitRouteView(): void {
    if (!map || !routePolyline) return
    const bounds = new (gmaps().LatLngBounds as new () => { extend: (ll: unknown) => void })()
    routePolyline.getPath().forEach((latLng: unknown) => bounds.extend(latLng))
    map.fitBounds(bounds, FIT_PADDING)
  }

  function clearRoute(): void {
    routePolyline?.setMap(null)
    fromMarker?.setMap(null)
    toMarker?.setMap(null)
    routePolyline = fromMarker = toMarker = null
  }

  function showMarketView(): void {
    if (!map || getPolyline().length) return
    const view = GOOGLE_MARKET_VIEWS[getMarket()] ?? GOOGLE_MARKET_VIEWS.uk
    map.setCenter(view.center)
    map.setZoom(view.zoom)
  }

  function drawRoute(coords: RoutePoint[]): void {
    if (!map || !coords?.length) return
    clearRoute()

    const path = coords.map(latLngFromPoint)
    const Polyline = gmaps().Polyline as new (opts: unknown) => GooglePolyline
    routePolyline = new Polyline({
      path,
      strokeColor: BRAND_COLORS.route,
      strokeWeight: MAP_ROUTE_STROKE_WEIGHT,
      strokeOpacity: MAP_ROUTE_STROKE_OPACITY,
      map,
    })

    const from = getFrom()
    if (from) {
      fromMarker = makeMarker({ lat: from.lat, lng: from.lon }, BRAND_COLORS.fromMarker)
    }

    const to = getTo()
    if (to) {
      toMarker = makeMarker({ lat: to.lat, lng: to.lon }, BRAND_COLORS.toMarker)
    }

    fitRouteView()
  }

  function focusLocation(loc: GeoLocation): void {
    if (!map) return
    map.setCenter({ lat: loc.lat, lng: loc.lon })
    map.setZoom(MAP_MIN_ZOOM_LOCATION)
  }

  function applyTheme(): void {
    if (!map) return
    map.setOptions({ styles: getDarkMode() ? GOOGLE_MAP_DARK_STYLES : [] })
  }

  return {
    async mount() {
      await loadMaps()

      const Map = gmaps().Map as new (el: HTMLElement | null, opts: unknown) => GoogleMapInstance
      map = new Map(getMapHost(), {
        center: GOOGLE_MARKET_VIEWS.uk.center,
        zoom: GOOGLE_MARKET_VIEWS.uk.zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        styles: getDarkMode() ? GOOGLE_MAP_DARK_STYLES : [],
      })
    },

    drawRoute,
    clearRoute,
    showMarketView,
    focusLocation,

    resize() {
      whenMapReady(() => {})
    },

    handleResize() {
      whenMapReady(() => {
        if (getPolyline().length) fitRouteView()
        else showMarketView()
      })
    },

    applyTheme,

    setInteractionEnabled(enabled: boolean) {
      whenMapReady((m) => {
        m.setOptions({
          gestureHandling: enabled ? 'greedy' : 'none',
          draggable: enabled,
          scrollwheel: enabled,
          disableDoubleClickZoom: !enabled,
        })
      })
    },

    destroy() {
      clearRoute()
      map = null
    },
  }
}
