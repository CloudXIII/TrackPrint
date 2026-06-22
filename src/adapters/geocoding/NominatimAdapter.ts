import type { IGeocodingAdapter, GeocodingSearchOptions } from '@/adapters/geocoding/IGeocodingAdapter.ts'
import type { GeocodingResult, GeoLocation } from '@/types/index.ts'
import {
  GEOCODING_SUGGESTION_LIMIT,
  NOMINATIM_API_BASE,
} from '@/constants/index.ts'

const SEARCH_BASE = `${NOMINATIM_API_BASE}/search`

const nominatimHeaders = {
  'Accept-Language': 'en',
}

export class NominatimAdapter implements IGeocodingAdapter {
  /**
   * @param query - Place name or address.
   * @returns Up to `limit` suggestions with label and coordinates.
   */
  async search(query: string, options: GeocodingSearchOptions = {}): Promise<GeocodingResult[]> {
    const trimmed = query?.trim()
    if (!trimmed) return []

    const limit = options.limit ?? GEOCODING_SUGGESTION_LIMIT
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      limit: String(limit),
      addressdetails: '1',
    })

    const res = await fetch(`${SEARCH_BASE}?${params}`, {
      headers: nominatimHeaders,
    })
    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

    const data = await res.json()
    return data.map(({ display_name, lat, lon }: { display_name: string; lat: string; lon: string }) => ({
      label: display_name,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    }))
  }

  /**
   * @param result - Suggestion or free-text label.
   * @returns Resolved location with coordinates.
   */
  async resolve(result: GeocodingResult): Promise<GeoLocation> {
    if (result.lat != null && result.lon != null) {
      return { label: result.label, lat: result.lat, lon: result.lon }
    }

    const query = result.label?.trim()
    if (!query) throw new Error('Location not found')

    const results = await this.search(query, { limit: 1 })
    if (!results.length || results[0].lat == null || results[0].lon == null) {
      throw new Error('Location not found')
    }

    return {
      label: results[0].label,
      lat: results[0].lat,
      lon: results[0].lon,
    }
  }
}
