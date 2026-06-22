import { ref } from 'vue'
import { useTripStore } from '@/stores/tripStore.ts'
import { FUEL_ID_PLUGIN } from '@/constants/index.ts'
import { useFormCollapse } from '@/composables/useFormCollapse.ts'
import { useUnitPreferences } from '@/composables/useUnitPreferences.ts'
import type { PlanTripInput } from '@/types/index.ts'

/** Route planning flow: validates input, delegates to tripStore.calculateTrip, collapses form on success. */
export function useRouteCalculation() {
  const tripStore = useTripStore()
  const { collapseForm } = useFormCollapse()
  const { units } = useUnitPreferences()

  const calcError = ref('')
  const loading = ref(false)

  async function planTrip({ from, to, vehicle, fuel, fuelPrice, batteryRange }: PlanTripInput) {
    calcError.value = ''
    loading.value = true

    try {
      await tripStore.calculateTrip({
        from,
        to,
        vehicle,
        fuel,
        fuelPrice,
        electricityPrice: units.value.electricityPrice.defaultPrice,
        batteryRangeKm: fuel.id === FUEL_ID_PLUGIN
          ? units.value.pluginRange.toKm(batteryRange)
          : undefined,
      })
      collapseForm()
      return true
    } catch (error) {
      calcError.value = error instanceof Error ? error.message : 'Could not calculate route'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    calcError,
    loading,
    planTrip,
  }
}
