"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowGlyph } from "@/components/werk";
import {
  englishMail,
  fmt,
  ownerOrSlot,
  ruleEvidenceLine,
  templateSegments,
  type EmptySlot,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/core";
import type { W05Text } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/pack";
import type {
  CardInput,
  DemoLocale,
  SceneResult,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { CopyBlock } from "./copy-card";

interface Props {
  readonly text: W05Text;
  readonly fields: CardInput;
  readonly onFields: (fields: CardInput) => void;
  readonly results: readonly SceneResult[];
  readonly workshopHref: string;
  readonly kitHref: string;
  readonly onRestart: () => void;
}

function Card({
  id,
  title,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="border-2 border-foreground bg-[var(--color-paper)] p-4 sm:p-5"
      data-card={id}
    >
      <h3 id={id} className="text-[1.25rem] font-bold leading-tight">
        {title}
      </h3>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  );
}

/**
 * "Zum Mitnehmen": two fields fill three templates. Always rendered, works
 * without playing; the fields live in React state only.
 */
export function Takeaways({ text, fields, onFields, results, workshopHref, kitHref, onRestart }: Props) {
  const copy = text.ui;
  const own = text.templates;
  const english = englishMail(text);
  const evidence = ruleEvidenceLine(text, results);
  const block = (
    template: string,
    testId: string,
    target: string,
    at: DemoLocale = text.locale,
    empty: EmptySlot = text.emptySlot,
    label = copy.copy,
  ) => {
    const segments = templateSegments(template, fields, empty);
    return (
      <CopyBlock
        text={segments.map((segment) => segment.text).join("")}
        segments={segments}
        buttonLabel={label}
        spokenTarget={target}
        copiedLabel={copy.copied}
        selectedLabel={copy.selected}
        lang={at}
        testId={testId}
      />
    );
  };

  return (
    <section
      id="mitnehmen"
      aria-labelledby="mitnehmen-heading"
      className="scroll-mt-24 border-t-2 border-scene-line pt-4"
      data-takeaways=""
    >
      <h2 id="mitnehmen-heading" tabIndex={-1} className="text-fluid-h2 font-bold">
        {copy.takeawaysHeading}
      </h2>
      <p className="mt-2 max-w-[60ch] text-body text-muted-foreground">{copy.takeawaysIntro}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[7fr_5fr] lg:gap-10">
        <div className="grid content-start gap-4 lg:order-2" data-fields="">
          <div className="grid gap-1.5">
            <label htmlFor="w05-tool" className="text-[1rem] font-bold">
              {copy.toolField}
            </label>
            <input
              id="w05-tool"
              className="w05-input"
              type="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={60}
              placeholder={copy.toolPlaceholder}
              value={fields.tool}
              aria-describedby="w05-tool-note"
              onChange={(event) => onFields({ ...fields, tool: event.target.value })}
            />
            <p id="w05-tool-note" className="text-[0.9375rem] leading-snug text-muted-foreground">
              {copy.toolNote}
            </p>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="w05-owner" className="text-[1rem] font-bold">
              {copy.ownerField}
            </label>
            <input
              id="w05-owner"
              className="w05-input"
              type="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={60}
              placeholder={copy.ownerPlaceholder}
              value={fields.owner}
              onChange={(event) => onFields({ ...fields, owner: event.target.value })}
            />
          </div>
          <p className="text-[0.875rem] leading-snug text-muted-foreground">{copy.fieldsNote}</p>
        </div>

        <div className="grid min-w-0 content-start gap-4 lg:order-1">
          <Card id="w05-card-reply" title={copy.cardReply}>
            {block(own.reply, "reply", copy.cardReply)}
            <p className="text-[0.9375rem] leading-snug text-muted-foreground" data-reply-note="">
              {fmt(copy.replyNote, { name: ownerOrSlot(text, fields) })}
            </p>
          </Card>

          <Card id="w05-card-rules" title={copy.cardRules}>
            {block(own.rules, "rules", copy.cardRules)}
            {evidence ? (
              <div className="border-l-[3px] border-[var(--color-bernstein)] pl-3" data-your-scenes="">
                <p className="text-[0.875rem] font-bold">{copy.yourScenes}</p>
                <p className="mt-0.5 text-[0.9375rem] leading-snug">{evidence}</p>
              </div>
            ) : null}
          </Card>

          <Card id="w05-card-mail" title={copy.cardMail}>
            {block(own.mail, "mail", copy.cardMail)}
            {text.mailEn ? (
              <>
                <p className="text-[0.875rem] font-bold">{copy.inEnglish}</p>
                {block(english.template, "mail-en", copy.cardMail, "en", english.empty, copy.copyEnglish)}
              </>
            ) : null}
            <p className="text-[0.9375rem] leading-snug text-muted-foreground">{copy.mailNote}</p>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2" data-end-links="">
        <EndLinks copy={copy} workshopHref={workshopHref} kitHref={kitHref} onRestart={onRestart} />
      </div>
    </section>
  );
}

function EndLinks({
  copy,
  workshopHref,
  kitHref,
  onRestart,
}: {
  readonly copy: W05Text["ui"];
  readonly workshopHref: string;
  readonly kitHref: string;
  readonly onRestart: () => void;
}) {
  return (
    <>
      <Link href={workshopHref} className="anti-link inline-flex min-h-11 items-center gap-2 font-semibold">
        {copy.toWorkshop}
        <ArrowGlyph direction="right" className="size-4" />
      </Link>
      <Link href={kitHref} className="anti-link inline-flex min-h-11 items-center gap-2 font-semibold">
        {copy.toKit}
        <ArrowGlyph direction="right" className="size-4" />
      </Link>
      <button
        type="button"
        className="w05-btn w05-btn--plain w05-btn--small anti-btn justify-self-start"
        onClick={onRestart}
        data-restart=""
      >
        {copy.restart}
      </button>
    </>
  );
}
