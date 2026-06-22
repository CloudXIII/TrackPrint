import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { FUEL_ID_ELECTRIC, FUEL_ID_PLUGIN } from '@/constants/index.ts'
import { useUiStore } from '@/stores/uiStore.ts'
import { UNIT_SETS } from '@/config/units.ts'
import { getEffectiveL100 } from '@/services/calculations/fuelService.ts'
import {
  kwhPerKmToKwhPer100km,
  kwhPerKmToMiPerKwh,
  l100kmToMpg,
} from '@/services/units/conversionService.ts'
import type { FormattedValue, FuelType, MarketId, VehicleProfile } from '@/types/index.ts'

/** Market selection and unit formatting — single entry point for locale preferences. */
export function useUnitPreferences() {
  const uiStore = useUiStore()
  const { market } = storeToRefs(uiStore)

  const units = computed(() => UNIT_SETS[market.value])

  function setMarket(value: MarketId) {
    uiStore.setMarket(value)
  }

  function formatDistance(km: number | null): FormattedValue {
    const u = units.value.distance
    return { value: u.fromKm(km ?? 0).toFixed(1), label: u.label }
  }

  function formatCost(amount: number | null): FormattedValue & { symbol: string } {
    const u = units.value.currency
    return { value: (amount ?? 0).toFixed(2), symbol: u.symbol, label: '' }
  }

  function formatFuelUsed(energyUsed: number | null, fuel: FuelType | null): FormattedValue | null {
    if (!fuel) return { value: '—', label: '' }
    if (fuel.id === FUEL_ID_PLUGIN) return null
    if (fuel.unit === 'kwh') {
      return { value: (energyUsed ?? 0).toFixed(1), label: 'kWh' }
    }
    return { value: (energyUsed ?? 0).toFixed(1), label: 'L' }
  }

  function formatEnergySplit(litres: number | null, kwh: number | null): FormattedValue {
    return {
      value: `${(litres ?? 0).toFixed(1)} L + ${(kwh ?? 0).toFixed(1)} kWh`,
      label: '',
    }
  }

  function formatVehicleConsumption(vehicle: VehicleProfile | null, fuel: FuelType | null): FormattedValue {
    if (!vehicle || !fuel) return { value: '—', label: '', suffix: '' }

    if (fuel.unit === 'kwh') {
      if (market.value === 'eu') {
        const kwh100 = kwhPerKmToKwhPer100km(vehicle.consumptionKWhKm)
        return { value: kwh100.toFixed(0), label: '', suffix: 'kWh/100' }
      }
      const miPerKwh = kwhPerKmToMiPerKwh(vehicle.consumptionKWhKm)
      return { value: miPerKwh.toFixed(1), label: '', suffix: 'mi/kWh' }
    }

    const l100 = getEffectiveL100(vehicle, fuel)

    if (market.value === 'eu') {
      return { value: (l100 ?? 0).toFixed(1), label: '', suffix: 'L/100km' }
    }

    const mpg = l100kmToMpg(l100 ?? 0)
    return { value: mpg.toFixed(0), label: '', suffix: 'MPG' }
  }

  function getPriceDefault(fuelId: string | undefined): number {
    return fuelId === FUEL_ID_ELECTRIC
      ? units.value.electricityPrice.defaultPrice
      : units.value.fuelPrice.defaultPrice
  }

  function getPriceFieldLabel(fuelId: string | undefined): string {
    const sym = units.value.currency.symbol
    if (fuelId === FUEL_ID_ELECTRIC) {
      return `Electricity price (${sym}/kWh)`
    }
    return `Fuel price (${sym}/L)`
  }

  function formatDuration(minutes: number): FormattedValue {
    if (minutes < 60) return { value: minutes, label: 'min' }
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return { value: `${h}h ${m}m`, label: '' }
  }

  const currencyIcon = computed(() =>
    market.value === 'uk' ? 'currency-pound' : 'currency-euro',
  )

  return {
    market,
    units,
    currencyIcon,
    setMarket,
    formatDistance,
    formatCost,
    formatFuelUsed,
    formatEnergySplit,
    formatVehicleConsumption,
    getPriceDefault,
    getPriceFieldLabel,
    formatDuration,
  }
}
