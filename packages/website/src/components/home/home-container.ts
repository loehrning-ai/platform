/**
 * The home sections' Werkzeichnung measure and gutter (the footer's and
 * /ueber-mich's): 16px on a phone, 24px from sm, content 72rem wide from xl.
 * Defined here rather than re-exported from the about page, so the home
 * never depends on another route's module.
 */
export const HOME_CONTAINER = "mx-auto w-full max-w-[75rem] px-4 sm:px-6";

/**
 * The two large home sections below the hero (courses, resources) skip style,
 * layout, paint and raster until they come near the viewport. On a phone the hero fills the first screen, and
 * rendering the rest of the page during load competes with hydration. `auto`
 * remembers each section's rendered size; the estimate only holds its place
 * before the first render. The paint containment this implies clips nothing:
 * the sections keep their content inside their own box.
 */
export const HOME_DEFERRED_SECTION =
  "[content-visibility:auto] [contain-intrinsic-size:auto_50rem]";
