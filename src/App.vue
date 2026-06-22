<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import AppHeader         from '@/components/AppHeader.vue'
import TripForm          from '@/components/TripForm.vue'
import RouteMap          from '@/components/RouteMap.vue'
import ResultsPanel      from '@/components/ResultsPanel.vue'
import MobileBottomSheet from '@/components/MobileBottomSheet.vue'
import { usePanelLayout } from '@/composables/usePanelLayout.ts'
import { useFormCollapse } from '@/composables/useFormCollapse.ts'
import { useThemeInit } from '@/composables/useTheme.ts'
import {
  DESKTOP_BREAKPOINT,
  MOBILE_FORM_COLLAPSE_MS,
  MOBILE_MAP_SHEET_PEEK,
  MOBILE_MAP_SHEET_FULL,
  MOBILE_MAP_SHEET_PEEK_RESULTS_PX,
} from '@/constants/index.ts'
import { activeRouting, activeGeocoding, activeMapAttribution } from '@/config/providers.ts'

useThemeInit()

const tripFormRef = ref(null)
const mobileShellRef = ref<HTMLElement | null>(null)
const sheetSnapIndex = ref(0)
const showMapSheet = ref(false)
const mapSheetExiting = ref(false)
const isMobile = ref(false)
const mobileAvailableHeight = ref(0)

let mobileMediaQuery: MediaQueryList | null = null
let mobileShellObserver: ResizeObserver | null = null
let formReturningTimer: ReturnType<typeof setTimeout> | null = null

const { collapsed } = useFormCollapse()
const formReturning = ref(false)

const {
  showResults,
  isPanelFixed,
  panelsStyle,
  leftColumnClass,
  lockColumnHeight,
} = usePanelLayout(tripFormRef)

const sheetSnapPoints = computed(() => {
  const resultsPhase = showResults.value || mapSheetExiting.value || formReturning.value
  if (resultsPhase && mobileAvailableHeight.value > 0) {
    return [
      MOBILE_MAP_SHEET_PEEK_RESULTS_PX / mobileAvailableHeight.value,
      MOBILE_MAP_SHEET_FULL,
    ]
  }
  return [MOBILE_MAP_SHEET_PEEK, MOBILE_MAP_SHEET_FULL]
})

const mapSheetCollapsed = computed(
  () => (showResults.value || mapSheetExiting.value) && sheetSnapIndex.value === 0,
)

const mobileResultsTransition = {
  enter: MOBILE_FORM_COLLAPSE_MS,
  leave: 0,
} as const

const mobileReturnPhase = computed(
  () => formReturning.value || mapSheetExiting.value,
)

const mobileContentSplit = computed(
  () => showResults.value || mobileReturnPhase.value,
)

function clearFormReturningTimer() {
  if (formReturningTimer) {
    clearTimeout(formReturningTimer)
    formReturningTimer = null
  }
}

function syncIsMobile(event?: MediaQueryListEvent) {
  isMobile.value = event ? !event.matches : !window.matchMedia(DESKTOP_BREAKPOINT).matches
}

function updateMobileAvailableHeight() {
  mobileAvailableHeight.value = mobileShellRef.value?.clientHeight ?? 0
}

function setupMobileShellObserver() {
  mobileShellObserver?.disconnect()
  if (!mobileShellRef.value) return

  mobileShellObserver = new ResizeObserver(updateMobileAvailableHeight)
  mobileShellObserver.observe(mobileShellRef.value)
  updateMobileAvailableHeight()
}

watch(isMobile, async (mobile) => {
  if (mobile) {
    await nextTick()
    setupMobileShellObserver()
  } else {
    mobileShellObserver?.disconnect()
  }
})

watch(collapsed, (isCollapsed, wasCollapsed) => {
  if (!isMobile.value) return

  if (wasCollapsed && !isCollapsed) {
    formReturning.value = true
    clearFormReturningTimer()
    formReturningTimer = setTimeout(() => {
      formReturning.value = false
      formReturningTimer = null
    }, MOBILE_FORM_COLLAPSE_MS)
    return
  }

  if (isCollapsed) {
    formReturning.value = false
    clearFormReturningTimer()
  }
})

watch(showResults, (show) => {
  sheetSnapIndex.value = 0

  if (!isMobile.value) {
    showMapSheet.value = false
    mapSheetExiting.value = false
    return
  }

  if (show) {
    mapSheetExiting.value = false
    showMapSheet.value = true
  } else if (showMapSheet.value && !mapSheetExiting.value) {
    mapSheetExiting.value = true
  }
})

function onMapSheetExitComplete() {
  mapSheetExiting.value = false
  showMapSheet.value = false
}

onMounted(() => {
  mobileMediaQuery = window.matchMedia(DESKTOP_BREAKPOINT)
  syncIsMobile()
  mobileMediaQuery.addEventListener('change', syncIsMobile)

  if (isMobile.value) {
    nextTick().then(setupMobileShellObserver)
  }
})

onUnmounted(() => {
  mobileMediaQuery?.removeEventListener('change', syncIsMobile)
  mobileShellObserver?.disconnect()
  clearFormReturningTimer()
})
</script>

<template>
  <div class="app">
    <AppHeader />

    <main class="layout">
      <!-- Mobile: content on top, draggable map sheet at bottom -->
      <div v-if="isMobile" ref="mobileShellRef" class="layout-mobile">
        <div
          class="layout-mobile__content"
          :class="{ 'layout__left--split': mobileContentSplit }"
        >
          <TripForm
            ref="tripFormRef"
            :scroll-lock="mobileReturnPhase"
            :layout-returning="mobileReturnPhase"
            @lock-height="lockColumnHeight"
          />
          <Transition name="results-reveal" :duration="mobileResultsTransition">
            <ResultsPanel v-if="showResults" class="layout__results" />
          </Transition>
        </div>

        <MobileBottomSheet
          v-if="(showMapSheet || mapSheetExiting) && mobileAvailableHeight > 0"
          v-model="sheetSnapIndex"
          :snap-points="sheetSnapPoints"
          :available-height="mobileAvailableHeight"
          :overlay-content="mapSheetCollapsed && showResults && !mapSheetExiting"
          :entrance="showResults && !mapSheetExiting"
          :exiting="mapSheetExiting"
          :invite="showResults && !mapSheetExiting"
          @exit-complete="onMapSheetExitComplete"
        >
          <RouteMap />
        </MobileBottomSheet>
      </div>

      <!-- Desktop: side-by-side panels -->
      <div
        v-else
        class="layout__panels"
        :class="{ 'layout__panels--fixed': isPanelFixed }"
        :style="panelsStyle"
      >
        <div class="layout__left" :class="leftColumnClass">
          <TripForm ref="tripFormRef" @lock-height="lockColumnHeight" />
          <Transition name="results-reveal">
            <ResultsPanel v-if="showResults" class="layout__results" />
          </Transition>
        </div>

        <aside class="layout__map">
          <RouteMap />
        </aside>
      </div>
    </main>

    <footer class="app-footer">
      <p>
        Routes via
        <a :href="activeRouting.url" target="_blank" rel="noopener">{{ activeRouting.name }}</a>
        · Geocoding via
        <a :href="activeGeocoding.url" target="_blank" rel="noopener">{{ activeGeocoding.name }}</a>
        · Maps © <a :href="activeMapAttribution.url" target="_blank" rel="noopener">{{ activeMapAttribution.name }}</a> ·
        CO₂ figures are estimates only.
      </p>
    </footer>
  </div>
</template>

<style lang="scss">
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $gray-100;

  @media (max-width: $bp-tablet) {
    min-height: 100dvh;
    height: 100dvh;
    overflow: hidden;
  }
}

.layout {
  flex: 1;
  max-width: 1160px;
  width: 100%;
  margin: 0 auto;
  padding: $space-6;

  @media (max-width: $bp-tablet) {
    max-width: none;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0;
  }

  &__panels {
    display: grid;
    gap: $space-5;
    grid-template-columns: 1fr;
    grid-template-areas:
      "left"
      "map";

    @media (min-width: $bp-tablet) {
      grid-template-columns: 500px 1fr;
      grid-template-areas: "left map";
      align-items: stretch;
    }

    @media (min-width: $bp-desktop) {
      grid-template-columns: 520px 1fr;
    }

    &--fixed {
      @media (min-width: $bp-tablet) {
        height: var(--panel-height);
        min-height: var(--panel-height);
        max-height: var(--panel-height);
      }
    }
  }

  &__left {
    grid-area: left;
    display: flex;
    flex-direction: column;
    gap: $space-3;
    min-width: 0;
    min-height: 0;

    .layout__panels--fixed & {
      @media (min-width: $bp-tablet) {
        height: 100%;
      }
    }

    &:not(.layout__left--split) .trip-form {
      flex: 1;
      min-height: 0;
      height: 100%;
    }

    &--split {
      .trip-form {
        flex-shrink: 0;
      }

      .layout__results {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
    }
  }

  &__map {
    grid-area: map;
    height: 240px;
    min-height: 240px;

    .layout__panels--fixed & {
      @media (min-width: $bp-tablet) {
        height: 100%;
        min-height: 0;
      }
    }
  }
}

.layout-mobile {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  &__content {
    position: relative;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: $space-3;
    padding: $space-3;
    padding-bottom: $space-2;
    transition:
      gap 420ms cubic-bezier(0.4, 0, 0.2, 1),
      padding 420ms cubic-bezier(0.4, 0, 0.2, 1);

    &:not(.layout__left--split) .trip-form {
      flex: 1;
      min-height: 0;
      height: 100%;
    }

    &.layout__left--split {
      gap: $space-2;
      padding: $space-2;
      padding-bottom: $space-1;

      .trip-form {
        flex: 0 0 auto;
        flex-shrink: 0;
        height: auto;
        max-height: none;

        &.trip-form--layout-returning {
          flex: 1 1 auto;
          min-height: 0;
          max-height: 100%;
        }
      }

      .layout__results {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
    }
  }
}

.results-reveal-enter-active {
  transition:
    opacity 400ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 400ms cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: $bp-tablet) {
    transition-duration: 420ms;
    transition-delay: 0ms;
  }

  @media (min-width: $bp-tablet) {
    transition-delay: 350ms;
  }
}

.results-reveal-leave-active {
  transition:
    opacity 280ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 280ms cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: $bp-tablet) {
    transition: none;
  }
}

.results-reveal-enter-from,
.results-reveal-leave-to {
  opacity: 0;
  transform: translateY(18px);
}

.app-footer {
  padding: $space-5 $space-6;
  text-align: center;
  font-size: 0.8125rem;
  color: $gray-400;
  border-top: 1px solid rgba($green-100, 0.8);

  @media (max-width: $bp-tablet) {
    display: none;
  }

  a {
    color: $green-500;
    &:hover { text-decoration: underline; }
  }
}
</style>
