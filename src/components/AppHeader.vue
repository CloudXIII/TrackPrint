<script setup>
import MarketToggle from '@/components/MarketToggle.vue'
import ThemeToggle  from '@/components/ThemeToggle.vue'
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__brand">
        <svg class="app-header__logo" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.15)"/>
          <path d="M6 20 L10 8 L14 16 L18 10 L22 20" stroke="#74C69D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="22" cy="20" r="2" fill="#74C69D"/>
        </svg>
        <span class="app-header__wordmark">TrackPrint</span>
        <span class="app-header__tagline">Trip CO₂ calculator</span>
      </div>
      <div class="app-header__controls">
        <ThemeToggle />
        <MarketToggle />
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  background: $green-700;
  box-shadow: 0 2px 8px rgba($green-900, 0.25);
  position: sticky;
  top: 0;
  z-index: 100;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1160px;
    margin: 0 auto;
    padding: $space-4 $space-6;

    @media (max-width: $bp-mobile) {
      padding: $space-3 $space-4;
    }
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: $space-3;
  }

  &__logo {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }

  &__wordmark {
    font-size: 1.25rem;
    font-weight: 700;
    color: $white;
    letter-spacing: -0.02em;
  }

  &__tagline {
    font-size: 0.75rem;
    color: rgba($white, 0.6);
    padding-left: $space-3;
    border-left: 1px solid rgba($white, 0.2);
    line-height: 1;

    @media (max-width: $bp-mobile) {
      display: none;
    }
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: $space-2;
    flex-shrink: 0;
  }
}
</style>
