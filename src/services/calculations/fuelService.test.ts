import { describe, expect, it } from 'vitest'
import { FUELS } from '@/config/fuels.ts'
import { VEHICLES } from '@/config/vehicles.ts'
import {
  calcDisplayCost,
  calcEnergyCost,
  calcEnergyUsed,
  calcPluginCost,
  calcPluginSplit,
  calculateTripFuel,
  getEffectiveL100,
} from '@/services/calculations/fuelService.ts'

const saloon = VEHICLES.find((v) => v.id === 'saloon')!
const petrol = FUELS.find((f) => f.id === 'petrol')!
const plugin = FUELS.find((f) => f.id === 'plugin')!
const electric = FUELS.find((f) => f.id === 'electric')!

describe('fuelService', () => {
  describe('getEffectiveL100', () => {
    it('applies the fuel consumption factor for fossil fuels', () => {
      expect(getEffectiveL100(saloon, petrol)).toBeCloseTo(6.5, 4)
      expect(getEffectiveL100(saloon, plugin)).toBeCloseTo(6.5 * 0.64, 4)
    })

    it('returns null for pure electric fuels', () => {
      expect(getEffectiveL100(saloon, electric)).toBeNull()
    })

    it('returns null when vehicle or fuel is missing', () => {
      expect(getEffectiveL100(null, petrol)).toBeNull()
      expect(getEffectiveL100(saloon, null)).toBeNull()
    })
  })

  describe('calcEnergyUsed', () => {
    it('computes litre consumption from distance and L/100km', () => {
      // 100 km × 6.5 L/100km = 6.5 L
      expect(calcEnergyUsed(100, saloon, petrol)).toBeCloseTo(6.5, 4)
    })

    it('computes kWh consumption for electric trips', () => {
      // 100 km × 0.17 kWh/km = 17 kWh
      expect(calcEnergyUsed(100, saloon, electric)).toBeCloseTo(17, 4)
    })
  })

  describe('calcPluginSplit', () => {
    it('splits distance between battery range and fossil remainder', () => {
      const split = calcPluginSplit(200, saloon, plugin, 50)

      expect(split.electricKm).toBe(50)
      expect(split.fossilKm).toBe(150)
      expect(split.kwh).toBeCloseTo(50 * saloon.consumptionKWhKm, 4)
      expect(split.litres).toBeCloseTo((150 * 6.5 * 0.64) / 100, 4)
    })

    it('uses the full distance on electric when within battery range', () => {
      const split = calcPluginSplit(30, saloon, plugin, 50)

      expect(split.electricKm).toBe(30)
      expect(split.fossilKm).toBe(0)
      expect(split.litres).toBe(0)
    })
  })

  describe('cost helpers', () => {
    it('multiplies energy by unit price', () => {
      expect(calcEnergyCost(6.5, 1.65)).toBeCloseTo(10.725, 4)
    })

    it('sums electricity and fossil costs for plug-in trips', () => {
      expect(calcPluginCost(8.5, 6.24, 0.35, 1.65)).toBeCloseTo(8.5 * 0.35 + 6.24 * 1.65, 4)
    })
  })

  describe('calcDisplayCost', () => {
    it('converts default UK petrol cost to EU when toggling market', () => {
      const litres = 6.5
      const ukCost = litres * 1.42
      const euCost = calcDisplayCost({
        energyUsed: litres,
        energyUsedLitres: litres,
        energyUsedKwh: null,
        isSplitEnergy: false,
        fuelId: 'petrol',
        fuelPriceAtCalc: 1.42,
        electricityPriceAtCalc: 0.35,
        calculationMarket: 'uk',
        displayMarket: 'eu',
      })

      expect(euCost).toBeCloseTo(litres * 1.65, 2)
      expect(euCost).not.toBeCloseTo(ukCost, 2)
    })

    it('keeps a custom fuel price when switching market', () => {
      const litres = 6.5
      const customPrice = 1.50

      expect(calcDisplayCost({
        energyUsed: litres,
        energyUsedLitres: litres,
        energyUsedKwh: null,
        isSplitEnergy: false,
        fuelId: 'petrol',
        fuelPriceAtCalc: customPrice,
        electricityPriceAtCalc: 0.35,
        calculationMarket: 'uk',
        displayMarket: 'eu',
      })).toBeCloseTo(litres * customPrice, 2)
    })
  })

  describe('calculateTripFuel', () => {
    it('returns a complete petrol trip result', () => {
      const result = calculateTripFuel({
        distanceKm: 100,
        vehicle: saloon,
        fuel: petrol,
        fuelPrice: 1.65,
        electricityPrice: 0.35,
      })

      expect(result.isSplitEnergy).toBe(false)
      expect(result.energyUsedLitres).toBeCloseTo(6.5, 4)
      expect(result.energyUsedKwh).toBeNull()
      expect(result.cost).toBeCloseTo(10.725, 4)
    })

    it('returns a complete electric trip result', () => {
      const result = calculateTripFuel({
        distanceKm: 100,
        vehicle: saloon,
        fuel: electric,
        fuelPrice: 0.35,
        electricityPrice: 0.35,
      })

      expect(result.isSplitEnergy).toBe(false)
      expect(result.energyUsedKwh).toBeCloseTo(17, 4)
      expect(result.energyUsedLitres).toBeNull()
      expect(result.cost).toBeCloseTo(17 * 0.35, 4)
    })

    it('returns split energy and combined cost for plug-in trips', () => {
      const result = calculateTripFuel({
        distanceKm: 200,
        vehicle: saloon,
        fuel: plugin,
        fuelPrice: 1.65,
        electricityPrice: 0.35,
        batteryRangeKm: 50,
      })

      expect(result.isSplitEnergy).toBe(true)
      expect(result.energyUsedKwh).toBeCloseTo(8.5, 4)
      expect(result.energyUsedLitres).toBeCloseTo(6.24, 2)
      expect(result.cost).toBeCloseTo(8.5 * 0.35 + 6.24 * 1.65, 2)
    })
  })
})
