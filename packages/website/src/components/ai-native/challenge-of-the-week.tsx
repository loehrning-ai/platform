"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  ClipHeading,
  Eyebrow,
  FadeBlock,
  SectionShell,
} from "@/components/ai-native/primitives";
import {
  getChallengeForDate,
  formatWeekIso,
  type Challenge,
} from "@/lib/ai-native/challenges";
import {
  trackEvent,
  recordForDebug,
  type ChallengeRevealProps,
} from "@/lib/ai-native/analytics";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";
import {
  getLearningOwnerContext,
  getOwnedSessionLearningItem,
  setOwnedSessionLearningItem,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";

/**
 * AiNativeChallengeOfTheWeek — landing-page section with a rotating
 * Mittelstand scenario. User drafts a solution → reveals model solution
 * side-by-side → self-grades against a 7-item rubric.
 *
 * All simulated. No Claude API. ISO-week modulo-12 rotation — week 13 wraps
 * back to week 1.
 *
 * Draft persistence uses sessionStorage (not localStorage) — challenge
 * drafts are intentionally ephemeral so the week's user thinking is fresh.
 */

interface ChallengeRubricState {
  readonly solved: readonly boolean[];
}

export function AiNativeChallengeOfTheWeek(): JSX.Element {
  // Hydration-safe: compute on client only.
  const [mounted, setMounted] = useState(false);
  const [weekIso, setWeekIso] = useState<string>("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    const now = new Date();
    setChallenge(getChallengeForDate(now));
    setWeekIso(formatWeekIso(now));
    setMounted(true);
  }, []);

  return (
    <SectionShell num="AI" label="Challenge of the Week">
      <Eyebrow>AI Challenge · {weekIso || "…"}</Eyebrow>
      <ClipHeading
        as="h2"
        className="mt-2.5 font-bold leading-none tracking-[-0.035em]"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}
      >
        Eine Aufgabe. <span className="text-brand-orange">Eine Woche.</span>
      </ClipHeading>
      <FadeBlock delay={1}>
        <p className="mt-4 max-w-[640px] text-[17px] leading-[1.65] text-muted-foreground">
          Jede Woche ein Mittelstand-Szenario. Du schreibst deine Lösung, enthüllst
          dann ein Modell-Vorgehen und benotest dich selbst gegen ein 7-Punkte-Rubrik.
          Keine Registrierung, kein KI-Call, nur dein Denken.
        </p>
      </FadeBlock>

      {mounted && challenge ? (
        <ChallengeRunner challenge={challenge} weekIso={weekIso} />
      ) : (
        <ChallengeSkeleton />
      )}
    </SectionShell>
  );
}

function ChallengeSkeleton(): JSX.Element {
  return (
    <div
      role="status"
      aria-label="Lädt Challenge"
      className="mt-10 h-[320px] w-full animate-pulse border border-border bg-card/40"
    />
  );
}

function ChallengeRunner({
  challenge,
  weekIso,
}: {
  readonly challenge: Challenge;
  readonly weekIso: string;
}): JSX.Element {
  const storageKey = useMemo(
    () => `ai-native-challenge-draft-${challenge.weekOffset}`,
    [challenge.weekOffset],
  );

  const [draft, setDraft] = useState("");
  const [ownerGeneration, setOwnerGeneration] = useState(
    () => getLearningOwnerContext().generation,
  );
  const [revealed, setRevealed] = useState<"none" | "model" | "rubric">("none");
  const [rubric, setRubric] = useState<ChallengeRubricState>({
    solved: new Array(challenge.rubric.length).fill(false),
  });

  // Load draft from sessionStorage on mount.
  useEffect(() => {
    const loadOwnedDraft = () => {
      setOwnerGeneration(getLearningOwnerContext().generation);
      setDraft("");
      setRevealed("none");
      setRubric({
        solved: new Array(challenge.rubric.length).fill(false),
      });
      const raw = getOwnedSessionLearningItem(storageKey);
      if (raw) setDraft(raw);
    };
    loadOwnedDraft();
    return subscribeLearningOwner(loadOwnedDraft);
  }, [challenge.rubric.length, storageKey]);

  // Save draft on blur.
  const onDraftBlur = () => {
    setOwnedSessionLearningItem(
      storageKey,
      draft,
      ownerGeneration,
    );
  };

  const reveal = (kind: "model" | "rubric") => {
    setRevealed(kind);
    const evt: {
      name: "ai_native_challenge_reveal";
      props: ChallengeRevealProps;
    } = {
      name: "ai_native_challenge_reveal",
      props: { weekIso, revealType: kind === "model" ? "model_solution" : "rubric" },
    };
    trackEvent(evt);
    recordForDebug(evt);
  };

  const toggleRubricItem = (idx: number) => {
    setRubric((prev) => ({
      solved: prev.solved.map((v, i) => (i === idx ? !v : v)),
    }));
  };

  const rubricScore = rubric.solved.filter(Boolean).length;

  return (
    <>
      {/* Challenge card */}
      <FadeBlock delay={2}>
        <div className="mt-10 border border-border bg-card/40 p-6 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                Diese Woche · {weekIso}
              </p>
              <h3 className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[22px]">
                {challenge.role}
              </h3>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {challenge.timeBudget}
            </span>
          </div>
          <p className="mt-5 text-[15px] leading-[1.65] text-foreground md:text-[16px]">
            {challenge.scenario}
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {challenge.stack.map((tool) => (
              <span
                key={tool}
                className="border border-border bg-background px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </FadeBlock>

      {/* Composer */}
      <FadeBlock delay={3}>
        <div className="mt-6">
          <label
            htmlFor="challenge-draft"
            className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
          >
            Dein Vorgehen
          </label>
          <textarea
            id="challenge-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={onDraftBlur}
            maxLength={4000}
            rows={8}
            placeholder="Wie gehst du vor? Schreibe 3-6 Bullets."
            className="w-full resize-y border border-border bg-card/40 p-4 font-mono text-[13px] leading-[1.6] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange"
          />
          <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
            {draft.length} / 4000
          </div>
        </div>
      </FadeBlock>

      {/* Reveal actions + revealed content */}
      <FadeBlock delay={4}>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reveal("model")}
            disabled={revealed === "model"}
            className={cn(
              "border-2 border-foreground px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[background-color,border-color,color,opacity,transform,box-shadow]",
              revealed === "model"
                ? "cursor-default bg-muted-foreground opacity-60"
                : "bg-brand-orange shadow-[4px_4px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]",
            )}
          >
            {revealed === "model" ? "◆ Modell-Lösung enthüllt" : "Modell-Lösung enthüllen"}
          </button>
          <button
            type="button"
            onClick={() => reveal("rubric")}
            className={cn(
              "border border-foreground bg-transparent px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors",
              "hover:bg-foreground hover:text-background",
            )}
          >
            7-Punkte-Rubrik öffnen
          </button>
        </div>
      </FadeBlock>

      {/* Model solution reveal */}
      <AnimatePresence initial={false}>
        {revealed === "model" || revealed === "rubric" ? (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="mt-8 grid gap-6 md:grid-cols-2"
          >
            <div className="border-l-[3px] border-brand-orange bg-[var(--color-kupfer-mist)] px-5 py-5">
              <Eyebrow>Modell-Vorgehen</Eyebrow>
              <p className="mt-3 whitespace-pre-line text-[14px] leading-[1.65] text-foreground">
                {challenge.modelSolution}
              </p>
            </div>

            <div className="border border-border bg-card/40 p-5">
              <div className="mb-3 flex items-baseline justify-between">
                <Eyebrow>Selbst-Bewertung · {rubricScore}/7</Eyebrow>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {rubricScore >= 5 ? "PASS" : "REVIEW"}
                </span>
              </div>
              <ul className="space-y-2.5">
                {challenge.rubric.map((item, idx) => (
                  <li key={idx}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border border-border bg-background px-3 py-2.5 text-[13px] transition-colors",
                        "hover:border-foreground",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={rubric.solved[idx]}
                        onChange={() => toggleRubricItem(idx)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-orange"
                        aria-label={`Kriterium ${idx + 1}`}
                      />
                      <span
                        className={cn(
                          "leading-[1.5]",
                          rubric.solved[idx]
                            ? "text-foreground line-through decoration-brand-orange"
                            : "text-foreground",
                        )}
                      >
                        <span className="mr-2 font-mono text-[10.5px] font-bold text-brand-orange">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {item}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-dashed border-border pt-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                5/7 = PASS · 7/7 = Kandidat für Capstone-Beispielsammlung
              </p>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
