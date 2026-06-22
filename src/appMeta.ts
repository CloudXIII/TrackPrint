import pkg from '../package.json' with { type: 'json' }

/** Display name — bump version only in package.json. */
export const APP_NAME = 'TrackPrint'
export const APP_VERSION = pkg.version
export const NOMINATIM_USER_AGENT = `${APP_NAME}/${APP_VERSION}`
