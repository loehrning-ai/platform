"use client";

import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { REFERENCES_PATH, SKILL_NAME } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/skill-file";
import {
  cardToMarkdown,
  EMPTY_CARD,
  MAX_CARDS,
  withExample,
  type Finding,
  type OwnCard,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/steckbrief";
import { fill } from "./fmt";

/** The example the stage shows until the visitor types: the form's placeholders, as one filled card. */
export function exampleCard(pack: DemoPack): OwnCard {
  const fields = pack.own.fields;
  return {
    ...EMPTY_CARD,
    name: fields.name.placeholder,
    decision: fields.decision.placeholder,
    numerator: fields.numerator.placeholder,
    numeratorKind: "quantity",
    denominator: fields.denominator.placeholder,
    period: "month",
    comparison: "lastYear",
    sourceFile: fields.sourceFile.placeholder,
    sourceColumn: fields.sourceColumn.placeholder,
    limit: fields.limit.placeholder,
    trigger: fields.trigger.placeholder,
  };
}

/**
 * Beat 7: the visitor's card as it will read in the skill, live, with the
 * number of notes. Lines the visitor has not set yet show an example in grey;
 * each one turns to ink as its field is filled.
 */
export function StageOwn({
  pack,
  card,
  findings,
  added,
}: {
  readonly pack: DemoPack;
  readonly card: OwnCard;
  readonly findings: readonly Finding[];
  readonly added: number;
}) {
  const own = pack.own;
  const preview = withExample(card, exampleCard(pack));
  const lines = cardToMarkdown(preview.card, own.card).split("\n");
  const anyExample = preview.typed.some((typed) => !typed);
  return (
    <div className="nw-own">
      <div className="nw-top">
        <p className="nw-caps">
          {own.preview}
          {anyExample ? <span className="nw-example-note"> · {own.exampleNote}</span> : null}
        </p>
      </div>
      <pre className="nw-card-preview" data-card-preview="">
        <code>
          {lines.map((line, index) => (
            <span key={index} className="nw-card-line" data-example={preview.typed[index] ? undefined : ""}>
              {line}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
      <p className="nw-own-meta">
        <span data-findings-count={findings.length}>
          {findings.length === 0 ? own.noFindings : fill(own.findings, { n: findings.length })}
        </span>
        <span>{fill(own.count, { n: added, max: MAX_CARDS })}</span>
      </p>
    </div>
  );
}

/** Beat 8: what the personal zip holds. SKILL.md stays byte for byte; the cards go to references/. */
export function StageTakeHome({ pack, cards }: { readonly pack: DemoPack; readonly cards: readonly OwnCard[] }) {
  const copy = pack.takehome;
  const first = cards[0];
  return (
    <div className="nw-takehome">
      <div className="nw-top">
        <p className="nw-caps">{copy.inZip}</p>
      </div>
      <ul className="nw-tree" data-zip-tree="">
        <li className="nw-tree-root">
          <code>{SKILL_NAME}.zip</code>
        </li>
        <li>
          <code>{SKILL_NAME}/SKILL.md</code>
          <span>{copy.skillNote}</span>
        </li>
        <li data-has-refs={cards.length > 0 ? "" : undefined}>
          <code>{REFERENCES_PATH}</code>
          <span>{cards.length > 0 ? fill(copy.refsNote, { n: cards.length }) : copy.refsNone}</span>
        </li>
      </ul>
      {first ? (
        <pre className="nw-card-preview nw-card-preview-small">
          <code>{cardToMarkdown(first, pack.own.card)}</code>
        </pre>
      ) : null}
    </div>
  );
}
