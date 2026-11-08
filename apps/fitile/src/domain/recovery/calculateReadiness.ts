import type { MuscleId, RecoveryEvent } from '../models'

export type ReadinessResult = {
  muscleId?: MuscleId
  percent: number
  state: 'fresh' | 'recovering' | 'fatigued'
  hoursToFresh: number
  contributors: { label: string; remainingFatigue: number }[]
}

const clamp = (value: number) => Math.max(0, Math.min(100, value))

export function calculateReadiness(events: RecoveryEvent[], at = new Date()): ReadinessResult {
  const contributors = events.flatMap((event) => {
    const elapsedHours = Math.max(0, (at.getTime() - new Date(event.occurredAt).getTime()) / 3_600_000)
    const remainingFatigue = clamp(event.fatigue * (1 - elapsedHours / event.recoveryHours))
    return remainingFatigue > 0 ? [{ label: event.sourceLabel, remainingFatigue: Math.round(remainingFatigue) }] : []
  })
  const totalFatigue = clamp(contributors.reduce((total, item) => total + item.remainingFatigue, 0))
  const percent = Math.round(100 - totalFatigue)
  const latestEnd = events.reduce((max, event) => Math.max(max, new Date(event.occurredAt).getTime() + event.recoveryHours * 3_600_000), at.getTime())
  return {
    muscleId: events[0]?.muscleId,
    percent,
    state: percent >= 75 ? 'fresh' : percent >= 40 ? 'recovering' : 'fatigued',
    hoursToFresh: Math.max(0, Math.ceil((latestEnd - at.getTime()) / 3_600_000)),
    contributors,
  }
}
