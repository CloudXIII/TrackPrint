import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/uiStore.ts'

/** Collapsed/expanded state of the trip form card. */
export function useFormCollapse() {
  const uiStore = useUiStore()
  const { collapsed } = storeToRefs(uiStore)

  function collapseForm() {
    uiStore.setCollapsed(true)
  }

  function expandForm() {
    uiStore.setCollapsed(false)
  }

  return {
    collapsed,
    collapseForm,
    expandForm,
  }
}
