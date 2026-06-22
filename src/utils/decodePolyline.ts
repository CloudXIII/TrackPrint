import type { RoutePoint } from '@/types/index.ts'

/** Decode a Google Maps encoded polyline into [lat, lon] pairs. */
export function decodePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = []
  let index = 0
  let lat = 0
  let lon = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    lat += (result & 1) ? ~(result >> 1) : (result >> 1)

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    lon += (result & 1) ? ~(result >> 1) : (result >> 1)

    points.push([lat / 1e5, lon / 1e5])
  }

  return points
}

function encodeSignedNumber(num: number): string {
  let value = num << 1
  if (num < 0) value = ~value
  let encoded = ''
  while (value >= 0x20) {
    encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63)
    value >>= 5
  }
  encoded += String.fromCharCode(value + 63)
  return encoded
}

/** Encode [lat, lon] pairs for Google Static Maps path=enc:… */
export function encodePolyline(points: RoutePoint[]): string {
  let lastLat = 0
  let lastLng = 0
  let encoded = ''

  for (const point of points) {
    const lat = Math.round(point[0] * 1e5)
    const lng = Math.round(point[1] * 1e5)
    encoded += encodeSignedNumber(lat - lastLat)
    encoded += encodeSignedNumber(lng - lastLng)
    lastLat = lat
    lastLng = lng
  }

  return encoded
}
