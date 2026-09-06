# Skills Mirror

The skills collection teaches an agent how to work with this platform. It lives in
one place and is copied to two others; this note says where, and how the copy is
kept honest.

## The three copies

| Copy | Location | How it is produced |
| --- | --- | --- |
| Source | `packages/website/content/skills/<name>/SKILL.md` | Authored and reviewed in this repository. |
| Served | `https://loehrning.ai/skills/<name>/SKILL.md` | Built from the source by `src/app/skills/[name]/SKILL.md/route.ts`. |
| Mirror | `github.com/loehrning-ai/skills` | Pushed by hand, see below. |

The route is a static route handler: `generateStaticParams` reads the content
directory at build time and `dynamicParams = false` makes any other name a hard
404. The response body is the content file byte for byte, with no rendering step,
so the served copy cannot diverge from the source through a formatting change.

## Why the mirror push is manual

Agent tooling installs a collection from a Git repository, so the collection has
to exist as one. Making CI push to a second public repository would mean giving
the build a write credential for an organisation repository, and a skill is
exactly the kind of artefact where an unreviewed automated write is worst: it is
instructions that other people's agents will follow.

The push is therefore a deliberate act by the maintainer, after review, with the
check below as the gate. The mirror is a copy, never an editing surface: a change
made in the mirror repository is lost at the next push.

## Contract for a skill directory

- Exactly one file per skill: `SKILL.md`. No script, no hook, no second file.
  An agent runtime must find nothing in the collection it could execute.
- Frontmatter carries `name` (identical to the directory name) and a non-empty
  `description`.
- The document names no key and no token, and never pipes a download into a
  shell. Commands are shown to the person, who runs them.
- At most 64 KB per document, so a skill fits comfortably in an agent's context.

`scripts/skills-mirror-check.mjs` enforces all of it and is the same script that
compares the copies.

## Running the check

From `packages/website`:

- `node scripts/skills-mirror-check.mjs` validates the content directory alone.
  This needs no server and no clone, and is what CI can prove.
- `node scripts/skills-mirror-check.mjs --base-url http://localhost:3000` also
  fetches every served copy and compares it byte for byte, and asserts the
  response carries `text/markdown`.
- `node scripts/skills-mirror-check.mjs --mirror <dir>` also reads a local clone
  of the mirror repository and compares it byte for byte. `<dir>` is the
  directory that holds the skill directories, which for a clone of
  `loehrning-ai/skills` is the repository root.

A difference is reported with the SHA-256 of both sides, so it is obvious which
copy moved.

## Pushing the mirror

1. Land the skill change in this repository and let the content gates pass.
2. Clone or update a working copy of `github.com/loehrning-ai/skills` outside this
   repository.
3. Replace the skill directories in that working copy with the current contents of
   `packages/website/content/skills`. The mirror holds the skill directories at
   its root, plus its own `README.md` and `LICENSE`, and nothing else.
4. Run `node scripts/skills-mirror-check.mjs --mirror <path-to-clone>` from
   `packages/website`. It must pass before anything is committed.
5. Commit in the mirror with a message naming the source commit of this
   repository, then push.
6. Verify the installable path once from a scratch directory with
   `npx skills add loehrning-ai/skills`, and confirm the three skills appear.

## After a deployment

Run `node scripts/skills-mirror-check.mjs --base-url https://loehrning.ai` once
after a release that touched the collection. It proves the served copies and the
authored files are the same bytes, which is the property agents depend on and the
one a stale build silently breaks.
