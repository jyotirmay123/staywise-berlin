import { usePersistentState } from '../../data/usePersistentState'
import { useState } from 'react'
import { Check, ChevronLeft, Dumbbell } from 'lucide-react'
import { Button } from '../../design/components/Button'
import { Card } from '../../design/components/Card'
import { onboardingSteps } from './steps'
import type { OnboardingData } from './onboardingSchema'
import './onboarding.css'

const defaults: OnboardingData = { goal: 'general-fitness', split: 'push-pull-legs', equipment: [], workoutDays: 4, workoutMinutes: 50 }

export function OnboardingPage({ onComplete }: { onComplete?: (data: OnboardingData) => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [data, setData] = usePersistentState('onboarding', defaults)
  const step = onboardingSteps[stepIndex]
  const continueNext = () => {
    if (stepIndex === onboardingSteps.length - 1) { setData({...data}); onComplete?.(data) }
    else setStepIndex((value) => value + 1)
  }

  return (
    <main className="onboarding-page">
      <div className="onboarding-frame">
        <header className="onboarding-header">
          <div className="auth-brand"><Dumbbell size={22} /><strong>Fitile</strong></div>
          <span>Step {stepIndex + 1} of {onboardingSteps.length}</span>
        </header>
        <div className="onboarding-progress"><i style={{ width: `${((stepIndex + 1) / onboardingSteps.length) * 100}%` }} /></div>
        <Card className="onboarding-card">
          {step === 'goal' && <ChoiceStep title="What are we working toward?" subtitle="This shapes volume, progression and your nutrition target." value={data.goal} onChange={(goal) => setData({ ...data, goal: goal as OnboardingData['goal'] })} choices={[['general-fitness','Feel fitter'],['build-muscle','Build muscle'],['strength','Get stronger'],['fat-loss','Lose fat'],['endurance','Build endurance']]} />}
          {step === 'split' && <ChoiceStep title="How should training rotate?" subtitle="You can change this for any workout." value={data.split} onChange={(split) => setData({ ...data, split: split as OnboardingData['split'] })} choices={[['push-pull-legs','Push / Pull / Legs'],['upper-lower','Upper / Lower'],['full-body','Full body'],['fresh','Fresh muscles']]} />}
          {step === 'equipment' && <EquipmentStep selected={data.equipment} onChange={(equipment) => setData({ ...data, equipment })} />}
          {step === 'schedule' && <ScheduleStep data={data} onChange={setData} />}
          <footer className="onboarding-actions">
            {stepIndex > 0 && <Button variant="ghost" onClick={() => setStepIndex((value) => value - 1)}><ChevronLeft size={18} /> Back</Button>}
            <Button onClick={continueNext}>{stepIndex === onboardingSteps.length - 1 ? 'Finish setup' : 'Continue'}</Button>
          </footer>
        </Card>
        <p className="fine-print">Fitile provides training and nutrition estimates, not medical advice. You can correct every target.</p>
      </div>
    </main>
  )
}

function ChoiceStep({ title, subtitle, value, onChange, choices }: { title: string; subtitle: string; value: string; onChange: (value: string) => void; choices: [string,string][] }) {
  return <div><p className="eyebrow">Personalize Fitile</p><h1>{title}</h1><p className="muted">{subtitle}</p><div className="choice-grid">{choices.map(([id,label]) => <button key={id} className={value === id ? 'choice active' : 'choice'} onClick={() => onChange(id)}>{label}{value === id && <Check size={18} />}</button>)}</div></div>
}

function EquipmentStep({ selected, onChange }: { selected: string[]; onChange: (items: string[]) => void }) {
  const choices: [string,string,string][] = [['adjustable-dumbbells','Adjustable dumbbells','5–25 kg per hand'],['adjustable-bench','Adjustable bench','Flat, incline & seated'],['bench-cables','Cable attachments','Low & high cable movements'],['twister','Waist twister','Controlled rotation'],['treadmill','Treadmill','Walking & running']]
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  return <div><p className="eyebrow">Your home gym</p><h1>What can you train with?</h1><p className="muted">Recommendations will use only selected equipment.</p><div className="choice-grid">{choices.map(([id,label,detail]) => <button key={id} className={selected.includes(id) ? 'choice active' : 'choice'} onClick={() => toggle(id)}><span><strong>{label}</strong><small>{detail}</small></span>{selected.includes(id) && <Check size={18} />}</button>)}</div></div>
}

function ScheduleStep({ data, onChange }: { data: OnboardingData; onChange: (data: OnboardingData) => void }) {
  return <div><p className="eyebrow">Your rhythm</p><h1>Make the plan fit real life.</h1><p className="muted">Fitile will scale each session to this time.</p><div className="range-field"><label htmlFor="days">Training days <strong>{data.workoutDays} / week</strong></label><input id="days" type="range" min="1" max="7" value={data.workoutDays} onChange={(event) => onChange({ ...data, workoutDays: Number(event.target.value) })} /></div><div className="range-field"><label htmlFor="minutes">Session length <strong>{data.workoutMinutes} min</strong></label><input id="minutes" type="range" min="15" max="90" step="5" value={data.workoutMinutes} onChange={(event) => onChange({ ...data, workoutMinutes: Number(event.target.value) })} /></div></div>
}
