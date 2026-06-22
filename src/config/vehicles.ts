import type { MarketId, VehicleProfile } from '@/types/index.ts'

// Vehicle profiles — add a row here to support a new vehicle type.
export const VEHICLES: VehicleProfile[] = [
  { id: 'citycar', label: 'City car', icon: 'car',     consumptionL100km: 5.5,  consumptionKWhKm: 0.14 },
  { id: 'saloon',  label: 'Saloon', labels: { eu: 'Sedan' }, icon: 'car-suv', consumptionL100km: 6.5,  consumptionKWhKm: 0.17 },
  { id: 'suv',     label: 'SUV',      icon: 'car-suv', consumptionL100km: 8.5,  consumptionKWhKm: 0.22 },
  { id: 'mpv',     label: 'MPV',      icon: 'bus',     consumptionL100km: 9.0,  consumptionKWhKm: 0.25 },
  { id: 'van',     label: 'Van',      icon: 'truck',   consumptionL100km: 11.0, consumptionKWhKm: 0.30 },
]

export function getVehicleLabel(
  vehicle: VehicleProfile | null | undefined,
  market: MarketId = 'uk',
): string {
  if (!vehicle) return ''
  return vehicle.labels?.[market] ?? vehicle.label ?? ''
}
