/**
 * Adapter registry — resolves the active provider from env, no if/else at call sites.
 *
 * Env precedence (highest first):
 *   1. VITE_MAP_PROVIDER        — optional unified override for both adapters
 *   2. VITE_GEOCODING_PROVIDER  — geocoding only (default: nominatim)
 *   3. VITE_ROUTING_PROVIDER    — routing only (default: osrm)
 */
import type { IGeocodingAdapter } from '@/adapters/geocoding/IGeocodingAdapter.ts'
import { NominatimAdapter } from '@/adapters/geocoding/NominatimAdapter.ts'
import { GoogleMapsAdapter } from '@/adapters/geocoding/GoogleMapsAdapter.ts'
import type { IRoutingAdapter } from '@/adapters/routing/IRoutingAdapter.ts'
import { OsrmAdapter } from '@/adapters/routing/OsrmAdapter.ts'
import { GoogleMapsRoutingAdapter } from '@/adapters/routing/GoogleMapsRoutingAdapter.ts'

export type GeocodingProviderId = 'nominatim' | 'googleMaps'
export type RoutingProviderId = 'osrm' | 'googleMaps'

type AdapterFactory<T> = () => T

import {
  DEFAULT_GEOCODING_PROVIDER,
  DEFAULT_ROUTING_PROVIDER,
  ENV_GEOCODING_PROVIDER,
  ENV_MAP_PROVIDER,
  ENV_ROUTING_PROVIDER,
} from '@/constants/index.ts'

const GEOCODING_FACTORIES: Record<GeocodingProviderId, AdapterFactory<IGeocodingAdapter>> = {
  nominatim:  () => new NominatimAdapter(),
  googleMaps: () => new GoogleMapsAdapter(),
}

const ROUTING_FACTORIES: Record<RoutingProviderId, AdapterFactory<IRoutingAdapter>> = {
  osrm:       () => new OsrmAdapter(),
  googleMaps: () => new GoogleMapsRoutingAdapter(),
}

function readEnv(key: string): string | undefined {
  return import.meta.env[key] as string | undefined
}

function resolveProviderKey(specificEnv: string, fallback: string): string {
  return readEnv(ENV_MAP_PROVIDER) ?? readEnv(specificEnv) ?? fallback
}

function createSingleton<T>(factories: Record<string, AdapterFactory<T>>, providerKey: string): () => T {
  let instance: T | null = null

  return () => {
    if (instance) return instance

    if (!(providerKey in factories)) {
      throw new Error(
        `Unknown provider "${providerKey}". Expected one of: ${Object.keys(factories).join(', ')}`,
      )
    }

    instance = factories[providerKey]()
    return instance
  }
}

const geocodingKey = resolveProviderKey(ENV_GEOCODING_PROVIDER, DEFAULT_GEOCODING_PROVIDER)
const routingKey = resolveProviderKey(ENV_ROUTING_PROVIDER, DEFAULT_ROUTING_PROVIDER)

const getGeocodingAdapterSingleton = createSingleton(
  GEOCODING_FACTORIES as Record<string, AdapterFactory<IGeocodingAdapter>>,
  geocodingKey,
)

const getRoutingAdapterSingleton = createSingleton(
  ROUTING_FACTORIES as Record<string, AdapterFactory<IRoutingAdapter>>,
  routingKey,
)

/** Active geocoding provider id (from env). */
export const activeGeocodingProvider = geocodingKey as GeocodingProviderId

/** Active routing provider id (from env). */
export const activeRoutingProvider = routingKey as RoutingProviderId

/** Singleton geocoding adapter for the configured provider. */
export function getGeocodingAdapter(): IGeocodingAdapter {
  return getGeocodingAdapterSingleton()
}

/** Singleton routing adapter for the configured provider. */
export function getRoutingAdapter(): IRoutingAdapter {
  return getRoutingAdapterSingleton()
}
