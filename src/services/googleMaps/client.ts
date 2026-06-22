/**
 * Client for Google Maps Platform (New) REST APIs.
 * Proxied via Vite / vercel.json to avoid browser CORS restrictions.
 */

interface GoogleErrorResponse {
  error?: { message?: string }
  error_message?: string
  status?: string
}

function getApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) {
    throw new Error('VITE_GOOGLE_MAPS_KEY is required when using Google Maps providers')
  }
  return key
}

function parseGoogleError(data: GoogleErrorResponse): string {
  const message = data?.error?.message
    ?? data?.error_message
    ?? data?.status
  return message || 'Google Maps request failed'
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json() as T & GoogleErrorResponse

  if (!response.ok) {
    throw new Error(parseGoogleError(data))
  }

  const status = (data as GoogleErrorResponse).status
  if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
    throw new Error(parseGoogleError(data))
  }

  return data
}

/** Routes API — POST computeRoutes */
export async function googleRoutesFetch<T>(
  path: string,
  body: unknown,
  fieldMask: string,
): Promise<T> {
  const response = await fetch(`/api/google-routes/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getApiKey(),
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  })

  return parseResponse<T>(response)
}

/** Places API (New) — POST endpoints */
export async function googlePlacesPost<T>(
  path: string,
  body: unknown,
  fieldMask?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': getApiKey(),
  }

  if (fieldMask) {
    headers['X-Goog-FieldMask'] = fieldMask
  }

  const response = await fetch(`/api/google-places/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  return parseResponse<T>(response)
}

/** Places API (New) — GET place details */
export async function googlePlacesGet<T>(
  path: string,
  fieldMask: string,
  queryParams: Record<string, string> = {},
): Promise<T> {
  const params = new URLSearchParams(queryParams)
  const query = params.toString()
  const url = `/api/google-places/${path}${query ? `?${query}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getApiKey(),
      'X-Goog-FieldMask': fieldMask,
    },
  })

  return parseResponse<T>(response)
}

export function parseDurationSeconds(duration: string | number | undefined): number {
  if (typeof duration === 'string' && duration.endsWith('s')) {
    return parseInt(duration.slice(0, -1), 10)
  }
  return Number(duration) || 0
}
