// Off-screen HTML template for the PDF export. Everything is inline-styled so
// html2canvas can resolve all styles without external CSS. Colours mirror the
// app design tokens (_tokens.scss) for a consistent look.

import { activeRouting, activeMapAttribution, usesGoogleMapDisplay } from '@/config/providers.ts'
import { getShortLocationLabel } from '@/utils/locationLabel.ts'
import type { Co2Equivalent, GeoLocation, PdfStatItem, PdfTemplateData } from '@/types/index.ts'
export const TEMPLATE_WIDTH = 794 // A4 width @96dpi
export const TEMPLATE_HEIGHT = Math.round(TEMPLATE_WIDTH * (297 / 210)) // A4 height @96dpi
const PDF_CONTENT_PADDING = 28
const PDF_ATTRIBUTION_HEIGHT = 22
const PDF_HEADER_HEIGHT = 82
const PDF_FOOTER_HEIGHT = 52

// Fixed vertical space for body sections excluding the map box itself.
const PDF_BODY_EXCLUDING_MAP =
  20 +  // block 1 top padding
  50 +  // trip title
  16 +  // gap
  66 +  // stats row
  16 +  // map block top padding
  24 +  // map section header
  10 +  // gap before map box
  16 +  // env block top padding
  24 +  // env section header
  10 +  // gap
  66 +  // CO₂ banner
  10 +  // gap
  58 +  // equiv row 1
  8 +   // gap
  58 +  // equiv row 2
  16    // env block bottom padding

const PDF_MAP_HEIGHT = TEMPLATE_HEIGHT - PDF_HEADER_HEIGHT - PDF_FOOTER_HEIGHT - PDF_BODY_EXCLUDING_MAP
export const PDF_MAP_IMAGE_HEIGHT = PDF_MAP_HEIGHT - PDF_ATTRIBUTION_HEIGHT
// Desktop layout @1160px: ~572px map column, ~680px typical panel height.
const PDF_MAP_ASPECT_FALLBACK = 572 / 680
const PDF_MAP_MAX_WIDTH = TEMPLATE_WIDTH - PDF_CONTENT_PADDING * 2

/** Match the on-screen map aspect ratio so Static Maps framing is not cropped. */
export function resolvePdfMapWidth(imageHeight: number = PDF_MAP_IMAGE_HEIGHT): number {
  const host = document.querySelector('.route-map__map') as HTMLElement | null
  if (host && host.offsetWidth > 0 && host.offsetHeight > 0) {
    const aspect = host.offsetWidth / host.offsetHeight
    return Math.min(Math.round(imageHeight * aspect), PDF_MAP_MAX_WIDTH)
  }
  return Math.min(Math.round(imageHeight * PDF_MAP_ASPECT_FALLBACK), PDF_MAP_MAX_WIDTH)
}

const C = {
  green900: '#1a3d2b',
  green700: '#2D6A4F',
  green500: '#40916C',
  green300: '#74C69D',
  green100: '#D8F3DC',
  green50:  '#f0faf3',
  gray900:  '#1a1a1a',
  gray600:  '#4A5568',
  gray400:  '#A0AEC0',
  white:    '#ffffff',
}

// Inline SVG icons (Lucide/Tabler-style paths) — safe for html2canvas.
const ICONS: Record<string, string> = {
  route:    '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  clock:    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  droplet:  '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  bolt:     '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  coins:    '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  leaf:     '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  trees:    '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-3 3.5"/>',
  meat:     '<rect x="3" y="5.5" width="18" height="3" rx="1.5"/><rect x="3" y="10.5" width="18" height="2.6" rx="1.3"/><rect x="3" y="15.5" width="18" height="3" rx="1.5"/>',
  train:    '<path d="M21 13c0-3.87-3.13-7-7-7h-4c-3.87 0-7 3.13-7 7v8h18v-8"/><path d="M10 13h4"/><path d="M8 13v-2"/><path d="M16 13v-2"/><circle cx="7" cy="21" r="1"/><circle cx="17" cy="21" r="1"/>',
  phone:    '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  wash:     '<path d="M12 3a6 6 0 0 1 6 6v11"/><path d="M12 3a6 6 0 0 0-6 6v11"/><path d="M9 12h6"/><path d="M12 9v6"/><circle cx="12" cy="19" r="2"/>',
  bottle:   '<path d="M10 5h4v3a6 6 0 1 1-4 0V5"/><path d="M7 5h10"/><path d="M12 16v3"/>',
}

// Map equivalent icon ids → inline SVG keys (same short names).
function equivIconKey(icon: string): string {
  if (icon === 'device-mobile') return 'phone'
  return ICONS[icon] ? icon : 'leaf'
}

function svg(name: string, { size = 20, color = C.green700, stroke = 2 }: { size?: number; color?: string; stroke?: number } = {}): string {
  const path = ICONS[name] ?? ICONS.leaf
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0;">${path}</svg>`
}

const LOGO_SVG = `<svg width="34" height="34" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0;">
  <rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.18)"/>
  <path d="M6 20 L10 8 L14 16 L18 10 L22 20" stroke="#74C69D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="22" cy="20" r="2" fill="#74C69D"/>
</svg>`

function escHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Escape, then render CO₂ subscript safely (avoids the ₂ glyph in html2canvas).
function co2Html(value: unknown): string {
  return escHtml(value)
    .replace(/CO₂/g, 'CO<sub style="font-size:0.7em;">2</sub>')
    .replace(/₂/g, '<sub style="font-size:0.7em;">2</sub>')
}

function shortCity(location: { label?: string } | GeoLocation | null | undefined): string {
  return getShortLocationLabel(location as GeoLocation | null | undefined)
}

export function formatDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function fileStamp(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export function buildPdfFilename(fromLabel: string | undefined, toLabel: string | undefined, date: Date = new Date()): string {
  const slug = (t: string | undefined) => shortCity({ label: t ?? '' }).replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'trip'
  return `TrackPrint_${slug(fromLabel)}_${slug(toLabel)}_${fileStamp(date)}.pdf`
}

function statCell({ icon, value, label, accent }: PdfStatItem): string {
  const bg = accent ? C.green50 : C.white
  const border = accent ? C.green300 : C.green100
  const iconBg = accent ? C.green300 : C.green100
  const iconColor = accent ? C.green900 : C.green700
  return `<div style="flex:1;min-width:0;display:flex;align-items:center;gap:12px;background:${bg};border:1.5px solid ${border};border-radius:12px;padding:14px 16px;box-sizing:border-box;">
    <div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9px;background:${iconBg};flex-shrink:0;">
      ${svg(icon, { size: 19, color: iconColor })}
    </div>
    <div style="min-width:0;">
      <div style="font-size:18px;font-weight:700;color:${C.gray900};line-height:1.15;">${co2Html(value)}</div>
      <div style="font-size:11px;font-weight:500;color:${C.gray600};margin-top:2px;">${escHtml(label)}</div>
    </div>
  </div>`
}

function co2Banner(co2Kg: string): string {
  return `<div style="display:flex;align-items:center;gap:14px;background:${C.green900};border-radius:12px;padding:14px 18px;box-sizing:border-box;">
    <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;background:rgba(116,198,157,0.2);flex-shrink:0;">
      ${svg('leaf', { size: 20, color: C.green300 })}
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:22px;font-weight:700;color:${C.white};line-height:1.1;">${escHtml(co2Kg)}<span style="font-size:13px;font-weight:500;color:${C.green300};"> kg CO<sub style="font-size:0.7em;">2</sub></span></div>
      <div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;">Carbon footprint</div>
    </div>
  </div>`
}

function equivStatCell(eq: Co2Equivalent): string {
  const iconKey = equivIconKey(eq.icon)
  const unit = eq.unit ? ` ${escHtml(eq.unit)}` : ''
  return `<div style="flex:1;min-width:0;display:flex;align-items:center;gap:8px;background:${C.green50};border:1.5px solid ${C.green100};border-radius:10px;padding:10px 12px;box-sizing:border-box;">
    <div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:7px;background:${C.green100};flex-shrink:0;">
      ${svg(iconKey, { size: 15, color: C.green700 })}
    </div>
    <div style="min-width:0;">
      <div style="font-size:14px;font-weight:700;color:${C.gray900};line-height:1.15;">${escHtml(eq.value)}${unit}</div>
      <div style="font-size:9px;font-weight:500;color:${C.gray600};margin-top:1px;line-height:1.25;">${escHtml(eq.label)}</div>
    </div>
  </div>`
}

function equivRows(equivalents: Co2Equivalent[]): string {
  const rows: string[] = []
  for (let i = 0; i < equivalents.length; i += 3) {
    const chunk = equivalents.slice(i, i + 3).map(equivStatCell).join('')
    rows.push(`<div style="display:flex;gap:10px;">${chunk}</div>`)
  }
  return rows.join('')
}

export function buildPdfTemplate(data: PdfTemplateData): HTMLDivElement {
  const {
    fromLabel, toLabel, dateLabel, metaLine,
    stats, co2Kg, equivalents, mapImg, mapWidth,
  } = data

  const mapBoxWidth = mapWidth ?? PDF_MAP_MAX_WIDTH

  const root = document.createElement('div')
  root.id = 'pdf-template'
  root.setAttribute('aria-hidden', 'true')
  root.style.cssText = [
    'position:fixed', 'left:-10000px', 'top:0',
    `width:${TEMPLATE_WIDTH}px`,
    'overflow:hidden',
    'margin:0', 'padding:0',
    'line-height:0', 'font-size:0',
    'box-sizing:border-box',
  ].join(';')

  const statsHtml = stats.map(statCell).join('')
  const equivHtml = equivRows(equivalents)

  const mapInner = mapImg
    ? `<img src="${mapImg}" alt="" style="display:block;width:100%;height:100%;object-fit:cover;object-position:center;" />`
    : ''

  const mapAttribution = usesGoogleMapDisplay
    ? `<div style="height:${PDF_ATTRIBUTION_HEIGHT}px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;box-sizing:border-box;background:rgba(255,255,255,0.96);border-top:1px solid ${C.green100};font-family:Roboto,Arial,sans-serif;font-size:9px;color:#70757a;flex-shrink:0;">
        <span style="font-size:11px;font-weight:500;color:#4285F4;letter-spacing:-0.02em;">Google</span>
        <span>Map data &copy;${new Date().getFullYear()} Google</span>
      </div>`
    : ''

  const content = document.createElement('div')
  content.id = 'pdf-template-content'
  content.style.cssText = [
    `width:${TEMPLATE_WIDTH}px`,
    `height:${TEMPLATE_HEIGHT}px`,
    'margin:0', 'padding:0',
    'box-sizing:border-box',
    'display:flex', 'flex-direction:column',
    'background:#ffffff',
    "font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif",
    `color:${C.gray900}`,
    'line-height:normal', 'font-size:14px',
  ].join(';')

  const pad = PDF_CONTENT_PADDING

  // Joined without whitespace — stray text nodes between block elements confuse html2canvas.
  content.innerHTML = [
    `<div id="pdf-main" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;">`,
    `<div style="height:${PDF_HEADER_HEIGHT}px;background:${C.green700};padding:0 ${pad}px;margin:0;display:flex;align-items:center;gap:14px;flex-shrink:0;box-sizing:border-box;">`,
    LOGO_SVG,
    `<div style="flex:1;"><div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.15;">TrackPrint</div>`,
    `<div style="font-size:13px;font-weight:500;color:rgba(255,255,255,0.78);margin-top:2px;">Trip CO<sub style="font-size:0.7em;">2</sub> Report</div></div>`,
    `<div style="font-size:12px;color:rgba(255,255,255,0.78);white-space:nowrap;">${escHtml(dateLabel)}</div></div>`,
    `<div style="padding:20px ${pad}px 0;display:flex;flex-direction:column;gap:16px;flex-shrink:0;">`,
    `<div><div style="display:flex;align-items:center;gap:10px;font-size:19px;font-weight:700;color:${C.gray900};line-height:1.3;">`,
    `<span style="display:inline-flex;">${svg('route', { size: 18, color: C.green500 })}</span>`,
    `<span>${escHtml(fromLabel)}</span><span style="color:${C.green500};">&rarr;</span><span>${escHtml(toLabel)}</span></div>`,
    `<div style="font-size:13px;color:${C.gray600};margin-top:6px;padding-left:28px;">${co2Html(metaLine)}</div></div>`,
    `<div style="display:flex;gap:12px;">${statsHtml}</div>`,
    `</div>`,
    `<div style="padding:16px ${pad}px 0;display:flex;flex-direction:column;gap:10px;align-items:center;flex-shrink:0;">`,
    `<div style="width:100%;max-width:${mapBoxWidth}px;display:flex;flex-direction:column;gap:10px;">`,
    `<div style="display:flex;align-items:center;gap:8px;">`,
    `${svg('route', { size: 18, color: C.green700 })}`,
    `<span style="font-size:13px;font-weight:700;color:${C.green700};text-transform:uppercase;letter-spacing:0.05em;">Route Map</span></div>`,
    `<div style="width:100%;height:${PDF_MAP_HEIGHT}px;border-radius:14px;overflow:hidden;background:${C.green50};border:1.5px solid ${C.green100};box-sizing:border-box;display:flex;flex-direction:column;">`,
    `<div id="pdf-map-slot" style="flex:1;min-height:0;overflow:hidden;">${mapInner}</div>`,
    `${mapAttribution}</div></div></div>`,
    `<div style="padding:16px ${pad}px 16px;display:flex;flex-direction:column;gap:10px;flex-shrink:0;">`,
    `<div style="display:flex;align-items:center;gap:8px;">`,
    `${svg('leaf', { size: 18, color: C.green700 })}`,
    `<span style="font-size:13px;font-weight:700;color:${C.green700};text-transform:uppercase;letter-spacing:0.05em;">Environmental Impact</span></div>`,
    co2Banner(co2Kg),
    `<div style="display:flex;flex-direction:column;gap:8px;">${equivHtml}</div>`,
    `</div></div>`,
    `<div style="height:${PDF_FOOTER_HEIGHT}px;flex-shrink:0;padding:0 ${pad}px;border-top:1px solid ${C.green100};background:${C.green50};display:flex;align-items:center;justify-content:center;box-sizing:border-box;">`,
    `<div style="font-size:10px;line-height:1.55;color:${C.gray600};text-align:center;">`,
    `CO<sub style="font-size:0.7em;">2</sub> figures are estimates only. Routes via ${escHtml(activeRouting.name)} &middot; Maps &copy; ${escHtml(activeMapAttribution.name)}.<br/>`,
    `Generated by TrackPrint &middot; Trip CO<sub style="font-size:0.7em;">2</sub> calculator</div></div>`,
  ].join('')

  root.appendChild(content)
  return root
}
