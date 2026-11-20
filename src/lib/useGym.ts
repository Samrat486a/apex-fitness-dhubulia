import { useEffect, useState } from 'react'
import type { GymInfo } from '../types'
import { api } from './api'

const FALLBACK: GymInfo = {
  name: 'Apex Fitness',
  tagline: 'Train Strong. Live Stronger.',
  address: 'Saratpally, Dhubulia, Dwipchandrapur, Nadia, West Bengal 741139',
  phone: '+91 86170 96552',
  whatsapp: '+91 93822 66803',
  email: '',
  hoursWeekdays: '5:00 AM – 10:00 PM',
  hoursWeekends: '6:00 AM – 8:00 PM',
  mapUrl: 'https://www.google.com/maps/place/Apex+Fitness/@23.4881324,88.4374046,18z/data=!4m6!3m5!1s0x39f919488fe53249:0xfa7af03e705a74d2!8m2!3d23.4881324!4d88.4374046!16s%2Fg%2F11zynl4_0b',
  mapQuery: 'Apex Fitness, Dhubulia',
}

let cached: GymInfo | null = null
let inflight: Promise<GymInfo> | null = null

/** Gym contact details & hours from /admin settings (cached for the session). */
export function useGym(): GymInfo {
  const [gym, setGym] = useState<GymInfo>(cached ?? FALLBACK)
  useEffect(() => {
    if (cached) return
    inflight ??= api.gym().then((r) => (cached = r.data.gym)).catch(() => FALLBACK)
    let alive = true
    inflight.then((g) => alive && setGym(g))
    return () => {
      alive = false
    }
  }, [])
  return gym
}

/** Forget the cached details (after an admin saves Settings) so the site shows the new values. */
export function invalidateGym() {
  cached = null
  inflight = null
}

export const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`
export const waHref = (p: string, text = '') => `https://wa.me/${p.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`
