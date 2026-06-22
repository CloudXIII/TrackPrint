/** Subtle dark basemap tuned to match the app palette. */
export const GOOGLE_MAP_DARK_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a2420' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8fa89a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2420' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3530' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1f2925' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1714' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
] as const
