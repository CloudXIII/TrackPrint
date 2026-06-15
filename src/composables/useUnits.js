import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/uiStore.js'
import { UNIT_SETS } from '@/config/units.js'
import { getEffectiveL100 } from '@/config/consumption.js'

export function useUnits() {
  const uiStore = useUiStore()
  const { market } = storeToRefs(uiStore)

  const units = computed(() => UNIT_SETS[market.value])

  function formatDistance(km) {
    const u = units.value.distance
    return { value: u.fromKm(km).toFixed(1), label: u.label }
  }

  function formatConsumption(l100km) {
    const u = units.value.consumption
    return { value: u.fromL100(l100km).toFixed(1), label: u.label }
  }

  function formatCost(amount) {
    const u = units.value.currency
    return { value: amount.toFixed(2), symbol: u.symbol }
  }

  function formatFuelUsed(energyUsed, fuel) {
    if (!fuel) return { value: '—', label: '' }
    if (fuel.id === 'plugin') return null
    if (fuel.unit === 'kwh') {
      return { value: energyUsed.toFixed(1), label: 'kWh' }
    }
    return { value: energyUsed.toFixed(1), label: 'L' }
  }

  function formatEnergySplit(litres, kwh) {
    return {
      value: `${litres.toFixed(1)} L + ${kwh.toFixed(1)} kWh`,
      label: '',
    }
  }

  /** Consumption label shown under each vehicle icon — varies by fuel type. */
  function formatVehicleConsumption(vehicle, fuel) {
    if (!vehicle || !fuel) return { value: '—', suffix: '' }

    if (fuel.unit === 'kwh') {
      if (market.value === 'eu') {
        const kwh100 = vehicle.consumptionKWhKm * 100
        return { value: kwh100.toFixed(0), suffix: 'kWh/100' }
      }
      const miPerKwh = 0.621371 / vehicle.consumptionKWhKm
      return { value: miPerKwh.toFixed(1), suffix: 'mi/kWh' }
    }

    const l100 = getEffectiveL100(vehicle, fuel)

    if (market.value === 'eu') {
      return { value: l100.toFixed(1), suffix: 'L/100' }
    }

    const mpg = 282.48 / l100
    return { value: mpg.toFixed(0), suffix: 'MPG' }
  }

  function getPriceDefault(fuelId) {
    return fuelId === 'electric'
      ? units.value.electricityPrice.defaultPrice
      : units.value.fuelPrice.defaultPrice
  }

  function getPriceFieldLabel(fuelId) {
    const sym = units.value.currency.symbol
    if (fuelId === 'electric') {
      return `Electricity price (${sym}/kWh)`
    }
    return `Fuel price (${sym}/L)`
  }

  function formatDuration(minutes) {
    if (minutes < 60) return { value: minutes, label: 'min' }
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return { value: `${h}h ${m}m`, label: '' }
  }

  return {
    units,
    formatDistance,
    formatConsumption,
    formatCost,
    formatFuelUsed,
    formatEnergySplit,
    formatVehicleConsumption,
    getPriceDefault,
    getPriceFieldLabel,
    formatDuration,
  }
}
