"use client";

import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore, type FocusEvent } from "react";
import { DEFINITION_REQUESTS, REQUEST_IDS, TAKEAWAYS_ANCHOR, requestAnchor } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/cases";
import { fill, type DemoText } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-shared";
import { allSolved, initialState, reduce, requestStatus } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/engine";
import type { DefinitionRequestId, RequestId } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/model";
import { DefinitionRequestSection } from "./definition-request";
import { focusBlock, useReducedMotionScroll } from "./focus";
import { StatusGlyph } from "./glyphs";
import { Takeaways } from "./takeaways";
import { TriageSection } from "./triage";

/** "#anfrage-03" → "03", "#anfrage-04-r02" → "04". */
export function requestFromHash(hash: string): RequestId | undefined {
  const match = /^#anfrage-(0[1-5])(?:-[a-z0-9]+)?$/.exec(hash);
  return match ? (match[1] as RequestId) : undefined;
}

const noSubscribe = () => () => undefined;

/** False in the server HTML, true once React owns the page (data-ready for tests). */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

const NEXT: Readonly<Record<DefinitionRequestId, RequestId | "takeaways">> = {
  "01": "02",
  "02": "03",
  "03": "04",
  "05": "takeaways",
};

/**
 * Demo 03 "Mach die Zahl richtig.": a rail of five requests, four definition
 * requests and one triage request, then Zum Mitnehmen. Everything renders on
 * the server; the client adds state, focus, the live line and the hash.
 * Nothing is sticky, nothing collapses, nothing persists across a reload.
 */
export function DataReadinessDemo({ text }: { readonly text: DemoText }) {
  const [state, dispatch] = useReducer(reduce, undefined, () => initialState());
  const [live, setLive] = useState("");
  const flip = useRef(false);
  const scroll = useReducedMotionScroll();
  const hydrated = useHydrated();

  const announce = useCallback((message: string) => {
    // A trailing zero-width space makes a repeated message a new one.
    flip.current = !flip.current;
    setLive(flip.current ? message : `${message}\u200B`);
  }, []);

  useEffect(() => {
    const sync = () => {
      const id = requestFromHash(window.location.hash);
      if (id) dispatch({ type: "select", id });
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const goTo = useCallback(
    (target: RequestId | "takeaways") => {
      const anchor = target === "takeaways" ? TAKEAWAYS_ANCHOR : requestAnchor(target);
      try {
        window.history.replaceState(window.history.state, "", `#${anchor}`);
      } catch {
        // A sandboxed frame may refuse; the jump still works.
      }
      if (target !== "takeaways") dispatch({ type: "select", id: target });
      focusBlock(document.getElementById(`${anchor}-h`), scroll());
    },
    [scroll],
  );

  const onFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    const section = (event.target as HTMLElement).closest<HTMLElement>("[data-request]");
    const id = section?.dataset.request as RequestId | undefined;
    if (id && id !== state.active) dispatch({ type: "select", id });
  };

  const nextLabel = (id: DefinitionRequestId): string => {
    const next = NEXT[id];
    return next === "takeaways" ? text.nextTakeaways : fill(text.next, { n: next });
  };

  return (
    <div
      className="dr3"
      data-demo="datenbereitschaft-fuer-ki"
      data-ready={hydrated ? "" : undefined}
      onFocusCapture={onFocusCapture}
    >
      <nav aria-label={text.railLabel} className="dr3-rail">
        <ol>
          {REQUEST_IDS.map((id) => {
            const status = requestStatus(state, id);
            const statusWord = text.railStates[status];
            return (
              <li key={id}>
                <button
                  type="button"
                  className="dr3-rail-btn"
                  aria-current={state.active === id ? "step" : undefined}
                  aria-label={`${text.requestWord} ${id}, ${text.requestTitles[id]}, ${statusWord}`}
                  data-rail={id}
                  data-status={status}
                  onClick={() => goTo(id)}
                >
                  <span className="dr3-rail-num">{id}</span>
                  <span className="dr3-rail-state">
                    <StatusGlyph status={status} />
                    <span className="dr3-rail-state-word">{statusWord}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {(["01", "02", "03"] as const).map((id) => (
        <DefinitionRequestSection
          key={id}
          request={DEFINITION_REQUESTS[id]}
          state={state.defs[id]}
          text={text}
          dispatch={dispatch}
          announce={announce}
          nextLabel={nextLabel(id)}
          onNext={() => goTo(NEXT[id])}
        />
      ))}
      <TriageSection state={state} text={text} dispatch={dispatch} announce={announce} />
      <DefinitionRequestSection
        request={DEFINITION_REQUESTS["05"]}
        state={state.defs["05"]}
        text={text}
        dispatch={dispatch}
        announce={announce}
        nextLabel={nextLabel("05")}
        onNext={() => goTo("takeaways")}
      />
      <Takeaways text={text} solved={allSolved(state)} announce={announce} />

      <p className="dr3-sr" aria-live="polite" role="status" data-live="">
        {live}
      </p>
    </div>
  );
}
