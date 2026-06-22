<script setup lang="ts">
import { useUnitPreferences } from '@/composables/useUnitPreferences.ts'

const { market, setMarket } = useUnitPreferences()
</script>

<template>
  <div class="market-toggle" role="group" aria-label="Market / unit system">
    <button
      class="market-toggle__btn"
      :class="{ 'market-toggle__btn--active': market === 'uk' }"
      type="button"
      @click="setMarket('uk')"
      :aria-pressed="market === 'uk'"
    >
      UK
    </button>
    <button
      class="market-toggle__btn"
      :class="{ 'market-toggle__btn--active': market === 'eu' }"
      type="button"
      @click="setMarket('eu')"
      :aria-pressed="market === 'eu'"
    >
      EU
    </button>
  </div>
</template>

<style lang="scss" scoped>
.market-toggle {
  display: flex;
  align-items: center;
  height: $control-size-sm;
  background: rgba($white, 0.15);
  border-radius: $radius-pill;
  padding: 3px;
  gap: $segment-gap;

  &__btn {
    min-width: 40px;
    height: 100%;
    padding: 0 $space-3;
    border-radius: $radius-pill;
    font-size: $text-sm;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: rgba($white, 0.82);
    transition: background $transition-fast, color $transition-fast, box-shadow $transition-fast;
    white-space: nowrap;

    &:hover:not(&--active) {
      color: $white;
      background: rgba($white, 0.12);
    }

    &--active {
      background: $white;
      color: $green-900;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }
  }
}
</style>
