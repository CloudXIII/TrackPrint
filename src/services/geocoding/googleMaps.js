// [L] Same contract as nominatim.js — drop-in replacement.
// Activate by setting VITE_GEOCODING_PROVIDER=googleMaps in .env
export async function search(query) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) throw new Error('VITE_GOOGLE_MAPS_KEY is required for Google Maps geocoding')
  // TODO: implement Google Places Autocomplete API call.
  // Must return { label, lat, lon }[] — same shape as nominatim.js.
  throw new Error('Google Maps geocoding not yet implemented')
}
