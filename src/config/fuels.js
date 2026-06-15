// [O] Adding a new fuel type = adding a row.
// unit: 'litre' | 'kwh' — tells useCalculator which consumption field to use.
// co2PerUnit: kg of CO₂ per litre (or per kWh for electric).
// consumptionL100Factor: multiplier on vehicle.consumptionL100km (petrol baseline = 1.0).
//   Diesel, Hybrid and Plug-in must use factors < 1 so they show lower consumption than Petrol.
export const FUELS = [
  { id: 'petrol',   label: 'Petrol',   unit: 'litre', co2PerUnit: 2.31, consumptionL100Factor: 1.00 },
  { id: 'diesel',   label: 'Diesel',   unit: 'litre', co2PerUnit: 2.68, consumptionL100Factor: 0.87 },
  { id: 'hybrid',   label: 'Hybrid',   unit: 'litre', co2PerUnit: 1.60, consumptionL100Factor: 0.73 },
  { id: 'plugin',   label: 'Plug-in',  unit: 'litre', co2PerUnit: 0.90, consumptionL100Factor: 0.64 },
  { id: 'electric', label: 'Electric', unit: 'kwh',   co2PerUnit: 0.23, consumptionL100Factor: null },
]
