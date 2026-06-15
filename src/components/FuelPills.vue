<script setup>
import { FUELS } from '@/config/fuels.js'

defineProps({
  modelValue: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

function select(fuel) {
  emit('update:modelValue', fuel)
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
        'segmented-control__option--accent':  f.id === 'electric',
      }"
      role="radio"
      :aria-checked="modelValue?.id === f.id"
      @click="select(f)"
    >
      {{ f.label }}
    </button>
  </div>
</template>
