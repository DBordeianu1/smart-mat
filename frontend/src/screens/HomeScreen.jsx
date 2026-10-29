import { useEffect, useRef, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader.jsx'
import {
  CalmIcon,
  PowerIcon,
  SoundIcon,
  SunIcon,
  TreatIcon,
  WhistleIcon,
} from '../components/Icons.jsx'

// The mat's control plane
function HomeScreen({ mat }) {
  const [sent, setSent] = useState(null)
  const sentTimer = useRef(null)

  useEffect(() => () => clearTimeout(sentTimer.current), [])

  // Briefly confirm one-shot actions on their card
  function runOnce(id, action) {
    action()
    setSent(id)
    clearTimeout(sentTimer.current)
    sentTimer.current = setTimeout(() => setSent(null), 1500)
  }

  const actions = [
    {
      id: 'lights',
      label: 'Lights',
      icon: <SunIcon />,
      description: mat.lightsOn ? 'Turn mat lights off' : 'Turn mat lights on',
      pressed: mat.lightsOn,
      onClick: mat.toggleLights,
    },
    {
      id: 'sound',
      label: 'Sound',
      icon: <SoundIcon />,
      description: 'Play a friendly sound',
      done: 'Playing sound…',
      onClick: mat.playSound,
    },
    {
      id: 'treat',
      label: 'Treat',
      icon: <TreatIcon />,
      description: 'Release one treat',
      done: 'Treat released!',
      onClick: mat.releaseTreat,
    },
    {
      id: 'calm',
      label: 'Calm mode',
      icon: <CalmIcon />,
      description: mat.calmOn ? 'Back to normal' : 'Dim lights and audio',
      pressed: mat.calmOn,
      onClick: mat.toggleCalm,
    },
    {
      id: 'whistle',
      label: 'Whistle',
      icon: <WhistleIcon />,
      description: 'Play recall whistle',
      done: 'Whistling…',
      onClick: mat.playWhistle,
    },
    {
      id: 'all-off',
      label: 'All off',
      icon: <PowerIcon />,
      description: 'Stop every mat feature',
      done: 'Everything is off',
      onClick: mat.allOff,
    },
  ]

  return (
    <section className="screen home-screen">
      <div className="watermark" aria-hidden="true">
        <span>The Paw</span>
        <span>Unit</span>
        <span>The Paw</span>
      </div>

      <ScreenHeader title="Home">
        <ConnectionPill mat={mat} />
      </ScreenHeader>

      {!mat.live && (
        <p className="hint">
          Connect the mat or try Demo Mode in Settings to use these controls.
        </p>
      )}

      <div className="action-grid">
        {actions.map(action => (
          <button
            key={action.id}
            className={`action-card ${action.pressed ? 'active' : ''}`}
            aria-pressed={action.pressed}
            disabled={!mat.live}
            onClick={() =>
              action.done ? runOnce(action.id, action.onClick) : action.onClick()
            }
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
            <span className="action-description" aria-live="polite">
              {sent === action.id ? action.done : action.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function ConnectionPill({ mat }) {
  if (mat.connected) {
    return <span className="pill pill-connected">Connected</span>
  }

  if (mat.demoMode) {
    return <span className="pill pill-demo">Demo Mode</span>
  }

  return (
    <button
      className="pill pill-connect"
      onClick={mat.connect}
      disabled={mat.connecting}
    >
      {mat.connecting ? 'Connecting…' : 'Connect mat'}
    </button>
  )
}

export default HomeScreen
