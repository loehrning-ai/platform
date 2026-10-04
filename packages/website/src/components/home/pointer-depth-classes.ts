/**
 * Class names for cards inside a PointerDepthList (pointer-depth.tsx). They
 * live in a plain module, not the client one, so the server sections that
 * render the cards read the strings themselves rather than client references.
 */

/**
 * The card transform that reads the depth variables the list writes. Only
 * while hovered and only with motion allowed: a resting card keeps no 3D
 * transform (no extra layer, crisp text), and reduced motion never tilts.
 */
export const POINTER_DEPTH_CARD =
  "motion-safe:hover:[transform:perspective(60rem)_rotateX(var(--depth-rx,0deg))_rotateY(var(--depth-ry,0deg))]";
/**
 * A soft paper light under the pointer, behind the card's content: it sits
 * first in the card, so every positioned layer after it (picture, text)
 * paints above it and text contrast never drops.
 */
export const POINTER_DEPTH_LIGHT =
  "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 [background:radial-gradient(22rem_circle_at_var(--depth-x,50%)_var(--depth-y,0%),rgb(255_255_255/0.6),transparent_70%)] group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none";
