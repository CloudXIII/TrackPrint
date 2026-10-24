import { storeToRefs } from 'pinia'
import { nextTick } from 'vue'
import { useTripStore } from '@/stores/tripStore.js'
import { useUiStore } from '@/stores/uiStore.js'
import { useUnits } from '@/composables/useUnits.js'
import { getVehicleLabel } from '@/config/vehicles.js'
import { BRAND_COLORS } from '@/config/brandColors.js'
import { OSM_TILE_URLS } from '@/config/mapViews.ts'
import {
  buildPdfTemplate,
  buildPdfFilename,
  formatDisplayDate,
  shortCity,
  TEMPLATE_WIDTH,
} from '@/utils/pdfTemplate.js'

const CAPTURE_SCALE = 2
const MAP_SLOT_WIDTH = TEMPLATE_WIDTH - 56 // template horizontal padding (28 * 2)
const MAP_SLOT_HEIGHT = 250                // horizontal banner proportions
const TILE_URL = OSM_TILE_URLS.light

function toLatLng(point) {
  if (Array.isArray(point)) return { lat: point[0], lng: point[1] }
  return { lat: point.lat, lng: point.lng ?? point.lon }
}

function drawRouteOnCanvas(ctx, pts, pixelScale) {
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.globalAlpha = 0.9
  ctx.strokeStyle = BRAND_COLORS.route
  ctx.lineWidth = 4 * pixelScale
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.stroke()
  ctx.globalAlpha = 1

  const dot = (p, fill) => {
    ctx.beginPath()
    ctx.fillStyle = fill
    ctx.arc(p.x, p.y, 7 * pixelScale, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 2.5 * pixelScale
    ctx.strokeStyle = BRAND_COLORS.markerRing
    ctx.stroke()
  }
  dot(pts[0], BRAND_COLORS.fromMarker)
  dot(pts[pts.length - 1], BRAND_COLORS.toMarker)
}

/**
 * Render a dedicated off-screen Leaflet map sized to the PDF's *horizontal* slot.
 * Tiles are captured via html2canvas; the route is composited on a fixed-size canvas
 * using Leaflet's projection so it stays aligned regardless of html2canvas overflow.
 */
async function renderRouteMapImage(polyline, cssW, cssH) {
  if (!polyline?.length) return null

  const L = (await import('leaflet')).default

  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${cssW}px;height:${cssH}px;overflow:hidden;`
  document.body.appendChild(host)

  let map = null
  try {
    map = L.map(host, {
      zoomControl:        false,
      attributionControl: false,
      fadeAnimation:      false,
      zoomAnimation:      false,
      inertia:            false,
    })

    const tiles = L.tileLayer(TILE_URL, { crossOrigin: true, maxZoom: 19 })
    const tilesLoaded = new Promise((resolve) => {
      let done = false
      const finish = () => { if (!done) { done = true; resolve() } }
      tiles.on('load', finish)
      setTimeout(finish, 3500)
    })
    tiles.addTo(map)

    const bounds = L.latLngBounds(polyline.map(toLatLng))
    map.fitBounds(bounds, { padding: [28, 28], animate: false })
    map.invalidateSize()

    await new Promise((resolve) => map.whenReady(resolve))
    await tilesLoaded
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const mapSize = map.getSize()
    const outW = Math.round(cssW * CAPTURE_SCALE)
    const outH = Math.round(cssH * CAPTURE_SCALE)

    // Project route in CSS pixels *before* html2canvas (stable map state).
    const routeCss = polyline.map((pt) => {
      const { lat, lng } = toLatLng(pt)
      const p = map.latLngToContainerPoint(L.latLng(lat, lng))
      return { x: p.x, y: p.y }
    })

    const { default: html2canvas } = await import('html2canvas')
    const tileSnap = await html2canvas(map.getContainer(), {
      useCORS:         true,
      scale:           CAPTURE_SCALE,
      backgroundColor: '#f0faf3',
      logging:         false,
      width:           mapSize.x,
      height:          mapSize.y,
      windowWidth:     mapSize.x,
    })

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')

    // Normalise tile capture onto our fixed output size (html2canvas may
    // return a larger canvas when tiles overflow the viewport).
    ctx.drawImage(tileSnap, 0, 0, outW, outH)

    const sx = outW / mapSize.x
    const sy = outH / mapSize.y
    const routePts = routeCss.map((p) => ({ x: p.x * sx, y: p.y * sy }))
    drawRouteOnCanvas(ctx, routePts, (sx + sy) / 2)

    return canvas
  } catch {
    return null
  } finally {
    if (map) map.remove()
    host.remove()
  }
}

/** Fallback: draw the route polyline onto a canvas so the PDF still shows it. */
function renderRouteFallback(polyline, cssW, cssH) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cssW * CAPTURE_SCALE)
  canvas.height = Math.round(cssH * CAPTURE_SCALE)
  const ctx = canvas.getContext('2d')
  ctx.scale(CAPTURE_SCALE, CAPTURE_SCALE)

  ctx.fillStyle = '#f0faf3'
  ctx.fillRect(0, 0, cssW, cssH)

  if (!polyline?.length) return canvas

  const lats = polyline.map((pt) => toLatLng(pt).lat)
  const lngs = polyline.map((pt) => toLatLng(pt).lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latSpan = maxLat - minLat || 0.01
  const lngSpan = maxLng - minLng || 0.01
  const pad = 28
  const innerW = cssW - pad * 2
  const innerH = cssH - pad * 2
  const scale = Math.min(innerW / lngSpan, innerH / latSpan)
  const left = pad + (innerW - lngSpan * scale) / 2
  const top = pad + (innerH - latSpan * scale) / 2

  const pts = polyline.map((pt) => {
    const { lat, lng } = toLatLng(pt)
    return {
      x: left + (lng - minLng) * scale,
      y: top + (maxLat - lat) * scale,
    }
  })

  ctx.strokeStyle = BRAND_COLORS.route
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.stroke()

  const dot = (p, color) => {
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = BRAND_COLORS.markerRing
    ctx.stroke()
  }
  dot(pts[0], BRAND_COLORS.fromMarker)
  dot(pts[pts.length - 1], BRAND_COLORS.toMarker)

  return canvas
}

function collectStats(refs, formatters) {
  const {
    fuel, distanceKm, durationMin, energyUsed,
    energyUsedLitres, energyUsedKwh, isSplitEnergy, cost,
  } = refs
  const {
    formatDistance, formatDuration, formatCost,
    formatFuelUsed, formatEnergySplit,
  } = formatters

  const dist = formatDistance(distanceKm.value ?? 0)
  const dur = durationMin.value != null
    ? formatDuration(durationMin.value)
    : { value: '—', label: '' }

  let energyValue = '—'
  if (isSplitEnergy.value) {
    energyValue = formatEnergySplit(energyUsedLitres.value, energyUsedKwh.value).value
  } else {
    const fmt = formatFuelUsed(energyUsed.value, fuel.value)
    energyValue = fmt ? `${fmt.value} ${fmt.label}`.trim() : '—'
  }
  const energyLabel = isSplitEnergy.value ? 'Energy used' : 'Fuel used'
  const energyIcon = isSplitEnergy.value ? 'bolt' : 'droplet'

  const costFmt = formatCost(cost.value ?? 0)

  return [
    { icon: 'route',    value: `${dist.value} ${dist.label}`.trim(), label: 'Distance' },
    { icon: 'clock',    value: `${dur.value} ${dur.label}`.trim(),   label: 'Drive time' },
    { icon: energyIcon, value: energyValue, label: energyLabel, accent: true },
    { icon: 'coins',    value: `${costFmt.symbol}${costFmt.value}`,  label: 'Estimated cost', accent: true },
  ]
}

export function usePdfExport() {
  const tripStore = useTripStore()
  const uiStore = useUiStore()
  const refs = storeToRefs(tripStore)
  const { market } = storeToRefs(uiStore)
  const formatters = useUnits()

  async function downloadPdf() {
    const { from, to, vehicle, fuel, co2Kg, equivalents, polyline } = refs

    // 1) Render a horizontal route map matching the PDF slot proportions.
    let mapCanvas = await renderRouteMapImage(polyline.value, MAP_SLOT_WIDTH, MAP_SLOT_HEIGHT)
    if (!mapCanvas) {
      mapCanvas = renderRouteFallback(polyline.value, MAP_SLOT_WIDTH, MAP_SLOT_HEIGHT)
    }

    let mapImg = null
    try {
      mapImg = mapCanvas.toDataURL('image/png')
    } catch {
      mapImg = renderRouteFallback(polyline.value, MAP_SLOT_WIDTH, MAP_SLOT_HEIGHT)
        .toDataURL('image/png')
    }

    // 2) Build the off-screen report template.
    const template = buildPdfTemplate({
      fromLabel: shortCity(from.value),
      toLabel:   shortCity(to.value),
      dateLabel: formatDisplayDate(),
      metaLine:  `${getVehicleLabel(vehicle.value)} · ${fuel.value?.label ?? '—'} · ${market.value.toUpperCase()}`,
      stats:     collectStats(refs, formatters),
      co2Kg:     (co2Kg.value ?? 0).toFixed(2),
      equivalents: equivalents.value ?? [],
      mapImg,
      mapSlotHeight: MAP_SLOT_HEIGHT,
    })
    document.body.appendChild(template)

    try {
      await nextTick()
      await new Promise((r) => requestAnimationFrame(r))

      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(template, {
        scale:           CAPTURE_SCALE,
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
        width:           TEMPLATE_WIDTH,
        windowWidth:     TEMPLATE_WIDTH,
        height:          template.offsetHeight,
      })

      // 3) One A4 page, fit to full width (top aligned) so the header banner
      //    spans edge-to-edge with no side letterboxing.
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      const imgData = canvas.toDataURL('image/jpeg', 0.94)
      let drawW = pageW
      let drawH = (canvas.height * drawW) / canvas.width
      // Safety: if the report is taller than the page, scale down to fit height.
      if (drawH > pageH) {
        drawH = pageH
        drawW = (canvas.width * drawH) / canvas.height
      }
      const x = (pageW - drawW) / 2

      pdf.addImage(imgData, 'JPEG', x, 0, drawW, drawH)
      pdf.save(buildPdfFilename(from.value?.label, to.value?.label))
    } finally {
      template.remove()
    }
  }

  return { downloadPdf }
}
