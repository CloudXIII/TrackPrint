<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore.js'
import { useUiStore }   from '@/stores/uiStore.js'
import { useUnits }     from '@/composables/useUnits.js'
import StatTile from '@/components/StatTile.vue'
import Co2Tile  from '@/components/Co2Tile.vue'
import ExportCard from '@/components/ExportCard.vue'

const tripStore = useTripStore()
const { market } = storeToRefs(useUiStore())
const {
  distanceKm, durationMin, energyUsed, energyUsedLitres, energyUsedKwh,
  isSplitEnergy, cost, co2Kg, equivalents, fuel,
} = storeToRefs(tripStore)
const { formatDistance, formatCost, formatFuelUsed, formatEnergySplit, formatDuration } = useUnits()

const distanceFmt = computed(() => formatDistance(distanceKm.value))
const durationFmt = computed(() =>
  durationMin.value !== null ? formatDuration(durationMin.value) : { value: '—', label: '' },
)
const costFmt = computed(() => formatCost(cost.value))

const energyFmt = computed(() => {
  if (isSplitEnergy.value) {
    return formatEnergySplit(energyUsedLitres.value, energyUsedKwh.value)
  }
  return formatFuelUsed(energyUsed.value, fuel.value) ?? { value: '—', label: '' }
})

const energyLabel = computed(() =>
  isSplitEnergy.value ? 'Energy used' : 'Fuel used',
)

const energyIcon = computed(() =>
  isSplitEnergy.value ? 'ti-bolt' : 'ti-droplet',
)

const costIcon = computed(() =>
  market.value === 'uk' ? 'ti-currency-pound' : 'ti-currency-euro',
)

const showGridCo2Note = computed(() =>
  fuel.value?.id === 'electric' ||
  (fuel.value?.id === 'plugin' && (energyUsedKwh.value ?? 0) > 0),
)

const showExport = computed(() => (distanceKm.value ?? 0) > 0)
</script>

<template>
  <Transition name="slide-up">
    <div class="results-panel-shell">
      <section class="results-panel" aria-label="Trip results">
        <div class="results-panel__scroll">
          <h3 class="results-panel__title">
            <i class="ti ti-chart-bar" aria-hidden="true" />
            Results
          </h3>

          <div class="results-panel__grid">
            <StatTile
              icon="ti-route"
              label="Distance"
              :value="distanceFmt.value"
              :unit="distanceFmt.label"
              compact
            />
            <StatTile
              icon="ti-clock"
              label="Drive time"
              :value="durationFmt.value"
              :unit="durationFmt.label"
              compact
            />
            <StatTile
              :icon="energyIcon"
              :label="energyLabel"
              :value="energyFmt.value"
              :unit="energyFmt.label"
              accent
              compact
            />
            <StatTile
              :icon="costIcon"
              label="Estimated cost"
              :value="`${costFmt.symbol}${costFmt.value}`"
              accent
              compact
            />
          </div>

          <div class="results-panel__section">
            <h4 class="results-panel__section-title">
              <i class="ti ti-leaf" aria-hidden="true" />
              Environmental impact
            </h4>
            <Co2Tile
              :co2-kg="co2Kg"
              :equivalents="equivalents"
              :show-grid-note="showGridCo2Note"
              compact
            />
          </div>

          <ExportCard v-if="showExport" class="results-panel__export" />
        </div>
      </section>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.results-panel-shell {
  flex: 1;
  min-height: 0;
  height: 100%;
  border-radius: $radius-xl;
  box-shadow: $shadow-panel;
}

.results-panel {
  height: 100%;
  background: $white;
  border-radius: $radius-xl;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  &__scroll {
    flex: 1;
    min-height: 0;
    padding: $space-4;
    display: flex;
    flex-direction: column;
    gap: $space-3;
    overflow-x: hidden;
    overflow-y: auto;
    justify-content: flex-start;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $text-md;
    font-weight: 600;
    color: $gray-900;
    flex-shrink: 0;

    .ti { color: $green-500; }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-2;
    flex-shrink: 0;

    @media (max-width: $bp-mobile) {
      grid-template-columns: 1fr;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    flex-shrink: 0;
    padding-top: $space-1;
    border-top: $border-control solid $green-100;
  }

  &__export {
    margin-top: auto;
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $text-xs;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: $gray-600;

    .ti {
      font-size: $text-base;
      color: $green-500;
    }
  }
}

.slide-up-enter-active {
  transition-delay: 350ms;
}
</style>
