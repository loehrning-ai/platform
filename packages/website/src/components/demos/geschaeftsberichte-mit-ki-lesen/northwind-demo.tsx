"use client";

import { useReducer, type ReactNode } from "react";
import { cx, SectionHead } from "@/components/werk";
import type { Locale } from "@/lib/i18n/locale";
import {
  SECTION_IDS,
  type NorthwindCopy,
  type SectionId,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy-types";
import { INITIAL_STATE, isPristine, reducer } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import { bridgeText, sheetText } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/texts";
import styles from "./northwind.module.css";
import { StationCheck } from "./station-check";
import { StationCompare } from "./station-compare";
import { StationDecide } from "./station-decide";
import { StationDefects } from "./station-defects";
import { StationReport } from "./station-report";
import { Takeaways } from "./takeaways";

function Station({ id, title, children }: { id: SectionId; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24" data-station={id}>
      <SectionHead id={`${id}-heading`} title={title} />
      {children}
    </section>
  );
}

/**
 * "Die Zahl, die trägt": one column, every station visible at once and in
 * any order. The server renders the report's state of every figure, every
 * option, the workshop's answer and the take-aways; a choice only adds its
 * own consequence in place.
 */
export function NorthwindDemo({ locale, copy }: { locale: Locale; copy: NorthwindCopy }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const bridge = bridgeText(state, copy);
  const example = sheetText(state.sheet, copy);

  return (
    <div className={cx(styles.root, "flex flex-col gap-14 sm:gap-16")} data-demo-root="geschaeftsberichte-mit-ki-lesen">
      <div className="flex flex-col gap-3">
        <p className="text-[0.9375rem] font-semibold tabular-nums text-foreground">{copy.intro.facts}</p>
        <p className="max-w-[64ch] text-[0.9375rem] leading-normal text-muted-foreground text-pretty">
          {copy.intro.half}
        </p>
        <nav aria-label={copy.intro.stationsLabel} className={styles.noPrint}>
          <ul className="flex flex-wrap gap-x-5 gap-y-0">
            {SECTION_IDS.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="anti-link inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-foreground"
                >
                  {copy.stationLinks[id]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <Station id="bericht" title={copy.headings.bericht}>
        <StationReport
          copy={copy}
          locale={locale}
          gut={state.gut}
          onGut={(value) => dispatch({ type: "gut", value })}
        />
      </Station>

      <Station id="vergleichen" title={copy.headings.vergleichen}>
        <StationCompare
          copy={copy}
          locale={locale}
          value={state.compare}
          onChange={(value) => dispatch({ type: "compare", value })}
        />
      </Station>

      <Station id="maengel" title={copy.headings.maengel}>
        <StationDefects
          copy={copy}
          locale={locale}
          defect={state.defect}
          flag={state.flag}
          bridge={bridge}
          onDefect={(value) => dispatch({ type: "defect", value })}
          onFlag={(value) => dispatch({ type: "flag", value })}
        />
      </Station>

      <Station id="pruefen" title={copy.headings.pruefen}>
        <StationCheck
          copy={copy}
          locale={locale}
          said={state.said}
          onSay={(claim, value) => dispatch({ type: "say", claim, value })}
        />
      </Station>

      <Station id="entscheiden" title={copy.headings.entscheiden}>
        <StationDecide
          copy={copy}
          locale={locale}
          sheet={state.sheet}
          gut={state.gut}
          pristine={isPristine(state)}
          onSheet={dispatch}
          onReset={() => dispatch({ type: "reset" })}
        />
      </Station>

      <Station id="mitnehmen" title={copy.headings.mitnehmen}>
        <Takeaways copy={copy} example={example} />
      </Station>

      <p className="text-[0.875rem] text-muted-foreground" data-demo-provenance-line="">
        {copy.ui.provenance}
      </p>
    </div>
  );
}
