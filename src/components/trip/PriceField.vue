<script setup lang="ts">
defineProps<{
  id: string
  label: string
  symbol: string
  placeholder: string
}>()

const modelValue = defineModel<number | null>({ required: true })
</script>

<template>
  <div class="form-section form-section--inline">
    <label class="form-label" :for="id">{{ label }}</label>
    <div class="price-field">
      <span class="price-field__symbol">{{ symbol }}</span>
      <input
        :id="id"
        v-model.number="modelValue"
        class="price-field__input"
        type="number"
        step="0.01"
        min="0"
        :placeholder="placeholder"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.form-section {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  &--inline {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: $space-3;
  }
}

.price-field {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  width: 88px;
  border: $border-control solid $green-100;
  border-radius: $radius-md;
  overflow: hidden;
  transition: border-color $transition-fast, box-shadow $transition-fast;
  background: $white;

  &:focus-within {
    border-color: $green-500;
    box-shadow: $focus-ring;
  }

  &__symbol {
    display: flex;
    align-items: center;
    padding: 0 $space-2;
    background: $color-info-bg;
    border-right: $border-control solid $green-100;
    color: $color-info-text;
    font-weight: 500;
    font-size: $text-sm;
    white-space: nowrap;
  }

  &__input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    padding: $space-2 $space-2;
    background: transparent;
    font-size: $text-base;
    color: $gray-900;
    text-align: right;

    &:focus {
      box-shadow: none;
    }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
    }

    -moz-appearance: textfield;
  }
}
</style>
