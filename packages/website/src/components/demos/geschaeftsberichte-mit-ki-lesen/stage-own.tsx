"use client";

import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { REFERENCES_PATH, SKILL_NAME } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/skill-file";
import { cardToMarkdown, MAX_CARDS, type Finding, type OwnCard } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/steckbrief";
import { fill } from "./fmt";

/** Beat 7: the visitor's card as it will read in the skill, live, with the number of notes. */
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
  return (
    <div className="nw-own">
      <div className="nw-top">
        <p className="nw-caps">{own.preview}</p>
      </div>
      <pre className="nw-card-preview" data-card-preview="">
        <code>{cardToMarkdown(card, own.card)}</code>
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
