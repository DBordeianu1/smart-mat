import { useEffect, useRef, useState } from 'react'
import { loadJSON, saveJSON } from '../storage'

const SETTINGS_KEY = 'pawunit.matSettings'
const WIFI_KEY = 'pawunit.wifiIP'

function clampPercent(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)))
}

// Connection to the Paw Unit mat over WiFi via WebSocket.
// Commands are sent one per line; the mat reports back lines like "BAT:60".
export function useMat() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [error, setError] = useState('')

  const [lightsOn, setLightsOn] = useState(false)
  const [calmOn, setCalmOn] = useState(false)
  const [volume, setVolumeState] = useState(
    () => loadJSON(SETTINGS_KEY, {}).volume ?? 60
  )
  const [brightness, setBrightnessState] = useState(
    () => loadJSON(SETTINGS_KEY, {}).brightness ?? 80
  )

  // Reported by the mat
  const [matId, setMatId] = useState(null)
  const [battery, setBattery] = useState(null)
  const [playing, setPlaying] = useState(false)

  const wsRef = useRef(null)
  const readBufferRef = useRef('')

  useEffect(() => {
    saveJSON(SETTINGS_KEY, { volume, brightness })
  }, [volume, brightness])

  function resetMatState() {
    setConnected(false)
    setLightsOn(false)
    setCalmOn(false)
    setMatId(null)
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
      case 'ID':
        setMatId(value)
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
        // Start from a known state, then ask the mat to report itself
        send('X')
        send(`V${volume}`)
        send(`B${brightness}`)
        send('?')

        setDemoMode(false)
        setLightsOn(false)
        setCalmOn(false)
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
    setLightsOn(false)
    setCalmOn(false)
    setError('')
  }

  // Mat actions

  function toggleLights() {
    const next = !lightsOn
    setLightsOn(next)
    send(`L${next ? 1 : 0}`)
  }

  function toggleCalm() {
    const next = !calmOn
    setCalmOn(next)
    send(`C${next ? 1 : 0}`)
  }

  function playSound() {
    send('S')
  }

  function playWhistle() {
    send('W')
  }

  function releaseTreat() {
    send('T')
  }

  function allOff() {
    setLightsOn(false)
    setCalmOn(false)
    send('X')
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
    lightsOn,
    calmOn,
    volume,
    brightness,
    matId,
    battery,
    playing,
    connect,
    disconnect,
    toggleDemoMode,
    toggleLights,
    toggleCalm,
    playSound,
    playWhistle,
    releaseTreat,
    allOff,
    setVolume,
    setBrightness,
  }
}
