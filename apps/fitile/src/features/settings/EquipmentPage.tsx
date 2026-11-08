import { usePersistentState } from '../../data/usePersistentState'
import { useState } from 'react'
import { Cable, Dumbbell, Gauge, Plus, RotateCw, Rows3 } from 'lucide-react'
import { Button } from '../../design/components/Button'
import { Card } from '../../design/components/Card'
import { defaultHomeEquipment } from '../../domain/catalog/equipment'
import type { UserEquipment } from '../../domain/models'

const iconByCapability = { dumbbell: Dumbbell, 'flat-bench': Rows3, 'low-cable': Cable, twister: RotateCw, treadmill: Gauge, bodyweight: Dumbbell }

export function EquipmentPage() {
  const [items, setItems] = usePersistentState<UserEquipment[]>('equipment', [])
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const save = () => { if (!name.trim()) return; setItems([...items, { id: crypto.randomUUID(), name: name.trim(), capabilities: ['bodyweight'], location: 'Home', available: true }]); setName(''); setAdding(false) }
  return <section className="settings-section"><div className="section-heading"><div><p className="eyebrow">Recommendation filter</p><h2>Home equipment</h2></div><Button variant="secondary" onClick={() => setAdding(true)}><Plus size={17}/> Add equipment</Button></div>{items.length===0&&<Card><p>No saved equipment yet.</p><p className="muted">Add your equipment or explicitly choose the example home-gym preset.</p><Button variant="secondary" onClick={()=>setItems(defaultHomeEquipment.filter(item=>item.id!=='bodyweight-home'))}>Use example home gym</Button></Card>}<div className="equipment-list">{items.map((item) => { const Icon = iconByCapability[item.capabilities[0] as keyof typeof iconByCapability] ?? Dumbbell; return <Card key={item.id} className="equipment-row"><span className="icon-tile"><Icon size={20}/></span><div><strong>{item.name}</strong><small>{item.maxKg ? `${item.minKg}–${item.maxKg} kg per hand` : item.location}</small></div><button className={item.available ? 'availability active' : 'availability'} onClick={() => setItems(items.map((current) => current.id === item.id ? { ...current, available: !current.available } : current))}>{item.available ? 'Available' : 'Paused'}</button></Card>})}</div>{adding && <Card className="inline-form"><label htmlFor="equipment-name">Equipment name</label><input id="equipment-name" aria-label="Equipment name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Pull-up bar"/><div><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={save}>Save equipment</Button></div></Card>}</section>
}
