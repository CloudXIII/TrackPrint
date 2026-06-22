<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useLocationField } from '@/composables/trip/useLocationField.ts'
import { useRouteCalculation } from '@/composables/trip/useRouteCalculation.ts'
import { useFormCollapse } from '@/composables/layout/useFormCollapse.ts'
import { useTripState } from '@/composables/trip/useTripState.ts'
import { useVehicleConfig } from '@/composables/trip/useVehicleConfig.ts'
import { MOBILE_FORM_COLLAPSE_MS } from '@/constants/index.ts'

import VehicleSlider      from '@/components/trip/VehicleSlider.vue'
import FuelPills          from '@/components/trip/FuelPills.vue'
import BatteryRangeSlider from '@/components/trip/BatteryRangeSlider.vue'
import FormSummaryRow     from '@/components/trip/FormSummaryRow.vue'
import LocationField      from '@/components/trip/LocationField.vue'
import PriceField         from '@/components/trip/PriceField.vue'
import TablerIcon         from '@/components/ui/TablerIcon.vue'

import type { GeocodingResult } from '@/types/index.ts'

const emit = defineEmits<{
  lockHeight: []
}>()

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

  if (success) emit('lockHeight')
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

    <div ref="bodyInnerRef" class="trip-form__body">
      <div class="trip-form__scroll">
        <div class="trip-form__content">

        <div class="location-stack">
          <LocationField
            id="from-input"
            v-model:query="fromQuery"
            label="From"
            icon="map-pin"
            placeholder="Departure city…"
            :suggestions="fromSuggestions"
            :geocoding-error="fromGeocodingError"
            :validation-error="errors.from || undefined"
            @input="fromField.handleInput"
            @focus="fromField.handleFocus"
            @blur="fromField.handleBlur"
            @select="selectFrom"
          />
          <LocationField
            id="to-input"
            v-model:query="toQuery"
            label="To"
            icon="flag"
            icon-variant="dest"
            placeholder="Destination city…"
            :suggestions="toSuggestions"
            :geocoding-error="toGeocodingError"
            :validation-error="errors.to || undefined"
            @input="toField.handleInput"
            @focus="toField.handleFocus"
            @blur="toField.handleBlur"
            @select="selectTo"
          />
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

        <PriceField
          id="fuel-price"
          v-model="fuelPrice"
          :label="priceFieldLabel"
          :symbol="units.currency.symbol"
          :placeholder="pricePlaceholder"
        />
        </div>

        <footer class="trip-form__footer">
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
        </footer>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/trip-form' as *;
</style>
