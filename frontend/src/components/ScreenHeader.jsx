import PawBadge from './PawBadge.jsx'

// Screen title with the Paw Unit badge, or custom content, on the right
function ScreenHeader({ title, children }) {
  return (
    <header className="screen-header">
      <h1>{title}</h1>
      {children ?? <PawBadge />}
    </header>
  )
}

export default ScreenHeader
