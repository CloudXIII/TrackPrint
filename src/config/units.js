// [O] Adding a new market = adding a key. Existing markets untouched.
export const UNIT_SETS = {
  uk: {
    distance:    { label: 'mi',      fromKm: km => km * 0.621371,  toKm: mi => mi / 0.621371 },
    consumption: { label: 'MPG',     fromL100: l => 282.48 / l,     toL100: m => 282.48 / m },
    currency:    { label: '£', symbol: '£', fromEur: e => e * 0.86 },
    fuelPrice:        { label: '£/L',   defaultPrice: 1.42 },
    electricityPrice: { label: '£/kWh', defaultPrice: 0.35 },
    pluginRange: {
      min: 15, max: 60, default: 30, unit: 'mi',
      toKm: mi => mi / 0.621371,
    },
  },
  eu: {
    distance:    { label: 'km',      fromKm: km => km,             toKm: km => km },
    consumption: { label: 'L/100km', fromL100: l => l,              toL100: l => l },
    currency:    { label: '€', symbol: '€', fromEur: e => e },
    fuelPrice:        { label: '€/L',   defaultPrice: 1.65 },
    electricityPrice: { label: '€/kWh', defaultPrice: 0.35 },
    pluginRange: {
      min: 20, max: 100, default: 50, unit: 'km',
      toKm: km => km,
    },
  },
}
