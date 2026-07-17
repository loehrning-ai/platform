# Public Content Guide

- Use direct German prose and define technical terms at first use.
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
