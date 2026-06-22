import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getRoutingAdapter } from '@/adapters/registry.ts'
import { calculateTripFuel } from '@/services/calculations/fuelService.ts'
import { calcTripCo2 } from '@/services/calculations/emissionsService.ts'
import { useUiStore } from '@/stores/uiStore.ts'
import type {
  CalculateTripParams,
  FuelType,
  GeoLocation,
  TripDraft,
  TripResults,
  VehicleProfile,
} from '@/types/index.ts'

const EMPTY_DRAFT = (): TripDraft => ({
  from: null,
  to: null,
  vehicle: null,
  fuel: null,
})

export const useTripStore = defineStore('trip', () => {
  const draft = ref<TripDraft>(EMPTY_DRAFT())
  const results = ref<TripResults | null>(null)

  const hasResults = computed(() => results.value !== null)

  const summary = computed(() => draft.value)

  function setDraft(
    fromLocation: GeoLocation | null,
    toLocation: GeoLocation | null,
    selectedVehicle: VehicleProfile | null,
    selectedFuel: FuelType | null,
  ) {
    draft.value = {
      from: fromLocation,
      to: toLocation,
      vehicle: selectedVehicle,
      fuel: selectedFuel,
    }
  }

  function setResults(next: TripResults) {
    results.value = next
  }

  /**
   * Orchestration: routing adapter → calculation services → state update.
   * @throws when routing or calculation fails.
   */
  async function calculateTrip({
    from: fromLocation,
    to: toLocation,
    vehicle: selectedVehicle,
    fuel: selectedFuel,
    fuelPrice,
    electricityPrice,
    batteryRangeKm,
  }: CalculateTripParams) {
    setDraft(fromLocation, toLocation, selectedVehicle, selectedFuel)

    const market = useUiStore().market

    const route = await getRoutingAdapter().getRoute(fromLocation, toLocation)

    const fuelResult = calculateTripFuel({
      distanceKm: route.distanceKm,
      vehicle: selectedVehicle,
      fuel: selectedFuel,
      fuelPrice,
      electricityPrice,
      batteryRangeKm,
    })

    const co2 = calcTripCo2({
      fuel: {
        id: selectedFuel.id,
        unit: selectedFuel.unit,
        co2PerUnit: selectedFuel.co2PerUnit ?? 0,
      },
      energyUsed: fuelResult.energyUsed,
      energyUsedLitres: fuelResult.energyUsedLitres,
      energyUsedKwh: fuelResult.energyUsedKwh,
      isSplitEnergy: fuelResult.isSplitEnergy,
    })

    setResults({
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      polyline: route.polyline,
      encodedPolyline: route.encodedPolyline ?? null,
      ...fuelResult,
      fuelPriceAtCalc: fuelPrice,
      electricityPriceAtCalc: electricityPrice,
      calculationMarket: market,
      co2Kg: co2,
    })
  }

  return {
    draft,
    results,
    hasResults,
    summary,
    calculateTrip,
  }
})
