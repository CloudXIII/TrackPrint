// [I] Components that only display results (ResultsPanel, StatTile) never
// import uiStore and are never burdened by market/unit preferences.
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTripStore = defineStore('trip', () => {
  // Form inputs
  const from    = ref(null)
  const to      = ref(null)
  const vehicle = ref(null)
  const fuel    = ref(null)

  // Results
  const distanceKm     = ref(null)
  const durationMin    = ref(null)
  const energyUsed     = ref(null)
  const energyUsedLitres = ref(null)
  const energyUsedKwh  = ref(null)
  const isSplitEnergy  = ref(false)
  const cost           = ref(null)
  const co2Kg          = ref(null)
  const polyline       = ref([])
  const equivalents    = ref([])

  function setInputs(f, t, v, fu) {
    from.value    = f
    to.value      = t
    vehicle.value = v
    fuel.value    = fu
  }

  function setResults(r) {
    distanceKm.value       = r.distanceKm
    durationMin.value      = r.durationMin
    energyUsed.value       = r.energyUsed
    energyUsedLitres.value = r.energyUsedLitres ?? null
    energyUsedKwh.value    = r.energyUsedKwh ?? null
    isSplitEnergy.value    = r.isSplitEnergy ?? false
    cost.value             = r.cost
    co2Kg.value            = r.co2Kg
    polyline.value         = r.polyline
    equivalents.value      = r.equivalents
  }

  function reset() {
    distanceKm.value       = null
    durationMin.value      = null
    energyUsed.value       = null
    energyUsedLitres.value = null
    energyUsedKwh.value    = null
    isSplitEnergy.value    = false
    cost.value             = null
    co2Kg.value            = null
    polyline.value         = []
    equivalents.value      = []
  }

  return {
    from, to, vehicle, fuel,
    distanceKm, durationMin, energyUsed, energyUsedLitres, energyUsedKwh,
    isSplitEnergy, cost, co2Kg, polyline, equivalents,
    setInputs, setResults, reset,
  }
})
