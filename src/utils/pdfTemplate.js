// Off-screen HTML template for the PDF export. Everything is inline-styled so
// html2canvas can resolve all styles without external CSS. Colours mirror the
// app design tokens (_tokens.scss) for a consistent look.

export const TEMPLATE_WIDTH = 794 // A4 width @96dpi

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
const ICONS = {
  route:    '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  clock:    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  droplet:  '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  bolt:     '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  coins:    '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  leaf:     '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  trees:    '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-3 3.5"/>',
  meat:     '<rect x="3" y="5.5" width="18" height="3" rx="1.5"/><rect x="3" y="10.5" width="18" height="2.6" rx="1.3"/><rect x="3" y="15.5" width="18" height="3" rx="1.5"/>',
  plane:    '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  phone:    '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  bulb:     '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  wind:     '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
}

// Map app icon ids (tabler) → local SVG keys.
const EQUIV_ICON = {
  'ti-trees':         'trees',
  'ti-meat':          'meat',
  'ti-plane':         'plane',
  'ti-device-mobile': 'phone',
  'ti-bulb':          'bulb',
  'ti-wind':          'wind',
}

function svg(name, { size = 20, color = C.green700, stroke = 2 } = {}) {
  const path = ICONS[name] ?? ICONS.leaf
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0;">${path}</svg>`
}

const LOGO_SVG = `<svg width="34" height="34" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0;">
  <rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.18)"/>
  <path d="M6 20 L10 8 L14 16 L18 10 L22 20" stroke="#74C69D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="22" cy="20" r="2" fill="#74C69D"/>
</svg>`

export function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Escape, then render CO₂ subscript safely (avoids the ₂ glyph in html2canvas).
export function co2Html(value) {
  return escHtml(value)
    .replace(/CO₂/g, 'CO<sub style="font-size:0.7em;">2</sub>')
    .replace(/₂/g, '<sub style="font-size:0.7em;">2</sub>')
}

export function shortCity(location) {
  return location?.label?.split(',')[0]?.trim() ?? '—'
}

export function formatDisplayDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function fileStamp(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export function buildPdfFilename(fromLabel, toLabel, date = new Date()) {
  const slug = (t) => shortCity({ label: t }).replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'trip'
  return `TrackPrint_${slug(fromLabel)}_${slug(toLabel)}_${fileStamp(date)}.pdf`
}

function statCell({ icon, value, label, accent }) {
  const bg = accent ? C.green50 : C.white
  const border = accent ? C.green300 : C.green100
  const iconBg = accent ? C.green300 : C.green100
  const iconColor = accent ? C.green900 : C.green700
  return `<div style="flex:1;min-width:0;display:flex;align-items:center;gap:12px;background:${bg};border:1.5px solid ${border};border-radius:12px;padding:14px 16px;box-sizing:border-box;">
    <div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9px;background:${iconBg};flex-shrink:0;">
      ${svg(icon, { size: 19, color: iconColor })}
    </div>
    <div style="min-width:0;">
      <div style="font-size:20px;font-weight:700;color:${C.gray900};line-height:1.15;white-space:nowrap;">${co2Html(value)}</div>
      <div style="font-size:11px;font-weight:500;color:${C.gray600};margin-top:2px;">${escHtml(label)}</div>
    </div>
  </div>`
}

function equivCard(eq) {
  const iconKey = EQUIV_ICON[eq.icon] ?? 'leaf'
  const unit = eq.unit ? ` ${escHtml(eq.unit)}` : ''
  return `<div style="display:flex;align-items:flex-start;gap:11px;background:rgba(116,198,157,0.08);border:1px solid rgba(116,198,157,0.18);border-radius:10px;padding:12px 13px;box-sizing:border-box;">
    <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:rgba(116,198,157,0.16);flex-shrink:0;">
      ${svg(iconKey, { size: 17, color: C.green300 })}
    </div>
    <div style="min-width:0;">
      <div style="font-size:15px;font-weight:700;color:${C.white};line-height:1.2;">${escHtml(eq.value)}${unit}</div>
      <div style="font-size:11px;font-weight:600;color:${C.green300};margin-top:2px;">${escHtml(eq.label)}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.55);margin-top:1px;line-height:1.35;">${co2Html(eq.description)}</div>
    </div>
  </div>`
}

/**
 * @param {object} data
 * @returns {HTMLDivElement}
 */
export function buildPdfTemplate(data) {
  const {
    fromLabel, toLabel, dateLabel, metaLine,
    stats, co2Kg, equivalents, mapImg, mapSlotHeight,
  } = data

  const root = document.createElement('div')
  root.id = 'pdf-template'
  root.setAttribute('aria-hidden', 'true')
  root.style.cssText = [
    'position:fixed', 'left:-10000px', 'top:0',
    `width:${TEMPLATE_WIDTH}px`,
    'overflow:hidden',
    'background:#ffffff',
    "font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif",
    `color:${C.gray900}`,
    'box-sizing:border-box',
  ].join(';')

  const statsHtml = stats.map(statCell).join('')
  const equivHtml = equivalents.map(equivCard).join('')

  const mapInner = mapImg
    ? `<img src="${mapImg}" alt="" style="display:block;width:100%;height:100%;object-fit:cover;object-position:center;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;padding:24px;">
        <div>
          <div style="font-size:13px;font-weight:600;color:${C.green700};margin-bottom:6px;">Route map unavailable</div>
          <div style="font-size:12px;color:${C.gray600};">${escHtml(fromLabel)} &rarr; ${escHtml(toLabel)}</div>
        </div>
      </div>`

  root.innerHTML = `
    <div style="box-sizing:border-box;width:100%;">

      <div style="background:${C.green700};padding:22px 28px;display:flex;align-items:center;gap:14px;">
        ${LOGO_SVG}
        <div style="flex:1;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.15;">TrackPrint</div>
          <div style="font-size:13px;font-weight:500;color:rgba(255,255,255,0.78);margin-top:2px;">Trip CO<sub style="font-size:0.7em;">2</sub> Report</div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.78);white-space:nowrap;">${escHtml(dateLabel)}</div>
      </div>

      <div style="padding:22px 28px 18px;">
        <div style="display:flex;align-items:center;gap:10px;font-size:19px;font-weight:700;color:${C.gray900};line-height:1.3;">
          <span style="display:inline-flex;">${svg('route', { size: 18, color: C.green500 })}</span>
          <span>${escHtml(fromLabel)}</span>
          <span style="color:${C.green500};">&rarr;</span>
          <span>${escHtml(toLabel)}</span>
        </div>
        <div style="font-size:13px;color:${C.gray600};margin-top:8px;padding-left:28px;">${co2Html(metaLine)}</div>
      </div>

      <div style="padding:0 28px;display:flex;gap:12px;">
        ${statsHtml}
      </div>

      <div style="padding:22px 28px 8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          ${svg('leaf', { size: 18, color: C.green700 })}
          <span style="font-size:13px;font-weight:700;color:${C.green700};text-transform:uppercase;letter-spacing:0.05em;">Environmental Impact</span>
        </div>

        <div style="background:${C.green900};border-radius:14px;padding:20px 22px;color:#ffffff;">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
            <div style="display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:11px;background:rgba(116,198,157,0.2);flex-shrink:0;">
              ${svg('leaf', { size: 22, color: C.green300 })}
            </div>
            <div>
              <div style="font-size:28px;font-weight:700;line-height:1.1;">${escHtml(co2Kg)}<span style="font-size:15px;font-weight:500;color:${C.green300};"> kg CO<sub style="font-size:0.7em;">2</sub></span></div>
              <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:3px;">Carbon footprint</div>
            </div>
          </div>

          <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:11px;">Equivalent to</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            ${equivHtml}
          </div>
        </div>
      </div>

      <div style="padding:18px 28px 8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          ${svg('route', { size: 18, color: C.green700 })}
          <span style="font-size:13px;font-weight:700;color:${C.green700};text-transform:uppercase;letter-spacing:0.05em;">Route Map</span>
        </div>
        <div id="pdf-map-slot" style="width:100%;height:${mapSlotHeight}px;border-radius:14px;overflow:hidden;background:${C.green50};border:1.5px solid ${C.green100};box-sizing:border-box;">
          ${mapInner}
        </div>
      </div>

      <div style="margin-top:14px;padding:16px 28px 22px;border-top:1px solid ${C.green100};background:${C.green50};">
        <div style="font-size:10px;line-height:1.55;color:${C.gray600};text-align:center;">
          CO<sub style="font-size:0.7em;">2</sub> figures are estimates only. Routes via OSRM &middot; Maps &copy; OpenStreetMap contributors.<br/>
          Generated by TrackPrint &middot; Trip CO<sub style="font-size:0.7em;">2</sub> calculator
        </div>
      </div>

    </div>
  `

  return root
}
