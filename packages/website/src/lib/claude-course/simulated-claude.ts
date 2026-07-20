// ─── Simulated Claude responses (plan 008 stage 4) ──────────────────
//
// Ported 1:1 (behavior and copy) from `claude/js/claude-demo.js`, the
// source course's own demo-mode shim. Its own file comment confirms this
// course never called a real Claude API: it is a static site with no
// backend, so `window.claude.complete` is replaced with a local, canned
// responder. This module is that same responder, adapted from
// prompt-string-round-tripping (the vanilla-JS version formats a system
// prompt string, then regex-sniffs it to route) to direct, typed function
// calls, one function per widget need, since every caller here is a
// same-process TypeScript component, not a fetch() boundary. Wiring a real
// Anthropic call is an explicit non-goal (plan 008 constraints).
//
// No network call anywhere in this file.

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function clamp01(n: number): number {
  return Math.max(0.06, Math.min(0.94, n));
}

// ─── Generic prompt completion (PromptSandbox, PromptCompare) ──────

/**
 * A plausible, honest completion for a raw prompt, tailored a little so it
 * never feels canned-in-a-bad-way, ported from claude-demo.js's
 * `genericAnswer`.
 */
export function genericAnswer(prompt: string): string {
  const p = prompt.toLowerCase();

  if (/launch email|announc|rollout|release email/.test(p)) {
    const structured =
      /constraints|format|audience|context|role/.test(p) || prompt.length > 240;
    if (structured) {
      return `Subject: AuthKit v2 is live Monday, one action to migrate

We're replacing legacy SSO with AuthKit v2. It ships Monday, opt-in for two weeks, then becomes the default.

Do this now: point your service at the new endpoint and run the migration check.

\`\`\`
authkit migrate --check --service <your-service>
\`\`\`

Nothing else changes for you today. Tokens, scopes, and refresh behavior are identical. The two-week window is there so you can roll back if the check surfaces anything unexpected.

Questions go to the #authkit channel. Full migration notes are in the runbook.`;
    }
    return `Subject: New authentication service

Hi all, we're launching a new authentication service. It should make signing in faster and more secure. Take a look when you get a chance and let us know if you have questions. Thanks!`;
  }

  if (/p99|latency|microservice|observability|which.*service/.test(p)) {
    return `Based on typical patterns, the checkout-service tends to show the highest p99, usually a downstream database call under load.

(Heads up: I don't actually have your telemetry. I'm pattern-matching, not measuring. To get a real answer, paste the p99 numbers or wire me to your metrics, otherwise this is a confident guess, which is exactly the failure mode this lesson is about.)`;
  }

  if (/oncall|on-call|rotation|owns|who (owns|manages)/.test(p)) {
    return `That's typically owned by the platform or identity team, with a weekly on-call rotation.

(But I'm guessing, none of your team's actual rotation data is in this window. Watch how readily I answered anyway. That's the point of the lesson: if it isn't in context, it isn't knowledge.)`;
  }

  return `Here's a useful response to that. I've taken your prompt at face value and given you the most likely-helpful continuation.

If the answer depends on facts about your specific project, team, or data, remember I can only work from what's in this window, so the more concrete context you give, the better and more grounded this gets.`;
}

// ─── Prompt grading (PromptGrader) ──────────────────────────────────

export interface GraderResult {
  readonly score: number;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly oneBetterRewrite: string;
}

/**
 * Deterministic rubric grading, ported from claude-demo.js's `graderJSON`.
 * The grading heuristic only inspects the submitted prompt text itself (the
 * source's `task` variable was only ever interpolated into the LIVE system
 * prompt sent upstream, never read by the grading regexes) so there is no
 * `task` parameter here.
 */
export function gradePrompt(userPrompt: string): GraderResult {
  const lower = userPrompt.toLowerCase();
  const has = (re: RegExp) => re.test(lower);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  let score = 30;

  if (has(/you are|act as|role/)) {
    score += 14;
    strengths.push("Sets a clear role, which anchors tone and vocabulary.");
  } else {
    weaknesses.push("No role, Claude has to guess who it is being.");
  }
  if (has(/context|background|we're|because/)) {
    score += 14;
    strengths.push("Supplies context the model could not otherwise know.");
  } else {
    weaknesses.push("Thin on context; add the background the task depends on.");
  }
  if (has(/format|json|bullet|section|under \d|words|steps/)) {
    score += 16;
    strengths.push("Specifies an output shape, so the result is predictable.");
  } else {
    weaknesses.push("No format constraint, the output shape is left to chance.");
  }
  if (userPrompt.length > 220) {
    score += 14;
    strengths.push("Detailed enough to remove most ambiguity.");
  } else if (userPrompt.length < 80) {
    weaknesses.push("Quite short; more specificity would sharpen the result.");
  }
  if (has(/example|e\.g\.|for instance/)) {
    score += 10;
    strengths.push('Includes an example of what "good" looks like.');
  }

  score = Math.max(8, Math.min(96, score));
  if (strengths.length === 0) strengths.push("Gets the basic intent across.");
  if (weaknesses.length === 0) {
    weaknesses.push('Could add one concrete example to lock in the style.');
  }

  const rewrite = `You are a senior specialist on this task.

CONTEXT
<the background the model needs>

TASK
${(userPrompt.split("\n")[0] || "Do the task").slice(0, 120)}

CONSTRAINTS
- Be specific and concrete.
- State assumptions instead of guessing.

FORMAT
<the exact shape you want back>`;

  return {
    score,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    oneBetterRewrite: rewrite,
  };
}

// ─── Rewrite arena judging (RewriteArena) ───────────────────────────

export type ArenaWinner = "user" | "original" | "tie";

export interface ArenaResult {
  readonly winner: ArenaWinner;
  readonly why: string;
  readonly userScore: number;
  readonly originalScore: number;
}

/** Deterministic rewrite-vs-original judging, ported from `arenaJSON`. */
export function judgeRewrite(original: string, rewrite: string): ArenaResult {
  const r = rewrite.toLowerCase();
  let userScore = 45;
  if (/you are|role|act as/.test(r)) userScore += 14;
  if (/context|background/.test(r)) userScore += 12;
  if (/format|json|bullet|section|under \d|steps/.test(r)) userScore += 14;
  if (rewrite.length > original.length + 60) userScore += 10;
  if (/example|e\.g\./.test(r)) userScore += 8;
  userScore = Math.max(20, Math.min(95, userScore));

  const originalScore = Math.max(8, Math.min(40, 18 + (original.length > 120 ? 10 : 0)));
  const winner: ArenaWinner =
    userScore > originalScore + 4 ? "user" : userScore < originalScore - 4 ? "original" : "tie";
  const why =
    winner === "user"
      ? "Your rewrite adds role, context, and an explicit output shape, so there is far less for the model to guess."
      : winner === "tie"
        ? "Both convey the intent, but neither fully pins down the output format, that is the deciding gap."
        : "The original is more concrete here; your rewrite drops some specifics it needs.";

  return { winner, why, userScore, originalScore };
}

// ─── Fixed coaching feedback (FillBlank, PromptLibraryShaper) ──────

/** Ported from claude-demo.js's `shortFeedback` fill-blank branch (fixed string). */
export function fillBlankFeedback(): string {
  return "Solid start, the structure is there and the intent is clear. To make it bulletproof, tighten the success criteria so there's no room to drift: say exactly what \"done\" looks like and in what format.";
}

/** Ported from claude-demo.js's `shortFeedback` shareability branch (fixed string). */
export function shareabilityFeedback(): string {
  return "The biggest win is parameterization: swap the hardcoded repo, teammate names, and channel references for <PLACEHOLDERS> so anyone on the team can drop in their own specifics. A one-line \"when to use\" at the top makes it instantly reusable.";
}

// ─── Socratic tutor (SocraticTutor) ─────────────────────────────────

const OPENERS = [
  "Good, you're circling the right idea.",
  "That intuition is close.",
  "Let's pressure-test that.",
  "Right instinct.",
] as const;

const QUESTIONS = [
  "So if none of that lives in the context window, where exactly does Claude get the answer from?",
  "What would you have to put in the window to turn that guess into knowledge?",
  "When it answered confidently with nothing grounded, what failure mode was that, and how would you fix it?",
  "If you removed the role and context from your prompt, which part of the output would degrade first, and why?",
] as const;

/**
 * A brief reply plus a probing question back, ported from claude-demo.js's
 * `socraticReply`. `turnCount` is the number of user turns sent so far
 * (including this one).
 */
export function socraticReply(lastUserMessage: string, turnCount: number): string {
  const opener = OPENERS[Math.abs(hash(lastUserMessage)) % OPENERS.length];
  if (turnCount >= 3) {
    return `${opener} You've got it: Claude is a completion engine that works only from what's in the window, steered to be helpful, harmless, and honest. Everything else in this course is a way to put better material in that window. Want to try applying it to a real prompt of yours?`;
  }
  const question =
    QUESTIONS[Math.abs(hash(lastUserMessage + String(turnCount))) % QUESTIONS.length];
  return `${opener} A short answer: think of Claude as continuing the most likely helpful text given everything in front of it, not retrieving, not remembering. ${question}`;
}

// ─── CLAUDE.md builder (ClaudeMdBuilder) ────────────────────────────

export interface ClaudeMdFields {
  readonly project: string;
  readonly stack: string;
  readonly conventions: string;
  readonly avoid: string;
  readonly commands: string;
}

/**
 * Ready-to-paste CLAUDE.md markdown, ported from claude-demo.js's `claudeMd`
 * (there the fields were regex-extracted from a formatted prompt string;
 * here the caller already has the typed form fields, so no extraction step
 * is needed).
 */
export function buildClaudeMd(fields: ClaudeMdFields): string {
  const project = fields.project.trim() || "Your project";
  const stack = fields.stack.trim() || "language, framework, key tools";
  const conventions = fields.conventions.trim() || "house style";
  const avoid = fields.avoid.trim() || "known anti-patterns";
  const commands = fields.commands.trim() || "build / test / lint";
  return `# CLAUDE.md

## Project
${project}

## Stack
${stack}

## Conventions
- ${conventions}
- Keep changes small and focused; one concern per change.
- Write tests alongside code.

## Avoid
- ${avoid}
- No new dependencies without a clear reason.

## Commands
\`\`\`
${commands}
\`\`\`

## Working style
- Be crisp and skimmable. Lead with the answer.
- When something is ambiguous, state your assumption instead of guessing silently.`;
}

// ─── Simulated latency (RunConsole "streaming" feel) ────────────────

/**
 * A short, deterministic-in-tests-friendly delay so the console UI can show
 * a loading state, mirroring the source's `wait()` helper. Callers pass a
 * seed (usually the prompt text) so the delay is stable per input rather
 * than genuinely random; tests can stub `Math.random`-free by keeping
 * delays short (under 40ms).
 */
export function simulatedDelayMs(seed: string): number {
  return 12 + (Math.abs(hash(seed)) % 20);
}

export { clamp01 };
