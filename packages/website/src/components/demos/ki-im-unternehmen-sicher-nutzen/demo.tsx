"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { getMotionAwareScrollBehavior, useMotionAllowed } from "@/lib/animation-policy";
import type { DemoPack } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";
import { companySpans, skippedNameSpans } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/detect";
import {
  SNAP_AT,
  doneCount as countDone,
  DONE_AT,
  hitU,
  nudge,
  remaining,
  settle,
  snapValue,
  stopsFor,
  sweepP,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/motion";
import { buildNote, buildPrompt, type DateParts } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/prompt";
import {
  buildRedaction,
  cleanText,
  keyTable,
  replay,
  restScan,
  type Span,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/redact";
import type { Hit, Sample, SampleId } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { verdict as judge } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/verdict";
import { AccountVerdict } from "./account-verdict";
import { OwnText } from "./own-text";
import { Stage, fill, type StageView } from "./stage";
import { initialState, reducer } from "./state";
import { Takeaways } from "./takeaways";
import { useSeek } from "./use-seek";
import "./schleuse.css";

/** Today in the visitor's browser, or null while the server renders. */
const subscribeNever = () => () => {};
const today = () => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format();
const noToday = () => null;

function parseToday(value: string | null): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null;
}

/**
 * The first ten seconds. The first paint IS the discovery state (markers on,
 * the counter at n). Once the stage is in view the handle plays out on its own,
 * slowly: the first hit alone (red, black, pill, the counter ticks down), a
 * beat to read it, then the rest, the lock, and back; then it leans twice.
 */
const SWEEP_MS = 6200;
const NUDGE_MS = 1000;
const NUDGE_AFTER_MS = 900;
const SNAP_MS = 220;
const SEND_MS = 1100;
const STACKED = "(max-width: 1023px)";

/**
 * "Was fliegt mit?": the visitor's text is the content. The handle blacks out
 * what the detector finds; everything else (the light, the prompt, the
 * record, the replay) is computed from the text, the account and the taps,
 * in memory, on this device.
 */
interface DemoProps {
  readonly copy: DemoPack;
  /** The workshop's promise and the honest data line, printed under the stage so the handle opens the page. */
  readonly promise?: string;
  readonly note?: string;
}

export default function Demo({ copy, promise, note: dataNote }: DemoProps) {
  const motion = useMotionAllowed();
  const [state, dispatch] = useReducer(reducer, copy.samples[0] as Sample, initialState);
  const [since, setSince] = useState<number | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [phase, setPhase] = useState<"idle" | "sweep" | "done">("idle");
  /** Bumped when new text or a sample lands: the stage above answers (scroll, announce). */
  const [stageEvent, setStageEvent] = useState(0);
  const [announce, setAnnounce] = useState("");
  const handledEvent = useRef(0);
  /** What caused the last stage event: a sample chip says its name, a paste says "your text is in". */
  const eventWho = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const stageRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sweep = useSeek(SWEEP_MS);
  const hint = useSeek(NUDGE_MS);
  const snap = useSeek(SNAP_MS);
  const send = useSeek(SEND_MS);
  const { play: playSweep, finish: finishSweep } = sweep;
  const { play: playHint, finish: finishHint } = hint;
  const { play: playSnap } = snap;
  const { play: playSend } = send;
  const snapFrom = useRef<number | null>(null);
  const previousP = useRef(0);
  const date = parseToday(useSyncExternalStore(subscribeNever, today, noToday));

  /* ----------------------------------------------------------- derived */
  const kept = useMemo(() => new Set(state.kept), [state.kept]);
  const redaction = useMemo(
    () => buildRedaction(state.text, state.manual, kept, copy.labels),
    [state.text, state.manual, kept, copy.labels],
  );
  const slots = useMemo(() => {
    const map = new Map<string, number>();
    for (const hit of redaction.hits) {
      if (hit.kind !== "manual" && !kept.has(hit.id)) map.set(hit.id, map.size);
    }
    return map;
  }, [redaction, kept]);
  const n = slots.size;
  const clean = useMemo(() => cleanText(redaction), [redaction]);
  const rest = useMemo(() => restScan(redaction), [redaction]);
  const key = useMemo(() => keyTable(redaction), [redaction]);
  const keptHits = redaction.hits.filter((hit) => kept.has(hit.id));

  const sweeping = phase === "sweep" && sweep.t < 1;
  /** Where the handle really is: the visitor's p, or the first sweep's. Never the hint's lean. */
  const base = sweeping ? sweepP(sweep.t, n) : state.p;
  const lean = interacted || sweeping ? 0 : nudge(hint.t);
  const shown = Math.min(1, base + lean);
  const steps = !motion;
  const settleNow = settle(shown, n);
  const settleValue = steps ? (settleNow >= 1 ? 1 : 0) : settleNow;
  /* Live and synchronous: remaining at the very p the cards draw, plus kept. The same function that flips the pill. */
  const counter = remaining(shown, n) + keptHits.length;
  const doneCount = countDone(shown, n);
  const stops = useMemo(() => stopsFor(n), [n]);
  const nameSpans = useMemo(() => skippedNameSpans(state.text, redaction.hits), [state.text, redaction.hits]);
  const skipped = nameSpans.length;
  const companies = useMemo(() => companySpans(state.text, redaction.hits).length, [state.text, redaction.hits]);

  /** What would still fly along at the visitor's p: kept hits and those not yet blacked out. */
  const live = useMemo<readonly Hit[]>(
    () =>
      redaction.hits.filter((hit) => {
        if (kept.has(hit.id)) return true;
        const slot = slots.get(hit.id);
        return slot !== undefined && hitU(base, slot, n) < DONE_AT;
      }),
    [redaction, kept, slots, base, n],
  );
  const light = useMemo(
    () => judge({ live, account: state.account, publicText: state.publicText, clean }),
    [live, state.account, state.publicText, clean],
  );
  const prompt = useMemo(
    () => buildPrompt(clean, state.task, { rules: copy.take.rules, fallbackTask: copy.take.fallbackTask }),
    [clean, state.task, copy.take],
  );
  const note = useMemo(
    () => buildNote(redaction, state.account, rest, date, copy.take.note),
    [redaction, state.account, rest, date, copy.take.note],
  );
  const replayed = useMemo(() => replay(state.answer, key), [state.answer, key]);
  /** A reply the chat might write for this text, made of this text's own placeholders plus one it cannot know. */
  const sampleAnswer = useMemo(() => {
    const own = state.sampleId ? copy.samples.find((entry) => entry.id === state.sampleId) : undefined;
    if (own) return own.answer;
    const tokens = key.slice(0, 3).map((entry) => entry.token);
    return tokens.length === 0
      ? copy.take.answerOwnEmpty
      : fill(copy.take.answerOwn, { tokens: tokens.join(", ") });
  }, [state.sampleId, key, copy]);
  const sample = copy.samples.find((entry) => entry.id === state.sampleId) ?? null;

  const view: StageView = {
    text: state.text,
    hits: redaction.hits,
    kept,
    placeholders: redaction.placeholders,
    slots,
    n,
    shown,
    counter,
    steps,
    settle: settleValue,
    /** The rest scan, the unlock button and the limits line wait for the visitor: not for the first sweep. */
    payoff: !sweeping && (interacted || state.p > 0),
    limits: interacted || state.p > 0,
    own: state.sampleId === null,
    closed: settleValue > 0.5,
    rest,
    doneCount,
    stops,
    sent: state.sent,
    sendT: state.sent ? send.t : 0,
    chips: live.map((hit) => ({ id: hit.id, value: hit.value })),
    companies,
    who: sample ? sample.who : null,
    canUndo: state.undo.length > 0,
    skipped,
    nameSpans,
    account: state.account,
    light: light.light,
    lightWord: copy.verdict.words[light.light],
    lightReason: copy.verdict.chip[light.reason],
  };

  /* ------------------------------------------------------------- clocks */
  /*
   * The opening beat starts the moment half of the stage (or, on a phone where
   * the stage is taller than the room above the tab bar, 45% of the viewport)
   * is on screen, at once when it already is.
   */
  useEffect(() => {
    if (!motion || phase !== "idle") return;
    const element = stageRef.current;
    if (!element) return;
    const begin = () => {
      setPhase("sweep");
      playSweep();
    };
    const enough = (visible: number, height: number) => visible >= Math.min(height * 0.5, window.innerHeight * 0.45);
    const rect = element.getBoundingClientRect();
    const seen = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    if (enough(seen, rect.height) || typeof IntersectionObserver === "undefined") {
      begin();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && enough(entry.intersectionRect.height, entry.boundingClientRect.height))) {
          observer.disconnect();
          begin();
        }
      },
      { threshold: [0.1, 0.25, 0.4, 0.5] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [motion, phase, playSweep]);

  useEffect(() => {
    if (phase === "sweep" && sweep.t >= 1) setPhase("done");
  }, [phase, sweep.t]);

  /** After the sweep, the handle leans twice to say "drag me", unless a finger or key got there first. */
  useEffect(() => {
    if (phase !== "done" || interacted || !motion) return;
    const timer = setTimeout(playHint, NUDGE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [phase, interacted, motion, playHint]);

  const touch = useCallback(() => {
    setInteracted(true);
    setPhase("done");
    finishSweep();
    finishHint();
  }, [finishSweep, finishHint]);

  /**
   * New text or another sample: the visitor edits at the bottom of a phone
   * but the redaction happens at the top, so the stage comes into view (smooth,
   * instant under reduced motion), the handle is back at 0 (the reducer did
   * that), the counter already reads the new count (it is derived, never
   * replayed), and a screen reader hears that the stage changed.
   */
  useEffect(() => {
    if (stageEvent === 0 || handledEvent.current === stageEvent) return;
    handledEvent.current = stageEvent;
    touch();
    const message = eventWho.current ? fill(copy.own.switched, { who: eventWho.current, n }) : fill(copy.own.updated, { n });
    // Cleared first so an identical message (same sample, same count) is announced again.
    setAnnounce("");
    const timer = setTimeout(() => setAnnounce(message), 60);
    timers.current.push(timer);
    /*
     * The paste is the payoff, so the stage always comes into view (smooth, or
     * at once under reduced motion). Done after the browser's own "show the
     * caret" adjustment of the field (next frame), which would otherwise cancel
     * a smooth scroll that began in the same task. Where the page is two
     * columns the stage is already beside the field.
     */
    requestAnimationFrame(() => {
      const element = stageRef.current;
      if (!element || !window.matchMedia(STACKED).matches) return;
      const top = element.getBoundingClientRect().top;
      if (top >= 0 && top <= 24) return;
      const behavior = getMotionAwareScrollBehavior();
      window.scrollTo({ top: Math.max(0, window.scrollY + top - 12), behavior });
    });
  }, [stageEvent, n, copy.own.updated, copy.own.switched, touch]);

  useEffect(() => {
    if (!state.sent) return;
    const timer = setTimeout(() => {
      stageRef.current?.querySelector(".w05-chat")?.scrollIntoView({ block: "nearest", behavior: getMotionAwareScrollBehavior() });
    }, 60);
    return () => clearTimeout(timer);
  }, [state.sent]);

  useEffect(() => {
    if (snapFrom.current === null) return;
    dispatch({ type: "p", p: snapValue(snapFrom.current, snap.t) });
    if (snap.t >= 1) snapFrom.current = null;
  }, [snap.t]);

  useEffect(() => {
    if (previousP.current < 1 && state.p >= 1) navigator.vibrate?.(10);
    previousP.current = state.p;
  }, [state.p]);

  /** A short tick each time a pill lands under the visitor's finger (not during the hint's lean). */
  const landed = useRef(doneCount);
  useEffect(() => {
    if (motion && interacted && doneCount > landed.current) navigator.vibrate?.(5);
    landed.current = doneCount;
  }, [doneCount, motion, interacted]);

  /* ----------------------------------------------------------- handlers */
  const markInput = useCallback(() => setSince((current) => current ?? performance.now()), []);
  const release = (p: number) => {
    if (state.sent || p >= 1 || p < SNAP_AT) return;
    if (!motion) {
      dispatch({ type: "p", p: 1 });
      return;
    }
    snapFrom.current = p;
    playSnap();
  };
  /** A release's snap must never outlive what the visitor does next (edit, switch sample, drag again, reset). */
  const cancelSnap = () => {
    snapFrom.current = null;
  };
  const sendNow = () => {
    touch();
    cancelSnap();
    dispatch({ type: "send" });
    playSend();
  };
  const unlock = () => {
    const target = document.getElementById("w05-own");
    target?.scrollIntoView({ behavior: getMotionAwareScrollBehavior(), block: "start" });
    target?.focus({ preventScroll: true });
  };

  const liveMessage = state.sent
    ? fill(copy.send.sentLive, { n: live.length })
    : settleValue >= 1
      ? fill(skipped > 0 ? copy.stage.settledNames : copy.stage.settledLive, { n: rest })
      : announce;

  return (
    <div className="w05" data-w05="">
      <div className="w05-cols">
        <div className="w05-left">
          <Stage
            copy={copy}
            view={view}
            rootRef={stageRef}
            inputRef={inputRef}
            onTouch={touch}
            onChange={(p) => {
              cancelSnap();
              setAnnounce("");
              dispatch({ type: "p", p });
            }}
            onRelease={release}
            onWord={(span: Span) => {
              markInput();
              dispatch({ type: "word", span });
            }}
            onKeep={(id) => dispatch({ type: "keep", id })}
            onUndo={() => dispatch({ type: "undo" })}
            onSend={sendNow}
            onReset={() => {
              cancelSnap();
              dispatch({ type: "reset" });
            }}
            onUnlock={unlock}
            onAccount={(account) => dispatch({ type: "account", account })}
          />
          {promise || dataNote ? (
            <div className="w05-promise">
              {promise ? <p className="w05-promise-line" data-w05-promise="">{promise}</p> : null}
              {dataNote ? <p className="w05-promise-note" data-w05-note="">{dataNote}</p> : null}
            </div>
          ) : null}
        </div>
        <div className="w05-right">
          <OwnText
            copy={copy}
            text={state.text}
            sampleId={state.sampleId}
            since={since}
            onSample={(id: SampleId) => {
              cancelSnap();
              markInput();
              const next = copy.samples.find((entry) => entry.id === id);
              if (next) {
                dispatch({ type: "sample", sample: next });
                eventWho.current = next.who;
                setStageEvent((count) => count + 1);
              }
            }}
            onText={(text, bulk) => {
              cancelSnap();
              markInput();
              dispatch({ type: "text", text });
              if (bulk) eventWho.current = null;
              if (bulk) setStageEvent((count) => count + 1);
            }}
          />
          <AccountVerdict
            copy={copy}
            verdict={light}
            publicText={state.publicText}
            onPublic={(value) => dispatch({ type: "public", value })}
          />
          <Takeaways
            copy={copy}
            prompt={prompt}
            note={note}
            task={state.task}
            answer={state.answer}
            replay={replayed}
            key_={key}
            sampleAnswer={sampleAnswer}
            onTask={(task) => dispatch({ type: "task", task })}
            onAnswer={(answer) => dispatch({ type: "answer", answer })}
          />
        </div>
      </div>
      <p className="w05-sr" role="status" aria-live="polite">{liveMessage}</p>
    </div>
  );
}
