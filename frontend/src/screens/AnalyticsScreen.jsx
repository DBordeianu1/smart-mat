import ScreenHeader from '../components/ScreenHeader.jsx'
import { InfoIcon } from '../components/Icons.jsx'

const MAX_DEVICES = 10

// Sample values shown in Demo Mode
const DEMO_STATS = { devices: 1, battery: 60, hours: 1.5 }

function formatHours(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  return `${Number(hours.toFixed(1))}h`
}

function batteryNote(battery) {
  if (battery > 60) return 'Plenty of power left!'
  if (battery >= 30) return 'There is still some juice left!'
  return 'Time to charge the mat soon.'
}

function playNote(hours, goal) {
  if (hours >= goal) return 'Daily play goal reached. Good dog!'
  if (hours >= goal / 2) return 'A little more play time left to reach your set goal!'
  return 'Plenty of play time left to reach your set goal.'
}

// A dashboard to visualize the dog mat data
function AnalyticsScreen({ mat, play }) {
  const devices = mat.demoMode ? DEMO_STATS.devices : mat.connected ? 1 : 0
  const battery = mat.demoMode ? DEMO_STATS.battery : mat.battery
  const hours = mat.demoMode ? DEMO_STATS.hours : play.hoursToday

  let batteryValue = '—'
  let batteryText = 'Connect the mat to see its battery.'

  if (battery !== null) {
    batteryValue = `${battery}%`
    batteryText = batteryNote(battery)
  } else if (mat.connected) {
    batteryText = "The mat isn't reporting its battery."
  }

  return (
    <section className="screen analytics-screen">
      <ScreenHeader title="Data Analytics" />

      <p className="info-banner">
        <InfoIcon />
        {mat.demoMode
          ? 'Demo Mode: showing sample data.'
          : 'Your mat data stays on this device.'}
      </p>

      <div className="stat-grid">
        <StatCard
          value={devices}
          label="Current connected devices"
          note={
            devices
              ? `You have room for ${MAX_DEVICES - devices} more!`
              : 'No mat connected right now.'
          }
          percent={(devices / MAX_DEVICES) * 100}
        />

        <StatCard
          value={batteryValue}
          label="Battery level"
          note={batteryText}
          percent={battery ?? 0}
        />

        <StatCard
          value={formatHours(hours)}
          label="Hours played today"
          note={playNote(hours, play.goalHours)}
          percent={(hours / play.goalHours) * 100}
        />
      </div>
    </section>
  )
}

function StatCard({ value, label, note, percent }) {
  const width = Math.min(100, Math.max(0, percent))

  return (
    <div className="card stat-card">
      <span className="stat-value">{value}</span>
      <h2 className="stat-label">{label}</h2>
      <p className="card-note stat-note">{note}</p>
      <div
        className="meter"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
      >
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export default AnalyticsScreen
