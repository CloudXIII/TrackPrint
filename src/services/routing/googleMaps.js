// [L] Same contract as osrm.js — drop-in replacement.
// Activate by setting VITE_ROUTING_PROVIDER=googleMaps in .env
export async function getRoute(from, to) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) throw new Error('VITE_GOOGLE_MAPS_KEY is required for Google Maps routing')
  // TODO: implement Google Directions API call.
  // Must return { distanceKm, durationMin, polyline } — same shape as osrm.js.
  throw new Error('Google Maps routing not yet implemented')
}
