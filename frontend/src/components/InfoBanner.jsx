import { useState } from 'react'
import { CloseIcon, InfoIcon } from './Icons.jsx'
import { loadJSON, saveJSON } from '../storage.js'

const BANNER_KEY = 'smartmat.dismissedBanners'

// Full-width information banner. Each banner id is dismissed on its own
// and stays dismissed.
function InfoBanner({ id, children }) {
  const [dismissed, setDismissed] = useState(() => loadJSON(BANNER_KEY, {}))

  if (dismissed[id]) return null

  function dismiss() {
    const next = { ...dismissed, [id]: true }
    setDismissed(next)
    saveJSON(BANNER_KEY, next)
  }

  return (
    <div className="info-banner" role="status">
      <InfoIcon />
      <span className="info-banner-text">{children}</span>
      <button
        className="info-banner-close"
        aria-label="Dismiss message"
        onClick={dismiss}
      >
        <CloseIcon />
      </button>
    </div>
  )
}

export default InfoBanner
