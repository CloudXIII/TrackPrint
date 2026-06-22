<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useLocationField } from '@/composables/useLocationField.ts'
import { useRouteCalculation } from '@/composables/useRouteCalculation.ts'
import { useFormCollapse } from '@/composables/useFormCollapse.ts'
import { useTripState } from '@/composables/useTripState.ts'
import { useVehicleConfig } from '@/composables/useVehicleConfig.ts'
import { MOBILE_FORM_COLLAPSE_MS } from '@/constants/index.ts'

import VehicleSlider      from '@/components/VehicleSlider.vue'
import FuelPills          from '@/components/FuelPills.vue'
import BatteryRangeSlider from '@/components/BatteryRangeSlider.vue'
import FormSummaryRow     from '@/components/FormSummaryRow.vue'
import TablerIcon         from '@/components/TablerIcon.vue'

import type { GeocodingResult } from '@/types/index.ts'

const emit = defineEmits(['lock-height'])

const props = defineProps<{
  /** Keep form content from scrolling during paired layout animations (e.g. map sheet exit). */
  scrollLock?: boolean
  /** Mobile return phase — form grows into the results area before full-screen layout. */
  layoutReturning?: boolean
}>()

const { collapsed, expandForm } = useFormCollapse()
const { summary } = useTripState()

const fromField = useLocationField()
const toField = useLocationField()

const fromQuery = fromField.query
const fromSuggestions = fromField.geocoding.suggestions
const fromGeocodingError = fromField.geocoding.error
const toQuery = toField.query
const toSuggestions = toField.geocoding.suggestions
const toGeocodingError = toField.geocoding.error
const { calcError, planTrip, loading } = useRouteCalculation()

const {
  selectedVehicle,
  selectedFuel,
  fuelPrice,
  batteryRange,
  priceFieldLabel,
  pricePlaceholder,
  showPluginSlider,
  units,
} = useVehicleConfig()

const errors = ref({ from: '', to: '' })
const bodyInnerRef = ref<HTMLElement | null>(null)
const isExpanding = ref(false)
let expandTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (expandTimer) clearTimeout(expandTimer)
})

const hasOpenSuggestions = computed(
  () => fromSuggestions.value.length > 0 || toSuggestions.value.length > 0,
)

const isScrollLocked = computed(
  () => isExpanding.value || props.scrollLock === true,
)

async function selectFrom(suggestion: GeocodingResult) {
  await fromField.selectSuggestion(suggestion)
  errors.value.from = ''
}

async function selectTo(suggestion: GeocodingResult) {
  await toField.selectSuggestion(suggestion)
  errors.value.to = ''
}

function swapLocations() {
  fromField.swapWith(toField)
}

async function handleCalculate() {
  errors.value = { from: '', to: '' }

  const from = await fromField.resolveForSubmit()
  if (!from) {
    errors.value.from = fromField.geocoding.error.value
      || 'Please select or enter a valid departure location'
    return
  }

  const to = await toField.resolveForSubmit()
  if (!to) {
    errors.value.to = toField.geocoding.error.value
      || 'Please select or enter a valid destination'
    return
  }

  const success = await planTrip({
    from,
    to,
    vehicle: selectedVehicle.value,
    fuel: selectedFuel.value,
    fuelPrice: fuelPrice.value ?? 0,
    batteryRange: batteryRange.value,
  })

  if (success) emit('lock-height')
}

function resetFormScroll() {
  if (bodyInnerRef.value) bodyInnerRef.value.scrollTop = 0
}

function handleEdit() {
  resetFormScroll()
  isExpanding.value = true
  if (expandTimer) clearTimeout(expandTimer)
  expandForm()
  expandTimer = setTimeout(() => {
    resetFormScroll()
    isExpanding.value = false
    expandTimer = null
  }, MOBILE_FORM_COLLAPSE_MS)
}
</script>

<template>
  <div
    class="trip-form"
    :class="{
      'trip-form--collapsed': collapsed,
      'trip-form--expanding': isScrollLocked,
      'trip-form--layout-returning': layoutReturning,
      'trip-form--suggestions-open': hasOpenSuggestions,
    }"
  >
    <div class="trip-form__header">
      <div class="trip-form__header-left">
        <TablerIcon name="route-2" :size="18" />
        <h2 class="trip-form__title">Plan your trip</h2>
      </div>
      <Transition name="form-fade">
        <button
          v-if="collapsed"
          class="trip-form__edit-btn"
          @click="handleEdit"
          aria-label="Edit trip details"
        >
          <TablerIcon name="pencil" :size="14" />
          Edit trip
        </button>
      </Transition>
    </div>

    <Transition name="summary-fade">
      <FormSummaryRow
        v-if="collapsed"
        :from="summary.from"
        :to="summary.to"
        :vehicle="summary.vehicle"
        :fuel="summary.fuel"
      />
    </Transition>

    <div class="trip-form__body">
      <div ref="bodyInnerRef" class="trip-form__body-inner">

        <div class="location-stack">
          <div class="location-stack__fields">
            <div class="location-field" :class="{ 'location-field--error': errors.from }">
              <label class="form-label location-field__label" for="from-input">
                <TablerIcon name="map-pin" :size="14" class="location-field__label-icon" />
                From
              </label>
              <div class="location-field__wrap">
                <input
                  id="from-input"
                  v-model="fromQuery"
                  class="input location-field__input"
                  type="text"
                  placeholder="Departure city…"
                  autocomplete="off"
                  spellcheck="false"
                  @input="fromField.handleInput"
                  @focus="fromField.handleFocus"
                  @blur="fromField.handleBlur"
                />
                <ul
                  v-if="fromSuggestions.length"
                  class="location-field__dropdown"
                  role="listbox"
                >
                  <li
                    v-for="(suggestion, index) in fromSuggestions"
                    :key="`${suggestion.label}-${index}`"
                    class="location-field__option"
                    role="option"
                    @mousedown.prevent="selectFrom(suggestion)"
                  >
                    <TablerIcon name="map-pin" :size="14" />
                    <span>{{ suggestion.label }}</span>
                  </li>
                </ul>
              </div>
              <span v-if="fromGeocodingError && !errors.from" class="location-field__error" role="alert">{{ fromGeocodingError }}</span>
              <span v-if="errors.from" class="location-field__error" role="alert">{{ errors.from }}</span>
            </div>

            <div class="location-field" :class="{ 'location-field--error': errors.to }">
              <label class="form-label location-field__label" for="to-input">
                <TablerIcon name="flag" :size="14" class="location-field__label-icon location-field__label-icon--dest" />
                To
              </label>
              <div class="location-field__wrap">
                <input
                  id="to-input"
                  v-model="toQuery"
                  class="input location-field__input"
                  type="text"
                  placeholder="Destination city…"
                  autocomplete="off"
                  spellcheck="false"
                  @input="toField.handleInput"
                  @focus="toField.handleFocus"
                  @blur="toField.handleBlur"
                />
                <ul
                  v-if="toSuggestions.length"
                  class="location-field__dropdown"
                  role="listbox"
                >
                  <li
                    v-for="(suggestion, index) in toSuggestions"
                    :key="`${suggestion.label}-${index}`"
                    class="location-field__option"
                    role="option"
                    @mousedown.prevent="selectTo(suggestion)"
                  >
                    <TablerIcon name="map-pin" :size="14" />
                    <span>{{ suggestion.label }}</span>
                  </li>
                </ul>
              </div>
              <span v-if="toGeocodingError && !errors.to" class="location-field__error" role="alert">{{ toGeocodingError }}</span>
              <span v-if="errors.to" class="location-field__error" role="alert">{{ errors.to }}</span>
            </div>
          </div>

          <div class="location-stack__swap">
            <button
              class="swap-btn"
              type="button"
              title="Swap departure and destination"
              aria-label="Swap departure and destination"
              @click="swapLocations"
            >
              <TablerIcon name="arrows-down-up" :size="18" />
            </button>
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Vehicle type</label>
          <VehicleSlider v-model="selectedVehicle" :fuel="selectedFuel" />
        </div>

        <div class="form-section">
          <label class="form-label">Fuel type</label>
          <FuelPills v-model="selectedFuel" />
        </div>

        <div class="plugin-slot">
          <BatteryRangeSlider
            v-show="showPluginSlider"
            v-model="batteryRange"
          />
        </div>

        <div class="form-section form-section--inline">
          <label class="form-label" for="fuel-price">
            {{ priceFieldLabel }}
          </label>
          <div class="price-field">
            <span class="price-field__symbol">{{ units.currency.symbol }}</span>
            <input
              id="fuel-price"
              v-model.number="fuelPrice"
              class="price-field__input"
              type="number"
              step="0.01"
              min="0"
              :placeholder="pricePlaceholder"
            />
          </div>
        </div>

      </div>

      <div class="trip-form__actions">
        <button
          class="calculate-btn"
          :disabled="loading"
          :aria-busy="loading"
          @click="handleCalculate"
        >
          <TablerIcon v-if="!loading" name="calculator" :size="18" />
          <span class="calculate-btn__spinner" v-else aria-hidden="true" />
          {{ loading ? 'Calculating trip…' : 'Calculate trip' }}
        </button>

        <p v-if="calcError" class="calc-error" role="alert">
          <TablerIcon name="alert-circle" :size="18" />
          {{ calcError }}
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trip-form {
  background: $white;
  border-radius: $radius-xl;
  box-shadow: $shadow-panel;
  overflow: visible;
  display: flex;
  flex-direction: column;

  @media (max-width: $bp-tablet) {
    overflow: hidden;
    max-height: 100%;
    min-height: 0;
    height: 100%;
    transition:
      flex 420ms cubic-bezier(0.4, 0, 0.2, 1),
      max-height 420ms cubic-bezier(0.4, 0, 0.2, 1),
      height 420ms cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 420ms cubic-bezier(0.4, 0, 0.2, 1);

    &--collapsed {
      height: auto;
      max-height: none;
      flex-shrink: 0;
    }

    &--suggestions-open {
      overflow: visible;
    }
  }

  &--expanding {
    @media (max-width: $bp-tablet) {
      overflow: hidden;

      .trip-form__body,
      .trip-form__body-inner {
        overflow: hidden;
        scrollbar-width: none;

        &::-webkit-scrollbar {
          display: none;
        }
      }
    }
  }

  &__header {
    border-radius: $radius-xl $radius-xl 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-4 $space-5;
    background: $green-50;
    border-bottom: 1px solid $green-100;
    flex-shrink: 0;

    @media (max-width: $bp-tablet) {
      padding: $space-3 $space-3 $space-2;
      background: transparent;
      border-bottom: none;
    }
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: $space-3;
    color: $green-700;

    .tabler-icon { font-size: 1.25rem; }

    @media (max-width: $bp-tablet) {
      gap: $space-2;

      .tabler-icon { font-size: 1.125rem; }
    }
  }

  &__title {
    font-size: $text-lg;
    font-weight: 600;
    color: $gray-900;

    @media (max-width: $bp-tablet) {
      font-size: $text-sm;
    }
  }

  &__edit-btn {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-4;
    border: $border-control solid $green-300;
    border-radius: $radius-pill;
    font-size: $text-base;
    font-weight: 500;
    color: $green-700;
    background: $white;
    transition: background $transition-fast, color $transition-fast;

    &:hover { background: $green-50; }
    .tabler-icon { font-size: $text-base; }

    @media (max-width: $bp-tablet) {
      padding: $space-1 $space-2;
      gap: $space-1;
      font-size: $text-xs;
      font-weight: 600;

      .tabler-icon { font-size: $text-sm; }
    }
  }

  &__body {
    overflow: hidden;
    max-height: 960px;
    opacity: 1;
    flex: 1;
    min-height: 0;
    transition:
      max-height 420ms cubic-bezier(0.4, 0, 0.2, 1),
      opacity    420ms cubic-bezier(0.4, 0, 0.2, 1),
      flex       420ms cubic-bezier(0.4, 0, 0.2, 1);

    @media (max-width: $bp-tablet) {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      max-height: 1200px;
      overflow: hidden;
    }
  }

  &--collapsed &__body {
    max-height: 0;
    opacity: 0;
    flex: 0 0 0;
    min-height: 0;
  }

  &__body-inner {
    border-radius: $radius-xl $radius-xl 0 0;
    padding: $space-5;
    display: flex;
    flex-direction: column;
    gap: $space-4;
    flex: 1;
    min-height: 0;

    @media (max-width: $bp-tablet) {
      padding: 0 $space-3 $space-3;
      gap: $space-3;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;

      .trip-form--suggestions-open & {
        overflow: visible;
      }
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    padding: 0 $space-5 $space-5;
    flex-shrink: 0;
    margin-top: auto;

    @media (max-width: $bp-tablet) {
      gap: $space-2;
      padding: $space-2 $space-3 calc(#{$space-3} + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid $green-100;
      background: transparent;

      .trip-form--suggestions-open & {
        display: none;
      }
    }
  }

  &--collapsed {
    @media (max-width: $bp-tablet) {
      box-shadow: $shadow-sm;
    }

    :deep(.summary-row) {
      border-radius: 0 0 $radius-xl $radius-xl;

      @media (max-width: $bp-tablet) {
        padding: 0 $space-3 $space-2;
        gap: $space-1;
        font-size: $text-sm;
        background: transparent;
        border-top: none;

        .summary-row__loc .tabler-icon,
        .summary-row__meta .tabler-icon {
          display: none;
        }

        .summary-row__loc {
          font-size: $text-sm;
          font-weight: 600;
        }

        .summary-row__meta {
          font-size: $text-xs;
        }
      }
    }
  }
}

.location-stack {
  display: flex;
  gap: $space-2;

  &__fields {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }

  &__swap {
    flex-shrink: 0;
    width: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: calc(0.8125rem * 1.25 + #{$space-1});
  }
}

.swap-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: $control-size-sm;
  height: $control-size-sm;
  border-radius: $radius-pill;
  border: $border-control solid $green-100;
  color: $green-700;
  background: $white;
  transition: background $transition-fast, border-color $transition-fast;

  &:hover {
    background: $green-50;
    border-color: $green-300;
  }

  .tabler-icon { font-size: 1.125rem; }
}

.location-field {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  &__label {
    display: flex;
    align-items: center;
    gap: $space-1;
  }

  &__label-icon {
    font-size: $text-base;
    color: $green-500;

    &--dest {
      color: $green-700;
    }
  }

  &__wrap { position: relative; }

  &__input {
    padding: $space-2 $space-3;
    font-size: $text-base;
  }

  &--error &__input { border-color: $error; }

  &__error {
    font-size: $text-sm;
    color: $error;
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + $space-1);
    left: 0;
    right: 0;
    z-index: 30;
    background: $white;
    border: $border-control solid $green-100;
    border-radius: $radius-md;
    box-shadow: $shadow-lg;
    max-height: 220px;
    overflow-y: auto;

    @media (max-width: $bp-tablet) {
      max-height: min(220px, 40vh);
    }
  }

  &__option {
    display: flex;
    align-items: flex-start;
    gap: $space-2;
    padding: $space-2 $space-3;
    cursor: pointer;
    font-size: $text-sm;
    color: $gray-900;
    transition: background $transition-fast;

    &:hover { background: $green-50; }

    .tabler-icon {
      color: $green-500;
      font-size: $text-sm;
      margin-top: 2px;
      flex-shrink: 0;
    }

    span {
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
}

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

.plugin-slot {
  flex-shrink: 0;
  min-height: 0;
  height: auto;

  @media (min-width: $bp-tablet) {
    min-height: $plugin-slot-height;
    height: $plugin-slot-height;
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

    &:focus { box-shadow: none; }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button { -webkit-appearance: none; }
    -moz-appearance: textfield;
  }
}

.calculate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  width: 100%;
  padding: $space-3 $space-4;
  background: $green-700;
  color: $white;
  border-radius: $radius-lg;
  font-size: $text-md;
  font-weight: 600;
  transition: background $transition-fast, box-shadow $transition-fast, transform $transition-fast;
  box-shadow: 0 2px 8px rgba($green-700, 0.3);

  @media (max-width: $bp-tablet) {
    padding: $space-2 $space-3;
    font-size: $text-base;
  }

  &:hover:not(:disabled) {
    background: $green-500;
    box-shadow: 0 4px 16px rgba($green-700, 0.35);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { opacity: 0.65; cursor: not-allowed; }
  .tabler-icon { font-size: 1.125rem; }

  &__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba($white, 0.3);
    border-top-color: $white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.calc-error {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  background: $error-bg;
  border: $border-control solid $error-border;
  border-radius: $radius-md;
  font-size: $text-base;
  color: $error-text;

  .tabler-icon { flex-shrink: 0; }
}

.summary-fade-enter-active { transition: opacity 300ms ease 250ms; }
.summary-fade-leave-active  {
  transition: opacity 200ms ease;

  @media (max-width: $bp-tablet) {
    transition: none;
  }
}
.summary-fade-enter-from,
.summary-fade-leave-to      { opacity: 0; }

.form-fade-enter-active {
  transition: opacity 250ms ease;

  @media (max-width: $bp-tablet) {
    transition: opacity 420ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.form-fade-leave-active {
  transition: opacity 250ms ease;

  @media (max-width: $bp-tablet) {
    transition: none;
  }
}

.form-fade-enter-from,
.form-fade-leave-to { opacity: 0; }
</style>
