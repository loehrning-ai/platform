/**
 * Output guards shared by the Workshop 04 builders (build-deck, build-demo, build-pages).
 *
 * They inspect the HTML a builder is about to publish and report problems; they never rewrite
 * it, and they are not sanitizers. Each guard reads the whole page. Nothing is stripped first:
 * stripping by pattern can hide live markup. For example, a "<script type=application/json>"
 * written inside an attribute value would swallow the real tag that follows it.
 */

const SPACE = /[\t\n\f\r ]/;

/**
 * Tokenizes the tag that starts at `lt` (html[lt] is "<") the way a browser does: the name ends
 * at whitespace, "/" or ">", attribute values may be quoted, and the tag ends at the first ">"
 * outside a quoted value. Names are lower-cased; for a repeated attribute the first one counts,
 * as in the browser.
 */
export function readTag(html, lt) {
  let i = lt + 1;
  if (html[i] === "/") i++;
  const nameStart = i;
  while (i < html.length && !SPACE.test(html[i]) && html[i] !== "/" && html[i] !== ">") i++;
  const name = html.slice(nameStart, i).toLowerCase();
  const attrs = new Map();
  for (;;) {
    while (i < html.length && (SPACE.test(html[i]) || html[i] === "/")) i++;
    if (i >= html.length || html[i] === ">") break;
    const attrStart = i;
    i++; // the first character of a name may be "=" (a parse error, but still a name)
    while (i < html.length && !SPACE.test(html[i]) && !"/>=".includes(html[i])) i++;
    const attrName = html.slice(attrStart, i).toLowerCase();
    let value = "";
    let j = i;
    while (j < html.length && SPACE.test(html[j])) j++;
    if (html[j] === "=") {
      i = j + 1;
      while (i < html.length && SPACE.test(html[i])) i++;
      const quote = html[i];
      if (quote === '"' || quote === "'") {
        const close = html.indexOf(quote, i + 1);
        const stop = close < 0 ? html.length : close;
        value = html.slice(i + 1, stop);
        i = stop + 1;
      } else {
        const valueStart = i;
        while (i < html.length && !SPACE.test(html[i]) && html[i] !== ">") i++;
        value = html.slice(valueStart, i);
      }
    }
    if (!attrs.has(attrName)) attrs.set(attrName, value);
  }
  return { name, attrs, end: Math.min(i + 1, html.length) };
}

const snippet = (html, from, to) => html.slice(from, Math.min(to, from + 120)).replace(/\s+/g, " ");

/**
 * Every script start tag that could run inline code: anything but an external script (non-empty
 * src) or a JSON data block. The search is case-insensitive and ignores context, so "<script"
 * text inside an attribute value or a comment is checked as well; that errs towards a failed
 * build, never towards a missed script.
 */
export function inlineScriptProblems(html) {
  const problems = [];
  for (const m of html.matchAll(/<script\b/gi)) {
    const tag = readTag(html, m.index);
    const src = (tag.attrs.get("src") ?? "").trim();
    const type = (tag.attrs.get("type") ?? "").trim().toLowerCase();
    if (src !== "" || type === "application/json") continue;
    problems.push(`inline executable script: ${snippet(html, m.index, tag.end)}`);
  }
  return problems;
}

/**
 * JSON data blocks must parse and must not contain "<": the block then cannot end early or carry
 * markup, whatever the data says.
 */
export function jsonBlockProblems(html) {
  const problems = [];
  for (const m of html.matchAll(/<script\b/gi)) {
    const tag = readTag(html, m.index);
    if ((tag.attrs.get("type") ?? "").trim().toLowerCase() !== "application/json") continue;
    const close = /<\/script[\t\n\f\r />]/i.exec(html.slice(tag.end));
    const body = html.slice(tag.end, close ? tag.end + close.index : html.length);
    if (body.includes("<")) problems.push(`JSON data block contains "<": ${snippet(html, m.index, tag.end)}`);
    try {
      JSON.parse(body);
    } catch {
      problems.push(`JSON data block does not parse: ${snippet(html, m.index, tag.end)}`);
    }
  }
  return problems;
}

/**
 * Every event handler attribute (onclick=, onerror=, ...), found anywhere in the page, JSON data
 * blocks included. A browser starts an attribute name after whitespace, after "/" and straight
 * after a quoted value, so all three count as a boundary (\s is wider than HTML's whitespace,
 * which only adds findings).
 */
export function inlineHandlerProblems(html) {
  return [...html.matchAll(/[\s/"']on[a-z]+\s*=/gi)].map(
    (m) => `inline event handler attribute: ${snippet(html, Math.max(0, m.index - 40), m.index + 40)}`,
  );
}

/** Inline scripts, event handlers and malformed JSON data blocks, in one list. */
export function outputProblems(html) {
  return [...inlineScriptProblems(html), ...jsonBlockProblems(html), ...inlineHandlerProblems(html)];
}

/**
 * Text of a fragment with its tags removed; the same result as `fragment.replace(/<[^>]+>/g, "")`.
 * This is lint and label text, not a sanitizer: a "<" without a closing ">" survives, so callers
 * that put the result back into HTML reject any "<" or ">" left over (see hasAngleBracket).
 */
export function stripTags(fragment) {
  let out = "";
  let i = 0;
  while (i < fragment.length) {
    const lt = fragment.indexOf("<", i);
    if (lt < 0) break;
    const gt = fragment.indexOf(">", lt + 1);
    if (gt < 0) break;
    out += fragment.slice(i, lt);
    if (gt === lt + 1) {
      out += "<";
      i = lt + 1;
    } else {
      i = gt + 1;
    }
  }
  return out + fragment.slice(i);
}

export const hasAngleBracket = (text) => /[<>]/.test(text);

/**
 * The page with scripts, styles and comments blanked, for the literal-number audits (lint text,
 * never published). Tags in any case, end tags with whitespace or attributes and comments that
 * close with "--!>" are all covered.
 */
export function withoutCodeAndComments(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\b[^>]*>/gi, " ")
    .replace(/<!--[\s\S]*?--!?>/g, " ");
}
