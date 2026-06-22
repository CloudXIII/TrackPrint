import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore.ts'

/** Read-only trip data from the store — components never import tripStore directly. */
export function useTripState() {
  const tripStore = useTripStore()

  const {
    from,
    to,
    vehicle,
    fuel,
    distanceKm,
    durationMin,
    energyUsed,
    energyUsedLitres,
    energyUsedKwh,
    isSplitEnergy,
    cost,
    fuelPriceAtCalc,
    electricityPriceAtCalc,
    calculationMarket,
    co2Kg,
    polyline,
    encodedPolyline,
    hasResults,
    summary,
  } = storeToRefs(tripStore)

  return {
    from,
    to,
    vehicle,
    fuel,
    distanceKm,
    durationMin,
    energyUsed,
    energyUsedLitres,
    energyUsedKwh,
    isSplitEnergy,
    cost,
    fuelPriceAtCalc,
    electricityPriceAtCalc,
    calculationMarket,
    co2Kg,
    polyline,
    encodedPolyline,
    hasResults,
    summary,
  }
}
