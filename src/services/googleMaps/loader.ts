let loadPromise: Promise<Record<string, unknown>> | null = null

export function loadGoogleMapsJs(): Promise<Record<string, unknown>> {
  if (google?.maps) {
    return Promise.resolve(google.maps)
  }

  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
    if (!key) {
      loadPromise = null
      reject(new Error('VITE_GOOGLE_MAPS_KEY is required when using Google Maps'))
      return
    }

    const callbackName = '__trackprintGoogleMapsInit'
    ;(globalThis as Record<string, unknown>)[callbackName] = () => {
      delete (globalThis as Record<string, unknown>)[callbackName]
      if (google?.maps) {
        resolve(google.maps)
        return
      }
      loadPromise = null
      reject(new Error(
        'Google Maps initialised but google.maps is missing — verify VITE_GOOGLE_MAPS_KEY and that Maps JavaScript API is enabled',
      ))
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&callback=${callbackName}`
    script.async = true
    script.defer = true
    script.onerror = () => {
      delete (globalThis as Record<string, unknown>)[callbackName]
      loadPromise = null
      reject(new Error('Failed to load Google Maps JavaScript API'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
