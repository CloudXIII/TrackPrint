import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'))
const NOMINATIM_USER_AGENT = `TrackPrint/${pkg.version}`

const NOMINATIM_ORIGIN = 'https://nominatim.openstreetmap.org'

export default async function handler(req, res) {
  const segments = req.query.path
  const pathPart = Array.isArray(segments) ? segments.join('/') : (segments ?? '')
  const { path: _path, ...query } = req.query
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(query).map(([key, value]) => [key, String(value)]),
    ),
  ).toString()
  const url = `${NOMINATIM_ORIGIN}/${pathPart}${qs ? `?${qs}` : ''}`

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': NOMINATIM_USER_AGENT,
        'Accept-Language': req.headers['accept-language'] ?? 'en',
      },
    })
    const body = await upstream.text()
    res.status(upstream.status)
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
    res.send(body)
  } catch {
    res.status(502).json({ error: 'Nominatim proxy error' })
  }
}
