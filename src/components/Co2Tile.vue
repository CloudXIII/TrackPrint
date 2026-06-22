<script setup lang="ts">
import { CO2_EQUIVALENT_ROTATION_MS } from '@/constants/index.ts'
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import TablerIcon from '@/components/TablerIcon.vue'
import type { Co2Equivalent } from '@/types/index.ts'

const props = defineProps<{
  co2Kg: number
  equivalents: Co2Equivalent[]
  showGridNote?: boolean
  compact?: boolean
}>()

const activeIndex = ref(0)
const isPaused = ref(false)
let intervalId: ReturnType<typeof setInterval> | null = null

const activeEquiv = computed(() => props.equivalents[activeIndex.value] ?? null)

function next() {
  activeIndex.value = (activeIndex.value + 1) % props.equivalents.length
}

function startInterval() {
  if (intervalId != null) clearInterval(intervalId)
  intervalId = setInterval(next, CO2_EQUIVALENT_ROTATION_MS)
}

function stopInterval() {
  if (intervalId != null) clearInterval(intervalId)
  intervalId = null
}

function goTo(i: number) {
  activeIndex.value = i
  if (!isPaused.value) startInterval()
}

function togglePause() {
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    stopInterval()
  } else {
    startInterval()
  }
}

onMounted(startInterval)
onBeforeUnmount(stopInterval)
</script>

<template>
  <div class="co2-tile" :class="{ 'co2-tile--compact': compact }">
    <div class="co2-tile__main">
      <div class="co2-tile__metric">
        <div class="co2-tile__icon-wrap">
          <TablerIcon name="leaf" :size="20" />
        </div>
        <div class="co2-tile__headline-wrap">
          <div class="co2-tile__headline">
            {{ co2Kg.toFixed(2) }}<span class="co2-tile__unit"> kg CO₂</span>
          </div>
          <div class="co2-tile__sublabel">Carbon footprint</div>
        </div>
      </div>

      <div class="co2-tile__equiv" v-if="activeEquiv">
        <p class="co2-tile__equiv-heading">Everyday comparison</p>
        <Transition name="equiv-fade" mode="out-in">
          <div class="co2-tile__equiv-inner" :key="activeEquiv.id">
            <div class="co2-tile__equiv-icon">
              <TablerIcon :name="activeEquiv.icon" :size="16" />
            </div>
            <div class="co2-tile__equiv-text">
              <strong class="co2-tile__equiv-value">
                {{ activeEquiv.value }}<span v-if="activeEquiv.unit"> {{ activeEquiv.unit }}</span>
              </strong>
              <span class="co2-tile__equiv-label">{{ activeEquiv.label }}</span>
              <span class="co2-tile__equiv-desc">{{ activeEquiv.description }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <p v-if="showGridNote" class="co2-tile__note">
      <TablerIcon name="info-circle" :size="13" />
      Zero tailpipe emissions, but charging still draws grid electricity — this is a
      well-to-wheel CO₂ estimate, not zero overall.
    </p>

    <p class="co2-tile__estimate-note">
      CO₂ figures are estimates only.
    </p>

    <div class="co2-tile__controls">
      <button
        type="button"
        class="co2-tile__dot co2-tile__dot--pause"
        :aria-label="isPaused ? 'Resume comparisons' : 'Pause comparisons'"
        :aria-pressed="isPaused"
        @click="togglePause"
      >
        <TablerIcon :name="isPaused ? 'player-play' : 'player-pause'" :size="20" />
      </button>
      <div class="co2-tile__dots" role="tablist" aria-label="CO₂ equivalents">
        <button
          v-for="(eq, i) in equivalents"
          :key="eq.id"
          class="co2-tile__dot"
          :class="{ 'co2-tile__dot--active': i === activeIndex }"
          role="tab"
          :aria-selected="i === activeIndex"
          :aria-label="eq.label"
          @click="goTo(i)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.co2-tile {
  background: $green-900;
  border-radius: $radius-lg;
  padding: $space-4;
  color: $white;
  flex-shrink: 0;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;

  &--compact {
    padding: $space-3;

    @media (max-width: $bp-tablet) {
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: $space-2 $space-3;
    }

    .co2-tile__icon-wrap {
      width: 32px;
      height: 32px;

      .tabler-icon { width: 16px; height: 16px; }
    }

    .co2-tile__headline {
      font-size: 1.0625rem;
    }

    .co2-tile__equiv {
      min-height: 52px;

      @media (max-width: $bp-tablet) {
        min-height: 0;
        padding: $space-2;
      }
    }

    .co2-tile__equiv-desc {
      @media (max-width: $bp-tablet) {
        display: none;
      }
    }

    .co2-tile__controls {
      @media (max-width: $bp-tablet) {
        margin-top: $space-2;
      }
    }

    .co2-tile__estimate-note {
      @media (max-width: $bp-tablet) {
        display: none;
      }
    }

    .co2-tile__note {
      @media (max-width: $bp-tablet) {
        display: none;
      }
    }

    .co2-tile__main {
      @media (max-width: $bp-tablet) {
        gap: $space-2;
      }
    }
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__metric {
    display: flex;
    align-items: flex-start;
    gap: $space-3;
  }

  &__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    background: rgba($green-300, 0.2);
    color: $green-300;
    flex-shrink: 0;

    .tabler-icon { width: 20px; height: 20px; }
  }

  &__headline-wrap {
    min-width: 0;
  }

  &__headline {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.2;
    color: $white;
  }

  &__unit {
    font-size: 0.875rem;
    font-weight: 400;
    color: $green-300;
  }

  &__sublabel {
    font-size: 0.75rem;
    color: rgba($white, 0.6);
    margin-top: 2px;
  }

  &__equiv-heading {
    margin: 0;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba($white, 0.55);
  }

  &__estimate-note {
    margin: $space-2 0 0;
    font-size: 0.625rem;
    line-height: 1.4;
    color: rgba($white, 0.5);
    text-align: center;
  }

  &__equiv {
    min-height: 60px;
    display: flex;
    flex-direction: column;
    gap: $space-2;
    padding: $space-3;
    background: rgba($green-300, 0.08);
    border: 1px solid rgba($green-300, 0.15);
    border-radius: $radius-md;
  }

  &__equiv-inner {
    display: flex;
    align-items: center;
    gap: $space-3;
    width: 100%;
  }

  &__equiv-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    background: rgba($green-300, 0.15);
    color: $green-300;
    flex-shrink: 0;

    .tabler-icon { width: 16px; height: 16px; }
  }

  &__equiv-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__equiv-value {
    font-size: 0.9375rem;
    font-weight: 600;
    color: $white;
  }

  &__equiv-label {
    font-size: 0.75rem;
    color: $green-300;
  }

  &__equiv-desc {
    font-size: 0.6875rem;
    color: rgba($white, 0.72);
    line-height: 1.45;
  }

  &__note {
    display: flex;
    align-items: flex-start;
    gap: $space-2;
    margin-top: $space-3;
    font-size: 0.6875rem;
    line-height: 1.45;
    color: rgba($white, 0.72);

    .tabler-icon {
      flex-shrink: 0;
      margin-top: 1px;
      color: $green-300;
    }
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: $space-3;
  }

  &__dots {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__dot {
    position: relative;
    width: 6px;
    height: 6px;
    border-radius: $radius-pill;
    background: rgba($white, 0.25);
    transition: background $transition-fast, transform $transition-fast, color $transition-fast;
    padding: 0;
    flex-shrink: 0;

    &--active {
      background: $green-300;
      transform: scale(1.35);
    }

    &--pause {
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba($white, 0.45);
      background: transparent;
      margin-right: $space-4;

      &::before {
        content: '';
        position: absolute;
        inset: -8px;
      }

      .tabler-icon {
        position: absolute;
      }

      &:hover {
        color: rgba($white, 0.85);
      }

      &[aria-pressed='true'] {
        color: $green-300;
      }
    }

    &:hover:not(&--active):not(&--pause) {
      background: rgba($white, 0.5);
    }
  }
}

.equiv-fade-enter-active,
.equiv-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.equiv-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.equiv-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
