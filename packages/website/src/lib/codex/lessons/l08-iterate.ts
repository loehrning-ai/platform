// Ported from codex/lessons/08-iterate.html + codex/js/lessons/L08.js.
import type { CodexLesson } from "../types";
import { buildSections } from "../blocks";
import { CODEX_QUIZ_COPY, CODEX_QUIZ_TITLE, CODEX_COMPARE_KIND_LABEL } from "../widget-copy";

const lesson: CodexLesson = {
  id: "L08",
  number: 8,
  title: "Iteration Loops",
  subtitle: "When to nudge, when to re-spec, when to throw it away and restart. A decision tree for every stuck run.",
  durationMinutes: 9,
  trackId: "in-the-loop",
  hook: "Two retries, then rewrite.",
  keyConcepts: ["Nudge vs re-spec", "Context rot", "Compaction", "Decision tree"],
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
            "The PR isn't right. Maybe the tests fail. Maybe they pass but the code is strange. Maybe it solved the wrong problem. What now? Most people instinctively do what they'd do with a human, leave review comments, expect them addressed. That works, sometimes. But the agent isn't a human, and the optimal move depends on what kind of wrong the PR is.\n\nHere's the decision tree we've seen work, distilled from a lot of watching people iterate with Codex:",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "the PR is 90% right",
              title: "Nudge",
              body: "One or two specific changes: a misnamed function, a missing edge case, a test you want strengthened. Leave targeted review comments. Ask Codex to address them. Expect a clean follow-up commit.",
            },
            {
              eyebrow: "the PR is ~70% right",
              title: "Re-spec",
              body: "The agent understood the shape but missed the point. Comments won't fix a framing problem. Close the PR, rewrite the task with what you learned, run again. Takes 10 minutes; saves you 3 rounds of comment ping-pong.",
            },
            {
              eyebrow: "the PR is <50% right",
              title: "Throw it out",
              body: "The agent is solving a different problem. Don't salvage. Close it, go read your own spec, something's ambiguous. Often the fix is to break it into two tasks, or to write the tests first.",
            },
            {
              eyebrow: "the PR is broken AND tangled",
              title: "Split & redo",
              body: "The task was too big (lesson 05). Close the PR. Split into 2-3 smaller tasks. Sequence them. You'll land all three before you would've gotten one clean review on the monster.",
            },
          ],
        },
        {
          kind: "pull-quote",
          text: "Two revisions, then rewrite. That's the rule that saves the most time.",
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
            "Nudges work, when they're specific. Here are two comments on the same issue. Guess which one Codex lands the fix for on the first try.",
        },
        {
          kind: "prose",
          markdown:
            "A good nudge has three things: **what's wrong**, **where it is**, and **what right looks like**. Missing any of the three, and Codex has to guess, which is exactly the thing we're trying to avoid by having a clear spec in the first place.",
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
      title: "The rewrite gambit",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "The move that most teams don't use enough: closing a PR and starting over. It feels wasteful. It isn't.\n\nA re-specced task takes 10 minutes to write, 5 minutes to run, and arrives as a clean PR that matches what you wanted. A comment-driven iteration on a ~70% PR takes 3 rounds of comments, 45 minutes of agent thrash, and arrives as a *patchwork* PR that works but whose history is a review nightmare.\n\nIf you're on round two of comments and the PR still feels off, close it. Take what you learned from seeing the agent's attempt, which requirement it missed, which assumption it had wrong, and fold it into a new task. That's not failure. That's signal.",
        },
        {
          kind: "callout",
          title: "The meta-lesson:",
          body: "a failed Codex run is cheap information. It tells you where your spec was ambiguous. That's worth more than the PR itself. Good teams treat the first run as a probe as much as a production attempt.",
        },
      ],
    },
    {
      id: "s5",
      title: "Context rot",
      readTimeMinutes: 2,
      blocks: [
        {
          kind: "prose",
          markdown:
            "When you work interactively with an AI assistant across a long session, multiple revisions, exploratory tangents, several back-and-forth corrections, the session context fills up. As it does, something subtle and destructive happens: the model's effective attention on your early instructions degrades. It still has them; it's just not weighting them as heavily against all the conversational noise that's accumulated on top.\n\nThe symptom is a session that used to produce clean patches and now produces strange ones. The agent reverts fixes you made three exchanges ago. It suggests approaches you already rejected. It seems to have forgotten a convention you spelled out clearly in message two. This is context rot: not a model failure, but a context management failure.\n\n**The fix is not to repeat yourself more emphatically.** The fix is to rotate context, start a new session with a crisp, distilled spec that encodes what you've learned so far.",
        },
        {
          kind: "card-grid",
          cards: [
            {
              eyebrow: "signal 01",
              title: "Reverts fixed behavior",
              body: "You corrected something in exchange 3. In exchange 9 it comes back. The early correction is getting drowned out. Rotate.",
            },
            {
              eyebrow: "signal 02",
              title: "Re-proposes rejected approaches",
              body: '"Let\'s use lru_cache for this." You said no in exchange 4. Now it\'s back. The rejection is buried. Rotate and encode "do not use lru_cache" in the new spec.',
            },
            {
              eyebrow: "signal 03",
              title: "Generic outputs from specific inputs",
              body: "Your task was specific but the output looks generic, like it was written for a different repo. The session context has diluted the specific instructions you gave early on.",
            },
            {
              eyebrow: "signal 04",
              title: "Increasing correction rounds",
              body: "First task took one round of review. Current task is on round four for similar complexity. The session is degrading, not the task. Rotate.",
            },
          ],
        },
        {
          kind: "pull-quote",
          text: "Two failed correction rounds in the same session = rotate context, not revise more.",
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
            "When you rotate context, whether you're re-speccing a task or starting a fresh session, you're not starting from zero. You carry information from the previous session forward. The question is: *what*?\n\nThere's a compression move that experienced practitioners make instinctively: before closing a long session, they write down the discoveries that wouldn't be obvious from reading the codebase or the original spec. These are the things that would send a new session down the same dead ends.",
        },
        {
          kind: "prose",
          markdown:
            "The right items to carry forward are always in the same category: **things that aren't obvious from the code.** The code shows what's there. It doesn't show what you tried and rejected, what turned out to be a hidden constraint, or why a specific approach didn't work even though it looked right.\n\nA concrete discipline: before closing a long session that didn't fully land, write three bullet points, one for each \"thing I now know that I didn't know when I started this task.\" Those three bullets become the first paragraph of the new task spec.",
        },
      ],
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      blocks: [{ kind: "prose", markdown: "One question on recognizing context rot." }],
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
        bad: "\"the test isn't very good, can you make it better?\"",
        good:
          "\"tests/api/test_login.py::test_rate_limit_blocks_at_6 currently mocks is_allowed(), which means it's testing the mock, not the limiter.\n\nRewrite it to call /login six times against the real limiter and assert the 6th returns 429.\n\nKeep the existing assertion style (pytest, no unittest.mock wrappers).\"",
        note: "Three parts: what's wrong (mocks the thing it's testing), where (test_rate_limit_blocks_at_6), what right looks like (call it six times, assert 429). Specific enough that the agent can't pick the wrong interpretation.",
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
          "You've left two rounds of review comments on a Codex PR. The third review still has issues. What's the right move?",
        options: [
          "Leave a third round of comments. Eventually it'll converge.",
          "Close the PR. Re-spec the task with what you've learned from the failed attempts. Rerun.",
          "Give up on Codex.",
          "Merge it and file follow-up tickets.",
        ],
        correct: 1,
        explanation:
          "Two rounds is the empirical limit where comment-driven iteration is still faster than a rewrite. If the PR still isn't right after two, something about the spec is off, not the agent's effort. Close, re-spec, rerun. Faster and produces a cleaner artifact.",
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
        bad:
          "CONTEXT FROM LAST SESSION:\n- We were working on the rate limiter\n- There was a conversation about caching\n- I asked about Redis vs. in-memory\n- You said something about TTLs\n- We discussed the test structure for a while\n- The second approach seemed better\n- Something about the limiter key format",
        good:
          "CONTEXT FROM LAST SESSION (3 bullets):\n1. Constraint discovered: the limiter key must be (ip, user_id) not just ip, shared IPs (offices, proxies) would block unrelated users otherwise.\n2. Rejected approach: lru_cache is process-local; on multi-worker deployments counts don't accumulate. Use Redis.\n3. Hidden coupling: rate_limit_middleware runs before auth, so user_id is unavailable there, limiter logic must live in the view layer.",
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
          "You notice the AI assistant is suggesting an approach you explicitly rejected two exchanges ago. What does this signal, and what should you do?",
        options: [
          "The model disagrees with you. Argue your position more forcefully.",
          'This is a context rot signal. Close the session. Start a new one with a spec that includes "do not use [rejected approach] because [reason]."',
          "Repeat the rejection in the same session, it'll eventually stick.",
          "Accept the suggestion. The model may have found a better reason for it.",
        ],
        correct: 1,
        explanation:
          "Re-proposing rejected approaches is the clearest signal that early context is being drowned out. The fix is rotation, not repetition. Carry the rejection forward explicitly in the new spec with the reason, that encodes the constraint so it holds regardless of where it appears in the context window.",
      },
    },
  ],
};

export default lesson;
