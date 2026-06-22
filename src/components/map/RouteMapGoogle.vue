<script setup lang="ts">
import { computed, ref } from 'vue'
import { createGoogleMapDriver } from '@/composables/map/createGoogleMapDriver.ts'
import { routeMapDriverContextFromRefs } from '@/composables/map/mapDriverContext.ts'
import { useRouteMapHost } from '@/composables/map/useRouteMapHost.ts'
import RouteMapShell from '@/components/map/RouteMapShell.vue'
import TablerIcon from '@/components/ui/TablerIcon.vue'

const mapHost = ref<HTMLElement | null>(null)
const shellRef = ref<InstanceType<typeof RouteMapShell> | null>(null)

const { mapReady, loadError, polyline, shellClass } = useRouteMapHost(
  (ctx) => createGoogleMapDriver({
    ...routeMapDriverContextFromRefs(ctx),
    getMapHost: () => mapHost.value,
  }),
  () => shellRef.value?.mapShell ?? null,
)

const showHint = computed(
  () => mapReady.value && polyline.value.length === 0 && !loadError.value,
)

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
      <div ref="mapHost" class="route-map__map" role="region" aria-label="Trip route map" />
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
