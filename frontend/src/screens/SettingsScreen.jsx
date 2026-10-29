import { useState } from 'react'
import ScreenHeader from '../components/ScreenHeader.jsx'
import SliderCard from '../components/SliderCard.jsx'

// Personalization area
function SettingsScreen({ mat, play }) {
  const [showAppSettings, setShowAppSettings] = useState(false)

  if (showAppSettings) {
    return <AppSettings play={play} onBack={() => setShowAppSettings(false)} />
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

        <button
          className="outline-button"
          onClick={() => setShowAppSettings(true)}
        >
          Go to app settings
        </button>
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

function AppSettings({ play, onBack }) {
  const [cleared, setCleared] = useState(false)

  function clearData() {
    play.reset()
    setCleared(true)
  }

  return (
    <section className="screen settings-screen">
      <ScreenHeader title="App settings" />

      <button className="text-button back-button" onClick={onBack}>
        ← Back to Settings
      </button>

      <div className="settings-stack">
        <SliderCard
          label="Daily play goal"
          display={`${play.goalHours}h`}
          hint="Used for the hours played bar on Analytics."
          value={play.goalHours}
          min={0.5}
          max={8}
          step={0.5}
          onChange={play.setGoalHours}
        />

        <div className="card">
          <h2>Mat data</h2>
          <p className="card-note">
            Play time is saved only in this browser on this device.
          </p>
          <button className="outline-button" onClick={clearData}>
            {cleared ? 'Cleared' : "Clear today's play time"}
          </button>
        </div>
      </div>
    </section>
  )
}

export default SettingsScreen
