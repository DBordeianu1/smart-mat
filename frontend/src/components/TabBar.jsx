import { ChartColumn, House, Settings, User } from 'lucide-react'

const TABS = [
  { id: 'settings', label: 'Settings', Icon: Settings },
  { id: 'home', label: 'Home', Icon: House },
  { id: 'analytics', label: 'Analytics', Icon: ChartColumn },
  { id: 'profile', label: 'Profile', Icon: User },
]

function TabBar({ current, onChange }) {
  return (
    <nav className="tab-bar" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab ${current === id ? 'active' : ''}`}
          aria-label={label}
          aria-current={current === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon strokeWidth={2} aria-hidden="true" />
        </button>
      ))}
    </nav>
  )
}

export default TabBar
