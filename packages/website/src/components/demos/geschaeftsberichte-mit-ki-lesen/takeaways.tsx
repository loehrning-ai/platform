"use client";

import type { ReactNode } from "react";
import type { NorthwindCopy } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy-types";
import { CopyButton, CopyText } from "./parts";

function Block({
  id,
  title,
  text,
  caption,
  copy,
  children,
}: {
  id: string;
  title: string;
  text: string;
  caption: string;
  copy: NorthwindCopy;
  children?: ReactNode;
}) {
  const headingId = `nw-take-${id}`;
  return (
    <section aria-labelledby={headingId} className="max-w-[68ch]" data-takeaway={id}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t-2 border-scene-line pt-3">
        <h3 id={headingId} className="text-[1.25rem] font-bold text-balance">
          {title}
        </h3>
        <CopyButton
          text={text}
          label={copy.ui.copy}
          copiedLabel={copy.ui.copied}
          failedLabel={copy.ui.copyFailed}
          describedBy={headingId}
          testId={`copy-${id}`}
        />
      </div>
      <CopyText text={text} testId={`text-${id}`} />
      <p className="mt-2 text-[0.875rem] leading-normal text-muted-foreground text-pretty">{caption}</p>
      {children}
    </section>
  );
}

/** Zum Mitnehmen: three blocks that work on any monthly report, visible and copyable on load. */
export function Takeaways({ copy, example }: { copy: NorthwindCopy; example: string }) {
  const take = copy.takeaways;
  return (
    <div className="mt-6 flex flex-col gap-10">
      <Block id="traps" title={take.traps.title} text={take.traps.text} caption={take.traps.caption} copy={copy} />
      <Block id="check" title={take.check.title} text={take.check.text} caption={take.check.caption} copy={copy} />
      <Block id="sheet" title={take.sheet.title} text={take.sheet.text} caption={take.sheet.caption} copy={copy}>
        {example ? (
          <div className="mt-6" data-testid="sheet-example">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h4 id="nw-take-sheet-example" className="text-[1.0625rem] font-bold text-balance">
                {take.sheet.exampleTitle}
              </h4>
              <CopyButton
                text={example}
                label={copy.ui.copy}
                copiedLabel={copy.ui.copied}
                failedLabel={copy.ui.copyFailed}
                describedBy="nw-take-sheet-example"
                testId="copy-sheet-example"
              />
            </div>
            <CopyText text={example} testId="text-sheet-example" />
          </div>
        ) : null}
      </Block>
    </div>
  );
}
