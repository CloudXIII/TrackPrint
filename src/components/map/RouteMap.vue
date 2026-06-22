<script setup lang="ts">
import { usesGoogleMapDisplay } from '@/config/providers.ts'
import RouteMapGoogle from '@/components/map/RouteMapGoogle.vue'
import RouteMapLeaflet from '@/components/map/RouteMapLeaflet.vue'
</script>

<template>
  <RouteMapGoogle v-if="usesGoogleMapDisplay" />
  <RouteMapLeaflet v-else />
</template>
