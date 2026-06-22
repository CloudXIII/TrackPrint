/** Layout breakpoints and dimensions (px) — keep in sync with `_tokens.scss`. */

export const TABLET_BREAKPOINT_PX = 768

/** Media query for desktop layout (matches `$bp-tablet`). */
export const DESKTOP_BREAKPOINT = `(min-width: ${TABLET_BREAKPOINT_PX}px)`

export const LAYOUT_MAX_WIDTH_PX = 1160
export const PANEL_COL_WIDTH_TABLET_PX = 500
export const PANEL_COL_WIDTH_DESKTOP_PX = 520
export const MAP_PANEL_MIN_HEIGHT_PX = 240
export const FORM_BODY_MAX_HEIGHT_PX = 960

/** Mobile map sheet snap heights (fraction of the shell below the header). */
export const MOBILE_MAP_SHEET_PEEK = 0.08
export const MOBILE_MAP_SHEET_FULL = 0.90

/** Handle + a visible blurred map strip when results are shown. */
export const MOBILE_MAP_SHEET_PEEK_RESULTS_PX = 68
export const MOBILE_MAP_SHEET_MIN_HEIGHT_PX = 44

/** Pointer movement below this (px) counts as a tap, not a drag. */
export const MOBILE_SHEET_TAP_THRESHOLD_PX = 8

/** Inject key — mobile bottom sheet context for embedded route maps. */
export const MOBILE_MAP_SHEET_CONTEXT_KEY = Symbol('mobileMapSheetContext')
