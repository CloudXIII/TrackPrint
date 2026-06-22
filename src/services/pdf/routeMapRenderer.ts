import L from 'leaflet'
import { BRAND_COLORS } from '@/config/brandColors.ts'
import { OSM_TILE_URLS } from '@/config/mapViews.ts'
import { usesGoogleMapDisplay } from '@/config/providers.ts'
import { encodePolyline } from '@/utils/decodePolyline.ts'
import {
  GOOGLE_STATIC_MAP_MAX_PX,
  OSM_TILE_LOAD_TIMEOUT_MS,
  OSM_TILE_MAX_ZOOM,
  PDF_CAPTURE_SCALE,
  PDF_LIVE_MAP_CAPTURE_DELAY_MS,
} from '@/constants/index.ts'
import type { RoutePoint } from '@/types/index.ts'

interface LatLng {
  lat: number
  lng: number
}

interface PixelPoint {
  x: number
  y: number
}

type MapPoint = RoutePoint | { lat: number; lng?: number; lon?: number }
const OSM_TILE_URL = OSM_TILE_URLS.light

const CANVAS_READBACK: CanvasRenderingContext2DSettings = { willReadFrequently: true }

function getCanvas2d(
  canvas: HTMLCanvasElement,
  settings: CanvasRenderingContext2DSettings = CANVAS_READBACK,
): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', settings)
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  return ctx
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  getCanvas2d(canvas)
  return canvas
}

function toLatLng(point: MapPoint): LatLng {
  if (Array.isArray(point)) return { lat: point[0], lng: point[1] }
  return { lat: point.lat, lng: point.lng ?? point.lon ?? 0 }
}

function getGoogleMapsKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''
}

function drawRouteOnCanvas(ctx: CanvasRenderingContext2D, points: PixelPoint[], pixelScale: number): void {
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.globalAlpha = 0.9
  ctx.strokeStyle = BRAND_COLORS.route
  ctx.lineWidth = 4 * pixelScale
  ctx.beginPath()
  points.forEach((point, index) => (
    index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)
  ))
  ctx.stroke()
  ctx.globalAlpha = 1

  const drawMarker = (point: PixelPoint, fill: string) => {
    ctx.beginPath()
    ctx.fillStyle = fill
    ctx.arc(point.x, point.y, 7 * pixelScale, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 2.5 * pixelScale
    ctx.strokeStyle = BRAND_COLORS.markerRing
    ctx.stroke()
  }

  drawMarker(points[0], BRAND_COLORS.fromMarker)
  drawMarker(points[points.length - 1], BRAND_COLORS.toMarker)
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
  vAnchor: 'bottom' | 'top' | 'center' = 'bottom',
): void {
  const srcW = (img as HTMLImageElement).naturalWidth || (img as HTMLCanvasElement).width || 0
  const srcH = (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height || 0
  const srcAspect = srcW / srcH
  const destAspect = dWidth / dHeight

  let sx
  let sy
  let sw
  let sh

  if (srcAspect > destAspect) {
    sh = srcH
    sw = srcH * destAspect
    sx = (srcW - sw) / 2
    sy = 0
  } else {
    sw = srcW
    sh = srcW / destAspect
    sx = 0
    if (vAnchor === 'bottom') sy = srcH - sh
    else if (vAnchor === 'top') sy = 0
    else sy = (srcH - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dWidth, dHeight)
}

/** Copy a Static Maps image 1:1 into a canvas (no crop — API already frames the route). */
function canvasFromImage(img: CanvasImageSource, cssWidth: number, cssHeight: number): HTMLCanvasElement {
  const outW = Math.round(cssWidth * PDF_CAPTURE_SCALE)
  const outH = Math.round(cssHeight * PDF_CAPTURE_SCALE)
  const canvas = createCanvas(outW, outH)
  getCanvas2d(canvas).drawImage(img, 0, 0, outW, outH)
  return canvas
}
/** Fit live-capture imagery into the PDF slot (cover crop, centred on the route). */
function prepareMapCanvasForSlot(source: CanvasImageSource, cssWidth: number, cssHeight: number): HTMLCanvasElement {
  const outW = Math.round(cssWidth * PDF_CAPTURE_SCALE)
  const outH = Math.round(cssHeight * PDF_CAPTURE_SCALE)
  const canvas = createCanvas(outW, outH)
  const ctx = getCanvas2d(canvas)
  ctx.fillStyle = '#e8ecef'
  ctx.fillRect(0, 0, outW, outH)
  drawImageCover(ctx, source, 0, 0, outW, outH, 'center')
  return canvas
}

function isCanvasMostlyBlank(source: HTMLCanvasElement): boolean {
  const { width, height } = source
  if (width < 8 || height < 8) return true

  // Copy into a readback-optimised canvas (html2canvas may use a write-only context).
  const canvas = createCanvas(width, height)
  const ctx = getCanvas2d(canvas)
  ctx.drawImage(source, 0, 0)

  const sample = ctx.getImageData(0, 0, width, height).data
  let varied = 0
  for (let i = 0; i < sample.length; i += 16) {
    const r = sample[i]
    const g = sample[i + 1]
    const b = sample[i + 2]
    const a = sample[i + 3]
    if (a > 8 && (Math.abs(r - g) > 8 || Math.abs(g - b) > 8 || r < 220 || g < 220)) {
      varied += 1
    }
  }
  return varied < 12
}

async function loadMapImage(urls: string[]): Promise<HTMLImageElement> {
  let lastError: Error | null = null
  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`)
        continue
      }

      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('image')) {
        lastError = new Error('Response is not an image')
        continue
      }

      const blob = await response.blob()
      if (blob.size < 700) {
        lastError = new Error('Image too small')
        continue
      }

      const objectUrl = URL.createObjectURL(blob)
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = () => reject(new Error('Image decode failed'))
          image.src = objectUrl
        })
        return img
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }  }

  throw lastError ?? new Error('Map image unavailable')
}

function buildGoogleStaticMapQuery(
  polyline: MapPoint[],
  cssWidth: number,
  cssHeight: number,
  encodedPolyline: string | null = null,
): string {
  const key = getGoogleMapsKey()
  const points = polyline.map(toLatLng)
  const encoded = encodedPolyline || encodePolyline(points.map((p) => [p.lat, p.lng]))
  const routeColor = BRAND_COLORS.route.replace('#', '0x')
  const w = Math.min(Math.round(cssWidth), GOOGLE_STATIC_MAP_MAX_PX)
  const h = Math.min(Math.round(cssHeight), GOOGLE_STATIC_MAP_MAX_PX)
  const start = points[0]
  const end = points[points.length - 1]

  const params = new URLSearchParams({
    size: `${w}x${h}`,
    scale: '2',
    maptype: 'roadmap',
    path: `color:${routeColor}|weight:4|enc:${encoded}`,
    key,
  })
  params.append('markers', `color:green|${start.lat},${start.lng}`)
  params.append('markers', `color:green|${end.lat},${end.lng}`)
  params.append('visible', `${start.lat},${start.lng}`)
  params.append('visible', `${end.lat},${end.lng}`)

  return params.toString()
}

/** Google Static Maps — reliable image for PDF when routing via Google. */
async function renderGoogleStaticMapImage(
  polyline: MapPoint[],
  cssWidth: number,
  cssHeight: number,
  encodedPolyline: string | null = null,
): Promise<HTMLCanvasElement | null> {
  const key = getGoogleMapsKey()
  if (!key || !polyline?.length) return null

  try {
    const query = buildGoogleStaticMapQuery(polyline, cssWidth, cssHeight, encodedPolyline)
    const img = await loadMapImage([
      `/api/google-static?${query}`,
      `https://maps.googleapis.com/maps/api/staticmap?${query}`,
    ])

    const canvas = canvasFromImage(img, cssWidth, cssHeight)
    return finalizeMapCanvas(canvas)
  } catch {
    return null
  }
}

function finalizeMapCanvas(canvas: HTMLCanvasElement | null): HTMLCanvasElement | null {
  if (!canvas || isCanvasMostlyBlank(canvas)) return null
  return canvas
}

/** Capture the on-screen Google map (tiles already loaded in the UI). */
async function renderLiveGoogleMapCapture(cssWidth: number, cssHeight: number): Promise<HTMLCanvasElement | null> {
  const host = document.querySelector('.route-map .route-map__map') as HTMLElement | null
  if (!host?.querySelector('.gm-style')) return null

  try {
    await new Promise((resolve) => setTimeout(resolve, PDF_LIVE_MAP_CAPTURE_DELAY_MS))

    const { default: html2canvas } = await import('html2canvas')
    const snapshot = await html2canvas(host, {
      useCORS: true,
      scale: PDF_CAPTURE_SCALE,
      backgroundColor: '#e8e8e8',
      logging: false,
      width: host.offsetWidth,
      height: host.offsetHeight,
    })

    if (isCanvasMostlyBlank(snapshot)) return null

    return finalizeMapCanvas(prepareMapCanvasForSlot(snapshot, cssWidth, cssHeight))
  } catch {
    return null
  }
}

/** Leaflet + OpenStreetMap tiles for the OSRM stack. */
async function renderOsmRouteMapImage(
  polyline: MapPoint[],
  cssWidth: number,
  cssHeight: number,
): Promise<HTMLCanvasElement | null> {
  if (!polyline?.length) return null

  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${cssWidth}px;height:${cssHeight}px;overflow:hidden;`
  document.body.appendChild(host)

  let map: L.Map | null = null
  try {
    map = L.map(host, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: false,
      zoomAnimation: false,
      inertia: false,
    })

    const tiles = L.tileLayer(OSM_TILE_URL, { crossOrigin: true, maxZoom: OSM_TILE_MAX_ZOOM })
    const tilesLoaded = new Promise<void>((resolve) => {
      let done = false
      const finish = () => { if (!done) { done = true; resolve() } }
      tiles.on('load', finish)
      setTimeout(finish, OSM_TILE_LOAD_TIMEOUT_MS)
    })
    tiles.addTo(map)

    const bounds = L.latLngBounds(polyline.map(toLatLng))
    map.fitBounds(bounds, { padding: [28, 28], animate: false })
    map.invalidateSize()

    await new Promise<void>((resolve) => map!.whenReady(() => resolve()))
    await tilesLoaded
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    const mapSize = map.getSize()
    const outWidth = Math.round(cssWidth * PDF_CAPTURE_SCALE)
    const outHeight = Math.round(cssHeight * PDF_CAPTURE_SCALE)

    const routeCss = polyline.map((point) => {
      const { lat, lng } = toLatLng(point)
      const projected = map!.latLngToContainerPoint(L.latLng(lat, lng))
      return { x: projected.x, y: projected.y }
    })

    const { default: html2canvas } = await import('html2canvas')
    const tileSnapshot = await html2canvas(map.getContainer(), {
      useCORS: true,
      scale: PDF_CAPTURE_SCALE,
      backgroundColor: '#f0faf3',
      logging: false,
      width: mapSize.x,
      height: mapSize.y,
      windowWidth: mapSize.x,
    })

    const fitted = canvasFromImage(tileSnapshot, cssWidth, cssHeight)
    const ctx = getCanvas2d(fitted)
    const scaleX = outWidth / mapSize.x
    const scaleY = outHeight / mapSize.y
    const routePoints = routeCss.map((point) => ({ x: point.x * scaleX, y: point.y * scaleY }))
    drawRouteOnCanvas(ctx, routePoints, (scaleX + scaleY) / 2)

    return finalizeMapCanvas(fitted)
  } catch {
    return null
  } finally {
    if (map) map.remove()
    host.remove()
  }
}

/** Line-only fallback when map capture fails entirely. */
export function renderRouteFallback(polyline: MapPoint[], cssWidth: number, cssHeight: number): HTMLCanvasElement {
  const canvas = createCanvas(
    Math.round(cssWidth * PDF_CAPTURE_SCALE),
    Math.round(cssHeight * PDF_CAPTURE_SCALE),
  )
  const ctx = getCanvas2d(canvas)
  ctx.scale(PDF_CAPTURE_SCALE, PDF_CAPTURE_SCALE)

  ctx.fillStyle = '#f0faf3'
  ctx.fillRect(0, 0, cssWidth, cssHeight)

  if (!polyline?.length) return canvas

  const lats = polyline.map((point) => toLatLng(point).lat)
  const lngs = polyline.map((point) => toLatLng(point).lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latSpan = maxLat - minLat || 0.01
  const lngSpan = maxLng - minLng || 0.01
  const padding = 28
  const innerWidth = cssWidth - padding * 2
  const innerHeight = cssHeight - padding * 2
  const scale = Math.min(innerWidth / lngSpan, innerHeight / latSpan)
  const left = padding + (innerWidth - lngSpan * scale) / 2
  const top = padding + (innerHeight - latSpan * scale) / 2

  const points = polyline.map((point) => {
    const { lat, lng } = toLatLng(point)
    return {
      x: left + (lng - minLng) * scale,
      y: top + (maxLat - lat) * scale,
    }
  })

  drawRouteOnCanvas(ctx, points, 1)

  return canvas
}

/** Provider-aware map render for PDF export. */
export async function renderRouteMapImage(
  polyline: RoutePoint[],
  cssWidth: number,
  cssHeight: number,
  encodedPolyline: string | null = null,
): Promise<HTMLCanvasElement | null> {
  if (usesGoogleMapDisplay) {
    return (await renderGoogleStaticMapImage(polyline, cssWidth, cssHeight, encodedPolyline))
      ?? (await renderLiveGoogleMapCapture(cssWidth, cssHeight))
  }
  return renderOsmRouteMapImage(polyline, cssWidth, cssHeight)
}

/** True when a captured map image has visible map content. */
export function isMapCanvasUsable(canvas: HTMLCanvasElement | null): boolean {
  return canvas != null && !isCanvasMostlyBlank(canvas)
}