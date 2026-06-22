import { nextTick } from 'vue'
import { PDF_CAPTURE_SCALE, PDF_JPEG_QUALITY } from '@/constants/index.ts'
import { useTripState } from '@/composables/trip/useTripState.ts'
import { useUnitPreferences } from '@/composables/useUnitPreferences.ts'
import { useTripStats } from '@/composables/trip/useTripStats.ts'
import { getVehicleLabel } from '@/config/vehicles.ts'
import {
  buildPdfTemplate,
  buildPdfFilename,
  formatDisplayDate,
  PDF_MAP_IMAGE_HEIGHT,
  resolvePdfMapWidth,
  TEMPLATE_WIDTH,
  TEMPLATE_HEIGHT,
} from '@/utils/pdfTemplate.ts'
import { getShortLocationLabel } from '@/utils/locationLabel.ts'
import { renderRouteMapImage, renderRouteFallback, isMapCanvasUsable } from '@/services/pdf/routeMapRenderer.ts'

/** PDF export side effects (DOM capture, download). */
export function usePdfExport() {
  const { from, to, vehicle, fuel, co2Kg, polyline, encodedPolyline } = useTripState()
  const { market } = useUnitPreferences()
  const { buildPdfStats, equivalents } = useTripStats()

  async function downloadPdf() {
    const mapWidth = resolvePdfMapWidth()

    let mapCanvas = await renderRouteMapImage(
      polyline.value,
      mapWidth,
      PDF_MAP_IMAGE_HEIGHT,
      encodedPolyline.value ?? null,
    )
    if (!isMapCanvasUsable(mapCanvas)) {
      mapCanvas = renderRouteFallback(polyline.value, mapWidth, PDF_MAP_IMAGE_HEIGHT)
    }

    const template = buildPdfTemplate({
      fromLabel: getShortLocationLabel(from.value),
      toLabel: getShortLocationLabel(to.value),
      dateLabel: formatDisplayDate(),
      metaLine: `${getVehicleLabel(vehicle.value, market.value)} · ${fuel.value?.label ?? '—'} · ${market.value.toUpperCase()}`,
      stats: buildPdfStats(),
      co2Kg: (co2Kg.value ?? 0).toFixed(2),
      equivalents: equivalents.value,
      mapWidth,
    })
    document.body.appendChild(template)

    const mapSlot = template.querySelector('#pdf-map-slot')
    if (mapSlot && mapCanvas) {
      const display = document.createElement('canvas')
      display.width = mapCanvas.width
      display.height = mapCanvas.height
      display.getContext('2d', { willReadFrequently: true })!.drawImage(mapCanvas, 0, 0)
      display.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain;object-position:center;'
      mapSlot.replaceChildren(display)
    }

    try {
      await nextTick()
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

      const content = template.querySelector('#pdf-template-content') ?? template

      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(content as HTMLElement, {
        scale: PDF_CAPTURE_SCALE,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: TEMPLATE_WIDTH,
        height: TEMPLATE_HEIGHT,
        windowWidth: TEMPLATE_WIDTH,
        windowHeight: TEMPLATE_HEIGHT,
      })

      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imageData = canvas.toDataURL('image/jpeg', PDF_JPEG_QUALITY)
      pdf.addImage(imageData, 'JPEG', 0, 0, pageWidth, pageHeight)
      pdf.save(buildPdfFilename(from.value?.label, to.value?.label))
    } finally {
      template.remove()
    }
  }

  return { downloadPdf }
}
