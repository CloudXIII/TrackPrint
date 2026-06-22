import { useTripState } from '@/composables/trip/useTripState.ts'
import { useTheme } from '@/composables/useTheme.ts'
import { useUnitPreferences } from '@/composables/useUnitPreferences.ts'
import { useFormCollapse } from '@/composables/layout/useFormCollapse.ts'

/** Map display inputs — route geometry and UI preferences for map components. */
export function useRouteMap() {
  const { polyline, from, to } = useTripState()
  const { darkMode } = useTheme()
  const { market } = useUnitPreferences()
  const { collapsed } = useFormCollapse()

  return {
    polyline,
    from,
    to,
    darkMode,
    market,
    collapsed,
  }
}
