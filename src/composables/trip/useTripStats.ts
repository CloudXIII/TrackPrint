import { computed } from 'vue'
import { useTripState } from '@/composables/trip/useTripState.ts'
import { useUnitPreferences } from '@/composables/useUnitPreferences.ts'
import { calcEquivalents, usesGridElectricity } from '@/services/calculations/emissionsService.ts'
import { calcDisplayCost } from '@/services/calculations/fuelService.ts'
import type { PdfStatItem } from '@/types/index.ts'

/** Formatted trip statistics for the results panel and PDF export. */
export function useTripStats() {
  const {
    distanceKm, durationMin, energyUsed, energyUsedLitres, energyUsedKwh,
    isSplitEnergy, cost, fuelPriceAtCalc, electricityPriceAtCalc, calculationMarket,
    co2Kg, fuel,
  } = useTripState()

  const {
    market,
    currencyIcon,
    formatDistance,
    formatCost,
    formatFuelUsed,
    formatEnergySplit,
    formatDuration,
  } = useUnitPreferences()

  const distanceFmt = computed(() => formatDistance(distanceKm.value))
  const durationFmt = computed(() =>
    durationMin.value !== null ? formatDuration(durationMin.value) : { value: '—', label: '' },
  )
  const displayCost = computed(() => {
    if (
      cost.value == null
      || fuelPriceAtCalc.value == null
      || electricityPriceAtCalc.value == null
      || calculationMarket.value == null
      || !fuel.value
    ) {
      return cost.value
    }

    return calcDisplayCost({
      energyUsed: energyUsed.value ?? 0,
      energyUsedLitres: energyUsedLitres.value,
      energyUsedKwh: energyUsedKwh.value,
      isSplitEnergy: isSplitEnergy.value,
      fuelId: fuel.value.id,
      fuelPriceAtCalc: fuelPriceAtCalc.value,
      electricityPriceAtCalc: electricityPriceAtCalc.value,
      calculationMarket: calculationMarket.value,
      displayMarket: market.value,
    })
  })

  const costFmt = computed(() => formatCost(displayCost.value))

  const energyFmt = computed(() => {
    if (isSplitEnergy.value) {
      return formatEnergySplit(energyUsedLitres.value, energyUsedKwh.value)
    }
    return formatFuelUsed(energyUsed.value, fuel.value) ?? { value: '—', label: '' }
  })

  const energyLabel = computed(() =>
    isSplitEnergy.value ? 'Fuel + electricity' : 'Fuel used',
  )

  const energyIcon = computed(() =>
    isSplitEnergy.value ? 'bolt' : 'droplet',
  )

  const costIcon = computed(() => currencyIcon.value)

  const showGridCo2Note = computed(() =>
    usesGridElectricity(fuel.value?.id ?? '', energyUsedKwh.value),
  )

  const showExport = computed(() => (distanceKm.value ?? 0) > 0)

  const equivalents = computed(() =>
    co2Kg.value != null ? calcEquivalents(co2Kg.value, market.value) : [],
  )

  function buildPdfStats(): PdfStatItem[] {
    const dist = distanceFmt.value
    const dur = durationFmt.value
    const costFormatted = costFmt.value

    let energyValue = '—'
    if (isSplitEnergy.value) {
      energyValue = String(energyFmt.value.value)
    } else if (energyFmt.value.value !== '—') {
      energyValue = `${energyFmt.value.value} ${energyFmt.value.label}`.trim()
    }

    return [
      { icon: 'route', value: `${dist.value} ${dist.label}`.trim(), label: 'Distance' },
      { icon: 'clock', value: `${dur.value} ${dur.label}`.trim(), label: 'Drive time' },
      { icon: isSplitEnergy.value ? 'bolt' : 'droplet', value: energyValue, label: energyLabel.value, accent: true },
      { icon: 'coins', value: `${costFormatted.symbol}${costFormatted.value}`, label: 'Estimated cost', accent: true },
    ]
  }

  return {
    co2Kg,
    equivalents,
    distanceFmt,
    durationFmt,
    costFmt,
    energyFmt,
    energyLabel,
    energyIcon,
    costIcon,
    showGridCo2Note,
    showExport,
    buildPdfStats,
  }
}
