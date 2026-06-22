import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore.ts'

/** Read-only trip data from the store — flat refs adapted from draft/results. */
export function useTripState() {
  const tripStore = useTripStore()
  const { draft, results, hasResults, summary } = storeToRefs(tripStore)

  const from = computed(() => draft.value.from)
  const to = computed(() => draft.value.to)
  const vehicle = computed(() => draft.value.vehicle)
  const fuel = computed(() => draft.value.fuel)

  const distanceKm = computed(() => results.value?.distanceKm ?? null)
  const durationMin = computed(() => results.value?.durationMin ?? null)
  const energyUsed = computed(() => results.value?.energyUsed ?? null)
  const energyUsedLitres = computed(() => results.value?.energyUsedLitres ?? null)
  const energyUsedKwh = computed(() => results.value?.energyUsedKwh ?? null)
  const isSplitEnergy = computed(() => results.value?.isSplitEnergy ?? false)
  const cost = computed(() => results.value?.cost ?? null)
  const fuelPriceAtCalc = computed(() => results.value?.fuelPriceAtCalc ?? null)
  const electricityPriceAtCalc = computed(() => results.value?.electricityPriceAtCalc ?? null)
  const calculationMarket = computed(() => results.value?.calculationMarket ?? null)
  const co2Kg = computed(() => results.value?.co2Kg ?? null)
  const polyline = computed(() => results.value?.polyline ?? [])
  const encodedPolyline = computed(() => results.value?.encodedPolyline ?? null)

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
