/**
 * The Workshop 05 deck as HTML, one function per slide. Every word comes from deck-copy.json (c), every
 * fact from data.mjs (d), so the German and the English edition share one structure and one set of numbers.
 *
 * Motion lives in lib/deck-stage.js and lib/scenes.js. An element with data-from="k" appears on build
 * step k: its --p runs from 0 to 1 with the step's t (a pure function of t, never a timer). data-delay and
 * data-span place it inside the step; data-until="k" lets it leave again on step k + 1.
 */

export const esc = (value) =>
  String(value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
export const fill = (text, vars = {}) => String(text).replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m));

/** 9.11.2026 or 9 Nov 2026. */
export function fmtDate(iso, c) {
  const [y, m, d] = iso.split("-").map(Number);
  return c.lang === "de" ? `${d}.${m}.${y}` : `${d} ${c.months[m - 1]} ${y}`;
}
/** 20,8 or 20.8. */
export const num = (value, c) => (c.lang === "de" ? String(value).replace(".", ",") : String(value));

/** Reveal attributes: appear on step `from`, optionally inside the step (delay, span), optionally leave after `until`. */
function rv(from, { delay, span, until } = {}) {
  let out = ` data-from="${from}"`;
  if (delay !== undefined) out += ` data-delay="${Math.round(delay * 1000) / 1000}"`;
  if (span !== undefined) out += ` data-span="${Math.round(span * 1000) / 1000}"`;
  if (until !== undefined) out += ` data-until="${until}"`;
  return out;
}

const OWNER_OF = { R2: "it", R3: "it", R4: "it", R5: "hr", R7: "it", R8: "md" };
const STATUS_ORDER = ["covered", "weak", "gap"];
const TESTS = ["date", "approval", "scope", "quote"];

/** Mono file name, cut before its tail so the date or version stays readable. */
function fileName(name, extra = "") {
  const us = name.lastIndexOf("_");
  const cut = us > 0 && name.length - us <= 16 ? us : Math.max(0, name.length - 14);
  return `<span class="fname${extra ? " " + extra : ""}" title="${esc(name)}"><span class="fname-a">${esc(name.slice(0, cut))}</span><span class="fname-b">${esc(name.slice(cut))}</span></span>`;
}

function promptCard(text, c, mission, extra = "") {
  return `<figure class="prompt${extra ? " " + extra : ""}">
  <figcaption class="prompt-head"><span>${esc(fill(c.ui.promptFrom, { mission }))}</span><button type="button" class="copy" data-copy>${esc(c.ui.copy)}</button></figcaption>
  <pre class="prompt-body">${esc(text)}</pre>
</figure>`;
}

function timer(key, minutes, c, { phases } = {}) {
  const phaseHtml = phases
    ? `<ol class="timer-phases">${phases.map((p, i) => `<li data-phase="${i}"><b>${esc(p.label)}</b><span>${p.minutes} min</span></li>`).join("")}</ol>`
    : "";
  return `<div class="timer" data-timer="${key}" data-minutes="${minutes}"${phases ? ` data-phases="${phases.map((p) => p.minutes).join(",")}"` : ""}>
  <div class="timer-row"><span class="timer-clock" data-timer-clock>0:00</span><span class="timer-of">${esc(fill(c.ui.timerOf, { min: minutes }))}</span>
  <button type="button" class="btn" data-timer-toggle data-start="${esc(c.ui.timerStart)}" data-pause="${esc(c.ui.timerPause)}">${esc(c.ui.timerStart)}</button>
  <button type="button" class="btn btn-quiet" data-timer-reset>${esc(c.ui.timerReset)}</button></div>
  <div class="timer-bar" aria-hidden="true"><i data-timer-fill></i>${phases ? phases.slice(0, -1).map((_, i) => `<b style="left:${(phases.slice(0, i + 1).reduce((a, p) => a + p.minutes, 0) / minutes) * 100}%"></b>`).join("") : ""}</div>
  ${phaseHtml}
</div>`;
}

function vote(key, values, label, c, extra = "") {
  return `<div class="vote${extra ? " " + extra : ""}" data-vote="${key}" role="group" aria-label="${esc(label)}">
  <div class="vote-bars">${values
    .map((v) => `<button type="button" class="vote-btn" data-value="${esc(v.value)}"><span class="vote-bar" aria-hidden="true"><i></i></span><span class="vote-n" data-count>0</span><span class="vote-v">${esc(v.label)}</span></button>`)
    .join("")}</div>
  <div class="vote-foot"><span class="vote-total" data-vote-total data-unit="${esc(c.ui.votes)}" data-none="${esc(c.ui.noVotes)}">${esc(c.ui.noVotes)}</span><button type="button" class="btn btn-quiet" data-undo="${key}">${esc(c.ui.undo)}</button></div>
</div>`;
}

function statusChip(status, c, extra = "") {
  return `<span class="chip chip-${status}${extra ? " " + extra : ""}">${esc(c.status[status])}</span>`;
}

function qr(file, label, sub, url) {
  return `<figure class="qr"><img src="./assets/${file}" width="300" height="300" alt="" /><figcaption><b>${esc(label)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}<code>${esc(url).replace(/\//g, "/<wbr>").replace("#", "<wbr>#")}</code></figcaption></figure>`;
}

/** Eight request rows, each linked to the file its name fits, plus the files no name matched. */
function links(d, c, { mode }) {
  const vars = { days: d.r3Days, unique: d.training.unique, staff: d.training.staff, hours: num(d.notice.hours, c) };
  const rows = d.mission2
    .map((row, i) => {
      const item = d.items[i];
      const naive = row.naive;
      const failsAt = row.failsAt ?? "";
      return `<li class="lk-row" data-item="${item.id}" data-status="${row.status}" data-fails-at="${failsAt}" data-i="${i}">
    <span class="lk-req"><b>${item.id}</b> <span>${esc(c.short[item.id])}</span></span>
    <span class="lk-link"><svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><line class="lk-line" x1="0" y1="5" x2="100" y2="5" pathLength="100"/><line class="lk-half lk-a" x1="0" y1="5" x2="50" y2="5"/><line class="lk-half lk-b" x1="50" y1="5" x2="100" y2="5"/>${TESTS.map((t, k) => `<rect class="lk-tick" data-k="${k}" x="${30 + k * 11}" y="7.4" width="7" height="2.6"/>`).join("")}</svg>${mode === "run" ? statusChip(row.status, c, "lk-verdict") : ""}</span>
    <span class="lk-file">${fileName(naive)}${mode === "run" ? `<span class="lk-sub"><span class="lk-date">${esc(c.fileDates[naive])}</span><span class="lk-defect">${esc(fill(c.m2.defects[item.id], vars))}</span></span>` : ""}</span>
  </li>`;
    })
    .join("\n");
  const unlinked = d.files.filter((f) => !d.mission2.some((r) => r.naive === f));
  return `<div class="links links-${mode}" data-links="${mode}">
  <ol class="lk-rows">${rows}</ol>
  <p class="lk-unlinked"><span>${esc(c.m2.unlinked)}</span>${unlinked.map((f) => fileName(f, "lk-chip")).join("")}</p>
</div>`;
}

/* ── slides ─────────────────────────────────────────────────────────────── */

function cover(d, c) {
  return `<div class="cover-copy">
  <p class="eyebrow">${esc(c.cover.eyebrow)}</p>
  <h1 class="cover-title">${esc(c.cover.title)}</h1>
  <p class="cover-lede">${esc(c.cover.lede)}</p>
  <p class="cover-meta">${esc(fill(c.cover.meta, { exercise: fmtDate(d.exercise, c) }))}</p>
  <img class="cover-lockup" src="./assets/lockup-horizontal.svg" width="354" height="72" alt="loehrning.ai" />
</div>
<div class="cover-art" role="img" aria-label="${esc(c.cover.drawing)}">
  <span class="cover-num" aria-hidden="true">05</span>
  ${links(d, c, { mode: "cover" })}
</div>`;
}

function request(d, c) {
  const rules = d.rules
    .map((rule, i) => `<li class="rule"><span class="rule-mark" aria-hidden="true"${rv(2, { delay: i * 0.12, span: 0.5 })}></span><span class="rule-text q" data-file="request_tannwald.md">${esc(rule)}</span><span class="rule-tag"${rv(2, { delay: i * 0.12 + 0.2, span: 0.4 })}>${esc(fill(c.request.ruleTags[i], { window: fmtDate(d.windowStart, c) })).replace(/ (%|h)$/, "\u00a0$1")}</span></li>`)
    .join("");
  const items = d.items
    .map((item, i) => `<li class="item"${rv(1, { delay: i * 0.07, span: 0.4 })}><b>${item.id}</b><span class="item-label">${esc(c.items[item.id])}</span><span class="item-sec">${esc(fill(c.request.section, { n: item.section }))}</span></li>`)
    .join("");
  const values = Array.from({ length: 9 }, (_, v) => ({ value: v, label: String(v) }));
  return `<div class="cols cols-request">
  <article class="sheet letter"${rv(0, { span: 0.01, until: 2 })}>
    <p class="sheet-name">${fileName(c.request.file)}</p>
    <p class="letter-from"><span>${esc(c.request.fromLabel)}</span> ${esc(c.request.fromValue)} · ${esc(fmtDate("2026-11-09", c))}</p>
    <p class="headline"><span class="q typed" data-file="request_tannwald.md" data-full="${esc(d.headline)}" data-type-step="0">${esc(d.headline)}</span></p>
    <p class="rules-head">${esc(c.request.rulesHead)}</p>
    <ol class="rules">${rules}</ol>
  </article>
  <div class="request-side">
    <p class="side-head"${rv(1, { span: 0.3 })}>${esc(c.request.itemsHead)}</p>
    <ol class="items">${items}</ol>
  </div>
  <div class="estimate"${rv(3, { span: 0.6 })}>
    <p class="ask">${esc(c.request.estimate)}</p>
    ${vote("estimate", values, c.request.estimateLabel, c)}
  </div>
</div>
<p class="source">${esc(c.request.legal)}</p>`;
}

function draft(d, c) {
  const options = c.draft.options.map((label, i) => ({ value: ["true", "false", "unsure"][i], label }));
  const sentences = d.draft
    .map((s, i) => `<li class="claim" data-claim="${i + 1}"${rv(i + 1, { span: 0.6 })}>
    <span class="claim-n">${i + 1}</span><span class="claim-text"><span class="q hl" data-file="draft-reply.md">${esc(s)}</span></span>
    ${vote(`draft-${i + 1}`, options, fill(c.draft.voteLabel, { n: i + 1 }), c, "vote-row")}
  </li>`)
    .join("");
  return `<article class="sheet draft-sheet">
  <p class="sheet-name">${fileName(c.draft.file)}<span class="sheet-tag">${esc(c.draft.tag)}</span></p>
  <p class="draft-open">${esc(d.draftOpen.replace(/\n/g, " "))}</p>
  <ol class="claims">${sentences}</ol>
  <p class="draft-close">${esc(d.draftClose.replace(/\n/g, " "))}</p>
</article>
<p class="source">${esc(c.draft.hint)}</p>`;
}

function folder(d, c) {
  const naive = new Map(d.mission2.map((row) => [row.naive, row.id]));
  const cards = d.index
    .map((row, i) => {
      // stack position: every card starts on a pile at the left edge, then deals into its cell
      const col = i % 3;
      const r = Math.floor(i / 3);
      const dx = -(col * 584) - 40;
      const dy = -(r * 142) + 200 - i * 4;
      const rot = ((i * 7) % 9) - 4;
      const match = naive.get(row.file);
      return `<li class="card" style="--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg"${rv(0, { delay: i * 0.045, span: 0.5 })}${match ? ` data-match="${match}"` : ' data-match=""'}>
      ${fileName(row.file)}
      <span class="card-meta"><span class="card-date">${esc(c.fileDates[row.file])}</span><span class="card-type">${esc(c.types[row.type])}</span></span>
      ${match ? `<span class="card-badge"${rv(1, { delay: i * 0.05, span: 0.4 })}>${match}</span>` : ""}
    </li>`;
    })
    .join("");
  const steps = c.folder.setup.map((step) => `<li>${esc(step)}</li>`).join("");
  return `<div class="cols-folder"${rv(0, { span: 0.01, until: 1 })}>
  <ol class="cards">${cards}<li class="counter"${rv(1, { span: 0.6 })}>
    <p class="big-n"><b>8</b><span>/ 8</span></p>
    <div><p class="counter-text">${esc(fill(c.folder.counter, { matched: 8, total: 8 }))}</p>
    <p class="counter-sub">${esc(fill(c.folder.unmatched, { n: 3 }))}</p></div>
  </li></ol>
</div>
<div class="cols cols-setup"${rv(2, { span: 0.7 })}>
  <div class="setup">
    <p class="side-head">${esc(c.folder.setupHead)}</p>
    <ol class="setup-steps">${steps}<li>${esc(c.codeExec)}</li></ol>
    <p class="setup-note">${esc(c.folder.noProject)}</p>
  </div>
  ${qr(c.qr.kit, c.folder.qr, "", c.folder.kitUrl)}
</div>`;
}

function four(d, c) {
  const cards = c.four.cards
    .map((card, i) => {
      const k = i + 1;
      const [before, after] = card.text.split(card.mark);
      return `<li class="mini" data-test="${card.test}">
      <p class="mini-tag">${esc(c.four.example)}</p>
      ${fileName(card.name)}
      <p class="mini-text">${esc(before)}<mark class="mini-mark" data-step="${k}"${rv(k, { delay: 0.25, span: 0.45 })}>${esc(card.mark)}<svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><rect x="1" y="1" width="98" height="38" pathLength="100"/></svg></mark>${esc(after ?? "")}</p>
      <div class="mini-test"${rv(k, { span: 0.35 })}>
        <p class="mini-name">${esc(c.tests[card.test])}</p>
        <p class="mini-line">${esc(fill(c.four.lines[card.test], { window: fmtDate(d.windowStart, c) }))}</p>
      </div>
      <p class="mini-verdict"${rv(k, { delay: 0.55, span: 0.4 })}><b>${esc(fill(c.four.fails, { test: c.tests[card.test] }))}</b> ${esc(card.verdict)}</p>
    </li>`;
    })
    .join("");
  return `<ol class="minis"${rv(0, { span: 0.5, until: 4 })}>${cards}</ol>
<div class="tool"${rv(5, { delay: 0.2, span: 0.7 })}>
  <p class="objective">${esc(c.four.objective)}</p>
  <div class="tool-card">
    <p class="tool-head">${esc(c.four.toolHead)}</p>
    <ol class="tool-lines">${c.four.tool.map((line) => `<li>${esc(line)}</li>`).join("")}</ol>
    <p class="tool-ref">${esc(c.four.rulesRef)}</p>
  </div>
</div>
<p class="source">${esc(c.four.sources)}</p>`;
}

function mission1(d, c) {
  const values = Array.from({ length: 12 }, (_, v) => ({ value: v, label: String(v) }));
  const rows = d.index
    .map((row, i) => {
      const fail = c.m1.fails[row.file];
      const cell = (ok) => `<td class="${ok ? "pass" : "fail"}">${ok ? "✓" : "✗"}</td>`;
      return `<tr${rv(3, { delay: (i / 11) * 0.78, span: 0.16 })} class="${row.dateOk && row.approvalOk ? "" : "is-fail"}"><td>${fileName(row.file)}</td><td class="t-type">${esc(c.types[row.type])}</td><td class="t-date">${esc(fail ?? c.fileDates[row.file])}</td>${cell(row.dateOk)}${cell(row.approvalOk)}</tr>`;
    })
    .join("");
  return `<p class="sub ask"${rv(0, { until: 2 })}>${esc(c.m1.ask)}</p>
<div class="cols cols-mission"${rv(1, { until: 2 })}>
  <div class="predict">
    <p class="side-head">${esc(c.m1.predictLabel)}</p>
    ${vote("m1", values, c.m1.predictLabel, c, "vote-wide")}
    <div class="m1-timer"${rv(2, { span: 0.6 })}>${timer("m1", c.m1.minutes, c)}</div>
  </div>
  <div class="work"${rv(2, { span: 0.6 })}>
    ${promptCard(d.prompts.m1, c, c.m1.mission)}
  </div>
</div>
<div class="index"${rv(3, { span: 0.12 })}>
  <table class="tbl">
    <thead><tr>${c.m1.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="index-result"${rv(3, { delay: 0.85, span: 0.15 })}>
    <p class="big-n"><b>${d.passing}</b><span>/ ${d.index.length}</span></p>
    <p class="counter-text">${esc(fill(c.m1.result, { passing: d.passing, total: d.index.length }))}</p>
    <p class="counter-sub">${esc(c.m1.resultSub)}</p>
  </div>
</div>`;
}

function mission2(d, c) {
  const t = d.training;
  const r7 = [
    { key: "policy", file: "infosec-policy_v3_FINAL.md", quote: d.quotes.policyBackup, fail: "date" },
    { key: "notes", file: "it-notes_2026-10-06.md", quote: d.quotes.notesBackup, fail: "approval" },
    { key: "report", file: "backup-report_2026-10.txt", quote: d.quotes.reportRestore, fail: "notmet" },
  ]
    .map((cand, i) => `<li class="cand cand-${cand.fail}"${rv(2, { delay: i * 0.28, span: 0.3 })}>
      ${fileName(cand.file)}
      <p class="cand-q q" data-file="folder/${cand.file}">${esc(cand.quote)}</p>
      <p class="cand-tests">${TESTS.map((test, k) => {
        const failedAt = cand.fail === "date" ? 0 : cand.fail === "approval" ? 1 : 3;
        const state = k < failedAt ? "pass" : k === failedAt ? "fail" : "skip";
        return `<span class="tchip tchip-${state}">${esc(c.tests[test])}</span>`;
      }).join("")}</p>
      <p class="cand-why">${esc(c.m2.r7Reasons[cand.key])}</p>
      ${cand.fail === "notmet" ? statusChip("gap", c, "cand-status") : ""}
    </li>`)
    .join("");
  const chips = Array.from({ length: t.rows }, (_, i) => `<i data-i="${i}"></i>`).join("");
  const vars = { rows: t.rows, id: t.duplicate, unique: t.unique, staff: t.staff, share: num(t.share, c), target: Math.round(t.target * 100), needed: t.needed, missing: t.missing };
  return `<div class="m2-work"${rv(1, { span: 0.5, until: 1 })}>
  <div class="cols cols-mission">
    ${promptCard(d.prompts.m2, c, c.m2.mission)}
    <div class="m2-side">
      ${timer("m2", c.m2.minutes, c)}
      <p class="side-head">${esc(c.m2.then)}</p>
      <pre class="prompt-body prompt-small">${esc(d.prompts.m2follow)}</pre>
    </div>
  </div>
</div>
<div class="r7"${rv(2, { span: 0.2, until: 2 })}>
  <p class="panel-head">${esc(c.m2.r7Head)}</p>
  <ol class="cands">${r7}</ol>
  <p class="moral"${rv(2, { delay: 0.86, span: 0.14 })}>${esc(c.m2.moral)}</p>
</div>
<div class="r5"${rv(3, { span: 0.1, until: 3 })} data-r5 data-rows="${t.rows}" data-unique="${t.unique}" data-staff="${t.staff}" data-share="${t.share}" data-target="${t.target}" data-dup="${d.trainingDupIndex}">
  <p class="panel-head">${esc(fill(c.m2.r5Head, vars))}</p>
  <div class="r5-grid">
    <div class="r5-chips" aria-hidden="true">${chips}</div>
    <div class="r5-count"><p class="big-n"><b data-r5-n>0</b></p><p class="r5-label" data-r5-label data-rows="${esc(fill(c.m2.r5Rows, vars))}" data-merged="${esc(fill(c.m2.r5Merged, vars))}">${esc(fill(c.m2.r5Rows, vars))}</p></div>
  </div>
  <div class="r5-bar"><i data-r5-fill></i><b class="r5-tick" style="left:${t.target * 100}%"><span>${esc(fill(c.m2.r5Tick, vars))}</span></b></div>
  <p class="r5-share" data-r5-share>${esc(fill(c.m2.r5Share, vars))}</p>
  <p class="r5-needed"${rv(3, { delay: 0.9, span: 0.1 })}>${esc(fill(c.m2.r5Needed, vars))}</p>
</div>
<div class="run"${rv(4, { span: 0.08, until: 4 })}>
  <p class="panel-head"><span>${esc(c.m2.runHead)}</span><span class="run-pass" data-run-pass data-label="${esc(c.m2.running)}" data-tests="${esc(TESTS.map((x) => c.tests[x]).join("|"))}"></span><span class="tally tally-head" data-tally>${STATUS_ORDER.map((s) => `<span class="tally-${s}">${statusChip(s, c)}<b>${d.tally[s]}</b></span>`).join("")}</span></p>
  ${links(d, c, { mode: "run" })}
</div>
<div class="r1"${rv(5, { span: 0.6 })}>
  <p class="panel-head">${esc(c.m2.r1Head)}</p>
  <div class="cols cols-r1">
    <div class="r1-proof">
      <p class="r1-file">${fileName(c.m2.r1File)}${statusChip("covered", c)}</p>
      <p class="r1-q"><span class="q" data-file="folder/system-list_2026-09.csv">${esc(d.quotes.claudeRow)}</span> · <mark class="q" data-file="folder/system-list_2026-09.csv">${esc(d.quotes.systemUs)}</mark></p>
      <p class="r1-file">${esc(c.m2.r1Clause)}</p>
      <p class="r1-q"><span class="q" data-file="request_tannwald.md">${esc(d.clause7)}</span></p>
      <p class="r1-line">${esc(c.m2.r1Line)}</p>
    </div>
    ${qr(c.qr.probe, c.m2.probeQr, "", c.m2.probeUrl)}
  </div>
</div>`;
}

function mistakes(d, c) {
  const cards = c.mistakes.cards
    .map((card, i) => `<li class="wrong">
    <p class="wrong-line"><s class="struck"${rv(i + 1, { span: 0.45 })}>${esc(card.wrong)}</s></p>
    <p class="wrong-fix"${rv(i + 1, { delay: 0.4, span: 0.5 })}><b>${esc(card.rule)}</b> ${esc(card.fix)}</p>
  </li>`)
    .join("");
  return `<p class="sub">${esc(c.mistakes.sub)}</p>
<p class="side-head wrongs-head">${esc(c.mistakes.label)}</p>
<ol class="wrongs">${cards}</ol>
<div class="cols cols-case"${rv(5, { span: 0.6 })}>
  <p class="case"><b>${esc(c.mistakes.caseSource)}</b> ${esc(c.mistakes.case)}</p>
  <p class="case case-account">${esc(c.mistakes.account)}</p>
</div>`;
}

function gaps(d, c) {
  const vars = { days: d.r3Days, unique: d.training.unique, staff: d.training.staff };
  const ids = d.mission2.filter((row) => row.status !== "covered").map((row) => row.id);
  const rows = ids
    .map((id, i) => {
      const status = d.mission2.find((row) => row.id === id).status;
      return `<tr${rv(1, { delay: i * 0.1, span: 0.4 })}><td><b>${id}</b> ${statusChip(status, c)}</td><td>${esc(fill(c.gaps.missing[id], vars))}</td><td>${esc(c.gaps.closes[id])}</td><td class="t-owner">${esc(c.gaps.owners[OWNER_OF[id]])}<span class="t-date">${esc(fmtDate(d.due, c))}</span></td></tr>`;
    })
    .join("");
  const slots = d.emailSegments.filter((seg) => seg.slot).length;
  let k = -1;
  const email = d.emailSegments
    .map((seg) => {
      if (!seg.slot) return esc(seg.text.replace(/\n{2,}/g, "\n"));
      k += 1;
      return `<span class="slot" data-k="${k}" data-n="${slots}"><span class="slot-ph">${esc(seg.slot)}</span><span class="slot-v">${esc(seg.value)}</span></span>`;
    })
    .join("");
  return `<p class="sub"${rv(0, { until: 1 })}>${esc(c.gaps.sub)}</p>
<div class="gaplist"${rv(1, { span: 0.1, until: 1 })}>
  <table class="tbl tbl-gaps"><thead><tr>${c.gaps.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
</div>
<div class="cols cols-email"${rv(2, { span: 0.2, until: 2 })}>
  <p class="email-note"${rv(2, { delay: 0.85, span: 0.15 })}>${esc(c.gaps.emailNote)}</p>
  <article class="sheet email" data-email>
    <p class="sheet-name">${esc(c.gaps.emailHead)}</p>
    <pre class="email-body">${email}</pre>
  </article>
</div>
<div class="cols cols-mission"${rv(3, { span: 0.5 })}>
  ${promptCard(d.prompts.m3, c, c.gaps.mission)}
  <div class="m2-side">${timer("m3", c.gaps.minutes, c)}</div>
</div>`;
}

function reply(d, c) {
  const vars = {
    unique: d.training.unique,
    staff: d.training.staff,
    done: c.lang === "de" ? "14.8.2026" : "14 Aug 2026",
    restore: d.quotes.reportRestore,
    stored: d.quotes.storedUs,
  };
  const claims = d.draft
    .map((s, i) => `<li class="claim" data-claim="${i + 1}">
    <p class="claim-line"><span class="claim-n">${i + 1}</span><span class="claim-text q" data-file="draft-reply.md"><s class="struck"${rv(i + 1, { span: 0.4 })}>${esc(s)}</s></span><span class="verdict"${rv(i + 1, { delay: 0.3, span: 0.3 })}>${esc(c.reply.verdict)}</span></p>
    <p class="evidence"${rv(i + 1, { delay: 0.35, span: 0.65 })}><span class="typed" data-full="${esc(fill(c.reply.evidence[i], vars))}">${esc(fill(c.reply.evidence[i], vars))}</span></p>
  </li>`)
    .join("");
  const phases = c.reply.phases.map((label, i) => ({ label, minutes: c.reply.phaseMinutes[i] }));
  const total = c.reply.phaseMinutes.reduce((a, b) => a + b, 0);
  return `<p class="sub">${esc(c.reply.sub)}</p>
<ol class="claims claims-reply"${rv(0, { span: 0.01, until: 4 })}>${claims}</ol>
<div class="cols phase-box"${rv(5, { span: 0.5, until: 5 })}>
  ${timer("reply", total, c, { phases })}
  <p class="phase-hint">${esc(c.reply.phaseHint)}</p>
</div>
<article class="sheet sample"${rv(6, { span: 0.6 })}>
  <p class="sheet-name">${esc(c.reply.sampleHead)}</p>
  <pre class="sample-body q" data-file="ANSWERS.md">${esc(d.sample)}</pre>
  <p class="sheet-tag">${esc(c.reply.clause)}</p>
</article>`;
}

function result(d, c) {
  const est = Array.from({ length: 9 }, (_, v) => `<span class="h-bar" data-v="${v}"><i></i><b>${v}</b></span>`).join("");
  const res = STATUS_ORDER.map((s) => `<span class="r-bar r-${s}" data-n="${d.tally[s]}"><i></i>${statusChip(s, c)}<b>${d.tally[s]}</b></span>`).join("");
  const draftRows = d.draft.map((_, i) => `<li data-claim="${i + 1}" data-line="${esc(c.result.draftLine)}" data-none="${esc(c.result.draftNone)}" data-opts="${esc(c.draft.options.join("|"))}">${esc(fill(c.result.draftNone, { n: i + 1 }))}</li>`).join("");
  const qrs = c.result.qr.map((q, i) => qr([c.qr.own, c.qr.skill, c.qr.kit][i], q.label, q.sub, q.url)).join("");
  return `<h2 class="title title-result" data-result-title data-votes="${esc(c.result.titleVotes)}" data-none="${esc(c.result.titleNone)}" data-covered="${d.tally.covered}">${esc(fill(c.result.titleNone, { covered: d.tally.covered }))}</h2>
<div class="result-stage">
<div class="cols cols-result"${rv(0, { until: 1 })}>
  <div class="hist">
    <p class="side-head" data-hist-head data-est="${esc(c.result.estimateHead)}" data-res="${esc(c.result.resultHead)}">${esc(c.result.estimateHead)}</p>
    <div class="h-stage"><div class="h-bars">${est}</div><div class="r-bars">${res}</div></div>
  </div>
  <div class="draft-votes">
    <p class="side-head">${esc(c.result.draftHead)}</p>
    <ol>${draftRows}</ol>
  </div>
</div>
<div class="closing"${rv(2, { span: 0.6 })}>
  <p class="next-line">${esc(c.result.next)}</p>
  <div class="qrs">${qrs}</div>
</div>
</div>
<nav class="appendix-links" aria-label="${esc(c.ui.appendix)}"><span>${esc(c.ui.appendix)}:</span>${c.result.appendixLinks.map((label, i) => `<button type="button" class="link" data-goto="a${i + 1}">${esc(label)}</button>`).join("")}</nav>`;
}

function appendixBack(c) {
  return `<button type="button" class="btn appendix-back" data-action="leave-appendix" data-label="${esc(c.ui.appendixBack)}">${esc(fill(c.ui.appendixBack, { n: "01" }))}</button>`;
}

function a1(d, c) {
  return `${appendixBack(c)}
<ol class="facts">${c.a1.rows.map((row) => `<li><p class="fact-head">${esc(row.head)}</p><p class="fact-text">${esc(row.text)}</p><p class="fact-src">${esc(row.source)}</p></li>`).join("")}</ol>
<p class="rule-box">${esc(c.a1.rule)}</p>
<p class="source">${esc(c.a1.checked)}</p>`;
}

function a2(d, c) {
  const vars = { adminNote: c.ui2.adminNote, plans: c.ui2.plans };
  return `${appendixBack(c)}
<ol class="facts facts-2">${c.a2.rows.map((row) => `<li><p class="fact-head">${esc(row.head)}</p><p class="fact-text">${esc(fill(row.text, vars))}</p></li>`).join("")}</ol>
<p class="source">${esc(c.ui2.source)}</p>`;
}

export const SOURCES = [
  ["GDPR Art. 28(3)(h)", "https://eur-lex.europa.eu/eli/reg/2016/679/oj"],
  ["ISO 19011:2018, audit evidence (summary)", "https://www.iso.org/standard/70017.html"],
  ["ISO/IEC 27001:2022, clause 7.5.2 (summary)", "https://www.iso.org/standard/27001"],
  ["Anthropic, Reduce hallucinations", "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations"],
  ["Anthropic Privacy Center 7996890", "https://privacy.claude.com/en/articles/7996890"],
  ["Anthropic, Updates to our consumer terms", "https://www.anthropic.com/news/updates-to-our-consumer-terms"],
  ["Claude Help Center 12512180, custom skills", "https://support.claude.com/en/articles/12512180"],
  ["Claude Help Center 9517075, Projects", "https://support.claude.com/en/articles/9517075"],
  ["AP, Deloitte to partially refund Australian government for report with apparent AI-generated errors, 7 Oct 2025", "https://www.news4jax.com/business/2025/10/07/deloitte-to-partially-refund-australian-government-for-report-with-apparent-ai-generated-errors/"],
];

function a3(d, c) {
  return `${appendixBack(c)}
<ol class="sources">${SOURCES.map(([label, url]) => `<li><b>${esc(label)}</b><code>${esc(url)}</code></li>`).join("")}</ol>
<p class="source">${esc(c.a3.checked)}</p>`;
}

/** The slides in deck order: id, route stop (null: none), build steps, minutes, kind, body. */
export const SLIDES = [
  { id: "cover", route: null, steps: 0, minutes: 1, body: cover, title: null },
  { id: "request", route: 0, steps: 3, minutes: 4, body: request, title: (c) => c.request.title, sub: (c, d) => fill(c.request.sub, { audit: fmtDate(d.audit, c), sendBy: fmtDate(d.sendBy, c) }) },
  { id: "draft", route: 0, steps: 4, minutes: 3, body: draft, title: (c) => c.draft.title, sub: (c) => c.draft.sub },
  { id: "folder", route: 1, steps: 2, minutes: 8, body: folder, title: (c) => c.folder.title, sub: (c) => c.folder.sub },
  { id: "tests", route: 2, steps: 5, minutes: 6, body: four, title: (c) => c.four.title, sub: (c) => c.four.sub },
  { id: "mission-1", route: 2, steps: 3, minutes: 15, body: mission1, title: (c) => c.m1.title },
  { id: "mission-2", route: 2, steps: 5, minutes: 20, body: mission2, title: (c) => c.m2.title, sub: (c) => c.m2.sub },
  { id: "mistakes", route: 2, steps: 5, minutes: 5, body: mistakes, title: (c) => c.mistakes.title },
  { id: "gaps", route: 3, steps: 3, minutes: 12, body: gaps, title: (c) => c.gaps.title },
  { id: "reply", route: 4, steps: 6, minutes: 10, body: reply, title: (c) => c.reply.title },
  { id: "result", route: 4, steps: 2, minutes: 6, body: result, title: null },
  { id: "a1", route: null, steps: 0, minutes: 0, body: a1, title: (c) => c.a1.title, kind: "appendix" },
  { id: "a2", route: null, steps: 0, minutes: 0, body: a2, title: (c) => c.a2.title, kind: "appendix" },
  { id: "a3", route: null, steps: 0, minutes: 0, body: a3, title: (c) => c.a3.title, kind: "appendix" },
];

const SECTION_OF = (c, slide) => (slide.route === null ? (slide.kind === "appendix" ? c.ui.appendix : "") : c.route[slide.route]);

/** Every section of one edition. */
export function renderSlides(c, d) {
  const mains = SLIDES.filter((s) => s.kind !== "appendix").length;
  let appendixN = 0;
  return SLIDES.map((slide, index) => {
    const kind = slide.kind ?? "main";
    const n = kind === "main" ? String(index + 1).padStart(2, "0") : `A${(appendixN += 1)}`;
    const label = c.notes[index].split("\n")[0].replace(/^[^·]*·\s*/, "");
    const route =
      slide.route === null
        ? ""
        : `<nav class="route" aria-label="${esc(c.routeLabel)}"><ol>${c.route.map((stop, i) => `<li${i === slide.route ? ' aria-current="step"' : ""}${i < slide.route ? ' class="done"' : ""}>${esc(stop)}</li>`).join("")}</ol></nav>`;
    const chrome =
      slide.id === "cover"
        ? ""
        : `<header class="top"><p class="kicker">${esc(c.kicker)}</p>${route}</header>
${slide.title ? `<h2 class="title">${esc(slide.title(c, d))}</h2>` : ""}${slide.sub ? `<p class="sub">${esc(slide.sub(c, d))}</p>` : ""}
<footer class="foot"><span>${esc(fill(c.foot, { exercise: fmtDate(d.exercise, c) }))}</span><span class="pg"><b>${n}</b> / ${kind === "main" ? String(mains).padStart(2, "0") : esc(c.ui.appendix)}</span></footer>`;
    return `<section id="${slide.id}" class="slide slide-${slide.id}" data-id="${slide.id}" data-n="${n}" data-kind="${kind}" data-steps="${slide.steps}" data-seconds="${slide.minutes * 60}" data-label="${esc(label)}" data-section="${esc(SECTION_OF(c, slide))}" aria-roledescription="slide" aria-label="${n} ${esc(label)}">
${chrome}
<div class="body">
${slide.body(d, c)}
</div>
</section>`;
  });
}
