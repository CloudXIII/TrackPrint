<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore }   from '@/stores/uiStore.js'
import { useTripStore } from '@/stores/tripStore.js'
import { useGeocoding } from '@/composables/useGeocoding.js'
import { useRouting }   from '@/composables/useRouting.js'
import { useCalculator } from '@/composables/useCalculator.js'
import { useUnits }      from '@/composables/useUnits.js'
import { VEHICLES }      from '@/config/vehicles.js'
import { FUELS }         from '@/config/fuels.js'

import VehicleSlider      from '@/components/VehicleSlider.vue'
import FuelPills          from '@/components/FuelPills.vue'
import BatteryRangeSlider from '@/components/BatteryRangeSlider.vue'
import FormSummaryRow     from '@/components/FormSummaryRow.vue'

const emit = defineEmits(['lock-height'])

const uiStore   = useUiStore()
const tripStore = useTripStore()
const { market, collapsed } = storeToRefs(uiStore)

const fromQuery       = ref('')
const toQuery         = ref('')
const selectedFrom    = ref(null)
const selectedTo      = ref(null)
const selectedVehicle = ref(VEHICLES[0])
const selectedFuel    = ref(FUELS[0])
const fuelPrice       = ref(null)
const batteryRange    = ref(50)

const { units, getPriceDefault, getPriceFieldLabel } = useUnits()

const previousDefaultPrice = ref(null)

function applyDefaultPrice() {
  const def = getPriceDefault(selectedFuel.value?.id)
  fuelPrice.value = def
  previousDefaultPrice.value = def
}

function applyDefaultBatteryRange() {
  batteryRange.value = units.value.pluginRange.default
}

watch(market, () => {
  if (fuelPrice.value === null || fuelPrice.value === previousDefaultPrice.value) {
    applyDefaultPrice()
  } else {
    previousDefaultPrice.value = getPriceDefault(selectedFuel.value?.id)
  }
  applyDefaultBatteryRange()
}, { immediate: true })

watch(() => selectedFuel.value?.id, (newId, oldId) => {
  if (newId === oldId) return
  if (fuelPrice.value === null || fuelPrice.value === previousDefaultPrice.value) {
    applyDefaultPrice()
  }
  if (newId === 'plugin') applyDefaultBatteryRange()
})

const priceFieldLabel = computed(() => getPriceFieldLabel(selectedFuel.value?.id))
const pricePlaceholder = computed(() => getPriceDefault(selectedFuel.value?.id).toString())
const showPluginSlider = computed(() => selectedFuel.value?.id === 'plugin')

// ── Geocoding ─────────────────────────────────────────────────────────────────
const fromGeo = useGeocoding()
const toGeo   = useGeocoding()

let fromFocused = false
let toFocused   = false

function handleFromInput()  { fromGeo.searchLocations(fromQuery.value) }
function handleToInput()    { toGeo.searchLocations(toQuery.value) }

function handleFromBlur() {
  fromFocused = false
  setTimeout(() => { if (!fromFocused) fromGeo.clearSuggestions() }, 160)
}
function handleToBlur() {
  toFocused = false
  setTimeout(() => { if (!toFocused) toGeo.clearSuggestions() }, 160)
}

function selectFrom(suggestion) {
  selectedFrom.value = suggestion
  fromQuery.value    = suggestion.label.split(',')[0].trim()
  fromGeo.clearSuggestions()
  errors.value.from  = ''
}

function selectTo(suggestion) {
  selectedTo.value = suggestion
  toQuery.value    = suggestion.label.split(',')[0].trim()
  toGeo.clearSuggestions()
  errors.value.to  = ''
}

function swapLocations() {
  ;[selectedFrom.value, selectedTo.value] = [selectedTo.value, selectedFrom.value]
  ;[fromQuery.value,    toQuery.value]    = [toQuery.value,    fromQuery.value]
}

// ── Routing & calculation ─────────────────────────────────────────────────────
const routing     = useRouting()
const { calculate } = useCalculator()
const errors      = ref({ from: '', to: '' })
const calcError   = ref('')

async function handleCalculate() {
  errors.value = { from: '', to: '' }
  calcError.value = ''

  if (!selectedFrom.value) { errors.value.from = 'Please select a departure location'; return }
  if (!selectedTo.value)   { errors.value.to   = 'Please select a destination';        return }

  tripStore.setInputs(selectedFrom.value, selectedTo.value, selectedVehicle.value, selectedFuel.value)

  const route = await routing.fetchRoute(selectedFrom.value, selectedTo.value)

  if (!route) {
    calcError.value = routing.error.value ?? 'Could not calculate route'
    return
  }

  const results = calculate({
    distanceKm:       route.distanceKm,
    vehicle:          selectedVehicle.value,
    fuel:             selectedFuel.value,
    pricePerUnit:     fuelPrice.value,
    electricityPrice: units.value.electricityPrice.defaultPrice,
    batteryRangeKm:   selectedFuel.value.id === 'plugin'
      ? units.value.pluginRange.toKm(batteryRange.value)
      : undefined,
  })

  tripStore.setResults({
    distanceKm:  route.distanceKm,
    durationMin: route.durationMin,
    polyline:    route.polyline,
    ...results,
  })

  emit('lock-height')
  uiStore.setCollapsed(true)
}

function handleEdit() {
  uiStore.setCollapsed(false)
}
</script>

<template>
  <div class="trip-form" :class="{ 'trip-form--collapsed': collapsed }">
    <div class="trip-form__header">
      <div class="trip-form__header-left">
        <i class="ti ti-route-2" aria-hidden="true" />
        <h2 class="trip-form__title">Plan your trip</h2>
      </div>
      <button
        v-if="collapsed"
        class="trip-form__edit-btn"
        @click="handleEdit"
        aria-label="Edit trip details"
      >
        <i class="ti ti-pencil" aria-hidden="true" />
        Edit
      </button>
    </div>

    <Transition name="summary-fade">
      <FormSummaryRow
        v-if="collapsed"
        :from="tripStore.from"
        :to="tripStore.to"
        :vehicle="tripStore.vehicle"
        :fuel="tripStore.fuel"
      />
    </Transition>

    <div class="trip-form__body">
      <div class="trip-form__body-inner">

        <!-- From / To — stile Google Maps -->
        <div class="location-stack">
          <div class="location-stack__fields">
            <div class="location-field" :class="{ 'location-field--error': errors.from }">
              <label class="form-label location-field__label" for="from-input">
                <i class="ti ti-map-pin location-field__label-icon" aria-hidden="true" />
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
                  @input="handleFromInput"
                  @focus="fromFocused = true"
                  @blur="handleFromBlur"
                />
                <ul
                  v-if="fromGeo.suggestions.value.length"
                  class="location-field__dropdown"
                  role="listbox"
                >
                  <li
                    v-for="s in fromGeo.suggestions.value"
                    :key="s.label"
                    class="location-field__option"
                    role="option"
                    @mousedown.prevent="selectFrom(s)"
                  >
                    <i class="ti ti-map-pin" aria-hidden="true" />
                    <span>{{ s.label }}</span>
                  </li>
                </ul>
              </div>
              <span v-if="errors.from" class="location-field__error" role="alert">{{ errors.from }}</span>
            </div>

            <div class="location-field" :class="{ 'location-field--error': errors.to }">
              <label class="form-label location-field__label" for="to-input">
                <i class="ti ti-flag location-field__label-icon location-field__label-icon--dest" aria-hidden="true" />
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
                  @input="handleToInput"
                  @focus="toFocused = true"
                  @blur="handleToBlur"
                />
                <ul
                  v-if="toGeo.suggestions.value.length"
                  class="location-field__dropdown"
                  role="listbox"
                >
                  <li
                    v-for="s in toGeo.suggestions.value"
                    :key="s.label"
                    class="location-field__option"
                    role="option"
                    @mousedown.prevent="selectTo(s)"
                  >
                    <i class="ti ti-map-pin" aria-hidden="true" />
                    <span>{{ s.label }}</span>
                  </li>
                </ul>
              </div>
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
              <i class="ti ti-arrows-down-up" aria-hidden="true" />
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

        <!-- Slot riservato: altezza fissa così il form non cambia al toggling Plug-in -->
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

        <button
          class="calculate-btn"
          :disabled="routing.loading.value"
          :aria-busy="routing.loading.value"
          @click="handleCalculate"
        >
          <i v-if="!routing.loading.value" class="ti ti-calculator" aria-hidden="true" />
          <span class="calculate-btn__spinner" v-else aria-hidden="true" />
          {{ routing.loading.value ? 'Calculating…' : 'Calculate route' }}
        </button>

        <p v-if="calcError" class="calc-error" role="alert">
          <i class="ti ti-alert-circle" aria-hidden="true" />
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

  &__header {
    border-radius: $radius-xl $radius-xl 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-4 $space-5;
    background: $green-50;
    border-bottom: 1px solid $green-100;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: $space-3;
    color: $green-700;

    .ti { font-size: 1.25rem; }
  }

  &__title {
    font-size: $text-lg;
    font-weight: 600;
    color: $gray-900;
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
    .ti { font-size: $text-base; }
  }

  &__body {
    overflow: hidden;
    max-height: 960px;
    opacity: 1;
    flex: 1;
    min-height: 0;
    transition:
      max-height 420ms cubic-bezier(0.4, 0, 0.2, 1),
      opacity    420ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  &--collapsed &__body {
    max-height: 0;
    opacity: 0;
  }

  &__body-inner {
    border-radius: $radius-xl $radius-xl 0 0;
    padding: $space-5;
    display: flex;
    flex-direction: column;
    gap: $space-4;
    flex: 1;
    min-height: 0;
  }
    &--collapsed .summary-row {
    border-radius: 0 0 $radius-xl $radius-xl;
  }
}

// ── Location stack (Google Maps style) ──────────────────
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
    // Allinea al centro del bandolo tra i due input (sotto le label)
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

  .ti { font-size: 1.125rem; }
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
    z-index: 20;
    background: $white;
    border: $border-control solid $green-100;
    border-radius: $radius-md;
    box-shadow: $shadow-lg;
    max-height: 220px;
    overflow-y: auto;
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

    .ti {
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

// Altezza fissa — slider visibile solo con Plug-in (v-show), spazio vuoto altrimenti
.plugin-slot {
  flex-shrink: 0;
  min-height: $plugin-slot-height;
  height: $plugin-slot-height;
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
  margin-top: auto;
  background: $green-700;
  color: $white;
  border-radius: $radius-lg;
  font-size: $text-md;
  font-weight: 600;
  transition: background $transition-fast, box-shadow $transition-fast, transform $transition-fast;
  box-shadow: 0 2px 8px rgba($green-700, 0.3);

  &:hover:not(:disabled) {
    background: $green-500;
    box-shadow: 0 4px 16px rgba($green-700, 0.35);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { opacity: 0.65; cursor: not-allowed; }
  .ti { font-size: 1.125rem; }

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

  .ti { flex-shrink: 0; }
}

.summary-fade-enter-active { transition: opacity 300ms ease 250ms; }
.summary-fade-leave-active  { transition: opacity 200ms ease; }
.summary-fade-enter-from,
.summary-fade-leave-to      { opacity: 0; }
</style>
