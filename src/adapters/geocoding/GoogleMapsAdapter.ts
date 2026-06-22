import type { IGeocodingAdapter, GeocodingSearchOptions } from '@/adapters/geocoding/IGeocodingAdapter.ts'
import type { GeocodingResult, GeoLocation } from '@/types/index.ts'
import { GEOCODING_SUGGESTION_LIMIT } from '@/constants/index.ts'
import {
  googlePlacesGet,
  googlePlacesPost,
} from '@/services/googleMaps/client.ts'

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      text?: { text?: string }
      structuredFormat?: { mainText?: { text?: string } }
      placeId?: string
    }
  }>
}

interface PlaceDetails {
  formattedAddress?: string
  displayName?: { text?: string }
  location?: { latitude: number; longitude: number }
}

interface PlacesSearchResponse {
  places?: PlaceDetails[]
}

export class GoogleMapsAdapter implements IGeocodingAdapter {
  /**
   * @param query - Place name or address.
   * @param options - Optional Google Places session token.
   * @returns Autocomplete suggestions (may include placeId without coordinates).
   */
  async search(query: string, options: GeocodingSearchOptions = {}): Promise<GeocodingResult[]> {
    const trimmed = query?.trim()
    if (!trimmed) return []

    const data = await googlePlacesPost<AutocompleteResponse>('v1/places:autocomplete', {
      input: trimmed,
      ...(options.sessionToken ? { sessionToken: options.sessionToken } : {}),
    })

    const limit = options.limit ?? GEOCODING_SUGGESTION_LIMIT

    return (data.suggestions ?? [])
      .map((item: { placePrediction?: { text?: { text?: string }; structuredFormat?: { mainText?: { text?: string } }; placeId?: string } }) => item.placePrediction)
      .filter(Boolean)
      .slice(0, limit)
      .map((prediction: NonNullable<AutocompleteResponse['suggestions']>[number]['placePrediction']) => ({
        label: prediction?.text?.text ?? prediction?.structuredFormat?.mainText?.text ?? '',
        placeId: prediction?.placeId,
      }))
      .filter((item) => Boolean(item.label)) as GeocodingResult[]
  }

  /**
   * @param result - Suggestion with placeId and/or coordinates.
   * @param options - Optional Google Places session token.
   * @returns Resolved location with coordinates.
   */
  async resolve(result: GeocodingResult, options: GeocodingSearchOptions = {}): Promise<GeoLocation> {
    if (result.lat != null && result.lon != null) {
      return { label: result.label, lat: result.lat, lon: result.lon }
    }

    if (result.placeId) {
      const place = await googlePlacesGet<PlaceDetails>(
        `v1/places/${encodeURIComponent(result.placeId)}`,
        'formattedAddress,location',
        options.sessionToken ? { sessionToken: options.sessionToken } : {},
      )

      if (!place?.location) throw new Error('Could not resolve selected place')

      return {
        label: place.formattedAddress ?? result.label,
        lat: place.location.latitude,
        lon: place.location.longitude,
      }
    }

    const textQuery = result.label?.trim()
    if (!textQuery) throw new Error('Location not found')

    const data = await googlePlacesPost<PlacesSearchResponse>(
      'v1/places:searchText',
      { textQuery },
      'places.formattedAddress,places.location',
    )

    const place = data.places?.[0]
    if (!place?.location) throw new Error('Location not found')

    return {
      label: place.formattedAddress ?? textQuery,
      lat: place.location.latitude,
      lon: place.location.longitude,
    }
  }
}
