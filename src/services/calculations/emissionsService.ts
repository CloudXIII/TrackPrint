import {
  CO2_KG_PER_BEEF_BURGER,
  CO2_KG_PER_KM_HIGH_SPEED_RAIL,
  CO2_KG_PER_PET_BOTTLE,
  CO2_KG_PER_PHONE_CHARGE,
  CO2_KG_PER_TREE_YEAR,
  CO2_KG_PER_WASH_CYCLE,
  FUEL_ID_ELECTRIC,
  FUEL_ID_PLUGIN,
  FUEL_UNIT_KWH,
  GRID_CO2_KG_PER_KWH,
} from '@/constants/index.ts'
import { kmToMiles } from '@/services/units/conversionService.ts'
import type {
  Co2Equivalent,
  FuelEmissionInput,
  MarketId,
  TripCo2Input,
} from '@/types/index.ts'

interface EquivalentLocale {
  label: string
  unit: string
  describe: (value: number) => string
}

interface EquivalentDefinition {
  id: string
  icon: string
  factors: Record<MarketId, number>
  decimals: number
  locales: Record<MarketId, EquivalentLocale>
}

const EQUIVALENT_DEFINITIONS: EquivalentDefinition[] = [
  {
    id: 'trees',
    icon: 'trees',
    factors: { eu: 1 / CO2_KG_PER_TREE_YEAR, uk: 1 / CO2_KG_PER_TREE_YEAR },
    decimals: 1,
    locales: {
      eu: {
        label: 'Tree-years of CO₂ absorption',
        unit: '',
        describe: (value) =>
          `A mature tree absorbs about 22 kg of CO₂ in a year. This trip would take roughly ${value} tree${value === 1 ? '' : 's'} a full year to offset.`,
      },
      uk: {
        label: 'Tree-years of CO₂ absorption',
        unit: '',
        describe: (value) =>
          `A mature tree absorbs about 22 kg of CO₂ in a year. This trip would take roughly ${value} tree${value === 1 ? '' : 's'} a full year to offset.`,
      },
    },
  },
  {
    id: 'burgers',
    icon: 'meat',
    factors: { eu: 1 / CO2_KG_PER_BEEF_BURGER, uk: 1 / CO2_KG_PER_BEEF_BURGER },
    decimals: 1,
    locales: {
      eu: {
        label: 'Beef burgers (production)',
        unit: '',
        describe: (value) =>
          `Making one beef burger emits around 3 kg of CO₂. Your trip has a similar footprint to producing ${value} burger${value === 1 ? '' : 's'}.`,
      },
      uk: {
        label: 'Beef burgers (production)',
        unit: '',
        describe: (value) =>
          `Making one beef burger emits around 3 kg of CO₂. Your trip has a similar footprint to producing ${value} burger${value === 1 ? '' : 's'}.`,
      },
    },
  },
  {
    id: 'train',
    icon: 'train',
    factors: {
      eu: CO2_KG_PER_KM_HIGH_SPEED_RAIL,
      uk: CO2_KG_PER_KM_HIGH_SPEED_RAIL * kmToMiles(1),
    },
    decimals: 1,
    locales: {
      eu: {
        label: 'High-speed rail (passenger km)',
        unit: 'km',
        describe: (value) =>
          `${value} km by high-speed train — the same CO₂ as a passenger on a high-speed service over that distance (e.g. roughly the Milan–Florence route).`,
      },
      uk: {
        label: 'High-speed rail (passenger miles)',
        unit: 'mi',
        describe: (value) =>
          `${value} mi by high-speed train — the same CO₂ as a passenger on a high-speed service over that distance (e.g. roughly the London–Birmingham route).`,
      },
    },
  },
  {
    id: 'phones',
    icon: 'device-mobile',
    factors: { eu: 1 / CO2_KG_PER_PHONE_CHARGE, uk: 1 / CO2_KG_PER_PHONE_CHARGE },
    decimals: 1,
    locales: {
      eu: {
        label: 'Full phone charges',
        unit: '',
        describe: (value) =>
          `Charging a smartphone from empty to full creates roughly 8 g of CO₂ per charge — about ${value} charges for this trip.`,
      },
      uk: {
        label: 'Full phone charges',
        unit: '',
        describe: (value) =>
          `Charging a smartphone from empty to full creates roughly 8 g of CO₂ per charge — about ${value} charges for this trip.`,
      },
    },
  },
  {
    id: 'laundry',
    icon: 'wash',
    factors: { eu: 1 / CO2_KG_PER_WASH_CYCLE, uk: 1 / CO2_KG_PER_WASH_CYCLE },
    decimals: 1,
    locales: {
      eu: {
        label: 'Full wash cycles (40°C)',
        unit: '',
        describe: (value) =>
          `${value} full washing-machine loads at 40°C — the total energy-related CO₂ from running them at full load.`,
      },
      uk: {
        label: 'Full wash cycles (40°C)',
        unit: '',
        describe: (value) =>
          `${value} full washing-machine loads at 40°C — the total energy-related CO₂ from running them at full load.`,
      },
    },
  },
  {
    id: 'bottles',
    icon: 'bottle',
    factors: { eu: 1 / CO2_KG_PER_PET_BOTTLE, uk: 1 / CO2_KG_PER_PET_BOTTLE },
    decimals: 0,
    locales: {
      eu: {
        label: '1.5 L PET bottles (production & disposal)',
        unit: '',
        describe: (value) =>
          `${value} disposable 1.5 L plastic bottles — the carbon footprint of producing and disposing of that many single-use PET bottles.`,
      },
      uk: {
        label: '1.5 L PET bottles (production & disposal)',
        unit: '',
        describe: (value) =>
          `${value} disposable 1.5 L plastic bottles — the carbon footprint of producing and disposing of that many single-use PET bottles.`,
      },
    },
  },
]

function roundEquivalent(raw: number, decimals = 1): number {
  if (decimals === 0) return Math.round(raw)
  return parseFloat(raw.toFixed(decimals))
}

export function calcCo2FromEnergy(energyUsed: number, fuel: FuelEmissionInput): number {
  return energyUsed * fuel.co2PerUnit
}

export function calcPluginCo2(kwh: number, litres: number, fuel: FuelEmissionInput): number {
  return kwh * GRID_CO2_KG_PER_KWH + litres * fuel.co2PerUnit
}

export function calcTripCo2(input: TripCo2Input): number {
  const { fuel, energyUsed, energyUsedLitres, energyUsedKwh, isSplitEnergy } = input

  if (isSplitEnergy && energyUsedKwh != null && energyUsedLitres != null) {
    return calcPluginCo2(energyUsedKwh, energyUsedLitres, fuel)
  }

  return calcCo2FromEnergy(energyUsed, fuel)
}

export function calcEquivalents(co2Kg: number, market: MarketId | string = 'eu'): Co2Equivalent[] {
  const localeKey: MarketId = market === 'uk' ? 'uk' : 'eu'

  return EQUIVALENT_DEFINITIONS.map((def) => {
    const locale = def.locales[localeKey]
    const factor = def.factors[localeKey]
    const value = roundEquivalent(co2Kg * factor, def.decimals ?? 1)

    return {
      id: def.id,
      icon: def.icon,
      value,
      unit: locale.unit,
      label: locale.label,
      description: locale.describe(value),
    }
  })
}

export function usesGridElectricity(fuelId: string, energyUsedKwh: number | null | undefined): boolean {
  return fuelId === FUEL_ID_ELECTRIC || (fuelId === FUEL_ID_PLUGIN && (energyUsedKwh ?? 0) > 0)
}
