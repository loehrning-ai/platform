# AI slop in learning content: pattern catalogue, voice spec and lint plan (EN + DE)

Research report for the loehrning.ai overhaul (courses, workshops, demos, new Workshop 04).
Date: 2026-09-26. Repository read-only: `/home/user/platform` (app in `packages/website`).

## How this was researched, and its limits

- The egress proxy blocked direct fetches of en.wikipedia.org, arXiv, PMC, GOV.UK guidance, NN/g, BVA, t3n and most other sites. Where a page was blocked I used (a) GitHub mirrors and repositories, read in full through raw.githubusercontent.com, and (b) WebSearch result summaries. Section 5 says for each source which way it was read.
- Wikipedia "Signs of AI writing" was read through two mirrors: the structured pattern catalogue `egc365/signs-of-ai-writing` and the `blader/humanizer` SKILL.md (v3.0.0), which implements the Wikipedia catalogue with before/after pairs.
- Kobak et al. numbers were **recomputed from the authors' published data** (`berenslab/llm-excess-vocab`, `results/yearly-counts.csv.gz` and `results/excess_words.csv`) with the paper's formula. My value for "potential" (excess gap 5.22 percentage points) matches the paper's quoted 0.052, so the reproduction is faithful.
- Repository measurements come from read-only Node scripts that import `packages/website/scripts/content-prose.mjs` (the lint's own discovery and prose extraction). The scripts are in the scratchpad (`scratchpad/tmp/`): `slop-scan.mjs`, `shapes.mjs`, `rhythm.mjs`, `density.mjs`, `petwords.mjs`, `gaps.mjs`, `run-gaps.mjs`, `proposed.mjs` + `run-proposed.mjs`, and the paste-ready rule set `paste-ready-rules.mjs` with its self-test `paste-ready-test.mjs` (41 rules, 0 failures) and corpus counter `paste-ready-corpus.mjs`.
- Learner corpus measured: 274 learner-facing files, 306,272 words, as discovered by `collectLearnerFacingFiles()`.

---

## 0. Key findings

1. **The site's slop is now mostly structural.** Earlier passes removed the vocabulary tells: `delve`, `robust`, `ganzheitlich`, `umfassend`, `In der heutigen Zeit` and similar phrases have 0 to 5 hits in 306k words. What reads as AI now is a set of sentence and paragraph shapes that the current lint does not see:
   - staged contrasts (`Das ist kein Tippfehler. Das ist der teuerste Satz.`; 12 split-sentence cases, 31 `nicht …, sondern` and 13 `kein …, sondern` without `auch`)
   - headline-style prose: count-first fragments (`Fünf Prompts, ein Analyst.`, 52), list-colon openers (`Memos, Briefe, Vorlagen: …`, 28), colon reveals (`Das Herzstück: …`, 17), sentences with two or more colons (43)
   - staccato fragments (`Du nutzt KI schon. Jeden Tag. Seit Jahren.`): 18.1% of German body sentences have four words or fewer
   - aphorisms (`Governance gehört vor den Prompt, nicht hinter den Vorfall.`) and tailing negations (`…: zum Prüfen, nicht zum Verkaufen.`; median 1.8 per 1,000 words, top files above 5)
2. **The rewrite passes swapped one set of tics for another.** The lint budgets `nicht nur … sondern auch` (one per lesson), so authors moved to `nicht X, sondern Y` and to the two-sentence `Das ist kein X. Das ist Y.`, which count against no budget. A new house vocabulary also appeared: `konkret` 283 times (17.5 per 10k German words), `Freigabe*` 289, `prüfbar` 103, `belastbar` 53, and English `explicit*` 156 times. Every rule needs a matching "don't over-correct" note (§3.7).
3. **The workshop surfaces sit outside the lint.** Nothing under `public/workshops/**` (slides, guide, builder, demo, presenter, hub, hands-on; about 30k words of HTML and JS strings) is checked by the voice rules or the em-dash rule. Also outside: `src/lib/workshops-data-readiness.ts` (1.5k words), `eigene-ki-copy.de.ts` and `.en.ts` (the `-copy.ts` matcher misses the `.de` and `.en` infix), `src/lib/course-projects/*` (6.5k words) and the data-science and data-engineering chapter TSX components. Workshop 04 content will be unchecked too unless it is registered (§4.4).
4. **Single tells are weak evidence. Clusters and uniformity are strong.** Wikipedia's guide and the calibrated `stopslop` linter agree on this. Scored against labelled human and AI corpora, an em-dash-only rule had a lift of 0.87, meaning it fired on human text more often than on AI text; after tightening it reached 1.66. A fragment/rhythm rule stayed below 1 (0.52 → 0.66). A combined uniformity statistic reached 3.95. So: make high-confidence phrase rules errors, make shape rules density warnings, and add one burstiness metric.
5. **Workshop 03's deck is the house exemplar.** It holds one question fixed, names a made-up company (FOLDLINE, 144 accounts), shows the wrong answer with real numbers (−€19,960 / €9,775 / €42,565), and checks it against the database before it defines "semantic layer". It uses contrast rarely, and only where the audience actually holds the belief being corrected (`Loaded is not the same as used.` after "cited the definition 0 of 3"). §3 turns this into rules.
6. **Workshop 04 (ESG) has two domain traps.**
   - Greenwashing register: generic environmental claims such as "klimaneutral" and "umweltfreundlich" are banned in B2C commercial communication by Directive (EU) 2024/825 from 27 Sep 2026 unless they are substantiated.
   - Terms of art that look like puffery: `wesentlich`, `Wesentlichkeit`, `material` and `double materiality` are ESRS vocabulary, and `wesentliche Änderung` is statutory in the AI Act course (21 of the 37 current `wesentlich*` hits). Keep them off every puffery list. If a rule is wanted at all, treat it like the existing `grundsätzlich`: an ambiguous warning, never an error.

---

## 1. Why LLM text reads like LLM text (evidence base)

| Finding | Source | Use for this project |
|---|---|---|
| In 15M+ PubMed abstracts, 2024 shows a jump in **style words**, unlike the COVID-era jump, which was almost all content words. At least 13.5% of 2024 abstracts were LLM-processed, up to 40% in some sub-corpora. 66% of 2024 excess style words are verbs and 14% adjectives. | Kobak et al., *Science Advances* 11:eadt3813 (2025); v1 title "Delving into ChatGPT usage in academic writing through excess vocabulary" (arXiv 2406.07016v1, June 2024: ≥10%, up to 30%) | Word lists (below). The signal is **style verbs and adjectives**, not nouns. |
| Overuse of `delve`, `intricate` and `underscore` points to preference tuning (RLHF). The authors found no evidence that training data, architecture or algorithm choices play a role. | Juzek & Ward, COLING 2025 (arXiv 2412.11385) | The tics are **trained dispositions**: they return in every draft unless something checks for them. |
| Instruction-tuned models use present participial clauses at 2 to 5 times the human rate and nominalizations at 1.5 to 2 times. The gap is larger for instruction-tuned models than for base models. | Reinhart et al., *PNAS* 122(8) e2422455122 (2025) | Checking `-ing` riders and German Nominalstil is justified. |
| GPT-4o answers with an em dash rose from under 1 in 10 to over half within 2025. "Not just X, but Y" appeared in 6% of July 2025 chats. (328,744 messages analysed.) | Washington Post, Nov 2025 | Dashes and staged contrast are the two most visible tells to the public. |
| Em-dash prevalence in medRxiv Discussion sections went from 4.23% (pre-ChatGPT) to 11.58% after it, and reached 20.3% in 2025. Eight published human essays (57k words) average 3.23 em dashes per 1,000 words, with wide variation by genre and author. | "Em-ergence of the em-dash" (arXiv 2606.29540); Freeburg, "The Last Fingerprint" (arXiv 2603.27006) | One dash proves nothing. Density does. The repo already bans dashes in content. |
| The "not X, but Y" upgrade frame (epanorthosis) is a trained disposition, driven by promotional prose in training data and preference tuning. A one-line instruction cuts it by half to three quarters. The goal is the human rate for each genre, not zero. | "Artificial Epanorthosis" (arXiv 2607.21498) | Budget contrasts; do not ban them. Keep the ones that correct a belief the reader really holds. |
| Slop judgments are partly subjective but correlate with **density, relevance and coherence** problems. | Shaib, Chakrabarty, Garcia-Olano, Wallace, "Measuring AI 'Slop' in Text" (arXiv 2509.19163, rev. Jan 2026) | The fix is information: each sentence has to add a fact. Swapping words does not help. |
| Some LLM n-grams are over 1,000 times more frequent than in human text. A sampler suppresses 8,000+ patterns while keeping quality. | Paech et al., "Antislop", ICLR 2026 (arXiv 2510.15061); `sam-paech/slop-forensics`; EQ-Bench Slop Score (60% word, 15% trigram weight) | Phrase lists work, but they need regular re-measurement because model habits drift. |
| Frequent LLM users detect AI text accurately without training. They point to vocabulary, formulaic structure and lack of originality. | Russell, Karpinska & Iyyer, ACL 2025 (arXiv 2501.15654) | The site's readers include such people. The owner's "too much AI slop" is this detector at work. |
| An em-dash-only rule fired on human text more than on AI text (lift 0.87, 1.66 after tightening). A fragment/rhythm rule stayed below parity (0.52 → 0.66). A burstiness + vocabulary-diversity + trigram rule reached 3.95. | `mgiovani/stopslop` PR #72 (Sep 2026), scored on 83 labelled corpus cells | Severity design: shape rules warn by density, never error on a single hit. |
| "Slop" was Merriam-Webster's 2025 Word of the Year: "digital content of low quality that is produced usually in quantity by means of artificial intelligence". | Merriam-Webster, Dec 2025 | Shared vocabulary for the owner's complaint. |

### 1.1 Excess vocabulary, recomputed (PubMed abstracts, 2024 vs. 2021–2022 extrapolation)

Formula: expected frequency q = f(2022) + 2 · max(f(2022) − f(2021), 0). Excess ratio r = p/q, excess gap δ = p − q, where p is the observed 2024 frequency (share of abstracts that contain the word).

**Highest ratio (rare words, strong single-word tells):** delves r = 28.2 · underscores 13.8 · delved 12.3 · showcasing 10.7 · meticulously 10.5 · delve 7.9 · intricacies 7.7 · underscoring 7.5 · intricate 7.4 · surpassing 7.1 · commendable 6.8 · underscore 6.7 · garnered 5.3 · realm 5.0 · groundbreaking 4.9 · renowned 4.9 · emphasizing 4.7 · encompassing 4.4 · necessitating 4.3 · revolutionize 3.9.

**Highest gap (common words, weak alone but frequent):** potential δ = 5.2 pp · findings 4.1 · crucial 3.7 (r 2.11) · additionally 3.7 (r 1.91) · exhibited 3.2 · insights 3.0 (r 2.04) · particularly 2.8 · comprehensive 2.7 (r 1.76) · enhance 2.3 · notably 2.2 (r 2.64) · enhancing 2.1 (r 2.43).

**Words named in the brief:** pivotal r 3.06 · leveraging 3.08 (leverage 1.22) · seamlessly 3.08 · seamless 2.16 · fostering 3.12 · transformative 2.98 · multifaceted 2.87 · nuanced 2.73 · testament 2.57 · paving 2.39 · interplay 2.12 · valuable 2.01 · unlock(ing) 1.73–1.88 · landscape 1.47 · robust 1.28 · holistic 1.23 · key 1.11. `tapestry` has r 5.5 but is almost absent from biomedicine; it is a general-prose tell.

German: I found **no German excess-vocabulary study** comparable to Kobak's; a Korean one exists (arXiv 2609.07447). The German lists below come from practitioner guides (t3n, Landsdorfer, korrektur.de, eology, lillikoisser.at), the German plain-language literature and this repository's own data. Treat them as editorial rules, not as measured frequencies. One quantified German data point: `spielt eine entscheidende Rolle` appeared in 43% of suspected-AI paragraphs versus 6% of confirmed-human ones in 200 student introductions (korrektur.de, 2026; small, non-peer-reviewed sample).

---

## 2. Ranked catalogue of slop patterns

### 2.1 Ranking and status overview

Ranking weighs three things: (a) how rarely a careful human writer does it on purpose (signal strength, per Wikipedia/humanizer and stopslop calibration), (b) how often it occurs in **this** repository today, and (c) how much it irritates the site owner's audience of German Mittelstand professionals. "Repo" counts are raw hits in the 306k-word learner corpus unless noted.

| # | Pattern | Signal | Repo today | Lint today | Proposed rule (severity) |
|---|---|---|---|---|---|
| 1 | Staged contrast / negative parallelism | strong | 12 split-sentence DE; 31 `nicht…, sondern`; 13 `kein…, sondern`; EN 3 | only `nicht nur…sondern auch`, `not only…but also` (budget 1/lesson) | VOICE-CONTRAST (error for split-sentence form; budgets for the rest) |
| 2 | Headline prose: colon reveal, stacked colons, list-colon opener, count-first fragment | strong in clusters | 18 + 43 + 28 + 52; workshops.ts, demos-copy.ts, hub.html | none | VOICE-SHAPE (warn, density) |
| 3 | Staccato fragments and punchline closers | medium (humans do it too) | 18.1% of DE body sentences ≤ 4 words; 22 runs of 3+ | none | VOICE-RHYTHM (warn) |
| 4 | Tailing negation tag (`…, nicht zum Verkaufen.`) | medium | DE 345, EN 117; median 1.8/1k words, p90 3.7 | none | VOICE-SHAPE density ≥ 4/1k words (warn) |
| 5 | Sayings that sound deep: aphorism, chiasmus, "the real question" | strong when repeated | `die eigentliche Frage`, `The value sits in…`, `Governance gehört vor den Prompt…` | none | VOICE-APHORISM (warn) |
| 6 | Forced triads (inline, list, paragraph) | medium | 26% of lists have 3 items (VOICE-LISTS limit 60%); inline triads unmeasured | lists only | extend VOICE-LISTS with inline triad share (warn) |
| 7 | Significance inflation and puffery vocabulary | strong for rare words, weak for common | low: `entscheidend` 5, `Herzstück` 1, `crucial` 0 | partial (EN filler list, few DE) | VOICE-PUFFERY (error after allowlisting legal terms) |
| 8 | Chat residue and sycophantic or empathic framing | strongest (residue) / medium (empathy) | 0 today | none | VOICE-RESIDUE (error) |
| 9 | Throat-clearing openers and signposting | strong | 1 (`Im Folgenden`) | partial (VOICE-OPENER) | extend VOICE-OPENER |
| 10 | Rhetorical question plus instant answer | medium | 0 matched by the anchored rule; opener-question variants in `demos-copy.ts` | none | VOICE-SHAPE (warn) |
| 11 | Restating closers and "Key Takeaways" boxes that repeat | medium | covered for `Fazit` / `Zusammenfassung` | VOICE-CLOSER (warn) | extend markers (`Unterm Strich`, `Kurz gesagt`, `The bottom line`) |
| 12 | Hedging and hedge stacks | medium | 0 stacks | partial (VOICE-HEDGE) | add stacks |
| 13 | Transition crutches | medium | low (`zudem` etc. only counted) | partial | add `Additionally,` `Notably,` `Des Weiteren` … |
| 14 | Dashes as universal connector (em, en, spaced hyphen, ` -- `) | weak alone, strong in density | 1 in corpus; about 30 in `public/workshops` (mostly table placeholders) | error for content/TSX/lib; **not public HTML/JS** | extend scope |
| 15 | Nominal style / Substantivitis / Funktionsverbgefüge / Amtsdeutsch | medium | low in corpus (EU AI Act course has the legal register) | none | VOICE-NOMINAL (warn) |
| 16 | Copula avoidance and false agency (`dient als`, `Die Daten zeigen`) | medium | low | none | inside VOICE-PUFFERY (warn) |
| 17 | Vague attribution, unsourced generalisation | strong | `KI-Projekte scheitern selten an der Technik.` (demos-copy.ts) | `Studien zeigen` (JSON only), `Experten sind sich einig` | extend VOICE-CLAIM |
| 18 | Symmetric shapes / low burstiness / template paragraphs | strongest statistically | card grids and blurbs of equal shape (workshops.ts, demos-copy.ts) | report only (mean, SD) | VOICE-RHYTHM coefficient-of-variation check (warn) |
| 19 | Pet-phrase repetition and elegant variation | medium | `konkret` 17.5/10k, `prüfbar` 6.4/10k, `explicit` 12.4/10k, `earns its cost` ×3 | none | voice report "top repeated words" (report only) |
| 20 | Formatting by rule (bold labels, Title Case EN, emoji, heading per two sentences) | weak alone | not measured | none | VOICE-SHAPE markdown checks (warn) |
| 21 | Placeholders, knowledge-cutoff and citation-token residue | strongest | 0 | CONTENT_GUIDE forbids placeholders; no check | VOICE-RESIDUE (error) |

### 2.2 Pattern details

Notation: regexes are shown with readable Unicode and are meant to be wrapped in the module's `wordPattern(source, flags)` helper, which adds Unicode-aware word boundaries. `CLAUSE` is the module's `[^.!?\n]{0,120}?`. ASCII-only versions ready to paste (the module must stay ASCII-only) are in `scratchpad/tmp/paste-ready-rules.mjs`; each rule has positive and negative self-tests there.

---

#### 1. Staged contrast / negative parallelism (epanorthosis)

- **EN:** "It's not a tool, it's a mindset." · "This is not a company ranking. It is the ground under a decision…" (`content/books/ki-landschaft/en/09_ausblick.md`) · "The goal is not to remove human follow-up. It is to…" (`content/ai-native/en/modul-4-lessons.json`) · "more than just a checklist" · "The question isn't X. It's Y." · "Sales are not demand." (`src/lib/workshops.ts`)
- **DE:** "Das ist kein Tippfehler. Das ist der teuerste Satz im ganzen Text." (`ki-arbeitsalltag/06`) · "Das ist kein KI-Problem. Das ist ein Datenproblem." (`ki-arbeitsalltag/07`) · "Der erfolgreiche Login ist nicht das Ende, sondern der Anfang." (`ai-native/modul-4`) · "Am Ende steht keine Zusammenfassung, sondern eine Entscheidung" (`workshops.ts`) · "Die Frage ist nicht, *ob* du sie nutzt, sondern *wie bewusst*." · "Das Problem ist nicht die KI, das Problem ist das Briefing." · "mehr als nur eine Übersicht"
- **Why it reads as AI:** The negative half names something nobody claimed, so the positive half sounds bigger. It adds emphasis but no new claim. It is the most over-represented rhetorical frame in current model output (WaPo; the epanorthosis paper; top of slop-forensics trigram lists) and ranks first in the humanizer and stop-slop catalogues. German models produce it as `nicht X, sondern Y` and `kein X. Das ist Y.`; the latter dodges the repository's current budget.
- **Fix:** State Y and put the evidence behind it. Keep the contrast only when (a) the reader really holds belief X and (b) both halves carry information. Workshop 03 does this with "Loaded is not the same as used." right after "cited the definition 0 of 3". EU AI Act normative contrasts ("nicht der Anbieter, sondern der Betreiber muss…") are legitimate and belong on the allowlist with a reason.
  - Before: "Das ist kein KI-Problem. Das ist ein Datenproblem. Und es zu lösen ist der erste Schritt…"
  - After: "Bring die Daten zuerst in eine Tabelle. Erst dann lohnt sich ein Prompt."
- **Regex:**
  - `de-contrast-kein-das-ist`: `(?:Das|Dies|Es) (?:ist|sind|war|waren) kein(?:e|en|er)? [^.!?\n]{1,80}\.\s+(?:Das|Dies|Es) (?:ist|sind|war|waren)` (case-sensitive)
  - `de-contrast-es-geht-nicht`: `(?:Es geht|Entscheidend ist|Wichtig ist|Das Problem ist|Die Frage ist|Das Ziel ist) nicht${CLAUSE}[,.]\s*(?:sondern|Es geht|Entscheidend ist|Die Frage ist|Das Problem ist)` (i)
  - `de-count-nicht-sondern` (budget 1/lesson): `nicht${CLAUSE},\s*sondern(?! auch)` (i)
  - `de-count-kein-sondern` (budget 1/lesson): `kein(?:e|en|er|em)? [^.!?\n,]{1,60},\s*sondern(?! auch)` (i)
  - `de-contrast-mehr-als-nur`: `(?:weit |viel )?mehr als (?:nur|bloß|ein bloße[rs]?)` (i)
  - `en-contrast-its-not-its`: `(?:it|this|that)(?:['’]s| is| was) not ${CLAUSE}[,;:.]\s*(?:it|this|that)(?:['’]s| is| was)` (i)
  - `en-contrast-question-isnt`: `The (?:question|problem|point|issue|answer|goal|risk) (?:is not|isn['’]t) ${CLAUSE}[.,;]\s*(?:it['’]s|it is|the (?:question|problem|point|issue) is)` (i)
  - `en-contrast-not-just`: `(?:is|are|was|were|it['’]s|that['’]s)(?: not|n['’]t) (?:just|merely|simply) (?:a|an|the|about)|more than (?:just|a mere|merely)` (i). "only" is excluded on purpose because `en-count-not-only-but-also` already covers it.
- **False-positive risk:** Low for the split-sentence form: `Das ist kein Problem. Du kannst …` does not match because the second sentence must restart with Das/Dies/Es + copula. Medium for `nicht…, sondern`, which is legitimate in legal and definitional prose, hence the budget. Low for `mehr als nur` (`mehr als 100 Euro` does not match).

#### 2. Headline prose: colon reveals, stacked colons, list-colon openers, count-first fragments

- **EN:** "In short: Claude continues text…" · "Five prompts, one analyst." · "One launch, three numbers, and constrained supply: allocation decision, system map, …" (`workshops.ts`) · "Three interactive acts on one page: …" · "Ask for a tool, not an answer. One sentence, one working page." (W02 `slides.html`) · "Eight metrics, four departments, twelve commentary lines." (`ai-native/en/challenges.json`)
- **DE:** "Das Herzstück: Der Kennzahlen-Skill liegt halb fertig im Kit." · "Fünf Prompts, ein Analyst." · "Ein Launch, drei Zahlen, eine knappe Menge: …" · "Memos, Briefe, Vorlagen: jeden Tag dieselbe Arbeit." · "Recherche, Synthese, Kritik, Redaktion: vier Schritte, vier Zuständigkeiten." (`demos-copy.ts`) · "Eine Frage, zwei Datenstände, zwei Antworten." (`workshops-data-readiness.ts`) · "Das Ergebnis: 40 Prozent des Arbeitstags …" · "Das Dashboard … öffnet die Seite: Umsatz je Linie …, offene Eskalationen und die anstehende Entscheidung: der 8-Seiten-Bericht …" (two colons in one sentence)
- **Why it reads as AI:** Slide and heading grammar leaks into running prose. The model writes a headline, then a colon, then the content, so every sentence becomes a mini-reveal. Wikipedia lists "inline-header vertical lists" and "fragmented headers"; stopslop has a "dramatic colon reveal" rule (SLOP026) and "headings stacked over two-sentence sections" (SLOP021). Count-first fragments ("Five X, one Y.") are a newer tic: symmetric noun phrases with no verb.
- **Fix:** One colon per sentence at most, and only before a list or an example. No colon after a one- to three-word noun phrase at the start of a sentence. Turn count-first fragments into sentences with an actor and a verb. Slides may use fragments as labels; body text on course and workshop pages may not.
  - Before: "Fünf Prompts, ein Analyst. In der Claude-App arbeitest du für ein synthetisches Unternehmen, bekommst dessen Monatsbericht …"
  - After: "In der Claude-App arbeitest du für eine erfundene Firma. Du bekommst ihren Monatsbericht und die Rohdaten dahinter und schreibst in fünf Prompts auf, was jede Kennzahl dort bedeutet."
- **Regex:** sentence-anchored, applied per sentence from `splitSentences()`. The tested patterns are in `SHAPE_RULES`:
  - colon reveal DE: `^(?:Das (?:Ergebnis|Problem|Prinzip|Beste|Gute|Fazit|Herzstück|Wichtigste|Entscheidende|Ziel)|Der (?:Clou|Haken|Kern|Trick|Grund|Knackpunkt|Unterschied)|Die (?:Pointe|Lösung|Folge|Idee|gute Nachricht|schlechte Nachricht|Kurzfassung)|Kurz gesagt|Unterm Strich|Spoiler|Heißt|Sprich|Klartext)\s?:`
  - colon reveal EN: `^(?:The (?:result|catch|point|twist|upshot|problem|kicker|trick|key|good news|bad news|bottom line|short version|best part|takeaway)|Bottom line|In short|Short version|Spoiler|Plot twist|Put simply|Simply put)\s?:` (i)
  - count-first fragment: `^(?:Ein|Eine|Einen|Zwei|…|Zwölf|One|Two|…|Twelve|\d+) [\p{L}-]+,\s(?:(?:und|and) )?(?:ein|eine|einen|zwei|…|one|two|…|\d+) [^.!?:]{1,40}[.:]?$`
  - list-colon opener: `^(?:\p{Lu}[\p{L}-]+,\s){2,5}(?:(?:und|and|oder|or)\s)?[\p{L}-]+:\s`
  - stacked colons: count `/:\s/g` per sentence after removing quoted strings; more than 1 → finding. Gendered forms (`Nutzer:innen`), times (`10:30`) and URLs have no space after the colon and are not counted.
- **False-positive risk:** Colon reveal is low to medium: `Die Regel:` introducing a real rule is borderline, so the rule excludes "Die Regel" and "Die Regel lautet:". Count-first fragment is low. The list-colon opener is medium in German, because every noun is capitalised, so legitimate instruction lines (`Titel, Problem, Daten: …`) match; keep it a warning. Stacked colons are medium: homework prompts like "Hausaufgabe: … dokumentieren: Titel, …" match, and are clunky anyway.

#### 3. Staccato fragments and punchline closers

- **EN:** "The licence is there. So is the button. Not enough." (`ki-fuehrerschein/en/block-3`) · "Read the real outputs. Read the failure cases. Then widen the scope." · "That's it. That's the whole thing."
- **DE:** "Du nutzt KI schon. Jeden Tag. Seit Jahren." (`ki-arbeitsalltag/01`) · "Solide 80 Prozent. Ton stimmt, Struktur stimmt, Länge stimmt." (`ki-arbeitsalltag/06`) · "Keine Zeile Code." (`workshops.ts`) · "Sachlich korrekt? Vollständig? Angemessen?"
- **Why it reads as AI:** Manufactured emphasis ("dramatic fragmentation"; humanizer §2; stop-slop "staccato"). It is also the typical over-correction of a model told to "vary sentence length". The German body prose has a spike of fragments: 18.1% of sentences have four words or fewer (English 11.5%), mean 9.8 words, median 9. That is short even by the dpa guideline (about 9 words optimal, 20 the desirable upper limit, 30 the maximum). The problem is not length. It is verbless sentences stacked in a row.
- **Fix:** Merge fragments into one sentence with an actor and a verb. Allow at most two consecutive sentences under five words, and no punchline sentence after every paragraph. A question list is fine inside a **checklist** (a list block), not as prose.
  - Before: "Du nutzt KI schon. Jeden Tag. Seit Jahren."
  - After: "Du nutzt KI seit Jahren jeden Tag, oft ohne sie so zu nennen." (Wording is illustrative; the chapter then lists the tools.)
- **Regex/metric:** structural. Count consecutive sentences with `countWords(s) <= 4` inside one text block; 3 or more in a row → finding. Also report the per-file share of sentences with four words or fewer.
- **False-positive risk:** medium to high. Humans do this for rhythm, and stopslop's fragment rule scored below parity (lift 0.52 → 0.66). So: warning only, reported as density, never an error.

#### 4. Tailing negation (corrective tag)

- **EN:** "…, not a keystroke." · "…, never a promised result." · "…, not an occasional add-on." · "The value sits in the controlled process, not t[he model]…"
- **DE:** "Der Rechner legt jede Zahl und die Formel offen: zum Prüfen, nicht zum Verkaufen." · "Governance gehört vor den Prompt, nicht hinter den Vorfall." · "…, kein versprochenes Ergebnis." · "…, nicht private interne Denkschritte."
- **Why it reads as AI:** It is the compressed form of pattern 1 ("clipped negative tail" in humanizer §1). One per page is normal. Several per paragraph read as a tic.
- **Fix:** Delete the tag when nobody would assume the negated thing. Keep it in definitions and scope statements where it prevents a real misreading (the glossary "nicht für jeden KI-Einsatz" is fine).
- **Regex:** `,\s(?:nicht|kein(?:e|en)?|not|never)\s[^.,;:!?\n]{1,40}[.!]` (raw regex, no `wordPattern`, because it starts with punctuation). Use it as a **density** rule: per file with at least 800 words, flag more than 4 per 1,000 words. Measured distribution: median 1.76, p90 3.72, max 7.18. The threshold catches about the top 10%: `codex/lessons/de/l09-tools.ts`, `l04-task-spec.ts`, `claude-course/lessons/mental-model.ts`, `ki-arbeitsalltag/06`, `13_anhang.md`, `ai-native/modul-3`, `demos-copy.ts`.
- **False-positive risk:** high per hit, low as density.

#### 5. Sayings that sound deep (aphorism, chiasmus)

- **EN:** "The value sits in the controlled process, …" · "The real question is trust." · "Data is the new oil." · "It's a feature, not a bug." · "At its core, …"
- **DE:** "Governance gehört vor den Prompt, nicht hinter den Vorfall." · "Vier Zahlen und ein Satz beantworten die eigentliche Frage: …" · "KI-Projekte scheitern selten an der Technik. Sie scheitern an Annahmen, die niemand aufgeschrieben hat." · "Der Schlüssel liegt in Schritt 5" · "Daten sind das A und O." · "Das steht und fällt mit …"
- **Why it reads as AI:** An ordinary point dressed up as a hidden truth (humanizer §3; stop-slop "Cut quotables: if it sounds like a pull-quote, rewrite it"). Models over-produce symmetric chiasmus ("vor X, nicht hinter Y").
- **Fix:** Replace the saying with the specific claim and its evidence, or cut it when the next sentence already makes the point.
  - Before: "Governance gehört vor den Prompt, nicht hinter den Vorfall. Das Praxisbeispiel markiert PII und Geschäftsgeheimnisse, bevor ein Text das Haus verlässt."
  - After: "Das Praxisbeispiel markiert personenbezogene Daten und Geschäftsgeheimnisse, bevor ein Text das Haus verlässt."
- **Regex:** EN `the real (?:question|problem|issue|work|value|win) (?:is|lies|sits)|what (?:really|actually) matters|is the new [a-z]+|the (?:currency|language|heart|DNA) of|is a feature, not a bug|(?:the )?value sits in` (i). DE `die eigentliche (?:Frage|Arbeit|Aufgabe|Herausforderung)|worauf es (?:wirklich|eigentlich) ankommt|ist das neue \p{L}+|das A und O|steht und fällt mit|der Schlüssel (?:liegt|zum Erfolg)` (i). Chiasmus itself is not matchable reliably; catch it through the tailing-negation density (pattern 4).
- **False-positive risk:** low to medium ("der Schlüssel liegt" can be a literal API key in a security lesson: `ai-native/modul-3` "wo der Schlüssel liegt" is literal, so allowlist it).

#### 6. Forced triads (rule of three)

- **EN:** "set capacity, stop supply-chain amplification, and release fast demand" · "clear fields, validation, human approval" · three parallel example sentences followed by a moral.
- **DE:** "Kapazität festlegen, Aufschaukelung stoppen, schnelle Nachfrage kontrolliert freigeben" · "Ton stimmt, Struktur stimmt, Länge stimmt." · "Quelle, Code, Version, Berechtigungen:" (four is the over-corrected triad)
- **Why it reads as AI:** Ideas arrive in threes to sound complete, whether the content has three parts or not (Wikipedia "rule of three"; humanizer §6; stop-slop "two items beat three"). LLM lists cluster at exactly 3 and 5 items.
- **Fix:** Count the real items. If there are two, write two. If one of three is filler, cut it. Develop the strongest item instead of listing three thin ones. Do **not** switch to "always four" or "always two": that is the next tic.
- **Regex/metric:** VOICE-LISTS already warns when more than 60% of a file's lists have exactly three items (corpus share 26%). Add an **inline triad share**: sentences matching `(?:[^\s,.;:]+(?:\s[^\s,.;:]+){0,2}),\s(?:[^\s,.;:]+(?:\s[^\s,.;:]+){0,2}),?\s(?:und|and|oder|or)\s(?:[^\s,.;:]+(?:\s[^\s,.;:]+){0,2})[.;:,]` divided by sentences. Warn when above 15% in a file with at least 30 sentences (calibrate with the voice report first).
- **False-positive risk:** high per sentence, so use it only as a share.

#### 7. Significance inflation and puffery vocabulary (incl. -ing riders and false ranges)

- **EN (from the Kobak list and Wikipedia):** pivotal, crucial, tapestry, testament to, underscore, showcase, intricate, meticulous, realm, groundbreaking, renowned, vibrant, multifaceted, transformative, paving the way, foster, navigate (figurative), unlock, harness, streamline, "plays a crucial role", "marks a pivotal moment", "evolving landscape", -ing riders (", highlighting its importance"), false ranges ("from startups to global enterprises"). Already in the lint: delve, robust (budget), comprehensive, holistic, seamless, cutting-edge, best-in-class, game-changer, landscape (budget), leverage, empower, unlock the potential, synergy.
- **DE:** entscheidend, maßgeblich (see false positives), zentral, essenziell, unerlässlich, nahtlos, maßgeschneidert, innovativ, bahnbrechend, revolutionär/revolutionieren, wegweisend, zukunftsweisend, facettenreich, vielschichtig, vielfältig ("vielfältige Möglichkeiten"), Herzstück, Eckpfeiler, Meilenstein, Schlüsselrolle, "spielt eine entscheidende Rolle", spannend, faszinierend, eintauchen / "tauchen wir ein" / "in die Welt der …", beleuchten, "unter die Lupe nehmen", "Potenzial entfalten/heben", "auf das nächste Level", "deine KI-Reise", figurative "Landschaft" (KI-Landschaft, Tool-Landschaft), riders ", was die Bedeutung von X unterstreicht", ", wodurch …". Already in the lint: ganzheitlich, umfassend, grundlegend, disruptiv(e), Paradigmenwechsel, zukunftssicher, Mehrwert, KI-Transformation, Wettbewerbsvorteil.
- **Repo:** "Das Herzstück: …" (`workshops.ts`), "praktisch unerlässlich" (`ki-arbeitsalltag/13_anhang.md`), `entscheidend` 5 times (2 more in course-projects, outside scope).
- **Why it reads as AI:** Ordinary facts are dressed as a turning point or a legacy. The rare English words above are statistically over-represented (§1.1). German models translate the same register ("spielt eine entscheidende Rolle", "nahtlos", "maßgeschneidert").
- **Fix:** Keep the fact and drop the rating. Replace "entscheidend" with the consequence: "Ohne diese Spalte rechnet die KI mit Veränderungen statt Beständen." Replace "Herzstück" with what it is.
- **Regex:** see `de-puffery-buzz`, `de-puffery-rolle-spielen` (both word orders), `de-puffery-eintauchen`, `de-puffery-potenzial`, `de-puffery-reise`, `de-count-entscheidend` (budget 1/lesson), `de-count-spannend` (budget 1/course), `en-puffery-vocab`, `en-puffery-plays-role`, `en-puffery-copula`, `en-count-crucial` (budget 1/lesson), plus -ing riders `,\s(?:highlighting|underscoring|emphasizing|reflecting|showcasing|symbolizing|fostering|contributing to|paving the way|cementing|solidifying)\s` and DE riders `,\s(?:was|wodurch|womit)\s[^.!?\n,]{0,60}(?:unterstreicht|verdeutlicht|widerspiegelt|hervorhebt)` (raw regexes).
- **False-positive risk and required exemptions:**
  - `maßgeblich` is a legal term of art ("maßgebliche Quelle", "maßgeblicher Zeitpunkt"; 12 hits, mostly legitimate). Treat it like `grundsätzlich` (VOICE-AMBIGUOUS, warning only).
  - `zentral` (16 hits, e.g. "die zentrale Annahme") is usually literal. Do not ban it; at most report it.
  - `innovativ` appears in statutory wording (AI Act regulatory sandbox, "innovatives KI-System"). Allowlist per file.
  - `Meilenstein` is a project-management term in prompt templates. Exempt it.
  - `essential` is statutory ("essential private and public services", Annex III AI Act). It is excluded from the English rule for that reason.
  - `Systemlandschaft` is an IT term, and `ki-landschaft` is a book slug. The Landschaft rule matches only figurative compounds (KI-, Tool-, Anbieter-, Modell-, Daten-).
  - **ESG (Workshop 04):** `wesentlich`, `Wesentlichkeit`, `Wesentlichkeitsanalyse`, `material`, `materiality`, `double materiality` / `doppelte Wesentlichkeit` and `impact` (as in IRO: impacts, risks and opportunities) are ESRS terms of art. Never flag them as puffery.

#### 8. Chat residue and sycophantic or empathic framing

- **EN:** "Great question!" · "I hope this helps!" · "Let me know if you'd like…" · "Certainly!" · "You're absolutely right" · "as of my last update" · "Don't worry, it's easy." · "You've got this."
- **DE:** "Gute Frage!" · "Ich hoffe, das hilft." · "Lass mich wissen, …" · "Stand meines Wissens" · "Keine Sorge, das ist ganz einfach." · "Du schaffst das!" · "Super, dass du dabei bist!" · "Kennst du das? …" · "Du fragst dich vielleicht, …" · "Du bist nicht allein."
- **Why it reads as AI:** Residue is a leftover of the chat turn. It is the most certain tell of all (Wikipedia "collaborative communication", humanizer §22). Empathy framing is the learning-content variant: it reassures instead of informing, and it patronises professionals (NN/g: experts want the facts, not warm-up).
- **Fix:** Delete the wrapper and keep the content. Replace reassurance with a fact that reassures: "Die Übung dauert 10 Minuten und läuft nur in deinem Browser."
- **Regex:** `en-residue-chat`, `de-residue-chat`, `en-residue-sycophancy`, `de-residue-sycophancy`, plus placeholders and citation tokens (pattern 21).
- **False-positive risk:** very low for residue. Low to medium for "Keine Sorge" (a UI error message might use it; allowlist UI copy files). 0 hits today, so this can be an **error** immediately.

#### 9. Throat-clearing openers and signposting

- **EN:** "Here's the thing:" · "Here's why …" · "This is where RAG comes in." · "Let's break it down." · "When it comes to …" · "At its core, …" · "In a world where …" · (already covered: "In today's", "Let's dive in", "Let's explore", "In this lesson you will learn")
- **DE:** "Hier kommt RAG ins Spiel." · "Werfen wir einen Blick auf …" · "Schauen wir uns … an" · "Kommen wir zu …" · "Im Folgenden …" (`ki-tools-selbststaendige/03`, inside a quoted bad example) · "Wenn es um … geht" · "Im Kern" · "Am Ende des Tages" · (already covered: "In der heutigen Zeit", "In diesem Kapitel lernst du", "Lass uns einen Blick werfen")
- **Why it reads as AI:** The text announces a point instead of making it (humanizer §4; stopslop SLOP022).
- **Fix:** Start with the fact, the question or the example (CONTENT_GUIDE already says so).
- **Regex:** `en-opener-signpost`, `de-opener-signpost` (category `opener` → existing VOICE-OPENER).
- **False-positive risk:** low. "Im Kern" can be literal (a processor core), which is rare in this corpus.

#### 10. Rhetorical question plus instant answer

- **EN:** "The result? 40 percent." · "Why? Because it breaks." · "Sounds complicated? It isn't."
- **DE:** "Das Ergebnis? 40 Prozent." · "Der Haken? …" · "Und das Beste? …" · "Klingt kompliziert? Ist es nicht." · "Wird dein LLM-System besser oder schlechter? Ohne eigene Messpunkte weißt du es nicht." (`demos-copy.ts`: an opener question answered at once)
- **Why it reads as AI:** A staged setup (stop-slop "questions answered immediately"; stopslop SLOP022 "self-answered Question? Answer.").
- **Fix:** Give the answer as a statement. Keep real questions the learner has to answer, in exercises and room votes (W03: "Room vote: put this in the board pack?").
- **Regex:** sentence-anchored `^(?:Das Ergebnis|Der Haken|Die Lösung|Die Antwort|Der Grund|Warum|Wieso|Und das Beste|Klingt kompliziert|Klingt gut|The (?:result|catch|answer|problem|twist|best part)|Why|Sounds (?:complicated|hard|simple))\?$`, fired only when the next sentence has 8 words or fewer.
- **False-positive risk:** low. Quiz prompts live in `questionText` segments and are single sentences.

#### 11. Restating closers and "Key Takeaways" boxes

- **EN:** "In conclusion, …" · "To sum up" · "The bottom line: …" · "Overall, …" · a "Key takeaways" box that repeats the headings.
- **DE:** "Fazit: Alles zählt." · "Zusammenfassend lässt sich sagen …" · "Kurz gesagt: …" · "Unterm Strich …" · "Das Wichtigste in Kürze".
- **Why it reads as AI:** A section summary adds nothing (Wikipedia; humanizer §13 "send-off"; stopslop SLOP029).
- **Fix:** End on the last concrete fact or on the next action ("Öffne jetzt Tabelle 3 …"). If a summary box is part of the template (keyTakeaway fields), it must add something new, such as the one number to remember or the one check to run.
- **Lint:** VOICE-CLOSER exists (warning) with markers `Zusammenfassung|Fazit|Kurz gesagt|In conclusion|To sum up`. Add `Unterm Strich|Das Wichtigste in Kürze|Alles in allem|Abschließend|Overall|The bottom line|Bottom line|All in all` to `CLOSER_MARKER`.
- **False-positive risk:** low. A heading "Zusammenfassung" in a legal text summary may be intended; the allowlist exists for that.

#### 12. Hedging and hedge stacks

- **EN:** "This could potentially help in some cases." · "It could be argued that …" · "arguably".
- **DE:** "Das könnte möglicherweise helfen." · "unter Umständen eventuell" · "gewissermaßen" · "in gewisser Weise".
- **Why it reads as AI:** Stacked qualifiers repair an earlier overstatement (humanizer §9). A single "may" is human.
- **Fix:** One qualifier at most, and only when the source supports the uncertainty. Better: state what is unknown ("Wir haben das nicht gemessen.").
- **Regex:** `en-hedge-stack`, `de-hedge-stack`. Existing: `möglicherweise` (1/lesson), "Es ist wichtig zu betonen", "It is important to note", etc.
- **False-positive risk:** low. "kann gegebenenfalls" appears in legal paraphrase; allowlist legal files if needed.

#### 13. Transition crutches

- **EN:** "Additionally," · "Notably," · "Importantly," · "Interestingly," · "Ultimately," · "Crucially," · (existing: Furthermore, Moreover, In conclusion, To sum up, As mentioned above)
- **DE:** "Des Weiteren" · "Ferner" · "Nicht zuletzt" · "Letztendlich" · "Abschließend" · "Zudem" (budget) · (existing: Darüber hinaus, Zusammenfassend lässt sich sagen, wie bereits erwähnt)
- **Why it reads as AI:** Kobak's data: "additionally" +3.7 pp, "notably" r 2.64. Paragraphs chained with adverbs are a template shape.
- **Fix:** Start the paragraph with its subject. "Also"/"auch" inside a sentence is enough.
- **Regex:** `en-transition-adverb` = `(?:Additionally|Notably|Importantly|Interestingly|Ultimately|Crucially|Essentially),` (case-sensitive, so it fires sentence-initially). `de-transition-adverb` = `Des Weiteren|Ferner|Nicht zuletzt|Letztendlich|Abschließend` (case-sensitive; mid-sentence lower-case "ferner" does not match). Give `Zudem` a per-lesson budget of 2 via `category: "counter"`.
- **False-positive risk:** low.

#### 14. Dashes as universal connector

- **EN/DE:** "The new policy — announced without warning — affects…" · German Gedankenstrich " – " used the same way · evasions: spaced hyphen " - " and " -- ".
- **Why it reads as AI:** It avoids deciding how two clauses relate (humanizer §8; WaPo; medRxiv). German texts from ChatGPT, Claude and Gemini show the same pattern (t3n).
- **Lint:** `checkEmDash()` in `content-lint.mjs` already errors on U+2014 and U+2013 in content JSON/MD, `src/app` and `src/components` TSX, and `src/lib` TS (minus `course/`, `courses/`, `auth/`). **Gaps:** `public/workshops/**/*.html` and `lib/*.js` (29 em dashes, mostly table placeholders like `<td class="num ae-dash">—</td>`, plus prose such as W02 "Not to reprint the report on one page — that would be pointless."), and the three excluded `src/lib` subtrees. Spaced-hyphen evasion is rare today (3 hits: 2 are title separators, 1 is a formula).
- **Fix:** comma, colon, parentheses or two sentences.
- **Regex for the extension:** HTML visible text `/—|–/` with exemption for a text node that is exactly one dash (a data placeholder). Spaced-hyphen warning: `(?<=[\p{L}\p{N})"“]) - (?=[\p{L}\p{N}("„])` outside code, headings and titles.
- **False-positive risk:** low with the placeholder exemption.

#### 15. Nominal style / Substantivitis / hidden verbs / Amtsdeutsch

- **EN:** "carry out a review of", "conduct an analysis", "make a decision", "has the ability to", "in order to", "due to the fact that", "with regard to".
- **DE:** "zur Anwendung kommen/bringen", "zum Einsatz kommen", "in Anspruch nehmen", "Berücksichtigung finden", "in Erwägung ziehen", "eine Prüfung durchführen/vornehmen", "Die Prüfung erfolgt durch …", "im Rahmen der/des", "im Hinblick auf", "hinsichtlich", "bezüglich", "seitens", "mittels"; chains of -ung/-heit/-keit/-ion nouns ("Die Durchführung der Überprüfung der Einhaltung …").
- **Why it reads as AI:** Reinhart et al.: nominalizations at 1.5 to 2 times the human rate in instruction-tuned models. It is also the classic German bureaucratic register that BVA, DIN 8581-1 and Wolf Schneider all warn against ("Verben statt Substantive"; DIN 8581-1: finite verbs, active voice, subject, verb and object close together).
- **Fix:** Use the verb and name who acts. "Die Prüfung erfolgt durch das Team" → "Das Team prüft". "Im Rahmen der Klassifizierung" → "Wenn du das System einstufst". In the EU AI Act course, keep statutory nouns where they are the legal name of the duty ("Konformitätsbewertung").
- **Regex:** `de-nominal-funktionsverb`, `de-count-amtsdeutsch` (budget 2/lesson), `en-nominal`. Density metric (report only): -ung/-heit/-keit/-ion/-ität/-ierung nouns per sentence; flag sentences with 3 or more: `/\p{Lu}\p{Ll}+(?:ung|heit|keit|ion|ität|ierung)(?:en)?/gu`.
- **False-positive risk:** medium in legal courses. Keep the rule as a warning and allowlist `content/eu-ai-act-kurs/` for `de-count-amtsdeutsch` with a reason.

#### 16. Copula avoidance and false agency

- **EN:** "serves as a central hub", "stands as", "functions as", "boasts"; false agency: "the data tells us", "the decision emerges", "the value sits in …".
- **DE:** "fungiert als zentrale Anlaufstelle", "dient als Grundlage", "stellt eine Übersicht dar", "bildet das Fundament"; "Die Daten zeigen, dass …", "Der Skill entscheidet …", "Die Zahl trägt die Regel" (`workshops.ts`: "Erst Liefergrenze und Restfehler zusammen tragen die Regel.").
- **Why it reads as AI:** It avoids "is/has" and hides the actor (humanizer §18; stop-slop "false agency").
- **Fix:** "ist", "hat", and a person as subject: "Du liest in den Daten ab, dass …", "Die Planerin entscheidet anhand von …".
- **Regex:** `en-puffery-copula`, `de-puffery-copula` = `(?:fungier(?:t|en)|dien(?:t|en)) als (?:ein(?:e|en)?|das|der|die|zentrale[rs]?)|stell(?:t|en)${CLAUSE} dar` (i). False agency has no reliable regex; leave it to review.
- **False-positive risk:** medium. "stellt … dar" is sometimes the right verb ("Was stellt sie dar?" in the interview playbook). Warning only.

#### 17. Vague attribution and unsourced generalisation

- **EN:** "Studies show …", "Experts agree …", "Research suggests …", "It is widely known …", "Most companies …".
- **DE:** "Studien zeigen …", "Untersuchungen belegen …", "Experten sind sich einig", "Fachleute betonen", "Es ist allgemein bekannt, dass …", "Man weiß heute …"; unsourced laws of nature: "KI-Projekte scheitern selten an der Technik." (`demos-copy.ts`), "Viele Analysen im Mittelstand entstehen in Excel." (plausible, but unsourced).
- **Why it reads as AI:** Borrowed authority (Wikipedia "vague attributions / weasel words"; humanizer §17). CONTENT_GUIDE already requires primary sources for such claims.
- **Fix:** Name the source and the number, or turn the claim into an observation from the case ("In diesem Beispiel …").
- **Regex:** `en-claim-studies-show`, `de-claim-untersuchungen-zeigen`. `Studien zeigen` is already an UNSOURCED-CLAIM error in JSON with no `sources` array, and `Experten sind sich einig` is a VOICE-CLAIM. Improve the rule: exempt a line that contains a link or a footnote marker (stopslop SLOP025 does this).
- **False-positive risk:** low to medium ("grounding.ts" quotes "studies show" as a bad example; allowlist it).

#### 18. Symmetric shapes, low burstiness, template paragraphs

- **EN/DE:** every card blurb follows "Claim. Tension. What the example does." (demos-copy.ts: "Rechnungseingang ist in vielen Firmen Handarbeit. Das Praxisbeispiel begrenzt … : klare Felder, Validierung, menschliche Freigabe."); every workshop step opens with an ordinal fragment ("Erster Akt: …", "Zweiter Akt: …", "Dritter Akt: …"); every paragraph follows topic sentence → elaboration → example → wrap-up; equal-length sections.
- **Why it reads as AI:** Uniformity is the strongest statistical tell. stopslop's combined uniformity rule has the best lift (3.95); detectors measure it as low "burstiness".
- **Fix:** Let length follow content. Some steps need one sentence, some need five. Vary openings and put the actor first. Do not force every card into the same three-beat template.
- **Metric:** coefficient of variation of sentence length per file (SD / mean). The voice report already computes mean and SD. Add `sentenceLengthCv` and warn (VOICE-RHYTHM) when there are at least 40 sentences and CV < 0.35. Add an "opening-word monotony" check: more than 40% of a block's sentences start with the same word ("Das …", "Du …").
- **False-positive risk:** medium. Legal enumerations and quiz files are naturally uniform; exclude `quiz/questions.json` and glossary files from VOICE-RHYTHM.

#### 19. Pet-phrase repetition and elegant variation

- **Repo:** German `konkret*` 283 (17.5 per 10k words, about once every 570 words), `Freigabe*` 289, `prüfbar*` 103, `belastbar*` 53, `nachvollziehbar*` 40, `sauber*` 33, `ehrlich*` 30; English `explicit*` 156, `concrete*` 54, `traceable` 22, `defensible` 13, "earns its cost" 3 times in one workshop (`workshops.ts`: "A forecast earns its cost only when…", "which one earns its cost", "did smoothing earn its cost?").
- **Why it reads as AI:** A model has a small set of favourite words per session and recycles them. The opposite tic, elegant variation (rotating synonyms for one concept), is also an LLM habit (Wikipedia; stopslop SLOP034). German writers (Schneider: "Es gibt keine Synonyme") keep one term per concept.
- **Fix:** Keep domain terms stable (one term per concept, always the same: "Freigabe" can stay). Cut evaluative pet words ("konkret", "sauber", "ehrlich", "belastbar") unless they carry meaning. "ein konkretes Artefakt" → "ein n8n-Workflow". "belastbare Regel" → say what makes it hold.
- **Metric (report only):** in `content-voice-report.mjs`, a "top repeated evaluative words" column: per surface, frequency per 10k words of a watch list (`konkret`, `sauber`, `ehrlich`, `belastbar`, `prüfbar`, `explicit`, `concrete`, `defensible`), plus repeated content trigrams (3 or more in one file) excluding a domain stoplist ("eu ai act", "certificate of participation", "anhang iii nr").
- **False-positive risk:** too high for a lint finding. Use it as report data for editors.

#### 20. Formatting by rule

- Bold label lists (`- **Performance:** …` three or more times in a row), bold used for emphasis in running text, English Title Case headings (German capitalises nouns anyway, so the rule is English-only), emoji as headings or bullets, a heading every two sentences, `✅` checklists, horizontal rules between every section.
- **Why it reads as AI:** Wikipedia: boldface, inline-header lists, title case and emoji. WaPo: ✅ used 11 times more often than by humans. GOV.UK: "Do not use bold or italics for emphasis."
- **Fix:** Bold only for UI labels the learner must find. Prose instead of labelled lists when the labels carry no information. Sentence case. No emoji in learning content.
- **Regex:** bold-lead list run `^\s*[-*]\s+\*\*[^*]{1,40}:?\*\*:?\s` three or more consecutive lines; emoji `\p{Extended_Pictographic}` in headings or list markers; EN Title Case heading `^#{1,6}\s+(?:\p{Lu}\p{Ll}+\s+){3,}` with 4+ capitalised words (skip `lang: "de"`).
- **False-positive risk:** medium; warning only.

#### 21. Placeholder, knowledge-cutoff and citation-token residue

- `[Your Name]`, `[Unternehmen]`, `INSERT_…`, `2025-XX-XX`, "as of my last update", "Stand meines Wissens", `turn0search0`, `:contentReference[oaicite:1]`, `utm_source=chatgpt.com`.
- **Why:** copy-paste residue (Wikipedia; stopslop SLOP011 to SLOP013, Tier A). CONTENT_GUIDE: "Do not publish placeholders".
- **Regex:** `\[(?:Your|Dein|Ihr|Name|Unternehmen|Firma|Datum|Company)[^\]]{0,30}\]|INSERT_[A-Z_]+|\d{4}-XX-XX|turn\d+search\d+|oaicite|utm_source=chatgpt\.com`. Exempt prompt-template books that teach placeholders (`ki-tools-selbststaendige/07_finanzen.md` uses `[LISTE]`, `[DETAILS]` on purpose, so allowlist it).
- **False-positive risk:** very low outside prompt-template chapters.

---

## 3. Positive voice spec: "down to earth"

This is the voice to write toward. It is based on GOV.UK content design, the Federal Plain Language Guidelines, NN/g research, Wolf Schneider, the BVA handbook, DIN ISO 24495-1 / DIN 8581-1 and the Hamburger Verständlichkeitsmodell, and it is calibrated on the Workshop 03 deck.

### 3.1 Ten rules

1. **The example comes before the rule.** Show the case, the wrong answer or the number first, then name the principle. W03 shows FOLDLINE's −€19,960 April first, then the database check, and only then defines "semantic layer". Do the same in every lesson and workshop step.
   - Weak: "Ein semantischer Layer definiert Kennzahlen maschinenlesbar."
   - Down to earth: "Die KI meldet für April −19.960 € MRR. Die Datenbank sagt: MRR kann hier nie negativ sein. Die Tabelle `monthly_revenue` speichert die Veränderung pro Monat, nicht den Bestand. Genau diese Festlegung fehlte der KI. Ein semantischer Layer schreibt sie auf." (One contrast, correcting what the reader just saw.)
2. **Concrete nouns.** Name the file, the table, the column, the screen, the button, the form. "Tabelle 3, Spalte `ending_mrr`" instead of "die relevanten Daten". "der 8-Seiten-Monatsbericht" instead of "die Unterlagen".
3. **Numbers with units, dates and sources.** Every claim of size gets a number: "1.370 angemeldet, 1.180 geschätzt, 1.050 lieferbar". Every legal date gets its registry entry. If there is no number, say so: "Das haben wir nicht gemessen."
4. **Named actors, active verbs.** Someone does something. "Du prüfst …", "Die Controllerin gibt frei …", "Claude liest zuerst die Skill-Datei." No "erfolgt durch", "wird durchgeführt", "es gilt". GOV.UK and plainlanguage.gov: active voice "makes it clear who is supposed to do what".
5. **One idea per sentence, main point in the main clause.** Schneider: "Die Hauptsache in den Hauptsatz." DIN 8581-1: one central statement per sentence, subject, verb and object close together. Targets: German body sentences 8 to 18 words, rarely over 25 (dpa: 20 desirable, 30 maximum; GOV.UK: check anything over 25); English 10 to 20, rarely over 25. Mix lengths, but never three fragments in a row.
6. **Say it once, plainly.** No contrast unless the reader holds the wrong belief. No colon reveal. No "Das Herzstück". No closing summary. The last sentence of a section is the last fact or the next action.
7. **Verbs over nouns** (Schneider, BVA, DIN 8581-1): "anwenden" not "zur Anwendung bringen", "prüfen" not "eine Prüfung vornehmen", "entscheiden" not "eine Entscheidung treffen".
8. **Words the reader uses at work.** "Bestand" and "Veränderung", not "Level" and "Delta". Define a technical term at first use (CONTENT_GUIDE). One term per concept (no synonym rotation). No evaluative filler (konkret, sauber, ehrlich, belastbar, spannend, entscheidend) unless it carries meaning.
9. **Respect the professional.** No reassurance ("Keine Sorge"), no praise ("Super, dass du dabei bist"), no warm-up. NN/g: experts want concise, scannable, objective text too. Morkes & Nielsen measured 58% better usability for concise text, 47% for scannable, 27% for objective (non-promotional), and 124% for all three together.
10. **Honest limits in plain words.** "Eine Beobachtung, kein Benchmark." (W03) is fine because it is a real scope statement. "Die gezeigten Modellantworten wurden im August 2026 aufgezeichnet und sind keine Live-Abfragen." is good. Put limits where the claim is, not in a disclaimer section.

### 3.2 Budgets (per lesson, workshop step or demo page)

| Device | Budget | Note |
|---|---|---|
| Contrast (`nicht X, sondern Y`, `not X but Y`) | 1 | Only to correct a belief the reader actually holds, with evidence next to it |
| Split-sentence contrast (`Das ist kein X. Das ist Y.`) | 0 | Always rewrite |
| Colon per sentence | 1 | Only before a list or an example; never after a 1 to 3 word opener |
| Rhetorical question in prose | 1 | Real questions go into exercises, room votes and checklists |
| Sentences of ≤ 4 words in a row | 2 | Headlines and UI labels are exempt |
| Lists of exactly 3 | ≤ 1 in 2 lists | Count real items; do not pad to 3 or cut to 2 |
| Bold in running text | 0 | UI labels only |
| Evaluative adjectives (entscheidend, zentral, spannend, crucial) | 1 | Replace with the consequence |
| Tailing negation (`…, nicht zum Verkaufen.`) | ≤ 4 per 1,000 words | Scope statements only |

### 3.3 Slides vs. page prose vs. microcopy

- **Slides** (W01 to W04 decks) may use noun-phrase labels ("Seven export tables", "Wrong answer", "Same question again"). That is slide grammar, and W03 uses it well: every label names a thing on screen. The label must still be concrete. "Seven export tables" names a thing; "Innovation meets governance" does not.
- **Page prose** (course lessons, workshop detail pages, demo intros, guides) uses full sentences with an actor and a verb. No slide grammar.
- **Microcopy** (buttons, badges, status) is short and literal: "Runs only on this page. Your selection is neither stored nor sent." is a good model.

### 3.4 What Workshop 03 does right (keep as the reference)

- One question held fixed for 75 minutes ("Show ending MRR by month for the last complete quarter.").
- A made-up but specific company: FOLDLINE, 144 accounts, named tables (`monthly_revenue`, `billing_events`).
- The wrong answer shown with real numbers, then a vote, then the check ("Doesn't match"), then the explanation.
- Failures named precisely: "It searched 'active'; the table says 'A'."
- Scope and limits stated in place: "An observation, not a benchmark.", "Recorded AI run · one run", "Known gap: did not cite the metric definition."
- Contrast used twice in about 2,600 words, both times correcting what the audience had just assumed.
- A takeaway the learner builds: "You leave with one filled page for your own question."

### 3.5 Before and after, from this repository

| Where | Before | After (proposal; facts from the same file) |
|---|---|---|
| `src/lib/workshops.ts` (W02 detail) | "Fünf Prompts, ein Analyst. In der Claude-App arbeitest du für ein synthetisches Unternehmen, bekommst dessen Monatsbericht samt der Rohdaten, …" | "In der Claude-App arbeitest du für eine erfundene Firma. Du bekommst ihren Monatsbericht und die Rohdaten dahinter und schreibst in fünf Prompts auf, was jede Kennzahl dort bedeutet." |
| `workshops.ts` | "Das Herzstück: Der Kennzahlen-Skill liegt halb fertig im Kit. … Keine Zeile Code." | "Im Kit liegt ein halb fertiger Kennzahlen-Skill. Claude fragt dich die Lücken einzeln ab, etwa was Umsatz, Mängel und Marketing in dieser Firma bedeuten, und schreibt deine Antworten in die Skill-Datei. Programmieren musst du dafür nicht." |
| `workshops.ts` | "Am Ende steht keine Zusammenfassung, sondern eine Entscheidung: Premium-Linie nacharbeiten oder ihr Q3-Marketingbudget erhöhen?" | "Zum Schluss entscheidest du, ob die Premium-Linie nachgearbeitet wird oder mehr Q3-Marketingbudget bekommt, und belegst die Entscheidung mit einer Zahl." |
| `workshops.ts` (W01 feedback) | "Anmeldungen allein sind keine Nachfrage, ein Genauigkeitswert allein ist keine Regel. Verknüpfe Liefergrenze, Nachfrage und Restfehler." | "Die Standorte melden 1.370 Stück an, die geschätzte Nachfrage liegt bei 1.180, lieferbar sind 1.050. Verteile nach der Nachfrage und lass bei 12 % Restfehler eine benannte Person jede Ausnahme freigeben." |
| `src/lib/demos-copy.ts` | "Memos, Briefe, Vorlagen: jeden Tag dieselbe Arbeit." | "Memos, Briefe und Vorlagen folgen jeden Tag denselben Mustern." |
| `demos-copy.ts` | "Governance gehört vor den Prompt, nicht hinter den Vorfall. Das Praxisbeispiel markiert PII und Geschäftsgeheimnisse, bevor ein Text das Haus verlässt." | "Das Praxisbeispiel markiert personenbezogene Daten und Geschäftsgeheimnisse, bevor ein Text das Haus verlässt." |
| `demos-copy.ts` | "KI-Projekte scheitern selten an der Technik. Sie scheitern an Annahmen, die niemand aufgeschrieben hat. Der Rechner legt jede Zahl und die Formel offen: zum Prüfen, nicht zum Verkaufen." | "Der Rechner zeigt jede Annahme als Zahl und die Formel dazu. Ändere Teamgröße, Stundensatz oder Nutzungsquote und sieh, wie sich das Ergebnis verschiebt." |
| `content/books/ki-arbeitsalltag/07` | "…, hilft kein Prompt. Das ist kein KI-Problem. Das ist ein Datenproblem. Und es zu lösen ist der erste Schritt, bevor du irgendetwas analysierst." | "…, hilft kein Prompt. Bring die Daten zuerst in eine Tabelle. Erst dann lohnt sich die Analyse." |
| `ki-arbeitsalltag/06` | "Solide 80 Prozent. Ton stimmt, Struktur stimmt, Länge stimmt. Aber lies den vorletzten Satz nochmal: … Das ist kein Tippfehler. Das ist der teuerste Satz im ganzen Text." | "Ton, Struktur und Länge passen. Der vorletzte Satz bietet aber „einen Rabatt von 5 Prozent“ an, und genau den hatte ich verboten. Wäre die Mail so rausgegangen, hätte dieser Satz 5 Prozent Rabatt zugesagt." |
| `ki-fuehrerschein/en/block-3` | "The licence is there. So is the button. Not enough." | "Having the licence and the button does not yet make the tool useful." (Better still: name what is missing, from the lesson.) |
| `workshops.ts` (EN) | "The value sits in the controlled process, not t[he model]…" | Name the mechanism: "In the monitored mode, a named person approves each release after a demand shock." |

### 3.6 German specifics

- Correct German typography uses „…“ quotes. The English "curly quotes" tell does **not** apply to German; do not lint it.
- Title Case is not a German tell (nouns are capitalised). Lint English headings only.
- The German LLM dash is the spaced Gedankenstrich " – " (en dash). The repository already bans U+2013 in prose. Watch for the evasion " - ".
- Watch the Amtsdeutsch register (BVA): Funktionsverbgefüge, "erfolgen", "seitens", "bzgl.", "hinsichtlich", "im Rahmen von", "man". Replace "man" with "du" or a named role.
- Anglicisms as slop in German copy: "Key Takeaways", "Deep Dive", "Game Changer", "Next Level", "Mindset", "Journey". Use German words or the plain English term only where it is the real product name.
- Keep Du everywhere except the EU AI Act course (Sie), as CONTENT_GUIDE and the form map require.
- Einfache Sprache (DIN 8581-1:2024) is the right target register for most course prose: one statement per sentence, positive rather than negative phrasing ("Bitte schick uns die fehlenden Angaben" instead of "Du hast uns die Angaben noch nicht geschickt"), active voice, verbs, sentences generally not over 15 to 20 words. Leichte Sprache (DIN SPEC 33429) is a different, stricter standard for readers with reading impairments and is not the target here.

### 3.7 Over-correction warnings (do not trade one tic for another)

- Banning `nicht nur … sondern auch` produced `nicht X, sondern Y` and `Das ist kein X. Das ist Y.` Budget all contrast forms together.
- Asking for varied sentence length produced staccato fragments (18% of German body sentences ≤ 4 words). Vary length by merging, not by chopping.
- Banning "comprehensive" and "robust" produced new house words (konkret, belastbar, prüfbar, explicit). Evaluative words need a reason, whatever the word is.
- "No three-item lists" can produce "always two" or "always four". Count real items.
- "No adverbs" (stop-slop) is too strict for German, where particles such as "schon", "noch" and "erst" carry meaning. Cut only the filler particles already listed (eigentlich, quasi, sozusagen, halt).
- Removing all dashes by inserting colons produced colon reveals. Use a comma, parentheses or a new sentence instead.

### 3.8 Workshop 04 (ESG reporting) language notes

- **Greenwashing register is also slop:** "nachhaltig" without an object, "klimaneutral", "umweltfreundlich", "grün", "Nachhaltigkeitsreise", "ganzheitliche ESG-Strategie", "Impact" as a buzzword, "Net-Zero-Ambition" without a target year and scope. Directive (EU) 2024/825 (EmpCo) applies from **27 September 2026**. It bans generic environmental claims in B2C commercial communication unless they are substantiated, and it bans offset-based neutrality claims for products. A workshop that teaches ESG reporting must model specific, verifiable statements: "Scope-2-Emissionen 2025: 412 t CO₂e, marktbasiert, Quelle: Stromlieferverträge". Verify the exact national transposition before quoting it in course text.
- **Terms of art to protect in the lint:** wesentlich / Wesentlichkeit / doppelte Wesentlichkeit / Wesentlichkeitsanalyse; material / materiality / double materiality; Auswirkungen, Risiken und Chancen (IROs); Scope 1/2/3; ESRS, VSME, CSRD, Taxonomie-Konformität. No puffery rule may match them; the proposed rules were checked and none does. `de-puffery-rolle-spielen` matches only the phrase "wesentliche Rolle spielen". An optional `de-ambiguous-wesentlich` warning (like `grundsätzlich`) would add 37 warnings today, 21 of them statutory "wesentliche Änderung" in the EU AI Act course. Add it only if W04 authors start using "wesentlich" to mean "important".
- **Down-to-earth ESG sentences** follow the W03 shape: raw input first (a utility bill, a fleet fuel-card export, an HR headcount sheet), then what the AI extracted, then the check against the source, then the rule ("Welche Einheit? Welcher Zeitraum? Welcher Standort? Welche Quelle?").

### 3.9 Reviewer checklist (read aloud, 2 minutes per page)

1. Swap test: could this sentence appear unchanged in another course? If yes, cut it or make it specific.
2. Actor test: who does what, with which number, in which file?
3. Contrast test: does the reader really believe the negated half? If not, delete it.
4. Colon test: more than one colon in a sentence, or a colon after a 1 to 3 word opener? Rewrite.
5. Fragment test: three short sentences in a row? Merge.
6. Ending test: does the last sentence add a fact or an action? If it restates, cut it.
7. Evaluative-word test: entscheidend, zentral, konkret, spannend, belastbar, crucial, explicit. Replace each with the consequence or delete it.
8. Source test: every "most", "often", "selten" or "Studien" has a number or a source, or it goes.

---

## 4. What `content-lint.mjs` enforces today, what it does not, and how to add it

### 4.1 Architecture map (as read, 2026-09-26)

- `packages/website/scripts/content-lint.mjs`
  - `runAllChecks()` runs, in order: `checkBannedPhrases()`, `checkAiActDates()`, `checkEmDash()` (+ `checkEmDashInTsx()`), `checkStudienZeigen()`, `checkAuditAuthorityClain()`, `checkAsciiUmlauts()`, `checkTemplateSources()`, `checkFreshnessGate()`, `checkMetadataCompleteness()`, `checkFreshnessSurfaceConsistency()`, `checkFreshnessSourceStaleness()`, `checkVoice()`.
  - `checkVoice()` → exported `runVoiceLint({ root, config, configPaths })`: `collectLearnerFacingFiles(root)` → `extractProseUnits(relFile, raw)` → `analyzeVoice(units, { formMap })` → `applyAllowlist(findings, allowlist)` → `severityFor(item, strict)` (error only if the rule is in `VOICE_STRICT_RULES` **and** the file is in the strict scope).
  - Exit code 1 on any error. Warnings never fail.
- `scripts/content-voice-rules.mjs` (ASCII-only by convention; umlauts as `\u` escapes)
  - `wordPattern(source, flags)`: Unicode-aware boundaries, adds `u`. `CLAUSE = "[^.!?\\n]{0,120}?"`.
  - `VOICE_RULE_IDS` (the allowlist validates against it), `VOICE_STRICT_RULES`, `CATEGORY_RULE` (category → rule id: opener, filler, ambiguous, hedge, transition, claim).
  - `VOICE_PHRASE_RULES`: entries `{ id, lang: "de"|"en"|"both", category, label, pattern, perLesson?, perCourse?, advice? }`. With a budget, `ruleIdFor()` returns VOICE-COUNT-LESSON or VOICE-COUNT-COURSE. `category: "counter"` has **no** `CATEGORY_RULE` entry, so a counter without a budget would emit `rule: undefined`: always give counters a budget.
  - `VOICE_TERM_RULES` (VOICE-TERM), `CONNECTOR_RULES` (report metric only), `CLOSER_MARKER` + `startsWithCloser()`.
  - `analyzeVoice()` → `collectMatches()` (phrases, per lesson), `analyzeTerms()`, `analyzeStructure()` (VOICE-PARAGRAPH > 5 sentences, VOICE-CLOSER, VOICE-LISTS > 60% three-item lists with ≥ 3 lists), `analyzeForm()` (German Du/Sie against `content-lint.form-map.json`).
  - Module-private helpers you will reuse: `finding()`, `segmentLine()`, `blockLine()`, `globalPattern()`.
  - `computeVoiceMetrics(unit)` for the report.
- `scripts/content-prose.mjs`: `LEARNER_PROSE_KEYS` and `LEARNER_PROSE_LIST_KEYS` (only these JSON keys are read), `TECHNICAL_COURSE_DIRS`, `EXTRA_COPY_MODULE_FILES` (`books.ts`, `courses/catalog.ts`, `workshops.ts`), `isLearnerFacingFile()`, `collectLearnerFacingFiles()` (walks `content/`, `src/lib/`, `src/app/` only), `classifyLearnerFile()` (surface + lang), `extractProseUnits()` (JSON split at `lessons`; Markdown one unit; TS string literals one unit), `splitParagraphs()`, `splitSentences()`, `countWords()`, `isProseSegment()`, `blankOutCodeFences()`, `stripMarkdown()`, `extractTsStringLiterals()`.
- `scripts/content-voice-report.mjs`: `BAN_RULES` (what counts in the "Bans" column), `analyzeCorpus()`, `aggregateBySurface()`, `renderSummaryMarkdown()`, `renderFilesMarkdown()`, `renderJson()`; flags `--markdown|--json|--verbose|--baseline <ref>|--paths|--changed-since|--list`.
- Config: `content-lint.voice-scope.json` (strict paths; the workshop and demo copy modules are **not** strict), `content-lint.allowlist.json` (`{file, rule, phrase?, reason}`; reason mandatory; unused entries warn), `content-lint.form-map.json`.
- Tests: `scripts/__tests__/content-lint-voice.test.mjs`, `scripts/__tests__/content-voice-report.test.mjs`; fixtures `scripts/__tests__/fixtures/voice/{german,english,form}/…`; run `bun run test:content-lint` (= `node --test` on both files) from `packages/website`.

### 4.2 Enforced today

| Rule | What | Where | Severity |
|---|---|---|---|
| BANNED-PHRASE | disruptiv, KI-Transformation, Wettbewerbsvorteil, profitieren Sie, Jetzt loslegen, Hier klicken, Erfahren Sie mehr, zukunftssicher, Paradigmenwechsel, KI-Reifegrad, Ihre Organisation, KI-beschleunigt, Mehrwert (downgraded in "ohne/kein Mehrwert") | content JSON/MD, `src/app` + `src/components` TSX, `src/lib` TS | error |
| BANNED-PHRASE-WARN / DEMO-LABEL-WARN | "Ihr Unternehmen" in JSON; "Demo" as label | same | warn |
| EM-DASH / EN-DASH | U+2014 / U+2013 | content JSON/MD; TSX/TS with skip heuristics; **not** `public/`; not `src/lib/course*`, `auth` | error |
| UNSOURCED-CLAIM | "Studien zeigen" without sibling `sources[]` | content JSON only | error |
| UNVERIFIABLE-AUTHORITY | "Nach dutzenden/zahlreichen Audits" | content JSON/MD | error |
| ASCII-UMLAUT | fuer, muessen … in prose | content, TSX | error |
| VOICE-OPENER | In der heutigen Zeit, In einer zunehmend digitalisierten, In diesem Kapitel/Modul … lernst du; In today's, In an increasingly, In this lesson you will learn, Whether you are a … or a, Let's dive in, Let's explore | learner-facing | error in strict scope, else warn |
| VOICE-FILLER | ganzheitlich, umfassend, grundlegend, eigentlich, im Prinzip, quasi, sozusagen, halt; delve, comprehensive, holistic, seamless, cutting-edge, best-in-class, game-changer | same | same |
| VOICE-AMBIGUOUS | grundsätzlich | same | warn always |
| VOICE-HEDGE | Es ist wichtig zu betonen, Es sei darauf hingewiesen, Es ist anzumerken; It is important to note, It's worth noting, It should be noted | same | strict/warn |
| VOICE-TRANSITION | Darüber hinaus, Zusammenfassend lässt sich sagen, Lass uns einen Blick, wie bereits/oben erwähnt, wie du bereits weißt; Furthermore, Moreover, In conclusion, To sum up, As mentioned above, As you already know | same | strict/warn |
| VOICE-CLAIM | Experten sind sich einig, disruptive*, Standortbestimmung, Schulungsnachweis, Compliance-Nachweis; Experts agree, leverage, empower, unlock the potential, synergy | same | strict/warn |
| VOICE-COUNT-LESSON | möglicherweise (1), sowohl…als auch (1), nicht nur…sondern auch (1); robust (1), landscape (1), not only…but also (1), both…and (2) | same | strict/warn |
| VOICE-COUNT-COURSE | Stell dir vor (1), Imagine (1) | same | strict/warn |
| VOICE-FORM | Du/Sie mixing vs. form map | German files | strict/warn |
| VOICE-TERM | Zertifikat, Lernnachweis, certificate | learner-facing | warn |
| VOICE-PARAGRAPH / VOICE-CLOSER / VOICE-LISTS | > 5 sentences; trailing Fazit/Zusammenfassung/Kurz gesagt/In conclusion/To sum up; > 60% three-item lists | learner-facing | warn |
| Voice report metrics | words, sentences, mean/SD length, paragraphs > 5, list histogram, connectors (sowohl-als-auch, nicht-nur, darüber hinaus, zudem, außerdem, des Weiteren, zusammenfassend; not only, both-and, furthermore, moreover, additionally, in addition, in conclusion, however), Du/Sie | report only | – |

### 4.3 Not enforced: pattern gaps

| Gap (catalogue #) | Proposed rule id | Phrase ids (in `paste-ready-rules.mjs`) | Raw hits today | Start as |
|---|---|---|---|---|
| Split-sentence contrast (1) | VOICE-CONTRAST | `de-contrast-kein-das-ist`, `en-contrast-its-not-its`, `en-contrast-question-isnt` | 12 DE, 2 EN | warn → error after cleanup |
| Other contrast forms (1) | VOICE-CONTRAST / VOICE-COUNT-LESSON | `de-contrast-es-geht-nicht`, `de-contrast-mehr-als-nur`, `en-contrast-not-just`, `de-count-nicht-sondern` (1/lesson), `de-count-kein-sondern` (1/lesson) | 2 + 0 + 0 + 31 + 13 | warn → strict |
| Headline prose (2), rhetorical reveal (10) | VOICE-SHAPE | `de-shape-colon-reveal`, `en-shape-colon-reveal`, `shape-count-fragment`, `shape-list-colon-opener`, `shape-rhetorical-reveal`, stacked colons | 17, 1, 52, 28, 0, 43 | warn |
| Staccato, burstiness, opening monotony (3, 18) | VOICE-RHYTHM | fragment-run, sentence-cv, opener-monotony | 22 runs DE, 4 EN | warn |
| Tailing negation density (4) | VOICE-SHAPE | tail-negation-density (> 4/1k words) | about 15 files | warn |
| Aphorisms (5) | VOICE-APHORISM | `en-aphorism`, `de-aphorism` | 1 EN, 3 DE | warn |
| Inline triads (6) | VOICE-LISTS (extend) | inline-triad-share | not yet measured per file | warn |
| Puffery (7, 16) | VOICE-PUFFERY / counters | `de-puffery-buzz`, `de-puffery-rolle-spielen`, `de-puffery-eintauchen`, `de-puffery-potenzial`, `de-puffery-reise`, `de-count-entscheidend`, `de-count-spannend`, `en-puffery-vocab`, `en-puffery-plays-role`, `en-puffery-copula`, `en-count-crucial`, riders | 3 + 0 + 0 + 0 + 0 + 5 + 0 + 0 + 0 + 0 + 0 | warn → strict after allowlist |
| Residue and sycophancy (8, 21) | VOICE-RESIDUE | `en-residue-chat`, `de-residue-chat`, `en-residue-sycophancy`, `de-residue-sycophancy`, placeholders | 0 | **error now** |
| Signposting (9) | VOICE-OPENER (existing) | `en-opener-signpost`, `de-opener-signpost` | 0 + 1 (inside a quoted bad example, already allowlisted for that file) | strict |
| More closers (11) | VOICE-CLOSER (existing) | extend `CLOSER_MARKER` | – | warn |
| Hedge stacks (12) | VOICE-HEDGE (existing) | `en-hedge-stack`, `de-hedge-stack` | 0 | strict |
| Transition adverbs (13) | VOICE-TRANSITION (existing) | `en-transition-adverb`, `de-transition-adverb` | 0 | strict |
| Nominal style (15) | VOICE-NOMINAL | `de-nominal-funktionsverb`, `de-count-amtsdeutsch` (2/lesson), `en-nominal` | 1 + 2 + 1 | warn |
| Weasel attribution (17) | VOICE-CLAIM (existing) | `en-claim-studies-show`, `de-claim-untersuchungen-zeigen` | 1 (quoted example) + 0 | strict |
| ESG terms of art (7, 3.8) | VOICE-AMBIGUOUS (existing), optional | `de-ambiguous-wesentlich` (wesentlich*, Wesentlichkeit*) | 37 (21 statutory in `eu-ai-act-kurs`) | warn always, only if misuse appears |
| Pet words (19) | report only | watch-list column | see §2.2 #19 | report |
| Formatting by rule (20) | VOICE-SHAPE | bold-lead-run, heading-emoji, en-title-case | not measured | warn |

All proposed phrase rules were run against the three existing fixture folders (`german`, `english`, `form`) and fire **zero** times there. Adding them changes none of the existing exact-count assertions. It only trips the coverage test until new fixtures exist (§4.6.6).

### 4.4 Not enforced: scope gaps

| Surface | Why it is missed | Size | Fix |
|---|---|---|---|
| `public/workshops/<slug>/*.html` (slides, guide, builder, demo, presenter, hub, hands-on, homework, field-card, case-study) | `collectLearnerFacingFiles()` walks only `content/`, `src/lib/`, `src/app/`; `checkEmDash()` covers only content, TSX and `src/lib` TS | 12 HTML files, about 17k visible words; 29 em dashes | HTML extractor + discovery (§4.6.5) |
| `public/workshops/<slug>/lib/*.js` (scene text, presenter notes, labs) | same | about 13k words of string literals | reuse `extractTsStringLiterals()` for `.js` (skip `*-runtime.js`, `deck-stage.js`) |
| `src/lib/workshops-data-readiness.ts` | not in `EXTRA_COPY_MODULE_FILES`, not `*-copy.ts` | 1,532 words | add to `EXTRA_COPY_MODULE_FILES` |
| New W04 module (e.g. `src/lib/workshops-esg-reporting.ts`) | same | new | name it `*-copy.ts` or add it to `EXTRA_COPY_MODULE_FILES`; list both locales in the strict scope once written |
| `src/app/hilfe/eigene-ki/eigene-ki-copy.de.ts` / `.en.ts` | matcher is `rel.endsWith("-copy.ts")` | 2,166 words | change to `/-copy(?:\.(?:de|en))?\.ts$/` |
| `src/lib/course-projects/lesson-missions.ts`, `configs.ts` | not a technical course dir | 6,574 words | add `"course-projects"` to `TECHNICAL_COURSE_DIRS` or to `EXTRA_COPY_MODULE_FILES` |
| `src/components/data-science/chapters/**`, `data-engineering-fundamentals/chapters/**`, `components/demos/*.tsx` | TSX components are never learner-facing for voice rules (only for dashes and banned phrases) | about 6k words | out of scope for now; migrate copy into `*-copy.ts` modules when restyling |
| New JSON prose keys (e.g. `lede`, `promise`, `outcome`, `stepBody`) | only keys in `LEARNER_PROSE_KEYS` are read | – | add every new prose key used by the new workshop and course data |

### 4.5 Mechanism gaps

1. **Budgets in TS copy modules apply per file.** A TS module is one "lesson", so `perLesson: 1` in `workshops.ts` (138 prose literals, DE and EN in one file) allows one contrast for the whole workshop catalogue in both languages. Options: split `extractTsUnits()` into one lesson per top-level object literal, or scale the budget per 1,000 words for `kind === "ts"`.
2. **Phrase rules run on every file regardless of language.** That is intended and harmless for disjoint phrase lists. For shape rules that use shared words ("Ein/One"), gate on `unit.lang` (treat "mixed" as both).
3. **`BANNED_PHRASES_ERROR` uses ASCII `\b`.** It is fine for the current ASCII words. Any new German entry with an umlaut at a boundary must use `wordPattern()` from the voice module, or it silently fails to match.
4. **Counters need a budget.** `category: "counter"` has no `CATEGORY_RULE` fallback.
5. **Voice findings in copy modules are never errors.** The strict scope lists course content but no copy modules (`workshops.ts`, `demos-copy.ts`, `workshop-copy.ts`). After the rewrite, add them to `content-lint.voice-scope.json`.
6. **VOICE-CLOSER sees only a whole segment.** A JSON `keyTakeaway` field that restates the lesson is not caught. That is acceptable, but review it manually.

### 4.6 How to add the rules (step by step)

#### 4.6.1 Phrase rules

Append the entries from `scratchpad/tmp/paste-ready-rules.mjs` (`NEW_PHRASE_RULES`) to `VOICE_PHRASE_RULES` in `scripts/content-voice-rules.mjs`. The file is already ASCII-only and uses the module's `wordPattern` and `CLAUSE`. Example entries as they will appear:

```js
  // German contrast
  {
    id: "de-contrast-kein-das-ist",
    lang: "de",
    category: "contrast",
    label: "Das ist kein X. Das ist Y.",
    pattern: wordPattern("(?:Das|Dies|Es) (?:ist|sind|war|waren) kein(?:e|en|er)? [^.!?\\n]{1,80}\\.\\s+(?:Das|Dies|Es) (?:ist|sind|war|waren)"),
    advice: "state Y directly; keep a contrast only when the reader really believes X",
  },
  {
    id: "de-count-nicht-sondern",
    lang: "de",
    category: "counter",
    label: "nicht ... , sondern (without auch)",
    pattern: wordPattern(`nicht${CLAUSE},\\s*sondern(?! auch)`, "i"),
    perLesson: 1,
  },
  // German puffery
  {
    id: "de-puffery-buzz",
    lang: "de",
    category: "puffery",
    label: "nahtlos / maßgeschneidert / bahnbrechend / Herzstück ...",
    pattern: wordPattern("nahtlos(?:e[nmrs]?)?|maßgeschneidert(?:e[nmrs]?)?|bahnbrechend(?:e[nmrs]?)?|revolution(?:är(?:e[nmrs]?)?|ieren|iert)|wegweisend(?:e[nmrs]?)?|zukunftsweisend(?:e[nmrs]?)?|facettenreich(?:e[nmrs]?)?|vielschichtig(?:e[nmrs]?)?|Herzstück|Eckpfeiler|Schlüsselrolle|unerlässlich(?:e[nmrs]?)?|essen[zt]iell(?:e[nmrs]?)?", "i"),
  },
  // Residue (error in strict scope from day one)
  {
    id: "de-residue-sycophancy",
    lang: "de",
    category: "residue",
    label: "Keine Sorge / Du schaffst das / Kennst du das?",
    pattern: wordPattern("Keine Sorge|Keine Panik|Du schaffst das|Super, dass du|Toll, dass du|Schön, dass du|Kennst du das\\?|Du fragst dich vielleicht|Du bist nicht allein", "i"),
  },
  // ESG term of art (optional; warning only, never strict; 37 hits today)
  {
    id: "de-ambiguous-wesentlich",
    lang: "de",
    category: "ambiguous",
    label: "wesentlich / Wesentlichkeit",
    pattern: wordPattern("wesentlich(?:e[nmrs]?)?|Wesentlichkeit(?:sanalyse|en)?", "i"),
    advice: "keep it where it is the ESRS term (wesentliche Auswirkungen, doppelte Wesentlichkeit); cut it where it only means 'important'",
  },
```

Rules for writing entries: ASCII only (`ä ö ü ß Ä Ö Ü`, `’` for the apostrophe); every regex inside `wordPattern()` (starting a pattern with punctuation such as `,` breaks the lookbehind, so write such patterns as raw `/…/gu` inside a structural analyzer instead); bounded gaps via `CLAUSE`; case-sensitive when the tell is sentence-initial ("Additionally,", "Des Weiteren"); one `id` per phrase family so the allowlist can target it via `phrase`.

#### 4.6.2 New categories and rule ids

In `content-voice-rules.mjs`:

```js
export const VOICE_RULE_IDS = [
  // ...existing ids...
  "VOICE-CONTRAST",  // staged negation / negative parallelism
  "VOICE-PUFFERY",   // significance inflation, brochure register
  "VOICE-RESIDUE",   // chat leftovers, sycophancy, placeholders
  "VOICE-NOMINAL",   // Funktionsverbgefuege, hidden verbs (warning only)
  "VOICE-APHORISM",  // sayings that sound deep (warning only)
  "VOICE-SHAPE",     // colon reveals, count-first fragments, list-colon openers, stacked colons, tail-negation density
  "VOICE-RHYTHM",    // fragment runs, low burstiness, opener monotony (warning only)
];

export const VOICE_STRICT_RULES = new Set([
  // ...existing...
  "VOICE-RESIDUE",   // phase 1: zero hits today
  "VOICE-CONTRAST",  // phase 2: after the rewrite removes the 12 split-sentence cases
  "VOICE-PUFFERY",   // phase 2: after allowlisting statutory wording
]);

const CATEGORY_RULE = {
  // ...existing...
  contrast: "VOICE-CONTRAST",
  puffery: "VOICE-PUFFERY",
  residue: "VOICE-RESIDUE",
  nominal: "VOICE-NOMINAL",
  aphorism: "VOICE-APHORISM",
};
```

Also: add the ids to the header comment list; add `"VOICE-CONTRAST", "VOICE-PUFFERY", "VOICE-RESIDUE"` to `BAN_RULES` in `content-voice-report.mjs` so the "Bans" column counts them; add a CONTENT_GUIDE.md bullet ("No staged contrasts, colon reveals or count-first fragments in prose; see content-lint VOICE-CONTRAST/VOICE-SHAPE"). Extend `CLOSER_MARKER` with `Unterm Strich|Das Wichtigste in Kürze|Alles in allem|Abschließend|Overall|The bottom line|Bottom line|All in all`.

#### 4.6.3 Structural analyzer (`VOICE-SHAPE`, `VOICE-RHYTHM`)

Add to `content-voice-rules.mjs`, next to `analyzeStructure()`, and call `analyzeShapes(unit, findings)` from `analyzeVoice()` after `analyzeStructure(unit, findings)`. Everything it needs from `./content-prose.mjs` (`blankOutCodeFences`, `countWords`, `isProseSegment`, `splitParagraphs`, `splitSentences`) is already imported there.

```js
import { SHAPE_RULES } from "./content-voice-shapes.mjs"; // or inline the array from paste-ready-rules.mjs

export const STACKED_COLON_LIMIT = 1;
export const FRAGMENT_WORDS = 4;
export const FRAGMENT_RUN_LIMIT = 3;
export const TAIL_NEGATION_PER_1K = 4;
export const TAIL_NEGATION_MIN_WORDS = 800;
export const SENTENCE_CV_MIN = 0.35;
export const SENTENCE_CV_MIN_SENTENCES = 40;

const TAIL_NEGATION = /,\s(?:nicht|kein(?:e|en)?|not|never)\s[^.,;:!?\n]{1,40}[.!]/gu;
const QUOTED = /"[^"\n]*"|„[^“\n]*“|“[^”\n]*”/g;

function analyzeShapes(unit, findings) {
  let words = 0;
  let tails = 0;
  let firstLine = null;
  const lengths = [];
  for (const lesson of unit.lessons) {
    for (const segment of lesson.segments) {
      const text = blankOutCodeFences(segment.text);
      words += countWords(text);
      tails += (text.match(TAIL_NEGATION) || []).length;
      if (!isProseSegment(text)) continue;
      for (const block of splitParagraphs(text)) {
        if (block.type !== "text" && block.type !== "quote") continue;
        const line = blockLine(segment, block);
        if (firstLine === null) firstLine = line;
        const sentences = splitSentences(block.text);
        let run = 0;
        sentences.forEach((sentence, index) => {
          const n = countWords(sentence);
          lengths.push(n);
          for (const rule of SHAPE_RULES) {
            if (!rule.test.test(sentence)) continue;
            if (rule.id === "shape-rhetorical-reveal" && !(sentences[index + 1] && countWords(sentences[index + 1]) <= 8)) continue;
            findings.push(finding(unit, line, "VOICE-SHAPE", rule.id, `"${sentence.slice(0, 60)}" (${rule.label})`));
          }
          const colons = (sentence.replace(QUOTED, "").match(/:\s/g) || []).length;
          if (colons > STACKED_COLON_LIMIT) {
            findings.push(finding(unit, line, "VOICE-SHAPE", "stacked-colons", `${colons} colons in one sentence; split it`));
          }
          run = n <= FRAGMENT_WORDS ? run + 1 : 0;
          if (run === FRAGMENT_RUN_LIMIT) {
            findings.push(finding(unit, line, "VOICE-RHYTHM", "fragment-run", `${FRAGMENT_RUN_LIMIT} sentences of ${FRAGMENT_WORDS} words or fewer in a row; merge them`));
          }
        });
      }
    }
  }
  if (words >= TAIL_NEGATION_MIN_WORDS && (tails / words) * 1000 > TAIL_NEGATION_PER_1K) {
    findings.push(finding(unit, firstLine ?? 1, "VOICE-SHAPE", "tail-negation-density", `${tails} tailing negations in ${words} words; keep them for real scope statements`));
  }
  if (lengths.length >= SENTENCE_CV_MIN_SENTENCES && !/(?:quiz|glossary)/.test(unit.relFile)) {
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const sd = Math.sqrt(lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length);
    if (mean > 0 && sd / mean < SENTENCE_CV_MIN) {
      findings.push(finding(unit, firstLine ?? 1, "VOICE-RHYTHM", "sentence-cv", `sentence length varies too little (CV ${(sd / mean).toFixed(2)}); let length follow content`));
    }
  }
}
```

Notes: the rule uses the block's first line (as VOICE-PARAGRAPH does) because `splitSentences()` does not keep per-sentence offsets. Neither VOICE-SHAPE nor VOICE-RHYTHM goes into `VOICE_STRICT_RULES`. Language gating for SHAPE_RULES: German reveal patterns cannot match English text, and `shape-count-fragment` is bilingual by design.

#### 4.6.4 Report metrics

In `computeVoiceMetrics()` return `sentenceLengthCv`, `shortSentenceShare` (≤ 4 words), `contrastHits` (the VOICE-CONTRAST and counter phrases), `colonReveals`, `tailNegationsPer1k`. In `content-voice-report.mjs` extend `EMPTY_AGGREGATE`, `addRow()`, `finishAggregate()`, the table headers in `renderSummaryMarkdown()` and `renderFilesMarkdown()` ("Short ≤4", "Contrast", "CV"), and `jsonRow()`. Update `content-voice-report.test.mjs` for the new columns (the test "per-file metrics: …" asserts exact metric objects).

#### 4.6.5 Scope: workshops HTML/JS and the missing modules

In `content-prose.mjs`:

```js
export const EXTRA_COPY_MODULE_FILES = [
  "src/lib/books.ts",
  "src/lib/courses/catalog.ts",
  "src/lib/workshops.ts",
  "src/lib/workshops-data-readiness.ts",
  // "src/lib/workshops-esg-reporting.ts",  // Workshop 04, when it exists
];
const WORKSHOP_PUBLIC = /^public\/workshops\/[^/]+\/(?:[^/]+\.html|case-study\/[^/]+\.html|lib\/[^/]+\.js)$/;
const WORKSHOP_RUNTIME = /(?:runtime|stage|deck-viz)\.js$/;

export function isLearnerFacingFile(relFile) {
  const rel = toPosix(relFile);
  if (rel.split("/").some((segment) => EXCLUDED_SEGMENTS.has(segment))) return false;
  if (WORKSHOP_PUBLIC.test(rel)) return !WORKSHOP_RUNTIME.test(rel);
  // ...existing branches; and widen the copy-module matcher:
  // if (/-copy(?:\.(?:de|en))?\.ts$/.test(rel)) return rel.startsWith("src/lib/") || rel.startsWith("src/app/");
}
// collectLearnerFacingFiles(): add ...walk(join(root, "public", "workshops"), [])
// classifyLearnerFile(): public/workshops/<slug>/... -> { kind: rel.endsWith(".js") ? "ts" : "html", lang: "mixed", surface: `public/workshops/${slug}` }
// extractProseUnits(): kind === "html" -> extractHtmlUnits(raw)

export function extractHtmlUnits(raw) {
  // Blank out non-prose elements but keep newlines so line numbers survive.
  const blank = (m) => m.replace(/[^\n]/g, " ");
  const cleaned = raw
    .replace(/<(script|style|svg|pre|code|template|noscript|math|textarea)\b[\s\S]*?<\/\1>/gi, blank)
    .replace(/<!--[\s\S]*?-->/g, blank);
  const segments = [];
  const BLOCK = /<(p|li|h[1-6]|td|th|figcaption|blockquote|dd|dt|button|summary|label)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const m of cleaned.matchAll(BLOCK)) {
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (text === "" || text === "—" || text === "–") continue; // table placeholders
    segments.push({ text, line: 1 + countNewlines(cleaned, 0, m.index), physical: false });
  }
  return segments.length ? [{ id: "file", segments }] : [];
}
```

`decodeEntities` must map at least `&amp; &lt; &gt; &quot; &#39; &nbsp; &mdash; &ndash; &#8212; &#8211; &#8599;`. The W01 to W03 HTML files carry both locales (`lang="de"` and `lang="en"` blocks), so they are classified as `mixed`. That is fine for phrase rules; the Du/Sie check skips mixed files.

In `content-lint.mjs` `checkEmDash()`: add a third loop over the same `public/workshops` HTML/JS files, using `extractProseUnits()` segments instead of raw lines, so attribute values and placeholders do not fire:

```js
for (const relFile of collectLearnerFacingFiles(ROOT).filter((f) => f.startsWith("public/workshops/"))) {
  const unit = extractProseUnits(relFile, readFileSync(join(ROOT, relFile), "utf-8"));
  for (const lesson of unit.lessons) for (const s of lesson.segments) {
    if (s.text.includes(EM_DASH)) error(relFile, s.line, "EM-DASH", "Em-dash (U+2014) in workshop copy: use a comma, colon, or parentheses");
    if (s.text.includes(EN_DASH) && !/\d–\d/.test(s.text)) error(relFile, s.line, "EN-DASH", "En-dash (U+2013) in workshop copy: use a hyphen for ranges or restructure");
  }
}
```

(Note: W03's slide label "Last complete quarter: April–June 2026" uses an en dash in a month range. The digit-range exemption does not cover month names, so extend the exemption to `\p{L}–\p{L}` between month names or rewrite it as "April bis Juni 2026".)

Existing tests to update for the scope change: "file discovery is deterministic and never picks up test fixtures" asserts exact lists for the fixture roots (unchanged, because fixtures have no `public/`) and `real.includes(...)` (add `real.includes("public/workshops/datenbereitschaft-fuer-ki/slides.html")`); "path classification maps every surface and language" (add a `public/workshops/<slug>/slides.html` → `public/workshops/<slug>`, `mixed` case).

#### 4.6.6 Tests and fixtures

- **Location:** `packages/website/scripts/__tests__/fixtures/voice/`. Add a new fixture root, e.g. `slop-v2/`, rather than editing `german/` or `english/`. Reasons: `german` and `english` are pinned by exact assertions (closer lines `[[GERMAN_MD, 9], [GERMAN_JSON, 36]]`, three suppressed VOICE-OPENER findings in the allowlist test, exact TS findings for `l99-fixture.ts`, exact discovery lists). The existing fixtures also contain text the new rules would otherwise have to account for ("Fazit: Alles zählt", "Darüber hinaus gilt: Das Inventar lebt.", "…, nicht nur Produktnamen.").
- **Files:**
  - `slop-v2/content/ki-fuehrerschein/block-9-slop-lessons.json`: one lesson with one section per new German phrase id and one per shape, each firing exactly once, plus negative controls ("Das ist kein Problem. Du kannst weitermachen.", "Die Regel lautet: …", "Taucht ein nicht freigegebenes Verzeichnis auf, …", "Das Potenzial liegt bei 12 Prozent.", "doppelte Wesentlichkeit" for the ambiguous rule).
  - `slop-v2/content/ki-fuehrerschein/en/block-9-slop-lessons.json`: English twin.
  - `slop-v2/public/workshops/fixture-deck/slides.html`: an em dash in prose (must fire), `<td>—</td>` (must not fire), `<script>` text with a banned phrase (must not fire).
  - `slop-v2/src/lib/workshops-fixture-copy.ts`: a module that proves budgets apply per module.
- **Test code** in `content-lint-voice.test.mjs`:
  - `const SLOP_EXPECTATIONS = [["VOICE-CONTRAST","de-contrast-kein-das-ist"], …, ["VOICE-SHAPE","shape-count-fragment"], ["VOICE-RHYTHM","fragment-run"], ["VOICE-RESIDUE","de-residue-sycophancy"], …];` then `test("the slop-v2 fixture trips every new rule once", …)` using the existing `lint("slop-v2")` helper.
  - Extend the coverage test: `const seen = new Set([...lint("german").all, ...lint("english").all, ...lint("slop-v2").all].map((f) => f.phrase));`. Otherwise "every phrase and term rule is covered by the two language fixtures" fails for each new phrase id.
  - Add negative-control assertions: `byPhrase(all, "de-contrast-kein-das-ist")` never on the "Das ist kein Problem" line; VOICE-SHAPE and VOICE-RHYTHM stay warnings under `strict: ["content/ki-fuehrerschein/"]`; VOICE-RESIDUE becomes an error there; VOICE-AMBIGUOUS for `wesentlich` stays a warning.
  - A copy of the regex self-tests from `scratchpad/tmp/paste-ready-test.mjs` can go in as a pure unit test (`VOICE_PHRASE_RULES.filter(r => r.id in CASES)`), which documents each rule's intended positives and negatives.
- **Run:** `cd packages/website && bun run test:content-lint`, then `bun run content:lint` (errors fail) and `bun run content:voice-report -- --verbose --paths src/lib/workshops.ts,src/lib/demos-copy.ts,public/workshops` to see the new metrics.

#### 4.6.7 Rollout

1. **Phase 0 (no behaviour change):** land the metrics (§4.6.4) and the scope extension (§4.6.5) with new rules warn-only. Run the voice report with `--json` as a baseline.
2. **Phase 1 (with the copy rewrite):** VOICE-RESIDUE strict (0 hits); signposting, hedge stacks and transition adverbs go live in the existing strict categories (0 to 1 hits). Rewrite the 12 split-sentence contrasts, the workshop and demo copy modules, and W01 to W03 HTML prose.
3. **Phase 2:** promote VOICE-CONTRAST and VOICE-PUFFERY to strict. Add `workshops.ts`, `workshops-data-readiness.ts`, `demos-copy.ts`, `workshop-copy.ts`, the W04 module and `public/workshops/` to `content-lint.voice-scope.json`. Allowlist statutory wording with reasons (EU AI Act "innovatives KI-System", "essential services"; "maßgeblich" handled as ambiguous).
4. **Phase 3:** keep VOICE-SHAPE and VOICE-RHYTHM as warnings permanently, and review the density thresholds quarterly with `--baseline`. Model habits drift (humanizer SKILL.md: "Word habits change with every model release. The structural habits above persist").

---

## 5. Sources

How each source was read: **[D]** full text read directly (GitHub raw or WebFetch); **[S]** read through search-engine result summaries only, because the site was blocked by the egress proxy; **[R]** numbers recomputed from the authors' data.

### Wikipedia and pattern catalogues

- [S] Wikipedia: Signs of AI writing (WikiProject AI Cleanup): https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- [S] Wikipedia: WikiProject AI Cleanup: https://en.wikipedia.org/wiki/Wikipedia:WikiProject_AI_Cleanup
- [D] egc365/signs-of-ai-writing (structured mirror, PATTERNS.md): https://github.com/egc365/signs-of-ai-writing
- [D] blader/humanizer SKILL.md v3.0.0 (Wikipedia-based, 25 patterns with before/after): https://github.com/blader/humanizer/blob/main/SKILL.md
- [D] hardikpandya/stop-slop (SKILL.md, references/phrases.md, references/structures.md): https://github.com/hardikpandya/stop-slop
- [D] NousResearch autonovel ANTI-SLOP.md: https://github.com/NousResearch/autonovel/blob/master/ANTI-SLOP.md
- [D] mgiovani/stopslop README (48 rules, tiers, pt-BR panels): https://github.com/mgiovani/stopslop
- [D] stopslop PR #72, rules tightened by human-vs-AI lift: https://github.com/mgiovani/stopslop/pull/72 ; PR #71, corpus scoring: https://github.com/mgiovani/stopslop/pull/71
- [S] Aboudjem/humanizer-skill (55 patterns): https://github.com/Aboudjem/humanizer-skill
- [S] Secondary write-ups of the Wikipedia guide: Forbes (Sep 2025) https://www.forbes.com/sites/jodiecook/2025/09/08/the-10-giveaway-signs-of-ai-writing-wikipedia-reveals/ ; Beutler Ink https://www.beutlerink.com/blog/how-to-spot-ai-writing

### Research

- [S][R] Kobak, González-Márquez, Horvát, Lause: "Delving into LLM-assisted writing in biomedical publications through excess vocabulary", *Science Advances* 11 (2025) eadt3813: https://www.science.org/doi/10.1126/sciadv.adt3813 ; v1 "Delving into ChatGPT usage in academic writing through excess vocabulary" (arXiv 2406.07016v1): https://arxiv.org/abs/2406.07016v1 ; data and code [D]: https://github.com/berenslab/llm-excess-vocab
- [S] Juzek & Ward: "Why Does ChatGPT 'Delve' So Much? Exploring the Sources of Lexical Overrepresentation in Large Language Models", COLING 2025: https://arxiv.org/abs/2412.11385
- [S] Reinhart et al.: "Do LLMs write like humans? Variation in grammatical and rhetorical styles", *PNAS* 122(8) e2422455122 (2025): https://www.pnas.org/doi/10.1073/pnas.2422455122
- [S] Shaib, Chakrabarty, Garcia-Olano, Wallace: "Measuring AI 'Slop' in Text" (2025, rev. 2026): https://arxiv.org/abs/2509.19163
- [S] Paech et al.: "Antislop: A Comprehensive Framework for Identifying and Eliminating Repetitive Patterns in Language Models", ICLR 2026: https://arxiv.org/abs/2510.15061 ; [D] antislop-sampler: https://github.com/sam-paech/antislop-sampler ; slop-forensics: https://github.com/sam-paech/slop-forensics ; EQ-Bench Slop Score: https://eqbench.com/slop-score.html
- [S] "Artificial Epanorthosis: Why large language models overuse a classical rhetorical figure, and how to mitigate it" (2026): https://arxiv.org/abs/2607.21498
- [S] "Em-ergence of the em-dash: a population-level rise in em-dash frequency in medRxiv preprints" (2026): https://arxiv.org/abs/2606.29540
- [S] Freeburg: "The Last Fingerprint: How Markdown Training Shapes LLM Prose" (2026): https://arxiv.org/abs/2603.27006
- [S] Russell, Karpinska, Iyyer: "People who frequently use ChatGPT for writing tasks are accurate and robust detectors of AI-generated text", ACL 2025: https://aclanthology.org/2025.acl-long.267/
- [S] Korean excess-vocabulary study (German equivalent not found): https://arxiv.org/abs/2609.07447

### Journalism and dictionaries

- [S] Washington Post: "What are the clues that ChatGPT wrote something? We analyzed its style" (Nov 2025): https://www.washingtonpost.com/technology/interactive/2025/how-detect-chatgpt-em-dash/ ; "Some think the em dash is a 'ChatGPT hyphen.' Writers disagree." (Apr 2025): https://www.washingtonpost.com/technology/2025/04/09/ai-em-dash-writing-punctuation-chatgpt/
- [S] Merriam-Webster Word of the Year 2025 "slop": https://www.merriam-webster.com/wordplay/word-of-the-year

### Plain language (English)

- [S] GOV.UK, Writing for GOV.UK: https://www.gov.uk/guidance/content-design/writing-for-gov-uk ; A to Z style guide (words to avoid): https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/ ; Use clear language: https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/ ; "Sentence length: why 25 words is our limit": https://insidegovuk.blog.gov.uk/2014/08/04/sentence-length-why-25-words-is-our-limit/
- [D] GOV.UK-style agent skill (fofr gist: one idea per sentence, 15 to 20 words, words to avoid): https://gist.github.com/fofr/505e225f9bf5e839d30c12ba6bfa0be2
- [D] Federal Plain Language Guidelines, archived in GSA/plainlanguage.gov: "Avoid hidden verbs", "Use active voice", "Write short sentences", "Use simple words and phrases": https://github.com/GSA/plainlanguage.gov (paths `_pages/guidelines/...`) ; [S] current home: https://digital.gov/guides/plain-language ; [S] note on the site takedown: https://centerforplainlanguage.org/the-federal-plain-language-guidelines-are-missing/
- [S] Nielsen Norman Group: "Plain Language Is for Everyone, Even Experts" (Loranger): https://www.nngroup.com/articles/plain-language-experts/ ; Morkes & Nielsen: "Concise, SCANNABLE, and Objective: How to Write for the Web": https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/

### German sources

- [S] Wolf Schneider, *Deutsch für Profis* (1982; Goldmann); Reporterfabrik: "Wie schreibt man gut? 10 Tipps von Wolf Schneider": https://reporterfabrik.org/wp-content/uploads/2019/05/HIntergrund-Wie-schreibt-man-gut-10-Tipps-von-Wolf-Schneider-.pdf ; sentence length (dpa: 9 optimal, 20 desirable, 30 max): https://wortliga.de/glossar/optimale-satzlaenge/
- [S] Bundesverwaltungsamt (BBB): Arbeitshandbuch "Bürgernahe Verwaltungssprache": https://www.bva.bund.de/SharedDocs/Downloads/DE/Oeffentlichkeitsarbeit/Buergernahe_Verwaltungssprache_BBB.pdf
- [S] DIN ISO 24495-1:2024-03 "Einfache Sprache – Teil 1: Grundsätze und Leitlinien": https://www.dinmedia.de/en/standard/din-iso-24495-1/375008622 ; DIN 8581-1:2024-05 "Einfache Sprache – Anwendung für das Deutsche": https://www.dinmedia.de/en/standard/din-8581-1/377238273 ; summaries: https://www.mt-g.com/en/news/blog/din-8581-1-plain-language-for-german-factual-texts and https://www.doctima.de/2024/06/din-normen-einfache-sprache/
- [S] Hamburger Verständlichkeitskonzept (Langer, Schulz von Thun, Tausch): https://de.wikipedia.org/wiki/Hamburger_Verst%C3%A4ndlichkeitskonzept
- [S] German practitioner guides on AI phrasing: t3n "Floskeln, Buzzwords, Gedankenstriche: So erkennst du KI-Texte": https://t3n.de/news/ki-texte-erkennen-floskeln-buzzwords-gedankenstriche-chatgpt-1745388/ ; Kathrin Landsdorfer "21 häufig beanspruchte Phrasen von ChatGPT": https://kathrinlandsdorfer.com/21-phrasen-von-chatgpt/ ; korrektur.de (2026): https://korrektur.de/ki-texte-erkennen-stilmerkmale-studis-2026 ; eology: https://www.eology.de/news/merkmale-von-chatgpt-typischen-texten-beim-ai-roundtable ; lillikoisser.at: https://lillikoisser.at/ki-texte-erkennen/ ; contentconsultants.de: https://www.contentconsultants.de/ki-texte-erkennen-warum-man-texte-besser-selbst-schreibt/

### ESG (Workshop 04)

- [S] Directive (EU) 2024/825 (Empowering Consumers for the Green Transition), applies from 27 Sep 2026: https://eur-lex.europa.eu/eli/dir/2024/825/oj ; EU Transition Pathways summary: https://transition-pathways.europa.eu/retail/legislation/directive-eu-2024825-empowering-consumer-green-transition ; Cooley note (Mar 2026): https://products.cooley.com/2026/03/16/empowering-consumers-for-the-green-transition-directive-check-your-sustainability-claims-and-warranty-information-for-compliance-with-new-eu-regime/

### Repository files read

- `CONTENT_GUIDE.md`
- `packages/website/scripts/content-lint.mjs`
- `packages/website/scripts/content-voice-rules.mjs`
- `packages/website/scripts/content-prose.mjs`
- `packages/website/scripts/content-voice-report.mjs`
- `packages/website/scripts/content-lint.voice-scope.json`
- `packages/website/scripts/content-lint.allowlist.json`
- `packages/website/scripts/content-lint.form-map.json`
- `packages/website/scripts/__tests__/content-lint-voice.test.mjs`
- `packages/website/scripts/__tests__/content-voice-report.test.mjs` (test names)
- `packages/website/scripts/__tests__/fixtures/voice/**`
- Copy sampled: `src/lib/workshops.ts`, `src/lib/demos-copy.ts`, `src/lib/workshops-data-readiness.ts`, `public/workshops/datenbereitschaft-fuer-ki/slides.html` (visible text), `content/books/ki-arbeitsalltag/{01,06,07}`.
