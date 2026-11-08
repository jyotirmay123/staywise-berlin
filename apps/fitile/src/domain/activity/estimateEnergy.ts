export type EnergyEstimateInput = { met: number; minutes: number; weightKg: number }

export function estimateActivityKcal({ met, minutes, weightKg }: EnergyEstimateInput) {
  const safeMet = Math.max(0, met)
  const safeMinutes = Math.max(0, minutes)
  const safeWeight = Math.max(0, weightKg)
  return { kcal: Math.round((safeMet * 3.5 * safeWeight / 200) * safeMinutes), estimated: true as const }
}
