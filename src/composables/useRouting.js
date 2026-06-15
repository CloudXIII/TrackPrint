import { ref } from 'vue'
import { getRoute } from '@/services/routing/index.js'

export function useRouting() {
  const loading = ref(false)
  const error   = ref(null)

  async function fetchRoute(from, to) {
    loading.value = true
    error.value   = null
    try {
      return await getRoute(from, to)
    } catch (e) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchRoute }
}
