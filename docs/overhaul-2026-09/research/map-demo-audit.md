# Workshop 03 interactive demo: audit and redesign

Scope: `packages/website/public/workshops/datenbereitschaft-fuer-ki/demo.html` (published copy) and its source `scripts/course03/demo/demo.html`, `demo-data.json` and `capture.py`, the publication pipeline in `scripts/course03/`, and every test that touches the demo or the 03 bundle. Date: 2026-09-26. Nothing inside `/home/user/platform` was modified. The two read-only checks were run, and both pass on the current tree:

```
$ node scripts/course03/refresh-published.mjs --check   → "Published Data Readiness workshop is up to date." (exit 0)
$ node scripts/course03/overrides.mjs check             → "Overrides match the published files." (exit 0)
```

Screenshots: `scratchpad/demo-audit/` (`d-*` = 1440x900, `m-*` = 390x844, `deck-*` = deck scenes at 1440x900, `deckm-*` = deck at 390x844). Metrics: `d-metrics.json`, `m-metrics.json`. The visible prose, extracted: `demo-prose.txt`. Scripts: `scratchpad/tmp/demo-audit.mjs`, `demo-blank.mjs`, `deck-scenes.mjs`, `demo-copy.mjs`.

---

## 0. Summary

1. **The demo tells the deck's story without the deck's teaching.** The deck shows the wrong answer, asks the room to vote, explains why April is negative, and only then checks it against the database. The demo stamps `WRONG` and `RIGHT` on both runs the moment you press a button. There is no prediction, no "looks trustworthy" moment, and the reason for the wrong number ("`monthly_revenue` stores each month's change") is buried in a card near the bottom of the page.
2. **The first screen is empty.** On load at 1440x900, the first answer is not visible anywhere. Two 219px cards say `Press "Replay on both".` (496px of cards on mobile). Below them, each lane ends in `Press "Replay the query"…` and a disabled button. Five of six sections start at `opacity: 0` until they scroll into view, or until a 2.5s fallback timer fires, so a full-page capture shows a ~2,900px blank band (`d-02-load-fullpage.png`).
3. **It is too much.** The page is 6.9 screens tall on desktop and 12.6 on a phone before any interaction. It has 39 visible buttons, 1,473 words and six content blocks that repeat each other. The four-layer rule ("guide, define, serve, enforce") appears five times, and the guide/define/serve/enforce verbs appear 20 times in the prose. A 60-line YAML file is dumped in full.
4. **It looks brutalist in exactly the ways the owner dislikes.** 36 elements carry offset "stamp" shadows (27 `box-shadow: Npx Npx 0` declarations), 66 visible elements have 2px or heavier borders, there are rotated rubber stamps (`WRONG`, `RIGHT`, `NO ANSWER`, `DENIED · 42501`), pink and mint fills (`#f7e4dc` / `#e3eee8`), a two-colour H1, 27 uppercase mono labels and 226 mono text nodes.
5. **Several things are broken or misleading.**
   - Guided-tour stops 5 and 6 describe layers that the stepper is not showing, and stepper parts 4 and 5 are never shown.
   - The tour toast covers the thing it explains, both on mobile and on desktop.
   - The "Done" state keeps dead Pause/Next/Stop buttons.
   - Switching the question does not switch the table preview.
   - "Without these layers" disables the stepper without explanation.
   - The check is labelled "definition", but its values come from the kit's database checks (`70_checks.sql`), which the deck correctly calls "Database check".
6. **Redesign: port the deck's grammar to a scrolling page, and keep the hosting.** Keep one self-contained `demo.html` with the embedded JSON block. Rebuild it as six beats that use the deck's own route labels: **Wrong answer · Why it failed · The fix · Ask again · Honest limits · Your turn**.
   - The final state is visible on load, and the prediction vote sits above the check in reading order.
   - Encodings come from the deck: hatch = export tables, ink = approved views, slate = database check, dashed = known gap, Mennige = "look here", green only with an icon and a word.
   - One question (ending MRR) carries the page. Net new MRR and logo churn become two compact "same pattern" rows at the end. The table explorer, all SQL, the full definition and all 22 database checks move into one collapsed "Under the hood" section.
   - Cut: the guided tour, the stepper, the duel, the bar race, the stamps and the duplicate summaries.
7. **Pipeline impact is small if the page stays one file.** Edit `scripts/course03/demo/demo.html`, run `node scripts/course03/refresh-published.mjs`, then run the checks and tests listed in §7 and §8. `refresh-published` rewrites the published `demo.html` and its `bundle-manifest.json` row. It rewrites `ASSET_MANIFEST.json` rows only when a binary asset changes. The kit zip does not contain `demo.html`. New files, new binary types (for example `.png`) or a new font weight each need pipeline edits (§7.4).

---

## 1. How the demo works today

### 1.1 Files and data flow

| File | Role |
|---|---|
| `scripts/course03/demo/demo.html` | **Source** (134,949 bytes, 1,443 lines). Repository-authored. Byte-identical to the published copy. |
| `scripts/course03/demo/demo-data.json` | Captured data (39,720 bytes, pretty-printed). The page does not fetch it. It is embedded, minified, in `<script type="application/json" id="demo-data">` (29,110 bytes). I verified that the embedded copy and the file parse to equal objects. |
| `scripts/course03/demo/capture.py` | Recapture tool. It needs a running PostgreSQL with the kit built (`scripts/course03/builder/kit/builder/warehouse/sql/00_build_all.sql`). It runs the recorded AI SQL (from `lib/model-capture-data.js`) as each reader role, then writes `demo-data.json` and **rewrites the embedded block in `demo.html` by regex** on `(<script type="application/json" id="demo-data">).*?(</script>)`. `--date` defaults to *today*, so pass `--date 2026-09-25` to keep the capture date. |
| `packages/website/public/workshops/datenbereitschaft-fuer-ki/demo.html` | Published copy. It is written only by `refresh-published.mjs` (or by the full export script). |

### 1.2 Page composition (source bytes)

| Part | Size | Note |
|---|---|---|
| CSS (one `<style>`) | 41,292 B, about 527 rules | Five stacked layers that override each other: base, `dv-` "visual overhaul", `.sx-` semantic section, `.tr-` guided tour, and "review fixes" / "integration". `.btn`, `.qcard`, `h1` and `header.top` are each defined two or three times. |
| JS | 21,451 + 6,399 + 10,112 + 1,331 B | Four IIFEs. The `dv-` layer monkey-patches `renderResult` and `setCase`. Run buttons are cloned to strip old listeners. The tour drives the page by clicking its buttons (`click("#run-both")`, and an `sxNext()` that finds a button whose text starts with "Next"). |
| Markup | 24,477 B | Some hard-coded values duplicate the data: `expText()` G01/G03 strings, the G03 explanation ("acct_id … A and N … 23 August 2026 … 0 of 0"), and the footer date "25 September 2026" and "144 business accounts". |
| Embedded JSON | 29,110 B | All of the data. |

### 1.3 Page structure (desktop, top to bottom)

| # | Block | Top (px) | Height (px) | Interactions |
|---|---|---|---|---|
| | Shared material strip (`wf-strip`) | 0 | 131 (183 on phone) | 3 material tabs, back links |
| | Sticky tour bar (`#tr-bar`) | 131 | 68 (64 on phone), sticky | "Play the demo", 6 chapter chips |
| 1 | Hero: two-tone H1, lede, question card, 3 question chips, "Replay on both", "Check both against the definition", duel (Run 1 vs Run 2), hidden bar chart | 199 | 832 (1,484 on phone) | 5 buttons |
| 2 | Two lanes: each has 1) relation chips + sample table, 2) SQL + "Replay the query", 3) result + "Check against the definition" | 1,117 | 1,392 (3,136 on phone) | 7 + 5 relation chips and 4 buttons |
| 3 | "Try a forbidden read" band | 2,553 | 328 | 1 button |
| 4 | "The written definition (semantic layer)" band: full `metric.yml` block + view comment | 2,910 | 1,107 | none |
| 5 | "How the AI finds the right answer" (`.sx-`): a second question card (logo churn), a Without/With toggle, a 5-station stepper, a stage with prose and a code pane, Back/Next/Play all, two outcome cards, and 4 takeaway cards | 4,048 | 1,308 (2,128 on phone) | 10 buttons |
| 6 | "What made the difference": 4 numbered boxes + rule sentence | 5,420 | 383 | none |
| | Provenance footer, material footer | 5,819 | | |

Document height: **6,166px desktop (6.9 screens), 10,609px phone (12.6 screens)**, before any result is rendered.

---

## 2. Audit

Evidence is from the screenshots in `scratchpad/demo-audit/`. The measured values come from the Playwright runs.

### 2.1 What is empty (the "large blank area before interaction")

| Where | What you see on load | Evidence |
|---|---|---|
| Duel cards (the first thing below the question) | Two bordered cards, 219px tall (496px stacked on a phone), each saying `Press "Replay on both".` The "vs" disc sits between them. No number is visible until you press the red button. | `d-01`, `d-03`, `m-03` |
| Bar chart | `hidden` until a run. The slot jumps in (+270px) after "Replay", which pushes everything down. | `d-06` |
| Lane step 3 "Result and check" | `Press "Replay the query" to show the rows PostgreSQL returned.` plus a disabled "Check against the definition" button, twice. | `d-00-fullpage-settled` |
| Forbidden-read result column | Only a caption until pressed. | `d-18` |
| Scroll-reveal sections | `.fx` sections start at `opacity: 0; translateY(16px)`: both lanes, the forbidden band, the definition band and the diff band. At 300ms after load, 5 of 6 `.fx` blocks measured `opacity: 0`. A full-page capture at 1.5s shows a **~2,900px empty band** between the duel and "Behind the answer". Print, anchor jumps and fast scrolls hit the same gap. | `d-02-load-fullpage`, `demo-blank.mjs` output |
| Stepper code pane | The dark pane is 340px tall, with 3 to 4 code lines centred vertically (`justify-content: center`), so it reads as a big black void on parts 1 and 5. | `d-21`, `d-25` |
| Phone first screen | Chrome takes 247px (29% of 844px): the material strip is 183px and the sticky bar 64px. The first control that produces an answer ("Replay on both") is at y = 958, below the fold. | `m-01`, `m-metrics.json` |

Net effect: **the page's first 1,000px contain the question and no answer.** The design direction (§8 row 16) and the workshop standard (§3.3 #5, "final state visible on load") both require the opposite.

### 2.2 What confuses

1. **Two questions at once.** The hero holds "Show ending MRR by month…". Section 5 introduces a second question card, "What was logo churn rate by customer segment…", and tells the reader to "Pick 'Logo churn' above to see the same question fail". The reader has to scroll up, switch, and come back.
2. **Three names for one thing.** "Run 1 / Run 2", "Export lane / Approved lane", "Raw export tables (what the AI saw on the first run)". The deck uses two names: "export tables" and "approved views".
3. **"Check against the definition" is mislabelled.** The expected values come from `D.checks[id].expected`, the kit's database checks (`70_checks.sql`), and the note says "Source: the kit's database check G01". The deck calls this "Database check" and draws it in slate. The demo also shows the definition YAML separately, so "definition" means two different things on the page.
4. **Verdicts with no reason.** `WRONG` appears on Run 1 at the same moment as its numbers. The page never says in the hero why −19,960 is wrong. The explanation ("These are each month's change, not the level") appears only in section 5, and only after clicking "Without these layers".
5. **The table preview does not follow the question.** On G03 the "touched by the SQL" outlines move to `acct_history` and `customer_master`, but the open preview stays on `monthly_revenue`. The approved lane stays on `mrr_summary_monthly` while its SQL reads `logo_churn_by_segment_quarter` (`d-15`).
6. **The "Without these layers" toggle is a dead end.** It greys out 4 of 5 stations, disables Back/Next/Play all, and swaps the outcome cards. It doesn't let you step through what happens without the layers (`d-28`, `d-29`).
7. **The guided tour says one thing and shows another.**
   - Stop 5's caption covers "CLAUDE.md and the Skill guide the AI. The semantic layer defines the metric.", but the stepper only advances to part 2 (Skill).
   - Stop 6's caption covers "approved views serve… grants enforce", but the stepper shows part 3 (Semantic layer).
   - Parts 4 (approved view) and 5 (grant) are never shown in the tour (`d-36`, `d-37`).
8. **The tour hides its own subject.** The 166px toast is fixed at the bottom. On desktop it covers the lanes' check buttons (stop 3) and the stepper stage (stops 5 and 6). On a phone, stop 3 shows only the export lane: the approved lane is 1,500px further down, so "Watch which run holds up" cannot be watched. At stop 5 the toast covers the whole stage (`m-39`, `m-41`).
9. **The "Done" state is broken.** After the last stop it says "That was the whole demo. Scroll back up to try each step yourself." but keeps Pause / Next step / Stop, which do nothing, and a half-filled timer bar (`d-39`).
10. **The G03 bar chart carries no information.** It shows three identical 10.0 % bars next to three "ERROR 42703: no value" rows, with a "Line = zero" legend (`d-14`).
11. **Jargon without introduction.** `search_path`, `SQLSTATE`, `grant`, `login`, `Skill`, `semantic layer`, `70_checks.sql` and `definition 1.0.0` all appear before or without a plain explanation. The deck introduces one term per scene.

### 2.3 What is too dense

- **39 visible buttons** on load, for a 10-minute demo: tour 7, question chips 3, hero actions 2, relation chips 12, lane actions 4, forbidden 1, stepper 10.
- **The same verdict three times** for G01: in the duel ("Does not match the definition: 0 of 3 match."), in the lane cells (`DOES NOT MATCH` ×3) and in the lane summary. Then a fourth time in the definition band.
- **Four-layer summary five times**: the `sx` lede, the four `sx-take` cards, the four "What made the difference" boxes, the bold rule sentence, and tour stop 7.
- **A 60-line YAML dump** (`definitions.ending_mrr`) in a 1,107px band. The deck turns the same content into four questions (Kind of number? Rows per what? Which months? Which table?).
- **Lanes are 1,392px columns.** The answer (step 3) comes after a relation list, an 8-row sample table and a 12 to 45-line SQL block. On a phone the two lanes stack to 3,136px.
- **Copy rhythm.** 111 prose sentences, 30 of them four words or fewer (27%): "Asked twice.", "Read-only.", "It sounds simple.", "No guessing about columns.", "The database says no.", "Helpful, not a lock.". The slop spec (§3.2) allows at most two short sentences in a row.
- **Staged contrasts and aphorisms**: "The prompt did not stop it; the grant did.", "It is guidance. It does not lock anything.", "This is the only layer that cannot be talked around.", "Instructions guide. The semantic layer defines. Approved views serve. Grants enforce." The last one appears three times in near-identical form. The deck spends two contrasts in 2,600 words; the demo spends more than six in 1,054 words of prose.

### 2.4 What looks brutalist

| Pattern | Count / where | Deck equivalent |
|---|---|---|
| Offset stamp shadows (`box-shadow: 3px 3px 0`, `6px 6px 0`, `8px 8px 0`) | 36 elements: question card, chips, buttons, both duel cards, the bars box, both lanes, route nodes, all three bands, stepper cards, outcome cards, tour controls, toast | None. The deck is flat (`tokens.css`: `border-radius: 0`, no shadows) |
| Hover "lift" (`translate(-2px,-2px)` plus a bigger shadow) | `.btn`, `.chip`, `.sx-btn`, `.tr-play` | None |
| Rotated rubber stamps (`rotate(-6deg)`, scale-in bounce) | `WRONG`, `RIGHT`, `NO ANSWER`, `DENIED · 42501`, `right`/`wrong`/`no answer` in the outcome cards | The deck's `.stamp` is upright: ink border, icon plus word, used for a single conclusion ("Right answer to a different question.") |
| Red = bad, green = good, with pastel fills | Red lane bar, red numbers, red bars, `#f7e4dc` pink cells; green lane bar, green numbers, `#e3eee8` mint cells | Hatch = export tables, ink = approved views, slate = database check. Mennige means "look here now, never good or bad". Green only for "Matches", always with icon and word (`tokens.css` comment) |
| Box in box in box | band → body → step → table; lane → header → route node; stepper card inside stepper track inside section | One containment layer; lines and space inside (design direction §6) |
| Two-colour display H1 | "One question, **two databases.**" | Single-colour scene titles |
| Mono uppercase chrome | 27 uppercase leaf labels, 226 mono leaf text nodes ("RUN 1", "EXPORT LANE", "1 TABLES THIS LOGIN CAN SEE", "PART 3 · DEFINES") | Sentence-case 600-weight sans labels; mono only for data |
| Heavy route nodes with packet animation | `AI → login → 7 export tables` pills with shadows and a travelling red dot | `bk-strip`: three square icon nodes on a thin dashed edge |
| "vs" disc | A black 48px circle between the runs | None. The deck puts the run and the database check side by side, joined by `=` connectors |

### 2.5 What does not land

- **No moment of doubt.** The deck's core move is "Looks trustworthy: ran without errors, valid SQL, column named `ending_mrr`, three tidy rows", followed by "Put this in the board pack? Trust / Challenge / Refuse". A convincing wrong answer is the lesson. The demo labels the answer `WRONG` before the learner has formed a view.
- **No "right answer to a different question".** The most striking fact in the data is not shown: the AI's three values are exactly the approved view's `net_new_mrr_eur` for April, May and June, and they add up to the quarter's net new MRR of €32,380. It all sits in `demo-data.json` (`lanes.ready.relations[mrr_summary_monthly].rows`, `checks.Q02`).
- **No known gaps.** The approved run is presented as `RIGHT`. The deck is more honest: "Known gap: did not cite the metric definition." and "Known gap: SQL needed a connection setting to find the view." Both are backed by data: `model-capture-data.js` gives `summary.ready.metricCitationPasses = 0` of 3, and the G01 ready SQL uses the unqualified `mrr_summary_monthly` with `searchPath: analytics`.
- **The "honest no" is half there.** The demo shows the database denial but not the course rules that ask back ("Which MRR?") or refuse before any query ("Profit by plan?", "customer emails"). The deck calls these "Two locks: refuse early, enforce anyway."
- **Motion is decoration.** The page has typewriter SQL, count-up numbers, travelling packets, stamp bounces, row slide-ins, bars growing and a pinging dot. None of it shows cause and effect. The deck's motion is causal: the packet travels to the picked table, then the truth bars grow to scale.
- **Mobile is a long scroll of boxes.** 12.6 screens, horizontal code overflow, numbers with no separators ("-19,960 9,775 42,565" in one row) and G03 rates wrapping as "4 of 40 = / 10.0 %" (`m-07`, `m-19`). The phone is where the demo should beat the deck: the deck on a phone asks you to rotate (`deckm-failure-anatomy-s5.png`).

### 2.6 Bugs and inconsistencies (fix even if nothing else changes)

1. Tour stops 5 and 6: the caption and the stepper state don't match, and stepper parts 4 and 5 are never shown (`d-36`, `d-37`).
2. The tour "Done" state keeps inert controls and a frozen timer (`d-39`).
3. The table preview doesn't follow the selected question's SQL (`d-15`).
4. The `.fx` reveal leaves sections invisible for up to 2.5s, and indefinitely in some print and capture paths.
5. Hard-coded copy duplicates data: `expText()` for G01 and G03, the G03 cause paragraph, the footer's capture date and account count.
6. Numbers show no currency, and the minus is a hyphen (`-19,960`). The deck uses `−€19,960`.
7. Terminology: "Check against the definition" versus the deck's "Database check".
8. On a phone, the material rail is scrolled so the first tab reads "rse", and the chapter chips collapse to bare digits "2 3 4" (`m-01`).

---

## 3. Deck versus demo (same story, four scenes)

Deck screenshots: `deck-bad-ask-s0…s4`, `deck-failure-anatomy-s0…s5`, `deck-ready-rematch-s0…s3`, `deck-honest-no-s0…s5` (1440x900), and `deckm-*` (phone, final steps).

| Deck scene | What the deck does | What the demo does | What to take |
|---|---|---|---|
| **bad-ask** "The AI's answer from the export tables" (5 steps) | Question card (ink bar, icon). Strip: Question → AI → Export tables. `ev-run` card "Recorded AI run · one run · Picked: `monthly_revenue`" with Apr −€19,960 / May €9,775 / Jun €42,565 and "An observation, not a benchmark." "Looks trustworthy" checklist with four pass ticks. Room vote "Put this in the board pack? Trust · Challenge · Refuse". "Remember your hand. Next: we check it against the database." | Empty duel until a click, then `WRONG` and the verdict at once. No checklist, no vote. | The whole sequence: answer, why it looks fine, a prediction, then the check. The `ev-run` card, and currency with a real minus sign. |
| **failure-anatomy** "Why is April negative?" (6 steps) | Truth chart. Hatch bars (AI run, drawn ×3 taller) and a callout "Ending MRR can't be negative here." Vote: "What did the AI calculate? Month-end balances with a bug · Each month's change". Cause: "`monthly_revenue` stores each month's change: new + expansion − contraction − churn". "Nobody wrote these down": Kind of number? Rows per what? Which months? Which table? Then the slate database bars appear on the true scale with "Doesn't match". Sum: −€19,960 + €9,775 + €42,565 = **€32,380** = database net new MRR, and "Right answer to a different question." | A red/green bar race with no question posed. The explanation is hidden in the "Without these layers" state. There are no four blanks; the full YAML is dumped instead. | The headline as a question. The chart encodings (hatch / slate / zero line). The cause card, the sum card and the four blanks. They set up the fix. |
| **ready-rematch** "The same question on the approved views" (4 steps) | Question card stamped "Unchanged". `ev-run` (approved, "Picked: MRR summary by month") and `ev-db` (Beton, inset outline) joined by three `=` connectors. Three "Matches" marks and a "Values match" chip. Two dashed "Known gap" chips. | `RIGHT` stamp, green numbers, mint cells. No gaps. | The `=` pairing, the "Unchanged" stamp and the known gaps. "An observation, not a benchmark." |
| **honest-no** "When the AI should ask back or refuse" (6 steps) | Four requests. A "Course rules" panel: "Ask back: which MRR?", "Refuse: no cost data", "Refuse before any query". A forced private read runs into the isometric permission wall: "Database denies it". Closing stamp "Two locks: refuse early, enforce anyway." with the small print "Course rules and database checks, not AI runs." | Only the forced read, as a band with a `DENIED · 42501` stamp and a pink error box. | Two locks, with the small print. The rule answers need a data addition (§6.3). |

In general, the deck does these things better:

- One idea per scene, and the scene title states it as a sentence or a question.
- Progressive disclosure: something to believe, then something to doubt, then the evidence.
- One visual grammar used everywhere: hatch, ink, slate, dashed, and Mennige for focus.
- Honest scope labels placed where the claim is.
- Generous space (2 to 4 objects per view).
- Flat surfaces, thin ink lines, square pictograms.
- Sentence-case sans labels.

The demo's advantages are real but unused. It can show the actual rows, the actual SQL and the actual view comments; it works on a phone; and it lets the learner act.

---

## 4. Redesign

### 4.1 Principles (from the deck, the design direction and the workshop standard)

1. **One question carries the page:** "Show ending MRR by month for the last complete quarter." The other two captured questions come at the end as proof that the pattern repeats.
2. **Final state on load.** Every number, chart and verdict renders without JS and without a click. JS adds the vote, a replay, disclosure toggles and the progress indicator. Nothing starts at `opacity: 0`.
3. **Predict, then check, in reading order.** The vote is in beat 1, and the check is in beat 2, below the fold on desktop and on a phone. A learner who reads top-down votes before seeing the answer. A learner who skips is not blocked.
4. **The deck's encodings and components, rescaled for the web** (not the stage-pixel `story.css`): `q-card`, `ev-run`, `ev-db`, `eq`, `chip--pass`, `chip--fail`, `chip--gap`, upright `stamp`, `route`, the chart classes and hatch.
5. **Six beats with the deck's route labels:** Wrong answer · Why it failed · The fix · Ask again · Honest limits · Your turn. These are the same labels as the deck chrome (`deck-bad-ask-s0.png`), and they match the learner guide's sections (`#question #wrong #fix #limits #five-boxes`).
6. **Flat, lines not boxes.** Zero offset shadows, radius 0, and at most one bordered layer. Surfaces: Kalkweiß `#f3f0e9` page, Papier `#f2f1ee` cards, Beton `#e5e4e2` for the database check and the vote band.
7. **Copy follows the voice spec** (`research/slop-language.md` §3): full sentences with an actor and a verb, numbers with € and a true minus, one contrast per page at most, no repeated summaries.

### 4.2 Page skeleton

```
┌ shared material bar (not sticky; §7.7 of design-direction: text tabs Deck · Guide · Demo, "← Workshop page", DE|EN) ┐
│ Workshop 03 · Interactive demo · 10 minutes                                             (label, Schiefer)         │
│ Ending MRR, asked twice                                                                  (H1, one colour, 700)     │
│ In August 2026 an AI answered one question about FOLDLINE, a made-up software company with 144 business accounts. │
│ The first run read seven raw export tables. The second read five approved views. This page replays both runs.     │
│ Replayed data: AI runs recorded 23 Aug 2026, SQL re-run on PostgreSQL 16.13 on 25 Sep 2026. No AI or database is called. │
│ ■────□────□────□────□────□   Wrong answer · Why it failed · The fix · Ask again · Honest limits · Your turn          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
  beat 1 … beat 6, each: Kopflinie (2px ink top rule) → "1 of 6" label → H2 (deck scene title) → content
  Under the hood (collapsed)
  Provenance (from data)
```

- **Route:** on desktop (≥ 900px) it becomes a sticky 44px bar once the header scrolls away. It has six square stations; the current one is filled with an inset square, past ones filled, future ones outlined, as in `story.css .route`. Each station is an anchor link. The current station comes from an IntersectionObserver, with `aria-current="step"`. On a phone the route is **not** sticky: it stays at the top as a wrapped two-line list, and each beat shows "2 of 6 · Why it failed" in its label. Chrome takes at most about 6% of the viewport.
- **Width:** max 1200px (`--wf-max`), a 12-column grid with 24px gaps, and a 64ch reading measure.

### 4.3 The beats

Time budget: 1 → 2 min, 2 → 3 min, 3 → 2 min, 4 → 1 min, 5 → 1 min, 6 → 1 min. Total 10 min, which matches the material label "Interactive demo · 10 min" that the tests assert.

#### Beat 1 · Wrong answer — "The AI's answer from the export tables"

Desktop:
```
┌ q-card (Papier, 1px ink, 6px ink left bar, i-question) ──┐   ┌ ev-run (Papier, 1px ink) ───────────────────────────┐
│ Show ending MRR by month for the last complete quarter.  │   │ [i-ai-model] Recorded AI run · export tables        │
│ Clock 1 Jul 2026 09:00 UTC · last complete quarter Apr–Jun│  │ [i-export] Picked: monthly_revenue                  │
└──────────────────────────────────────────────────────────┘   │ ─────────────────────────────────────────────────── │
Looks trustworthy                                              │ April                                  −€19,960     │
 [✓] Ran without errors                                        │ May                                      €9,775     │
 [✓] Valid SQL                                                 │ June                                    €42,565     │
 [✓] Column named ending_mrr                                   │ One recorded run. An observation, not a benchmark. │
 [✓] Three tidy rows                                           │ ▸ Show the SQL the AI wrote                         │
                                                               └─────────────────────────────────────────────────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  2px ink
░ Would you put these three numbers in the board pack?        □ Trust them    □ Ask for a check    □ Refuse          ░  Beton band
░ Your choice stays on this page.                              (after a choice) "Noted. Beat 2 checks it."           ░
```
- Grid: q-card and checklist in columns 1 to 6, `ev-run` in columns 7 to 12, and the vote band at full width.
- **Interactions:** one radio group (`fieldset`/`legend`, square custom radios, rows at least 44px tall, no submit button). "Show the SQL" is a native `<details>`.
- **States:**
  - (a) Default, no JS: the vote renders as a static question with its three options, as text.
  - (b) Choice made: the selected row goes to 600 weight with an ink square, and an `aria-live` line appears. The choice is echoed in beat 2's lead. It is kept in memory only; `sessionStorage` wrapped in try/catch is optional.
- **Motion (optional):** when the card first enters view, the three values count up from 0 in 600ms (`--m-count`), once. Final values are in the HTML.

#### Beat 2 · Why it failed — "Why is April negative?"

```
Lead: "You chose Trust." (only if voted) The database check disagrees on all three months.
┌ Truth chart (SVG, cols 1–7) ───────────────────────────────┐  ┌ cause (cols 8–12) ─────────────────────────────────┐
│        €334,675     €344,450       €387,015                 │  │ [i-change] monthly_revenue stores each month's      │
│        ████         ████           ████   slate = database  │  │ change: new + expansion − contraction − churn.      │
│ ▨ −€19,960  ▨ €9,775     ▨ €42,565         hatch = AI run   │  │ The approved view has that change as its own column:│
│ ─────────────────────────────────── zero line (3px ink)    │  │ net_new_mrr_eur  Apr −19,960 · May 9,775 · Jun 42,565│
│  April        May           June                            │  ├────────────────────────────────────────────────────┤
│ [Ending MRR can't be negative here.]→ April (Mennige mark)  │  │ −€19,960 + €9,775 + €42,565 = €32,380              │
│ ▨ Recorded AI run · export tables  ■ Database check  [✗ Doesn't match] │ = net new MRR for the quarter (check G02)          │
└─────────────────────────────────────────────────────────────┘  │ [stamp] Right answer to a different question.       │
                                                                  └────────────────────────────────────────────────────┘
Nobody wrote these down.
┌ [i-level] Kind of number?  ? ┐┌ [i-rows] Rows per what?  ? ┐┌ [i-calendar] Which months?  ? ┐┌ [i-view] Which table?  ? ┐
                                                                                      text button: "Replay the check"
```
- **Chart:** real scale. The deck's step-0 "×3 taller" trick is not needed because the value labels carry the small bars. Encodings: hatch fill with an ink stroke for the AI run, `--slate-soft` fill for the database check, a 3px ink zero line, one Mennige outline on April only, and a "Doesn't match" chip with `i-fail`. A visually hidden `<table>` gives the same numbers for screen readers. The SVG has `role="img"` and an `aria-label`.
- **Interactions:** "Replay the check" (text button) replays in 1.2s: hatch bars grow → callout → slate bars grow → chip. The final state is the default.
- **States:** default (final); replaying (non-interactive for 1.2s, `aria-busy`). Reduced motion: the replay button is hidden.

#### Beat 3 · The fix — "What the AI read the second time"

```
The four blanks, filled from one file: semantic/metric.yml · ending_mrr · version 1.0.0 · owner revenue_analytics
┌ Kind of number? ─────────┐┌ Rows per what? ───────────┐┌ Which months? ───────────────┐┌ Which table? ────────────────┐
│ A month-end level        ││ One per complete          ││ Each complete month-end.     ││ analytics.mrr_summary_monthly│
│ (a snapshot).            ││ calendar month.           ││ Never add month-ends.        ││ column ending_mrr_eur        │
│ type: snapshot           ││ result_grain: one row per ││ period_rule: For a quarter,  ││ relation: analytics.mrr_…    │
│                          ││ complete calendar month   ││ return each complete month-end││ expression: ending_mrr_eur  │
└──────────────────────────┘└───────────────────────────┘└──────────────────────────────┘└──────────────────────────────┘
Where each part lives                                                       (ledger: hairline rows, no boxes)
 Instructions   CLAUDE.md and the Skill tell the AI to read this file first. They guide the AI but lock nothing.
 Definition     semantic/metric.yml, the file above. People, tests and the AI read the same file.
 Approved view  analytics.mrr_summary_monthly, 18 rows, one per complete month. Its comment: "Never add ending_mrr_eur across months."
 Permission     foldline_ready_reader may read 5 views and nothing else. (Database check B-P01: pass)
▸ The full definition (metric.yml)       ▸ The view's SQL
```
- The four blanks reuse beat 2's icons and positions, so the learner sees each "?" answered.
- This replaces the 5-station stepper, the "Without/With these layers" toggle, both takeaway grids, the definition band and the "What made the difference" band.
- **Interactions:** two `<details>` only.
- **States:** static.

#### Beat 4 · Ask again — "The same question on the approved views"

```
┌ q-card small ── Show ending MRR by month for the last complete quarter.  [Unchanged] ┐
┌ ev-run (Papier) ───────────────────┐        ┌ ev-db (Beton, inset 1px outline) ───────────────┐
│ Recorded AI run · approved views   │        │ Database check G01 (kit, 70_checks.sql)          │
│ Picked: mrr_summary_monthly        │        │ [✓ Values match]                                  │
│ April           €334,675 ──[=]──── │ €334,675                           [✓] Matches          │
│ May             €344,450 ──[=]──── │ €344,450                           [✓] Matches          │
│ June            €387,015 ──[=]──── │ €387,015                           [✓] Matches          │
│ One recorded run. An observation, not a benchmark.  ▸ SQL                                             │
[⌗ dashed] Known gap: the AI did not cite the metric definition (0 of 3 runs).
[⌗ dashed] Known gap: the SQL names mrr_summary_monthly without "analytics.", so it only worked because the login's search path pointed there.
```
- **States:** static. Green appears only in the "Matches" chips, each with `i-pass` and the word.

#### Beat 5 · Honest limits — "When the AI should ask back or refuse"

```
Left (cols 1–6): Course rules answer before any query            Right (cols 7–12): The database enforces anyway
 How much MRR?                → Ask back: which MRR?              The AI, logged in as foldline_ready_reader, tries:
 Profit by plan?              → Refuse: no cost data               SELECT account_name, contact_email FROM core.accounts LIMIT 1
 Customer emails + lifetime value → Refuse before any query        ERROR 42501: permission denied for schema core
 (course rules, not AI runs)                                       No rows left the database. (Database check D01: pass)
[stamp i-shield] Two locks: the rules refuse early, and the database enforces anyway.
```
- The left column needs the rule data (§6.3). If that data is not added, show only the right column. Also link the deck scene `slides.html#honest-no/5` with the text "See the four requests in the course".
- **Interactions:** none. The final state is shown.

#### Beat 6 · Your turn — "Same pattern, and your own question"

```
Two more questions, same setup                                         (ledger rows; each row expands with <details>)
 Net new MRR, last complete quarter   AI on export tables  −€17,595   Database check  €32,380   [✗ Doesn't match]
   June's change (€42,565) minus March's change (€60,160). The right figure is €387,015 − €354,635.
 Logo churn rate by segment           AI on export tables  no answer  Database check  4 of 40 = 10.0 % in each segment
   ERROR 42703: column ah.id does not exist. The table calls it acct_id, and its states are codes like A and N, not "active".
Try it on your own question
 → Fill the five boxes for one question you get asked at work (learner guide, 10 min)          guide.html#five-boxes
 → Open the same scenes in the course: Wrong answer · Why it failed · Ask again · Honest limits  slides.html#bad-ask/4 …
▸ Under the hood: tables, SQL and all 22 database checks
```
- **Under the hood** (collapsed) contains:
  - The table explorer: two columns with relation lists and row counts. Selecting a relation shows its comment, or "No description" for export tables, plus the 8 sample rows. It defaults to the relation the G01 SQL reads.
  - The full SQL of all six runs.
  - The forbidden query.
  - The 22 database checks as a table: id, kind, expected, result, and `_summary`.

  This keeps everything a data person wants, out of the main path.
- **Provenance** (from data): "AI runs recorded on {recordedOn}. Their SQL was run again as the matching reader login on PostgreSQL {postgres major.minor} on {capturedOn}. Database checks: {checks._summary}. All data is synthetic; FOLDLINE has {customer_master.rowCount} business accounts."

### 4.4 Mobile (390x844)

- **Single column** in reading order: the q-card, then `ev-run`, then the checklist, then the vote.
- **Numbers:** right-aligned in labelled rows (`April … −€19,960`), never three numbers side by side.
- **Material bar:** at most 2 rows (~96px), not sticky. The route is not sticky either.
- **Truth chart:** a 100%-wide SVG (viewBox about 360x240) with three month groups of two bars. Value labels sit above the bars in 13px, and the April bar hangs below the zero line with its label under it. The callout moves above the chart.
- **Cause and sum cards** stack. **The four blanks** form a 2×2 grid, and the filled answers in beat 3 use the same grid.
- **Beat 4** becomes one table: Month | AI run | Database check | ✓. The `=` connectors are dropped on a phone.
- **Code and YAML** live only inside `<details>`, at 12.5px mono with horizontal scroll and a right-edge fade.
- **Targets:** at least 44px. Body text 17px, labels 14px, captions at least 13px.
- **Budget:** page height at most 6 screens (about 5,000px) with all `<details>` closed. Today it is 12.6 screens before interaction.

### 4.5 Motion

Motion is limited to three causal moments: the count-up in beat 1, the check replay in beat 2, and one route-station fill. It uses the deck tokens (`--m-count 600ms`, `--m-grow 520ms`, ease-out `cubic-bezier(0.16,1,0.3,1)`) and runs in one region at a time. With `prefers-reduced-motion: reduce` there is no motion and the replay button is hidden. There is no scroll-reveal that hides content: an animation only ever plays from a state the element also has in CSS without JS.

### 4.6 Visual tokens and components (inline in `demo.html`)

- **Colours:** copy the values from `lib/tokens.css`: `--paper #f3f0e9`, `--papier #f2f1ee`, `--beton #e5e4e2`, `--leinen #d4cec5`, `--ink #121212`, `--slate #4f4640`, `--slate-soft #655c54`, `--mennige #b73a15`, `--mennige-deep #97300f`, `--pass #205b46`.
  - Don't link `lib/story.css`. It is sized for a 1920px stage with absolute positions (for example `.room-vote { position:absolute; top:776px }`).
  - Don't edit `lib/tokens.css`. It is an exported file under override control.
- **Type:** Typing 400/500/700 from the already-published woff2 files. For 600-weight labels, either use the published `assets/fonts/Typing-Static-600.ttf` (no pipeline change), or add `Typing-SemiBold.woff2` (§7.4).
- **Pictograms:** copy about 16 `<symbol>`s from the `slides.html` sprite into an inline `<svg hidden>`: `i-question`, `i-ai-model`, `i-export`, `i-view`, `i-database`, `i-pass`, `i-fail`, `i-gap`, `i-change`, `i-level`, `i-rows`, `i-calendar`, `i-shield`, `i-deny`, `i-clarify`, `i-refuse`. Include the `#story-hatch` pattern for the chart.
- **Components:**
  - `q-card`: Papier, 1px ink, 6px ink left bar, 40px icon.
  - `ev-run`: Papier, 1px ink.
  - `ev-db`: Beton, 1px ink plus a 1px inset outline at −6px.
  - `eq`: 32px square with "=".
  - `chip`: 36px tall, 1px ink, icon plus word. Variants: pass, fail, dashed gap.
  - `stamp`: upright, 2px ink, icon plus sentence, used once per beat at most.
  - `route`: square stations on a 2px line.
  - Vote band: Beton, 2px ink top rule.
- **Budgets and acceptance checks for the rebuild:**
  - 0 offset shadows.
  - At most 1 Mennige group per viewport.
  - At most 12 buttons in the main path (Under the hood excluded).
  - At most 700 words in the main path.
  - No element starts at `opacity: 0`.
  - All numbers present in the no-JS DOM.
  - Single-colour H1.
  - At most 1 containment layer.
  - No uppercase except abbreviations.
  - Mono only for table, column and SQL names and values.
  - Body copy passes the voice budgets in `slop-language.md` §3.2.

### 4.7 Copy samples (voice spec applied)

| Place | Current | Proposed |
|---|---|---|
| H1 | One question, **two databases.** | Ending MRR, asked twice |
| Lede | One question about FOLDLINE's revenue. Asked twice. On raw export tables the AI gets the wrong answer. On approved views it gets the right one. Below you can see why. | In August 2026 an AI answered one question about FOLDLINE, a made-up software company with 144 business accounts. The first run read seven raw export tables, the second read five approved views. This page replays both runs and checks them against the database. |
| Beat 1 vote | (none) | Would you put these three numbers in the board pack? |
| Beat 2 cause | These are each month's change, not the level. A level cannot be negative here. | `monthly_revenue` stores each month's change: new plus expansion minus contraction minus churn. The approved view keeps that change in its own column, `net_new_mrr_eur`, with the same three numbers. |
| Beat 2 verdict | WRONG (stamp) | Right answer to a different question. (Deck wording, kept.) |
| Beat 3 instructions row | It is guidance. It does not lock anything. | CLAUDE.md and the Skill tell the AI to read this file first. They guide the AI but lock nothing. |
| Beat 5 closing | The prompt did not stop it; the grant did. | No rows left the database. The login's permission blocked the read. |
| Takeaway | Instructions guide. The semantic layer defines. Approved views serve. Grants enforce. (×5) | Once, as the four-row ledger in beat 3. |

### 4.8 What to cut

| Cut | Why | Replacement |
|---|---|---|
| Guided tour (`#tr-bar`, `#tr-toast`, 7 stops, auto-advance, Space/Esc handling), about 10 kB JS and 3 kB CSS | Its captions don't match the stepper, the toast covers the content, the Done state is broken, and it duplicates scrolling | The six-beat structure plus the route anchors |
| "Play the demo" / "Replay on both" / "Check both against the definition" / per-lane "Replay the query" / "Check against the definition" / "Replay the forbidden read" | They exist only to fill empty states | Final state on load; one optional "Replay the check" |
| Duel cards, "vs" disc, `WRONG`/`RIGHT`/`NO ANSWER`/`DENIED` rotated stamps | Brutalist, and they judge before the learner thinks | `ev-run` / `ev-db` with chips; one upright stamp for the conclusion |
| Red/green bar race (`#dv-bars`) | Colour-only good/bad, and useless for G03 | The truth chart in beat 2 |
| The two 1,392px lanes as the main path | Too dense; the answer comes last | Beats 1 and 4 in the main path; the explorer under the hood |
| Global question switcher (3 chips) | It splits attention, and the stepper uses a different question | Beat 6 "Two more questions, same setup" |
| "How the AI finds the right answer" (stepper, Without/With toggle, Play all, outcome cards, takeaway cards) | A second topic, repeated summaries, a dead-end toggle | Beat 3 ledger. The workshop standard suggests moving the layer walk-through to the builder guide |
| "The written definition" band with the 60-line YAML | Too dense | The four filled blanks, with the full YAML in `<details>` |
| "What made the difference" band and the bold rule sentence | The fifth repetition | None |
| Typing SQL, count-up everywhere, packet routes, row slide-ins, stamp bounces, the pinging dot, `.fx` scroll-reveal | Decorative motion that hides content | §4.5 |
| Pink and mint cell fills, two-tone H1, mono uppercase labels | Palette and type rules | Tokens in §4.6 |

---

## 5. Data: what drives each part

### 5.1 `demo-data.json` structure (as captured on 2026-09-25)

```
{
  capturedOn:  "2026-09-25"                        capture.py --date (defaults to today; pass it explicitly)
  postgres:    "16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)"   SHOW server_version on the ready db
  company:     "FOLDLINE (synthetic)"
  clockUtc:    "2026-07-01T09:00:00Z"              evaluation clock (hard-coded in capture.py)
  lanes: {
    bad:   { role: "foldline_bad_reader",   searchPath: "public",    relations: Relation[7] }
    ready: { role: "foldline_ready_reader", searchPath: "analytics", relations: Relation[5] }
  }
  cases: Case[3]                                   G01, G02, G03 (recorded AI SQL re-run per lane)
  forbidden: { sql, error: { sqlstate: "42501", message: "permission denied for schema core" } }   run as ready role
  checks: { <ID>: Check, _summary: "DB CHECKS 21 of 21 PASS. 1 SKIP. 0 FAIL." }   parsed from the kit build log
  definitions: { ending_mrr: string, net_new_mrr: string, logo_churn_rate: string }  YAML blocks from builder kit semantic/metric.yml, comments stripped
}

Relation = {
  schema: "public" | "analytics", name, kind: "table" | "view",
  comment: string | null            obj_description; null on every export table
  columns: [{ name, type }]         format_type, attnum order
  rowCount: int                     count(*) as the lane role
  rows: any[][]                     SELECT * ORDER BY 1 DESC, 2 LIMIT 8, aligned with columns
  definition?: string               views only: pg_get_viewdef
}
Case = { id: "G01"|"G02"|"G03", question: string,
         bad:   { sql, columns: string[], rows: any[][] } | { sql, error: { sqlstate, message } },
         ready: { sql, columns: string[], rows: any[][] } }
Check = { kind: "answer"|"deny"|"error"|"access"|"reconcile"|"lineage"|"freshness",
          expected: string, actual: string, result: "PASS"|"FAIL"|"SKIP" }
```

The values that matter:

| Path | Value |
|---|---|
| `lanes.bad.relations` | `acct_history` 1,388 (`acct_id, dt, balance, change, state`; states `N`, `A`…); `billing_events` 334; `customer_master` 144 (`id, seg, country, plan, status, status_dt`); `monthly_revenue` 18 (`dt, segment, amount`, per-segment monthly changes); `subscription_export` 144; `tickets` 60; `usage_log` 378 |
| `lanes.ready.relations` | `account_mrr_monthly` 2,592; `data_status_by_view` 4; `expansion_mrr_by_country_monthly` 144; `logo_churn_by_segment_quarter` 15; `mrr_summary_monthly` 18 (`month_start, ending_mrr_eur, new_mrr_eur, expansion_mrr_eur, contraction_mrr_eur, churned_mrr_eur, net_new_mrr_eur, active_accounts, complete_through_month, data_loaded_at_utc, quality_status`). Sample rows cover 2026-06 back to 2025-11, which includes March 2026 (ending 354,635, net new 60,160) |
| `cases[G01]` | bad: `revenue_month, ending_mrr` → −19,960 / 9,775 / 42,565. ready: `month_start, ending_mrr_eur` → 334,675 / 344,450 / 387,015. The ready SQL uses the **unqualified** `mrr_summary_monthly` |
| `cases[G02]` | bad: `end_of_last_quarter_mrr 42,565, end_of_prior_quarter_mrr 60,160, net_new_mrr −17,595`. ready: `net_new_mrr_eur 32,380` |
| `cases[G03]` | bad: `error { 42703, "column ah.id does not exist" }` (and the SQL compares `state = 'active'`). ready: Enterprise / Mid-Market / SMB, each 40 starting, 4 churned, 10.0 % |
| `checks` | 22 checks plus `_summary`. Answer checks: `G01` "2026-04-01 334675, 2026-05-01 344450, 2026-06-01 387015"; `G02` "32380"; `G03` "Enterprise 4/40=10.0, Mid-Market 4/40=10.0, SMB 4/40=10.0"; `G04`, `G05`, `T01`, `T02`. Deny, error and access checks: `D01` (42501 on core), `B-W01`, `B-T01`, `B-S01` (SKIP), `B-X01`, `B-P01` "5 x SELECT, all on analytics". Reconcile: `Q01`…`Q06`, with `Q02` "354635 + 32380 = 387015; breaks 0; parts 0". Lineage: `Q07`. Freshness: `F00` "3 h, fresh", `F01` "60 h, stale_disclosed" |
| `definitions.ending_mrr` | `type: snapshot`, `relation: analytics.mrr_summary_monthly`, `expression: ending_mrr_eur`, `result_grain: one row per complete calendar month`, `period_rule: For a quarter, return each complete month-end (three rows)…`, `additivity.across_time: none`, `owner: revenue_analytics`, `version: 1.0.0`, `limitations`, `expected_q2_2026` |

### 5.2 Mapping: page part → data

| Beat / part | Fields |
|---|---|
| Header lede and provenance | `company`; `lanes.bad.relations.length` (7); `lanes.ready.relations.length` (5); `customer_master.rowCount` (144); `capturedOn`; `postgres` (major.minor); `checks._summary`; **new** `recordedOn` (§6.3) |
| q-card | `cases[G01].question`; `clockUtc` |
| Beat 1 `ev-run` | `cases[G01].bad.rows` (month from `rows[i][0]`, value from `rows[i][1]`). "Picked" is the relation from `lanes.bad.relations[].name` that appears in `bad.sql` (same regex as today's `markHits`). The SQL goes in `<details>` |
| Beat 1 checklist | "Ran without errors" and "Valid SQL" = `!bad.error`. "Column named `ending_mrr`" = `bad.columns[1]`. "Three tidy rows" = `bad.rows.length` |
| Beat 2 chart | Hatch bars = `cases[G01].bad.rows[*][1]`. Slate bars = `checks.G01.expected`, parsed as `YYYY-MM-DD value` pairs. The "Doesn't match" chip is computed by comparing the two |
| Beat 2 cause card | `lanes.ready.relations[mrr_summary_monthly]`: pick the columns `month_start` and `net_new_mrr_eur` by name lookup in `columns`, then the rows with `month_start` in 2026-04..06. Show that they equal the bad values (the claim is computed, not typed) |
| Beat 2 sum | Sum of `bad.rows[*][1]` = 32,380. Compare with `checks.G02.expected` ("32380"). Reconciliation line from `checks.Q02.expected` |
| Beat 3 four answers | Parse `definitions.ending_mrr` lines with `^\s{4}(type|result_grain|period_rule|relation|expression|version|owner):` (folded `>-` values continue on deeper-indented lines). The plain-language answer text is copy, and the mono source line is data |
| Beat 3 ledger | `lanes.ready.relations[mrr_summary_monthly].comment`, `.rowCount`, `.definition` (in `<details>`); `lanes.ready.role`; `lanes.ready.relations.length`; `checks["B-P01"]` |
| Beat 4 | `cases[G01].ready.rows`; `checks.G01.expected`; per-row equality. Gap 2 = `!/\banalytics\./.test(cases[G01].ready.sql)` plus `lanes.ready.searchPath`. Gap 1 = **new** `recorded.summary.ready.metricCitationPasses` / `trials` (0 of 3) |
| Beat 5 right | `forbidden.sql`, `forbidden.error.*`, `checks.D01` |
| Beat 5 left | **new** `rules[]` (§6.3) |
| Beat 6 rows | `cases[G02]`: bad `rows[0]` (all three columns), ready `rows[0][0]`, `checks.G02`, March and June from the `mrr_summary_monthly` sample rows. `cases[G03]`: `bad.error`; `acct_history.columns` (shows `acct_id`); `acct_history.rows[*][4]` (state codes); `ready.rows`; `checks.G03` |
| Under the hood | Everything in `lanes.*.relations` (explorer), all `cases[*].*.sql`, `forbidden`, all `checks` |

### 5.3 Data the page currently ignores, or duplicates by hand

- **Ignored:** `capturedOn` (the date is typed instead); `company`; `checks.Q02` (the reconciliation that proves the "different question"); `checks.D01` and `B-P01`; `checks.F00` and `F01` (freshness, which could be a beat 5 footnote); `relations[].definition` (view SQL); `data_status_by_view`; `net_new_mrr_eur` in the approved view (the proof of the mix-up).
- **Hand-typed duplicates to remove:**
  - `expText()` (G01: "April 334,675 · May 344,450 · June 387,015"; G03: "4 of 40 = 10.0 %").
  - The G03 paragraph ("acct_id… A and N… 23 August 2026… 0 of 0").
  - The footer's "25 September 2026" and "144 business accounts".
  - The `.sx` fallback values in the markup (334,675 / 344,450 / 387,015; −19,960 / 9,775 / 42,565; "4 of 40 = 10.0 %").

---

## 6. Changes to data and capture (only if the redesign wants them)

### 6.1 Keep the embed contract

The new page must keep exactly `<script type="application/json" id="demo-data">…</script>`: `capture.py` finds it by regex and replaces its content with `json.dumps(…, separators=(",",":"))` plus `</` escaping. It must stay the first such block (`count=1`).

### 6.2 Keep one file

`refresh-published.mjs` publishes only `demo.html` from `scripts/course03/demo/`. A separate `demo.css`, `demo.js` or `demo-data.json` in the published folder would be reported as "unreviewed public file (neither exported nor repository-authored)" unless `overrides.mjs isRepositoryAuthored()` and the `authored` map in `refresh-published.mjs` are both extended.

### 6.3 Optional JSON additions (edit `capture.py main()` so a recapture keeps them)

| Field | Source | Used by |
|---|---|---|
| `recorded: { capturedAtUtc, summary }` | `load_captures()` already returns `FOLDLINE_MODEL_CAPTURES`. `capturedAtUtc` is "2026-08-23T11:49:52.374Z". `summary.ready.metricCitationPasses` = 0, `trials` = 3, `summary.bad.valueCorrectnessPasses` = 0 | Provenance date; known gap 1 |
| `rules: [{ id, question, behavior, message }]` | `lib/replay-data.js` → `FOLDLINE_REPLAY.responses["ready:C01"|"ready:R01"|"ready:R02"].evidence` (`behavior`: clarify/refuse; `message`). Load it the way `load_captures()` loads the model captures. The question labels live in the deck scene (`How much MRR?`, `Profit by plan?`, `Customer emails + lifetime value`) | Beat 5 left column |

If no kit database is available to recapture, add the fields by hand identically in `demo-data.json` and in the embedded block, and add the same lines to `capture.py`. No test compares the two copies, so the author must keep them equal. A three-line Node check can run before `refresh-published`.

---

## 7. Regenerating the published copy and manifests

### 7.1 What `refresh-published.mjs` does

`planRefresh(root)` performs these steps in order:

1. **Checks the overrides.** It runs `checkOverrides(root)`, the same logic as `overrides.mjs check`.
2. **Loads the repository-authored surfaces.** These are the kit `README.md` and `ASSET-RIGHTS.md` and `PUBLICATION.md` (from `published-text.mjs`), `guide.html`, `builder.html`, `demo.html` (from `DEMO_PAGE_SOURCE = scripts/course03/demo/demo.html`), `assets/fonts/Typing-{Regular,Medium,Bold}.woff2` (from `packages/website/src/fonts/typing`), and every file under `scripts/course03/builder/kit/builder`, which becomes `data-readiness-kit/builder/*`.
3. **Reads every published file** except `bundle-manifest.json` and applies these rules:
   - A published builder file that is no longer authored is scheduled for removal.
   - Any file that is neither authored nor listed in `overrides/manifest.json "exported"` is a problem ("unreviewed public file").
   - An exported file that is missing is a problem.
   - A missing `card-preview.webp` is a problem.
4. **Rebuilds the kit zip in memory.** It uses `buildKitArchive(kitArchiveFiles(builderFiles))`: the worksheets, then `README.md` and `ASSET-RIGHTS.md`, then `builder/*`, as a stored, deterministic zip that passes `inspectZipArchive`. `demo.html` is **not** in the zip.
5. **Rejects local paths.** Any text file containing `/Users/` or `/home/` is a problem.
6. **Plans the writes:**
   - every authored file and the zip;
   - `bundle-manifest.json`, written by `bundleManifestText(previous.sourceHashes, files)`: `{version:1, evidenceMode, sourceHashes, files:[{path,sizeBytes,sha256}]}`, sorted, with `sourceHashes` kept;
   - `ASSET_MANIFEST.json`, written by `assetManifestText(root, assetRows(files, portraitRecord(root).record))`. Rows are generated only for `.svg`, `.ttf`, `.woff2`, `.zip` and `.webp`, plus the portrait, which must still match its reviewed hash. The workshop's rows keep their old positions.
7. **Writes only drifted files.** `--check` exits 1 and lists any drift.

A demo-only change therefore rewrites 2 files: `packages/website/public/workshops/datenbereitschaft-fuer-ki/demo.html` and `…/bundle-manifest.json` (the `demo.html` size and sha256). `ASSET_MANIFEST.json` and the zip stay the same unless fonts, SVGs or the kit change.

### 7.2 Commands, in order (repository root)

```bash
# 0. Edit the source only (never the published copy):
#    scripts/course03/demo/demo.html   (keep <script type="application/json" id="demo-data">…</script>)

# 1. Only if the data changes and a kit database is available (writes demo-data.json AND re-embeds into demo.html):
(cd scripts/course03/builder/kit/builder/warehouse && psql -X -v ON_ERROR_STOP=1 -v bad_db=saas_bad -v ready_db=saas_ready -d postgres -f sql/00_build_all.sql) > /tmp/build.log 2>&1
python3 scripts/course03/demo/capture.py --bad-db saas_bad --ready-db saas_ready --build-log /tmp/build.log --date 2026-09-25
#    (PGHOST/PGPORT/PGUSER from the environment; the login must be allowed to create databases and roles.
#     The build log must be outside the repo; capture.py parses its "ID | kind | expected | actual | result" lines
#     and the "DB CHECKS …" summary into checks.)

# 2. Publish the source into public/ and regenerate bundle-manifest.json (+ ASSET_MANIFEST rows, kit zip if affected):
node scripts/course03/refresh-published.mjs

# 3. Verify the publication:
node scripts/course03/refresh-published.mjs --check      # "Published Data Readiness workshop is up to date."
node scripts/course03/overrides.mjs check                # "Overrides match the published files."
node --test scripts/__tests__/course03-publication.test.mjs        # = bun run test:course03-publication
(cd packages/website && npx vitest run src/lib/workshops-data-readiness.test.ts)   # inventory, hashes, local refs, labels
node scripts/scan-public-candidate.mjs                   # = bun run scan:public (ASSET_MANIFEST coverage of binaries)

# 4. Broader gates touching the bundle:
bun run test                                              # website vitest (includes the files in §8)
bun run test:scanner                                      # scan-export tests (JetBrains font path in the 03 bundle)
```

Do **not** run `node scripts/course03/overrides.mjs capture` for a demo change. The demo is repository-authored and never an override. `capture` is only for edits to exported files (`slides.html`, `lib/*`, the lab, the worksheets). `scripts/export-data-readiness-workshop.mjs` needs the external course source and is not part of this workflow; it copies `demo.html` from the same `DEMO_PAGE_SOURCE`.

### 7.3 Constraints the new page must respect

- **Every relative `src`, `href` and `url()`** in `demo.html` must resolve inside the published folder. `workshops-data-readiness.test.ts` checks this. Absolute `/…`, `#…`, `data:` and `http(s):` references are skipped.
- **CSP for static HTML** (from `packages/website/security-headers.ts`, as observed on the dev server):
  - `script-src 'self' 'unsafe-inline'` (plus `'unsafe-eval'` in dev only);
  - `script-src-attr 'none'`, so there can be no `onclick="…"` attributes;
  - `img-src 'self' data:`, `font-src 'self' data:`, `connect-src 'self'`.

  Inline `<script>`, `<style>` and SVG are fine. External fonts and CDNs are not.
- **No local authoring paths** (`/home/`, `/Users/`) anywhere in the file.
- **The shared `wf-strip` block** is "byte-identical in every workshop" by convention, not by test. It appears in `scripts/course03/guide.html`, `scripts/course03/builder/page/builder.html` and `scripts/course03/demo/demo.html`. If the material bar is redesigned (design direction §7.7), change all three sources, then refresh.

### 7.4 When the change is bigger than one file

| Change | Also edit |
|---|---|
| Add `Typing-SemiBold.woff2` | `refresh-published.mjs` line 43 (`["Regular","Medium","Bold"]` → add `"SemiBold"`); `overrides.mjs isRepositoryAuthored` regex (`Typing-(?:Regular|Medium|Bold)` → add `SemiBold`). `assetRows` then adds the ASSET_MANIFEST row automatically. Alternative with no pipeline change: use the already-published `assets/fonts/Typing-Static-600.ttf` |
| A separate `demo.css`, `demo.js` or data file | `overrides.mjs isRepositoryAuthored`, the `authored` map in `refresh-published.mjs`, and a `*_SOURCE` constant in `publication.mjs` |
| A raster image (`.png`, `.jpg`) | `publication.mjs assetRows` covers only `svg|ttf|woff2|zip|webp` (and the portrait). A new PNG would get no ASSET_MANIFEST row and fail `scan:public`. Use inline SVG, or WebP and extend the rules |
| Changing the material label, duration or description | `packages/website/src/lib/workshops-data-readiness.ts` (DE line ~199, EN line ~399) **and** the exact-string assertions in `workshops-data-readiness.test.ts` (§8) |

---

## 8. Every test that inspects `demo.html` or the 03 bundle

From `grep -rn -E "demo\.html|bundle-manifest|datenbereitschaft" packages/website/src packages/website/tests scripts packages/website/scripts`. Non-test hits: `src/lib/workshops-data-readiness.ts` (material entries), `src/lib/analytics/registry.ts`, `src/lib/i18n/content-parity.ts`, `src/lib/learning-graph/data.ts`, and the `scripts/course03/*` sources.

| Test | What it asserts that the demo rebuild can break |
|---|---|
| `packages/website/src/lib/workshops-data-readiness.test.ts` (vitest) | (1) Workshop 03 has exactly three materials `slides.html`, `guide.html`, `demo.html`, all `kind:"html"`, `language:"en"`, each existing on disk. (2) Exact labels `["Course · 26 scenes", "Learner guide", "Interactive demo · 10 min"]` / `["Kurs · 26 Szenen", "Lernbegleiter", "Interaktive Demo · 10 Min."]`, the descriptions' numbers, "90 minutes", "August 2026", no "certified". (3) **Bundle inventory**: every `bundle-manifest.json` entry matches size and sha256, and the folder contains exactly those files plus the manifest. (4) **Every relative `src`/`href`/`url()` in every `.html` and `.css` resolves**. (5) The portrait and its asset record. (6) `lib/demo-adapter.js` starts in replay mode with 0 fetches (deck, not demo). |
| `scripts/__tests__/course03-publication.test.mjs` (`node --test`, `bun run test:course03-publication`, part of `verify`) | `isRepositoryAuthored("demo.html") === true` (and for `guide.html`, `builder.html`, the builder README, the zip, `bundle-manifest.json`); `slides.html`, `lib/deck-stage.js` and the lab are not. `check(root)` returns `[]`. **`planRefresh(root)` has no problems, no drift and no removals**, so the published `demo.html` must equal the source after `refresh-published`. Also the kit-archive determinism and override behaviour tests. |
| `packages/website/src/lib/crawl/contract.test.ts` | Lists static 03 paths (`guide.html`, `builder.html`, `slides.html`, `lib/deck-runtime.js`, `lib/presenter-notes.js`, `lib/story.css`, kit files, the zip) and the `/assets` prefix for crawl rules. It does not list `demo.html`, so renaming or moving deck and lib files would matter, but the demo does not. |
| `packages/website/src/proxy.behavior.test.ts` | Proxy behaviour for static 03 paths (`guide.html`, `lib/presenter-notes.js`, `lib/story.css`, `semantic-template/model.yml`, the zip). The demo is not listed. |
| `packages/website/scripts/open-source/__tests__/scan-export.test.mjs` (`bun run test:scanner`) | Uses `…/datenbereitschaft-fuer-ki/assets/fonts/JetBrainsMono-Static-400.woff2` as a fixture path. Don't remove that font. |
| `packages/website/src/app/workshops/workshops-content.test.tsx` | Hub card id `workshop-datenbereitschaft-fuer-ki` and the nav label "03Data readiness". |
| `packages/website/src/app/workshops/[slug]/workshop-decision-lab.test.tsx` | The detail page decision lab for this slug (registry copy, not the demo). |
| `packages/website/tests/e2e/workshops.spec.ts` | Detail page H1 `/data.*ready for AI/i`, the decision lab, `guide.html` → "Open the interactive course" → deck and presenter pairing, the portrait; the lab at `data-readiness-kit/readiness-lab.html` and the zip response. **No e2e opens `demo.html`.** A rebuild should add one: it loads, shows all G01 numbers without JS interaction, and logs no console errors. |
| `packages/website/tests/e2e/workshop-hydration.spec.ts`, `route-workshops-locales.spec.ts` | Detail routes `/workshops/datenbereitschaft-fuer-ki` and `/en/…` hydrate and localise. |
| Root `scan:public` (`scripts/scan-public-candidate.mjs`) | Every binary asset in `public/` must have a matching ASSET_MANIFEST row (sha, size). This matters only if the demo adds binaries. |

Suggested new checks for the rebuilt demo. They are cheap and data-driven, and they catch a regression to "empty until clicked":

- A vitest that reads the published `demo.html` and asserts:
  - it contains the `demo-data` block;
  - it has no `box-shadow:` with a non-zero x/y offset and 0 blur;
  - it has no `onclick=`;
  - it has no `opacity:0` in initial-state CSS on content blocks.
- A Playwright check at 390x844 and 1440x900:
  - after `load`, `−€19,960`, `€334,675` and "Right answer to a different question" are visible without clicking;
  - `document.documentElement.scrollHeight / innerHeight` is at most 6 on a phone with all details closed;
  - there are no console errors.

---

## 9. Reuse for Workshop 04 (ESG)

The six-beat page is a template that another workshop can fill with different data. The contract is small:

```
{ question, clock, company,
  runs: { raw: { source, picked, steps|sql, rows }, approved: { … } },
  check: { values, source },
  definition: { fields: { kindOfNumber, grain, period, source }, text },
  gaps: [ … ], limits: { rules: [ … ], enforced: { … } }, moreQuestions: [ … ], provenance }
```

For ESG, the four blanks become:
- Unit and scope (for example tCO2e, Scope 2 location-based or market-based)
- Rows per what (site × month)
- Which period (reporting year, complete months only)
- Which source (the emission factor table, its version and year)

The encodings carry over: hatch = raw input (meter export, invoice), ink = the reported figure, slate = the recomputed check, dashed = estimate or proxy, Mennige = the figure under discussion. This matches design direction §7.7.

---

## 10. Risks and open points

1. **Removing the question switcher and the stepper is a content decision.** It follows the workshop standard §5.2. It drops the only place where G03's loud failure gets full space. Beat 6 keeps G02 and G03 as compact rows, and "Under the hood" keeps all their SQL.
2. **The "ask back / refuse" column needs data that `demo-data.json` doesn't carry yet** (§6.3). Without it, beat 5 shows only the database denial and links the deck scene.
3. **Known gap 1 ("did not cite the definition")** also needs `recorded.summary` in the JSON. Otherwise it is typed copy and needs a source note.
4. **The material label "10 min" and the three-material rule are asserted by tests.** Keep the demo at 10 minutes, or update the registry and the test together.
5. **Recapture needs a live PostgreSQL** with the kit built (`psql` is installed, but no server was checked). None is needed for the redesign, because the data is complete.
6. **The screenshots were taken on the dev server** (`localhost:3000`). Production CSP drops `'unsafe-eval'`. The current demo does not use `eval`, and the rebuild must not either.
