import { ref } from 'vue'
import {
  GEOCODING_BLUR_DELAY_MS,
  GEOCODING_DEBOUNCE_MS,
  GEOCODING_MIN_QUERY_LENGTH,
} from '@/constants/index.ts'
import { getGeocodingAdapter } from '@/adapters/registry.ts'
import { getShortLocationLabel } from '@/utils/locationLabel.ts'
import { randomUUID } from '@/utils/randomUUID.ts'
import type { GeocodingResult, GeoLocation } from '@/types/index.ts'

export function useLocationField() {
  const query = ref('')
  const selected = ref<GeoLocation | null>(null)
  const geocoding = createGeocodingSearch()

  let focused = false

  function handleFocus() {
    focused = true
  }

  function handleInput() {
    if (selected.value && query.value.trim() !== getShortLocationLabel(selected.value)) {
      selected.value = null
    }
    geocoding.searchLocations(query.value)
  }

  function handleBlur() {
    focused = false
    setTimeout(() => {
      if (!focused) geocoding.clearSuggestions()
    }, GEOCODING_BLUR_DELAY_MS)
  }

  async function selectSuggestion(suggestion: GeocodingResult) {
    const sessionToken = geocoding.getSessionToken()
    geocoding.clearSuggestions()

    try {
      const resolved = await getGeocodingAdapter().resolve(suggestion, { sessionToken })
      selected.value = resolved
      query.value = getShortLocationLabel(resolved)
      geocoding.error.value = null
      geocoding.renewSession()
    } catch (error) {
      geocoding.error.value = error instanceof Error ? error.message : 'Geocoding failed'
      selected.value = null
      geocoding.renewSession()
    }
  }

  async function resolveForSubmit(): Promise<GeoLocation | null> {
    if (selected.value?.lat != null && selected.value?.lon != null) {
      return selected.value
    }

    const trimmed = query.value.trim()
    if (!trimmed) return null

    try {
      geocoding.error.value = null
      const resolved = await getGeocodingAdapter().resolve({ label: trimmed })
      selected.value = resolved
      query.value = getShortLocationLabel(resolved)
      geocoding.renewSession()
      return resolved
    } catch (error) {
      geocoding.error.value = error instanceof Error ? error.message : 'Geocoding failed'
      return null
    }
  }

  function swapWith(other: ReturnType<typeof useLocationField>) {
    ;[selected.value, other.selected.value] = [other.selected.value, selected.value]
    ;[query.value, other.query.value] = [other.query.value, query.value]
  }

  return {
    query,
    selected,
    geocoding,
    handleFocus,
    handleInput,
    handleBlur,
    selectSuggestion,
    resolveForSubmit,
    swapWith,
  }
}

function createGeocodingSearch() {
  const suggestions = ref<GeocodingResult[]>([])
  const error = ref<string | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let sessionToken = randomUUID()

  function renewSession() {
    sessionToken = randomUUID()
  }

  function getSessionToken() {
    return sessionToken
  }

  async function searchLocations(text: string) {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (!text || text.trim().length < GEOCODING_MIN_QUERY_LENGTH) {
      suggestions.value = []
      return
    }

    debounceTimer = setTimeout(async () => {
      error.value = null
      try {
        suggestions.value = await getGeocodingAdapter().search(text.trim(), { sessionToken })
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Search failed'
        suggestions.value = []
      }
    }, GEOCODING_DEBOUNCE_MS)
  }

  function clearSuggestions() {
    if (debounceTimer) clearTimeout(debounceTimer)
    suggestions.value = []
  }

  return {
    suggestions,
    error,
    searchLocations,
    clearSuggestions,
    renewSession,
    getSessionToken,
  }
}
