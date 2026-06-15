<script setup>
import { computed } from 'vue'
import { VEHICLES, getVehicleLabel } from '@/config/vehicles.js'
import { useUnits } from '@/composables/useUnits.js'

const props = defineProps({
  modelValue: { type: Object, default: null },
  fuel:       { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const { formatVehicleConsumption } = useUnits()

function select(vehicle) {
  emit('update:modelValue', vehicle)
}

function consumptionFor(vehicle) {
  return formatVehicleConsumption(vehicle, props.fuel)
}

const selectedConsumption = computed(() =>
  consumptionFor(props.modelValue)
)
</script>

<template>
  <div class="vehicle-slider">
    <div class="segmented-control" role="radiogroup" aria-label="Vehicle type">
      <button
        v-for="v in VEHICLES"
        :key="`${v.id}-${fuel?.id}`"
        class="segmented-control__option"
        :class="{ 'segmented-control__option--active': modelValue?.id === v.id }"
        role="radio"
        :aria-checked="modelValue?.id === v.id"
        @click="select(v)"
      >
        <i :class="['ti', v.icon, 'segmented-control__icon']" aria-hidden="true" />
        <span>{{ getVehicleLabel(v) }}</span>
      </button>
    </div>

    <div v-if="modelValue" class="info-bar" aria-live="polite">
      <span>{{ getVehicleLabel(modelValue) }}</span>
      <span class="info-bar__sep" aria-hidden="true">·</span>
      <span class="info-bar__mono">
        {{ selectedConsumption.value }} {{ selectedConsumption.suffix }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vehicle-slider {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  width: 100%;
}
</style>
