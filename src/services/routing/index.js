// [D] High-level composables depend on this abstraction, not a concrete provider.
// [L] Any provider must export getRoute(from, to) → { distanceKm, durationMin, polyline }
// To swap provider: set VITE_ROUTING_PROVIDER=googleMaps in .env — no code changes.
//
// Static map lets Vite detect both import paths for bundling.
const provider = import.meta.env.VITE_ROUTING_PROVIDER ?? 'osrm'

const providers = {
  osrm:       () => import('./osrm.js'),
  googleMaps: () => import('./googleMaps.js'),
}

if (!(provider in providers)) {
  throw new Error(`Unknown routing provider: "${provider}". Expected one of: ${Object.keys(providers).join(', ')}`)
}

const { getRoute } = await providers[provider]()
export { getRoute }
