/*
 * Global, lightweight interaction effects.
 *
 *  • html.lite  — low-end device, data saver or reduced motion → expensive effects off
 *  • html.touch — no fine pointer (phones/tablets) → hover-only effects off
 *  • --gx/--gy/--sy on the .grid-glow layer drive the background grid glow (scoped there,
 *    not on <html>, so a mouse move never restyles the whole page)
 *  • --mx/--my on the hovered card drive the card spotlight (.card::after)
 *
 * One passive pointermove listener; an animation loop runs only while the lights are still
 * gliding toward the pointer, then stops (no work while the mouse is still).
 */
export function initEffects() {
  const root = document.documentElement
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const lowEnd = (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2 || nav.connection?.saveData === true
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches

  if (reduced || lowEnd) root.classList.add('lite')
  if (!fine) {
    root.classList.add('touch')
    return
  }
  if (reduced || lowEnd) return

  let x = 0 // pointer position (viewport)
  let y = 0
  let target: Element | null = null

  // Eased ("gliding") positions — each frame they move a fraction of the way to the pointer,
  // so the light trails smoothly behind the cursor instead of snapping to it.
  const EASE_CARD = 0.12
  const EASE_GRID = 0.16
  let gx = -999
  let gy = -999
  let card: HTMLElement | null = null
  let mx = 0 // eased position inside the current card
  let my = 0
  let running = false

  const glow = () => document.querySelector<HTMLElement>('.grid-glow')

  const frame = () => {
    let moving = false

    const g = glow()
    if (g) {
      gx += (x - gx) * EASE_GRID
      gy += (y - gy) * EASE_GRID
      g.style.setProperty('--gx', `${gx.toFixed(1)}px`)
      g.style.setProperty('--gy', `${gy.toFixed(1)}px`)
      g.style.setProperty('--sy', `${window.scrollY}px`)
      moving ||= Math.abs(x - gx) > 0.5 || Math.abs(y - gy) > 0.5
    }

    const next = target?.closest<HTMLElement>('.card, .card-dark, .spot') ?? null
    if (next) {
      const r = next.getBoundingClientRect()
      const tx = x - r.left
      const ty = y - r.top
      if (next !== card) {
        // entering a new card: start the light where the pointer came in (it then fades in)
        card = next
        mx = tx
        my = ty
      } else {
        mx += (tx - mx) * EASE_CARD
        my += (ty - my) * EASE_CARD
      }
      card.style.setProperty('--mx', `${mx.toFixed(1)}px`)
      card.style.setProperty('--my', `${my.toFixed(1)}px`)
      moving ||= Math.abs(tx - mx) > 0.5 || Math.abs(ty - my) > 0.5
    } else {
      card = null
    }

    if (moving) requestAnimationFrame(frame)
    else running = false
  }
  const schedule = () => {
    if (!running) {
      running = true
      requestAnimationFrame(frame)
    }
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX
      y = e.clientY
      target = e.target as Element
      root.classList.add('pointer-active')
      schedule()
    },
    { passive: true },
  )
  document.addEventListener('pointerleave', () => root.classList.remove('pointer-active'))
  window.addEventListener('scroll', schedule, { passive: true })
}
