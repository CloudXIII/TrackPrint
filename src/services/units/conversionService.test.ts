import { describe, expect, it } from 'vitest'
import {
  eurToGbp,
  kmToMiles,
  kwhPerKmToKwhPer100km,
  kwhPerKmToMiPerKwh,
  l100kmToMpg,
  milesToKm,
  mpgToL100km,
} from '@/services/units/conversionService.ts'

describe('conversionService', () => {
  describe('distance', () => {
    it('converts km to miles with a known reference value', () => {
      // 100 km ≈ 62.14 mi (1 international mile = 1.609344 km)
      expect(kmToMiles(100)).toBeCloseTo(62.1371, 2)
      expect(kmToMiles(1)).toBeCloseTo(0.6214, 3)
    })

    it('converts miles to km with a known reference value', () => {
      expect(milesToKm(1)).toBeCloseTo(1.6093, 3)
      expect(milesToKm(62.1371)).toBeCloseTo(100, 1)
    })

    it('round-trips distance regardless of the conversion constant', () => {
      const miles = 42.5
      expect(kmToMiles(milesToKm(miles))).toBeCloseTo(miles, 6)
    })

    it('handles zero distance', () => {
      expect(kmToMiles(0)).toBe(0)
      expect(milesToKm(0)).toBe(0)
    })
  })

  describe('consumption', () => {
    it('converts L/100km to MPG with a known reference value', () => {
      // 6.5 L/100km ≈ 43.5 MPG (EPA-style conversion factor used in the app)
      expect(l100kmToMpg(6.5)).toBeCloseTo(43.5, 0)
      expect(l100kmToMpg(10)).toBeCloseTo(28.2, 0)
    })

    it('converts MPG to L/100km with a known reference value', () => {
      expect(mpgToL100km(43.458)).toBeCloseTo(6.5, 1)
    })

    it('round-trips consumption regardless of the conversion factor', () => {
      const l100 = 7.8
      expect(mpgToL100km(l100kmToMpg(l100))).toBeCloseTo(l100, 6)
    })

    it('returns Infinity when L/100km or MPG is zero', () => {
      expect(l100kmToMpg(0)).toBe(Infinity)
      expect(mpgToL100km(0)).toBe(Infinity)
    })
  })

  describe('currency', () => {
    it('converts EUR to GBP with a concrete amount', () => {
      // App uses a fixed EUR→GBP rate of 0.86
      expect(eurToGbp(100)).toBeCloseTo(86, 2)
      expect(eurToGbp(1.65)).toBeCloseTo(1.419, 2)
    })

    it('handles zero amount', () => {
      expect(eurToGbp(0)).toBe(0)
    })
  })

  describe('electric consumption', () => {
    it('expresses kWh/km as kWh per 100 km', () => {
      // 0.17 kWh/km = 17 kWh/100 km (typical compact EV profile in config)
      expect(kwhPerKmToKwhPer100km(0.17)).toBeCloseTo(17, 2)
      expect(kwhPerKmToKwhPer100km(0.14)).toBeCloseTo(14, 2)
    })

    it('expresses kWh/km as miles per kWh', () => {
      // 0.17 kWh/km ≈ 3.66 mi/kWh
      expect(kwhPerKmToMiPerKwh(0.17)).toBeCloseTo(3.66, 1)
    })

    it('handles zero consumption', () => {
      expect(kwhPerKmToKwhPer100km(0)).toBe(0)
    })

    it('returns Infinity when consumption per km is zero', () => {
      expect(kwhPerKmToMiPerKwh(0)).toBe(Infinity)
    })
  })
})
