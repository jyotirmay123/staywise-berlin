import { usePersistentState } from '../../data/usePersistentState'
import { useState } from 'react'
import { Button } from '../../design/components/Button'
import type { MuscleId } from '../../domain/models'
import { muscleById } from '../../domain/catalog/muscles'

export function SorenessCheckIn({ muscleId }: { muscleId: MuscleId }) {
  const [value,setValue]=usePersistentState(`soreness:${muscleId}`, 2); const [saved,setSaved]=useState(false)
  return <div className="soreness"><label htmlFor="soreness">How does your {muscleById[muscleId].name.toLowerCase()} feel? <strong>{value}/10</strong></label><input id="soreness" type="range" min="0" max="10" value={value} onChange={(event)=>{setValue(Number(event.target.value));setSaved(false)}}/><div className="soreness-scale"><span>No soreness</span><span>Very sore</span></div><Button variant="secondary" onClick={()=>{setValue(value);setSaved(true)}}>{saved?'Check-in saved':'Save check-in'}</Button></div>
}
