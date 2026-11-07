/**
 * Pieces shared by the slides of lane D2 (S14 to S26 and the appendix): the copyable prompt card, the empty frame
 * "Your Claude result: not recorded yet" with its three plain buttons, the poll button, and the key tables read from
 * the kit at build time. A factory over the helpers of slides.mjs (no import cycle). Nothing here is typed text: every
 * visible word comes from deck-copy.json, every number from data.mjs.
 */
import { kit, kitDe } from "./data.mjs";

export const WORDS_PER_OUT_LINE = 16;

export function makeParts(H) {
  const { s, esc, fill, ico } = H;
  const t = (text, vars) => esc(fill(text, vars));
  const split = (text) => String(text).split(" · ");

  /** The kit's prompt, byte for byte, on a copyable card. The copy button is chrome (class fig), the text is .prompt-body. */
  const prompt = (c, n, text, attrs = "") =>
    `<figure class="prompt st__prompt" data-open${attrs}><pre class="prompt__text prompt-body" id="prompt-${n}">${esc(text)}</pre><button class="prompt__copy fig" type="button" data-copy="prompt-${n}">${ico("copy")}<span class="copy__label">${esc(c.copy)}</span></button></figure>`;

  /**
   * The labelled empty slot for the learner's own Claude result: text at press kText, the three plain buttons at kBtns.
   * No recording is shown. o.word adds the line "wording differs, numbers must not" at kBtns.
   */
  const slot = (copy, kText, kBtns = kText, o = {}) =>
    `<div class="st__slot${o.cls ? ` ${o.cls}` : ""}"${s(kText, { fx: "pop", win: "0,.6" })}>
<p class="st__slot-t">${esc(copy.slot)}</p>
<div class="st__slot-b"${s(kBtns, { fx: "fade", win: kBtns === kText ? ".3,1" : "0,.6" })}>${copy.slotOpts.map((label) => `<button class="st__btn" type="button">${esc(label)}</button>`).join("")}</div>
${o.word ? `<p class="st__slot-w"${s(kBtns, { fx: "fade", win: ".3,1" })}>${esc(o.word)}</p>` : ""}
</div>`;

  /** A poll button with its counter; both count as text. */
  const pollOpt = (name, value, label, k, cls = "", o = {}) =>
    `<button class="poll__opt ${cls}" type="button" data-poll="${name}" data-value="${value}"${s(k, { fx: "pop", win: o.win || "0,.6", ...(o.out ? { out: o.out } : {}) })}><span>${esc(label)}</span><span data-poll-n>0</span></button>`;

  /** The static strip of the four ladder rung labels (figure cells), as a link to appendix a2. */
  const rungStrip = (copy, cls) =>
    `<a class="st__rungs ${cls}" href="#a2" aria-label="${esc(copy.accounts)}">${split(copy.rungs).map((r, i) => `<span class="fig" style="--i:${i}">${esc(r)}</span>`).join("")}</a>`;

  /* ── key tables, read from the kit files ──────────────────────────── */

  const keyFile = (lang) => (lang === "de" ? kitDe("LOESUNGEN.md") : kit("ANSWERS.md"));
  const dropParen = (text) => text.replace(/\s\([^)]*\)?.*$/, "").trim();

  /** Rows of the Step 1 key (13 rows, 5 columns), shortened to lines of at most 16 words. */
  function keyRows(lang) {
    const text = keyFile(lang);
    const from = text.indexOf(lang === "de" ? "## Schritt 1" : "## Step 1");
    const end = text.indexOf("\n## ", from + 5);
    const rows = text
      .slice(from, end)
      .split("\n")
      .filter((line) => /^\| L\d\d /.test(line))
      .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
    if (rows.length !== 13 || rows.some((r) => r.length !== 5)) throw new Error(`${lang}: the Step 1 key does not hold 13 rows of 5 columns`);
    return rows.map(([id, article, paper, owner, where]) => {
      const file = /[\w.-]+\.(?:csv|md|txt)/.exec(where)?.[0];
      const short = [id, dropParen(article), dropParen(paper), dropParen(owner), file || where.split(/[,;]/)[0].trim()];
      const words = short.join(" ").split(/\s+/).length;
      if (words > WORDS_PER_OUT_LINE) throw new Error(`${lang}: key row ${id} has ${words} words, the cap of an output line is ${WORDS_PER_OUT_LINE}`);
      return short;
    });
  }

  /** The first three data rows of the kit's sample attendance file (invented rows, X-ids). */
  function sampleRows(lang) {
    const text = lang === "de" ? kitDe("vorlagen/sample-rows_attendance.csv") : kit("templates/sample-rows_attendance.csv");
    const rows = text.split("\n").filter((line) => line && !line.startsWith("#") && !line.startsWith("id,"));
    if (rows.length < 3) throw new Error(`${lang}: the sample attendance file holds fewer than 3 rows`);
    return rows.slice(0, 3);
  }

  /** The fields of the new-paper template (from the kit file), one line each, without the intro and the signature blank. */
  function noteLines(lang) {
    const text = lang === "de" ? kitDe("vorlagen/neues-papier.md") : kit("templates/new-paper-note.md");
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const from = lines.findIndex((l) => /^(Title|Titel):/.test(l));
    if (from < 0) throw new Error(`${lang}: the new-paper template has no title field`);
    const out = lines.slice(from);
    if (out.length > WORDS_PER_OUT_LINE || out.some((l) => l.split(/\s+/).length > WORDS_PER_OUT_LINE)) throw new Error(`${lang}: the new-paper template exceeds the output caps`);
    return out;
  }

  return { t, split, prompt, slot, pollOpt, rungStrip, keyRows, sampleRows, noteLines };
}
