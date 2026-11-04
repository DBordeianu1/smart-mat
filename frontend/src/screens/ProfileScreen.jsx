import ScreenHeader from '../components/ScreenHeader.jsx'
import SliderCard from '../components/SliderCard.jsx'

// In-app preferences
function ProfileScreen({ play }) {
  return (
    <section className="screen settings-screen">
      <ScreenHeader title="Profile" />

      <div className="settings-stack">
        <SliderCard
          label="Daily play goal"
          display={`${play.goalHours} h`}
          hint="Used for the hours played bar on Analytics."
          value={play.goalHours}
          min={0.5}
          max={8}
          step={0.5}
          onChange={play.setGoalHours}
        />
      </div>
    </section>
  )
}

export default ProfileScreen
