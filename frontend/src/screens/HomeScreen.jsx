import { useEffect, useRef, useState } from 'react'
import InfoBanner from '../components/InfoBanner.jsx'
import ScreenHeader from '../components/ScreenHeader.jsx'
import Toast from '../components/Toast.jsx'
import {
  CalmIcon,
  PraiseIcon,
  SoundIcon,
  SunIcon,
  WhistleIcon,
  ZapIcon,
} from '../components/Icons.jsx'
import { useToast } from '../hooks/useToast.js'

// The mat's control plane
function HomeScreen({ mat }) {
  const [sent, setSent] = useState(null)
  const sentTimer = useRef(null)
  const [offAt, showOff] = useToast()

  useEffect(() => () => clearTimeout(sentTimer.current), [])

  // Briefly confirm one-shot actions on their card. While the mat is off,
  // nothing is sent and a popup says to turn it on first.
  function runOnce(id, action) {
    if (!mat.powerOn) {
      showOff()
      return
    }

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
      description: 'Flash the mat lights',
      done: 'Lights flashed',
      onClick: mat.flashLights,
    },
    {
      id: 'calm-mode',
      label: 'Calm mode',
      icon: <CalmIcon />,
      description: 'Dimmer lights, quieter sounds',
      done: 'Calm mode on',
      onClick: mat.turnCalmOn,
    },
    {
      id: 'calm-mode-off',
      label: 'Calm mode off',
      icon: <ZapIcon />,
      description: 'End calm mode',
      done: 'Calm mode ended',
      onClick: mat.turnCalmOff,
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
      id: 'praise',
      label: 'Praise',
      icon: <PraiseIcon />,
      description: 'Play a tune',
      done: 'Good dog!',
      onClick: mat.playPraise,
    },
    {
      id: 'whistle',
      label: 'Whistle',
      icon: <WhistleIcon />,
      description: 'Play recall whistle',
      done: 'Whistling…',
      onClick: mat.playWhistle,
    },
  ]

  return (
    <section className="screen home-screen">
      <img
        className="home-background"
        src="/faded-logo-light.png"
        alt=""
        aria-hidden="true"
      />

      <ScreenHeader title="Home">
        <div className="header-pills">
          <button
            className={`pill pill-power ${mat.powerOn ? 'pill-power-off' : 'pill-power-on'}`}
            disabled={!mat.live}
            onClick={mat.togglePower}
          >
            {mat.powerOn ? 'Turn Off' : 'Turn On'}
          </button>
          <ConnectionPill mat={mat} />
        </div>
      </ScreenHeader>

      {!mat.live && (
        <InfoBanner id="connect">
          Connect the mat or try Demo Mode in Settings to use these controls.
        </InfoBanner>
      )}

      <div className="action-grid">
        {actions.map(action => (
          <button
            key={action.id}
            className="action-card"
            disabled={!mat.live}
            onClick={() => runOnce(action.id, action.onClick)}
          >
            <span className="action-icon-area">
              <span className="action-icon">{action.icon}</span>
            </span>
            <span className="action-label">{action.label}</span>
            <span className="action-description" aria-live="polite">
              {sent === action.id ? action.done : action.description}
            </span>
          </button>
        ))}
      </div>

      <Toast shownAt={offAt}>The mat is off, turn it on</Toast>
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
