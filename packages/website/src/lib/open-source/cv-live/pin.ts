/**
 * The cv-engine revision every file of the live example was rendered with.
 *
 * It is NOT the revision the registry admitted (`CV_ENGINE_REVISION` in
 * artifacts.ts). The live example needs `lang: de` and the two-column
 * sidebar, which exist only on the public branch of pull request 24. That
 * commit is public and reachable, but not on `main`, so the example says so
 * on the page instead of borrowing the admitted pin's authority. When the
 * pull request merges, rerun `bun scripts/build-cv-engine-live.ts` against
 * the merge commit on `main`, move this pin through the admission path in
 * ARTIFACT_PUBLICATION.md, and set `status` to "admitted".
 */
export const CV_LIVE_ENGINE = {
  repository: "https://github.com/loehrning-ai/cv-engine",
  revision: "5137165ccee559081f547252038d8b86c7c0fb3d",
  status: "pending-upstream-merge",
  pullRequest: 24,
  pullRequestHref: "https://github.com/loehrning-ai/cv-engine/pull/24",
  /** The invented person, tracked in the engine repository at the pin. */
  personaPaths: {
    de: "content/examples/mira-kessler.de.yaml",
    en: "content/examples/mira-kessler.en.yaml",
  },
} as const;

export type CvLiveEngineStatus = "pending-upstream-merge" | "admitted";

export const CV_LIVE_SHORT_REVISION = CV_LIVE_ENGINE.revision.slice(0, 7);

/**
 * The build a visitor runs next to their downloaded cv.yaml: clone, check out
 * the exact revision the example was rendered with, install hash-pinned, build.
 * Every step comes from the cv-engine installation guide in artifacts.ts.
 */
export const CV_LIVE_COMMAND = `git clone ${CV_LIVE_ENGINE.repository}.git && cd cv-engine && git checkout ${CV_LIVE_ENGINE.revision} && python3 -m venv .venv && .venv/bin/python -m pip install --require-hashes -r requirements.lock && .venv/bin/python engine/build.py --config ../cv.yaml --output ../cv.pdf`;
