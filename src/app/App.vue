<script setup lang="ts">
import { ref } from 'vue'
import AppHeader         from '@/components/layout/AppHeader.vue'
import TripForm          from '@/components/trip/TripForm.vue'
import RouteMap          from '@/components/map/RouteMap.vue'
import ResultsPanel      from '@/components/results/ResultsPanel.vue'
import MobileBottomSheet from '@/components/layout/MobileBottomSheet.vue'
import { usePanelLayout } from '@/composables/layout/usePanelLayout.ts'
import { useFormCollapse } from '@/composables/layout/useFormCollapse.ts'
import { useMobileLayout } from '@/composables/layout/useMobileLayout.ts'
import { useThemeInit } from '@/composables/useTheme.ts'
import { activeRouting, activeGeocoding, activeMapAttribution } from '@/config/providers.ts'

useThemeInit()

const tripFormRef = ref(null)
const { collapsed } = useFormCollapse()

const {
  showResults,
  isPanelFixed,
  panelsStyle,
  leftColumnClass,
  lockColumnHeight,
} = usePanelLayout(tripFormRef)

const {
  mobileShellRef,
  sheetSnapIndex,
  showMapSheet,
  mapSheetExiting,
  isMobile,
  mobileAvailableHeight,
  sheetSnapPoints,
  mapSheetCollapsed,
  mobileResultsTransition,
  mobileReturnPhase,
  mobileContentSplit,
  onMapSheetExitComplete,
} = useMobileLayout(showResults, collapsed)
</script>

<template>
  <div class="app">
    <AppHeader />

    <main class="layout">
      <!-- Mobile: content on top, draggable map sheet at bottom -->
      <div v-if="isMobile" ref="mobileShellRef" class="layout-mobile">
        <div
          class="layout-mobile__content layout-column"
          :class="{ 'layout-column--split': mobileContentSplit }"
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
        <div class="layout__left layout-column" :class="leftColumnClass">
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
@use '@/assets/styles/layout' as *;
</style>
