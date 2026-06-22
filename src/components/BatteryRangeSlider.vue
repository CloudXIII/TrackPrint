<script setup lang="ts">
import { computed } from 'vue'
import { useUnitPreferences } from '@/composables/useUnitPreferences.ts'

const modelValue = defineModel({ type: Number, required: true })

const { units } = useUnitPreferences()

const range = computed(() => units.value.pluginRange)

const displayValue = computed(() => `${modelValue.value} ${range.value.unit}`)
</script>

<template>
  <div class="battery-range">
    <div class="battery-range__header">
      <label class="form-label" for="battery-range">Electric range (EV mode)</label>
      <span class="battery-range__value">{{ displayValue }}</span>
    </div>
    <input
      id="battery-range"
      v-model.number="modelValue"
      class="battery-range__input"
      type="range"
      :min="range.min"
      :max="range.max"
      :step="1"
      :aria-valuemin="range.min"
      :aria-valuemax="range.max"
      :aria-valuenow="modelValue"
      :aria-valuetext="displayValue"
    />
    <div class="battery-range__ticks">
      <span>{{ range.min }} {{ range.unit }}</span>
      <span>{{ range.max }} {{ range.unit }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.battery-range {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
  }

  &__value {
    flex-shrink: 0;
    min-width: 88px;
    padding: $space-2 $space-3;
    border: $border-control solid $green-100;
    border-radius: $radius-md;
    background: $white;
    font-size: $text-base;
    font-weight: 600;
    font-family: $font-mono;
    color: $gray-900;
    text-align: right;
    white-space: nowrap;
  }

  &__input {
    width: 100%;
    height: 6px;
    appearance: none;
    background: $green-100;
    border-radius: $radius-pill;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: $green-700;
      border: 2px solid $white;
      box-shadow: $shadow-sm;
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: $green-700;
      border: 2px solid $white;
      box-shadow: $shadow-sm;
      cursor: pointer;
    }
  }

  &__ticks {
    display: flex;
    justify-content: space-between;
    font-size: $text-xs;
    color: $gray-400;
    font-family: $font-mono;
  }
}
</style>
