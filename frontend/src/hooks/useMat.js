import { useEffect, useRef, useState } from 'react'
import { loadJSON, saveJSON } from '../storage'

const SETTINGS_KEY = 'smartmat.matSettings'
const WIFI_KEY = 'smartmat.wifiIP'

function clampPercent(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)))
}

// Connection to the smart mat over WiFi via WebSocket.
// Commands are sent one per line; the mat reports back lines like "BAT:60".
export function useMat() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [error, setError] = useState('')
  const [powerOn, setPowerOn] = useState(false)

  const [volume, setVolumeState] = useState(
    () => loadJSON(SETTINGS_KEY, {}).volume ?? 60
  )
  const [brightness, setBrightnessState] = useState(
    () => loadJSON(SETTINGS_KEY, {}).brightness ?? 80
  )

  // Reported by the mat
  const [matModel, setMatModel] = useState(null)
  const [battery, setBattery] = useState(null)
  const [playing, setPlaying] = useState(false)

  const wsRef = useRef(null)
  const readBufferRef = useRef('')

  useEffect(() => {
    saveJSON(SETTINGS_KEY, { volume, brightness })
  }, [volume, brightness])

  function resetMatState() {
    setPowerOn(false)
    setConnected(false)
    setMatModel(null)
    setBattery(null)
    setPlaying(false)
  }

  // Send one command line (no-op in Demo Mode or when disconnected)
  function send(command) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    try {
      wsRef.current.send(command + '\n')
    } catch (err) {
      console.error(err)
      setError('Failed to send command to the mat.')
    }
  }

  // Handle one line reported by the mat
  function handleLine(line) {
    const [key, value] = line.split(':')

    switch (key) {
      case 'MODEL':
        setMatModel(value)
        break
      case 'POWER':
        setPowerOn(value === '1')
        break
      case 'BAT':
        setBattery(clampPercent(value))
        break
      case 'VOL':
        setVolumeState(clampPercent(value))
        break
      case 'PLAY':
        setPlaying(value === '1')
        break
    }
  }

  // Close the WebSocket connection
  function closeWebSocket() {
    try {
      if (wsRef.current) {
        wsRef.current.close()
      }
    } catch (err) {
      console.error(err)
    } finally {
      wsRef.current = null
      readBufferRef.current = ''
    }
  }

  // Handle incoming WebSocket messages
  function handleWebSocketMessage(data) {
    readBufferRef.current += data
    const lines = readBufferRef.current.split('\n')
    readBufferRef.current = lines.pop()
    lines.forEach(line => handleLine(line.trim()))
  }

  // Connect the mat using WiFi WebSocket
  async function connect() {
    setConnecting(true)
    setError('')

    let ipAddress = loadJSON(WIFI_KEY, {}).ip || ''
    ipAddress = prompt('Enter the mat\'s IP address or hostname:', ipAddress)

    if (!ipAddress) {
      setConnecting(false)
      return
    }

    try {
      // Save the IP for next time
      saveJSON(WIFI_KEY, { ip: ipAddress })

      // Construct WebSocket URL
      const wsURL = `ws://${ipAddress}:8080`
      wsRef.current = new WebSocket(wsURL)

      wsRef.current.onopen = () => {
        // Send the saved settings, then ask the mat to report itself
        // (including whether it is on)
        send(`V${volume}`)
        send(`B${brightness}`)
        send('?')

        setPowerOn(false)
        setDemoMode(false)
        setConnected(true)
      }

      wsRef.current.onmessage = (event) => {
        handleWebSocketMessage(event.data)
      }

      wsRef.current.onerror = () => {
        setError('Could not connect to the mat. Check the IP address and try again.')
      }

      wsRef.current.onclose = () => {
        resetMatState()
        setError('The mat was disconnected.')
      }

      // Timeout if connection takes too long
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            reject(new Error('Connection timeout'))
          } else {
            resolve()
          }
        }, 5000)

        const checkConnection = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection)
            clearTimeout(timeout)
            resolve()
          }
        }, 100)
      })

    } catch (err) {
      console.error(err)
      setError('Could not connect to the mat. Check the IP address and try again.')
      closeWebSocket()
      resetMatState()
    } finally {
      setConnecting(false)
    }
  }

  // Disconnect the mat
  function disconnect() {
    setBusy(true)
    setError('')

    send('X')
    closeWebSocket()
    resetMatState()

    setBusy(false)
  }

  // Toggle Demo Mode
  function toggleDemoMode() {
    if (connected || busy || connecting) return

    setDemoMode(!demoMode)
    setPowerOn(false)
    setError('')
  }

  // Mat actions

  function flashLights() {
    send('F')
  }

  function turnCalmOn() {
    send('C1')
  }

  function turnCalmOff() {
    send('C0')
  }

  function playSound() {
    send('S')
  }

  function playWhistle() {
    send('W')
  }

  function playPraise() {
    send('P')
  }

  // The mat keeps its own on/off state and reports it back as POWER. While
  // it is off it ignores buttons and pads. Turning it on doesn't light anything
  // (the lights are off by default); turning it off switches everything off.
  function togglePower() {
    send(powerOn ? 'O0' : 'O1')
    setPowerOn(!powerOn)
  }

  function dismissError() {
    setError('')
  }

  function setVolume(value) {
    setVolumeState(value)
    send(`V${value}`)
  }

  function setBrightness(value) {
    setBrightnessState(value)
    send(`B${value}`)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeWebSocket()
    }
  }, [])

  return {
    connected,
    connecting,
    busy,
    demoMode,
    live: connected || demoMode,
    error,
    dismissError,
    powerOn,
    volume,
    brightness,
    matModel,
    battery,
    playing,
    connect,
    disconnect,
    toggleDemoMode,
    flashLights,
    turnCalmOn,
    turnCalmOff,
    playSound,
    playWhistle,
    playPraise,
    togglePower,
    setVolume,
    setBrightness,
  }
}
