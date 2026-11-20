import { useCallback, useEffect, useRef, useState } from 'react'

/** Loads data with loading/error state; `reload()` refetches, `setData` allows optimistic updates. */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const seq = useRef(0)

  const run = useCallback(() => {
    const id = ++seq.current
    setLoading(true)
    setError(null)
    loader()
      .then((d) => id === seq.current && setData(d))
      .catch((e: unknown) => id === seq.current && setError(e instanceof Error ? e.message : 'Something went wrong.'))
      .finally(() => id === seq.current && setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(run, [run])
  return { data, setData, error, loading, reload: run }
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Apex Fitness` : 'Apex Fitness — Train Strong. Live Stronger.'
  }, [title])
}

/**
 * Adds .is-visible to every .reveal element inside the ref when it scrolls into view —
 * including elements rendered later (e.g. cards that appear after data loads).
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const pending = () => root.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)')
    if (!('IntersectionObserver' in window)) {
      pending().forEach((el) => el.classList.add('is-visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement
            el.classList.add('is-visible')
            io.unobserve(el)
            // Once it has appeared, drop the stagger delay so hover effects respond evenly.
            window.setTimeout(() => el.style.setProperty('--reveal-delay', '0ms'), 1400)
          }
        }
      },
      { rootMargin: '0px 0px 40px 0px', threshold: 0 },
    )
    const observeAll = () => pending().forEach((el) => io.observe(el))
    observeAll()
    const mo = new MutationObserver(observeAll)
    mo.observe(root, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
  return ref
}

/** Animated number that counts up once visible. */
export function useCountUp(target: number, duration = 1400) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const start = () => {
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        start()
        io.disconnect()
      }
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [target, duration])
  return { ref, value }
}

export function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

/** Locks page scroll while `active` (mobile menu, modals). */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}
