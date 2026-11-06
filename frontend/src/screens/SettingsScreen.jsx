import ScreenHeader from '../components/ScreenHeader.jsx'
import SliderCard from '../components/SliderCard.jsx'
import Toast from '../components/Toast.jsx'
import { useToast } from '../hooks/useToast.js'

// Shown until the connected mat reports its own model
const DEFAULT_MODEL = 'PU-2101'

// Personalization area
function SettingsScreen({ mat }) {
  const [blockedAt, showBlocked] = useToast()

  // Only Android Chrome can open system settings from a web page, so on iPhone
  // and desktop browsers the notice shows right away. On Android, try the
  // deep link and show the notice if the page is still visible afterwards.
  function openDeviceSettings() {
    if (!/Android/i.test(navigator.userAgent)) {
      showBlocked()
      return
    }

    window.location.href = 'intent://settings#Intent;action=android.settings.SETTINGS;end'

    setTimeout(() => {
      if (document.visibilityState === 'visible') showBlocked()
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

      <Toast shownAt={blockedAt}>
        Your browser blocked this. Open your device's Settings app manually.
      </Toast>
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
    detail = 'Connected over Wi-Fi'
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
        <p className="connection-model">{mat.matModel ?? DEFAULT_MODEL}</p>
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
