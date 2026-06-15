<script setup>
defineProps({
  icon:    { type: String, required: true },
  label:   { type: String, required: true },
  value:   { type: [String, Number], required: true },
  unit:    { type: String, default: '' },
  accent:  { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <div class="stat-tile" :class="{ 'stat-tile--accent': accent, 'stat-tile--compact': compact }">
    <div class="stat-tile__icon">
      <i :class="['ti', icon]" aria-hidden="true" />
    </div>
    <div class="stat-tile__body">
      <span class="stat-tile__value">
        {{ value }}<span v-if="unit" class="stat-tile__unit">{{ unit }}</span>
      </span>
      <span class="stat-tile__label">{{ label }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stat-tile {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4 $space-5;
  background: $white;
  border: $border-control solid $green-100;
  border-radius: $radius-lg;
  transition: border-color $transition-fast;

  &--compact {
    padding: $space-2 $space-3;
    gap: $space-2;

    .stat-tile__icon {
      width: 32px;
      height: 32px;

      .ti { font-size: 1rem; }
    }

    .stat-tile__value {
      font-size: 1.0625rem;
    }

    .stat-tile__label {
      font-size: 0.75rem;
    }
  }

  &--accent {
    background: $green-50;
    border-color: $green-300;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    background: $green-100;
    color: $green-700;
    flex-shrink: 0;

    .ti { font-size: 1.25rem; }

    .stat-tile--accent & {
      background: $green-300;
      color: $green-900;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__value {
    font-size: 1.375rem;
    font-weight: 600;
    color: $gray-900;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__unit {
    font-size: 0.875rem;
    font-weight: 400;
    color: $gray-600;
    margin-left: $space-1;
  }

  &__label {
    font-size: $text-sm;
    color: $gray-600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
