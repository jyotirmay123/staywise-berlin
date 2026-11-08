import { BrowserRouter, HashRouter } from 'react-router-dom'
import { AppNavigation } from '../features/navigation/AppNavigation'
import { AppErrorBoundary } from './AppErrorBoundary'
import { AppRoutes } from './routes'
import { AppProviders } from './AppProviders'

const Router = import.meta.env.MODE === 'pages' ? HashRouter : BrowserRouter

export function App() {
  return (
    <AppErrorBoundary>
      <Router>
        <AppProviders>
          <a className="skip-link" href="#main-content">Skip to content</a>
          <div className="app-shell">
            <AppNavigation />
            <main className="main-content" id="main-content">
              <AppRoutes />
            </main>
          </div>
        </AppProviders>
      </Router>
    </AppErrorBoundary>
  )
}
