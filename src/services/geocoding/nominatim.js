// [S] Only responsibility: call Nominatim and normalise to { label, lat, lon }[].
// [L] Any geocoding provider must return this same shape.
const BASE = 'https://nominatim.openstreetmap.org/search'

export async function search(query) {
  const params = new URLSearchParams({ q: query, format: 'json', limit: 5, addressdetails: 1 })
  const res = await fetch(`${BASE}?${params}`, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'TrackPrint/1.0' },
  })
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)
  const data = await res.json()
  return data.map(r => ({
    label: r.display_name,
    lat:   parseFloat(r.lat),
    lon:   parseFloat(r.lon),
  }))
}
