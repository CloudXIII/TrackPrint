<script setup lang="ts">

import { computed, provide, toRef } from 'vue'

import { MOBILE_MAP_SHEET_CONTEXT_KEY } from '@/constants/index.ts'

import { useMobileBottomSheet } from '@/composables/layout/useMobileBottomSheet.ts'

import { useSheetHeightAnimation } from '@/composables/layout/useSheetHeightAnimation.ts'

import type { MobileSheetContext } from '@/composables/map/useMobileSheetContext.ts'

import TablerIcon from '@/components/ui/TablerIcon.vue'



const snapIndex = defineModel<number>({ default: 0 })



const props = defineProps<{

  snapPoints: number[]

  availableHeight: number

  /** Show route-map invite on the handle (results phase). */

  invite?: boolean

  /** Map fills the sheet behind the handle (collapsed results peek). */

  overlayContent?: boolean

  /** Animate height from 0 to the peek snap point on mount. */

  entrance?: boolean

  /** Animate height down to 0 before unmount (return to config). */

  exiting?: boolean

}>()



const emit = defineEmits<{

  exitComplete: []

}>()



const availableHeight = toRef(props, 'availableHeight')

const snapPoints = toRef(props, 'snapPoints')

const entrance = toRef(props, 'entrance')

const exiting = toRef(props, 'exiting')



const {

  isDragging,

  targetHeight,

  peekHeight,

  onHandlePointerDown,

} = useMobileBottomSheet(availableHeight, snapPoints, snapIndex)



const { displayHeight, isHeightAnimating, layoutSettled } = useSheetHeightAnimation(

  targetHeight,

  entrance,

  exiting,

  () => emit('exitComplete'),

)



const mapInteractive = computed(() => snapIndex.value > 0)



const sheetContext: MobileSheetContext = {

  layoutSettled,

  overlay: toRef(props, 'overlayContent'),

  mapInteractive,

}



provide(MOBILE_MAP_SHEET_CONTEXT_KEY, sheetContext)

</script>



<template>

  <div

    class="mobile-bottom-sheet"

    :class="{

      'mobile-bottom-sheet--dragging': isDragging,

      'mobile-bottom-sheet--invite': invite,

      'mobile-bottom-sheet--overlay': overlayContent,

      'mobile-bottom-sheet--animating': isHeightAnimating,

    }"

    :style="{

      height: `${displayHeight}px`,

      '--sheet-peek-height': `${peekHeight}px`,

    }"

  >

    <div

      class="mobile-bottom-sheet__handle"

      role="separator"

      aria-orientation="horizontal"

      :aria-label="invite ? 'Swipe up to view your route on the map' : 'Drag up to view the route map'"

      @pointerdown="onHandlePointerDown"

    >

      <span class="mobile-bottom-sheet__grip" aria-hidden="true" />



      <div v-if="invite" class="mobile-bottom-sheet__invite">

        <TablerIcon name="map" :size="16" class="mobile-bottom-sheet__invite-icon" />

        <span class="mobile-bottom-sheet__invite-text">Swipe up to see your route</span>

        <TablerIcon name="chevron-up" :size="16" class="mobile-bottom-sheet__invite-chevron" />

      </div>

    </div>



    <div class="mobile-bottom-sheet__content">

      <slot />

      <!--

        Shield: captures swipe-up while collapsed. CSS pointer-events + map API

        disabling are also applied — Leaflet/Google ignore CSS alone on touch devices.

      -->

      <div

        v-if="!mapInteractive"

        class="mobile-bottom-sheet__shield"

        aria-hidden="true"

        @pointerdown="onHandlePointerDown"

      />

    </div>

  </div>

</template>



<style lang="scss" scoped>

.mobile-bottom-sheet {

  flex-shrink: 0;

  display: flex;

  flex-direction: column;

  background: var(--surface-card);

  border-radius: $radius-xl $radius-xl 0 0;

  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.14);

  transition: height $transition-sheet-default;

  padding-bottom: env(safe-area-inset-bottom, 0px);

  overflow: hidden;



  &--animating:not(.mobile-bottom-sheet--dragging) {

    transition: height $transition-form-collapse;

  }



  &--dragging {

    transition: none;

  }



  &--invite {

    box-shadow: 0 -4px 24px rgba($green-700, 0.18);



    &:not(.mobile-bottom-sheet--dragging) .mobile-bottom-sheet__grip {

      animation: sheet-grip-bounce 2.4s ease-in-out infinite;

    }



    &:not(.mobile-bottom-sheet--dragging) .mobile-bottom-sheet__invite-chevron {

      animation: sheet-chevron-nudge 2.4s ease-in-out infinite;

    }

  }



  &--overlay {

    position: relative;



    .mobile-bottom-sheet__content {

      position: absolute;

      inset: 0;

      z-index: 0;

      min-height: var(--sheet-peek-height, 0);

    }



    .mobile-bottom-sheet__handle {

      position: relative;

      z-index: 1;

      background: var(--surface-sheet-handle-overlay);

      border-bottom: none;

      backdrop-filter: blur(0px);

      -webkit-backdrop-filter: blur(8px);

    }

  }



  &__handle {

    flex-shrink: 0;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    gap: $space-1;

    padding: $space-2 $space-4;

    cursor: grab;

    touch-action: none;

    user-select: none;

    background: var(--surface-sheet-handle);

    border-bottom: 1px solid var(--border-subtle);



    &:active {

      cursor: grabbing;

    }

  }



  &__grip {

    display: block;

    width: 40px;

    height: 4px;

    border-radius: $radius-pill;

    background: $green-500;

  }



  &__invite {

    display: flex;

    align-items: center;

    justify-content: center;

    gap: $space-2;

    width: 100%;

    max-width: 100%;

    padding: 0 $space-1;

  }



  &__invite-icon {

    flex-shrink: 0;

    color: var(--text-brand);

  }



  &__invite-text {

    font-size: $text-xs;

    font-weight: 600;

    color: var(--text-brand);

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;

  }



  &__invite-chevron {

    flex-shrink: 0;

    color: $green-500;

  }



  &__content {

    position: relative;

    flex: 1;

    min-height: 0;

    overflow: hidden;

  }



  &__shield {

    position: absolute;

    inset: 0;

    z-index: 20;

    touch-action: none;

    cursor: grab;

    user-select: none;

    background: transparent;



    &:active {

      cursor: grabbing;

    }

  }

}



@keyframes sheet-grip-bounce {

  0%, 100% { transform: translateY(0); }

  50% { transform: translateY(-2px); }

}



@keyframes sheet-chevron-nudge {

  0%, 100% { transform: translateY(0); opacity: 0.7; }

  50% { transform: translateY(-3px); opacity: 1; }

}

</style>


