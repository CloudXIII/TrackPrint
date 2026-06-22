import {
  EUR_TO_GBP,
  KM_PER_MILE,
  KM_TO_MILES,
  KWH_PER_100KM,
  L100KM_TO_MPG_FACTOR,
} from '@/constants/index.ts'

export function kmToMiles(km: number): number {
  return km * KM_TO_MILES
}

export function milesToKm(miles: number): number {
  return miles * KM_PER_MILE
}

export function l100kmToMpg(l100: number): number {
  return L100KM_TO_MPG_FACTOR / l100
}

export function mpgToL100km(mpg: number): number {
  return L100KM_TO_MPG_FACTOR / mpg
}

export function eurToGbp(eur: number): number {
  return eur * EUR_TO_GBP
}

export function kwhPerKmToMiPerKwh(consumptionKWhKm: number): number {
  return KM_TO_MILES / consumptionKWhKm
}

export function kwhPerKmToKwhPer100km(consumptionKWhKm: number): number {
  return consumptionKWhKm * KWH_PER_100KM
}
