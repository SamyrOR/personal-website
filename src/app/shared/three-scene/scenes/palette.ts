// Fixed illustration palette (mirrors the flat-illustration SVGs it
// replaces) — intentionally not tied to the site's light/dark theme tokens,
// same as the SVGs never re-colored themselves per theme either.
export const palette = {
  clothingDark: 0x2f3142,
  clothingLight: 0xf4f6fb,
  accentBlue: 0x2f6fed,
  accentBluePale: 0x8fc7ff,
  accentRed: 0xef5b5b,
  gray: 0xc9d0da,
  grayDark: 0x9aa5b5,
  paper: 0xf4f6fb,
  /** A soft dark tone for grounding contact shadows beneath floating props. */
  shadow: 0x1a1c26,
  /** The tech scene's code-window title bar — a touch darker than clothingDark for depth. */
  windowTitleBar: 0x23253a,
  /**
   * A lighter stand-in for clothingDark on the hero laptop and tech
   * terminal bodies specifically, swapped in only in dark theme so those two
   * centerpieces stay a shade lighter than the page background instead of
   * nearly disappearing into it. Every other color in this palette stays
   * fixed across themes by design — this is a deliberate, narrow exception.
   */
  clothingDarkOnDark: 0x4a4f6b,
  /** windowTitleBar's counterpart for dark theme, kept the same amount darker than clothingDarkOnDark. */
  windowTitleBarOnDark: 0x3d4260,
  white: 0xffffff,
} as const;
