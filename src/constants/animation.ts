/** Shared UI animation durations (ms) — keep in sync with `_tokens.scss`. */

/** Mobile form collapse, map sheet height reveal, paired layout transitions. */
export const MOBILE_FORM_COLLAPSE_MS = 420

/** Map sheet height reveal — synced with form collapse. */
export const MOBILE_MAP_SHEET_ENTRANCE_MS = MOBILE_FORM_COLLAPSE_MS

/** Default bottom-sheet height transition when not animating entrance/exit. */
export const MOBILE_SHEET_DEFAULT_TRANSITION_MS = 280

/** Results panel enter (opacity + transform). */
export const RESULTS_REVEAL_ENTER_MS = 400

/** Results panel leave (opacity + transform). */
export const RESULTS_REVEAL_LEAVE_MS = 280

/** Desktop-only delay before results panel enters. */
export const RESULTS_REVEAL_ENTER_DELAY_DESKTOP_MS = 350

/** TripForm edit button fade. */
export const FORM_FADE_MS = 250

/** TripForm summary row enter / leave. */
export const SUMMARY_FADE_ENTER_MS = 300
export const SUMMARY_FADE_LEAVE_MS = 200
export const SUMMARY_FADE_DELAY_MS = 250
