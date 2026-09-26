# Workshop standard

How every loehrning.ai workshop is built, what it publishes, and when it is done. It applies to Workshops 01 to 04 and to every new one. The registry in `src/lib/workshops.ts` carries the fields named here, and `src/lib/workshops.test.ts` enforces the parts a test can check.

Visual design follows the Werkzeichnung direction taken from the Workshop 03 deck (paper, ink, one Mennige accent, hairlines). Copy follows the voice rules enforced by `bun run content:lint` (du-form, concrete nouns, no staged contrasts, no dashes). This document covers structure only.

## 1. Principles

1. **One problem, one company, one question.** The practice company is invented and labelled as such. The question is written down once and does not change from the first scene to the last (`question` in the registry). A second, real case is optional and comes after the method has worked on the invented one (Workshop 02 does this with Meta's public quarter).
2. **Show the wrong answer before the method.** Each workshop opens with an answer that sounds plausible and is wrong for a reason the learner can name. The prediction gives the explanation somewhere to land.
3. **The learner acts at least every 15 minutes.** A vote, a prediction, a filled box, a step at the keyboard. The agenda marks each item with what the learner does (`listen`, `vote`, `do`, `write`); a test fails if more than 15 minutes pass with only `listen`.
4. **Practice fades.** One worked example, one half-filled, one done alone.
5. **The workshop ends on the learner's own case, on paper.** No company data goes into any tool during a session.
6. **Limits are an act, not a footnote.** What the method does not prove, and where the AI still fails.
7. **Reference goes on the field card, not in the deck.** The deck carries the story; the card carries the rules.
8. **Every number and every AI answer has a date and a source.** Recorded AI output is labelled with its recording date, and invented data is labelled as invented.
9. **Publish what was taught.** Where a deck exists, the agenda minutes come from the deck's own scene timings, so the web page cannot drift from the room.

## 2. The spine: seven acts in 90 minutes

Plan 75 to 80 minutes of content for a 90-minute slot. The rest is questions and slack. Workshop 03's deck is the reference implementation; its measured act times are in the last column.

| # | Act | Minutes | What the learner does | W03 (measured) |
|---|---|---|---|---|
| 0 | Open: the case and the one question | 5 | Reads the question, sees the route | 4.75 |
| 1 | The plausible wrong answer | 8 to 10 | Votes: would you pass this on? | 9.75 |
| 2 | Why it is wrong | 6 to 10 | Predicts what the AI calculated, then votes | 6.5 |
| 3 | The fix | 15 to 17 | Fills one blank together | 17 |
| 4 | Your go | 12 to 15 | Does the method on the case, checks against the expected result | 12 |
| 5 | Limits | 10 to 15 | Votes on edge cases (ask back, refuse, block) | 15 |
| 6 | Your case, then close | 10 to 15 | Writes the one-page template, shares it, repeats the opening vote | 10 |
| | Questions and slack | 10 to 15 | | 15 |
| | **Total** | **75 to 80 content, 90 slot** | | **75 + 15** |

**Other lengths.** 60 minutes: merge acts 1 and 2, one vote in act 5, pairs share in act 6, no appendix. 120 minutes: a 10-minute break after act 3, act 4 at the keyboard with the real tool for 30 minutes, and a longer sharing format in act 6. Self-study: the warm-up question on the detail page, then the deck in self-study mode or the learner guide, the practice, and the transfer sheet; show the self-study time separately.

## 3. The components

Required components are marked R. Conditional ones (C) are added when the topic needs them. Every published file is registered in `materials` with a `role` and a `phase` (`before`, `during`, `after`).

| Component | Registry role | Phase | R/C | Job | Size |
|---|---|---|---|---|---|
| **Brief** | registry fields | before | R | Lets someone decide in 30 seconds whether this is for them | Detail-page hero and facts |
| **Warm-up question** | `decisionLab` | before | R | One decision and its strongest evidence, before any teaching | 2 minutes |
| **Deck and presenter view** | `deck`, `presenter` | during | R | Carries the session along the spine | 60 to 80 minutes, 18 to 30 scenes plus appendix |
| **Demo** | `demo` | during | C | Shows one mechanism a slide cannot, final state visible on load | 10 minutes or less |
| **Practice task** | `lab`, `exercise`, `case` | during | R | The learner does the method once on the case, with support | 12 to 25 minutes |
| **Transfer sheet** | inside the kit or on the field card | during | R | Applies the method to the learner's own situation, on one A4 page | 10 to 15 minutes plus sharing |
| **Learner guide** | `guide` | after | R | The whole workshop in reading form, sections mirror the acts | 15 to 30 minutes of reading |
| **Field card** | `card` | after | R | The rules on one printable page, no story | One A4 page |
| **Kit** | `kit`, `data` | before to after | C | Every file needed for the practice and the transfer, offline | Size shown on the page |
| **Provenance** | `provenance` | always | R | Who made it, when it was checked, what kind of data | 5 to 8 lines |

An optional **builder guide** (`builder`) for data teams is allowed. It never counts toward workshop time and is labelled as optional. An overview page (`hub`) may stay published, but the detail page is the hub; mark such a row `optional`.

## 4. Quality bars

Each bar is written so a person or a test can check it.

**Brief.** Three or four outcomes, each starting from a verb you can observe (DE: ausrechnen, prüfen, erkennen, aufschreiben, begründen, vergleichen, festlegen, nennen, entscheiden; EN: work out, check, spot, write down, argue, compare, set, name, decide). No outcome uses verstehen, kennen, lernen, wissen, understand, know, learn, master. Needs are exact: app name and surface, plan, operating system, browser. Two to four items the workshop does not cover. No adjectives about the workshop itself (praxisnah, spannend, hands-on, kompakt). The catalogue `summary` stays at or under 160 characters; `duration` stays "~90 Minuten" / "~90 minutes"; `accessNote` is at most two sentences and is the one place access is stated.

**Warm-up question.** The same situation as the deck's opening vote, repeated at the close. Three decisions and three pieces of evidence, each wrong option pointing at one named misconception. Feedback of 40 words or fewer. Nothing is stored or sent, and the page says so.

**Deck.** Every scene carries `data-act`, `data-label`, `data-seconds`, `data-note`, `data-kind="main|appendix"`. The main path is at most the slot minus 15 percent. One new idea per scene, no text block over 25 words except quoted AI output. Every AI answer is labelled as recorded, with its date. A cut list frees at least 10 minutes without losing an outcome. A self-study mode shows the notes below each scene.

**Demo.** Answers exactly one question, written at the top. The final state is visible on load; replay is optional. No second topic. Readable on a phone. Replayed data carries its capture date.

**Practice task.** Faded. Each step states its expected result and what to do if it does not match. Success is checkable: a number matches, a file exists. At most one new tool. A solution ships in the kit.

**Transfer sheet.** One A4 page. Every box has a worked example from the case beside it. It tells the learner to use an invented or anonymised example. It ends in one sentence template and needs no software.

**Learner guide.** Sections mirror the acts; each runs question, short answer, a reveal prompt for retrieval, one key point. Every term is in the glossary. Works on a 390-pixel screen.

**Field card.** Prints on one A4 page at 100 percent. Five to eight blocks, each with a rule, a Do line, a Don't line and a number. Nothing that is not in the deck.

**Kit.** `START-HERE.md` says what to open first in five lines or fewer. Every file the deck names exists under that name. Data is invented and licensed. Opens without installing anything. Contains expected outputs. Only text files (the public scanner refuses PDF, XLSX, DOCX and PPTX). The size appears on the detail page (`sizeLabel`).

**Provenance.** Author, last reviewed (`reviewedAt`), AI outputs recorded on (`aiOutputsRecordedAt`), live runs (`liveRunAt`), invented or public data (`data`), and a one-line note. No line older than 180 days without a review.

**Times.** Show two numbers: live with a group (`minutesLive`) and alone (`minutesSelfStudy`, shown with "ca." / "about"). Say what the live time contains ("75 minutes of content, 15 of questions"). Optional parts carry their own minutes and never go into the headline. Cover, hub row, detail page and deck state the same times. `agendaSource` says whether the minutes come from the deck (`deck`) or are planned (`plan`); a planned agenda is labelled as not yet measured.

## 5. The detail page

Above the fold (1440 by 900 and 390 by 844) the page answers six questions: what problem (kicker, title, summary), which question (the q-card with `question`), how long (`minutesLive`, `minutesSelfStudy`), what I need (the most limiting item from `needs`), what I leave with (`outcome`), where I start (one primary button for the `primary` material, one secondary button "Material ansehen").

Below the fold, in this order:

1. **Danach kannst du / After this you can**: the `outcomes`, visible, not in an accordion.
2. **Ablauf / Agenda**: one station per `agenda` item with its label, minutes and activity mark; a toggle between live and self-study where both exist.
3. **Probier die erste Entscheidung / Try the first decision**: the decision lab, now after the agenda so it reads as a taste of act 1.
4. **Material**: grouped by phase (Vor dem Workshop, Im Workshop, Danach). Each row shows role, label, a one-line purpose, minutes, format, language and size, "optional" where it applies, and an action. One row is marked "Hier starten".
5. **Das brauchst du / Das brauchst du nicht**: `needs` and `notNeeded` in two columns.
6. **Nicht Teil dieses Workshops**: `notCovered`.
7. **Der Fall**: company, invented label, narrative, stat row, decision question, what the data cannot answer, and the real case with source and dates if there is one.
8. **Für wen**: `audience` plus the `notForYou` line.
9. **Selbst moderieren** (only with a presenter view): how to open it, what to print.
10. **Stand und Herkunft**: the `provenance` fields.

The four collapsed "Referenz" accordions, the steps list with tool chips, and the count row ("6 Schritte", "3 Dateien") go away. Counts of steps and files say nothing about effort; minutes do.

## 6. The hub

1. **Cover band**: kicker with the count, an H1 that describes the format, one lead sentence, one button, and an index row of anchor links (it must work for three and for four workshops).
2. **So läuft jeder Workshop**: the spine as a static route with five stations (the question, the wrong answer, why it is wrong, the fix, your template).
3. **Workshop list**: one row per workshop with number and topic, title, summary, the question in quotes, "Du gehst mit", live and self-study minutes, the limiting need, "Live gehalten am" where true, the deck cover, and one link.
4. **Boundary line**: all practice companies are invented; AI answers shown are dated recordings.

UI strings for both pages live in `src/app/workshops/workshop-copy.ts`.

## 7. Definition of done

A workshop is done when all of these hold:

1. Every outcome has a place in the agenda where it is practised, and every agenda item serves an outcome.
2. The registry entry has `question`, three or four `outcomes`, `agenda`, `minutesSelfStudy` (and `minutesLive` if it runs live), exact `needs`, `notNeeded`, two to four `notCovered`, `notForYou` and `provenance`, in German and English.
3. The warm-up question matches the deck's opening vote and returns at the close.
4. The deck has per-scene act, seconds and notes; the main path fits the slot minus 15 percent; the agenda minutes match the deck (tested for Workshop 03).
5. Someone other than the author has run it from the presenter view.
6. The practice task is faded, has expected results and "if it doesn't match" help, and a novice finished it in the stated time.
7. The transfer sheet is one A4 page with a worked example per box.
8. The learner guide mirrors the acts, has reveal prompts and a glossary.
9. The field card prints on one A4 page.
10. The kit, if any, has a short START-HERE, expected outputs, a dated changelog and its size on the page.
11. Every learner-facing file is in `materials` with `role` and `phase`; exactly one is `primary`.
12. Provenance shows last reviewed, AI outputs recorded on, live runs and the kind of data.
13. German page and English mirror match; the material language is stated when it differs from the page.
14. Cover, hub row, detail page and deck state the same times.
15. The copy passes `bun run content:lint` and has no em or en dashes.

## 8. Adding a workshop

1. Write the alignment first: for each on-the-job action, the outcome, where the learner shows it, the act, and the material.
2. Build the deck on the Workshop 03 runtime (`story.css`, route bar, per-scene metadata, presenter console).
3. Add a registry module next to `workshops-data-readiness.ts` and append it after the existing workshops in `WORKSHOPS_BY_LOCALE`. Extend `WorkshopNumber` if needed.
4. Add the slug to `src/lib/analytics/registry.ts` and `src/lib/i18n/content-parity.ts`, the card preview and every binary file to `ASSET_MANIFEST.json`, and the route to the e2e lists in `tests/e2e/route-workshops-locales.spec.ts`.
5. Run `bunx vitest run src/lib/workshops*.test.ts src/lib/machine-surfaces/workshops.test.ts` and `bun run content:lint`.
