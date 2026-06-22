import { inject, computed, type ComputedRef, type Ref } from 'vue'
import { MOBILE_MAP_SHEET_CONTEXT_KEY } from '@/constants/index.ts'

/** Sheet state shared with embedded route maps via provide/inject. */
export interface MobileSheetContext {
  layoutSettled: Ref<boolean>
  overlay: Ref<boolean | undefined>
  mapInteractive: ComputedRef<boolean>
}

/** Read mobile sheet context; safe defaults when the map is outside a sheet (desktop). */
export function useMobileSheetContext() {
  const sheet = inject<MobileSheetContext | null>(MOBILE_MAP_SHEET_CONTEXT_KEY, null)

  return {
    sheet,
    inSheet: computed(() => sheet !== null),
    layoutSettled: computed(() => sheet?.layoutSettled.value ?? true),
    overlay: computed(() => sheet?.overlay.value ?? false),
    mapInteractive: computed(() => sheet?.mapInteractive.value ?? true),
  }
}
