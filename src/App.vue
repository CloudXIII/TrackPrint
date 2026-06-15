<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader    from '@/components/AppHeader.vue'
import TripForm     from '@/components/TripForm.vue'
import RouteMap     from '@/components/RouteMap.vue'
import ResultsPanel from '@/components/ResultsPanel.vue'
import { useUiStore }   from '@/stores/uiStore.js'
import { useTripStore } from '@/stores/tripStore.js'

const uiStore   = useUiStore()
const tripStore = useTripStore()
const { collapsed, leftColumnHeight } = storeToRefs(uiStore)
const { distanceKm } = storeToRefs(tripStore)

const showResults = computed(
  () => distanceKm.value !== null && collapsed.value,
)

const tripFormRef   = ref(null)
const isDesktop     = ref(false)
let mediaQuery      = null

function measureFormHeight() {
  const el = tripFormRef.value?.$el
  if (!el) return 0
  return el.offsetHeight
}

async function syncPanelHeight() {
  if (!isDesktop.value) return
  await nextTick()
  await nextTick()
  const h = measureFormHeight()
  if (h > 0 && !leftColumnHeight.value) {
    uiStore.lockLeftColumnHeight(h)
  }
}

onMounted(async () => {
  mediaQuery = window.matchMedia('(min-width: 768px)')
  isDesktop.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
  // Attende layout completo (font + slot plugin riservato)
  requestAnimationFrame(() => syncPanelHeight())
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', onMediaChange)
})

async function onMediaChange(e) {
  isDesktop.value = e.matches
  if (e.matches) await syncPanelHeight()
}

/** Mantiene l'altezza bloccata al mount — nessun ricalcolo al calcolo. */
function lockColumnHeight() {
  if (!leftColumnHeight.value) syncPanelHeight()
}

const isPanelFixed = computed(
  () => isDesktop.value && leftColumnHeight.value !== null,
)

const panelsStyle = computed(() => {
  if (!isPanelFixed.value) return {}
  return { '--panel-height': `${leftColumnHeight.value}px` }
})

const leftColumnClass = computed(() => ({
  'layout__left--split': showResults.value,
}))
</script>

<template>
  <div class="app">
    <AppHeader />

    <main class="layout">
      <div
        class="layout__panels"
        :class="{ 'layout__panels--fixed': isPanelFixed }"
        :style="panelsStyle"
      >
        <div class="layout__left" :class="leftColumnClass">
          <TripForm ref="tripFormRef" @lock-height="lockColumnHeight" />
          <ResultsPanel v-if="showResults" class="layout__results" />
        </div>

        <aside class="layout__map">
          <RouteMap />
        </aside>
      </div>
    </main>

    <footer class="app-footer">
      <p>
        Routes via <a href="https://project-osrm.org" target="_blank" rel="noopener">OSRM</a> ·
        Maps © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors ·
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
}

.layout {
  flex: 1;
  max-width: 1160px;
  width: 100%;
  margin: 0 auto;
  padding: $space-6;

  @media (max-width: $bp-mobile) {
    padding: $space-4;
  }

  // Wrapper condiviso: sinistra + mappa stessa altezza esatta
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

    // Stato form: la card bianca riempie tutta l'altezza del pannello
    &:not(.layout__left--split) {
      :deep(.trip-form) {
        flex: 1;
        min-height: 0;
        height: 100%;
      }
    }

    // Stato risultati: form compatto + results che riempie il resto
    &--split {
      :deep(.trip-form) {
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

.app-footer {
  padding: $space-5 $space-6;
  text-align: center;
  font-size: 0.8125rem;
  color: $gray-400;
  border-top: 1px solid rgba($green-100, 0.8);

  a {
    color: $green-500;
    &:hover { text-decoration: underline; }
  }
}
</style>
