import type { GymInfo } from '../types'

/** Keyless Google Maps embed for a place name, address or "lat, lng". */
export function mapEmbedUrl(gym: GymInfo, zoom = 15): string {
  const q = (gym.mapQuery || gym.address || 'Dhubulia, Nadia, West Bengal').trim()
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`
}

/** Opens Google Maps with directions to the gym (uses the link from Admin → Settings when set). */
export function directionsUrl(gym: GymInfo): string {
  if (gym.mapUrl) return gym.mapUrl
  const q = (gym.mapQuery || gym.address).trim()
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
}
