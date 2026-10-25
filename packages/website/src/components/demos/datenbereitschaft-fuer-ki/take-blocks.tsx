"use client";

import { useRef, useState } from "react";
import type { DemoPack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/pack";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/text";
import type { Reading, Series } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/series";
import { buildTakeaways, joinAll } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/takeaways";
import { Radios } from "./radios";

type Outcome = "copied" | "selected";

/** Select the text of an element, the fallback when the clipboard is not available. */
function selectText(node: HTMLElement | null): void {
  if (!node) return;
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.addRange(range);
}

/** Three blocks built from the visitor's numbers, shown in full before anyone copies them. */
export function TakeBlocks({ series, pack, reading }: { readonly series: Series; readonly pack: DemoPack; readonly reading: Reading }) {
  const { take } = pack;
  const takeaways = buildTakeaways(series, pack, reading);
  const both = series.levels !== null && series.changes !== null;
  const [yaml, setYaml] = useState(false);
  const [human, setHuman] = useState(false);
  const [done, setDone] = useState<{ id: string; outcome: Outcome } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodes = useRef<Record<string, HTMLElement | null>>({});

  const copy = async (id: string, text: string) => {
    let outcome: Outcome = "copied";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      outcome = "selected";
      selectText(nodes.current[id] ?? null);
    }
    setDone({ id, outcome });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(null), 1500);
  };

  const label = (id: string, idle: string) => (done?.id === id ? (done.outcome === "copied" ? take.copied : take.copyFail) : idle);
  const definition = yaml ? takeaways.definitionYaml : takeaways.definitionText;
  const question = human ? takeaways.questionHuman : takeaways.questionAi;
  const blocks = [
    {
      id: "def",
      title: take.blockTitles[0],
      text: definition,
      mono: yaml,
      switcher: (
        <Radios
          className="dr3-switch"
          label={take.blockTitles[0]}
          value={yaml ? "yaml" : "text"}
          onChange={(id) => setYaml(id === "yaml")}
          options={[
            { id: "text", label: take.switchText },
            { id: "yaml", label: take.switchYaml },
          ]}
        />
      ),
      note: yaml ? take.yamlNote : null,
    },
    {
      id: "ask",
      title: take.blockTitles[1],
      text: question,
      mono: false,
      switcher: (
        <Radios
          className="dr3-switch"
          label={take.blockTitles[1]}
          value={human ? "human" : "ai"}
          onChange={(id) => setHuman(id === "human")}
          options={[
            { id: "ai", label: take.switchAi },
            { id: "human", label: take.switchHuman },
          ]}
        />
      ),
      note: null,
    },
    {
      id: "board",
      title: take.blockTitles[2],
      text: takeaways.board,
      mono: false,
      switcher: null,
      note: both ? fill(take.readingNote, { reading: reading === "level" ? pack.ui.readingLevel : pack.ui.readingChange }) : null,
    },
  ] as const;

  return (
    <section className="dr3-take" aria-labelledby="dr3-take-title">
      <h2 id="dr3-take-title" className="dr3-h">
        {take.title}
      </h2>
      <div className="dr3-blocks" ref={(node) => { nodes.current.all = node; }}>
        {blocks.map((block) => (
          <article key={block.id} className="dr3-block" data-block={block.id}>
            <header>
              <h3>{block.title}</h3>
              {block.switcher}
            </header>
            <pre
              ref={(node) => {
                nodes.current[block.id] = node;
              }}
              className="dr3-pre"
              data-mono={block.mono ? "" : undefined}
            >
              {block.text}
            </pre>
            {block.note ? <p className="dr3-note">{block.note}</p> : null}
            <button type="button" className="dr3-btn dr3-copy" onClick={() => copy(block.id, block.text)}>
              {label(block.id, take.copy)}
            </button>
          </article>
        ))}
      </div>
      <button
        type="button"
        className="dr3-btn dr3-copy-all"
        onClick={() => copy("all", joinAll(pack, takeaways, { yaml, human }))}
      >
        {label("all", take.copyAll)}
      </button>
      <p className="dr3-sr" role="status">
        {done ? (done.outcome === "copied" ? take.copied : take.copyFail) : ""}
      </p>
      <p className="dr3-origin">{take.origin}</p>
    </section>
  );
}
