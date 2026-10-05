# Lesson engine

The lesson engine is the shared lesson model and reader for the four Grundlagen
courses. One lesson is:

1. **Concept**: at most 150 words of Markdown, evidence first, sources inline.
2. **Exercise**: one registered widget, configured only by JSON props.
3. **Checks**: exactly two single-choice questions with instant, explained
   feedback.

A lesson is complete when the exercise reports done **and** both checks are
answered correctly. There are no "mark as read" buttons and no ungraded
free-text checkpoints. Completion is written automatically.

| Course | Status |
|---|---|
| `ki-fuehrerschein` | On the engine (pilot): 4 modules, 8 lessons, about 45 min |
| `ki-und-gesellschaft` | On the engine: 3 modules, 8 lessons, about 40 min |
| `eu-ai-act-kurs` | On the engine: 5 modules, 10 lessons, about 60 min |
| `ai-native` | On the engine as "Mit KI arbeiten" / "Working with AI": 4 modules, 9 lessons, about 70 min, tool-neutral |

## Transition model

Both formats run side by side. The reader decides **per lesson**:
`isEngineLesson(lesson)` is true when `concept`, `exercise` and a non-empty
`checks` array are all present. Engine lessons render through `LessonFlow`;
all other lessons keep the legacy section reader. Port a course in one change.
Do not mix formats inside one course: completion rules are set per course
(see "Progress and completion").

The loaders (`src/lib/course/data.ts`, `src/lib/ai-native/data.ts`) call
`projectEngineLesson()`. It derives the legacy `sections` (one concept
section, id `<lessonId>_concept`) and `quiz` (from `checks`) so search, MCP
resources and exports keep reading text. Readers never render that
projection. Engine lessons get no auto-injected glossary flashcards.

## Where things live

| What | Path |
|---|---|
| Types and constants | `src/lib/lesson-engine/types.ts` |
| Guards, projection, `validateEngineLesson` | `src/lib/lesson-engine/lesson.ts` |
| Lab prop validation | `src/lib/lesson-engine/validate-exercise.ts` |
| Formula language | `src/lib/lesson-engine/expression.ts` |
| Reader | `src/components/lesson-engine/lesson-flow.tsx` |
| Checks UI | `src/components/lesson-engine/lesson-checks.tsx` |
| Progress hook | `src/components/lesson-engine/use-engine-lesson-progress.ts` |
| Course hub with progress rings | `src/components/lesson-engine/module-overview.tsx` |
| Lab widgets | `src/components/widgets/lab/*.tsx` (primitives in `_lab.tsx`) |
| Widget kinds and registry | `src/lib/widgets/types.ts` (`LAB_KINDS`), `src/components/widgets/registry.tsx` |
| Design tokens | `src/app/globals.css` (`--shadow-lab*`, `--color-lab-*`, `.lab-wash-*`, `.lab-grid-paper`) |
| Design contract | `src/components/lesson-engine/lesson-engine-design-contract.test.ts` |
| Pilot content | `content/ki-fuehrerschein/block-{1..4}-*-lessons.json` and `en/` |

## Content file format

Block courses keep one JSON file per module (the route segment stays
`block_N`), German at `content/<slug>/` and English at `content/<slug>/en/`
with the **same file names, ids, order, kinds, bucket ids, formulas and
correct flags**. Only learner-facing strings differ.

```json
{
  "blockId": "block_1",
  "owner": "tim@loehrning.ai",
  "lastReviewed": "2026-10-04",
  "nextReview": "2027-04-05",
  "format": "lesson-engine/v1",
  "reviewCadence": "legal",
  "riskClass": "legal",
  "triggerEvents": ["eu-ai-act-amendment"],
  "lessons": [ { "...": "lesson, see below" } ]
}
```

The freshness fields are required by `bun run content:lint`. `nextReview`
must lie in the future and `lastReviewed` must not.

### Lesson schema

```ts
{
  id: string;              // "<topic>-<module>-<lesson>", e.g. "daten-1-2"
  blockId: "block_1";      // the module file's blockId
  number: number;          // 1-based position in the whole course
  title: string;
  subtitle: string;        // one line under the title
  durationMinutes: number; // 4-8; module totals go into data.ts blockMeta
  keyConcepts: string[];   // 2-4 search terms (MCP search reads them)
  concept: {
    body: string;          // Markdown, max 150 words (tables allowed)
    takeaway?: string;     // one-sentence rule, shown as a callout
    sources?: { label: string; url?: string }[]; // chips under the concept
  };
  exercise: {
    kind: WidgetKind;      // usually a LAB kind, see below
    title: string;         // imperative, e.g. "Sortiere zwölf Datenschnipsel"
    instructions: string;  // what to do and what "done" means
    props: object;         // kind-specific, JSON only, never lessonId/cpId
  };
  checks: [LessonCheck, LessonCheck]; // exactly two
}

LessonCheck = {
  id: string;              // unique in the lesson, e.g. "daten-1-2-c1"
  prompt: string;
  options: { id: string; text: string; correct: boolean; feedback?: string }[];
                           // 2-4 options, exactly one correct;
                           // feedback explains a wrong pick (write it for
                           // every wrong option: the content tests require it)
  explanation: string;     // shown after the correct pick
}
```

The reader shows options in a stable shuffled order seeded by the check id
(`orderCheckOptions`), so the authored position of the correct option does not
matter and DE/EN show the same order.

Do not author `sections`, `quiz` or `widgets` on an engine lesson. The loader
replaces them.

**Lesson id convention.** For block courses the id must end in
`-<module>-<lesson>` (`daten-1-2` lives in `block_1`).
`src/lib/courses/resume.ts` uses that suffix to build resume links
(`/<slug>/kurs/block_1#lesson=daten-1-2`).
Use **new ids** when you rewrite a lesson. Stored progress under retired ids is
dropped without errors (see below), so a reused id never inherits a stale
completion.

### Writing rules

- Evidence first. Every real-world figure needs a verifiable public source
  that is already in the content or is a well-known primary source (EUR-Lex
  article numbers, OECD/IAB studies, Gender Shades). Never invent statistics.
- Date legal statements the way the existing content does (for example
  "Artikel 4 ... ist seit dem 2. Februar 2025 anwendbar ... Verordnung (EU)
  2026/1744"). `temporal-legal-truth` and the claim-hygiene tests check this.
- Synthetic data only: e-mail at `example.com`, IBANs with check digits `00`,
  phone numbers like `+00 0000 000000`. `public-content-claims.test.ts`
  rejects real-looking German phone numbers.
- German uses the course's form of address (`du` for KI-Führerschein, see
  `scripts/content-lint.form-map.json`). Quoted in-world speech counts too.
  Rephrase instead of quoting "Sie" in a du-course.
- No em or en dashes in content or TSX copy.
- Cite German sub-provisions as "Art. 5 Abs. 1 lit. c" and English as
  "Art. 5(1)(c)". Parity tests compare citations at article level.

## Widget kinds (lab)

All lab widgets are registered in `LAB_KINDS`. They are deterministic,
keyboard and touch accessible (44px targets), announce results through a live
region, and use finite motion with a static reduced-motion result. The reader
injects `lessonId` (`<course>:<lesson>`), `cpId` (`"exercise"`) and `locale`.
When the exercise reaches its done state the widget completes that checkpoint
and calls the reader's `onComplete`. `validateExerciseProps(kind, props)`
checks every kind below, and `validateEngineLesson` runs it.

### `bucket-sort`

Tap or drag cards onto piles. Keyboard: focus a card, press 1 to 9. Each
placement explains itself at once, and a misplaced card is still filed under
its correct pile. Done when every card is placed and the first-try ratio is at
least `passRatio`.

```json
{
  "kind": "bucket-sort",
  "props": {
    "context": { "label": "Notizen (erfunden)", "text": "- Pipeline 1,2 Mio. ..." },
    "buckets": [
      { "id": "public", "label": "Öffentlich", "hint": "schon veröffentlicht" },
      { "id": "never", "label": "Nie eingeben" }
    ],
    "items": [
      { "id": "press", "text": "Pressetext von der Website", "bucket": "public",
        "why": "Schon veröffentlicht. Rechte trotzdem prüfen." }
    ],
    "passRatio": 0
  }
}
```

`context` is optional. Use at least 2 buckets and 3 items, and give every
bucket at least one item. `passRatio` defaults to 0 (finishing is the
exercise).

### `claim-checker`

The learner marks every underlined claim in a draft as `supported`,
`contradicted` or `missing` against a source pack, then presses "Auswerten"
to get a scored answer key with quotes and corrections. Done on evaluation
when the score is at least `passRatio` (default 0).

```json
{
  "sources": [{ "id": "A", "label": "Quelle A: Beschlussprotokoll", "text": "Budget: 1,8 Mio. EUR." }],
  "draftLabel": "KI-Entwurf",
  "draft": [
    { "text": "Der Vorstand hat " },
    { "text": "18 Mio. EUR", "claimId": "budget" },
    { "text": " freigegeben." }
  ],
  "claims": [
    { "id": "budget", "verdict": "contradicted", "sourceId": "A",
      "evidence": "Budget: 1,8 Mio. EUR.", "correction": "1,8 Mio. EUR",
      "why": "Faktor zehn." },
    { "id": "lead", "verdict": "missing", "why": "Keine Quelle nennt das." }
  ]
}
```

Every claim must appear exactly once in `draft`. `evidence` must be an exact
substring of its source's `text`. `sourceId` is required unless the verdict
is `missing`.

### `calculator`

Inputs feed formulas. The headline output animates, a verdict card picks the
first matching rule, and an optional bar chart is drawn. Goals turn the
calculator into a task: done when every goal has been met at least once, or
after three input changes when there are no goals.

```json
{
  "inputs": [
    { "id": "turnover", "label": "Jahresumsatz", "type": "slider", "scale": "log",
      "min": 1000000, "max": 10000000000, "default": 50000000, "format": "eur" },
    { "id": "tier", "label": "Verstoß", "type": "select", "default": 3,
      "options": [{ "value": 3, "label": "Verbotene Praxis" }, { "value": 1, "label": "Falsche Auskunft" }] },
    { "id": "sme", "label": "KMU", "type": "toggle", "default": 1 }
  ],
  "outputs": [
    { "id": "fixed", "label": "Fester Betrag", "formula": "tier == 3 ? 35000000 : 7500000", "format": "eur" },
    { "id": "share", "label": "Umsatzanteil", "formula": "turnover * (tier == 3 ? 0.07 : 0.01)", "format": "eur" },
    { "id": "cap", "label": "Obergrenze", "formula": "sme ? min(fixed, share) : max(fixed, share)",
      "format": "eur", "emphasis": true }
  ],
  "chart": { "kind": "bars", "title": "...", "format": "eur",
             "bars": [{ "label": "Fester Betrag", "formula": "fixed" }, { "label": "Umsatzanteil", "formula": "share", "tone": "warn" }] },
  "verdicts": [{ "when": "cap >= 10000000", "tone": "bad", "title": "...", "body": "..." },
               { "when": "true", "tone": "neutral", "title": "..." }],
  "goals": [{ "id": "g1", "label": "Stelle ein KMU mit 20 Mio. EUR Umsatz ein", "when": "sme == 1 && turnover <= 20000000",
              "insight": "Für KMU gilt der niedrigere Betrag." }],
  "note": "Höchstbeträge nach Art. 99. Kein Bußgeldbescheid."
}
```

These values only illustrate the shape. Take legal amounts from the cited
article. Rules:

- Input types are `slider` (`min`, `max`, `step`, optional `scale: "log"`),
  `number`, `select` (`options`; up to 4 render as a segmented control) and
  `toggle` (0 or 1).
- `format` is one of `number`, `int`, `percent` (0..1) or `eur`. `decimals`
  and `unit` are optional.
- `outputs` are evaluated in order and may reference inputs and earlier
  outputs.
- `chart.kind` is `bars` (shared scale) or `stacked` (one 100% bar, for
  example true vs false positives).
- Bar and verdict `tone` is one of `accent`, `good`, `bad`, `warn` or
  `neutral`.
- Goals start counting after the first change, so defaults never satisfy a
  goal by themselves.
- The validator rejects goals that no input combination can reach (it checks
  select, toggle and 25 slider steps).

### `threshold-lab`

Two synthetic groups with the same score distribution per class and
different base rates. The learner moves a shared threshold (or separate
thresholds) and watches FPR, FNR, PPV and selection rate per group. This is
the Chouldechova 2017 / Kleinberg et al. 2016 trade-off. Done when every goal
is met, or after five changes.

```json
{
  "groups": [
    { "id": "a", "label": "Gruppe A", "baseRate": 0.5, "n": 200 },
    { "id": "b", "label": "Gruppe B", "baseRate": 0.3, "n": 200 }
  ],
  "separation": 1.6,
  "initialThreshold": 0.5,
  "allowSplit": true,
  "goals": [
    { "id": "equal-error", "label": "Gemeinsame Schwelle: vergleiche FPR und PPV", "when": "split == 0 && abs(fpr_a - fpr_b) < 0.03" },
    { "id": "equal-ppv", "label": "Gleiche PPV mit getrennten Schwellen", "when": "split == 1 && abs(ppv_a - ppv_b) < 0.03",
      "insight": "Jetzt laufen die Fehlerraten auseinander." }
  ],
  "scoreLabel": "Risikowert",
  "positiveLabel": "tatsächlich rückfällig",
  "negativeLabel": "nicht rückfällig",
  "note": "Synthetische Daten ..."
}
```

Goal variables are `t_a`, `t_b`, `split`, `fpr_a`, `fpr_b`, `fnr_a`, `fnr_b`,
`ppv_a`, `ppv_b`, `sel_a` and `sel_b` (`a` is the first group). The population
is deterministic: evenly spaced normal quantiles, no randomness.

### `decision-wizard`

Branching questions end in a result card with next steps and a source.
Optional practice cases ask the learner to walk the tree once per case and
compare the result with the expected one. Done after all cases, or after the
first result when there are no cases.

```json
{
  "start": "start",
  "nodes": [
    { "id": "start", "question": "Worum geht es?", "help": "optional",
      "options": [{ "label": "Ich will ein Tool nutzen.", "next": "tool" },
                  { "label": "Daten sind schon draußen.", "result": "report" }] }
  ],
  "results": [
    { "id": "report", "tone": "bad", "title": "Sofort intern melden", "body": "...",
      "actions": ["Kanal nutzen"], "source": "DSGVO Art. 33" }
  ],
  "scenarios": [{ "id": "leak", "text": "Ein Kollege hat ...", "expected": "report", "why": "..." }]
}
```

Every option has exactly one of `next` or `result`. Every node and every
result must be reachable from `start`, and scenarios must expect a known
result.

### `live-prompt-ab`

Two prompts run on the same synthetic material, then the learner judges both
outputs against a rubric. "Beide ausführen" calls `POST /api/ai-native/practice`
through `usePracticeApi` (login-gated and flag-gated, see
`docs/course-project-runtime.md`). If either live call fails, both sides show
the authored `recorded` outputs, labelled "Aufgezeichnetes Beispiel" with a
note that live mode is unavailable. With recorded outputs the evaluation
compares the learner's marks with `expected`. With live outputs it shows the
learner's own scores, because live text varies. Done on evaluation.

```json
{
  "task": "Ziel: eine Antwort, die du nach kurzer Prüfung senden könntest.",
  "input": { "label": "Reklamation (erfunden)", "text": "..." },
  "variants": [
    { "label": "Schwacher Auftrag", "prompt": "Schreib eine Antwort ...", "recorded": "..." },
    { "label": "Strukturierter Auftrag", "prompt": "Kontext: ...", "recorded": "..." }
  ],
  "rubric": [
    { "id": "cause", "label": "Erfindet keine Ursache", "hint": "optional", "expected": { "a": false, "b": true } }
  ],
  "allowEdit": true
}
```

`allowEdit` lets the learner edit prompt B. It is reset to the authored text
when the run falls back to recorded outputs, and the note says so. The sent prompt is
`prompt + "\n\n" + input.label + ":\n" + input.text` and must stay under 4,000
characters. Write recorded outputs so that each rubric expectation is visibly
true or false in them.

### `doc-builder`

A form fills a Markdown template with a live preview. "Als Markdown
herunterladen" or "Text kopieren" finishes the exercise once every required
field is filled. Drafts are stored per learning owner (`useDraftValue`), and
the fields stay disabled until the owner is resolved.

```json
{
  "filename": "ki-richtlinie.md",
  "template": "# KI-Nutzungsrichtlinie: {{org}}\n\nNie eingeben:\n{{never}}\n",
  "fields": [
    { "id": "org", "label": "Organisation", "type": "text", "required": true, "placeholder": "..." },
    { "id": "never", "label": "Nie eingeben", "type": "checkboxes", "required": true,
      "options": ["Passwörter", "Gesundheitsdaten"], "default": ["Passwörter"] },
    { "id": "cycle", "label": "Überprüfung", "type": "select", "options": ["jährlich"] },
    { "id": "notes", "label": "Hinweise", "type": "textarea" }
  ]
}
```

`{{id}}` inserts a value, and a checkbox field inserts a bullet list. Empty
values render as `[Label]`, so gaps stay visible. Every field must appear in
the template, and the filename must end in `.md`.

### `timeline-check`

A live legal timeline. Milestones carry ISO dates; the widget reads today's
date on the learner's device (after hydration, so server and client markup
match) and computes for each question whether the obligation "applies
already" or is "still to come", with the day count. The learner judges each
obligation first, then sees the computed answer and the reason. Focus moves
to the feedback that replaces the answer buttons. Done when every question
is answered and the first-answer ratio is at least `passRatio` (default 0).

```json
{
  "milestones": [
    { "id": "literacy", "date": "2025-02-02", "title": "Art. 4 und Art. 5", "source": "Art. 113 lit. a" },
    { "id": "annex3", "date": "2027-12-02", "title": "Hochrisiko nach Anhang III" }
  ],
  "questions": [
    { "id": "cv", "text": "Betreiberpflichten nach Art. 26 für Ihr CV-Ranking", "milestone": "annex3",
      "why": "Anhang III Nr. 4, verschoben durch die Verordnung (EU) 2026/1744." }
  ],
  "note": "Der Abgleich nutzt das heutige Datum auf Ihrem Gerät."
}
```

Use at least 2 milestones and 2 questions; every question points to a known
milestone. Write the `why` without a tense that ages (the widget adds
"gilt seit" or "gilt ab"). `today` (YYYY-MM-DD) exists for previews and tests
only; never author it in lesson content.

### `sequence-order`

Put the steps of a procedure in order. Steps are authored in the correct
order and start in a fixed shuffled order seeded by their ids (never the
solution). The learner moves cards with 44px up/down buttons, presses
"Reihenfolge prüfen", sees which positions are right, fixes the rest and
checks again. Done once the order is fully right; every step then shows why
it sits there.

```json
{
  "context": { "label": "Situation (erfunden)", "text": "Die Behörde bittet um Unterlagen ..." },
  "steps": [
    { "id": "ack", "text": "Eingang bestätigen und Frist notieren", "why": "Ohne Frist kein Plan." },
    { "id": "scope", "text": "Umfang der Anfrage prüfen", "why": "Erst der Umfang entscheidet, was Sie herausgeben." },
    { "id": "answer", "text": "Vollständig und wahr antworten", "why": "Falsche Angaben kosten extra." }
  ]
}
```

Use at least 3 steps whose order is unambiguous.

### `bucket-sort` layout

`bucket-sort` takes an optional `"layout": "pyramid"`: the piles stack as
tiers that widen from the first bucket (top) to the last (base). Use it for
ordered classes such as the four risk tiers.

### `pii-redactor`

The learner taps every phrase the purpose does not need, then presses
"Einfügen prüfen". Misses and over-redactions are explained, and the outgoing
text is shown. Done when the redaction is clean. An optional scratch pad
(`freeText`, default true) detects patterns in the learner's own text (e-mail,
phone, IBAN, dates, keys) and copies the masked version. It says that names,
health data and trade secrets need a human check.

```json
{
  "segments": [
    { "text": "Guten Tag, hier schreibt " },
    { "text": "Petra Sommerfeld", "pii": "Name: Für den Entwurf reicht „die Kundin“." },
    { "text": " ... " }
  ],
  "freeText": true
}
```

### `triage-matrix`

The learner rates each task on three axes with three levels each: how often
(`f`), what an error costs (`c`) and how quickly a result can be checked
(`k`). A matrix plots every rated task (x frequency, y error cost, dot size
checkability) and a transparent score ranks them. Learners may add up to three
tasks of their own (`allowOwn`, default true). "Auswerten" marks the top
`pick` (default 3) and compares the learner's ratings of the authored tasks
with `reference`, explaining every item with `why`. Done on evaluation.

```json
{
  "items": [
    { "id": "faq", "text": "Standardantwort auf eine FAQ-Mail",
      "reference": { "f": 3, "c": 1, "k": 3 }, "why": "Täglich, billig, auf einen Blick prüfbar." }
  ],
  "pick": 3,
  "score": "f * k * (4 - c)",
  "scoreLabel": "optional, the score in words",
  "axes": { "k": { "label": "optional relabel", "levels": ["a", "b", "c"] } },
  "note": "optional"
}
```

Use at least 4 items. `score` may only use `f`, `c` and `k` (each 1 to 3).

### `scenario-run`

A deterministic test run. The learner switches building blocks on or off
(guard steps of a workflow, permission scopes of an agent) and runs a fixed set
of synthetic cases. Each case passes when its `pass` formula over the step ids
is true and explains itself with `passText` or `failText`. Metrics are
formulas over the steps, `ok_<caseId>`, `passed`, `total`, `active` (switched-on
optional steps) and earlier metrics. Done once a run meets `goal`.

```json
{
  "layout": "flow",
  "goalLabel": "Bring alle Fälle durch, ohne jede Mail von Hand zu prüfen.",
  "successTitle": "Lauf bestanden",
  "goalMissHint": "optional, shown when every case passes but the goal is missed",
  "steps": [
    { "id": "classify", "label": "KI ordnet ein", "optional": false },
    { "id": "mask", "label": "Daten maskieren", "detail": "optional", "default": 0, "group": "grid only" }
  ],
  "cases": [
    { "id": "iban", "label": "Mail mit IBAN", "text": "...", "pass": "mask",
      "passText": "...", "failText": "..." }
  ],
  "metrics": [{ "id": "minutes", "label": "Prüfminuten pro Tag", "formula": "mask * 5", "format": "int" }],
  "goal": "passed == total && minutes <= 30"
}
```

Step and case ids must be identifiers. `layout: "grid"` groups steps under
`group` headings (for a permission matrix). The validator rejects unknown
variables, goals the default switches already meet and goals no switch setting
reaches (at most 12 switchable steps).

### Legacy widgets inside the engine

Any registered kind can be the exercise. The reader injects the same
`lessonId`/`cpId` into every kind.

- **Can complete a lesson**: widgets that complete
  `useCheckpoint(lessonId, cpId)`. The progress hook promotes that checkpoint
  to the lesson's exercise step. These are the Tier-A kinds (`quiz`,
  `flashcards`, `task-spec`, `self-rate`, `plays`,
  `failure-tagger`, `redaction-drill`, `drag-reorder`, `reflect-box`,
  `matrix-grid`, `slot-fill`) and the diagram kinds (`interactive-diagram`,
  `risk-pyramid`, `obligation-layers`). Inside the reader, `WidgetFrame` drops
  its own title chrome and reports its done state to the reader through
  `LabEmbedContext.onComplete`.
- **Cannot complete a lesson as they are**: the AI-Native `exercise-*` kinds,
  which store results in their own exercise store, and the `demo-*` kinds.
  Use a lab kind instead, or make the widget call `useLabCompletion` (or
  `useCheckpoint(lessonId, cpId).complete()`) when it reaches its done state.

## Formula language

Formulas are used by calculator outputs, bars, verdicts and goals, and by
threshold-lab goals. They are parsed by `src/lib/lesson-engine/expression.ts`,
which uses no `eval` and has no property access.

- **Literals**: numbers (`1.5e3`), strings (`'a'`), `true` and `false`.
- **Variables**: input and output ids. Unknown names fail validation.
- **Operators**: `+ - * / % ^`, comparisons `< <= > >= == !=`, logic `&& || !`
  and the ternary `a ? b : c`. `^` is right-associative. Unary minus binds
  tighter than `^`, so write `-(2 ^ 2)`.
- **Functions**: `min`, `max`, `abs`, `floor`, `ceil`, `round(x, digits)`,
  `clamp(x, lo, hi)`, `sqrt`, `log10` and `pow`.

## Progress and completion

- **Exercise done** is stored as the step `<lessonId>_exercise` in the lesson's
  `sectionsRead`. `CANONICAL_SECTION_IDS[slug]` registers exactly that one
  step per lesson (`engineSteps(ids)` in `src/lib/courses/completion.ts`).
- **Course reset**: checkpoints are cross-course and never cleared, so once
  the course slice has a `resetAt` a bare exercise checkpoint no longer counts.
  Only a fresh widget completion (`onComplete`) records the step again.
- **Checks passed** is stored as a perfect lesson quiz score
  (`saveLessonQuizScore(slug, id, n, n)`, written once both checks are right).
- **Lesson proof**: once both hold, `useEngineLessonProgress` calls
  `recordLessonCompletionEvidenceDurably`. For courses in
  `LESSON_ENGINE_COURSE_SLUGS`, `isLessonCompletionEvidenceBacked` requires
  `quizScore === 1`. The progress-share importer applies the same rule.
- **Retired ids** are dropped gracefully:
  - `normalizeCanonicalProgress` removes them from browser state.
  - `server-store.ts` (`dropRetiredLessonEntries`) removes them from stored
    rows before validation, so a row keeps its quiz result and timestamps and
    later syncs of that row succeed.
  - The sync API itself stays strict.
- **Workshop quiz and certificates**:
  - The final quiz stays per course (`config.ts` and `quiz/questions.json`).
  - Certificates print `certificateModules`. Verification decodes
    self-contained JSON, so old certificates keep verifying.
  - A learner who passed the quiz before a port keeps `workshopQuiz.passed`,
    but must finish the new lessons before the certificate unlocks again.
- **Analytics**: `LessonLayout` reports "reached" through the existing
  readiness path, and "completed"/"started" through `LessonFlow`'s
  `onCompleted` and `onFirstProgress`.

## Reader and hub

- `LessonLayout` (block courses) renders `LessonFlow` for engine lessons inside
  the shared `LessonShell`: sidebar, reader bar, a "Weiter: <next title>"
  button, and at the end of a module a link to the next module or the quiz.
- `BlockPageShell` labels engine courses "Modul N / M" and passes
  `moduleLabel`. It redirects retired `block_N` bookmarks to the hub.
- `ModuleOverview` is the hub: an overall ring, one "continue" link to the first
  unfinished lesson, module cards with rings and lesson rows, the shared
  `CourseAssessmentCta`, progress-link import/share and a scope notice.
  `app/<slug>/kurs/page.tsx` passes slim `ModuleOverviewModule[]`, and
  `kurs-content.tsx` adds the tagline and notice copy.
- `ModuleOverview` builds lesson links from `lessonLinks`: `"block-hash"`
  (default) gives `<coursePath>/<moduleId>#lesson=<lessonId>`, `"segment"`
  gives `<coursePath>/<moduleId>/<lessonId>` for one route per lesson
  (AI-Native).

## Design system

The lesson surface is calm and premium, not the poster look. The rules:

- Figtree type, paper grounds only (never black or near-black).
- Rounded 16-24px sheets (`rounded-2xl`, `rounded-3xl`).
- Depth only through `shadow-lab-sm`, `shadow-lab` and `shadow-lab-lg`.
- Brand washes: `lab-wash-sky`, `lab-wash-peach`, `lab-wash-acid` and
  `lab-grid-paper`.
- Kobalt (`lab-accent`) as the interactive accent; good, bad and warn tones
  with soft backgrounds. Colour is never the only signal (icon plus word).
- Motion through `m.*` inside a `MotionProvider` (`LessonFlow`,
  `ModuleOverview` and `RenderWidget` own one):
  - entrance reveals, spring feedback, animated rings, bars and numbers;
  - no infinite loops and no `transition-all`;
  - `AnimatedNumber` jumps straight to the value under reduced motion.
- 44px targets everywhere, text at 12px or larger, `aria-live` for results,
  visible focus rings.

Build new widgets from `_lab.tsx` (`LabSurface`, `LabButton`, `LabLive`,
`AnimatedNumber`, `LabVerdictPill`, `useLabCompletion` and
`formatLabValue`). Then:

1. Add the kind to `LAB_KINDS` and `REGISTRY`.
2. Add prop validation to `validate-exercise.ts`.
3. Add the file to `motion-provider-contract.test.ts`.
4. Add a unit test next to `lab-widgets.test.tsx`.

`lesson-engine-design-contract.test.ts` picks up every file in
`components/lesson-engine` and `components/widgets/lab` automatically.

## Course app

Every surface a learner sees inside the four Grundlagen courses (hub, lesson
reader, outline, final quiz and result, certificate, verification, error
states) shares one course-app system. It replaces the Werkzeichnung chrome
there: no Kopflinien, no mono caps eyebrows, no hairline ledgers, no square
boxes, no poster numerals and no scene-coloured headings.

| Piece | Path |
|---|---|
| Class recipes (`APP_CARD`, `APP_PRIMARY`, `APP_SECONDARY`, `APP_GHOST`, `APP_PILL`, `APP_FOCUS`) | `src/components/lesson-engine/app-ui.ts` |
| Grounds (`.course-app-ground`, `.course-app-hero`, `.course-app-frost`) | `src/app/globals.css` |
| Sticky course header (lesson steps, course bar) | `course-lesson-header.tsx` |
| Collapsible outline with progress dots | `course-outline.tsx` |
| Three-step indicator (Verstehen, Ausprobieren, Prüfen) | `step-flow.tsx` |
| Finite completion burst | `celebration-burst.tsx` |
| Reduced motion and Save-Data switch | `use-calm-motion.ts` |
| Contract | `course-app-design-contract.test.ts` |

- `LessonShell` takes `look="app"` and a `header` slot. `LessonLayout` turns it
  on when `BlockPageShell` passes `courseApp` (engine courses), and
  `AiNativeLessonPageShell` always does. The default `look="werk"` keeps the
  technical readers unchanged.
- The header is sticky inside the learning column, in the 3rem band the
  document already reserves (`--lesson-toolbar-h`). Its bar is course
  completion, not scroll progress.
- Mobile first: below `lg` the reader bar (`ReaderFocusBar tone="app"`) is the
  thumb-reachable action. With `engineSteps` it leads to the next open step
  ("Zur Übung", then "Zu den Fragen") and to the next lesson once the lesson
  is complete. The final quiz pins its "Weiter" button above the tab bar.
- The hub draws its learning path and the overall ring once, springs the module
  cards in and celebrates a finished course. `useCalmMotion` renders all of
  that in its final state under reduced motion or Save-Data.
- Stats are real: lessons done, modules done, minutes left. There are no
  streaks or points.

## Porting a block course (checklist)

1. **Content**:
   - Write `content/<slug>/block-N-<topic>-lessons.json` and the `en/` mirror
     in the format above.
   - Remove the old block files with `git rm`.
   - Rewrite `quiz/questions.json` (both locales, same ids, one correct option
     each; positions are shuffled at render).
   - Trim `glossary.json` to the terms the lessons use. Keep the `term` and
     `english` identity in both locales.
2. **`src/lib/course/data.ts`**: update the imports, `blockMeta` (module
   titles, one-line descriptions, minutes per module) and `lessonData` (cast
   `as unknown as RawBlockContent`).
3. **`src/lib/course/config.ts`**: update `blockIds`, `certificateModules`
   (DE and EN), the quiz count and the time limit.
4. **`src/lib/courses/completion.ts`**:
   - Set the new lesson ids in `CANONICAL_LESSON_IDS`.
   - Set `CANONICAL_SECTION_IDS[slug] = engineSteps(ids)`.
   - Add the slug to `LESSON_ENGINE_COURSE_SLUGS`.
5. **Course projects**:
   - `src/lib/course-projects/identity.ts`: point `progressLessonId` at the
     last lesson.
   - `milestone-manifest.ts`: assign the five stages (each non-empty, in
     course order).
6. **Resume routing**: check that the ids follow the `-<module>-<lesson>` rule
   (`src/lib/courses/resume.ts`).
7. **Hub**: make `app/<slug>/kurs/page.tsx` and `kurs-content.tsx` render
   `ModuleOverview`, as in `app/ki-fuehrerschein/kurs/`.
8. **Counts and copy**:
   - `app/<slug>/page.tsx`: facts, outcomes, `courseWorkload` (`PT45M` style)
     and metadata.
   - `app/<slug>/kurs/layout.tsx`, `app/<slug>/opengraph-image.tsx`.
   - `src/lib/courses/catalog.ts` (`duration`, `durationMinutes`,
     `totalLessons`, `unitLabel`, `unitCount`, description) and
     `catalog-copy.ts` (EN).
   - `src/components/home/home-copy.ts` and, if needed,
     `course-hub-copy.ts` promises.
9. **Lint config**: rename the file entries in
   `scripts/content-lint.voice-scope.json`.
10. **Tests**:
    - Replace the per-block parity and translation tests with a
      `<slug>-engine-content.test.ts` modelled on
      `ki-fuehrerschein-engine-content.test.ts` (canonical ids, DE/EN machine
      parity, `validateEngineLesson`, word caps, source hosts, synthetic data,
      dated legal statements).
    - Update the integration counts, `claim-hygiene` (engine fields),
      `config.test`, `data.test`, `questions.test`,
      `course-projects/*.test.ts` totals, `resume.test`,
      `schema-validation.test`, page tests, the hub tests in
      `course-hub-evidence-gates.test.tsx`,
      `foundation-course-block-actions.test.tsx` and
      `progress-share-paths.test.tsx`, plus e2e specs that name block titles
      or counts.
11. **Gates**:
    - From the repo root: `bun run typecheck`, `bun run lint`.
    - In `packages/website`: `bun run content:lint`,
      `bun run page-inventory:check`, `bun run english-routes:check`,
      `bunx vitest run`.

## Porting AI-Native

`AiNativeLesson` extends `BaseLesson`, so it accepts the same engine fields
in `content/ai-native/modul-N-lessons.json` (and `en/`).

**Already in place:**

- `src/lib/ai-native/data.ts` applies `projectEngineLesson`.
- `app/ai-native/kurs/[moduleId]/[lessonId]/page.tsx` renders `LessonFlow`
  (inside `AiNativeLessonPageShell`, with "next" links across modules and to
  `/ai-native/kurs/quiz`) for every engine lesson. It skips the legacy header,
  section reader, quiz and project studio.

**Still to do:**

1. **Lesson ids and modules**: keep the `modul_N_lesson_M` id shape, or update
   `courseLessonHref` in `resume.ts` for the new shape. Update `MODULE_IDS`
   in `src/lib/ai-native/types.ts` and `modules.json` if the module count
   changes.
2. **Completion**: in `completion.ts`, replace the ids in
   `AI_NATIVE_LESSON_IDS` and set
   `CANONICAL_SECTION_IDS["ai-native"] = engineSteps(AI_NATIVE_LESSON_IDS)`.
   Add `"ai-native"` to `LESSON_ENGINE_COURSE_SLUGS`, and remove
   `AI_NATIVE_TRANSFER_PROOF_LESSON_IDS` if the quizless transfer lesson goes.
3. **Projects and certificates**:
   - `course-projects/identity.ts` `progressLessonId` and the
     `milestone-manifest.ts` stages.
   - `catalog.ts` `continueHref`.
   - `config.ts` `certificateModules`.
4. **Hub**: the module pages and the `/ai-native/kurs` hub can adopt
   `ModuleOverview`. Pass modules (`id` = `modul_N`) with lesson ids and
   `lessonLinks="segment"`, which links `/ai-native/kurs/<moduleId>/<lessonId>`.
5. **Live tasks**: use `live-prompt-ab` for briefing and iteration tasks. It
   already uses the practice API with recorded fallbacks. For the other
   planned AI-Native exercises, use `calculator` (triage matrix, local vs cloud),
   `decision-wizard` (permission scopes) and `doc-builder` (capstone brief),
   or the existing `exercise-workflow-builder` and `exercise-context-budget`.
   Those two store results in the AI-Native exercise store and do not yet
   complete the reader checkpoint, so add a `useLabCompletion` call at their
   done state before using them as engine exercises.
