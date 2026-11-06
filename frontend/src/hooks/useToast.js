import { useEffect, useState } from 'react'

// Popup notice that goes away on its own. Calling show() again restarts it.
export function useToast(durationMs = 4000) {
  const [shownAt, setShownAt] = useState(null)

  useEffect(() => {
    if (shownAt === null) return
    const timer = setTimeout(() => setShownAt(null), durationMs)
    return () => clearTimeout(timer)
  }, [shownAt, durationMs])

  return [shownAt, () => setShownAt(Date.now())]
}
