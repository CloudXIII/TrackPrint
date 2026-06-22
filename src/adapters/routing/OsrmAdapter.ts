import type { IRoutingAdapter } from '@/adapters/routing/IRoutingAdapter.ts'
import type { GeoLocation, RouteResult } from '@/types/index.ts'
import { METRES_PER_KM, OSRM_BASE_URL, SECONDS_PER_MINUTE } from '@/constants/index.ts'

export class OsrmAdapter implements IRoutingAdapter {
  /**
   * @param from - Departure coordinates.
   * @param to - Destination coordinates.
   * @returns Route with distance (km), duration (min), and GeoJSON polyline.
   */
  async getRoute(from: GeoLocation, to: GeoLocation): Promise<RouteResult> {
    const url = `${OSRM_BASE_URL}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`OSRM error: ${res.status}`)

    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('No route found between these locations')
    }

    const route = data.routes[0]
    return {
      distanceKm: route.distance / METRES_PER_KM,
      durationMin: Math.round(route.duration / SECONDS_PER_MINUTE),
      polyline: route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]),
    }
  }
}
