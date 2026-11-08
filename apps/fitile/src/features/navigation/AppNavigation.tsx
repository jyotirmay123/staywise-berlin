import { Activity, Dumbbell, House, Salad, Settings2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './navigation.css'

const destinations = [
  { to: '/', key: 'nav.today', label: 'Today', icon: House, end: true },
  { to: '/train', key: 'nav.train', label: 'Train', icon: Dumbbell, end: false },
  { to: '/food', key: 'nav.food', label: 'Food', icon: Salad, end: false },
  { to: '/progress', key: 'nav.progress', label: 'Progress', icon: Activity, end: false },
  { to: '/profile', key: 'nav.profile', label: 'Profile', icon: Settings2, end: false },
] as const

export function AppNavigation() {
  const { t } = useTranslation()

  return (
    <nav className="app-navigation" aria-label="Primary">
      <NavLink className="brand-mark" to="/" aria-label="Fitile home">
        <span>F</span>
        <strong>Fitile</strong>
      </NavLink>
      <div className="app-navigation__items">
        {destinations.map(({ to, key, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            aria-label={label}
            className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
          >
            <Icon aria-hidden="true" size={21} strokeWidth={2.2} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
