import { CO2_EQUIVALENTS } from '@/config/co2Equivalents.js'
import { FUELS } from '@/config/fuels.js'
import { getEffectiveL100 } from '@/config/consumption.js'

const ELECTRIC_CO2_PER_KWH = FUELS.find(f => f.id === 'electric').co2PerUnit

export function calcEnergyUsed(distanceKm, vehicle, fuel) {
  switch (fuel.unit) {
    case 'litre':
      return (distanceKm * getEffectiveL100(vehicle, fuel)) / 100
    case 'kwh':
      return distanceKm * vehicle.consumptionKWhKm
    default:
      throw new Error(`Unknown fuel unit: ${fuel.unit}`)
  }
}

export function calcPluginSplit(distanceKm, vehicle, fuel, batteryRangeKm) {
  const electricKm = Math.min(batteryRangeKm, distanceKm)
  const fossilKm   = Math.max(0, distanceKm - electricKm)
  const kwh        = electricKm * vehicle.consumptionKWhKm
  const litres     = (fossilKm * getEffectiveL100(vehicle, fuel)) / 100
  return { electricKm, fossilKm, kwh, litres }
}

export function calcPluginCost(kwh, litres, electricityPrice, fuelPrice) {
  return kwh * electricityPrice + litres * fuelPrice
}

export function calcPluginCo2(kwh, litres, fuel) {
  return kwh * ELECTRIC_CO2_PER_KWH + litres * fuel.co2PerUnit
}

export function calcCost(energyUsed, pricePerUnit) {
  return energyUsed * pricePerUnit
}

export function calcCo2(energyUsed, fuel) {
  return energyUsed * fuel.co2PerUnit
}

export function calcEquivalents(co2Kg, equivalents = CO2_EQUIVALENTS) {
  return equivalents.map(eq => ({
    ...eq,
    value: parseFloat((co2Kg * eq.factor).toFixed(1)),
  }))
}

export function useCalculator() {
  function calculate({ distanceKm, vehicle, fuel, pricePerUnit, electricityPrice, batteryRangeKm }) {
    if (fuel.id === 'plugin') {
      const { kwh, litres } = calcPluginSplit(distanceKm, vehicle, fuel, batteryRangeKm ?? 0)
      const cost        = calcPluginCost(kwh, litres, electricityPrice, pricePerUnit)
      const co2Kg       = calcPluginCo2(kwh, litres, fuel)
      const equivalents = calcEquivalents(co2Kg)
      return {
        energyUsed:       litres,
        energyUsedLitres: litres,
        energyUsedKwh:    kwh,
        isSplitEnergy:    true,
        cost,
        co2Kg,
        equivalents,
      }
    }

    const energyUsed  = calcEnergyUsed(distanceKm, vehicle, fuel)
    const cost        = calcCost(energyUsed, pricePerUnit)
    const co2Kg       = calcCo2(energyUsed, fuel)
    const equivalents = calcEquivalents(co2Kg)

    if (fuel.unit === 'kwh') {
      return {
        energyUsed,
        energyUsedLitres: null,
        energyUsedKwh:    energyUsed,
        isSplitEnergy:    false,
        cost,
        co2Kg,
        equivalents,
      }
    }

    return {
      energyUsed,
      energyUsedLitres: energyUsed,
      energyUsedKwh:    null,
      isSplitEnergy:    false,
      cost,
      co2Kg,
      equivalents,
    }
  }

  return { calculate }
}
