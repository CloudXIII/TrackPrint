// [D] High-level composables depend on this abstraction, not a concrete provider.
// [L] Any provider must export search(query) → { label, lat, lon }[]
// To swap provider: set VITE_GEOCODING_PROVIDER=googleMaps in .env — no code changes.
//
// Static map lets Vite detect both import paths for bundling.
const provider = import.meta.env.VITE_GEOCODING_PROVIDER ?? 'nominatim'

const providers = {
  nominatim:  () => import('./nominatim.js'),
  googleMaps: () => import('./googleMaps.js'),
}

if (!(provider in providers)) {
  throw new Error(`Unknown geocoding provider: "${provider}". Expected one of: ${Object.keys(providers).join(', ')}`)
}

const { search } = await providers[provider]()
export { search }
