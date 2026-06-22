<script setup lang="ts">
import { getVehicleLabel } from '@/config/vehicles.ts'
import { getShortLocationLabel } from '@/utils/locationLabel.ts'
import { useUnitPreferences } from '@/composables/useUnitPreferences.ts'
import TablerIcon from '@/components/ui/TablerIcon.vue'
import type { FuelType, GeoLocation, VehicleProfile } from '@/types/index.ts'

defineProps<{
  from?: GeoLocation | null
  to?: GeoLocation | null
  vehicle?: VehicleProfile | null
  fuel?: FuelType | null
}>()

const { market } = useUnitPreferences()
</script>

<template>
  <div class="summary-row">
    <span class="summary-row__loc">
      <TablerIcon name="map-pin" :size="14" />
      {{ getShortLocationLabel(from) }}
    </span>
    <TablerIcon name="arrow-right" :size="14" class="summary-row__arrow" />
    <span class="summary-row__loc summary-row__loc--dest">
      <TablerIcon name="flag" :size="14" />
      {{ getShortLocationLabel(to) }}
    </span>
    <span class="summary-row__sep" aria-hidden="true">·</span>
    <span class="summary-row__meta" v-if="vehicle">
      <TablerIcon :name="vehicle.icon ?? 'car'" :size="14" />
      {{ getVehicleLabel(vehicle, market) }}
    </span>
    <span class="summary-row__sep" aria-hidden="true">·</span>
    <span class="summary-row__meta" v-if="fuel">{{ fuel.label }}</span>
  </div>
</template>

<style lang="scss" scoped>
.summary-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-3 $space-5;
  background: $color-info-bg;
  border-top: $border-control solid $green-100;
  font-size: $text-base;
  color: $gray-600;

  &__loc {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font-weight: 500;
    color: $gray-900;

    .tabler-icon {
      color: $green-500;
    }

    &--dest .tabler-icon {
      color: $green-700;
    }
  }

  &__arrow {
    color: $green-500;
  }

  &__sep {
    color: $gray-400;
    font-weight: 300;
  }

  &__meta {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
  }
}
</style>
