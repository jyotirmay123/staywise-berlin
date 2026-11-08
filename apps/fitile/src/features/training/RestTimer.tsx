import { TimerReset } from 'lucide-react'

export function RestTimer({ seconds = 90 }: { seconds?: number }) {
  return <div className="rest-timer" role="timer" aria-label={`${seconds} seconds rest remaining`}><TimerReset size={18}/><strong>{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</strong><span>Rest</span></div>
}
