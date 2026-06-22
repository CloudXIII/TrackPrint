import L from 'leaflet'
import { BRAND_COLORS } from '@/config/brandColors.ts'
import { LEAFLET_MARKET_VIEWS } from '@/config/mapViews.ts'
import {
  MAP_MARKER_RADIUS,
  MAP_MARKER_STROKE_WEIGHT,
  MAP_ROUTE_STROKE_OPACITY,
  MAP_ROUTE_STROKE_WEIGHT,
} from '@/constants/map.ts'
import { MAP_FIT_PADDING_PX, MAP_MIN_ZOOM_LOCATION, MAP_ROUTE_VIEW_DURATION_S } from '@/constants/index.ts'
import type { RouteMapDriver } from '@/composables/map/useRouteMapHost.ts'
import type { RouteMapDriverContext } from '@/composables/map/mapDriverContext.ts'
import type { GeoLocation, RoutePoint } from '@/types/index.ts'

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

export interface LeafletMapDriverOptions extends RouteMapDriverContext {
  getMap: () => L.Map | null
  /** Called by mount() — must resolve once Leaflet is ready to draw on. */
  beginMount: () => Promise<void>
}

function runWhenReady(fn: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn)
  })
}

/** Leaflet route-map driver — no Vue dependencies; map instance supplied via getMap. */
export function createLeafletMapDriver(options: LeafletMapDriverOptions): RouteMapDriver {
  const { getMap, getPolyline, getFrom, getTo, getMarket, beginMount } = options

  let routeLine: L.Polyline | null = null
  let fromMarker: L.CircleMarker | null = null
  let toMarker: L.CircleMarker | null = null
  let routeAnimating = false
  let pendingRefit = false

  function whenMapReady(fn: (map: L.Map) => void): void {
    runWhenReady(() => {
      const map = getMap()
      if (!map) return
      map.invalidateSize()
      fn(map)
    })
  }

  function clearRoute(): void {
    routeLine?.remove()
    fromMarker?.remove()
    toMarker?.remove()
    routeLine = fromMarker = toMarker = null
  }

  function showMarketView(): void {
    if (getPolyline().length) return
    const view = LEAFLET_MARKET_VIEWS[getMarket()] ?? LEAFLET_MARKET_VIEWS.uk
    whenMapReady((map) => {
      map.setView(view.center, view.zoom, { animate: false })
    })
  }

  function finishRouteAnimation(): void {
    routeAnimating = false
    if (!pendingRefit) return
    pendingRefit = false
    if (getPolyline().length) fitRouteView(false)
    else showMarketView()
  }

  function fitRouteView(animated = false): void {
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

  function makeCircleMarker(map: L.Map, lat: number, lon: number, fillColor: string): L.CircleMarker {
    return L.circleMarker([lat, lon], {
      radius: MAP_MARKER_RADIUS,
      fillColor,
      color: BRAND_COLORS.markerRing,
      weight: MAP_MARKER_STROKE_WEIGHT,
      fillOpacity: 1,
    }).addTo(map)
  }

  function drawRoute(coords: RoutePoint[]): void {
    const map = getMap()
    if (!map || !coords?.length) return
    clearRoute()

    routeLine = L.polyline(coords, {
      color: BRAND_COLORS.route,
      weight: MAP_ROUTE_STROKE_WEIGHT,
      opacity: MAP_ROUTE_STROKE_OPACITY,
    })
    routeLine.addTo(map)

    const from = getFrom()
    if (from) {
      fromMarker = makeCircleMarker(map, from.lat, from.lon, BRAND_COLORS.fromMarker)
    }

    const to = getTo()
    if (to) {
      toMarker = makeCircleMarker(map, to.lat, to.lon, BRAND_COLORS.toMarker)
    }

    fitRouteView(false)
  }

  function focusLocation(loc: GeoLocation): void {
    whenMapReady((map) => {
      map.setView([loc.lat, loc.lon], MAP_MIN_ZOOM_LOCATION, { animate: false })
    })
  }

  return {
    mount: beginMount,
    drawRoute,
    clearRoute,
    showMarketView,
    focusLocation,

    resize() {
      whenMapReady((map) => map.invalidateSize())
    },

    handleResize() {
      whenMapReady((map) => map.invalidateSize())
      if (routeAnimating) {
        pendingRefit = true
        return
      }
      if (getPolyline().length) fitRouteView(false)
      else showMarketView()
    },

    setInteractionEnabled(enabled: boolean) {
      whenMapReady((map) => {
        const handlers = [
          map.dragging,
          map.touchZoom,
          map.doubleClickZoom,
          map.scrollWheelZoom,
          map.boxZoom,
        ] as Array<{ enable(): void; disable(): void } | undefined>

        const tap = (map as L.Map & { tap?: { enable(): void; disable(): void } }).tap
        if (tap) handlers.push(tap)

        for (const handler of handlers) {
          if (!handler) continue
          if (enabled) handler.enable()
          else handler.disable()
        }
      })
    },

    destroy() {
      clearRoute()
      getMap()?.remove()
    },
  }
}
