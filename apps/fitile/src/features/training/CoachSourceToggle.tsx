export function CoachSourceToggle({ source, onChange }: { source: 'deterministic'|'ai'; onChange: (source:'deterministic'|'ai')=>void }) {
  return <div className="coach-toggle" role="group" aria-label="Recommendation source"><button className={source==='deterministic'?'active':''} onClick={()=>onChange('deterministic')}>Smart plan</button><button className={source==='ai'?'active':''} onClick={()=>onChange('ai')}>AI Coach</button></div>
}
