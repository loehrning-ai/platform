# The loehrning.ai workshop standard

Structure, materials, web pages and a gap analysis for Workshops 01 to 04.

Date: 2026-09-26. Scope: how a 60 to 120 minute workshop on an AI topic for adult business learners should run, which materials it publishes, how the workshop detail page and the workshops hub present it, and how far Workshops 01, 02 and 03 are from that. Visual design belongs to `design-direction.md` and copy voice to `slop-language.md`. This report refers to both and does not repeat them.

---

## 0. Summary: the twelve decisions

1. **Every workshop follows one spine of seven acts.** Open, wrong answer, why, fix, your go, limits, your case, close. Workshop 03's deck already runs this spine (acts 0 to 6, 75 minutes) and is the reference implementation. The spine combines Bowman's 4Cs, Merrill's First Principles and Carpentries lesson design (section 2.2).
2. **Plan 75 to 80 minutes of content for a 90-minute slot.** The rest is questions and slack. The main path of the deck (the sum of `data-seconds`) may not exceed the slot minus 15 %.
3. **Learners act at least every 15 minutes.** A vote, a prediction, a filled box or a step at the keyboard. Carpentries asks for an exercise after every 15 to 20 minutes of teaching; Wilson asks for three to five checks per hour. Workshop 03 has five room votes in 75 minutes.
4. **One question is held fixed from start to end,** and the web warm-up asks the same question as the deck's opening vote, so the closing vote can call it back. Carpentries calls this a lesson narrative and reports that it lowers cognitive load.
5. **Thirteen named components** make up a workshop, eight of them required: Brief, Warm-up question, Deck with presenter view, Practice task, Transfer exercise, Learner guide, Field card and Provenance. Setup check, Demo, Kit, Follow-up and Facilitator notes are added when the topic needs them (section 3).
6. **Each component has one job and one Diátaxis mode.** The deck and practice task teach by doing (tutorial), the setup check is a how-to, the field card and glossary are reference, and the learner guide explains. The current W03 demo mixes a tutorial stepper with an explanation of four layers, and the W01 hub mixes navigation with teaching; both suffer for it.
7. **Outcomes are written backwards from the job.** Start from what the person will do differently at work (Moore's action mapping). Write three or four outcomes with verbs you can observe, and link each to the place in the workshop where it is practised (Wiggins and McTighe's stage 2, "acceptable evidence").
8. **Above the fold, the detail page answers six questions:** what problem, for whom, how long, what do I need, what do I leave with, where do I start. The decision lab moves below the agenda, and the four collapsed "Referenz" accordions go away (section 4).
9. **Materials are grouped by when you use them** (before, during, after). Each row states its purpose, its time, its format, language and size, and whether it is optional. W03 publishes a kit, a builder guide, a browser lab, a question card and a cheat sheet that its detail page never lists.
10. **Every page states what it will not teach** and what you do not need, as fast.ai does with its "what you don't need" table.
11. **Times are measured, not estimated.** Two numbers are shown: live with a group, and alone. Three people who are not the author do a test run, and the page uses their median, rounded up to five minutes. W01 claims 90 minutes but bundles about 45 minutes of optional take-home work into its steps.
12. **Provenance is part of the product.** Every AI output shown has a recording date, and every tool requirement has a "checked on" date. Live runs are listed with their date (W03 ran live on 25 September 2026). Synthetic or real data is labelled on the page, as W03's `PUBLICATION.md` already does in its folder.

---

## 1. Method and limits

**What was read first-hand**

- Repository: `src/lib/workshops.ts`, `src/lib/workshops-data-readiness.ts`, `src/app/workshops/workshops-content.tsx`, `workshop-copy.ts`, `[slug]/workshop-detail-content.tsx`, and the JSON-LD in `[slug]/page.tsx`.
- Static materials in `public/workshops/*/`, extracted to text:
  - W01: `hub.html`, `hands-on.html`, `field-card.html`, `homework.html`, `case-study/index.html`.
  - W02: all 22 `<section>` labels of `slides.html`, the full kit zip (30 files, unpacked to scratchpad).
  - W03: all 27 `<section>` attributes of `slides.html` with the per-act time totals computed, `guide.html`, `presenter.html`, `builder.html`, `demo.html`, `PUBLICATION.md`, `data-readiness-kit/START-HERE.md`, `QUESTION-CARD.md` and `builder/CHEATSHEET.md`, plus the room votes in `lib/presenter-notes.js`.
- Screenshots: `shots/before/workshops.png`, `ws03.png`, `ws03-demo.png`, `ws03-slides.png`, `ws01-hub.png`, `ws02-slides.png` and the 18 W03 deck shots in `research/deck-shots/`.

**What limited the external research**

- The session's WebSearch budget was already used up by parallel agents (200 of 200 calls), so no search ran.
- The egress proxy blocked WebFetch on every non-GitHub domain tried: carpentries.github.io, liberatingstructures.com, blog.cathy-moore.com, bowperson.com, wikipedia.org, developers.google.com, course.fast.ai, maven.com, retrievalpractice.org, learningscientists.org, files.eric.ed.gov, arxiv.org and mdavidmerrill.files.wordpress.com. I did not try to reach blocked sites through mirrors or archives.
- GitHub (github.com and raw.githubusercontent.com) was reachable, and several primary sources live there. The table shows what was verified and how.

| Source | Status in this report | How |
|---|---|---|
| The Carpentries (Workbench episode format, workshop template, instructor training, lesson development training) | **Verified first-hand** | Raw Markdown in `carpentries/sandpaper-docs`, `carpentries/workshop-template`, `carpentries/instructor-training` and `carpentries/lesson-development-training` |
| Greg Wilson, *Teaching Tech Together* (backward design, personas, cognitive load, faded examples, six learning strategies, exercise types, checklists, peer instruction) | **Verified first-hand** | LaTeX sources in `gvwilson/teachtogether.tech` |
| Diátaxis (tutorial, how-to, reference, explanation) | **Verified first-hand** | `evildmp/diataxis-documentation-framework` sources |
| fast.ai (whole game, top-down, questionnaire, "what you don't need") | **Verified first-hand** | `fastai/fastbook/01_intro.ipynb` |
| Liberating Structures step timings | **Verified second-hand** | A third-party open-source facilitator app encodes the official menu (`luizhrs/liberating-structures-facilitator`, `src/data/structures.json`). The official site was blocked. |
| Retrieval practice, worked examples, peer instruction | **Partly verified** | Through the citations in *Teaching Tech Together*: Karpicke and Roediger 2008 (35 % to 80 %), Atkinson, Derry, Renkl and Wortham 2000, Kirschner, Sweller and Clark 2006, Crouch and Mazur 2001. Other details come from prior knowledge and are marked. |
| Maven | **Secondary** | From the sibling report `design-direction.md` (connected syllabus; search-summarised) |
| Sharon Bowman (4Cs, Six Trumps), Merrill (First Principles), Wiggins and McTighe (UbD stages, "twin sins"), Cathy Moore (action mapping), Google ML Crash Course | **From prior knowledge; not re-fetched this session** | Stated as widely published. Labelled "(not re-verified)" where specific wording matters. |

None of the standard depends on a single unverified claim. Where a point rests on an unverified source, a verified source (usually Carpentries or Wilson) makes the same point.

---

## 2. What the research says, and what we take from it

### 2.1 Source by source

| Source | Core idea | What the standard takes |
|---|---|---|
| **Backward design** (Wiggins and McTighe, *Understanding by Design*, 1998/2005; Wilson ch. "Process"; Carpentries lesson development) | Design from the end: (1) desired results, (2) acceptable evidence, (3) learning activities. Wilson's seven steps: personas, brainstorm, summative assessment, formative assessments, order them, write material between them, write the summary last. Wiggins and McTighe warn against design that is only activities ("hands-on without being minds-on") or only coverage (not re-verified). | The Brief is written **last**, from the outcomes and the practice tasks. Each outcome names the place where it is shown (section 3.4 alignment matrix). "Covering" regulation or theory is not a goal. |
| **Carpentries lesson template** (verified) | Each episode carries `teaching:` and `exercises:` minutes, `questions`, `objectives`, `keypoints`, `challenge` with nested `solution`, `instructor` notes (instructor view only), and `callout`, `prereq` and `testimonial` blocks. A lesson has `episodes/`, `instructors/` (instructor notes), `learners/` (`setup.md`, `reference.md` glossary) and `profiles/` (learner profiles). | Per act: minutes split into talk and do, the question the act answers, its objective, its key point, an exercise with a solution, and notes for whoever presents it. Every workshop has a setup page, a glossary and learner profiles. |
| **Carpentries workshop page** (verified) | Who, Where, When, Requirements, Accessibility, Recordings, Contact, FAQ, Surveys (pre and post), Schedule, Setup. | The detail page always shows Who, Requirements, Schedule and Setup. It adds "Not covered" and Provenance. |
| **Carpentries objectives** (verified) | SMART objectives written as "At the end of this session, learners should be able to ...". Avoid "know", "understand" and "appreciate". A bad example: "fully understand GitHub Actions". | Outcome formula and banned verbs (section 6.1). |
| **Carpentries exercises** (verified) | Exercises "after every 15-20 minutes of teaching". Fill in the blanks, faded examples and Parsons problems suit novices. Diagnostic multiple-choice questions: every wrong option points to one misconception. | Interaction cadence. The warm-up and room votes use diagnostic distractors, as the current decision labs already do. |
| **Carpentries narrative** (verified) | "Using a narrative throughout a lesson helps reduce learner cognitive load." "Building your lesson around a central example reduces the cognitive load of context switching." | One company and one question per workshop. W01 breaks this with four settings (section 5). |
| **Carpentries expertise** (verified) | The expert awareness gap. Avoid "just" and "simply". Ask "What questions do you have?" rather than "Any questions?". | The voice rules and presenter prompts. |
| **Wilson, memory and architecture** (verified) | Working memory holds about 4±1 items. Concept maps help cut lessons into chunks that fit. Worked examples, then faded examples, then Parsons problems and labelled subgoals. Complementary words and pictures help; redundant ones hurt (split attention). | One new idea per scene. Practice is faded, from a worked example to a completion problem to a free attempt. Slides use a drawing plus a short caption and never read out a paragraph. |
| **Wilson, six strategies** (verified) | Spaced practice, retrieval practice (Karpicke and Roediger 2008: repeated testing raised word-list recall from 35 % to 80 %), interleaving, elaboration (self-explanation, Chi 1989), concrete examples (ADEPT: analogy, diagram, example, plain language, technical detail), dual coding. | The learner guide's "Reveal the explanation" pattern (W03) becomes standard. A follow-up with three to five recall questions after one week. ADEPT is the order for explaining one concept, as W03 does with the bathtub analogy. |
| **Worked-example effect and fading** (Sweller and Cooper 1985; Atkinson et al. 2000, cited by Wilson; Renkl and Atkinson 2003 on backward fading and Kalyuga et al. 2003 on expertise reversal, not re-verified) | Novices learn more from studying worked solutions than from solving the same problems unaided. Fading removes steps one at a time, often the last step first. For experienced learners the benefit reverses. | Practice tasks follow the sequence "one worked, one half-filled, one yours". W03's five boxes show a worked FOLDLINE example beside every empty box, which is the right shape. |
| **Peer instruction** (Crouch and Mazur 2001, cited by Wilson) | Short input, then a diagnostic question, a vote, 2 to 4 minutes arguing in small groups, and a second vote. | The room vote. A vote with a split room triggers a pair discussion and a revote, which becomes a presenter-note rule. |
| **Sharon Bowman, *Training from the Back of the Room*** (2009; not re-verified) | The 4Cs are **Connections** (learners connect to the topic, to what they know and to each other), **Concepts** (short direct input), **Concrete practice** (learners do something with the concept) and **Conclusions** (learners summarise, evaluate and commit). Her "Six Trumps": movement trumps sitting, talking trumps listening, images trump words, writing trumps reading, shorter trumps longer, different trumps same. Input segments run about 10 to 20 minutes. | The spine maps onto the 4Cs (section 2.2). Learners write their own case (writing beats reading). The closing is done by the learners (a vote and one sentence), not a recap slide. |
| **Merrill, First Principles of Instruction** (2002; not re-verified) | Learning is promoted when learners (1) work on real-world problems, (2) activate prior knowledge, (3) see a demonstration, (4) apply it with coaching that fades, and (5) integrate it into their own work by reflecting, defending or creating. | The workshop is built around **one problem**. Warm-up is activation, wrong answer and fix are demonstration, your go is application, your case is integration. |
| **Cathy Moore, action mapping** (*Map It*, 2016; not re-verified) | (1) Set a measurable business goal. (2) List what people must do on the job. (3) Ask why they don't do it already: knowledge, skill, environment or motivation, and train only for the first two. (4) Design realistic practice activities, usually decisions with consequences. (5) Add only the information the activities need, and move the rest into job aids. | Each workshop names one on-the-job action (section 3.4). The Field card is the job aid, so the deck does not have to carry reference tables. The decision labs are Moore-style scenario questions. |
| **Liberating Structures** (Lipmanowicz and McCandless; timings from the open-source facilitator dataset) | **1-2-4-All**, 12 min: 1 alone, 2 in pairs, 4 in fours, 5 with all. **W³ What, So What, Now What**, about 30 to 45 min. **15 % Solutions**, 20 to 25 min: 5 alone, 10 in pairs, 10 committing in small groups. **TRIZ**, 35 to 40 min: list everything that guarantees the worst outcome, then what you already do. **Troika Consulting**, about 15 min per round. | 1-2-4-All is the default share format for "Your case". A 5-minute 15 % Solution closes the session ("What will you do on Monday, without asking anyone?"). TRIZ fits a 120-minute variant, and W04's limits act in particular ("How do we guarantee our Scope 2 figure fails the audit?"). |
| **Diátaxis** (verified) | Four kinds of documentation. Tutorial: action and acquisition ("a lesson"; "deliver visible results early and often"; "ruthlessly minimise explanation"; "aspire to perfect reliability"). How-to guide: action and application ("practical usability is more helpful than completeness"; title as "How to ..."). Reference: cognition and application. Explanation: cognition and acquisition. | Each published material has one mode (section 3.2). Setup checks are how-tos, the field card is reference, the guide is explanation, and the deck and practice are tutorials. |
| **fast.ai** (verified in fastbook ch. 1) | Teach the "whole game" (Perkins, *Making Learning Whole*): "we will teach you how to do things before we explain why they work". Each chapter ends with a **Questionnaire** and **Further Research**. A table lists what you do **not** need: lots of maths ("just high school math is sufficient"), lots of data, expensive computers. | Show the whole result early: the Brief shows the filled artefact. A "Du brauchst nicht" list sits on every detail page. The follow-up questions play the questionnaire's role. |
| **Google ML Crash Course** (2024 relaunch; not re-verified) | Every module states an estimated time, prerequisites and learning objectives, then mixes short text, interactive visualisations and "Check your understanding" questions, with a shared glossary. | Time, prerequisites and objectives sit at the top of every unit. The glossary is shared across the workshop. |
| **Maven** (secondary, via `design-direction.md`) | The hero says who the course is for and what changes. The syllabus is synced from the real course structure, and readers of the syllabus convert markedly better. | The agenda is generated from the deck's own scene data, so it cannot drift from what is taught. |
| **Wilson, checklists and motivation** (verified) | Before the event: a web page with date, place and required materials, a welcome email with setup instructions, a test of the video call. At the start: access checked and the shared notes page open. At the end: feedback and a copy of the shared material. "Achievement almost always leads to motivation." Early wins matter, and installation struggles demotivate. | The Setup check exists to prevent install trouble in the room. The first practice step has a guaranteed visible result. |

### 2.2 How the frameworks line up on one spine

| Act (DE / EN) | Minutes in a 90-min slot | Bowman 4C | Merrill | What the learner does | W03 today (act, minutes) |
|---|---|---|---|---|---|
| 0 · Ankommen / Open: the case and the one question | 5 | Connections | Problem | Reads the question and sees the route | Act 0: 4.75 |
| 1 · Die falsche Antwort / The plausible wrong answer | 8-10 | Connections | Activation | **Votes**: would you put this in the board pack? | Act 1: 9.75 |
| 2 · Warum / Why it fails | 6-10 | Concepts | Demonstration (worked example of the failure) | **Predicts** what the AI calculated, then votes | Act 2: 6.5 |
| 3 · Die Reparatur / The fix | 15-17 | Concepts to practice | Demonstration, then guided application | Fills one blank together (a completion problem) | Act 3: 17 |
| 4 · Selbst / Your go (rematch, hands-on) | 12-15 | Concrete practice | Application | **Does** the method on the case and checks against the expected result | Act 4: 12 |
| 5 · Grenzen / Honest limits | 10-15 | Concrete practice | Application | **Votes** on edge cases (refuse, warn, block) | Act 5: 15 |
| 6 · Dein Fall / Your case, then close | 12-15 | Conclusions | Integration | **Writes** the one-page template, shares (1-2-4-All), repeats the opening vote, names one next step | Act 6: 10 |
| Questions and slack | 10-15 | | | | 15 min Q&A |
| **Total** | **75-80 content + 10-15** | | | | **75 + 15** |

W03's deck already fits this table almost exactly, so it serves as the template, not a starting point to rewrite.

---

## 3. The workshop standard

### 3.1 Principles

1. **One problem, one company, one question held fixed.** The practice case is synthetic and labelled so. A second, real case is optional and comes after the method works on the synthetic one (the W02 pattern).
2. **Show the wrong answer before the right method.** Every AI workshop here begins with a plausible AI answer that is wrong for a reason the learner can name. This is the problem-centred start (Merrill) and the prediction that gives the explanation somewhere to land (peer instruction).
3. **The learner acts every 15 minutes or less,** and the action produces something visible: a vote, a number, a filled box, a file.
4. **Practice is faded.** Show one worked, then one half-filled, then one done alone.
5. **End on the learner's own case, on paper.** No company data goes into any tool during a session.
6. **Honest limits are an act, not a footnote.** What the method does not prove, and where AI still fails.
7. **Reference goes into the field card, not the deck.** The deck carries the story and the field card carries the rules (Moore: job aids).
8. **Every number and AI answer has a date and a source.** Recorded AI output is labelled "aufgezeichnet am ...", and synthetic data is labelled.
9. **Publish what was taught.** The web materials come from the same source as the live session (deck data drives the agenda), so the online version cannot drift from the room.

### 3.2 The components

Required components are marked **R**. Conditional ones (**C**) are added when the topic needs them. The mode column is the Diátaxis mode, which decides the page type and its writing style.

| # | Component (DE / EN) | When | R/C | Mode | Length | Format |
|---|---|---|---|---|---|---|
| 1 | **Steckbrief / Brief** | Before | R | Reference | 30-second scan; ≤ 200 words on page | Detail-page hero and facts, driven by the registry. Also reused as invitation text. |
| 2 | **Vorbereitung / Setup check** | Before | C (a tool, account or file is needed) | How-to | ≤ 10 min, ≤ 7 steps | Section on the detail page and top of `START-HERE.md`. Ends with "Du bist bereit, wenn ...". |
| 3 | **Einstiegsfrage / Warm-up question** | Before and start | R | Tutorial (one step) | 2 min | Decision lab on the detail page. It is the deck's opening vote. |
| 4 | **Deck + Moderationsansicht / Deck + presenter view** | During | R | Tutorial | 60-80 min main path, 18-30 scenes, plus an appendix | HTML deck on the W03 runtime (`story.css`, route bar, per-scene metadata), presenter console, self-study mode with notes. |
| 5 | **Demo / Demo** | During | C (one mechanism needs showing) | Tutorial | ≤ 10 min, 3-5 steps | Static HTML, final state visible on load, replay of dated captures. |
| 6 | **Übung / Practice task** | During | R | Tutorial | 12-25 min | Steps with expected results and "if it doesn't match", in the kit or on a sheet. |
| 7 | **Transfer / Transfer exercise** | During (end) | R | Tutorial (template) | 10-15 min plus 5-12 min sharing | One A4 page: template beside a worked example. Markdown in the kit and HTML with print CSS. |
| 8 | **Lernbegleiter / Learner guide** | After, and self-study | R | Explanation | 15-30 min read, 1,500-3,000 words | HTML, phone-first; sections follow the route; glossary. |
| 9 | **Merkkarte / Field card (one-pager)** | After | R | Reference | One A4 page | HTML with print CSS, plus PDF. |
| 10 | **Kit / Kit** | Before to after | C (files are needed) | Mixed, with a README router | Stated in MB | Zip: `START-HERE.md`, `data/`, `templates/`, `prompts/`, `expected/`, `LICENSE`, `CHANGELOG.md`. |
| 11 | **Nacharbeit / Follow-up** | After (day 7) | C (recommended) | Tutorial | 5 min of recall plus an optional 30-45 min stretch | End section of the guide, or its own page. |
| 12 | **Moderationsleitfaden / Facilitator notes** | Before (for hosts) | C (offered for others to run) | How-to | 1-2 pages plus the presenter view | Run-of-show, room, print list, cut list, frequent questions, feedback method. |
| 13 | **Stand & Herkunft / Provenance** | Always | R | Reference | 5-8 lines | Block on the detail page, plus `PUBLICATION.md` in the folder. |

A **Builder / deep-dive** guide (W03's `builder.html`) is allowed as an optional extra for implementers. It never counts toward workshop time and is labelled "Für Datenteams, optional".

### 3.3 Component specifications and quality bars

Each quality bar is written so that a person or a test can check it.

#### 1. Brief (Steckbrief)

- **Purpose:** someone can decide in 30 seconds whether this is for them, and what to prepare.
- **Contents, in this order:**
  - the title (a plain task or question);
  - a one-sentence problem;
  - the fixed question;
  - 3-4 outcomes;
  - two times (live and alone);
  - the level;
  - "Du brauchst" and "Du brauchst nicht";
  - "Nicht in diesem Workshop";
  - the artefact you leave with, shown as a picture of the filled example;
  - the data boundary;
  - the date of the last review.
- **Quality bar:**
  - Every outcome starts with a verb you can observe and links to the act or material where it is practised.
  - No outcome uses *verstehen, kennen, lernen, wissen, understand, know, learn about, appreciate*.
  - Both times come from a test run with three people other than the author (median, rounded up to 5 minutes).
  - Every requirement is exact: app name and surface, account or plan, operating system, browser, and screen size where it matters. Each carries a "geprüft am" date no older than 90 days.
  - At least three "not covered" items, each with a link to where it is covered, if anywhere.
  - No adjectives about the workshop itself (*praxisnah, spannend, hands-on, umfassend, kompakt*).
  - It passes the copy lint from `slop-language.md`.

#### 2. Setup check (Vorbereitung)

- **Purpose:** keep install and access problems out of the room. Wilson names installation struggles as a demotivator.
- **Quality bar:**
  - At most 7 numbered steps, each with its expected result.
  - The last line is "Du bist bereit, wenn du ... siehst", with a screenshot.
  - It has been tested on Windows and macOS by someone who is not the author.
  - The plan or app requirement matches the Brief word for word.
  - A "Hilfe, es klappt nicht" block lists the two most common failures. W02's START-HERE already names the top one: the double-nested folder after unzipping.

#### 3. Warm-up question (Einstiegsfrage)

- **Purpose:** activation and commitment. The learner picks an answer and a reason before any teaching.
- **Quality bar:**
  - It is the same situation as the deck's opening vote, and the deck repeats it at the close.
  - Three decisions and three reasons, and every wrong option maps to one named misconception (a diagnostic distractor).
  - Feedback is 40 words or fewer and names the evidence.
  - Nothing is stored or sent, and the page says so. The current `WorkshopDecisionLab` already meets this.

#### 4. Deck and presenter view (Folien + Moderationsansicht)

- **Purpose:** carry the session along the spine.
- **Required scene metadata** (W03 already has all of it except `data-mode`): `data-act`, `data-label`, `data-seconds`, `data-note`, `data-note-key`, `data-route`, `data-kind="main|appendix"`, `data-recovery-seconds`. A new `data-mode="listen|vote|do|pair|write"` would let the agenda show what the learner does.
- **Required presenter fields per scene** (the W03 console has them): room vote, ask aloud, say this, must say, ask / expected / reveal or cut, a clock against the target, a jump-to-scene control and appendix routes.
- **Quality bar:**
  - The sum of main-path `data-seconds` is at most the slot minus 15 %.
  - No stretch of more than 15 minutes of main path without a scene of mode `vote`, `do`, `pair` or `write`.
  - One new idea per scene. No text block over 25 words on a slide, except quoted AI output.
  - The route bar is visible on every main scene.
  - Every AI answer is labelled as recorded, with its date.
  - The cut list frees at least 10 minutes without losing an outcome.
  - A second facilitator has run it once from the notes alone.
  - A self-study mode shows the notes below each scene for people without a presenter.

#### 5. Demo

- **Purpose:** show one mechanism that a slide cannot: the same input through two setups, side by side.
- **Quality bar:**
  - It answers exactly one question, written at the top.
  - **The final state is visible on load**, with nothing empty to fill in. Replay is optional.
  - It uses predict, then reveal, then check against the definition, with controls placed beside the figure they change.
  - It has no second topic. A layered "how it works" explanation belongs in the guide or builder.
  - It stays at 10 minutes or less.
  - On a phone it is readable, with lanes stacked.
  - Replayed data carries its capture date.
  - No offset "stamp" shadows (see `design-direction.md` §7.7).

#### 6. Practice task (Übung)

- **Purpose:** the learner does the method once, on the case, with support.
- **Quality bar:**
  - Faded: one worked step, one half-filled, one alone.
  - Each step states its expected result and what to do if it doesn't match (W02's START-HERE is the model).
  - Success is checkable: a number matches, a file exists, a test passes.
  - At most one new tool.
  - A novice has finished it in the stated time.
  - A solution or expected output ships in the kit.

#### 7. Transfer exercise (Transfer)

- **Purpose:** apply the method to the learner's own situation (Merrill's integration, Moore's on-the-job action).
- **Quality bar:**
  - It fits on one A4 page.
  - Every box has a worked example from the case beside it (W03's five boxes are the model).
  - It tells the learner to use an invented or anonymised example and to put no company data into any tool.
  - It ends in one sentence template, for example W03's "For this question, using this approved data and this definition, we tested these boundaries; the next unknown is this one."
  - It needs no software.
  - Sharing uses 1-2-4-All (12 minutes) or "two pairs share their hardest box" (5 minutes).

#### 8. Learner guide (Lernbegleiter)

- **Purpose:** the whole workshop in reading form, for people who missed it or want to reread.
- **Quality bar:**
  - Sections mirror the acts.
  - Each section runs: the question, a short answer, a "Reveal the explanation" retrieval prompt, and one key point.
  - The outcomes can be reached from the guide alone (tested with one reader).
  - Every term is in the glossary.
  - It teaches nothing the deck doesn't, and says where to go deeper.
  - It works on a 390-pixel screen.
  - It passes the copy lint.
  - W03's `guide.html` meets all of these and is the template.

#### 9. Field card (Merkkarte)

- **Purpose:** a job aid at the desk, with the rules and none of the story.
- **Quality bar:**
  - It prints on one A4 page at 100 % (test with print-to-PDF).
  - Five to eight blocks, each holding a rule, a "Do" line and a "Don't" line, and a number.
  - No concept that is not in the deck.
  - Each block points to its scene.
  - Body text is at least 9 pt in print.
  - W01's `field-card.html` and W03's `builder/CHEATSHEET.md` are the models (CHEATSHEET's Do/Don't blocks especially).

#### 10. Kit

- **Purpose:** everything needed to do the practice and the transfer offline.
- **Quality bar:**
  - `START-HERE.md` opens with what to open first in 5 lines or fewer.
  - Every file the deck names exists with that exact name.
  - Data is synthetic and licensed, and `CHANGELOG.md` dates the last test with the AI tool.
  - It opens without installing anything.
  - The size appears on the detail page.
  - It contains no personal data.
  - It includes expected outputs.

#### 11. Follow-up (Nacharbeit)

- **Purpose:** spaced retrieval and one stretch task.
- **Quality bar:**
  - Three to five questions that need recall rather than recognition, with answers behind a reveal.
  - The page suggests doing them after about a week.
  - The stretch task has data and a checkable result (W01's "Stretch: your first honest forecast" is the model).
  - Time is stated per tier (W01: 15 and 45 minutes).

#### 12. Facilitator notes (Moderationsleitfaden)

- **Purpose:** someone other than the author can run the workshop.
- **Contents:**
  - group size and room layout;
  - what to print (field card, transfer page);
  - a run-of-show table (act, minutes, mode, material);
  - the cut list;
  - five questions asked in real sessions, with answers;
  - how to collect feedback: minute cards before a break, "one up, one down" at the end (Carpentries).
- **Quality bar:** one run by a second facilitator.

#### 13. Provenance (Stand & Herkunft)

- **Lines:**
  - author and licence;
  - content last reviewed on;
  - AI outputs recorded on (model and tool named if known);
  - tool requirements checked on;
  - live runs with date and host;
  - synthetic or real data;
  - sources with "published" and "reviewed" dates.
- **Quality bar:** no line is older than 180 days without a review note. W03's `PUBLICATION.md` and W02's Meta source block show the right content; it needs to be visible on the page.

### 3.4 The alignment matrix (fill in first, before any slide)

This is backward design in one table. If a row has no evidence cell, the outcome is cut or the practice is added. If an activity has no row, the activity is cut.

| On-the-job action (Moore) | Outcome (verb) | Evidence: where the learner shows it | Activity (act) | Material |
|---|---|---|---|---|
| Before forwarding an AI number, check whether it is a level or a change | Recognise a level/change mix-up in an AI table | Room vote in act 2; guide section 2 reveal | Act 1-2 | Deck, guide |
| Before connecting AI to data, write down what the number means | Write the four blanks plus "who counts" for one question | Box 3 of the transfer page | Act 3, act 6 | Deck, question card |
| ... | ... | ... | ... | ... |

(The example rows are W03's.) The matrix lives in the facilitator notes and drives the Brief's outcomes.

### 3.5 Session variants

- **60 minutes:**
  - Open 4.
  - Wrong answer 8, merged with why.
  - Fix 12.
  - Your go 10.
  - Limits 6, one vote only.
  - Your case 10: pairs share, no 1-2-4-All.
  - Close 3.
  - Slack 7.
  - Cut: generalisation, and appendix only on request.
- **90 minutes:** the spine in section 2.2.
- **120 minutes:**
  - The spine.
  - A 10-minute break after act 3.
  - "Your go" at the keyboard with the real tool, 30 minutes (the W02 style).
  - TRIZ or Troika on own cases, 20 minutes, instead of 1-2-4-All.
- **Self-study (online), same spine:**
  - Warm-up on the detail page, 2 min.
  - Deck in self-study mode or the learner guide, 25-40 min.
  - Demo or practice, 10-25 min.
  - Transfer page, 15 min.
  - Field card.
  - Show the measured total, typically 55-80 min.

### 3.6 Registry changes that make the standard enforceable

This is a proposal for the build agents. Field names are suggestions. It keeps today's `Workshop` and adds fields.

```ts
type WorkshopNumber = "01" | "02" | "03" | "04";
type Phase = "before" | "during" | "after";
type Mode = "listen" | "vote" | "do" | "pair" | "write";
type MaterialRole =
  | "setup" | "deck" | "presenter" | "demo" | "practice" | "transfer"
  | "guide" | "fieldCard" | "kit" | "followUp" | "facilitator" | "builder" | "dataset";

interface WorkshopOutcome { readonly text: string; readonly practisedIn: string /* agenda id */ }
interface WorkshopAgendaItem {
  readonly id: string; readonly title: string; readonly minutes: number;
  readonly mode: Mode; readonly doing: string /* what the learner does, one line */;
}
interface WorkshopNeed { readonly label: string; readonly detail?: string; readonly checkedAt?: string }
interface WorkshopNotCovered { readonly text: string; readonly seeAlsoHref?: string }

interface WorkshopMaterial /* extends today's */ {
  readonly role: MaterialRole; readonly phase: Phase;
  readonly minutes?: number; readonly sizeBytes?: number;
  readonly optional?: boolean; readonly primary?: boolean /* "Hier starten" */;
}

interface Workshop /* additions */ {
  readonly number: WorkshopNumber;
  readonly problem: string;            // one sentence, <= 160 chars
  readonly question: string;           // the fixed question, shown in the q-card
  readonly level: string;              // e.g. "Einstieg, ohne SQL"
  readonly minutesLive: number;        // replaces the free-text duration
  readonly minutesSelfStudy: number;   // measured
  readonly outcomes: readonly WorkshopOutcome[];      // 3-4
  readonly needs: readonly WorkshopNeed[];
  readonly notNeeded: readonly string[];
  readonly notCovered: readonly WorkshopNotCovered[]; // >= 3
  readonly agenda: readonly WorkshopAgendaItem[];     // derived from deck data where a deck exists
  readonly artifact: { readonly label: string; readonly previewSrc: string; readonly href: string };
  readonly liveRuns?: readonly { readonly date: string; readonly host?: string }[];
  readonly lastReviewed: string;
  readonly aiOutputsRecordedAt?: string;
}
```

**Tests** to add, in the style of the existing `workshops.test.ts`:

- The agenda minutes add up to `minutesLive` minus the Q&A slack.
- For workshops with a deck, each agenda item's minutes equal the sum of `data-seconds` of its act, read from `slides.html`, rounded.
- 3 ≤ outcomes ≤ 4, and each `practisedIn` points to an agenda id.
- No outcome begins with a banned verb.
- `notCovered.length ≥ 3`.
- Every material has `role` and `phase`, and exactly one has `primary: true`.
- Every file in `public/workshops/<slug>/` that is meant for learners is listed in `materials` (this catches W03's hidden kit, builder guide and lab).
- `lastReviewed` is no older than 180 days on build.
- The JSON-LD `LearningResource` gains `timeRequired` (ISO 8601, e.g. `PT90M`), `teaches` (outcomes), `competencyRequired` (needs), `educationalLevel` and `audience`.

---

## 4. Information architecture

This section covers content and order only. The visual blueprints are in `design-direction.md` §7.1 and §7.2. Where this section differs from them, the difference is stated.

### 4.1 Workshop detail page (`/workshops/[slug]`), sections in order

**Above the fold** means 1440×900 on desktop and 390×844 on a phone. It must answer six questions:

1. **What problem?** The kicker "Workshop 03 · Datenbereitschaft", the H1 title, and one problem sentence. Example: "Eine KI liefert eine glaubwürdige Monatszahl, die falsch ist. Du siehst, warum, und was sie repariert."
2. **Which question?** The q-card with the fixed question. On a phone it drops just below the fold.
3. **How long?** "Live 90 Min. · allein ca. 60 Min."
4. **What do I need?** The two or three most important needs in one line: "Browser · kein Konto · kein SQL".
5. **What do I leave with?** "Du gehst mit: Fünf-Felder-Vorlage", with a small thumbnail of the filled example.
6. **Where do I start?** One primary button pointing at the `primary` material (for example "Lernbegleiter lesen" or "Deck öffnen"), and one secondary button, "Material ansehen ↓".

A caption line under the buttons holds the level, the material language if it differs from the page, and whether the data is synthetic.

**Below the fold, in this order:**

| # | Section (DE / EN) | Content | Notes |
|---|---|---|---|
| 1 | Hero (above) | See above | |
| 2 | **Danach kannst du / After this you can** | 3-4 outcomes, verb first, each with a small link "geübt in: Akt 3 · Übung". | Replaces the hub-only `outcome` label. Visible, not in an accordion. |
| 3 | **Ablauf / Agenda** | The Route. One station per act with its title written as what the learner does ("Du stimmst ab: Würdest du die Zahl weitergeben?"), its minutes, and a mode mark (listen, vote, do, pair, write). A toggle switches between "Live · 90 Min." and "Allein · ca. 60 Min.". | Generated from deck data where a deck exists. `design-direction.md` §6.10 draws it. Adds the mode mark and the toggle. |
| 4 | **Probier die erste Frage / Try the first question (2 min)** | The decision lab. | **Moved below the agenda** (today it comes first). Once the learner knows what the workshop is, the question reads as a taste of act 1 rather than a quiz with no context. Labelled with its time. |
| 5 | **Material** | Grouped as Vorher / Im Workshop / Danach. Each row has a pictogram, name, a one-line purpose (≤ 90 characters), minutes, a format · language · size chip, "optional" where it applies, and an action (Öffnen ↗ / Laden ↓). One row is marked "Hier starten". "Alles als Zip (x MB)" sits at the end. | Lists **everything** a learner may use. For W03 that adds the kit, question card, browser lab, cheat sheet and builder guide (optional, "Für Datenteams"). |
| 6 | **Voraussetzungen / What you need** | Two columns: "Du brauchst" (exact items, each with "geprüft am" where relevant) and "Du brauchst nicht" (the fast.ai pattern: no programming, no SQL, no company data, no paid account). If a Setup check exists, it follows here as a numbered how-to ending in "Du bist bereit, wenn ...". | New. Today, access sits in one "Zugang und Datenfluss" line. |
| 7 | **Nicht in diesem Workshop / Not covered** | 3-5 items, each with a "stattdessen" link where one exists (a course or another workshop). | New. |
| 8 | **Der Fall / The case** | The company, its "synthetic" label, a 2-3 sentence narrative, a stat row, the decision question, "Was die Daten nicht beantworten", and the optional real-world case with source, published and reviewed dates. | Today inside an accordion. `design-direction.md` §7.2 lays it out. |
| 9 | **Für wen / Who it's for** | 2-3 learner profiles written concretely ("Controllerin im Mittelstand, liest jeden Monat einen 8-Seiten-Bericht, hat Claude noch nicht für Zahlen benutzt"), plus one line "Eher nicht für dich, wenn ...". | Carpentries profiles. The "nicht für dich" line is new and honest. |
| 10 | **Selbst moderieren / Run it yourself** | For hosts: presenter view (P key), run-of-show table, what to print, cut list, licence terms. Collapsed by default is acceptable here, because this audience is secondary. | Only if facilitator notes exist. |
| 11 | **Stand & Herkunft / Provenance** | Author · last reviewed · AI outputs recorded on · requirements checked on · live runs (date, host) · data synthetic/real · licence. | Replaces the scattered notes. |
| 12 | **Häufige Fragen / FAQ** (optional) | 3-5 questions actually asked in live runs. | Only real questions. |
| 13 | **Weiter / Next** | One related workshop and one course, each with one line on why. | |

**What goes away:**

- The four collapsed "Referenz" accordions ("Worum es geht", "Für wen", "Der Übungsfall", "Die sechs Schritte"). Their content is promoted to sections 2, 3, 8 and 9.
- The step list with tool chips, which the Route replaces.
- The long `description` paragraph. It splits into the problem sentence, the outcomes and the case narrative.
- The format/duration/steps/materials count row. Counts of steps and files tell a learner nothing, so they are replaced by the times and the needs.

**How to show each element:**

- **Agenda:** stations with verbs and minutes; mode marks drawn in the deck's pictogram family. Do not show scene counts in the agenda; "26 Szenen" belongs on the deck's material row.
- **Outcomes:** at most four; one sentence each, 20 words or fewer; no icons; each linked to where it is practised.
- **Prerequisites:** the two-column "brauchst / brauchst nicht" list. The single most limiting need (an account or app) also appears in the hero caption. Plans and apps carry a "geprüft am" date.
- **Materials:** grouped by phase; the primary material first; sizes for downloads; the language chip only when it differs from the page language. Keep the existing one-line note "Alle Materialien auf Englisch" when true.

### 4.2 Workshops hub (`/workshops`), sections in order

| # | Section | Content |
|---|---|---|
| 1 | **Hero** | Kicker "Workshops · 4 · kostenlos". An H1 that describes the format rather than praising it, for example "Workshops: ein Fall, 90 Minuten, eine Vorlage für deine Arbeit". One lead sentence: "Jeder Workshop beginnt mit einer KI-Antwort, die plausibel klingt und falsch ist, und endet mit einer Seite für deinen eigenen Fall. Live mit Gruppe oder allein im Browser." A text link "Wo anfangen?" pointing to row 4. |
| 2 | **So läuft jeder Workshop / How every workshop runs** | The spine as a static Route with five stations: Die Frage · Die falsche Antwort · Warum · Die Reparatur · Deine Vorlage. Below it, the component set in one line: "Du bekommst immer: Folien · Lernbegleiter · Merkkarte · Vorlage. Je nach Thema: Demo · Kit." |
| 3 | **Workshop list** | One row per workshop, **not** pastel cards (see "per row" below). |
| 4 | **Wo anfangen? / Where to start** | A four-row table for choosing. Columns: "Wenn du ...", "Workshop", "KI-Konto nötig", "Dauer". Rows: "keinen KI-Zugang hast" → 01 or 03; "Monatsberichte liest" → 02; "Nachhaltigkeitsdaten sammelst" → 04. |
| 5 | **Für Teams / Run it with your team** | Two sentences on the presenter view and the licence, with a link to each workshop's "Selbst moderieren" section. Offer booking only if the owner actually offers it; do not invent it. |
| 6 | **Boundary line** | "Alle Fälle sind erfunden. Gezeigte KI-Antworten sind Aufzeichnungen mit Datum, keine Live-Abfragen." (From design-direction; keep.) |

**Per row:**

- workshop number and topic;
- title;
- the one-sentence problem;
- the fixed question in quotes;
- "Du gehst mit: <artefact>";
- times (live and alone);
- the limiting need ("kein Konto" or "Claude-Zugang");
- "Live getestet am 25.09.2026" where true;
- the deck cover as a picture;
- one text link, "Workshop ansehen".

**Order:** the recommended start first (03, which needs no account and no prior knowledge), then 04 as new, then 02 and 01. Alternatively newest first, with a "Neu" chip on 04.

**Removed from the hub:**

- the "Wähle die Entscheidung" heading and the "Erste Entscheidung: ..." line (they lean on the decision lab, which a visitor has not seen yet);
- the green acid "summary" highlight box;
- the step and file counts;
- the pastel washes and offset sheets (design-direction §8);
- the long accessNote paragraphs. The hub shows only the limiting need; the detail page carries the rest.

### 4.3 Static material pages (`public/workshops/<slug>/*.html`)

- **One material bar across all workshops:** workshop number, then tabs in the order of the spine (Deck, Lernbegleiter, Demo, Übung/Kit, Merkkarte), then "← Zur Workshop-Seite" and the language switch. Design-direction §7.7 specifies the look.
- **The top of each material page states its role and time** in one line, for example "Lernbegleiter · zum Nachlesen · 20 Min." and "Merkkarte · zum Ausdrucken · 1 Seite".
- **W01's "Hub" page is removed as a material.** Its job is taken by the detail page. Its "What you'll learn" list moves into the registry's outcomes, rewritten.

---

## 5. Gap analysis: Workshops 01, 02 and 03 against the standard

**Scale:**

- **Yes** means present and meeting the bar.
- **Partial** means present, below the bar, or not surfaced on the web page.
- **No** means missing.

### 5.1 Matrix

| Component | W01 Prognosen | W02 Geschäftsberichte | W03 Datenbereitschaft |
|---|---|---|---|
| 1 Brief | **Partial.** Summary, audience and "Go/No-Go-Regel" exist. The hub's four "What you'll learn" items use slogans ("earns its workflow", "not a gut feeling"). No needs list, no "not covered". Currency conflict: the page says euros; `hub.html` and `hands-on.html` say "in dollars". | **Partial.** A good access note and audience. The need "passender Claude-Zugang" is vague: START-HERE requires the Claude desktop app's Claude Code surface "on your subscription". No "not covered". | **Partial.** Strong summary, audience ("ohne SQL") and access note. No outcome sentences (only "Fünf-Felder-Vorlage") and no "not covered". The time on the cover and card ("75 minutes") differs from the page ("~90 Minuten") without saying that 15 minutes are Q&A. |
| 2 Setup check | n/a (browser only) | **Partial.** An excellent "Get set up (2 minutes)" in the kit's START-HERE, with the double-folder pitfall. Not on the web page. | n/a for the core; optional "Try it in Claude" setup lives in guide §6 |
| 3 Warm-up | **Yes.** "1.050 Stück. Wer bekommt sie?" | **Yes.** The CRAFT decision | **Partial.** "100 € + 20 €" is a good diagnostic item but is **not** the deck's opening vote ("Put this in the board pack? Trust · Challenge · Refuse"), so the page and the room start from different hooks. |
| 4 Deck + presenter | **No.** There is no deck. The "hub" plus three labs plus an 11-station case replace it. A live group has nothing to present from, and there are no notes or timings. | **Partial.** A 22-slide deck with a route bar ("This bar comes back on every prompt slide") and copyable prompts. **No presenter notes** (no `data-note` or `data-seconds`), and only "90 minutes" as a total. Brutalist chrome: uppercase tracked mono, a two-tone headline ("Make **Decisions**"). | **Yes.** The reference: 18 main scenes in 7 acts (4.75 / 9.75 / 6.5 / 17 / 12 / 15 / 10 minutes = 75), 9 appendix scenes, five room votes, and a presenter console with vote, say-this, must-say, ask/expected/reveal-cut, clock against 75:00, and recovery seconds on the transfer scene. |
| 5 Demo | **Partial.** The three-act hands-on lab is interactive, but each act uses a different setting (parcel network, device maker, social app), none of which is the launch case. | n/a (the live Claude session is the demo) | **Partial, and weak** as the owner noted. It opens on empty lanes ("Press 'Replay on both'") and a large blank band. It is two demos in one page (lanes, then a 5-part "how the AI finds the right answer" stepper). A question switcher adds net new MRR and logo churn, breaking "one question held fixed". Stamp shadows and a full-width red button. |
| 6 Practice task | **Partial.** A good "Stretch" exercise (104-week CSV, two forecasts, four numbers), but it is filed as take-home, not practised in the session. | **Yes.** Five prompts, each leaving a file, with "What to expect" and "If it doesn't match". | **Partial.** A strong practice exists (`readiness-lab.html`, 12 minutes, operator/witness/skeptic roles; guide §6 "Try it in Claude", 10 minutes) but **neither is listed** on the detail page. |
| 7 Transfer | **Partial.** Step 06 promises "in five sentences on your own case", but no template exists. The field card has none, and the homework's open challenge only says "your domain". | **Yes.** `your-company-skill/` template, "Next month" slide, and the Meta case as a second application. | **Yes.** Five boxes: the deck scene `your-data`, `QUESTION-CARD.md` with a worked FOLDLINE example per box, guide §5, and a closing sentence template. |
| 8 Learner guide | **No.** There is no readable narrative. MAE, WAPE, bullwhip, newsvendor and z are used without a glossary, although managers are named as audience. | **Partial.** The guide is `START-HERE.md` inside the zip. There is no web guide, and no glossary (Skill, NCR, P1/P2, CRAFT flag). | **Yes.** `guide.html`: route-shaped sections, "Reveal the explanation" retrieval, a 20-term glossary, phone-friendly. |
| 9 Field card | **Yes.** `field-card.html`: A4 print CSS, six blocks with numbers. It is dense and includes US incidents; acceptable. | **No.** The "Check the answer" slide holds the two universal prompts ("Where did that come from?", "Argue the other side") that would make an ideal one-pager. | **Partial.** `builder/CHEATSHEET.md` is a real A4 Do/Don't sheet, but it is buried in the builder kit and not an HTML/PDF material. |
| 10 Kit | **Partial.** A CSV and generator script, not packaged, with no START-HERE. | **Yes.** 30 files, START-HERE, worksheet, half-written skill, dashboard template, both cases. Copy needs a de-slop pass (30 em dashes in START-HERE alone). | **Partial.** `data-readiness-kit.zip` (1.1 MB) is thorough, but **not listed** on the detail page. It is reachable only from `builder.html` and presenter notes. |
| 11 Follow-up | **Yes.** Take-home tiers of 15 and 45 minutes plus an open challenge. No recall questions. | **Partial.** "Go further" (three harder prompts) and "Next month". No recall questions. | **Partial.** READY-CANVAS and scenarios in the kit. No recall questions. |
| 12 Facilitator notes | **No** | **No** | **Partial.** An excellent presenter console, plus `builder/claude-demo/PRESENTER-NOTES.md`. No one-page run-of-show, print list or cut list on the web. |
| 13 Provenance | **Partial.** Footer line "Synthetic practice-market teaching data; invented figures". No dates. | **Partial.** The Meta source has published and reviewed dates. There is no date for when the prompts were last run against the current Claude app. The host slide says the author is a Data Engineer at Meta while case 2 analyses Meta's quarter; **add a one-line disclosure**. | **Yes** in the folder (`PUBLICATION.md`, recording dates on the page). Partial on the page: the live run on 25 September 2026 (with Brainster, per the cover) is not stated as evidence. |
| Spine / narrative | **Weak.** Four settings: three lab lenses, a launch case (set in "Macedonia" stores, with a "Snowflake" data-source slide), plus a separate 104-week product series. High context-switching load. | **Good.** One company, NORTHWIND, one decision (CRAFT), then one real case | **Excellent.** One company, one question, seven acts |
| Time honesty | **Weak.** "~90 Minuten" for three labs, an 11-station case, a 15-45 minute take-home and a transfer | **Unclear.** 90 minutes for five prompts, plus case 2 and "Go further", with no split between core and optional | **Good.** "75 min + 15 min Q&A", with optional parts labelled |
| Web page exposes structure | **Partial.** Six materials in a flat list; a "Hub" row that duplicates the page | **Partial.** Two materials (deck, zip); START-HERE, worksheet and setup live only in the zip | **Weak.** Three of about eight learner-facing materials listed; builder, kit, lab and cheat sheet hidden |

### 5.2 What to do, ranked by value per workshop

**Workshop 03** (closest to the standard; fix the web surface and the demo):

1. **List everything on the detail page, grouped by phase:**
   - Vorher: Lernbegleiter (optional preview).
   - Im Workshop: Deck, Demo, Question card (print), Browser lab (12 min, optional).
   - Danach: Merkkarte (turn `CHEATSHEET.md` into `field-card.html` with print CSS), Kit (zip, 1.1 MB), "Try it in Claude" (10 min, needs a Claude account), Builder guide ("Für Datenteams, optional").
2. **Rebuild the demo around one question** (ending MRR only):
   - Both answers, the Truth Chart and the definition check are visible on load.
   - Replay is an optional button.
   - Move the four-layer "How the AI finds the right answer" stepper to the builder guide, or give it its own explainer.
   - Remove the net-new and churn switcher; the builder's modules 1 and 2 already cover them.
   - The rebuild order is in `design-direction.md` §7.7.
3. **Make the web warm-up the deck's opening vote.** Show the recorded AI table and ask "Würdest du das ins Board-Pack legen? Übernehmen · Nachfragen · Ablehnen", with reasons as diagnostic distractors. Keep "100 + 20" as the reveal inside the feedback.
4. **Write four outcomes** (section 6.1) and three "not covered" items. State "Live getestet am 25.09.2026".
5. **Add `data-mode` to scenes** so the agenda shows where learners act.

**Workshop 02** (strong practice; add the missing presenter layer and a field card):

1. **Add presenter notes and timings to the 22 slides**, using the W03 schema: `data-act`, `data-seconds`, `data-note`, must-say and ask/expected. Split the time into a core of five prompts (about 75 minutes) and optional parts (Go further, Meta case), each timed.
2. **Create a field card** from the "Check the answer" slide, the metric-definition pattern and the reading rules: "Woher kommt die Zahl?", "Argumentiere dagegen", "Definiere vor dem Rechnen", "Prüfe eine Zahl gegen die Quelle".
3. **Publish a web learner guide** that mirrors START-HERE, with a glossary (Skill, NCR, P1/P2, Claude Code surface), and bring the setup check onto the detail page.
4. **Make the requirement exact.** Name the app surface and the plan requirement with a "geprüft am" date, and say that files go to the service.
5. **Add a disclosure line for the Meta case,** and a "prompts last tested on" date.
6. **Restyle the deck chrome** to the W03 system (design-direction §7.7) and de-slop the kit copy.

**Workshop 01** (needs the most structure; its content is good):

1. **Choose one setting.** Recommended: keep the launch case (1,370 / 1,180 / 1,050) as the single company and re-skin the three lab acts as three moments of that same launch (capacity for launch week, buffers down the chain, the release gate after launch). The alternative is to state openly that the labs are three separate "lenses" and cut the time claim accordingly.
2. **Build a deck with a presenter view** on the W03 runtime. The labs become the "your go" act and the case becomes acts 1 to 3. Without a deck, W01 cannot run live.
3. **Write a learner guide with a glossary** (MAE, bias, WAPE, service level, safety stock, bullwhip, newsvendor, z) in the W03 guide format.
4. **Create the promised transfer page:** five sentences, or five boxes, each beside a worked launch example. For instance: "Entscheidung, die die Prognose ändert", "Heutige Faustregel", "Kosten zu viel / zu wenig", "Wer gibt Ausnahmen frei", "Woran merkst du, dass sie kippt".
5. **Fix the currency** (euros everywhere, or dollars everywhere with a reason), and **fix the time**: "Kern: Labore und Fall, 90 Min. · Übung: 15 bis 45 Min. zusätzlich".
6. **Remove the "Hub" material row.** The detail page is the hub.

**Workshop 04** (new): build it to this standard from the first file. Section 7 gives the slot map.

---

## 6. Presenting a workshop "down to earth"

The copy rules in `slop-language.md` apply. This section adds rules specific to workshop pages, with examples from the current registry.

### 6.1 Outcome statements

**Formula:** "Danach kannst du [observable verb] [concrete object] [in which context or with what], [criterion if there is one]."

**Verbs to use:**

| Language | Verbs |
|---|---|
| DE | ausrechnen, prüfen, erkennen (with an object you can point at), aufschreiben, begründen, vergleichen, festlegen, nennen, entscheiden |
| EN | work out, check, spot, write down, argue, compare, set, name, decide |

**Banned in outcomes:**

| Language | Words |
|---|---|
| DE | verstehen, kennenlernen, ein Gefühl bekommen, Einblick, beherrschen, souverän, fit machen, meistern |
| EN | understand, learn about, get a feel for, master, unlock, empower, level up |

**Rewrites for the three existing workshops:**

| Workshop | Today | Down-to-earth outcomes (DE) |
|---|---|---|
| 01 | "Go/No-Go-Regel"; hub: "Make a model earn its workflow"; "Price the buffer: service level is a cost decision, not a gut feeling" | 1. Du rechnest in Euro aus, ob eine Prognose die Faustregel schlägt, die deine Planer heute benutzen. 2. Du bestimmst aus den Kosten von zu viel und zu wenig ein Servicelevel und daraus einen Puffer. 3. Du schreibst eine Freigaberegel: wann die Prognose automatisch läuft und wann eine benannte Person entscheidet. 4. Du nennst vier Arten von Ereignissen, die kein Modell vorhersagt. |
| 02 | "Kennzahlen-Skill + Dashboard" | 1. Du schreibst für fünf Kennzahlen eines Monatsberichts auf, was sie in diesem Unternehmen bedeuten, und speicherst das als Claude-Skill. 2. Du lässt Claude den Bericht nach diesen Regeln auslesen und prüfst eine Zahl gegen Datei und Spalte der Quelle. 3. Du begründest eine Entscheidung mit der tragenden Zahl, den Kosten eines Irrtums und dem, was die Daten nicht beantworten. 4. Du wendest denselben Skill auf den nächsten Monatsbericht an. |
| 03 | "Fünf-Felder-Vorlage" | 1. Du erkennst, ob eine KI einen Bestand oder eine Veränderung ausgegeben hat. 2. Du schreibst für eine eigene Frage fest, welche Art Zahl, welche Zeilen, welcher Zeitraum und welche Tabelle gemeint sind, und wer mitzählt. 3. Du unterscheidest eine Anweisung an die KI von einer Datenbankberechtigung und sagst, welche von beiden etwas verhindert. 4. Du schreibst einen Test mit erwarteter Antwort und der Quelle des richtigen Werts. |

EN follows the same sentences. Example for 03: "Spot whether an AI returned a balance or a change."

### 6.2 Realistic time

- **Show two numbers:** "Live mit Gruppe: 90 Min." and "Allein: ca. 60 Min.". Show "ca." only on the self-study number, and round it up to 5 minutes.
- **Measure:** three test readers who are not the author; take the median.
- **Say what the live time contains:** "75 Min. Programm, 15 Min. Fragen".
- **Label optional parts with their own time** and never add them into the headline: "Übung · 45 Min. · optional", "Builder-Leitfaden · ein Nachmittag · für Datenteams".
- **Do not show counts** such as "6 Schritte" or "3 Dateien" as if they were effort. Show minutes.
- **Match the cover, card and page.** W03 today says 75 on the cover and card and ~90 on the page.

### 6.3 What you need, stated exactly

**Format:** item, precise detail, date checked where it can change.

- **W02:** "Claude-Desktop-App mit Claude Code (Plan mit Claude-Code-Zugang, geprüft am ...) · Windows oder macOS · ein Zip entpacken können · 20 Min. Vorbereitung beim ersten Mal, falls die App neu ist."
- **W03:** "Ein Browser, am besten ein großer Bildschirm für die Folien · Papier und Stift für die fünf Felder · optional ein Claude-Konto für den 10-Minuten-Versuch."
- **W01:** "Ein Browser, Desktop für die Labore · ein Tabellenprogramm für die Übung (Excel, LibreOffice oder Google Tabellen)."

**"Du brauchst nicht" (fast.ai pattern), per workshop, from:**

- keine Programmierkenntnisse;
- kein SQL;
- keine Statistik über den Durchschnitt hinaus;
- keine eigenen Firmendaten (alles ist erfunden und mitgeliefert);
- kein KI-Konto (W01, W03).

### 6.4 What you will not learn

Say it plainly, and link to where it is covered if it is:

| Workshop | Nicht in diesem Workshop |
|---|---|
| 01 | Kein Modellbau und kein Programmieren. Keine Auswahl von Prognose-Software. Keine Herleitung der Statistik (Formeln werden benutzt, nicht bewiesen). Keine Planung für dein konkretes Sortiment. |
| 02 | Keine API, keine Datenbank, keine Automatisierung. Kein Grundkurs Bilanzanalyse. Keine echten Unternehmensdaten in Claude: im Workshop nur das erfundene Kit. Kein Vergleich von KI-Anbietern. |
| 03 | Kein SQL-Kurs. Kein Aufbau eines Data Warehouse (dafür der optionale Builder-Leitfaden). Keine Aussage, ob ein bestimmtes KI-Produkt sicher ist. Keine Freigabe oder Zertifizierung für ein echtes System. |

### 6.5 Honest labels that belong on every workshop page

- "Alle Zahlen sind erfunden" (or "echte, öffentliche Zahlen von ... , Quelle, Datum").
- "Die gezeigten KI-Antworten wurden am ... aufgezeichnet und sind keine Live-Abfragen."
- "Ein gelungener Übungsfall ist keine Freigabe für ein echtes System." (W03 has this; generalise it.)
- "Live getestet am ... mit ... Teilnehmenden" when true.
- W02 only: "Der Autor arbeitet bei Meta; Fall 2 nutzt nur Metas öffentliche SEC-Mitteilung." Keep it to one line.

### 6.6 Current copy that reads as slop, with plain rewrites

These are from the registry and materials. The patterns are named in `slop-language.md`.

| Where | Today | Pattern | Plain version |
|---|---|---|---|
| Hub kicker | "Entscheidungswerkstatt · Selbstgeführt" | coined label | "Workshops · kostenlos" |
| Hub H1 | "Selbstlern-Workshops für konkrete Entscheidungen." | abstract promise | "Workshops: ein Fall, 90 Minuten, eine Vorlage für deine Arbeit." |
| Hub intro | "Erst entscheiden, dann Belege prüfen und die Methode auf den eigenen Kontext übertragen." | triad | "Jeder Workshop beginnt mit einer KI-Antwort, die plausibel klingt und falsch ist, und endet mit einer Seite für deinen eigenen Fall." |
| W01 step 03 | "Der Wert steckt im geregelten Ablauf, nicht in der schöneren Kurve." | staged contrast | "Du vergleichst beide Betriebsarten nach verlorener Kapazität." |
| W01 hub | "A forecast only earns its keep when it changes a decision." / "The mindset that outlives every model" | aphorism, significance inflation | "Eine Prognose lohnt sich, wenn sie eine Entscheidung ändert, zum Beispiel wie viele Fahrer du morgen einplanst." Cut the mindset line. |
| W01 homework | "the open challenge makes it yours" | chat residue | "Die offene Aufgabe: dieselbe Rechnung mit einer eigenen Zeitreihe." |
| W02 step 02 | "Das Herzstück: ..." | puffery | "Schritt 2: Du schreibst die Kennzahl-Regeln." |
| W02 step 05 | "Am Ende steht keine Zusammenfassung, sondern eine Entscheidung" | staged contrast | "Am Ende entscheidest du: nacharbeiten oder mehr Marketingbudget." |
| W02 description | "Fünf Prompts, ein Analyst." | staccato fragment | "Du arbeitest mit fünf Prompts in der Claude-App." |
| W03 summary | "Eine Frage, zwei Datenstände, zwei Antworten." | staccato triad | "Dieselbe Frage an zwei Datenstände: einmal falsch, einmal richtig. Du siehst, woran es liegt." |
| Detail page | "Referenz ... zum Nachlesen nach der ersten Entscheidung." | meta-signposting | Remove; the sections carry their own headings. |

### 6.7 Show the real thing

- **Show the filled artefact on the page:** a picture of the completed five boxes (W03), the filled dashboard (W02), a written go/no-go rule (W01). People judge usefulness from the artefact, not the adjectives.
- **Agenda stations say what the learner does** ("Du stimmst ab", "Du füllst fünf Felder aus"), not topic nouns ("Semantische Schicht").
- **Screenshots of scenes are real scene captures,** not drawn app windows (design-direction §1.3).

---

## 7. Workshop 04 (ESG) in the standard's slots

This is a slot map only. The concept and the regulation facts belong to the W04 concept work and `esg-regulation.md`.

| Slot | W04 content (proposal) |
|---|---|
| Fixed question | One reported figure, for example "Wie hoch waren unsere Scope-2-Emissionen 2025, standortbasiert, und woher kommt jede Zahl?" (design-direction proposes "Stimmt die Scope-2-Zahl, und woher kommt sie?"). |
| Company | One synthetic company with meter readings, energy invoices and a spreadsheet export. |
| Warm-up and opening vote | A recorded AI summary gives a clean total. "Würdest du die Zahl in den Bericht übernehmen? Übernehmen · Nachfragen · Ablehnen." |
| Act 1-2: wrong answer and why | A worked example of the failure. Likely failure classes to pick one from: kWh vs MWh; a double-counted site; market-based and location-based mixed; an estimate presented as a measurement; the wrong year's emission factor. Pick **one** as the headline and keep the others for the limits act. |
| Act 3: fix | An evidence table (Belegtabelle): every figure gets its source document, unit, factor, method and status (measured, estimated, missing). |
| Act 4: your go | Learners trace two figures to their source on paper or in the kit. The expected result is given. |
| Act 5: limits | A vote on "estimate vs measured", what AI must not claim (green claims), and that this is not legal advice. **TRIZ variant** for 120 minutes: "Wie garantieren wir, dass unsere Zahl im Audit durchfällt?" |
| Act 6: your case | A one-page transfer: one figure you report, its sources, unit, factor, owner and what is missing. 1-2-4-All. |
| Field card | "Einheit? Faktor und Jahr? Standort- oder marktbasiert? Gemessen oder geschätzt? Quelle?" as Do/Don't blocks. |
| Not covered | No legal advice; no full CSRD/ESRS walk-through; no Scope 3 calculation; no assurance readiness. |
| Provenance | The regulatory "as of" date on the relevant scene (the facts in `esg-regulation.md` are dated 26 September 2026 and flag unverified items). |

---

## 8. Definition of done for a workshop (checklist)

1. The alignment matrix is filled. Every outcome has evidence, and every activity serves an outcome.
2. The Brief contains 3-4 outcomes with observable verbs, two measured times, exact needs with "geprüft am" dates, a "brauchst nicht" list, at least 3 "not covered" items and an artefact preview.
3. The warm-up equals the deck's opening vote, uses diagnostic distractors, and comes back at the close.
4. The deck has per-scene act, seconds, notes and mode. The main path is at most the slot minus 15 %. There is an interaction at least every 15 minutes, and a cut list of at least 10 minutes.
5. The presenter view has been run by someone other than the author.
6. The practice task is faded, with expected results and "if it doesn't match" help, and has been tested by a novice in the stated time.
7. The transfer page is one A4 page, has a worked example per box, and needs no tool and no company data.
8. The learner guide mirrors the acts, has reveal prompts and a glossary, and passes the copy lint.
9. The field card prints on one A4 page, with Do/Don't blocks and nothing new.
10. The kit (if any) has START-HERE in 5 lines or fewer, expected outputs, a size shown on the page and a dated CHANGELOG.
11. Every learner-facing file is listed in `materials`, with role, phase, minutes and whether it is optional.
12. Provenance shows: last reviewed, AI outputs recorded on, requirements checked on, live runs, synthetic or real, licence.
13. The DE page and EN mirror match, and the material language is stated when it differs.
14. Cover, hub card, detail page and deck state the same times.
15. The copy passes the `slop-language.md` lint, including no em-dash chains and no staged contrasts.

---

## 9. Sources

**Verified first-hand in this session (GitHub):**

- The Carpentries, Workbench episode format: https://github.com/carpentries/sandpaper-docs/blob/main/episodes/episodes.Rmd
- The Carpentries, lesson folder structure: https://raw.githubusercontent.com/carpentries/sandpaper-docs/main/episodes/introduction.md
- The Carpentries, workshop website template: https://github.com/carpentries/workshop-template/blob/gh-pages/index.md
- The Carpentries instructor training:
  - https://raw.githubusercontent.com/carpentries/instructor-training/main/episodes/02-practice-learning.md
  - https://raw.githubusercontent.com/carpentries/instructor-training/main/episodes/04-expertise.md
  - https://raw.githubusercontent.com/carpentries/instructor-training/main/episodes/05-memory.md
  - https://raw.githubusercontent.com/carpentries/instructor-training/main/episodes/06-feedback.md
  - https://raw.githubusercontent.com/carpentries/instructor-training/main/episodes/18-preparation.md
- The Carpentries lesson development training:
  - https://raw.githubusercontent.com/carpentries/lesson-development-training/main/episodes/lesson-design.md
  - https://raw.githubusercontent.com/carpentries/lesson-development-training/main/episodes/objectives.md
  - https://raw.githubusercontent.com/carpentries/lesson-development-training/main/episodes/formative-assessment.md
  - https://raw.githubusercontent.com/carpentries/lesson-development-training/main/episodes/narrative.md
  - https://raw.githubusercontent.com/carpentries/lesson-development-training/main/episodes/audience.md
  - https://raw.githubusercontent.com/carpentries/lesson-development-training/main/episodes/explanation.md
- Greg Wilson, *Teaching Tech Together*, source chapters (`process.tex`, `memory.tex`, `architecture.tex`, `individual.tex`, `exercises.tex`, `classroom.tex`, `motivation.tex`, `checklists.tex`) and `book.bib`: https://github.com/gvwilson/teachtogether.tech/tree/master/en
- Daniele Procida, Diátaxis, sources (`index.rst`, `tutorials.rst`, `how-to-guides.rst`, `compass.rst`): https://github.com/evildmp/diataxis-documentation-framework
- Jeremy Howard and Sylvain Gugger, fastbook chapter 1 (whole game, top-down, questionnaire, "what you don't need"): https://github.com/fastai/fastbook/blob/master/01_intro.ipynb
- Liberating Structures step timings as encoded by an open-source facilitator app (third party; official site blocked): https://github.com/luizhrs/liberating-structures-facilitator (`src/data/structures.json`)

**Cited through Wilson's bibliography (verified as citations; papers not opened):**

- Karpicke, J. D. and Roediger, H. L. (2008). The critical importance of retrieval for learning. *Science* 319(5865), 966-968.
- Kirschner, P. A., Sweller, J. and Clark, R. E. (2006). Why minimal guidance during instruction does not work. *Educational Psychologist* 41(2), 75-86.
- Atkinson, R. K., Derry, S. J., Renkl, A. and Wortham, D. (2000). Learning from examples: instructional principles from the worked examples research. *Review of Educational Research* 70(2), 181-214.
- Crouch, C. H. and Mazur, E. (2001). Peer instruction: ten years of experience and results. *American Journal of Physics* 69(9), 970-977.
- Chi, M. T. H. et al. (1989). Self-explanations. *Cognitive Science* 13(2), 145-182.

**From prior knowledge; not re-fetched (network blocked):**

- Bowman, S. (2009). *Training from the Back of the Room!* Pfeiffer.
- Merrill, M. D. (2002). First principles of instruction. *Educational Technology Research and Development* 50(3), 43-59.
- Wiggins, G. and McTighe, J. (2005). *Understanding by Design*, 2nd ed. ASCD.
- Moore, C. (2016). *Map It: The Hands-On Guide to Strategic Training Design*. Montesa Press.
- Sweller, J. and Cooper, G. A. (1985). The use of worked examples as a substitute for problem solving in learning algebra. *Cognition and Instruction* 2(1).
- Renkl, A. and Atkinson, R. K. (2003). Structuring the transition from example study to problem solving. *Educational Psychologist* 38(1).
- Kalyuga, S. et al. (2003). The expertise reversal effect. *Educational Psychologist* 38(1).
- Google, Machine Learning Crash Course (2024 edition): https://developers.google.com/machine-learning/crash-course
- Liberating Structures, official menu: https://www.liberatingstructures.com/

**Secondary (sibling report):** Maven, connected syllabus and landing hero, as summarised in `research/design-direction.md` §1.2.

**Repository files read:**

- `packages/website/src/lib/workshops.ts`, `workshops-data-readiness.ts`
- `src/app/workshops/workshops-content.tsx`, `workshop-copy.ts`, `[slug]/workshop-detail-content.tsx`, `[slug]/page.tsx`
- `public/workshops/ki-prognosen-einschaetzen/{hub,hands-on,field-card,homework}.html`, `case-study/index.html`
- `public/workshops/geschaeftsberichte-mit-ki-lesen/slides.html`, `northwind-analyst-kit.zip`
- `public/workshops/datenbereitschaft-fuer-ki/{slides,guide,presenter,builder,demo}.html`, `PUBLICATION.md`, `lib/presenter-notes.js`, `data-readiness-kit/{START-HERE,QUESTION-CARD}.md`, `data-readiness-kit/builder/CHEATSHEET.md`
- Screenshots: `shots/before/{workshops,ws03,ws03-demo,ws03-slides,ws01-hub,ws02-slides}.png`, `research/deck-shots/*.png`
