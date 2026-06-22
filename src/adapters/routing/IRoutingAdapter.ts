import type { GeoLocation, RouteResult } from '@/types/index.ts'

export type { GeoLocation, RouteResult }

/** Common routing contract — register new providers in adapters/registry.ts. */
export interface IRoutingAdapter {
  getRoute(from: GeoLocation, to: GeoLocation): Promise<RouteResult>
}
