# loehrning.ai Marketing

This directory is the public editorial operating system for loehrning.ai.
Its purpose is distribution of free learning, not demand generation for a
consultancy.

Everything committed here is public. Do not store unpublished partner
conversations, contact lists, personal data, provider evidence, credentials,
performance exports, or local working paths here.

## Mission

loehrning.ai helps German-speaking people understand, use, verify, and shape
AI. The platform is free to read and use. Its application code is open source.
Individual learning texts and brand assets have separate licenses.

The operating thesis is:

> KI verstehen. Sicher anwenden. Kritisch prüfen. Offen mitgestalten.

## Canonical sources

Marketing describes the product. It does not redefine it.

| Subject | Canonical source |
| --- | --- |
| Course inventory and routes | `packages/website/src/lib/courses/catalog.ts` |
| Core path versus deep dives | `packages/website/src/lib/courses/tracks.ts` |
| Books | `packages/website/src/lib/books.ts` |
| Demonstrations | `packages/website/src/lib/demos.ts` |
| Blog articles | `packages/website/src/lib/blog-metadata.ts` |
| Open-source artifacts | `packages/website/src/lib/open-source/artifacts.ts` |
| Crawl and indexing behavior | `packages/website/src/lib/crawl/contract.ts` |
| Public content rules | `CONTENT_GUIDE.md` |
| Licensing | `LICENSE_POLICY.md` |

Counts, publication status, and route claims must come from these sources.
Draft copy may not promote a pending item as released.

## Directory map

- `strategy/`: positioning, audiences, editorial rules, and channel roles.
- `research/`: dated, source-backed market and platform research.
- `calendar/`: the active editorial sequence.
- `measurement/`: public-benefit outcomes and privacy boundaries.
- `templates/`: repeatable briefs and review checklists.
- `drafts/blog/`: canonical website article drafts.
- `drafts/linkedin/`: derivatives of reviewed platform material.
- `manifest.json`: lifecycle and license record for every file in this tree.

## Workflow

1. Start with a learner problem, not a channel format.
2. Check whether a strong public resource already solves it. Link instead of
   duplicating.
3. Write the canonical website resource with primary sources, one exercise,
   one verification step, and a clear boundary on what it does not prove.
4. Review dates, claims, licenses, links, accessibility, and disclosure.
5. Publish the website resource through the platform's blog contract.
6. Derive LinkedIn material from the canonical resource. Do not reverse this
   order.
7. Record corrections in the public changelog and update every derivative.
8. Run `bun run marketing:check` before review.

## Channel roles

- Website: canonical explanation and durable URL.
- Personal LinkedIn profile: accountable author voice and discussion.
- loehrning.ai LinkedIn Page: stable institutional record.
- GitHub: corrections, contributions, source, and software.
- External learning platforms: deeper material when they already teach the
  topic better.

Calls to action are limited to public-benefit actions: read, test, verify,
correct, reuse, teach, or contribute.

## Current product language

- Four German core courses form the ordered learning path.
- Six native English courses provide technical depth.
- All ten courses are hosted on loehrning.ai.
- A course completion record is not proof of legal compliance.
- A pending open-source artifact is not a published artifact.
- "Open source" describes the application code and explicitly licensed files,
  not every visible text or brand asset.

## Licensing

Strategy, research, templates, calendar, measurement, this README, and the
manifest are licensed under CC BY 4.0. Authored blog and LinkedIn drafts remain
copyright Tim Löhr, all rights reserved. The exact path-level policy is in
`LICENSE_POLICY.md`.
