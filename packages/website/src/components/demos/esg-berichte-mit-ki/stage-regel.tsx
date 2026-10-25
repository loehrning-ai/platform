"use client";

import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { seg } from "@/lib/demo-cases/esg-berichte-mit-ki/motion";
import type { Status } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";
import { StatusGlyph } from "./parts";

/** Beat 3: the card from the kit (nachweisprobe.md), built line by line. */
export function RegelStage({ pack, progress }: { readonly pack: Pack; readonly progress: number }) {
  const step = (index: number) => seg(progress, index * 0.08, index * 0.08 + 0.28);
  return (
    <div className="nw-stage nw-card-stage" data-scene="regel">
      <p className="nw-objective" style={{ opacity: step(0) }}>
        {pack.regel.objective}
      </p>
      <ol className="nw-rule-checks">
        {pack.regel.checks.map(([label, text], index) => (
          <li key={label} style={{ opacity: step(index + 1) }}>
            <span className="nw-rule-label">{label}</span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
      <ul className="nw-rule-statuses">
        {pack.regel.statuses.map(([status, text], index) => (
          <li key={status} style={{ opacity: step(index + 5) }}>
            <StatusGlyph status={status as Status} />
            <span className="nw-rule-label">{pack.statuses[status as Status]}</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <p className="nw-rule-weakest" style={{ opacity: step(8) }}>
        {pack.regel.weakest}
      </p>
    </div>
  );
}
