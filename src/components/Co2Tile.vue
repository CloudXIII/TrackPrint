<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const props = defineProps({
  co2Kg:         { type: Number, required: true },
  equivalents:   { type: Array,  required: true },
  showGridNote:  { type: Boolean, default: false },
  compact:       { type: Boolean, default: false },
})

const activeIndex = ref(0)
let intervalId = null

const activeEquiv = computed(() => props.equivalents[activeIndex.value] ?? null)

function next() {
  activeIndex.value = (activeIndex.value + 1) % props.equivalents.length
}

function goTo(i) {
  activeIndex.value = i
  restartInterval()
}

function restartInterval() {
  clearInterval(intervalId)
  intervalId = setInterval(next, 3500)
}

onMounted(() => { intervalId = setInterval(next, 3500) })
onBeforeUnmount(() => clearInterval(intervalId))
</script>

<template>
  <div class="co2-tile" :class="{ 'co2-tile--compact': compact }">
    <div class="co2-tile__main">
      <div class="co2-tile__metric">
        <div class="co2-tile__icon-wrap">
          <i class="ti ti-leaf" aria-hidden="true" />
        </div>
        <div class="co2-tile__headline-wrap">
          <div class="co2-tile__headline">
            {{ co2Kg.toFixed(2) }}<span class="co2-tile__unit"> kg CO₂</span>
          </div>
          <div class="co2-tile__sublabel">Carbon footprint</div>
        </div>
      </div>

      <div class="co2-tile__equiv" v-if="activeEquiv">
        <Transition name="equiv-fade" mode="out-in">
          <div class="co2-tile__equiv-inner" :key="activeEquiv.id">
            <div class="co2-tile__equiv-icon">
              <i :class="['ti', activeEquiv.icon]" aria-hidden="true" />
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
      <i class="ti ti-info-circle" aria-hidden="true" />
      Zero tailpipe emissions, but charging still draws grid electricity — this is a
      well-to-wheel CO₂ estimate, not zero overall.
    </p>

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
</template>

<style lang="scss" scoped>
.co2-tile {
  background: $green-900;
  border-radius: $radius-lg;
  padding: $space-4;
  color: $white;
  flex-shrink: 0;

  &--compact {
    padding: $space-3;

    .co2-tile__icon-wrap {
      width: 32px;
      height: 32px;

      .ti { font-size: 1rem; }
    }

    .co2-tile__headline {
      font-size: 1.0625rem;
    }

    .co2-tile__equiv {
      min-height: 52px;
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

    .ti { font-size: 1.25rem; }
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

  &__equiv {
    min-height: 60px;
    display: flex;
    align-items: center;
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

    .ti { font-size: 1rem; }
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
    color: rgba($white, 0.5);
    line-height: 1.35;
  }

  &__note {
    display: flex;
    align-items: flex-start;
    gap: $space-2;
    margin-top: $space-3;
    font-size: 0.6875rem;
    line-height: 1.45;
    color: rgba($white, 0.72);

    .ti {
      flex-shrink: 0;
      margin-top: 1px;
      font-size: 0.8125rem;
      color: $green-300;
    }
  }

  &__dots {
    display: flex;
    justify-content: center;
    gap: $space-2;
    margin-top: $space-3;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-pill;
    background: rgba($white, 0.25);
    transition: background $transition-fast, transform $transition-fast;
    padding: 0;

    &--active {
      background: $green-300;
      transform: scale(1.35);
    }

    &:hover:not(&--active) {
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
