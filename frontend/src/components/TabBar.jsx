const TABS = [
  { id: 'settings', label: 'Settings' },
  { id: 'home', label: 'Home' },
  { id: 'analytics', label: 'Analytics' },
]

function TabBar({ current, onChange }) {
  return (
    <nav className="tab-bar" aria-label="Main">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab ${current === tab.id ? 'active' : ''}`}
          aria-current={current === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

export default TabBar
