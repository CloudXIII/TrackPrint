// [S] Only responsibility: call OSRM and normalise the response shape.
const BASE = 'https://router.project-osrm.org/route/v1/driving'

export async function getRoute(from, to) {
  const url = `${BASE}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM error: ${res.status}`)
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No route found between these locations')
  }
  const route = data.routes[0]
  return {
    distanceKm:  route.distance / 1000,
    durationMin: Math.round(route.duration / 60),
    polyline:    route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
  }
}
