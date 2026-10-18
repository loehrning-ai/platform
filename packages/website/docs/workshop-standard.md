# Workshop standard

How every loehrning.ai workshop is built, what it publishes, and when it is done. It applies to Workshops 01 to 05 and to every new one. The registry in `src/lib/workshops.ts` carries the fields named here, and `src/lib/workshops.test.ts` enforces the parts a test can check.

Visual design follows the Werkzeichnung direction taken from the Workshop 03 deck (paper, ink, one Mennige accent, hairlines), with the poster layer on top: each workshop has its own poster palette (section 5.1, `docs/experience-system.md`). Copy follows the voice rules enforced by `bun run content:lint` (du-form, concrete nouns, no staged contrasts, no dashes). This document covers structure only.

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

**Brief.** Three or four outcomes, each starting from a verb you can observe (DE: ausrechnen, prüfen, erkennen, aufschreiben, begründen, vergleichen, festlegen, nennen, entscheiden; EN: work out, check, spot, write down, argue, compare, set, name, decide). No outcome uses verstehen, kennen, lernen, wissen, understand, know, learn, master. Needs are exact: app name and surface, plan, operating system, browser. Two to four items the workshop does not cover. No adjectives about the workshop itself (praxisnah, spannend, hands-on, kompakt). The catalogue `summary` stays at or under 160 characters; `duration` states the live length, or the self-study length without a live session ("~90 Minuten" / "~90 minutes"; the presenter-led Workshop 04 runs "~60 Minuten"); `accessNote` is at most two sentences and is the one place access is stated.

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

The page is lean on purpose: students read a phone screen, and the owner's rule is that text everywhere is too much. It opens with the workshop's poster band, then the **stage**: two big animated action cards and the workshop's own motion scene. Together they answer the questions that matter: what problem (caps line, title, summary), where I start (card A, the slides or the lab, the `primary` material), what I take away (card B, the kit zip or the case), how long (`minutesLive`, `minutesSelfStudy`, in the facts line) and what I need (all `needs`, in "Mehr Details"). On a 390 by 664 phone the title, the summary and the top of card A share the first screen. The page has no visible outcomes list and no visible case section; the case, its question and every source sit in the closed accordion. The detail page carries no in-page exercise ("Ausprobieren") band: the deck's opening vote and the practice task do that work.

**The agenda is not on the page.** There is no "Ablauf" section, no route rail, no red-line jump nav and no number badge on any heading. `agenda`, `agendaSource` and the minutes stay in the registry: tests check them (the sum, the 15-minute rule, the deck's seconds) and the machine surfaces (`src/lib/machine-surfaces/workshops.ts`, the MCP workshop tool) publish them. The hub's "So läuft jeder Workshop" spine is a different thing and stays.

### 5.1 The poster band, the stage and the accordion

- **One palette per workshop.** `WORKSHOP_PLAKAT` in `src/lib/plakat/palettes.ts` is the only mapping: 01 Lemons, 02 IDEA, 03 Bloom, 04 Autumn, 05 Sage (Salbei, Tanne, Bernstein, taken from the soft deck look of Workshop 05; motif "ledger"). The band, the hub poster, the social card, the deck cover and the static materials all read it. Five workshops, five palettes; a sixth workshop needs a new decision, never a second mapping.
- **The band** (`PlakatBand`, scope `plakat-<key>`, and `data-plakat-page` on the page wrapper) is the poster exactly as the plakat system draws it, and holds only this, in order: on phones the back link, the caps line (`workshop.eyebrow`), the poster title (the title head at poster size through the fit rule, the subtitle inside the h1 at 17px) and the summary at 17px. No buttons, no motion scene. The art is the workshop's poster with its big numeral: the right column from lg, a full-bleed poster row below lg (8:3 on phones so the stage starts in the first screen, 16:9 from sm, capped at 18rem). Workshop 05 shows its own motif (sage, ledger) like every other workshop. Below 360px the poster step drops to 42px and the gaps tighten. Three type sizes at most. No q-card, meta line, chip, `text-caption` or `text-label` inside the band.
- **The stage** (`WorkshopStage`, `src/components/workshops/workshop-stage.tsx`) follows the band directly. Phone: card A, card B, the scene (6:5), the pause control. Tablet: the two cards in two columns, then the scene (2:1). From lg: the cards on the left (7fr), the scene on the right (5fr, at least 22rem tall), the pause control under it. A workshop whose scene is not wired yet shows its cards across the full width, never a broken page.
- **The two action cards** (`ActionCards`, data from `workshopStage()` in `src/lib/workshop-stage.ts`). Card A opens the `primary` material: "Folien ansehen / View the slides" for a deck, "Labor öffnen / Open the lab" for a workshop without a deck (Workshop 01). Card B hands over the second material: "Kit herunterladen / Download the kit" for the kit zip (a bare `download` attribute), "Fall ansehen / See the case" for a workshop without a kit (Workshop 01). Each card is one real link through `WorkshopMaterialLink` (the open is counted) with a stretched hit area, a picture that moves, a title at 22px and a meta line at 14px ("Deck, 60 Min.", "ZIP, 1,1 MB": time and size, never a slide or file count, because the registry cannot derive one). The accessible name is the title, the topic and, for a download, the file facts. A kit with a kit page (Workshops 04 and 05) also gets one small secondary link "Kit ansehen / View the kit", 44px high. Cards are hard-edged with a 2px scene-line border; card A is scene ground with scene ink, card B is inverted; the one accent is the scene's mid colour, on shapes. Hover and keyboard focus make the picture's motion stronger; focus draws one 3px ring around the card.
- **Scenes and motion.** The scene is the workshop's own story in shapes only (`HERO_MOTION` and `HERO_SCENES` in `src/components/plakat/hero-motion.tsx`: 01 cone, 02 trace, 03 mend, 04 weave, 05 gate). The rules are in `docs/experience-system.md`, "Workshop stage and scenes": pure CSS and inline SVG, no JavaScript, one 600 x 500 frame, `aria-hidden`, no text; the base styles are the finished still frame; every keyframe sits inside `prefers-reduced-motion: no-preference`; only transform, opacity and `stroke-dashoffset` move; at most 16 animated elements; a 9 second loop. A CSS-only pause control (a labelled checkbox) stops the cards and the scene (WCAG 2.2.2) and is hidden under reduced motion. The hub thumb, the social card and the deck cover keep the palette motif.
- **The marked word.** The tail of the H1 sits on the marker band (`HighlightedText`). `HEADLINE_MARK` in `workshop-detail-content.tsx` moves the band to one chosen word per locale (Workshop 05: "Data" / "Daten"); the words after it follow unmarked.
- **The facts line** follows the stage on paper, with no heading: minutes live, minutes alone, invented case, material language on the German page, free. The outcomes are not shown on the page (they stay in the registry for the hub row and the machine surfaces), and neither is a need line: all `needs` sit in "Mehr Details".
- **Rost rules (Autumn, Workshop 04 today).** Creme on Rost is 4.80:1, just above AA, so inside an autumn scene all text is 17px or larger at weight 400 or more, there is no muted tier and no reduced opacity, hover underlines or inverts and never tints, and no q-card, status chip, badge, form field or progress bar sits in the band. A meaningful shape uses Ocker hell; Ocker is decoration only.
- **Below the band** the Kopflinien and the tab marker take the scene's paper ink. Headings stay Druckschwarz. The result chart (`caseStudy.resultChart`) sits on Kalkweiß: bars from zero on one scale, the unchecked AI answer hatched, every value a direct label printed elsewhere in the workshop's copy.

After the facts line comes one closed accordion, "Mehr Details" (a `<details>`, the h2 `workshop-details-heading`), then the provenance line. The accordion holds, in this order (each block an h3 head):

1. **Material**, only when a file is left over that the two cards do not reach (an optional file, or more than two files; no published workshop has one today, and the list stays for the next one). Grouped by phase, each row with role, label, a one-line purpose, minutes, format, language and size, "optional" where it applies and an action; one row is marked "Hier starten".
2. **What you need**: all `needs`, under the label "Du brauchst / You need"; **what you don't need** and the `accessNote`.
3. **Who it is for** and the `notForYou` line; **what the workshop does not cover**.
4. **The case** (anchor `#fall`): the company, "Erfundener Fall" (or "Echte Unternehmensdaten"), sector and period on one line; the narrative; the one `question` with the Mennige bar; the result chart where the registry has one; the real case with its source link, publisher or limitation and both dates if there is one. Real-company data keeps its source, publisher and dates here, unchanged.
5. **The case figures**, `dataLimitations` and the provenance note.
6. **One provenance line** in the footer, outside the accordion: author, when it was checked, when AI answers were recorded and when it last ran live (only where set), and the kind of data.

The four collapsed "Referenz" accordions, the steps list with tool chips, the metrics row on the open page and the count row ("6 Schritte", "3 Dateien") are gone. Counts of steps and files say nothing about effort; minutes do. `steps` stays in the registry for the machine surfaces and the kit.

### 5.2 The kit page

`/workshops/<slug>/kit` is lean too: the kit's numbers (files, missions, rules), a short motion explainer (a stepper over the kit's steps) and one big download button. The three rules for the Project and the file list wait behind closed disclosures. No numbered headings. The rules shown are the lines of `project-instructions.md`, word for word; a test compares them.

## 6. The hub

1. **Poster band** in the newest workshop's palette (`hubPlakat`): the caps line with the count, an H1 that describes the format, one lead sentence, one button into the recommended start (Workshop 03) and the access line, all at 17px or more. The one poster object is the key numeral, the workshop count, in the scene's mark colour. The list below is the index, so the band carries no anchor row.
2. **So läuft jeder Workshop**: the spine as a static route with five stations (the question, the wrong answer, why it is wrong, the fix, your template).
3. **Workshop list**: one row per workshop with number and topic, title, summary, the question in quotes, "Du gehst mit", live and self-study minutes, the limiting need, "Live gehalten am" where true, the workshop's poster (an 80 by 100 thumb on phones, the 4:5 cover from md) and one link. The five posters show five palettes; the rows stay paper with a hairline and no tint.
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
16. The detail page shows no agenda, no red-line nav, no numbered heading, no outcomes list and no visible case section; the band holds the poster only; the stage shows two action cards with the right links, a `download` on the kit, and the workshop's scene with the pause control; at 390 by 664 the title, the summary and at least 56px of card A are in the first screen; there is no horizontal scroll at 320px.

## 8. Adding a workshop

1. Write the alignment first: for each on-the-job action, the outcome, where the learner shows it, the act, and the material.
2. Build the deck on the Workshop 03 runtime (`story.css`, route bar, per-scene metadata, presenter console).
3. Add a registry module next to `workshops-data-readiness.ts` and append it after the existing workshops in `WORKSHOPS_BY_LOCALE`. Extend `WorkshopNumber` if needed.
4. Give the workshop its palette and motif in `WORKSHOP_PLAKAT` (`src/lib/plakat/palettes.ts`) and check that its title head fits at 320px (`src/lib/plakat/fit.test.ts`).
5. Add the slug to `src/lib/analytics/registry.ts` and `src/lib/i18n/content-parity.ts`, the card preview and every binary file to `ASSET_MANIFEST.json`, and the route to the e2e lists in `tests/e2e/route-workshops-locales.spec.ts`.
6. Write the scene brief first: one idea, one 9 second loop, no words (a prompt, a table, a forecast: what the learner should see happen). Name its key and class prefix.
7. Build `hero-<key>-scene.tsx` (a named export `<Key>Scene()`, no props, one 600 x 500 frame) and `hero-<key>.css` in `src/components/plakat/`, register the component in `HERO_SCENES` and map the slug in `HERO_MOTION` (`hero-motion.tsx`), and write the scene's own test next to it (it reads the CSS: one viewBox, no text, base styles are the still frame, everything under `no-preference`, at most 16 animated elements). Until the scene is wired, the stage shows the two cards across the full width.
8. Add the stage copy only if a card needs a new title: the four titles ("Folien ansehen", "Labor öffnen", "Kit herunterladen", "Fall ansehen") live in `workshop-copy.ts` under `detail.stage`, in both languages. The cards themselves come from the registry (`primary` material, kit zip or second file), so a normal workshop needs no page code.
9. Check the page at 390 by 664 (title, summary and 56px of card A in the first screen), at 768 and at 1440, in German and English, with the pause control on and off and with reduced motion on.
10. Run `bunx vitest run src/lib/workshops*.test.ts src/lib/machine-surfaces/workshops.test.ts src/lib/workshop-stage.test.ts src/components/plakat src/components/workshops "src/app/workshops"` and `bun run content:lint`.

### Next workshop: the baseline

When the owner names only a title for the next workshop, do the same process every time: first the deep investigation (the real job the learner does, the alignment of actions, outcomes, acts and materials, the deck, the kit and its numbers), then build the page on this baseline: poster band, stage with two cards and one fresh scene of its own, facts line, "Mehr Details" accordion, provenance line. Never copy a finished scene; take the idea from the workshop's own story, keep the style guide of the scenes (one accent, dots and packets, calm depth, no words), and keep the cards, the pause control and the layout exactly as they are, so all workshops feel like one family.