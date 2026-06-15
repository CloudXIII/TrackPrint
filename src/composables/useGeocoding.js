import { ref } from 'vue'
import { search } from '@/services/geocoding/index.js'

export function useGeocoding() {
  const suggestions = ref([])
  const loading     = ref(false)
  const error       = ref(null)

  let debounceTimer = null

  async function searchLocations(query) {
    clearTimeout(debounceTimer)
    if (!query || query.trim().length < 2) {
      suggestions.value = []
      return
    }
    debounceTimer = setTimeout(async () => {
      loading.value = true
      error.value   = null
      try {
        suggestions.value = await search(query.trim())
      } catch (e) {
        error.value       = e.message
        suggestions.value = []
      } finally {
        loading.value = false
      }
    }, 320)
  }

  function clearSuggestions() {
    clearTimeout(debounceTimer)
    suggestions.value = []
  }

  return { suggestions, loading, error, searchLocations, clearSuggestions }
}
