<script setup lang="ts">
import { usesGoogleMapDisplay } from '@/config/providers.ts'
import RouteMapGoogle from '@/components/RouteMapGoogle.vue'
import RouteMapLeaflet from '@/components/RouteMapLeaflet.vue'
</script>

<template>
  <RouteMapGoogle v-if="usesGoogleMapDisplay" />
  <RouteMapLeaflet v-else />
</template>
