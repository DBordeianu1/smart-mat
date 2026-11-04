import { useState } from 'react'
import ScreenHeader from '../components/ScreenHeader.jsx'
import SliderCard from '../components/SliderCard.jsx'

// Personalization area
function SettingsScreen({ mat }) {
  const [settingsBlocked, setSettingsBlocked] = useState(false)

  // Browsers can't open system settings directly. Try the platform deep link,
  // and if the page is still visible afterwards, show a hint instead.
  function openDeviceSettings() {
    const ua = navigator.userAgent
    setSettingsBlocked(false)

    if (/Android/i.test(ua)) {
      window.location.href = 'intent://settings#Intent;action=android.settings.SETTINGS;end'
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      window.location.href = 'App-Prefs:'
    }

    setTimeout(() => {
      if (document.visibilityState === 'visible') setSettingsBlocked(true)
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
          Go to app settings
        </button>

        {settingsBlocked && (
          <p className="hint" role="status">
            Your browser blocked this. Open your device's Settings app manually.
          </p>
        )}
      </div>
    </section>
  )
}

function ConnectionCard({ mat }) {
  let status = 'Not connected'
  let detail = 'Connect via WiFi'
  let action = mat.connect
  let actionLabel = mat.connecting ? 'Connecting…' : 'Connect via WiFi'

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

  return (
    <div className="card connection-card">
      <span className={`status-chip ${mat.connected ? 'connected' : ''}`}>
        {status}
      </span>

      <div className="connection-text">
        <h2>Paw Unit connection</h2>
        <p className="connection-model">WiFi</p>
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

        {!mat.connected && !mat.demoMode && (
          <button
            className="text-button"
            onClick={mat.toggleDemoMode}
            disabled={mat.connecting || mat.busy}
          >
            Try Demo Mode
          </button>
        )}
      </div>
    </div>
  )
}

export default SettingsScreen
