"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  DemoLever,
  DemoStage,
  revealIfOffscreen,
  TAKEHOME_TARGET_ID,
  useBeatClock,
  useOnRestart,
} from "@/components/demos/shell";
import type { Locale } from "@/lib/i18n/locale";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/export";
import { figures as deriveFigures } from "@/lib/demo-cases/esg-berichte-mit-ki/figures";
import { ledgerCounts } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import { cascadeAt, sweepAt } from "@/lib/demo-cases/esg-berichte-mit-ki/motion";
import type { OwnRow } from "@/lib/demo-cases/esg-berichte-mit-ki/own";
import { FolderDetails, InvoiceDetails, ProbeDetails, ThreeDetails } from "./details";
import { OwnSentences } from "./own-sentences";
import { StatusTag } from "./parts";
import { CertificateStage, type Bet } from "./stage-certificate";
import { FolderStage } from "./stage-folder";
import { InvoiceStage } from "./stage-invoice";
import { RegelStage } from "./stage-regel";
import { ThreeStage } from "./stage-three";
import { Stepper } from "./stepper";
import { useTimeline } from "./use-timeline";
import "./esg-demo.css";

const VERDICT_MS = 1600;
const SWEEP_MS = 6000;
const CASCADE_MS = 8000;

/** Everything the visitor has done in the beats; "Von vorn" clears it, never "Deine Sätze". */
interface Bets {
  readonly first: Bet | null;
  readonly three: readonly (Bet | null)[];
  readonly threeIndex: number;
  readonly folderGuess: number | null;
  readonly folderRun: number;
  readonly invoiceGuess: number | null;
  readonly invoiceRun: number;
}

const START: Bets = { first: null, three: [null, null, null], threeIndex: 0, folderGuess: null, folderRun: 0, invoiceGuess: null, invoiceRun: 0 };

export default function Demo({ pack }: { readonly pack: Pack }) {
  const clock = useBeatClock();
  const locale: Locale = pack.locale === "en" ? "en" : "de";
  const figures = useMemo(() => deriveFigures(locale), [locale]);
  const [bets, setBets] = useState<Bets>(START);
  const [ownRows, setOwnRows] = useState<readonly OwnRow[]>([]);
  const ownRef = useRef<HTMLElement>(null);
  useOnRestart(() => setBets(START));

  const threeBet = bets.three[bets.threeIndex] ?? null;
  const verdictT = useTimeline(threeBet ? `three-${bets.threeIndex}` : null, VERDICT_MS, clock.reducedMotion);
  const sweepT = useTimeline(bets.folderRun > 0 ? `sweep-${bets.folderRun}` : null, SWEEP_MS, clock.reducedMotion);
  const cascadeT = useTimeline(bets.invoiceRun > 0 ? `cascade-${bets.invoiceRun}` : null, CASCADE_MS, clock.reducedMotion);

  const id = clock.beat.id;
  const before = ledgerCounts("before");
  const after = ledgerCounts("after");
  const counts = (value: typeof before) =>
    `${value.belegt} ${pack.statuses.belegt}, ${value.schwach} ${pack.statuses.schwach}, ${value.luecke} ${pack.statuses.luecke}`;

  let stage: ReactNode;
  let caption: ReactNode;
  let lever: ReactNode;
  let details: ReactNode = null;

  if (id === "satz") {
    stage = <CertificateStage pack={pack} mode="satz" progress={clock.progress} bet={bets.first} />;
    caption = pack.satz1.question;
    lever = (
      <div className="nw-bets">
        {(["yes", "no"] as const).map((bet) => (
          <button
            key={bet}
            type="button"
            className="nw-button nw-bet"
            aria-pressed={bets.first === bet}
            data-bet={bet}
            onClick={() => {
              setBets((previous) => ({ ...previous, first: bet }));
              clock.commit();
              clock.seek(clock.index + 1);
            }}
          >
            {bet === "yes" ? pack.bet.yes : pack.bet.no}
          </button>
        ))}
      </div>
    );
  } else if (id === "probe") {
    stage = <CertificateStage pack={pack} mode="probe" progress={clock.progress} bet={bets.first} />;
    caption = clock.progress >= 1 ? pack.probe.verdict : pack.probe.running;
    lever = bets.first ? null : <p className="nw-lever-note">{pack.bet.none}</p>;
    details = clock.progress >= 1 ? <ProbeDetails pack={pack} bet={bets.first} days={figures.days!} /> : null;
  } else if (id === "regel") {
    stage = <RegelStage pack={pack} progress={clock.progress} />;
    caption = pack.regel.caption;
    lever = (
      <a className="nw-button" href={pack.regel.downloadHref} download>
        {pack.regel.download}
      </a>
    );
  } else if (id === "drei-saetze") {
    const sentence = pack.three.sentences[bets.threeIndex]!;
    stage = <ThreeStage pack={pack} figures={figures} index={bets.threeIndex} bet={threeBet} t={verdictT} />;
    caption = threeBet && verdictT >= 1 ? sentence.verdict : pack.three.question;
    const allDone = bets.three.every((bet) => bet !== null);
    lever = !threeBet ? (
      <div className="nw-bets">
        {(["yes", "no"] as const).map((bet) => (
          <button
            key={bet}
            type="button"
            className="nw-button nw-bet"
            data-bet={bet}
            onClick={() => setBets((previous) => ({ ...previous, three: previous.three.map((value, index) => (index === previous.threeIndex ? bet : value)) }))}
          >
            {bet === "yes" ? pack.bet.yesShort : pack.bet.noShort}
          </button>
        ))}
      </div>
    ) : bets.threeIndex < 2 ? (
      <button type="button" className="nw-button" disabled={verdictT < 1} onClick={() => setBets((previous) => ({ ...previous, threeIndex: previous.threeIndex + 1 }))}>
        {pack.three.nextSentence}
      </button>
    ) : null;
    details =
      threeBet && verdictT >= 1 ? (
        <ThreeDetails pack={pack} figures={figures} index={bets.threeIndex} first={bets.first} three={bets.three} allDone={allDone} />
      ) : null;
  } else if (id === "ordner") {
    const ran = bets.folderRun > 0;
    const done = ran && sweepAt(sweepT).tally >= 1;
    stage = <FolderStage pack={pack} t={sweepT} />;
    caption = done ? fill(pack.folder.caption, { n: before.belegt, schwach: before.schwach, luecke: before.luecke }) : pack.folder.question;
    lever = (
      <Stepper
        pack={pack}
        value={bets.folderGuess}
        onChange={(folderGuess) => setBets((previous) => ({ ...previous, folderGuess }))}
        action={pack.folder.check}
        disabled={ran && !done}
        onAction={() => setBets((previous) => ({ ...previous, folderRun: previous.folderRun + 1 }))}
      />
    );
    details = done ? <FolderDetails pack={pack} guess={bets.folderGuess} /> : null;
  } else if (id === "rechnung") {
    const filed = bets.invoiceRun > 0;
    const done = filed && cascadeAt(cascadeT).summary >= 1;
    stage = <InvoiceStage pack={pack} locale={locale} figures={figures} t={cascadeT} filed={filed} />;
    caption = done ? fill(pack.invoice.caption, figures) : pack.invoice.question;
    lever = (
      <Stepper
        pack={pack}
        value={bets.invoiceGuess}
        onChange={(invoiceGuess) => setBets((previous) => ({ ...previous, invoiceGuess }))}
        action={pack.invoice.file}
        disabled={filed}
        onAction={() => setBets((previous) => ({ ...previous, invoiceRun: previous.invoiceRun + 1 }))}
      />
    );
    details = done ? (
      <InvoiceDetails pack={pack} figures={figures} guess={bets.invoiceGuess} summary={fill(pack.invoice.summary, { ...figures, before: counts(before), after: counts(after), b3before: 0, b3after: 1 })} />
    ) : null;
  } else if (id === "deine-saetze") {
    const latest = ownRows.at(-1);
    stage = (
      <div className="nw-stage nw-own-stage" data-scene="eigene">
        {latest ? (
          <>
            <p className="nw-kicker">{pack.own.stageLatest}</p>
            <p className="nw-sentence nw-sentence-mid">{latest.sentence}</p>
            <p className="nw-own-verdict">
              <StatusTag status={latest.result.status} pack={pack} />
              <span>{pack.own.decisions[latest.result.decision]}</span>
            </p>
          </>
        ) : (
          <p className="nw-own-empty">{pack.own.stageEmpty}</p>
        )}
      </div>
    );
    caption = pack.own.caption;
    lever = (
      <button type="button" className="nw-button nw-button-primary" onClick={() => revealIfOffscreen(ownRef.current, clock.reducedMotion)}>
        {pack.own.lever}
      </button>
    );
  } else {
    stage = (
      <div className="nw-stage" data-scene="mitnehmen">
        <ul className="nw-takehome">
          {pack.takehome.items.map(([file, text]) => (
            <li key={file}>
              <span className="nw-takehome-file">{file}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    );
    caption = pack.takehome.caption;
    lever = (
      <button
        type="button"
        className="nw-button nw-button-primary"
        onClick={() => revealIfOffscreen(document.getElementById(TAKEHOME_TARGET_ID), clock.reducedMotion)}
      >
        {pack.takehome.lever}
      </button>
    );
  }

  return (
    <div className="nw-demo" data-esg-demo="">
      <DemoStage label={pack.stageLabel} caption={caption}>
        {stage}
      </DemoStage>
      <DemoLever>{lever}</DemoLever>
      {details ? (
        <div className="nw-details" data-details={id}>
          {details}
        </div>
      ) : null}
      <OwnSentences ref={ownRef} pack={pack} onRows={setOwnRows} />
    </div>
  );
}
