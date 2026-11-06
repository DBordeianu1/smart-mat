// Popup notice above the nav bar. The key restarts its animation on each show.
function Toast({ shownAt, children }) {
  if (shownAt === null) return null

  return (
    <p key={shownAt} className="toast" role="status">
      {children}
    </p>
  )
}

export default Toast
