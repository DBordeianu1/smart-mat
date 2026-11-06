import { useEffect, useState } from 'react'
import ErrorBanner from './components/ErrorBanner.jsx'
import TabBar from './components/TabBar.jsx'
import { useMat } from './hooks/useMat.js'
import { usePlayTime } from './hooks/usePlayTime.js'
import AnalyticsScreen from './screens/AnalyticsScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import './App.css'

const APP_NAME = 'Your Smart Mat'

// Browser tab title for each screen
const PAGE_TITLES = {
  settings: 'Settings',
  home: 'Home',
  analytics: 'Data Analytics',
  profile: 'Profile',
}

function App() {
  const [tab, setTab] = useState('home')

  useEffect(() => {
    document.title = `${PAGE_TITLES[tab]} | ${APP_NAME}`
  }, [tab])

  const mat = useMat()
  const play = usePlayTime(mat.playing)

  return (
    <div className="app">

      <main className="app-main">
        {tab === 'home' && <HomeScreen mat={mat} />}
        {tab === 'settings' && <SettingsScreen mat={mat} />}
        {tab === 'analytics' && <AnalyticsScreen mat={mat} play={play} />}
        {tab === 'profile' && <ProfileScreen play={play} />}
      </main>

      <ErrorBanner message={mat.error} onDismiss={mat.dismissError} />

      <TabBar current={tab} onChange={setTab} />

    </div>
  )
}

export default App
