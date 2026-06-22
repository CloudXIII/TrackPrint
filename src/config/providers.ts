import {
  activeGeocodingProvider as geocodingProvider,
  activeRoutingProvider as routingProvider,
} from '@/adapters/registry.ts'
import type { ProviderLabel } from '@/types/index.ts'
import type { GeocodingProviderId, RoutingProviderId } from '@/adapters/registry.ts'

const ROUTING_LABELS: Record<RoutingProviderId, ProviderLabel> = {
  osrm: { name: 'OSRM', url: 'https://project-osrm.org' },
  googleMaps: { name: 'Google Maps', url: 'https://developers.google.com/maps' },
}

const GEOCODING_LABELS: Record<GeocodingProviderId, ProviderLabel> = {
  nominatim: { name: 'Nominatim', url: 'https://nominatim.org' },
  googleMaps: { name: 'Google Maps', url: 'https://developers.google.com/maps' },
}

const MAP_ATTRIBUTION: Record<'osm' | 'google', ProviderLabel> = {
  osm: { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
  google: { name: 'Google Maps', url: 'https://www.google.com/maps' },
}

export const activeRouting = ROUTING_LABELS[routingProvider] ?? ROUTING_LABELS.osrm
export const activeGeocoding = GEOCODING_LABELS[geocodingProvider] ?? GEOCODING_LABELS.nominatim

/** Google route data must be displayed on Google Maps (Platform ToS). */
export const usesGoogleMapDisplay = routingProvider === 'googleMaps'
export const activeMapAttribution = usesGoogleMapDisplay ? MAP_ATTRIBUTION.google : MAP_ATTRIBUTION.osm
