import type { MuscleId } from '../../domain/models'
import { muscleById } from '../../domain/catalog/muscles'

const mapped: MuscleId[] = ['chest','front-delts','side-delts','biceps','triceps','abs','obliques','upper-back','lats','lower-back','glutes','quadriceps','hamstrings','calves']
const stateFor = (value:number) => value>=75?'fresh':value>=40?'recovering':'fatigued'

export function MuscleMap({ readiness, selected, onSelect }: { readiness: Partial<Record<MuscleId,number>>; selected?: MuscleId; onSelect: (id:MuscleId)=>void }) {
  return <div className="muscle-map"><div className="body-figure" aria-hidden="true"><i className="body-head"/><i className="body-torso"/><i className="body-arm left"/><i className="body-arm right"/><i className="body-leg left"/><i className="body-leg right"/></div><div className="muscle-map__labels">{mapped.map((id,index)=>{const value=readiness[id]??100;const state=stateFor(value);return <button key={id} style={{'--row':index} as React.CSSProperties} className={`${state}${selected===id?' selected':''}`} aria-label={`${muscleById[id].name} — ${value}% ready, ${state}`} onClick={()=>onSelect(id)}><span>{muscleById[id].name}</span><strong>{value}%</strong></button>})}</div></div>
}
