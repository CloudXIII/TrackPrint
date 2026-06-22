<script setup lang="ts">
import TablerIcon from '@/components/ui/TablerIcon.vue'

withDefaults(defineProps<{
  icon: string
  label: string
  value: string | number
  unit?: string
  accent?: boolean
  compact?: boolean
}>(), {
  unit: '',
  accent: false,
  compact: false,
})
</script>

<template>
  <div class="stat-tile" :class="{ 'stat-tile--accent': accent, 'stat-tile--compact': compact }">
    <div class="stat-tile__icon">
      <TablerIcon :name="icon" :size="compact ? 16 : 20" />
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
  background: var(--surface-card);
  border: $border-control solid var(--border-subtle);
  border-radius: $radius-lg;
  transition: border-color $transition-fast;
  min-width: 0;
  max-width: 100%;

  &--compact {
    padding: $space-2 $space-3;
    gap: $space-2;

    @media (max-width: $bp-tablet) {
      padding: $space-2;
      gap: $space-1;
    }

    .stat-tile__icon {
      width: 32px;
      height: 32px;

      @media (max-width: $bp-tablet) {
        width: 28px;
        height: 28px;
      }
    }

    .stat-tile__value {
      font-size: 1.0625rem;

      @media (max-width: $bp-tablet) {
        font-size: 0.9375rem;
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
        line-height: 1.25;
      }
    }

    .stat-tile__label {
      font-size: 0.75rem;

      @media (max-width: $bp-tablet) {
        font-size: 0.6875rem;
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
      }
    }
  }

  &--accent {
    background: var(--surface-accent);
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
    color: var(--text-primary);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__unit {
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--text-secondary);
    margin-left: $space-1;
  }

  &__label {
    font-size: $text-sm;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
