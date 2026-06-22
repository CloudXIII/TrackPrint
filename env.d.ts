/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAP_PROVIDER?: string
  readonly VITE_ROUTING_PROVIDER?: string
  readonly VITE_GEOCODING_PROVIDER?: string
  readonly VITE_GOOGLE_MAPS_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

/** Google Maps JS API — loaded at runtime via loader.ts */
declare const google: { maps: Record<string, unknown> } | undefined
