"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { bindCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/copy-bind";
import { FACT_IDS } from "@/lib/demo-cases/esg-berichte-mit-ki/constants";
import {
  changed as changedRows,
  checklistMarks,
  scorePrediction,
  sheet,
  valueChanged as valueChangedRows,
} from "@/lib/demo-cases/esg-berichte-mit-ki/core";
import type { EsgPack } from "@/lib/demo-cases/esg-berichte-mit-ki/pack";
import type { FactId } from "@/lib/demo-cases/esg-berichte-mit-ki/types";
import { getMotionAwareScrollBehavior } from "@/lib/animation-policy";
import { AnswerSheet } from "./answer-sheet";
import { AskedIn, FridayAfter } from "./card-extras";
import { EsgProvider, useEsg } from "./esg-context";
import { FactCard } from "./fact-card";
import { GradeGlyph, StatusGlyph } from "./glyphs";
import { hashTarget } from "./hash";
import { MondayPanel } from "./monday-panel";
import {
  allStamped,
  createReducer,
  grades,
  hintIndex,
  initialState,
  mondayPhase,
  nextOpen,
  storyDay,
  yourStamps,
} from "./state";
import { Takeaways } from "./takeaways";

const isFactId = (value: string): value is FactId => (FACT_IDS as readonly string[]).includes(value);

/**
 * The client root. `pack` is the page's locale pack, built on the server
 * (index.tsx): one locale's words and data, nothing else.
 */
export function EsgDemo({ pack }: { readonly pack: EsgPack }) {
  return (
    <EsgProvider pack={pack}>
      <EsgLoop />
    </EsgProvider>
  );
}

/**
 * "Zehn Fakten, 14 Antworten": the client root. One loop runs ten times
 * (read the lines, commit a status, name the evidence, see the answers it
 * feeds), then once more on the following Monday. State lives in memory only.
 */
function EsgLoop() {
  const { pack, logic, rowById } = useEsg();
  const { locale } = pack;
  const { factById } = logic;
  const copy = useMemo(() => bindCopy(pack.strings), [pack.strings]);
  const reducer = useMemo(() => createReducer(logic), [logic]);
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const { keyFriday, keyMonday, changedIds, valueChangedIds } = useMemo(() => {
    const friday = logic.keyStamps(pack.world.facts, "friday");
    const monday = logic.keyStamps(pack.world.facts, "monday");
    return {
      keyFriday: friday,
      keyMonday: monday,
      changedIds: changedRows(pack.rows, friday, monday),
      valueChangedIds: valueChangedRows(pack.rows, friday, monday),
    };
  }, [logic, pack]);
  const [focusKey, setFocusKey] = useState(0);
  const [cardNote, setCardNote] = useState("");
  const [sheetNote, setSheetNote] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Marks the tree as interactive once hydrated (tests wait for it).
  useEffect(() => {
    rootRef.current?.setAttribute("data-ready", "");
  }, []);

  const phase = mondayPhase(state);
  const day = storyDay(state);
  const revealed = phase === "reveal";
  const complete = allStamped(state);

  const fridayRows = useMemo(() => sheet(pack.rows, keyFriday, yourStamps(state, "friday")), [pack.rows, keyFriday, state]);
  const mondayRows = useMemo(() => sheet(pack.rows, keyMonday, yourStamps(state, "monday")), [pack.rows, keyMonday, state]);
  const marks = useMemo(
    () => checklistMarks(grades(state), revealed ? scorePrediction(state.picked, changedIds) : undefined),
    [state, revealed, changedIds],
  );

  const open = useCallback((id: FactId) => {
    dispatch({ type: "open", id });
    setFocusKey((key) => key + 1);
  }, []);

  // Deep links: #bussgeld ... #strom open that card; #montag scrolls to Monday.
  // A malformed hash is no deep link (hashTarget never throws).
  useEffect(() => {
    const follow = () => {
      const hash = hashTarget(window.location.hash);
      if (hash === null) return;
      if (isFactId(hash)) open(hash);
      else if (hash === "montag") document.getElementById("montag")?.scrollIntoView?.({ block: "start", behavior: getMotionAwareScrollBehavior() });
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, [open]);

  const fact = factById(state.active);
  const card = state.cards[state.active];
  const hint = hintIndex(state, state.active);
  const next = nextOpen(state, state.active);

  const onChecked = () => {
    const draft = card.draft;
    if (!draft.status) return;
    const filledNow = fact.feeds.filter((id) => {
      const row = rowById(id);
      return row.deps.every((dep) => dep === fact.id || state.cards[dep].submitted !== undefined);
    });
    setSheetNote(filledNow.length > 0 ? copy.sheet.announceRows(filledNow.join(", ")) : "");
    setCardNote("");
  };

  useEffect(() => {
    const grade = card.verdict?.grade;
    if (grade) setCardNote(copy.feedback.announce(fact.n, copy.feedback.grades[grade]));
  }, [card.verdict, copy, fact.n]);

  const restart = () => {
    dispatch({ type: "reset" });
    setCardNote("");
    setSheetNote("");
    setFocusKey((key) => key + 1);
  };

  return (
    <div ref={rootRef} className="eb" data-day={day} lang={locale}>
      <div className="eb-intro">
        <p className="eb-spoiler">{copy.spoiler}</p>
        <p className="eb-date" data-day={day} data-testid="eb-date">
          {copy.date[day]}
        </p>
      </div>

      <div className="eb-grid">
        <div className="eb-col-card">
          <nav className="eb-index" aria-labelledby="eb-index-h">
            <p id="eb-index-h" className="eb-kicker">
              {copy.index.heading}
            </p>
            <ol className="eb-index-list">
              {pack.world.facts.map((item) => {
                const itemCard = state.cards[item.id];
                const grade = itemCard.verdict?.grade;
                const stamp = itemCard.submitted?.status;
                const stateText = grade ? copy.index.stamped(copy.feedback.grades[grade]) : copy.index.open;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="eb-index-btn"
                      aria-current={state.active === item.id ? "step" : undefined}
                      data-stamped={grade ? "" : undefined}
                      onClick={() => open(item.id)}
                      aria-label={copy.index.button(item.n, item.short[locale], stateText)}
                    >
                      <span className="eb-index-n">{String(item.n).padStart(2, "0")}</span>
                      <span className="eb-index-marks">
                        {stamp ? <StatusGlyph status={stamp} /> : <span className="eb-index-empty" />}
                        {grade ? <GradeGlyph grade={grade} /> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <FactCard
            key={state.active}
            fact={fact}
            slot={state.active}
            card={card}
            dispatch={dispatch}
            copy={copy}
            locale={locale}
            heading={copy.card.heading(fact.n, fact.title[locale])}
            headingLevel={2}
            askedIn={<AskedIn fact={fact} copy={copy} locale={locale} />}
            hint={hint === null ? null : copy.card.hints[hint]}
            focusKey={focusKey}
            onChecked={onChecked}
            after={
              <FridayAfter
                fact={fact}
                yours={yourStamps(state, "friday")}
                copy={copy}
                locale={locale}
                nextLabel={next ? copy.feedback.next(factById(next).n) : copy.feedback.nextMonday}
                onNext={() => {
                  if (next) {
                    open(next);
                    return;
                  }
                  const target = document.getElementById("montag");
                  target?.scrollIntoView?.({ block: "start", behavior: getMotionAwareScrollBehavior() });
                  target?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
                }}
              />
            }
          />
          <p className="sr-only" aria-live="polite">
            {cardNote}
          </p>
        </div>

        <AnswerSheet
          rows={revealed ? mondayRows : fridayRows}
          before={revealed ? fridayRows : undefined}
          day={revealed ? "monday" : "friday"}
          complete={complete}
          copy={copy}
          locale={locale}
          announce={sheetNote}
        />

        <div className="eb-col-monday">
          <MondayPanel
            state={state}
            dispatch={dispatch}
            copy={copy}
            locale={locale}
            friday={fridayRows}
            monday={mondayRows}
            changed={changedIds}
            valueChanged={valueChangedIds}
            onAnnounce={setCardNote}
          />
        </div>
      </div>

      <Takeaways copy={copy} marks={marks} onRestart={restart} />
    </div>
  );
}
