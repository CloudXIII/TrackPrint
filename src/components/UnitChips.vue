<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/uiStore.js'
import { UNIT_SETS } from '@/config/units.js'

const { market } = storeToRefs(useUiStore())
const units = computed(() => UNIT_SETS[market.value])

const currencyIcon = computed(() =>
  market.value === 'uk' ? 'ti-currency-pound' : 'ti-currency-euro'
)

const chips = computed(() => [
  { icon: 'ti-map-pin',         label: units.value.distance.label },
  { icon: 'ti-gauge',           label: units.value.consumption.label },
  { icon: currencyIcon.value,   label: units.value.fuelPrice.label },
])
</script>

<template>
  <div class="unit-chips" aria-label="Active units">
    <span class="unit-chips__prefix">Units:</span>
    <span
      v-for="chip in chips"
      :key="chip.label"
      class="chip"
    >
      <i :class="['ti', chip.icon]" aria-hidden="true" />
      {{ chip.label }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.unit-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;

  &__prefix {
    font-size: $text-sm;
    color: $gray-400;
  }
}
</style>
