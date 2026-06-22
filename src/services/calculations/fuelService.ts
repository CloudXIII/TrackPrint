import { UNIT_SETS } from '@/config/units.ts'
import {
  DEFAULT_CONSUMPTION_L100_FACTOR,
  FUEL_ID_ELECTRIC,
  FUEL_ID_PLUGIN,
  FUEL_UNIT_KWH,
  FUEL_UNIT_LITRE,
  LITRES_PER_100KM,
} from '@/constants/index.ts'
import type {
  FuelCalculationInput,
  FuelCalculationResult,
  FuelType,
  MarketId,
  PluginEnergySplit,
  VehicleProfile,
} from '@/types/index.ts'

/**
 * Effective litre consumption (L/100km) for a vehicle and fuel combination.
 * Returns null for pure-electric fuels or missing inputs.
 */
export function getEffectiveL100(
  vehicle: VehicleProfile | null | undefined,
  fuel: FuelType | null | undefined,
): number | null {
  if (!vehicle || !fuel || fuel.unit === FUEL_UNIT_KWH) return null
  const factor = fuel.consumptionL100Factor ?? DEFAULT_CONSUMPTION_L100_FACTOR
  return vehicle.consumptionL100km * factor
}

/** Fossil-fuel or pure-electric energy for the full trip distance (L or kWh). */
export function calcEnergyUsed(
  distanceKm: number,
  vehicle: VehicleProfile,
  fuel: FuelType,
): number {
  switch (fuel.unit) {
    case FUEL_UNIT_LITRE: {
      const l100 = getEffectiveL100(vehicle, fuel)
      if (l100 == null) throw new Error(`Cannot compute litre energy for fuel unit: ${fuel.unit}`)
      return (distanceKm * l100) / LITRES_PER_100KM
    }
    case FUEL_UNIT_KWH:
      return distanceKm * vehicle.consumptionKWhKm
    default:
      throw new Error(`Unknown fuel unit: ${fuel.unit}`)
  }
}

/** Split a plug-in trip into electric and fossil segments. */
export function calcPluginSplit(
  distanceKm: number,
  vehicle: VehicleProfile,
  fuel: FuelType,
  batteryRangeKm: number,
): PluginEnergySplit {
  const electricKm = Math.min(batteryRangeKm, distanceKm)
  const fossilKm = Math.max(0, distanceKm - electricKm)
  const kwh = electricKm * vehicle.consumptionKWhKm
  const l100 = getEffectiveL100(vehicle, fuel)
  if (l100 == null) throw new Error('Cannot compute plug-in fossil consumption')
  const litres = (fossilKm * l100) / LITRES_PER_100KM
  return { electricKm, fossilKm, kwh, litres }
}

/** Trip cost from energy amount and unit price (market currency). */
export function calcEnergyCost(energyAmount: number, pricePerUnit: number): number {
  return energyAmount * pricePerUnit
}

/** Default unit price for a fuel type in a given market (matches the trip form defaults). */
export function getDefaultFuelUnitPrice(market: MarketId, fuelId: string): number {
  const units = UNIT_SETS[market]
  return fuelId === FUEL_ID_ELECTRIC
    ? units.electricityPrice.defaultPrice
    : units.fuelPrice.defaultPrice
}

/**
 * When the user was on a market default price, switch to the new market default;
 * otherwise keep the same numeric value (same behaviour as the config form).
 */
export function resolvePriceForMarket(
  priceAtCalc: number,
  defaultAtCalc: number,
  defaultForTarget: number,
): number {
  return priceAtCalc === defaultAtCalc ? defaultForTarget : priceAtCalc
}

/** Recompute trip cost for display when the UK/EU market toggle changes. */
export function calcDisplayCost(input: {
  energyUsed: number
  energyUsedLitres: number | null
  energyUsedKwh: number | null
  isSplitEnergy: boolean
  fuelId: string
  fuelPriceAtCalc: number
  electricityPriceAtCalc: number
  calculationMarket: MarketId
  displayMarket: MarketId
}): number {
  const {
    energyUsed, energyUsedLitres, energyUsedKwh, isSplitEnergy, fuelId,
    fuelPriceAtCalc, electricityPriceAtCalc, calculationMarket, displayMarket,
  } = input

  const displayFuelPrice = resolvePriceForMarket(
    fuelPriceAtCalc,
    getDefaultFuelUnitPrice(calculationMarket, fuelId),
    getDefaultFuelUnitPrice(displayMarket, fuelId),
  )

  if (isSplitEnergy) {
    const displayElecPrice = resolvePriceForMarket(
      electricityPriceAtCalc,
      getDefaultFuelUnitPrice(calculationMarket, FUEL_ID_ELECTRIC),
      getDefaultFuelUnitPrice(displayMarket, FUEL_ID_ELECTRIC),
    )
    return calcPluginCost(
      energyUsedKwh ?? 0,
      energyUsedLitres ?? 0,
      displayElecPrice,
      displayFuelPrice,
    )
  }

  return calcEnergyCost(energyUsed, displayFuelPrice)
}

/** Combined cost for a plug-in split (electricity + fossil fuel). */
export function calcPluginCost(
  kwh: number,
  litres: number,
  electricityPrice: number,
  fuelPrice: number,
): number {
  return kwh * electricityPrice + litres * fuelPrice
}

/** Calculate fuel/energy usage and trip cost for any supported fuel type. */
export function calculateTripFuel(input: FuelCalculationInput): FuelCalculationResult {
  const { distanceKm, vehicle, fuel, fuelPrice, electricityPrice, batteryRangeKm } = input

  if (fuel.id === FUEL_ID_PLUGIN) {
    const { kwh, litres } = calcPluginSplit(distanceKm, vehicle, fuel, batteryRangeKm ?? 0)
    return {
      energyUsed: litres,
      energyUsedLitres: litres,
      energyUsedKwh: kwh,
      isSplitEnergy: true,
      cost: calcPluginCost(kwh, litres, electricityPrice, fuelPrice),
    }
  }

  const energyUsed = calcEnergyUsed(distanceKm, vehicle, fuel)
  const cost = calcEnergyCost(energyUsed, fuelPrice)

  if (fuel.unit === FUEL_UNIT_KWH) {
    return {
      energyUsed,
      energyUsedLitres: null,
      energyUsedKwh: energyUsed,
      isSplitEnergy: false,
      cost,
    }
  }

  return {
    energyUsed,
    energyUsedLitres: energyUsed,
    energyUsedKwh: null,
    isSplitEnergy: false,
    cost,
  }
}
