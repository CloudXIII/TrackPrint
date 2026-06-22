import type { MarketId } from '@/types/index.ts'

interface GoogleMapMarketView {
  center: { lat: number; lng: number }
  zoom: number
}

interface LeafletMapMarketView {
  center: [number, number]
  zoom: number
}

export const GOOGLE_MARKET_VIEWS: Record<MarketId, GoogleMapMarketView> = {
  uk: { center: { lat: 54.0, lng: -2.5 }, zoom: 6 },
  eu: { center: { lat: 50.5, lng: 9.5 }, zoom: 5 },
}

export const LEAFLET_MARKET_VIEWS: Record<MarketId, LeafletMapMarketView> = {
  uk: { center: [54.0, -2.5], zoom: 6 },
  eu: { center: [50.5, 9.5], zoom: 5 },
}

export const OSM_TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const

export const OSM_TILE_ATTRIBUTION = {
  light: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
  dark: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
} as const
