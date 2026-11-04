import PawBadge from './PawBadge.jsx'

// Screen title with the Paw Unit badge, or custom content, on the right.
// An optional note sits along the bottom of the header without using extra space.
function ScreenHeader({ title, note, children }) {
  return (
    <header className="screen-header">
      <h1>{title}</h1>
      {children ?? <PawBadge />}
      {note && <p className="screen-header-note">{note}</p>}
    </header>
  )
}

export default ScreenHeader
