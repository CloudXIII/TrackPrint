<script setup lang="ts">
import { computed } from 'vue'
import { getTablerIcon } from '@/utils/tablerIcons.ts'

const props = withDefaults(defineProps<{
  name: string
  size?: number
  stroke?: number
}>(), {
  size: 20,
  stroke: 2,
})

const icon = computed(() => getTablerIcon(props.name))
</script>

<template>
  <component
    :is="icon"
    v-if="icon"
    class="tabler-icon"
    aria-hidden="true"
    :size="size"
    :stroke="stroke"
  />
</template>

<style scoped>
.tabler-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
