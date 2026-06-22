/** First segment of a geocoded label (city name before the comma). */
import type { GeoLocation } from '@/types/index.ts'

export function getShortLocationLabel(location: GeoLocation | null | undefined): string {
  return location?.label?.split(',')[0]?.trim() ?? '—'
}
