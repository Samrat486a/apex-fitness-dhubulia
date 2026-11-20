import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

/** Scrolls to the top on page change, or to #hash targets. */
export function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])
  return null
}

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-grid">
      {/* Cyan grid lines that light up around the cursor (desktop only, see lib/effects.ts) */}
      <div className="grid-glow" aria-hidden />
      <Navbar />
      <main className="relative z-[1] flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
