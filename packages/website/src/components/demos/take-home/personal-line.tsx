"use client";

import { CopyButton } from "./copy-button";
import { useTakeHomeLine } from "./take-home-store";

/** Row 1, "Deine Zeile": rendered only once the demo's own beat has written a line. */
export function PersonalLine({
  slug,
  heading,
  note,
  copyLabel,
  copiedLabel,
}: {
  readonly slug: string;
  readonly heading: string;
  readonly note: string;
  readonly copyLabel: string;
  readonly copiedLabel: string;
}) {
  const line = useTakeHomeLine(slug);
  if (line === "") return null;
  return (
    <li className="border-t-2 border-foreground py-5" data-takehome-row="line">
      <h3 className="text-[1.0625rem] font-bold">{heading}</h3>
      <p className="mt-1 text-[0.9375rem] text-muted-foreground">{note}</p>
      <p className="mt-3 whitespace-pre-wrap border-l-4 border-mennige bg-card px-3 py-2 text-[1rem] leading-snug [overflow-wrap:anywhere]">
        {line}
      </p>
      <div className="mt-3">
        <CopyButton text={line} label={copyLabel} doneLabel={copiedLabel} />
      </div>
    </li>
  );
}
