// [O] Adding a new vehicle = adding a row. No logic changes needed.
// consumptionL100km: average litres per 100 km (petrol baseline for litre fuels).
// consumptionKWhKm:  average kWh per km (electric).
export const VEHICLES = [
  { id: 'citycar', label: 'City car', icon: 'ti-car',     consumptionL100km: 5.5,  consumptionKWhKm: 0.14 },
  { id: 'saloon',  label: 'Saloon',   icon: 'ti-car-suv', consumptionL100km: 6.5,  consumptionKWhKm: 0.17 },
  { id: 'suv',     label: 'SUV',      icon: 'ti-car-suv', consumptionL100km: 8.5,  consumptionKWhKm: 0.22 },
  { id: 'mpv',     label: 'MPV',      icon: 'ti-bus',     consumptionL100km: 9.0,  consumptionKWhKm: 0.25 },
  { id: 'van',     label: 'Van',      icon: 'ti-truck',   consumptionL100km: 11.0, consumptionKWhKm: 0.30 },
]

export function getVehicleLabel(vehicle) {
  return vehicle?.label ?? ''
}
