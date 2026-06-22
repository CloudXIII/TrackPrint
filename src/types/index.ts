/** Geographic point with label — used for routing and map markers. */
export interface GeoLocation {
  label: string
  lat: number
  lon: number
}

/** Autocomplete suggestion; coordinates may be resolved later (e.g. Google placeId). */
export interface GeocodingResult {
  label: string
  lat?: number
  lon?: number
  placeId?: string
}

/** Route polyline vertex as [latitude, longitude]. */
export type RoutePoint = [lat: number, lon: number]

/** Normalised routing response from any routing adapter. */
export interface RouteResult {
  distanceKm: number
  durationMin: number
  polyline: RoutePoint[]
  encodedPolyline?: string
}

export interface GeocodingSearchOptions {
  sessionToken?: string
  limit?: number
}

/** Vehicle consumption profile (from config/vehicles.ts). */
export interface VehicleProfile {
  id?: string
  label?: string
  /** Market-specific display label (falls back to `label`). */
  labels?: Partial<Record<MarketId, string>>
  icon?: string
  consumptionL100km: number
  consumptionKWhKm: number
}

/** Fuel definition (from config/fuels.ts). */
export interface FuelType {
  id: string
  label?: string
  unit: string
  co2PerUnit?: number
  consumptionL100Factor?: number | null
}

export interface PluginEnergySplit {
  electricKm: number
  fossilKm: number
  kwh: number
  litres: number
}

export interface FuelCalculationInput {
  distanceKm: number
  vehicle: VehicleProfile
  fuel: FuelType
  fuelPrice: number
  electricityPrice: number
  batteryRangeKm?: number
}

export interface FuelCalculationResult {
  energyUsed: number
  energyUsedLitres: number | null
  energyUsedKwh: number | null
  isSplitEnergy: boolean
  cost: number
}

export type MarketId = 'uk' | 'eu'

export interface FuelEmissionInput {
  id: string
  unit: string
  co2PerUnit: number
}

export interface TripCo2Input {
  fuel: FuelEmissionInput
  energyUsed: number
  energyUsedLitres: number | null
  energyUsedKwh: number | null
  isSplitEnergy: boolean
}

export interface Co2Equivalent {
  id: string
  icon: string
  value: number
  unit: string
  label: string
  description: string
}

/** Display-ready formatted value for stat tiles and labels. */
export interface FormattedValue {
  value: string | number
  label: string
  symbol?: string
  suffix?: string
}

export interface ProviderLabel {
  name: string
  url: string
}

export interface UnitConversion {
  label: string
  fromKm: (km: number) => number
  toKm: (km: number) => number
}

export interface ConsumptionConversion {
  label: string
  fromL100: (l100: number) => number
  toL100: (l100: number) => number
}

export interface CurrencyUnit {
  label: string
  symbol: string
  fromEur: (eur: number) => number
}

export interface PriceUnit {
  label: string
  defaultPrice: number
}

export interface PluginRangeUnit {
  min: number
  max: number
  default: number
  unit: string
  toKm: (value: number) => number
}

export interface UnitSet {
  distance: UnitConversion
  consumption: ConsumptionConversion
  currency: CurrencyUnit
  fuelPrice: PriceUnit
  electricityPrice: PriceUnit
  pluginRange: PluginRangeUnit
}

export type UnitSets = Record<MarketId, UnitSet>

export interface CalculateTripParams {
  from: GeoLocation
  to: GeoLocation
  vehicle: VehicleProfile
  fuel: FuelType
  fuelPrice: number
  electricityPrice: number
  batteryRangeKm?: number
}

export interface TripResults {
  distanceKm: number
  durationMin: number
  energyUsed: number
  energyUsedLitres: number | null
  energyUsedKwh: number | null
  isSplitEnergy: boolean
  cost: number
  fuelPriceAtCalc?: number
  electricityPriceAtCalc?: number
  calculationMarket?: MarketId
  co2Kg: number
  polyline: RoutePoint[]
  encodedPolyline?: string | null
}

export interface PdfStatItem {
  icon: string
  value: string
  label: string
  accent?: boolean
}

export interface PdfTemplateData {
  fromLabel: string
  toLabel: string
  dateLabel: string
  metaLine: string
  stats: PdfStatItem[]
  co2Kg: string
  equivalents: Co2Equivalent[]
  mapImg?: string
  mapWidth?: number
}

export interface PlanTripInput {
  from: GeoLocation
  to: GeoLocation
  vehicle: VehicleProfile
  fuel: FuelType
  fuelPrice: number
  batteryRange: number
}
