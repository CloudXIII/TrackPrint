<script setup>
import { getVehicleLabel } from '@/config/vehicles.js'

defineProps({
  from:    { type: Object, default: null },
  to:      { type: Object, default: null },
  vehicle: { type: Object, default: null },
  fuel:    { type: Object, default: null },
})

function shortLabel(location) {
  if (!location) return '—'
  return location.label.split(',')[0].trim()
}
</script>

<template>
  <div class="summary-row">
    <span class="summary-row__loc">
      <i class="ti ti-map-pin" aria-hidden="true" />
      {{ shortLabel(from) }}
    </span>
    <i class="ti ti-arrow-right summary-row__arrow" aria-hidden="true" />
    <span class="summary-row__loc summary-row__loc--dest">
      <i class="ti ti-flag" aria-hidden="true" />
      {{ shortLabel(to) }}
    </span>
    <span class="summary-row__sep" aria-hidden="true">·</span>
    <span class="summary-row__meta" v-if="vehicle">
      <i :class="['ti', vehicle.icon]" aria-hidden="true" />
      {{ getVehicleLabel(vehicle) }}
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

    .ti {
      color: $green-500;
      font-size: 0.875rem;
    }

    &--dest .ti {
      color: $green-700;
    }
  }

  &__arrow {
    color: $green-500;
    font-size: 0.875rem;
  }

  &__sep {
    color: $gray-400;
    font-weight: 300;
  }

  &__meta {
    display: inline-flex;
    align-items: center;
    gap: $space-1;

    .ti { font-size: 0.875rem; }
  }
}
</style>
