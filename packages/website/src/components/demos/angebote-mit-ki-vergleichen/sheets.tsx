"use client";

import { GlasButton, GlasChip } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { MOVES, type DemoState } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/demo-state";
import type { StackModel } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import type { Fmt } from "./fmt";

/** Which bar section the visitor tapped. */
export interface SourcePick {
  readonly option: string;
  readonly line: string;
}

/** "„0,66 €“ je Stück, Pos. 1 · angebot-a-nuernberg.md" → the words and the file. */
export function splitSource(src: string): { readonly quote: string; readonly file: string | null } {
  const at = src.lastIndexOf(" · ");
  if (at < 0) return { quote: src, file: null };
  return { quote: src.slice(0, at), file: src.slice(at + 3) };
}

/** P17: a bar section's amount, the words it comes from and its file. */
export function SourceBody({
  pack,
  fmt,
  pick,
  model,
  own,
  surchargeCents,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly pick: SourcePick;
  readonly model: StackModel | null;
  readonly own: boolean;
  readonly surchargeCents: number;
}) {
  const s = pack.source;
  if (pick.line === "Papier") {
    return (
      <div className="av4-sheet-body" data-av4-source="Papier">
        <p className="av4-amount">{fmt.t(s.amount, { amount: fmt.money(surchargeCents) })}</p>
        <p>{s.surcharge}</p>
        <GlasChip kind="file">angebot-c-brno.md</GlasChip>
      </div>
    );
  }
  const option = model?.options.find((candidate) => candidate.name === pick.option);
  const amount = option?.lines[pick.line] ?? 0;
  const src = option?.src[pick.line] ?? "";
  const { quote, file } = splitSource(src);
  return (
    <div className="av4-sheet-body" data-av4-source={pick.line}>
      <p className="av4-amount">{fmt.t(s.amount, { amount: fmt.money(amount) })}</p>
      {own ? (
        src ? (
          <>
            <p className="av4-kicker">{s.own}</p>
            <blockquote className="av4-quote">{src}</blockquote>
          </>
        ) : (
          <p>{s.ownNone}</p>
        )
      ) : (
        <>
          <p className="av4-kicker">{s.quote}</p>
          <blockquote className="av4-quote" lang="de">
            {quote}
          </blockquote>
          {file === "kosten-intern.md" ? <p>{s.internal}</p> : null}
          {file ? (
            <p className="av4-file-row">
              <span className="av4-kicker">{s.file}</span> <GlasChip kind="file">{file}</GlasChip>
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

/** 2f: the field card's three lines, with what the visitor just did under each. */
export function MethodBody({
  pack,
  state,
  decider,
  onNext,
}: {
  readonly pack: DemoPack;
  readonly state: DemoState;
  readonly decider: string;
  readonly onNext: () => void;
}) {
  const m = pack.methode;
  return (
    <div className="av4-sheet-body av4-method" data-av4-method="">
      <ol className="av4-method-lines">
        <li>
          <p className="av4-method-line" lang="de">
            {m.lines[0]}
          </p>
          <ul className="av4-field-chips" aria-label={pack.moves.fieldsLabel}>
            {MOVES.map((move) => (
              <li key={move}>
                <GlasChip kind="status" icon={state.taken.includes(move) ? undefined : "check"}>
                  {pack.moves.names[move]}
                </GlasChip>
              </li>
            ))}
          </ul>
        </li>
        <li>
          <p className="av4-method-line">{m.lines[1]}</p>
          <p className="av4-note">{m.tapHint}</p>
        </li>
        <li>
          <p className="av4-method-line">{m.lines[2]}</p>
          <p className="av4-note">{decider}</p>
        </li>
      </ol>
      <p className="av4-note">{m.limit}</p>
      <p className="av4-from">{m.source}</p>
      <GlasButton variant="prominent" block onClick={onNext} trailingIcon="forward" data-av4-method-next="">
        {m.next}
      </GlasButton>
    </div>
  );
}

/** Beat 3: the kit's negotiation email, filled with the result without a surcharge. */
export function MailBody({
  pack,
  fmt,
  text,
  cap,
  onDownload,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly text: string;
  readonly cap: number | null;
  readonly onDownload: () => void;
}) {
  const p = pack.papier;
  return (
    <div className="av4-sheet-body" data-av4-mail="">
      <p>{p.close}</p>
      <pre className="av4-mail" lang="de" tabIndex={0}>
        {text}
      </pre>
      <p className="av4-note">{cap === null ? p.mailNoteNoCap : fmt.t(p.mailNote, { cap: fmt.pct(cap, 1) })}</p>
      <p className="av4-from">{p.mailSource}</p>
      <GlasButton variant="fill" size="compact" icon="download" onClick={onDownload} data-av4-mail-download="">
        {p.mailDownload}
      </GlasButton>
    </div>
  );
}
