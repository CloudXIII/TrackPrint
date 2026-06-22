import type { GeoLocation, MarketId, RoutePoint } from '@/types/index.ts'

/** Read-only trip/map inputs — plain getters so drivers stay testable without Vue. */
export interface RouteMapDriverContext {
  getPolyline: () => RoutePoint[]
  getFrom: () => GeoLocation | null
  getTo: () => GeoLocation | null
  getMarket: () => MarketId
  getDarkMode: () => boolean
}

export function routeMapDriverContextFromRefs(ctx: {
  polyline: { value: RoutePoint[] }
  from: { value: GeoLocation | null }
  to: { value: GeoLocation | null }
  market: { value: MarketId }
  darkMode: { value: boolean }
}): RouteMapDriverContext {
  return {
    getPolyline: () => ctx.polyline.value,
    getFrom: () => ctx.from.value,
    getTo: () => ctx.to.value,
    getMarket: () => ctx.market.value,
    getDarkMode: () => ctx.darkMode.value,
  }
}
