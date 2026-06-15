// [O] Add, remove or reorder equivalents freely. No logic changes needed.
// factor: multiply kg of CO₂ by this to get the displayed value.
export const CO2_EQUIVALENTS = [
  { id: 'trees',   icon: 'ti-trees',         label: 'Trees for a year', unit: '',   factor: 1 / 21.7, description: 'needed to absorb this CO₂' },
  { id: 'burgers', icon: 'ti-meat',          label: 'Beef burgers',     unit: '',   factor: 1 / 3.0,  description: 'same carbon footprint' },
  { id: 'flights', icon: 'ti-plane',         label: 'km by plane',      unit: 'km', factor: 3.87,     description: 'per passenger equivalent' },
  { id: 'phones',  icon: 'ti-device-mobile', label: 'Phone charges',    unit: '',   factor: 122,      description: 'full smartphone charges' },
  { id: 'bulb',    icon: 'ti-bulb',          label: 'LED bulb hours',   unit: 'h',  factor: 244,      description: '10W lamp equivalent' },
  { id: 'gas',     icon: 'ti-wind',          label: 'm³ of gas',        unit: 'm³', factor: 0.509,    description: 'physical volume at STP' },
]
