# Public Content Guide

- Use direct German prose and define technical terms at first use.
- Open with the fact, the question, or the example. No filler openers ("In der heutigen Zeit", "In today's world"), no hedging frames ("Es ist wichtig zu betonen", "It is important to note"), no restating closers ("Zusammenfassend", "In conclusion").
- Vary the rhythm: short and long sentences, paragraphs of five sentences or fewer, lists that do not all have three items.
- Keep one form of address per course: Du everywhere except the EU AI Act course (Sie); English addresses the reader as "you".
- The completion document is a "Teilnahmebestätigung" ("certificate of participation"); "Zertifikat" and "Lernnachweis" stay out of prose.
- Terms of art in legal text keep their legal meaning: "grundsätzlich" in a normative sentence states a rule that statutory exceptions qualify, so it stays there and goes only where it means "basically"; the lint reports it as a VOICE-AMBIGUOUS warning, never an error.
- `bun run content:lint` enforces these rules (strict scope in `packages/website/scripts/content-lint.voice-scope.json`); `bun run content:voice-report` measures them per file.
- Separate observed facts, interpretation, examples, and recommendations.
- Cite primary sources for legal, regulatory, scientific, and product claims.
- Attach a review date to time-sensitive material.
- State assumptions in calculators and simulations.
- Never claim accreditation, legal certainty, guaranteed compliance, or guaranteed business outcomes.
- Do not include customer information, private operational evidence, provider credentials, internal plans, or local paths.
- Keep navigation labels and collection counts derived from their canonical registries.
- Do not publish placeholders, invented participant results, unsupported collection counts, or promised dates for material that does not exist.
- Add future courses, tools, projects, and media through the typed canonical registry; do not hardcode a parallel collection in a page component.
- Follow [ARTIFACT_PUBLICATION.md](ARTIFACT_PUBLICATION.md) for the exact GitHub commit pin, registry shape, local license and asset records, page inventory, Lighthouse representative, scanner, and browser admission gates.
- A future tool or project registry entry must include its publication status and status note, structured prerequisites, installation steps, usage steps, integration targets and steps, public documentation, an accessible browser-safe screenshot with exact SHA-256, byte size, and dimensions, and at least one internal related-learning route. Register the screenshot and locally hosted license in `ASSET_MANIFEST.json`; `bun run artifact-assets:check` rejects missing files, manifest drift, byte tampering, and dimension drift. The validator rejects partial entries, and the shared detail page renders this guide without artifact-specific page code.
- Apply [MEDIA_POLICY.md](MEDIA_POLICY.md) before publishing any video or audio. Captions, transcript, poster, provenance, redistribution rights, hashes, sizes, storage review, and accessibility proof are mandatory.
- Register stored public assets in `ASSET_MANIFEST.json`. `bun run asset:record` only produces a candidate record; human review remains required.

## Sentence shapes that read as generated

Readers spot machine-written text by its shapes more than by single words. `bun run content:lint` reports the rules below. Contrast, puffery and residue are errors in the strict scope; the other rules are warnings everywhere. Workshop pages under `public/workshops/` are read as well, and every finding there is a warning.

- `VOICE-CONTRAST` reports staged negation. "Das ist kein KI-Problem. Das ist ein Datenproblem." becomes "Bring die Daten zuerst in eine Tabelle." Keep a contrast only when the reader really holds the negated belief; "nicht X, sondern Y" is allowed once per lesson.
- `VOICE-PUFFERY` reports ratings instead of facts. "Das Herzstück des Kurses ist der Skill" becomes "Im Kit liegt ein halb fertiger Kennzahlen-Skill." The ESRS terms "wesentlich", "Wesentlichkeit", "material" and "double materiality" are never puffery.
- `VOICE-RESIDUE` reports chat leftovers and reassurance. "Keine Sorge, das ist ganz einfach." becomes "Die Übung dauert 10 Minuten und läuft nur in deinem Browser."
- `VOICE-NOMINAL` reports nouns where a verb belongs. "Die Prüfung erfolgt durch das Team" becomes "Das Team prüft".
- `VOICE-APHORISM` reports sayings that sound deep. "Daten sind das A und O." goes; the next sentence with the actual claim stays.
- `VOICE-SHAPE` reports headline grammar in running prose. "Fünf Prompts, ein Analyst." becomes "Du schreibst in fünf Prompts auf, was jede Kennzahl im Bericht bedeutet." The same rule reports colon reveals ("Das Ergebnis: ..."), list-colon openers ("Memos, Briefe, Vorlagen: ..."), more than one colon in a sentence, a question answered in the next breath ("Das Ergebnis? 40 Prozent.") and more than four tailing negations (", nicht zum Verkaufen.") per 1,000 words.
- `VOICE-RHYTHM` reports three sentences of four words or fewer in a row ("Du nutzt KI schon. Jeden Tag. Seit Jahren.") and files where every sentence has the same length. Merge fragments into one sentence with a verb; let length follow content.
- Existing rules also cover signposting ("Hier kommt RAG ins Spiel"), hedge stacks ("könnte möglicherweise"), transition adverbs ("Des Weiteren", "Additionally,"), unsourced authority ("Untersuchungen zeigen") and closers ("Unterm Strich", "Overall").
