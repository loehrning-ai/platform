"use client";

import { useTransitionShare } from "./use-motion";

/** Characters typed per millisecond: 30 per 100 ms. */
const TYPE_RATE = 0.3;

/**
 * The lines a beat writes into the kit's northwind-metrics Skill, typed out
 * whenever they change (a pure function of the share), always expanded.
 */
export function SkillStrip({
  head,
  text,
  note,
  reducedMotion,
}: {
  readonly head: string;
  readonly text: string;
  readonly note?: string | null;
  readonly reducedMotion: boolean;
}) {
  const typing = useTransitionShare(text, Math.max(300, text.length / TYPE_RATE), reducedMotion);
  const shown = typing.to.slice(0, Math.ceil(typing.to.length * typing.share));
  return (
    <figure className="nw-skill-strip" data-skill-strip="">
      <figcaption>
        <code>{head}</code>
        {note ? <span className="nw-suggested"> · {note}</span> : null}
      </figcaption>
      <pre aria-label={text}>
        <code className="nw-strip-ghost" aria-hidden="true">
          {text}
        </code>
        <code className="nw-strip-typed" aria-hidden="true">
          {shown}
        </code>
      </pre>
    </figure>
  );
}
