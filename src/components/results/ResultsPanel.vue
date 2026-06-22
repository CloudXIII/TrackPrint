<script setup lang="ts">
import { useTripStats } from '@/composables/trip/useTripStats.ts'
import StatTile from '@/components/results/StatTile.vue'
import Co2Tile from '@/components/results/Co2Tile.vue'
import ExportCard from '@/components/results/ExportCard.vue'
import TablerIcon from '@/components/ui/TablerIcon.vue'

const {
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
} = useTripStats()
</script>

<template>
  <div class="results-panel-shell">
      <section class="results-panel" aria-label="Trip results">
        <div class="results-panel__body">
          <h3 class="results-panel__title">
            <TablerIcon name="chart-bar" :size="18" />
            Results
          </h3>

          <div class="results-panel__grid">
            <StatTile
              icon="route"
              label="Distance"
              :value="distanceFmt.value"
              :unit="distanceFmt.label"
              compact
            />
            <StatTile
              icon="clock"
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
              <TablerIcon name="leaf" :size="16" />
              Environmental impact
            </h4>
            <Co2Tile
              :co2-kg="co2Kg ?? 0"
              :equivalents="equivalents"
              :show-grid-note="showGridCo2Note"
              compact
            />
          </div>
        </div>

        <ExportCard v-if="showExport" class="results-panel__export" />
      </section>
    </div>
</template>

<style lang="scss" scoped>
.results-panel-shell {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  height: 100%;
  border-radius: $radius-xl;
  box-shadow: $shadow-panel;
  background: var(--surface-card);
}

.results-panel {
  height: 100%;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  background: var(--surface-card);
  border-radius: $radius-xl;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  &__body {
    flex: 1;
    min-height: 0;
    padding: $space-4;
    display: flex;
    flex-direction: column;
    gap: $space-3;
    overflow: hidden;

    @media (max-width: $bp-tablet) {
      padding: $space-3;
      gap: $space-2;
    }
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $text-md;
    font-weight: 600;
    color: var(--text-primary);
    flex-shrink: 0;

    @media (max-width: $bp-tablet) {
      font-size: $text-sm;
    }

    .tabler-icon { color: $green-500; }
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: $space-2;
    flex-shrink: 0;
    width: 100%;
    min-width: 0;

    @media (max-width: $bp-tablet) {
      gap: $space-1;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    flex: 1;
    min-height: 0;
    padding-top: $space-1;
    border-top: $border-control solid var(--border-subtle);
    overflow: hidden;

    @media (max-width: $bp-tablet) {
      gap: $space-2;
      padding-top: 0;
      border-top: none;
    }

    :deep(.co2-tile) {
      flex: 1;
      min-height: 0;
    }
  }

  &__export {
    flex-shrink: 0;
    padding: 0 $space-4 $space-4;

    @media (max-width: $bp-tablet) {
      padding: $space-2 $space-3 $space-3;
      border-top: $border-control solid var(--border-subtle);
    }
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $text-xs;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--text-secondary);
    flex-shrink: 0;

    .tabler-icon {
      color: $green-500;
    }
  }
}
</style>
