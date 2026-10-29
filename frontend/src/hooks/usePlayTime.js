import { useEffect, useState } from 'react'
import { loadJSON, saveJSON } from '../storage'

const PLAY_KEY = 'pawunit.playTime'
const GOAL_KEY = 'pawunit.playGoalHours'

// Local date as YYYY-MM-DD
function today() {
  return new Date().toLocaleDateString('en-CA')
}

// Tracks how long the dog has been on the mat today, saved in this browser only
export function usePlayTime(playing) {
  const [record, setRecord] = useState(() => {
    const saved = loadJSON(PLAY_KEY, null)
    return saved?.date === today() ? saved : { date: today(), seconds: 0 }
  })
  const [goalHours, setGoalHours] = useState(() => loadJSON(GOAL_KEY, 2))

  useEffect(() => {
    saveJSON(PLAY_KEY, record)
  }, [record])

  useEffect(() => {
    saveJSON(GOAL_KEY, goalHours)
  }, [goalHours])

  // Add elapsed time while the mat reports the dog is playing
  useEffect(() => {
    if (!playing) return

    let last = Date.now()

    function tick() {
      const now = Date.now()
      const elapsed = (now - last) / 1000
      last = now

      setRecord(prev => {
        const date = today()
        return prev.date === date
          ? { date, seconds: prev.seconds + elapsed }
          : { date, seconds: elapsed }
      })
    }

    const id = setInterval(tick, 5000)

    return () => {
      clearInterval(id)
      tick()
    }
  }, [playing])

  function reset() {
    setRecord({ date: today(), seconds: 0 })
  }

  return {
    hoursToday: record.date === today() ? record.seconds / 3600 : 0,
    goalHours,
    setGoalHours,
    reset,
  }
}
