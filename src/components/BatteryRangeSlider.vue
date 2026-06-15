<script setup>
import { computed } from 'vue'
import { useUnits } from '@/composables/useUnits.js'

const modelValue = defineModel({ type: Number, required: true })

const { units } = useUnits()

const range = computed(() => units.value.pluginRange)

const displayValue = computed(() => `${modelValue.value} ${range.value.unit}`)
</script>

<template>
  <div class="callout-panel battery-range">
    <div class="battery-range__header">
      <label class="form-label battery-range__label" for="battery-range">
        <i class="ti ti-battery-charging" aria-hidden="true" />
        Battery Range (Electric only)
      </label>
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
    />
    <div class="battery-range__ticks">
      <span>{{ range.min }} {{ range.unit }}</span>
      <span>{{ range.max }} {{ range.unit }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.battery-range {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    margin-bottom: $space-2;
  }

  &__label {
    display: flex;
    align-items: center;
    gap: $space-2;

    .ti {
      color: $green-500;
      font-size: 1rem;
    }
  }

  &__value {
    font-size: $text-sm;
    font-weight: 600;
    font-family: $font-mono;
    color: $color-info-text;
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
    margin-top: $space-2;
    font-size: $text-xs;
    color: $gray-400;
    font-family: $font-mono;
  }
}
</style>
