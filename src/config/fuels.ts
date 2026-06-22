import type { FuelType } from '@/types/index.ts'

// Fuel definitions — add a row here to support a new fuel type.
export const FUELS: FuelType[] = [
  { id: 'petrol',   label: 'Petrol',   unit: 'litre', co2PerUnit: 2.31, consumptionL100Factor: 1.00 },
  { id: 'diesel',   label: 'Diesel',   unit: 'litre', co2PerUnit: 2.68, consumptionL100Factor: 0.87 },
  { id: 'hybrid',   label: 'Hybrid',   unit: 'litre', co2PerUnit: 1.60, consumptionL100Factor: 0.73 },
  { id: 'plugin',   label: 'Plug-in',  unit: 'litre', co2PerUnit: 0.90, consumptionL100Factor: 0.64 },
  { id: 'electric', label: 'Electric', unit: 'kwh',   co2PerUnit: 0.23, consumptionL100Factor: null },
]
