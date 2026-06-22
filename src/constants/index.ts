// ── Storage ─────────────────────────────────────────────────────────────────
export const THEME_STORAGE_KEY = 'trackprint-theme'

// Proxied in dev (Vite) and production (Vercel) — browsers cannot set User-Agent.
export const NOMINATIM_API_BASE = '/api/nominatim'

// ── App defaults ────────────────────────────────────────────────────────────
export const DEFAULT_MARKET = 'uk'
export const DEFAULT_BATTERY_RANGE = 50

// ── Provider env keys & fallbacks ───────────────────────────────────────────
export const ENV_MAP_PROVIDER = 'VITE_MAP_PROVIDER'
export const ENV_ROUTING_PROVIDER = 'VITE_ROUTING_PROVIDER'
export const ENV_GEOCODING_PROVIDER = 'VITE_GEOCODING_PROVIDER'

export const DEFAULT_ROUTING_PROVIDER = 'osrm'
export const DEFAULT_GEOCODING_PROVIDER = 'nominatim'

// ── Geocoding UI ────────────────────────────────────────────────────────────
export const GEOCODING_DEBOUNCE_MS = 320
export const GEOCODING_BLUR_DELAY_MS = 160
export const GEOCODING_MIN_QUERY_LENGTH = 2
export const GEOCODING_SUGGESTION_LIMIT = 5
export const REVERSE_SEARCH_RADIUS_M = 100

// ── Layout ──────────────────────────────────────────────────────────────────
export const DESKTOP_BREAKPOINT = '(min-width: 768px)'

/** Mobile map sheet snap heights (fraction of the shell below the header). */
export const MOBILE_MAP_SHEET_PEEK = 0.08
export const MOBILE_MAP_SHEET_FULL = 0.90
/** Handle + a visible blurred map strip when results are shown. */
export const MOBILE_MAP_SHEET_PEEK_RESULTS_PX = 68
export const MOBILE_MAP_SHEET_MIN_HEIGHT_PX = 44
/** Pointer movement below this (px) counts as a tap, not a drag. */
export const MOBILE_SHEET_TAP_THRESHOLD_PX = 8

/** Mobile results phase — form collapse and map sheet entrance share this duration. */
export const MOBILE_FORM_COLLAPSE_MS = 420
/** Map sheet height reveal — synced with form collapse easing. */
export const MOBILE_MAP_SHEET_ENTRANCE_MS = MOBILE_FORM_COLLAPSE_MS

/** Inject key — bottom sheet signals when its entrance height animation has settled (map refit). */
export const MOBILE_MAP_SHEET_LAYOUT_READY_KEY = Symbol('mobileMapSheetLayoutReady')

// ── Fuel identifiers & units ────────────────────────────────────────────────
export const FUEL_ID_PLUGIN = 'plugin'
export const FUEL_ID_ELECTRIC = 'electric'
export const FUEL_UNIT_LITRE = 'litre'
export const FUEL_UNIT_KWH = 'kwh'

export const LITRES_PER_100KM = 100
export const DEFAULT_CONSUMPTION_L100_FACTOR = 1

// ── Unit conversion ─────────────────────────────────────────────────────────
export const KM_PER_MILE = 1.609344
export const KM_TO_MILES = 1 / KM_PER_MILE
export const L100KM_TO_MPG_FACTOR = 282.48
export const EUR_TO_GBP = 0.86
export const KWH_PER_100KM = 100

// ── Emissions reference values (kg CO₂) ────────────────────────────────────
export const GRID_CO2_KG_PER_KWH = 0.23
export const CO2_KG_PER_LITRE_PETROL = 2.31
export const CO2_KG_PER_LITRE_DIESEL = 2.68
export const CO2_KG_PER_LITRE_HYBRID = 1.60
export const CO2_KG_PER_LITRE_PLUGIN = 0.90
export const CO2_KG_PER_TREE_YEAR = 21.7
export const CO2_KG_PER_BEEF_BURGER = 3.0
export const CO2_KG_PER_KM_HIGH_SPEED_RAIL = 50
export const CO2_KG_PER_PHONE_CHARGE = 1 / 122
export const CO2_KG_PER_WASH_CYCLE = 0.7
export const CO2_KG_PER_PET_BOTTLE = 0.083

// ── Map display ─────────────────────────────────────────────────────────────
export const MAP_FIT_PADDING_PX = 32
export const MAP_ROUTE_VIEW_DURATION_S = 1.25
export const MAP_MIN_ZOOM_LOCATION = 10
export const OSM_TILE_MAX_ZOOM = 19
export const OSM_TILE_LOAD_TIMEOUT_MS = 3500

// ── CO₂ equivalents carousel ────────────────────────────────────────────────
export const CO2_EQUIVALENT_ROTATION_MS = 3500

// ── PDF export ──────────────────────────────────────────────────────────────
export const PDF_CAPTURE_SCALE = 2
export const PDF_JPEG_QUALITY = 0.94
export const PDF_LIVE_MAP_CAPTURE_DELAY_MS = 400

// ── Routing / OSRM ──────────────────────────────────────────────────────────
export const METRES_PER_KM = 1000
export const SECONDS_PER_MINUTE = 60
export const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving'
export const GOOGLE_STATIC_MAP_MAX_PX = 640
