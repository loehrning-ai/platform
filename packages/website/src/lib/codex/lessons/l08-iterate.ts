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
  title: "Iteration loops",
  subtitle:
    "Correct, re-specify or restart, depending on the mismatch.",
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
            "Before you reply to a wrong diff, classify the mismatch.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "bounded local defect",
              title: "Nudge",
              body: "Goal and architecture hold and the fix is local. Name defect, location and required evidence.",
            },
            {
              eyebrow: "requirement or framing gap",
              title: "Re-spec",
              body: "Comments keep adding goals, constraints or criteria. Rewrite the task and keep verified findings.",
            },
            {
              eyebrow: "wrong problem or architecture",
              title: "Restart from evidence",
              body: "The premise is false. Reread code and requirement, then start a new task with corrected evidence.",
            },
            {
              eyebrow: "multiple coupled concerns",
              title: "Decompose and restart",
              body: "Split separable concerns. Set the dependency order and valid intermediate states before the new tasks run.",
            },
          ],
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
            "A targeted correction works while the task itself is still valid. Like the specific comment above, it names **what is wrong**, **where** and **which result or check is required**. If it would rewrite goal or architecture, replace the task.",
        },
      ],
    },
    {
      id: "s3",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "Question at the end of the lesson." }],
    },
    {
      id: "s4",
      title: "When to restart",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "Restart when the diff rests on a wrong requirement, invalid architecture or over-broad scope, or when corrections change the premise and the diff diverges. The revision count does not decide: many small corrections can be fine, and one premise change can justify an immediate restart.\n\nBefore you discard the attempt, record what the repository does not show: rejected approaches with reasons, new constraints, relevant command output, files and call paths already traced.",
        },
        {
          kind: "callout",
          title: "Keep only verified findings.",
          body: "Failed attempts also contain wrong assumptions. Carry forward only what repository evidence or reproducible commands support.",
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
            "Long sessions pile up requests, corrections, logs and rejected approaches. Instructions then get harder to apply consistently, especially after contradictions or compaction.\n\nThe signals below can also mean an ambiguous task or changed code, so check the evidence first. If the history no longer forms one clear contract, start a new session with a short specification and the verified findings.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "signal 01",
              title: "Reverts fixed behavior",
              body: "An accepted correction disappears without a code reason. Confirm the requirement, then restate it in a clean task.",
            },
            {
              eyebrow: "signal 02",
              title: "Re-proposes rejected approaches",
              body: "A rejected approach returns and ignores the recorded reason. Put constraint and evidence into a new specification.",
            },
            {
              eyebrow: "signal 03",
              title: "Generic outputs from specific inputs",
              body: "The output stops citing the required repository paths, conventions or commands. Restore those inputs first.",
            },
            {
              eyebrow: "signal 04",
              title: "Increasing correction rounds",
              body: "Corrections grow or contradict each other while the mismatch stays. Reset task, diff or session.",
            },
          ],
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
            "Carry into a new session only verified facts that neither repository nor specification holds: file paths, exact errors, commands with outcomes, constraints, rejected approaches with reasons, open questions. Drop speculation and repeated discussion.",
        },
      ],
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [
        { kind: "prose", markdown: "Questions at the end of the lesson." },
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
        note: "It names defect, location, setup and assertion, so you can check the revised test against it.",
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
          "A revised diff keeps reworking the same requirement and grows beyond the original scope. What next?",
        options: [
          "Continue adding comments without changing the task contract.",
          "Stop, keep verified findings, restart from a corrected specification.",
          "Merge the diff because some tests pass.",
          "Remove the failing checks and request another revision.",
        ],
        correct: 1,
        explanation:
          "Non-converging changes point to an unstable premise, boundary or context. Restart from one clean specification, whatever the retry count.",
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
        bad: "CONTEXT FROM LAST SESSION:\n- We were working on the rate limiter\n- There was a conversation about caching\n- You said something about TTLs\n- The second approach seemed better",
        good: "CONTEXT FROM LAST SESSION (3 bullets):\n1. Constraint: the limiter key must be (ip, user_id). Keying on ip alone blocks unrelated users behind shared IPs (offices, proxies).\n2. Rejected: lru_cache is process-local, so counts don't add up across workers. Use Redis.\n3. Hidden coupling: rate_limit_middleware runs before auth, so user_id is unavailable there. Limiter logic belongs in the view layer.",
        note: "Keep a bullet only if a fresh session would repeat a wrong turn without it. Caching and TTL basics are in the docs; these three discoveries are not.",
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
          "A session re-proposes a rejected approach and ignores the recorded reason. What do you do?",
        options: [
          "Argue your position more forcefully.",
          "Recheck the rejection, then restate it with evidence in a clean task.",
          "Repeat the rejection without its reason.",
          "Accept it; the model may have found a better reason.",
        ],
        correct: 1,
        explanation:
          "The repeat can mean inconsistent context or changed code. If the constraint still holds, write \"do not use [approach] because [evidence]\" into a new task.",
      },
    },
  ],
};

export default lesson;
