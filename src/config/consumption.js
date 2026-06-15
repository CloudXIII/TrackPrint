// [O] Effective litre consumption for a vehicle + fuel combination.
// Petrol uses vehicle.consumptionL100km as baseline; other litre fuels apply their factor.

export function getEffectiveL100(vehicle, fuel) {
  if (!vehicle || !fuel || fuel.unit === 'kwh') return null
  const factor = fuel.consumptionL100Factor ?? 1
  return vehicle.consumptionL100km * factor
}
