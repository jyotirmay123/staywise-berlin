import { ArrowUpRight, ChevronRight, Clock3, Flame, Plus, Salad, Sparkles } from 'lucide-react'
import { Button } from '../../design/components/Button'
import { Card } from '../../design/components/Card'
import { ProgressRing } from '../../design/components/ProgressRing'
import './today.css'
import { Link, useNavigate } from 'react-router-dom'

const muscles = [
  { name: 'Chest', value: 94, state: 'Fresh' },
  { name: 'Shoulders', value: 88, state: 'Fresh' },
  { name: 'Triceps', value: 82, state: 'Fresh' },
]

export function TodayPage() {
  const navigate = useNavigate()

  return (
    <div className="today-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Friday · 28 August</p>
          <h1>Ready for a strong one.</h1>
          <p className="muted">Your push muscles are recovered and your weekly load is on track.</p>
        </div>
        <button className="avatar-button" aria-label="Open profile">FT</button>
      </header>

      <div className="demo-banner"><Sparkles size={15} aria-hidden="true" /> Illustrative dashboard · your edits stay on this device</div>

      <section className="today-grid" aria-label="Daily overview">
        <Card accent className="workout-hero" aria-labelledby="recommended-title">
          <div className="workout-hero__topline">
            <span>Deterministic coach</span>
            <span><Clock3 size={15} /> 48 min</span>
          </div>
          <div>
            <p className="eyebrow eyebrow--lime">Today’s recommendation</p>
            <h2 id="recommended-title">Dumbbell push</h2>
            <p>Chest, shoulders & triceps · 5 exercises</p>
          </div>
          <div className="muscle-chips" aria-label="Target muscles">
            {muscles.map((muscle) => <span key={muscle.name}>{muscle.name} {muscle.value}%</span>)}
          </div>
          <div className="workout-hero__actions">
            <Button onClick={() => navigate('/train')}>Start workout <ArrowUpRight size={18} /></Button>
            <Button variant="ghost">Adjust</Button>
          </div>
        </Card>

        <Card className="readiness-card" aria-labelledby="readiness-title">
          <div className="card-heading">
            <div><p className="eyebrow">Recovery</p><h2 id="readiness-title">Muscle readiness</h2></div>
            <ProgressRing value={86} label="Overall readiness" size={68} color="var(--fresh)" />
          </div>
          <div className="readiness-list">
            {muscles.map((muscle) => (
              <div key={muscle.name} className="readiness-row">
                <span>{muscle.name}</span>
                <span className="readiness-bar"><i style={{ width: `${muscle.value}%` }} /></span>
                <strong>{muscle.value}%</strong>
              </div>
            ))}
          </div>
          <Link className="text-link" to="/recovery">View body map <ChevronRight size={17} /></Link>
        </Card>

        <Card className="nutrition-card" aria-labelledby="nutrition-title">
          <div className="card-heading">
            <div><p className="eyebrow">Nutrition</p><h2 id="nutrition-title">1,248 kcal left</h2></div>
            <span className="icon-tile"><Salad aria-hidden="true" size={21} /></span>
          </div>
          <div className="calorie-track" aria-label="752 of 2000 calories consumed"><i style={{ width: '37.6%' }} /></div>
          <div className="macro-grid">
            <div><strong>68<span>g</span></strong><small>Protein</small></div>
            <div><strong>91<span>g</span></strong><small>Carbs</small></div>
            <div><strong>24<span>g</span></strong><small>Fat</small></div>
          </div>
          <button className="text-link"><Plus size={17} /> Log a meal</button>
        </Card>

        <Card className="activity-card" aria-labelledby="activity-title">
          <div className="card-heading">
            <div><p className="eyebrow">Movement</p><h2 id="activity-title">4,820 steps</h2></div>
            <span className="icon-tile icon-tile--amber"><Flame aria-hidden="true" size={21} /></span>
          </div>
          <p className="muted">3.6 km · 218 kcal estimated</p>
          <div className="mini-week" aria-label="Steps this week">
            {[48, 76, 54, 88, 42, 0, 0].map((height, index) => <i key={index} style={{ height: `${Math.max(height, 8)}%` }} className={index === 4 ? 'current' : ''} />)}
          </div>
          <div className="week-labels"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
        </Card>
      </section>

      <Button className="quick-add" aria-label="Quick add"><Plus size={22} /> <span>Quick add</span></Button>
      <p className="fine-print today-disclaimer">Recovery and calorie values are estimates, not medical measurements.</p>
    </div>
  )
}
