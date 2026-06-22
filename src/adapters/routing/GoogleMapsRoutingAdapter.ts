import type { IRoutingAdapter } from '@/adapters/routing/IRoutingAdapter.ts'
import type { GeoLocation, RouteResult } from '@/types/index.ts'
import { METRES_PER_KM, SECONDS_PER_MINUTE } from '@/constants/index.ts'

import {
  googleRoutesFetch,
  parseDurationSeconds,
} from '@/services/googleMaps/client.ts'
import { decodePolyline } from '@/utils/decodePolyline.ts'

interface RoutesResponse {
  routes?: Array<{
    distanceMeters: number
    duration: string
    polyline?: { encodedPolyline?: string }
  }>
}

export class GoogleMapsRoutingAdapter implements IRoutingAdapter {
  /**
   * @param from - Departure coordinates.
   * @param to - Destination coordinates.
   * @returns Route with distance (km), duration (min), and decoded polyline.
   */
  async getRoute(from: GeoLocation, to: GeoLocation): Promise<RouteResult> {
    const data = await googleRoutesFetch<RoutesResponse>(
      'directions/v2:computeRoutes',
      {
        origin: {
          location: { latLng: { latitude: from.lat, longitude: from.lon } },
        },
        destination: {
          location: { latLng: { latitude: to.lat, longitude: to.lon } },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
        computeAlternativeRoutes: false,
        languageCode: 'en',
        units: 'METRIC',
      },
      'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
    )

    const route = data.routes?.[0]
    const encoded = route?.polyline?.encodedPolyline

    if (!route || !encoded) {
      throw new Error('No route found between these locations')
    }

    return {
      distanceKm: route.distanceMeters / METRES_PER_KM,
      durationMin: Math.round(parseDurationSeconds(route.duration) / SECONDS_PER_MINUTE),
      polyline: decodePolyline(encoded),
      encodedPolyline: encoded,
    }
  }
}
