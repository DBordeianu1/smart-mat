import { useState } from 'react'
import ScreenHeader from '../components/ScreenHeader.jsx'
import SliderCard from '../components/SliderCard.jsx'

// In-app preferences and saved data
function ProfileScreen({ play }) {
  const [cleared, setCleared] = useState(false)

  function clearData() {
    play.reset()
    setCleared(true)
  }

  return (
    <section className="screen settings-screen">
      <ScreenHeader title="Profile" />

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

export default ProfileScreen
