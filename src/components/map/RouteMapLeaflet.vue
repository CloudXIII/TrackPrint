<script setup lang="ts">
import { computed, ref } from 'vue'
import L from 'leaflet'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import { createLeafletMapDriver } from '@/composables/map/createLeafletMapDriver.ts'
import { routeMapDriverContextFromRefs } from '@/composables/map/mapDriverContext.ts'
import { useRouteMapHost } from '@/composables/map/useRouteMapHost.ts'
import { LEAFLET_MARKET_VIEWS, OSM_TILE_ATTRIBUTION, OSM_TILE_URLS } from '@/config/mapViews.ts'
import RouteMapShell from '@/components/map/RouteMapShell.vue'
import TablerIcon from '@/components/ui/TablerIcon.vue'

const MAP_INIT = {
  center: [...LEAFLET_MARKET_VIEWS.uk.center] as [number, number],
  zoom: LEAFLET_MARKET_VIEWS.uk.zoom,
}

const mapRef = ref<{ leafletObject?: L.Map } | null>(null)
const shellRef = ref<InstanceType<typeof RouteMapShell> | null>(null)
const mountReady = ref(false)
let resolveReady: (() => void) | null = null

function onMapReady() {
  resolveReady?.()
  resolveReady = null
}

const { polyline, darkMode, loadError, shellClass } = useRouteMapHost(
  (ctx) => createLeafletMapDriver({
    ...routeMapDriverContextFromRefs(ctx),
    getMap: () => mapRef.value?.leafletObject as L.Map | null ?? null,
    beginMount: () => new Promise<void>((resolve) => {
      resolveReady = resolve
      mountReady.value = true
    }),
  }),
  () => shellRef.value?.mapShell ?? null,
)

const tileUrl = computed(() => OSM_TILE_URLS[darkMode.value ? 'dark' : 'light'])
const tileAttribution = computed(() => OSM_TILE_ATTRIBUTION[darkMode.value ? 'dark' : 'light'])

const showHint = computed(() => polyline.value.length === 0)
const showError = computed(() => Boolean(loadError.value))
</script>

<template>
  <RouteMapShell
    ref="shellRef"
    :shell-class="shellClass"
    :load-error="loadError"
    :show-hint="showHint"
    :show-error="showError"
  >
    <template #map>
      <LMap
        v-if="mountReady"
        ref="mapRef"
        class="route-map__map"
        :zoom="MAP_INIT.zoom"
        :center="MAP_INIT.center"
        :options="{ zoomControl: true, attributionControl: true }"
        @ready="onMapReady"
      >
        <LTileLayer
          :key="tileUrl"
          :url="tileUrl"
          :attribution="tileAttribution"
          layer-type="base"
          name="Base map"
        />
      </LMap>
    </template>

    <template #error="{ message }">
      <TablerIcon name="alert-circle" :size="18" />
      <span>{{ message }}</span>
    </template>

    <template #hint>
      <TablerIcon name="route" :size="18" />
      <span>Calculate a trip to see your route</span>
    </template>
  </RouteMapShell>
</template>
