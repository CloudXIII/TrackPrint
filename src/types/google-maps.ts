export type GoogleLatLng = { lat: number; lng: number }

export interface GoogleMapOverlay {
  setMap(map: GoogleMapInstance | null): void
}

export interface GooglePolyline extends GoogleMapOverlay {
  getPath(): { forEach: (fn: (latLng: unknown) => void) => void }
}

export interface GoogleMapOptions {
  styles?: readonly unknown[]
  gestureHandling?: string
  draggable?: boolean
  scrollwheel?: boolean
  disableDoubleClickZoom?: boolean
}

export interface GoogleMapInstance {
  setCenter(center: GoogleLatLng): void
  setZoom(zoom: number): void
  setOptions(options: GoogleMapOptions): void
  fitBounds(bounds: unknown, padding: { top: number; right: number; bottom: number; left: number }): void
}

export type GoogleMapsApi = Record<string, new (...args: unknown[]) => unknown> & Record<string, unknown>
