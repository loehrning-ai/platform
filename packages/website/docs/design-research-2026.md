# Design Research: Attention Without AI Slop

Reviewed 26 August 2026. This memo separates research evidence, direct interface observation, and product inference. Recognition or novelty is not treated as proof of learning value.

## Question

What makes an AI learning interface feel useful, authored, and worth sustained attention without becoming generic AI decoration, a game layer, or an inaccessible visual spectacle?

## Method

1. Review recent peer-reviewed work on active learning, feedback, cueing, decorative detail, user agency, AI provenance, and educational AI slop.
2. Inspect current live learning, data-storytelling, editorial, and developer-learning interfaces.
3. Compare the evidence with the current loehrning.ai route, component, copy, density, motion, accessibility, and screenshot baseline.
4. Retain a pattern only when its purpose can be named and tested.

Cited studies below describe empirical evidence within their stated samples and contexts. Benchmark mechanics are dated interface observations. Aesthetic exclusions, numeric thresholds, and release rules are explicit product inference or platform policy unless a cited result states otherwise.

The baseline covered 16 representative production routes at 1440 × 900 and 390 × 844. The previous `/kurse` page measured 6,183px desktop and 10,976px mobile. It exposed approximately 13,600 characters, repeated the catalogue, and made secondary metadata visually compete with course choice.

### Sanitized baseline receipt

- **Captured:** 25 August 2026.
- **Origin class:** public production website, unauthenticated and provider-free.
- **Coverage:** 16 representative routes at two viewports, producing 32 route/viewport captures.
- **Viewports:** 1440 × 900 desktop and 390 × 844 mobile.
- **Key `/kurse` measurements:** 6,183px scroll height and 13,646 text characters on desktop; 10,976px and 13,656 characters on mobile.
- **Boundary:** this receipt describes the pre-redesign public baseline. It is not evidence for the current branch, authenticated behavior, provider behavior, deployment freshness, usability, or learning outcomes.

## Evidence

### Active work beats passive exposure

In higher education, digital technology produced no substantial general improvement when it merely substituted for nontechnology instruction; outcomes improved when it enabled more advanced learning activity and supplied activity-specific cognitive support such as scaffolding, feedback, or sequencing. Product inference: require constructive or interactive work rather than arbitrary clicks. [Sailer et al., 2024](https://doi.org/10.1016/j.lindif.2024.102446)

A 2026 observational study of courses taught by 55 instructors at 43 institutions reinforces that the label “active” is too weak: the useful distinction is the intellectual work required. Tasks should make learners produce an explanation, interpretation, prediction, or representation beyond what the interface already presented. The study observed three class periods per instructor in a nonrepresentative sample and did not test learning outcomes. [Not simply “active”, 2026](https://doi.org/10.1128/jmbe.00284-25)

Across 182 effect sizes from 61 studies in technology-rich learning environments, feedback had a medium effect compared with no feedback, and explanation feedback had the strongest effect among the feedback types examined. Product inference: after an attempt, explain what changed and what to inspect next. [Cai et al., 2023](https://doi.org/10.1016/j.edurev.2023.100521)

A 2026 meta-analysis of 51 studies and 160 effects found no general immediate-over-delayed feedback advantage (`g = .03`, 95% CI `[-.08, .13]`); timing effects depended on the learning context. Product inference: place feedback after a meaningful attempt and choose its timing for the task instead of enforcing an always-immediate rule. [Feedback timing meta-analysis, 2026](https://doi.org/10.1007/s10648-026-10117-8)

In a crossover RCT in one Harvard undergraduate physics course (N=194), a structured self-paced AI tutor produced higher short-term post-test scores than in-class active learning, while students self-reported higher engagement and motivation. The two-lesson intervention used expert-authored prompts, scaffolding, pre-written answers, and immediate feedback; it does not establish effects for unbounded chatbots or other contexts. [Kestin et al., 2025](https://doi.org/10.1038/s41598-025-97652-6)

A 2025 meta-analysis covering 54 studies found that active strategies embedded in instructional video improved retention, comprehension, and transfer more than passive viewing, with a smaller motivation effect and a simultaneous increase in cognitive load. Product inference: remove extraneous load while preserving productive effort; low load or visible engagement alone is not the learning objective. [Active video meta-analysis, 2025](https://doi.org/10.1016/j.edurev.2025.100708)

Across 68 experimental studies, digital prompts had a modest overall effect, with stronger results for action-based and learner-specific prompts and no general advantage from making prompts more multimedia-heavy. Product inference: trigger a concise prompt from learner behavior instead of adding a decorative prompt surface. [Digital prompting meta-analysis, 2025](https://doi.org/10.1016/j.edurev.2025.100686)

### Attention needs signaling, not decoration

A meta-analysis found small positive effects of non-content cues such as arrows, color coding, and highlighting on retention and transfer in multimedia learning. [Xie et al., 2017](https://doi.org/10.1371/journal.pone.0183884)

A newer synthesis of 40 studies with 5,049 learners also found a small positive cueing effect, but effects varied materially by cue type and combined cues were not reliably better. Product inference: use one purposeful cue for the current decision instead of layering color, arrows, motion, and labels. [Cueing meta-analysis, 2026](https://doi.org/10.3389/fpsyg.2026.1717604)

Interesting but irrelevant detail can divert limited attention and reduce learning. Visual novelty therefore needs a causal or navigational job. [Kienitz et al., 2023](https://doi.org/10.1007/s11251-023-09632-w)

A 2025 synthesis of 92 articles, 181 studies, and 591 effects found the most consistent multimedia-learning gains around removing seductive details, coherent presentation, self-explanation, testing, and scaffolding. Animation, games, simulations, and virtual reality were less consistent, while active-learning interventions outperformed presentation-only changes. [Multimedia-learning meta-analysis, 2025](https://doi.org/10.1016/j.edurev.2025.100730)

In a three-wave virtual-reality study, initial novelty impeded learning and encoding improved as learners became familiar with the environment; sustained exploration was beneficial. This is a bounded VR result, not evidence against novel web interaction in general. Product inference: introduce a distinctive instrument inside a stable interaction grammar and test repeat use, not only first-session appeal. [Novelty and learning in VR, 2025](https://doi.org/10.1109/TVCG.2025.3549897)

### Agency and provenance matter

In three online experiments on AI-designed clothing, allowing consumers to customize a design mitigated negative responses by increasing perceived authenticity. Product inference: bounded learner input is worth testing as a way to preserve agency; this study does not establish effects on learning, visible authorship, or revision. [Lee and Kim, 2024](https://doi.org/10.1016/j.jretconser.2023.103690)

Jones et al. define educational AI slop as material created mostly or entirely by generative AI with little apparent human care toward accuracy, fluency, helpfulness, or likely use or interpretation. In a mixed-methods study of biomedical videos, they catalogued potentially problematic features including message-delivery incoherence, superfluous content, weak relevance, and lack of accountable human care. The study did not measure learner outcomes and found no significant engagement-rate difference between slop and the overall video population. [Jones et al., 2025](https://doi.org/10.2196/80084)

In a preregistered CHI 2025 experiment (N=308), explanations increased reliance on both correct and incorrect LLM responses; sources and visible inconsistencies reduced reliance on incorrect responses. Product inference: an explanation can support inspection but is not evidence of reliability. Put sources and conflicts beside the claim. [Appropriate reliance on LLMs, 2025](https://doi.org/10.1145/3706598.3714020)

Two preregistered US experiments totaling 7,579 participants found that AI labels reduced belief in misleading generated images, while simple labels had little effect on intended engagement. A separate CHI 2025 experiment with 911 participants found that label design affected perceived AI involvement and trust, while detailed provenance-style labels risked information overload. Product inference: provide a short, clear label with detail on demand; do not treat labeling as a truth or engagement guarantee. [AI-generated labels, 2025](https://doi.org/10.1093/pnasnexus/pgaf170) [AI-label design, 2025](https://doi.org/10.1145/3706598.3713171)

NIST treats provenance, labeling, watermarking, detection, testing, and auditing as complementary transparency mechanisms. C2PA makes a narrower technical guarantee: a valid manifest can establish association, correct formation, and tamper evidence, not whether the asset or claim is true. Product inference: keep provenance status separate from factual verification and accountable review. [NIST AI 100-4, 2024](https://doi.org/10.6028/NIST.AI.100-4) [C2PA 2.4 harms model](https://spec.c2pa.org/specifications/specifications/2.4/security/Harms_Modelling.html)

A 2026 design-led qualitative study found that preferred transparency varied with task and user characteristics. Brief agent rationales supported participants' sensemaking and agency; separately, visible majority agreement—especially without rationales—became a reliability heuristic that could cause participants to dismiss dissent. This preliminary study used 12 participants, five mock variants, bounded tasks, and accurate final outputs; it does not establish causal effects for deployed multi-agent systems. Product inference: expose task-relevant evidence on demand instead of maximizing process disclosure. [Sensemaking in Multi-Agent LLM Interfaces, 2026](https://doi.org/10.1145/3772318.3791157)

Accessibility remains a design floor. WCAG 2.2 AA covers requirements including visible focus, status messages, dragging alternatives, and target size; Pause, Stop, Hide applies at Level A to qualifying automatic movement or updating, while suppressing interaction-triggered motion is AAA. This platform deliberately adopts a stronger reduced-motion and static-equivalence policy than the AA minimum. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## Current Interface Benchmark

These are direct observations made on 25 August 2026 from public interfaces. They identify reusable mechanics, not styles to clone. Because public interfaces change, the observations are dated rather than treated as permanent product facts.

| Interface                                                                                | Mechanic worth retaining                                                                           | Failure to avoid                                                                             | loehrning.ai consequence                                                                        |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [Observable: Learn D3 Interaction](https://observablehq.com/@d3/learn-d3-interaction)    | Explanation, editable input, and output share one reactive artifact.                               | Notebook and editor chrome can overwhelm beginners.                                          | Couple code and output only when the coupling is the lesson; preserve and export learner state. |
| [Brilliant: Logic](https://brilliant.org/courses/logic-deduction/)                       | Practice volume and concrete reasoning actions lead the catalogue.                                 | Streaks, cartoon rewards, and subscription-app framing are not learning evidence.            | Lead course entries with the action and finished proof, not the description.                    |
| [Distill: Feature Visualization](https://distill.pub/2017/feature-visualization/)        | Interactive figures sit beside the exact research claim they expose.                               | Heavy custom figures need keyboard, text, and static equivalents.                            | Place an instrument beside its claim and keep method, source, and limits adjacent.              |
| [Our World in Data: Life expectancy](https://ourworldindata.org/grapher/life-expectancy) | Source, definition, method, steward, download, API, and citation form one evidence object.         | Dense metadata can dominate small screens.                                                   | Put source, method, freshness, caveat, and export in a collapsed proof rail after the task.     |
| [Mechanical Watch](https://ciechanow.ski/mechanical-watch/)                              | Each control isolates one causal relationship; animation can be paused globally.                   | Long WebGL narratives cost battery and exclude users without equivalent representations.     | Use one bounded model lab for a central mechanism, with reset, pause, keyboard, and summary.    |
| [Josh Comeau: CSS Transitions](https://www.joshwcomeau.com/animation/css-transitions/)   | Editable before/after states, scrubbers, replay, and reduced-motion guidance make claims testable. | Whimsical polish becomes noise when applied universally.                                     | Motion lessons need pause, scrub, replay, and reduced-motion paths.                             |
| [Exercism: JavaScript](https://exercism.org/tracks/javascript)                           | Learners produce work, run tests, diagnose failures, and improve it.                               | Account and tooling overhead can obstruct beginners.                                         | Project flow becomes Run → Tests → Diagnosis → Improve → Compare.                               |
| [The Pudding: Can an AI make a data story?](https://pudding.cool/2024/07/ai/)            | Result, process, raw prompt, and editorial assessment can be compared without losing position.     | Full transcripts create another wall of text.                                                | Use a state-preserving Result / Process / Evidence lens; keep raw material on demand.           |
| [Little Language Lessons](https://labs.google/lll/en/en)                                 | Each AI experiment serves one named real-world purpose and states model uncertainty.               | Camera privacy, provider dependency, and generated-language errors need explicit boundaries. | Name AI activities by task, constrain their context, and show verification inside the activity. |
| [web.dev: Learn CSS](https://web.dev/learn/css)                                          | Predictable search, localization, progress, and module structure handle a large curriculum.        | A long accordion catalogue is useful but not memorable by itself.                            | Keep its information-architecture discipline while making entries activity-first.               |

## AI-Slop Signals Rejected

This is a product-level anti-pattern blacklist derived from the quality risks above, direct benchmark observation, and the intended loehrning.ai identity. Current research does not establish universal dislike of glass panels, purple glow, rounded cards, or any other specific visual motif. Those exclusions are design inference and platform policy, not causal findings about what every learner prefers.

- generic glass panels, purple glows, sparkles, synthetic portraits, and gradient ambience;
- giant claims followed by weak or repetitive tasks;
- identical rounded cards for every content type;
- anonymous or unexplained AI output;
- fake status, fake live activity, unverified testimonials, and decorative metrics;
- points, streaks, badges, and read-clicks presented as competence;
- generic chat as the default interaction;
- autoplay sound, unpausable loops, scroll hijacking, and decorative 3D;
- source or limitation notes detached from the claim they qualify;
- novelty that disappears under reduced motion or cannot be operated by keyboard.

The "purple glows" and "gradient ambience" exclusions above were stated policy before they were fully shipped: `globals.css`'s `.site-atmosphere`, `.berlin-hero`, and `.berlin-footer` washes and the `brand-lilac` token they used were still present as of 26 August 2026. See [design-audit-2026.md's 2026-08-30 addendum](./design-audit-2026.md#2026-08-30-addendum--design-system-reunification) for when the code was brought into line with this list.

## Canonical Research Decisions

This memo is the canonical evidence source for the interface contract. Other design documents reference these decision IDs instead of restating study claims.

| ID      | Evidence boundary                                                                                  | Product decision                                                                                   |
| ------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `DR-01` | Active and constructive work is more useful than technology substitution or arbitrary interaction. | Require a prediction, explanation, construction, comparison, or transfer action.                   |
| `DR-02` | Explanatory feedback is useful, while no universal immediate-feedback advantage is established.    | Put explanation after a meaningful attempt and time it for the task.                               |
| `DR-03` | Purposeful cues can help; irrelevant detail and stacked cues can consume attention.                | Use one task-relevant signal and remove decorative competition.                                    |
| `DR-04` | Bounded customization can support perceived agency; this is not established learning evidence.     | Preserve learner input and state through prediction, manipulation, and revision.                   |
| `DR-05` | Explanations can increase misplaced reliance; sources, conflicts, and provenance aid inspection.   | Keep source, method, version, limits, and conflicts beside the result, with detail on demand.      |
| `DR-06` | Novelty effects are context-bound, and accessible alternatives remain a design floor.              | Put distinctive instruments inside a stable grammar with keyboard, touch, pause, and static paths. |
| `DR-07` | AI labels and visible process do not guarantee truth, trust, engagement, or learning.              | Label generated material concisely and keep verification separate from provenance and rationale.   |
| `DR-08` | The reviewed evidence does not establish one universally engaging visual style.                    | Treat palette, geometry, density, progress, and anti-slop exclusions as testable platform policy.  |

## Product Synthesis

The platform becomes a collection of authored learning instruments:

1. **Commit:** predict, classify, choose, or construct before the result appears (`DR-01`, `DR-04`).
2. **Test:** manipulate one bounded variable and inspect the contrast (`DR-01`, `DR-03`).
3. **Revise:** explain the changed evidence and transfer the rule (`DR-02`, `DR-05`).

Every substantial result can expose three synchronized lenses:

- **Result:** the concise current state;
- **Process:** the learner's attempt and transformation;
- **Evidence:** source, method, version, limits, test state, and export.

The visual system remains Kalkweiß, Druckertinte, Kupfer, Loehrning Sans, Geist Mono, the editorial grid, and the landing globe. Distinction comes from the instrument, dataset, human author, and learner artifact. It does not come from unrelated course skins or more decorative motion.

## Evidence-Informed Release Tests And Platform Policy

Explanatory feedback, adjacent evidence, operable controls, and accessible alternatives are evidence-informed safeguards. Exact numeric thresholds and implementation bans—including first-viewport placement, three simultaneous choices, one progress thread, 12px labels, and no `transition: all`—are explicit product and engineering policy to validate with target learners, not universal research findings.

- first meaningful learning action is visible without scrolling at 390 × 844 and 1440 × 900;
- no more than three learner-facing stage choices at once;
- every changed interaction affects a decision, result, feedback, recall, or artifact;
- explanatory feedback follows an attempt;
- sources, method, version, limitations, and export remain reachable beside the result;
- one global top progress thread, with no route-specific fixed duplicate;
- no learner-facing XP, streak, badge, or read-click mastery claim;
- no `transition: all`, unpausable decorative loop, or changed UI label below 12px;
- keyboard, focus, touch, reduced-motion, static fallback, overflow, hydration, and locale parity pass;
- representative desktop and mobile screenshots receive human visual review.
