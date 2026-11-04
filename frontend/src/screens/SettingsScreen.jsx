import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader.jsx'
import SliderCard from '../components/SliderCard.jsx'

// Personalization area
function SettingsScreen({ mat }) {
  // Set to a new value each time the notice should pop up (restarts it)
  const [blockedAt, setBlockedAt] = useState(null)

  // The "blocked" notice is a popup that goes away on its own
  useEffect(() => {
    if (blockedAt === null) return
    const timer = setTimeout(() => setBlockedAt(null), 4000)
    return () => clearTimeout(timer)
  }, [blockedAt])

  // Only Android Chrome can open system settings from a web page, so on iPhone
  // and desktop browsers the notice shows right away. On Android, try the
  // deep link and show the notice if the page is still visible afterwards.
  function openDeviceSettings() {
    if (!/Android/i.test(navigator.userAgent)) {
      setBlockedAt(Date.now())
      return
    }

    window.location.href = 'intent://settings#Intent;action=android.settings.SETTINGS;end'

    setTimeout(() => {
      if (document.visibilityState === 'visible') setBlockedAt(Date.now())
    }, 1200)
  }

  return (
    <section className="screen settings-screen">
      <ScreenHeader title="Settings" />

      <div className="settings-grid">
        <ConnectionCard mat={mat} />

        <SliderCard
          label="Sound volume"
          display={`${mat.volume}%`}
          hint="Use device buttons or drag the slider."
          value={mat.volume}
          onChange={mat.setVolume}
        />

        <SliderCard
          label="Light brightness"
          display={`${mat.brightness}%`}
          hint="Drag left for dimmer, right for brighter."
          value={mat.brightness}
          onChange={mat.setBrightness}
        />

        <button className="outline-button" onClick={openDeviceSettings}>
          Go to Device Settings
        </button>
      </div>

      {blockedAt !== null && (
        <p key={blockedAt} className="toast" role="status">
          Your browser blocked this. Open your device's Settings app manually.
        </p>
      )}
    </section>
  )
}

function ConnectionCard({ mat }) {
  let status = 'Not connected'
  let detail = 'Connect via Wi-Fi'
  let action = mat.connect
  let actionLabel = mat.connecting ? 'Connecting…' : 'Connect via Wi-Fi'

  if (mat.connected) {
    status = 'Connected'
    detail = mat.matId ?? 'Waiting for mat ID…'
    action = mat.disconnect
    actionLabel = 'Disconnect mat'
  } else if (mat.demoMode) {
    status = 'Demo Mode'
    detail = 'Controls update the app only'
    action = mat.toggleDemoMode
    actionLabel = 'Exit Demo Mode'
  }

  const demoLinkHidden = mat.connected || mat.demoMode

  return (
    <div className="card connection-card">
      <span className={`status-chip ${mat.connected ? 'connected' : ''}`}>
        {status}
      </span>

      <div className="connection-text">
        <h2>Smart Mat Connection</h2>
        <p className="connection-model">PU-2048</p>
        <p className="connection-id">{detail}</p>
      </div>

      <div className="connection-actions">
        <button
          className="primary-button"
          onClick={action}
          disabled={mat.connecting || mat.busy}
        >
          {actionLabel}
        </button>

        {/* Always takes up its space, so the yellow button never shifts */}
        <button
          className="text-button"
          onClick={mat.toggleDemoMode}
          disabled={mat.connecting || mat.busy || demoLinkHidden}
          style={demoLinkHidden ? { visibility: 'hidden' } : undefined}
          aria-hidden={demoLinkHidden}
          tabIndex={demoLinkHidden ? -1 : undefined}
        >
          Try Demo Mode
        </button>
      </div>
    </div>
  )
}

export default SettingsScreen
