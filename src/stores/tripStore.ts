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
  MarketId,
  RoutePoint,
  TripResults,
  VehicleProfile,
} from '@/types/index.ts'

export const useTripStore = defineStore('trip', () => {
  const from = ref<GeoLocation | null>(null)
  const to = ref<GeoLocation | null>(null)
  const vehicle = ref<VehicleProfile | null>(null)
  const fuel = ref<FuelType | null>(null)

  const distanceKm = ref<number | null>(null)
  const durationMin = ref<number | null>(null)
  const energyUsed = ref<number | null>(null)
  const energyUsedLitres = ref<number | null>(null)
  const energyUsedKwh = ref<number | null>(null)
  const isSplitEnergy = ref(false)
  const cost = ref<number | null>(null)
  const fuelPriceAtCalc = ref<number | null>(null)
  const electricityPriceAtCalc = ref<number | null>(null)
  const calculationMarket = ref<MarketId | null>(null)
  const co2Kg = ref<number | null>(null)
  const polyline = ref<RoutePoint[]>([])
  const encodedPolyline = ref<string | null>(null)

  const hasResults = computed(() => distanceKm.value !== null)

  const summary = computed(() => ({
    from: from.value,
    to: to.value,
    vehicle: vehicle.value,
    fuel: fuel.value,
  }))

  function setInputs(
    fromLocation: GeoLocation | null,
    toLocation: GeoLocation | null,
    selectedVehicle: VehicleProfile | null,
    selectedFuel: FuelType | null,
  ) {
    from.value = fromLocation
    to.value = toLocation
    vehicle.value = selectedVehicle
    fuel.value = selectedFuel
  }

  function setResults(results: TripResults) {
    distanceKm.value = results.distanceKm
    durationMin.value = results.durationMin
    energyUsed.value = results.energyUsed
    energyUsedLitres.value = results.energyUsedLitres ?? null
    energyUsedKwh.value = results.energyUsedKwh ?? null
    isSplitEnergy.value = results.isSplitEnergy ?? false
    cost.value = results.cost
    fuelPriceAtCalc.value = results.fuelPriceAtCalc ?? null
    electricityPriceAtCalc.value = results.electricityPriceAtCalc ?? null
    calculationMarket.value = results.calculationMarket ?? null
    co2Kg.value = results.co2Kg
    polyline.value = results.polyline
    encodedPolyline.value = results.encodedPolyline ?? null
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
    setInputs(fromLocation, toLocation, selectedVehicle, selectedFuel)

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
    from, to, vehicle, fuel,
    distanceKm, durationMin, energyUsed, energyUsedLitres, energyUsedKwh,
    isSplitEnergy, cost, fuelPriceAtCalc, electricityPriceAtCalc, calculationMarket,
    co2Kg, polyline, encodedPolyline,
    hasResults, summary,
    calculateTrip,
  }
})
