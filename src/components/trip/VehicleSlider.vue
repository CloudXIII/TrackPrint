<script setup lang="ts">
import { computed } from 'vue'
import { VEHICLES, getVehicleLabel } from '@/config/vehicles.ts'
import { useUnitPreferences } from '@/composables/useUnitPreferences.ts'
import TablerIcon from '@/components/ui/TablerIcon.vue'
import type { FuelType, VehicleProfile } from '@/types/index.ts'

const props = defineProps<{
  modelValue?: VehicleProfile | null
  fuel?: FuelType | null
}>()
const emit = defineEmits<{
  'update:modelValue': [value: VehicleProfile]
}>()

const { formatVehicleConsumption, market } = useUnitPreferences()

function select(vehicle: VehicleProfile) {
  emit('update:modelValue', vehicle)
}

function consumptionFor(vehicle: VehicleProfile) {
  return formatVehicleConsumption(vehicle, props.fuel ?? null)
}

const selectedConsumption = computed(() =>
  props.modelValue ? consumptionFor(props.modelValue) : { value: '—', label: '', suffix: '' },
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
        <TablerIcon :name="v.icon ?? 'car'" :size="16" class="segmented-control__icon" />
        <span>{{ getVehicleLabel(v, market) }}</span>
      </button>
    </div>

    <div v-if="modelValue" class="info-bar" aria-live="polite">
      <span>{{ getVehicleLabel(modelValue, market) }}</span>
      <span class="info-bar__sep" aria-hidden="true">·</span>
      <span class="info-bar__mono">
        Est. {{ selectedConsumption.value }} {{ selectedConsumption.suffix }}
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
