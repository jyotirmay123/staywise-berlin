import { Cloud, Dumbbell, ShieldCheck } from 'lucide-react'
import { Button } from '../../design/components/Button'
import { Card } from '../../design/components/Card'
import './auth.css'

export function SignInPage({ cloudConfigured, onGoogleSignIn }: { cloudConfigured: boolean; onGoogleSignIn: () => Promise<void> }) {
  return (
    <main className="auth-page">
      <Card className="auth-card">
        <div className="auth-brand"><Dumbbell size={22} /><strong>Fitile</strong></div>
        <p className="eyebrow">Your health, your data</p>
        <h1>{cloudConfigured ? 'Pick up on any screen.' : 'Explore Fitile locally.'}</h1>
        <p className="muted">{cloudConfigured ? 'Google sign-in synchronizes your Fitile data privately between your phone and laptop.' : 'Demo mode keeps sample data on this device. Add your cloud settings to enable Google sign-in and synchronization.'}</p>
        {cloudConfigured ? (
          <Button onClick={() => void onGoogleSignIn()} className="google-button">Continue with Google</Button>
        ) : <div className="demo-auth-label">Demo mode · local only</div>}
        <div className="auth-assurances">
          <span><ShieldCheck size={17} /> Private account records</span>
          <span><Cloud size={17} /> Offline-first synchronization</span>
        </div>
      </Card>
    </main>
  )
}
