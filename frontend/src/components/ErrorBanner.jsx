import { AlertIcon, CloseIcon } from './Icons.jsx'

// Yellow warning banner pinned to the top of the page, for problems with the
// mat connection. It stays until it is dismissed or the problem is cleared.
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="info-banner info-banner-warning error-banner" role="alert">
      <AlertIcon />
      <span className="info-banner-text">{message}</span>
      <button
        className="info-banner-close"
        aria-label="Dismiss message"
        onClick={onDismiss}
      >
        <CloseIcon />
      </button>
    </div>
  )
}

export default ErrorBanner
