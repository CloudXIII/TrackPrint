// Unit and currency settings per market — add a key here to support a new region.
import {
  kmToMiles,
  milesToKm,
  l100kmToMpg,
  mpgToL100km,
  eurToGbp,
} from '@/services/units/conversionService.ts'
import type { UnitSets } from '@/types/index.ts'

export const UNIT_SETS: UnitSets = {
  uk: {
    distance:    { label: 'mi',      fromKm: kmToMiles,  toKm: milesToKm },
    consumption: { label: 'MPG',     fromL100: l100kmToMpg, toL100: mpgToL100km },
    currency:    { label: '£', symbol: '£', fromEur: eurToGbp },
    fuelPrice:        { label: '£/L',   defaultPrice: 1.42 },
    electricityPrice: { label: '£/kWh', defaultPrice: 0.35 },
    pluginRange: {
      min: 15, max: 60, default: 30, unit: 'mi',
      toKm: milesToKm,
    },
  },
  eu: {
    distance:    { label: 'km',      fromKm: km => km,             toKm: km => km },
    consumption: { label: 'L/100km', fromL100: l => l,              toL100: l => l },
    currency:    { label: '€', symbol: '€', fromEur: e => e },
    fuelPrice:        { label: '€/L',   defaultPrice: 1.65 },
    electricityPrice: { label: '€/kWh', defaultPrice: 0.35 },
    pluginRange: {
      min: 20, max: 100, default: 50, unit: 'km',
      toKm: km => km,
    },
  },
}
