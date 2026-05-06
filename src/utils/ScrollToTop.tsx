import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets scroll to (0,0) on every route transition.
 * Place this as the first child inside <HashRouter>.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    // Only reset when navigating to a new route, not an in-page anchor
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
