import { Component, type ErrorInfo, type PropsWithChildren } from 'react'
import { Button } from '../design/components/Button'

type State = { failed: boolean }

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State { return { failed: true } }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Fitile rendering error', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="page-placeholder">
        <div className="page-placeholder__inner">
          <p className="eyebrow">Fitile paused safely</p>
          <h1>Something didn’t load.</h1>
          <p className="muted">Your saved activity is still on this device. Reload to try again.</p>
          <Button onClick={() => window.location.reload()}>Reload Fitile</Button>
        </div>
      </main>
    )
  }
}
