"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ArrowGlyph, Pictogram } from "@/components/werk";
import { getMotionAwareScrollBehavior } from "@/lib/animation-policy";
import {
  fixLine,
  fmt,
  routeDiff,
  sceneIn,
  stateLight,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/core";
import { MS, commitFrames } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/motion";
import type { W05Text } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/pack";
import type {
  CardInput,
  DialState,
  FridayNumber,
  Light,
  RouteKey,
  SceneId,
  Vote,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { fridayResultId, Friday } from "./friday";
import { LedgerTable, SlotRow } from "./ledger";
import { SceneCard, sceneHeadingId, verdictHeadingId } from "./scene-card";
import {
  createDemoReducer,
  initialDemoState,
  isSceneId,
  nextSceneId,
  resultsOf,
} from "./store";
import { Takeaways } from "./takeaways";
import { useSeek } from "./use-seek";

interface Props {
  /** The page's words in its one language, built on the server. */
  readonly text: W05Text;
  readonly workshopHref: string;
  readonly kitHref: string;
}

/** Section anchors whose heading takes focus after an in-page jump. */
const SECTION_HEADINGS: Readonly<Record<string, string>> = {
  einfuegungen: "einfuegungen-heading",
  freitag: "freitag-heading",
  mitnehmen: "mitnehmen-heading",
};

interface FocusRequest {
  readonly id: string;
  /** Bring the element's region to the top first (scene changes). */
  readonly scrollTo?: string;
}

/**
 * The client island: "Acht Einfügungen", "Zurück zu Freitag" and "Zum
 * Mitnehmen" share one store. The initial state renders on the server (Ana
 * ready to decide, Freitag and the templates complete), so nothing waits for
 * hydration and nothing shifts.
 */
export function PasteLightDemo({ text, workshopHref, kitHref }: Props) {
  const copy = text.ui;
  const scenes = text.scenes;
  const reducer = useMemo(() => createDemoReducer(scenes), [scenes]);
  const [state, dispatch] = useReducer(reducer, scenes, initialDemoState);
  const [fields, setFields] = useState<CardInput>({ tool: "", owner: "" });
  const [dialChanged, setDialChanged] = useState<readonly RouteKey[]>([]);
  const [lastMoment, setLastMoment] = useState<"reveal" | "dial">("reveal");
  const [lastVote, setLastVote] = useState<FridayNumber | null>(null);
  const [message, setMessage] = useState("");
  const focusRequest = useRef<FocusRequest | null>(null);
  const commitSeek = useSeek(MS.commit);
  const dialSeek = useSeek(MS.dial);
  const stampSeek = useSeek(MS.stamp);
  const finishCommit = commitSeek.finish;
  const finishDial = dialSeek.finish;

  // Focus after the render that showed the target.
  useEffect(() => {
    const request = focusRequest.current;
    if (!request) return;
    focusRequest.current = null;
    const target = document.getElementById(request.id);
    if (!target) return;
    if (request.scrollTo) {
      document
        .getElementById(request.scrollTo)
        ?.scrollIntoView({ block: "start", behavior: getMotionAwareScrollBehavior() });
      target.focus({ preventScroll: true });
    } else {
      target.focus();
    }
  });

  const current = state.current;
  const currentRef = useRef<SceneId>(current);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const select = useCallback(
    (id: SceneId) => {
      if (currentRef.current === id) {
        // Same scene: no render follows, so bring it into view right away.
        document
          .getElementById(id)
          ?.scrollIntoView({ block: "start", behavior: getMotionAwareScrollBehavior() });
        document.getElementById(sceneHeadingId(id))?.focus({ preventScroll: true });
        return;
      }
      finishCommit();
      finishDial();
      setLastMoment("reveal");
      // The last dial message belongs to the scene we leave.
      setMessage("");
      focusRequest.current = { id: sceneHeadingId(id), scrollTo: id };
      dispatch({ type: "select", id });
    },
    [finishCommit, finishDial],
  );

  // In-page jumps ("Zu Freitag", "Zu den Vorlagen", and any page link to
  // these anchors) move focus to the section heading too, so a screen reader
  // announces where it landed.
  useEffect(() => {
    const root = document;
    const onClick = (event: Event) => {
      const link = event.target instanceof Element ? event.target.closest("a[href^='#']") : null;
      const headingId = link ? SECTION_HEADINGS[link.getAttribute("href")?.slice(1) ?? ""] : undefined;
      if (!headingId) return;
      // After the browser's own fragment jump, which would reset focus to body.
      window.clearTimeout(pending);
      pending = window.setTimeout(() => {
        document.getElementById(headingId)?.focus({ preventScroll: true });
      }, 0);
    };
    let pending = 0;
    root.addEventListener("click", onClick);
    return () => {
      window.clearTimeout(pending);
      root.removeEventListener("click", onClick);
    };
  }, []);

  // Deep links by name (#marko), after hydration and on hash changes.
  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.slice(1);
      if (isSceneId(scenes, id)) select(id);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [scenes, select]);

  const scene = sceneIn(text, state.current);
  const run = state.runs[state.current];
  const next = nextSceneId(scenes, state.current);

  const commit = (light: Light) => {
    if (run.picked !== null) return;
    setLastMoment("reveal");
    finishDial();
    commitSeek.play();
    focusRequest.current = { id: verdictHeadingId(scene.id) };
    dispatch({ type: "commit", id: scene.id, light });
  };

  const changeDial = (dial: DialState) => {
    if (dial.account === run.dial.account && dial.content === run.dial.content) return;
    const diff = routeDiff(text.accounts, run.dial.account, dial.account);
    setDialChanged(diff === "unknown" ? [] : diff.changed);
    setLastMoment("dial");
    finishCommit();
    dialSeek.play();
    dispatch({ type: "dial", id: scene.id, dial });
    const { light } = stateLight(scene, dial);
    setMessage(fmt(copy.announceNow, { word: copy.lights[light].word, line: fixLine(text, scene.id, dial) }));
  };

  const vote = (n: FridayNumber, value: Vote) => {
    if (state.votes[n]) return;
    setLastVote(n);
    stampSeek.play();
    focusRequest.current = { id: fridayResultId(n) };
    dispatch({ type: "vote", n, vote: value });
  };

  const restart = () => {
    finishCommit();
    finishDial();
    stampSeek.finish();
    setLastMoment("reveal");
    setLastVote(null);
    setMessage("");
    focusRequest.current = { id: sceneHeadingId("ana"), scrollTo: "einfuegungen" };
    dispatch({ type: "reset" });
  };

  const commitT = commitSeek.t;
  const dropping = lastMoment === "reveal" && run.picked !== null
    ? { id: scene.id, t: commitFrames(commitT).slot }
    : null;

  return (
    <>
      <section
        id="einfuegungen"
        aria-labelledby="einfuegungen-heading"
        className="scroll-mt-24 border-t-2 border-scene-line pt-4"
        data-island=""
      >
        <h2 id="einfuegungen-heading" tabIndex={-1} className="text-fluid-h2 font-bold">
          {copy.scenesHeading}
        </h2>
        {/* Phone and desktop skip it: the card says the same, and the first lamp needs the room. */}
        <p className="mt-2 hidden max-w-[60ch] text-[1rem] leading-snug text-muted-foreground sm:block lg:hidden">
          {copy.scenesIntro}
        </p>

        {/* One DOM order (intro, card, table) for every width. On desktop the
            intro row moves to the top of the right column, so the card starts
            right under the heading and its first decision sits above the fold. */}
        <div className="mt-1 grid gap-x-10 gap-y-3 sm:mt-2 sm:gap-y-4 lg:mt-4 lg:grid-cols-[7fr_5fr] lg:grid-rows-[auto_1fr] lg:items-start">
          {/* The jump to the templates closes the sentence as an inline link,
              not a row of its own: on a 390px phone that row pushed Ana's
              card head under the tab bar. */}
          <div className="max-w-[64ch] lg:col-start-2 lg:row-start-1 lg:-mt-1" data-w05-intro="">
            <p className="flex items-start gap-2 text-[0.9375rem] leading-snug text-muted-foreground">
              <Pictogram name="checklist" className="mt-0.5 size-4 shrink-0" />
              <span>
                {copy.kitLine} {copy.asOfLine}{" "}
                <a
                  href="#mitnehmen"
                  className="anti-link whitespace-nowrap font-semibold text-foreground"
                  data-to-templates=""
                >
                  {copy.templatesLink}
                  <ArrowGlyph direction="right" className="ml-1.5 inline-block size-4 align-[-0.2em]" />
                </a>
              </span>
            </p>
          </div>

          <div className="grid min-w-0 gap-3 sm:gap-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div className="lg:hidden">
              <SlotRow state={state} text={text} dropping={dropping} onSelect={select} />
            </div>
            <SceneCard
              key={scene.id}
              scene={scene}
              run={run}
              text={text}
              commitT={commitT}
              dialT={dialSeek.t}
              dialChanged={dialChanged}
              lastMoment={lastMoment}
              onCommit={commit}
              onDial={changeDial}
              onNext={next ? () => select(next) : null}
            />
          </div>
          <aside
            aria-labelledby="w05-ledger-heading"
            className="max-lg:hidden lg:col-start-2 lg:row-start-2"
            data-ledger-aside=""
          >
            <h3 id="w05-ledger-heading" className="text-[1.25rem] font-bold">
              {copy.tableHeading}
            </h3>
            <div className="mt-3">
              <LedgerTable
                state={state}
                text={text}
                headingId="w05-ledger-heading"
                onSelect={select}
                dropping={dropping}
              />
            </div>
          </aside>
        </div>
        <p role="status" aria-live="polite" className="sr-only" data-live="">
          {message}
        </p>
      </section>

      <Friday
        state={state}
        text={text}
        stamp={lastVote ? { n: lastVote, t: stampSeek.t } : null}
        onVote={vote}
      />

      <Takeaways
        text={text}
        fields={fields}
        onFields={setFields}
        results={resultsOf(state, scenes)}
        workshopHref={workshopHref}
        kitHref={kitHref}
        onRestart={restart}
      />
    </>
  );
}
