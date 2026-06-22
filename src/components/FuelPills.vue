<script setup lang="ts">
import { FUEL_ID_ELECTRIC } from '@/constants/index.ts'
import { FUELS } from '@/config/fuels.ts'
import type { FuelType } from '@/types/index.ts'

defineProps<{
  modelValue?: FuelType | null
}>()
const emit = defineEmits<{
  'update:modelValue': [value: FuelType]
}>()

function select(fuel: FuelType) {  emit('update:modelValue', fuel)
}
</script>

<template>
  <div class="segmented-control" role="radiogroup" aria-label="Fuel type">
    <button
      v-for="f in FUELS"
      :key="f.id"
      class="segmented-control__option"
      :class="{
        'segmented-control__option--active': modelValue?.id === f.id,
        'segmented-control__option--accent':  f.id === FUEL_ID_ELECTRIC,
      }"
      role="radio"
      :aria-checked="modelValue?.id === f.id"
      @click="select(f)"
    >
      {{ f.label }}
    </button>
  </div>
</template>

