/**
 * Markup for the phone hero's decorative SVG frames (hero-globe-frame.tsx,
 * hero-signal-frame.tsx).
 *
 * Those frames are a large share of the homepage's elements, yet nothing
 * about them is ever interactive or updated by React. Rendered as the inner
 * HTML of their <svg>, they reach the browser once in the HTML and once as a
 * single string in the RSC payload, and hydration claims the <svg> without
 * building or matching a node for each of their paths.
 */

type Attributes = Readonly<Record<string, string | number>>;

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/** One SVG element as markup, with its attributes in SVG (not JSX) spelling. */
export function svgElement(
  name: string,
  attributes: Attributes,
  children = "",
): string {
  const list = Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${escapeAttribute(String(value))}"`)
    .join("");
  return children
    ? `<${name}${list}>${children}</${name}>`
    : `<${name}${list}/>`;
}
