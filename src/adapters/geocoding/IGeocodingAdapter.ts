import type { GeocodingResult, GeoLocation, GeocodingSearchOptions } from '@/types/index.ts'

export type { GeocodingResult, GeoLocation, GeocodingSearchOptions }

/**
 * Common geocoding contract — all providers implement this interface.
 * Add a new provider by creating a class that implements IGeocodingAdapter
 * and registering it in adapters/registry.ts.
 */
export interface IGeocodingAdapter {
  search(query: string, options?: GeocodingSearchOptions): Promise<GeocodingResult[]>
  resolve(result: GeocodingResult, options?: GeocodingSearchOptions): Promise<GeoLocation>
}
