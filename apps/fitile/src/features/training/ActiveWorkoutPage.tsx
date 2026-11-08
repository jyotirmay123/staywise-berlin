import { usePersistentState } from '../../data/usePersistentState'
import { useMemo, useState } from 'react'
import { Check, ChevronLeft, MoreHorizontal, Pause, Plus } from 'lucide-react'
import { Button } from '../../design/components/Button'
import { assembleWorkout } from '../../domain/training/assembleWorkout'
import './training.css'

export function ActiveWorkoutPage({ onFinish }: { onFinish: () => void }) {
  const plan = useMemo(() => assembleWorkout({ split:'push', durationMinutes:45, capabilities:['bodyweight','dumbbell','flat-bench','incline-bench','seated-bench'], excludedExerciseIds:[], readiness:{ chest:94, triceps:82, 'front-delts':88, 'side-delts':91 }, variability:'balanced', seed:'demo-active' }), [])
  const [values, setValues] = usePersistentState<Record<string,{weight:number; reps:number; done:boolean}>>('active-workout', {})
  const [resting, setResting] = useState(false)
  const [workouts, setWorkouts] = usePersistentState<Record<string,unknown>[]>('workouts', [])
  const completed = Object.values(values).filter(value=>value.done).length
  const finish = () => {
    if(completed>0) setWorkouts([...workouts,{id:crypto.randomUUID(),completedAt:new Date().toISOString(),sets:values}])
    setValues({})
    onFinish()
  }
  const totalSets = plan.exercises.reduce((sum,item) => sum + item.sets, 0)
  const update = (key:string, patch:Partial<{weight:number;reps:number;done:boolean}>, defaults:{weight:number;reps:number;done:boolean}) => setValues((current) => ({...current,[key]:{...(current[key]??defaults),...patch}}))
  return <div className="active-workout"><header className="active-header"><button aria-label="Back to workout overview" className="round-button"><ChevronLeft/></button><div><p className="eyebrow">Workout in progress</p><strong>Dumbbell push</strong></div><Button variant="ghost" onClick={finish}>Finish</Button></header><div className="workout-progress"><i style={{width:`${(completed/totalSets)*100}%`}}/></div>{resting&&<RestTimer/>}<div className="active-exercises">{plan.exercises.slice(0,3).map((item,index) => <section className="exercise-block" key={item.exercise.id}><header><span className="exercise-number">{String(index+1).padStart(2,'0')}</span><div><h2>{item.exercise.name}</h2><p>{item.sets} sets · {item.repRange[0]}–{item.repRange[1]} reps · {item.restSeconds}s rest</p></div><button className="round-button" aria-label={`Options for ${item.exercise.name}`}><MoreHorizontal/></button></header><div className="set-headings"><span>Set</span><span>kg</span><span>reps</span><span></span></div>{Array.from({length:item.sets},(_,setIndex) => { const key=`${item.exercise.id}:${setIndex}`; const defaults={weight:item.suggestedWeightKg??0,reps:item.repRange[0],done:false}; const value=values[key]??defaults; return <div className={value.done?'set-row done':'set-row'} key={key}><strong>{setIndex+1}</strong><input type="number" step="0.5" aria-label={`${item.exercise.name}: weight for set ${setIndex+1}`} value={value.weight} onChange={(event)=>update(key,{weight:Number(event.target.value)},defaults)}/><input type="number" aria-label={`${item.exercise.name}: repetitions for set ${setIndex+1}`} value={value.reps} onChange={(event)=>update(key,{reps:Number(event.target.value)},defaults)}/><button aria-label={`${value.done?'Undo':'Complete'} ${item.exercise.name} set ${setIndex+1}`} onClick={()=>{update(key,{done:!value.done},defaults);setResting(!value.done)}}>{value.done?<Check/>:<span/>}</button></div>})}<button className="add-set"><Plus size={16}/> Add set</button></section>)}</div><div className="active-footer"><Button variant="secondary"><Pause size={17}/> Pause</Button><span>{completed} of {totalSets} sets</span><Button onClick={finish}>Finish workout</Button></div></div>
}

import { RestTimer } from './RestTimer'
