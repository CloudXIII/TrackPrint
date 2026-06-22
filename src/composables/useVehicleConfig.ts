import { ref, computed, watch } from 'vue'
import { DEFAULT_BATTERY_RANGE, FUEL_ID_PLUGIN } from '@/constants/index.ts'
import { VEHICLES } from '@/config/vehicles.ts'
import { FUELS } from '@/config/fuels.ts'
import { useUnitPreferences } from '@/composables/useUnitPreferences.ts'

/** Local vehicle, fuel, and pricing fields for the trip form. */
export function useVehicleConfig() {
  const { market, units, getPriceDefault, getPriceFieldLabel } = useUnitPreferences()

  const selectedVehicle = ref(VEHICLES[0])
  const selectedFuel = ref(FUELS[0])
  const fuelPrice = ref<number | null>(null)
  const batteryRange = ref(DEFAULT_BATTERY_RANGE)
  const previousDefaultPrice = ref<number | null>(null)

  function applyDefaultPrice() {
    const defaultPrice = getPriceDefault(selectedFuel.value?.id)
    fuelPrice.value = defaultPrice
    previousDefaultPrice.value = defaultPrice
  }

  function applyDefaultBatteryRange() {
    batteryRange.value = units.value.pluginRange.default
  }

  watch(market, () => {
    if (fuelPrice.value === null || fuelPrice.value === previousDefaultPrice.value) {
      applyDefaultPrice()
    } else {
      previousDefaultPrice.value = getPriceDefault(selectedFuel.value?.id)
    }
    applyDefaultBatteryRange()
  }, { immediate: true })

  watch(() => selectedFuel.value?.id, (newId, oldId) => {
    if (newId === oldId) return
    if (fuelPrice.value === null || fuelPrice.value === previousDefaultPrice.value) {
      applyDefaultPrice()
    }
    if (newId === FUEL_ID_PLUGIN) applyDefaultBatteryRange()
  })

  const priceFieldLabel = computed(() => getPriceFieldLabel(selectedFuel.value?.id))
  const pricePlaceholder = computed(() => getPriceDefault(selectedFuel.value?.id).toString())
  const showPluginSlider = computed(() => selectedFuel.value?.id === FUEL_ID_PLUGIN)

  return {
    selectedVehicle,
    selectedFuel,
    fuelPrice,
    batteryRange,
    priceFieldLabel,
    pricePlaceholder,
    showPluginSlider,
    units,
  }
}
