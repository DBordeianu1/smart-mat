import { useState } from 'react'
import TabBar from './components/TabBar.jsx'
import { useMat } from './hooks/useMat.js'
import { usePlayTime } from './hooks/usePlayTime.js'
import AnalyticsScreen from './screens/AnalyticsScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import './App.css'

function App() {
  const [tab, setTab] = useState('home')

  const mat = useMat()
  const play = usePlayTime(mat.playing)

  return (
    <div className="app">

      <main className="app-main">
        {tab === 'home' && <HomeScreen mat={mat} />}
        {tab === 'settings' && <SettingsScreen mat={mat} play={play} />}
        {tab === 'analytics' && <AnalyticsScreen mat={mat} play={play} />}

        {mat.error && (
          <p className="error-message" role="alert">
            {mat.error}
          </p>
        )}
      </main>

      <TabBar current={tab} onChange={setTab} />

    </div>
  )
}

export default App
