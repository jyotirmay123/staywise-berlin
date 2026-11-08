import { useState } from 'react'
import { Target } from 'lucide-react'
import { Button } from '../../design/components/Button'
import { Card } from '../../design/components/Card'
import { EquipmentPage } from './EquipmentPage'
import { DataOwnershipPage } from './DataOwnershipPage'
import './settings.css'

export function ProfilePage() {
  const [tab, setTab] = useState<'profile'|'equipment'|'data'>('profile')
  return <div><p className="fine-print">Example plan and chart values are illustrative. Your saved edits are stored locally.</p><header className="page-header"><div><p className="eyebrow">Your Fitile</p><h1>Built around you.</h1><p className="muted">Goals, equipment, safety limits and ownership.</p></div></header><div className="settings-tabs" role="tablist">{([['profile','Profile'],['equipment','Equipment'],['data','Data & sync']] as const).map(([id,label]) => <button role="tab" aria-selected={tab===id} key={id} onClick={() => setTab(id)}>{label}</button>)}</div>{tab==='profile' && <div className="settings-grid"><Card><p className="eyebrow">Primary goal</p><h2>Reduce bodyweight</h2><p className="muted">Illustrative goal · personalize in setup</p><span className="icon-tile"><Target/></span></Card><Card><p className="eyebrow">Training rhythm</p><h2>4 days per week</h2><p className="muted">Push / Pull / Legs · 50 minutes</p></Card><Card className="settings-wide"><p className="eyebrow">Safety filters</p><h2>No active limitations</h2><p className="muted">Add a limitation or soreness check-in anytime. Fitile treats these as constraints, not diagnoses.</p><Button variant="secondary">Review limitations</Button></Card></div>}{tab==='equipment' && <EquipmentPage/>}{tab==='data' && <DataOwnershipPage/>}</div>
}
