"use client";

import { useEffect, useRef, useState } from "react";
import { GlasButton } from "@/components/demos/glas";
import { copyText } from "@/components/demos/take-home/copy-button";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { fill } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";

/** A copy button that says "Kopiert" for two seconds. */
export function CopyRowButton({ text, label, copied, testId }: { readonly text: string; readonly label: string; readonly copied: string; readonly testId?: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <GlasButton
      variant="glass"
      icon={done ? "check" : "copy"}
      data-w01-copy={testId}
      onClick={async () => {
        if (!(await copyText(text))) return;
        setDone(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? copied : label}
    </GlasButton>
  );
}

function Row({ title, note, children, id }: { readonly title: string; readonly note: string; readonly children: React.ReactNode; readonly id: string }) {
  return (
    <li className="w01-take-row" data-w01-take={id}>
      <div>
        <p className="w01-take-title">{title}</p>
        <p className="w01-take-note">{note}</p>
      </div>
      <div className="w01-take-action">{children}</div>
    </li>
  );
}

/**
 * Step 7, "Mitnehmen": four rows, each a verb, an object and what it does
 * for the visitor. The skill, the release rule filled in this tab, the
 * question for Claude with their own values, and the kit with its size.
 * "Weitere Dateien" opens a sheet with the project instructions, the result
 * CSV and the empty template.
 */
export function TakeHomeStep({
  copy,
  line,
  kitHref,
  kitSize,
  prompt,
  onRule,
  onMore,
}: {
  readonly copy: DemoPack;
  readonly line: string;
  readonly kitHref: string;
  readonly kitSize: string;
  readonly prompt: string;
  readonly onRule: () => void;
  readonly onMore: () => void;
}) {
  const t = copy.takeHome;
  return (
    <div className="w01-take" data-w01-takehome="">
      {line ? <p className="w01-take-line">{line}</p> : null}
      <ol className="w01-take-rows">
        <Row id="skill" title={t.skillTitle} note={t.skillNote}>
          <GlasButton variant="prominent" icon="download" href="/skills/prognose-pruefen.zip" download="prognose-pruefen.zip">
            {t.skill}
          </GlasButton>
        </Row>
        <Row id="rule" title={t.ruleTitle} note={t.ruleNote}>
          <GlasButton variant="glass" icon="download" onClick={onRule} data-w01-rule-download="">
            {t.rule}
          </GlasButton>
        </Row>
        <Row id="prompt" title={t.promptTitle} note={t.promptNote}>
          <CopyRowButton text={prompt} label={t.prompt} copied={t.copied} testId="prompt" />
        </Row>
        <Row id="kit" title={t.kitTitle} note={t.kitNote}>
          <GlasButton variant="glass" icon="download" href={kitHref} download={copy.files.kitZip}>
            {fill(t.kit, { size: kitSize })}
          </GlasButton>
        </Row>
      </ol>
      <ul className="w01-take-files" aria-label={t.kitTitle}>
        {t.kitFiles.map((entry) => (
          <li key={entry.file}>
            <code>{entry.file}</code> <span className="w01-soft">{entry.beat}</span>
          </li>
        ))}
      </ul>
      <GlasButton variant="plain" size="compact" icon="folder" onClick={onMore} data-w01-more-files="">
        {t.more}
      </GlasButton>
    </div>
  );
}
