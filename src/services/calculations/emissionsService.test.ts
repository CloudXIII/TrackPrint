import { describe, expect, it } from 'vitest'
import { FUELS } from '@/config/fuels.ts'
import { GRID_CO2_KG_PER_KWH, KM_PER_MILE } from '@/constants/index.ts'
import {
  calcCo2FromEnergy,
  calcEquivalents,
  calcPluginCo2,
  calcTripCo2,
  usesGridElectricity,
} from '@/services/calculations/emissionsService.ts'

const petrol = FUELS.find((f) => f.id === 'petrol')!
const plugin = FUELS.find((f) => f.id === 'plugin')!

const petrolFuelInput = {
  id: petrol.id,
  unit: petrol.unit,
  co2PerUnit: petrol.co2PerUnit!,
}

const pluginFuelInput = {
  id: plugin.id,
  unit: plugin.unit,
  co2PerUnit: plugin.co2PerUnit!,
}

describe('emissionsService', () => {
  describe('calcCo2FromEnergy', () => {
    it('multiplies energy used by the fuel CO₂ factor', () => {
      // 6.5 L × 2.31 kg CO₂/L ≈ 15.02 kg
      expect(calcCo2FromEnergy(6.5, petrolFuelInput)).toBeCloseTo(15.015, 2)
    })
  })

  describe('calcPluginCo2', () => {
    it('combines grid electricity and fossil fuel emissions', () => {
      const kwh = 8.5
      const litres = 6.24
      const expected = kwh * GRID_CO2_KG_PER_KWH + litres * pluginFuelInput.co2PerUnit

      expect(calcPluginCo2(kwh, litres, pluginFuelInput)).toBeCloseTo(expected, 4)
    })
  })

  describe('calcTripCo2', () => {
    it('delegates to single-fuel calculation when energy is not split', () => {
      expect(
        calcTripCo2({
          fuel: petrolFuelInput,
          energyUsed: 6.5,
          energyUsedLitres: 6.5,
          energyUsedKwh: null,
          isSplitEnergy: false,
        }),
      ).toBeCloseTo(15.015, 2)
    })

    it('delegates to plug-in calculation when energy is split', () => {
      const kwh = 8.5
      const litres = 6.24

      expect(
        calcTripCo2({
          fuel: pluginFuelInput,
          energyUsed: litres,
          energyUsedLitres: litres,
          energyUsedKwh: kwh,
          isSplitEnergy: true,
        }),
      ).toBeCloseTo(calcPluginCo2(kwh, litres, pluginFuelInput), 4)
    })
  })

  describe('calcEquivalents', () => {
    it('returns one entry per defined equivalent', () => {
      const equivalents = calcEquivalents(15, 'eu')
      expect(equivalents).toHaveLength(6)
      expect(equivalents.map((e) => e.id)).toEqual([
        'trees',
        'burgers',
        'train',
        'phones',
        'laundry',
        'bottles',
      ])
    })

    it('uses km for EU train equivalents and miles for UK', () => {
      const euTrain = calcEquivalents(10, 'eu').find((e) => e.id === 'train')!
      const ukTrain = calcEquivalents(10, 'uk').find((e) => e.id === 'train')!

      expect(euTrain.unit).toBe('km')
      expect(ukTrain.unit).toBe('mi')
      // Same CO₂ footprint — mile count is lower because each mile represents more rail distance.
      expect(ukTrain.value * KM_PER_MILE).toBeCloseTo(euTrain.value, 0)
    })

    it('includes human-readable labels and descriptions', () => {
      const burger = calcEquivalents(9, 'eu').find((e) => e.id === 'burgers')!

      expect(burger.label).toBe('Beef burgers (production)')
      expect(burger.description).toContain('burger')
    })
  })

  describe('usesGridElectricity', () => {
    it('is true for pure electric fuel', () => {
      expect(usesGridElectricity('electric', 17)).toBe(true)
    })

    it('is true for plug-in when kWh were used', () => {
      expect(usesGridElectricity('plugin', 8.5)).toBe(true)
    })

    it('is false for fossil fuels and plug-in with zero kWh', () => {
      expect(usesGridElectricity('petrol', null)).toBe(false)
      expect(usesGridElectricity('plugin', 0)).toBe(false)
    })
  })
})
