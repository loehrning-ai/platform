// Ported from codex/lessons/08-iterate.html + codex/js/lessons/L08.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import {
  CODEX_QUIZ_COPY,
  CODEX_QUIZ_TITLE,
  CODEX_COMPARE_KIND_LABEL,
} from "../widget-copy";

const lesson: CodexLesson = {
  id: "L08",
  number: 8,
  title: "Iteration Loops",
  subtitle:
    "Choose between a targeted correction, a revised specification, and a clean restart based on the defect and diff shape.",
  durationMinutes: 9,
  trackId: "in-the-loop",
  hook: "Respond to the cause of the mismatch.",
  keyConcepts: [
    "Targeted correction",
    "Re-specification",
    "Context reset",
    "Decision tree",
  ],
  quiz: [],
  sections: buildSections([
    {
      id: "s1",
      title: "Decision tree",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "When a diff is not acceptable, classify the mismatch before continuing. A local defect, a missing requirement, an invalid task boundary, and stale session context require different responses.\n\nUse this decision tree as a diagnostic aid rather than a fixed retry count:",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "bounded local defect",
              title: "Nudge",
              body: "Use a targeted comment when the goal and architecture are correct and the required change is local. State what is wrong, where it is, and the required evidence.",
            },
            {
              eyebrow: "requirement or framing gap",
              title: "Re-spec",
              body: "Rewrite the task when several comments are restating missing goals, constraints, or acceptance criteria. Preserve useful findings, then start from the corrected contract.",
            },
            {
              eyebrow: "wrong problem or architecture",
              title: "Restart from evidence",
              body: "Do not salvage a diff built on a false premise. Reinspect the relevant code and requirement, then create a new task with corrected evidence and boundaries.",
            },
            {
              eyebrow: "multiple coupled concerns",
              title: "Decompose and restart",
              body: "Split independently implementable or reviewable concerns. Define dependency order and valid intermediate states before running the new tasks.",
            },
          ],
        },
        {
          kind: "pull-quote",
          text: "Restart when corrections are changing the task's premise or causing the diff to diverge instead of converge.",
        },
      ],
    },
    {
      id: "s2",
      title: "The nudge, done right",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "A targeted correction is appropriate only when the existing task remains valid. Compare a vague comment with one that identifies the defect, location, and expected evidence.",
        },
        {
          kind: "prose",
          markdown:
            "A useful correction states **what is wrong**, **where it is**, and **what result or check is required**. If that explanation rewrites the original goal or architecture, replace the task instead of accumulating comments.",
        },
      ],
    },
    {
      id: "s3",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "One question on when to re-spec." }],
    },
    {
      id: "s4",
      title: "When to restart",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Restart when the current diff is anchored to a wrong requirement, invalid architecture, or over-broad scope. Continuing from that state can preserve assumptions that every later correction must work around.\n\nBefore discarding the attempt, record evidence that is not obvious from the repository: a rejected approach and its reason, a newly discovered constraint, relevant command output, and the files or call paths already traced. Use that evidence in a new, bounded specification.\n\nDo not use revision count as an automatic rule. A sequence of small, independent corrections may be efficient; one correction that changes the premise may justify an immediate restart.",
        },
        {
          kind: "callout",
          title: "Keep only verified findings:",
          body: "An unsuccessful attempt can expose ambiguity or hidden coupling, but it can also contain incorrect assumptions. Carry forward findings only when they are supported by repository evidence or reproducible commands.",
        },
      ],
    },
    {
      id: "s5",
      title: "Long-session context",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Long interactive sessions accumulate requests, corrections, logs, and rejected approaches. Relevant instructions can become harder to apply consistently, especially when later messages conflict with earlier ones or the active context is compacted.\n\nObservable signs include reintroducing a rejected approach, undoing an accepted correction, or applying a general rule while ignoring a later exception. These signs can also indicate an ambiguous task or code change, so inspect the evidence before attributing them to context length.\n\nWhen the active history is no longer a clear contract, start a new session with a concise specification and only the verified findings needed to continue.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "signal 01",
              title: "Reverts fixed behavior",
              body: "A previously accepted correction is removed without a code-based reason. Confirm the current requirement, then restate it in a clean task if the session has become contradictory.",
            },
            {
              eyebrow: "signal 02",
              title: "Re-proposes rejected approaches",
              body: "A rejected approach returns without addressing the recorded reason. Carry the explicit constraint and its evidence into a new specification.",
            },
            {
              eyebrow: "signal 03",
              title: "Generic outputs from specific inputs",
              body: "The output no longer cites the repository paths, conventions, or commands required by the task. Re-establish those inputs before more edits.",
            },
            {
              eyebrow: "signal 04",
              title: "Increasing correction rounds",
              body: "Corrections expand or contradict one another instead of reducing the mismatch. Check whether the task, diff, or session context needs to be reset.",
            },
          ],
        },
        {
          kind: "pull-quote",
          text: "Reset context when the active conversation no longer expresses one consistent task contract.",
        },
      ],
    },
    {
      id: "s6",
      title: "Compaction: carry forward",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "A new session should not inherit the entire transcript. Carry forward verified facts that are not obvious from the repository or original specification: discovered constraints, rejected approaches with reasons, relevant command results, and unresolved questions.",
        },
        {
          kind: "prose",
          markdown:
            "Separate evidence from narrative. Include file paths, exact error text, commands and outcomes, and the reason an approach was rejected. Exclude speculation, repeated discussion, and facts that the next session can read directly from versioned files.",
        },
      ],
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "One question on recognizing context rot." },
      ],
    },
  ]),
  widgets: [
    {
      kind: "compare",
      placement: "after-intro",
      courseSlug: "codex",
      props: {
        title: "Two review comments, same problem",
        kindLabel: CODEX_COMPARE_KIND_LABEL,
        badLabel: "Vague nudge",
        goodLabel: "Specific nudge",
        bad: '"the test isn\'t very good, can you make it better?"',
        good: '"tests/api/test_login.py::test_rate_limit_blocks_at_6 currently mocks is_allowed(), which means it\'s testing the mock, not the limiter.\n\nRewrite it to call /login six times against the real limiter and assert the 6th returns 429.\n\nKeep the existing assertion style (pytest, no unittest.mock wrappers)."',
        note: "The specific comment names the defect, location, required setup, and assertion. The reviewer can compare the revised test directly with that request.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L08",
        cpId: "q1",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "A revised diff keeps changing the same requirement in different ways and grows beyond the original scope. What is the appropriate next move?",
        options: [
          "Continue adding comments without changing the task contract.",
          "Stop the iteration, retain verified findings, and restart from a corrected specification and scope.",
          "Merge the diff because some tests pass.",
          "Remove the failing checks and request another revision.",
        ],
        correct: 1,
        explanation:
          "Repeated non-converging changes indicate that the task premise, boundary, or context is unstable. A clean specification gives the next attempt one reviewable contract. The decision is based on divergence, not a fixed number of retries.",
      },
    },
    {
      kind: "compare",
      placement: "end",
      courseSlug: "codex",
      props: {
        title: "Compaction: what to carry vs. what to drop",
        kindLabel: CODEX_COMPARE_KIND_LABEL,
        badLabel: "Carrying noise",
        goodLabel: "Carrying signal",
        bad: "CONTEXT FROM LAST SESSION:\n- We were working on the rate limiter\n- There was a conversation about caching\n- I asked about Redis vs. in-memory\n- You said something about TTLs\n- We discussed the test structure for a while\n- The second approach seemed better\n- Something about the limiter key format",
        good: "CONTEXT FROM LAST SESSION (3 bullets):\n1. Constraint discovered: the limiter key must be (ip, user_id) not just ip, shared IPs (offices, proxies) would block unrelated users otherwise.\n2. Rejected approach: lru_cache is process-local; on multi-worker deployments counts don't accumulate. Use Redis.\n3. Hidden coupling: rate_limit_middleware runs before auth, so user_id is unavailable there, limiter logic must live in the view layer.",
        note: "The test: would a fresh session be able to avoid the wrong turns without your bullets? If yes, drop it. If no, keep it. The caching discussion and TTL chatter are in the docs; the three discoveries above aren't.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L08",
        cpId: "q2",
        title: CODEX_QUIZ_TITLE,
        copy: CODEX_QUIZ_COPY,
        question:
          "A session proposes an approach that was rejected earlier without addressing the recorded reason. What should you do?",
        options: [
          "The model disagrees with you. Argue your position more forcefully.",
          'Verify that the rejection still applies, then start a clean task that states "do not use [approach] because [evidence]."',
          "Repeat the rejection without its reason.",
          "Accept the suggestion. The model may have found a better reason for it.",
        ],
        correct: 1,
        explanation:
          "The repeated proposal may indicate inconsistent context or a changed codebase. Recheck the evidence, then encode the still-valid constraint and reason in a new, internally consistent task.",
      },
    },
  ],
};

export default lesson;
