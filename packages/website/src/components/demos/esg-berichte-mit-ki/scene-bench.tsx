"use client";

import { GlasSegmented, GlasSlider } from "@/components/demos/glas";
import { benchProbe, CHECKS, dateAt, offsetOf, SLIDER_MAX, TICKS, type BenchPlace, type BenchResult, type BenchScope, type CheckId } from "@/lib/demo-cases/esg-berichte-mit-ki/bench";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { BIO, STICHTAG } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import type { CalendarDate } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";
import { THREADS } from "@/lib/demo-cases/esg-berichte-mit-ki/threads";
import { DocCard } from "./doc-card";
import { FieldDrawing, RulerDrawing } from "./drawings";
import type { Fmt } from "./fmt";
import { StatusGlyph } from "./glyph";
import { ShelfCard } from "./scene-card";

export interface BenchLevers {
  readonly scope: BenchScope;
  readonly place: BenchPlace;
  readonly offset: number;
}

export const benchResult = (levers: BenchLevers): BenchResult => benchProbe({ scope: levers.scope, place: levers.place, stichtag: dateAt(levers.offset) });

/** The slider's spoken value: „16. Oktober 2026, 46 Tage nach Ablauf". */
export function stichtagValue(pack: Pack, fmt: Fmt, offset: number): string {
  const date = dateAt(offset);
  const result = benchProbe({ scope: "teil", place: "website", stichtag: date });
  return result.expired
    ? fmt.t(pack.bench.valueExpired, { date: fmt.longDate(date), days: result.days })
    : fmt.t(pack.bench.valueValid, { date: fmt.longDate(date), daysLeft: result.daysLeft });
}

/** The caption of the workbench: the state's explanation, plus the renewal sentence past 22.10.2026. */
export function benchCaption(pack: Pack, fmt: Fmt, levers: BenchLevers): string[] {
  const result = benchResult(levers);
  const date = dateAt(levers.offset);
  const sentences = fmt.ts(pack.bench.captions[result.caption], { date: fmt.longDate(date), days: result.days, daysLeft: result.daysLeft });
  return result.pastRenewal ? [...sentences, pack.bench.captions.renewal] : sentences;
}

function checkSentence(pack: Pack, fmt: Fmt, id: CheckId, levers: BenchLevers, result: BenchResult, date: CalendarDate): string {
  const c = pack.bench.checks;
  switch (id) {
    case "zitat":
      return c.zitat;
    case "zeitraum":
      return fmt.t(result.expired ? c.zeitraumExpired : c.zeitraumValid, { date: fmt.date(date), days: result.days, daysLeft: result.daysLeft });
    case "umfang":
      return levers.scope === "alle" ? c.umfangAll : result.cellarClaimed ? c.umfangCellar : c.umfangPart;
    case "freigabe":
      return c.freigabe;
  }
}

/**
 * Scene 2, the workbench: the certificate stays as it is, the claim changes.
 * Scope and place sit under the card; the Stichtag slider lies on the ruler. The
 * field's outline shrinks onto the 12 certified hectares when the claim
 * does, and lets go of the cellar on the website.
 */
export function BenchScene({
  pack,
  fmt,
  kit,
  levers,
  onScope,
  onPlace,
  onOffset,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly kit: KitText;
  readonly levers: BenchLevers;
  readonly onScope: (scope: BenchScope) => void;
  readonly onPlace: (place: BenchPlace) => void;
  readonly onOffset: (offset: number) => void;
}) {
  const result = benchResult(levers);
  const date = dateAt(levers.offset);
  const marks = Object.fromEntries(
    (["zertifiziert", "flaeche", "stichtag"] as const).map((part) => {
      const status = part === "flaeche" ? result.checks.umfang : part === "stichtag" ? result.checks.zeitraum : "belegt";
      return [THREADS[part].target, { status, label: pack.statuses[status] }];
    }),
  );
  // After the end of validity the date is an empty well, as the kit writes „gültig bis [Datum]".
  const [safeBefore = "", safeAfter = ""] = pack.card.safe.split("{date}");
  const claim =
    levers.scope === "alle" ? (
      kit.claim.text
    ) : result.expired ? (
      <>
        {fmt.t(safeBefore, { code: BIO.controlBody })}
        <span className="w4-well" data-w4-well="">
          {pack.card.dateWell}
        </span>
        {fmt.t(safeAfter, { code: BIO.controlBody })}
      </>
    ) : (
      fmt.t(pack.card.safe, { code: BIO.controlBody, date: fmt.date(BIO.validUntil) })
    );
  const outline = levers.scope === "alle" ? "all" : result.cellarClaimed ? "partCellar" : "part";
  const gapLabel = result.expired ? fmt.t(pack.bench.gapExpired, { days: result.days }) : fmt.t(pack.bench.gapValid, { daysLeft: result.daysLeft });

  return (
    <div className="w4-s2" data-w4-scene="umschreiben" data-status={result.status}>
      <div className="w4-s2-doc">
        <DocCard name={kit.certificate.name} subtitle={kit.invented} lines={kit.certificate.lines.filter((line) => line.n > 2)} marks={marks} compact className="w4-phone-only-doc" />
        <DocCard name={kit.certificate.name} subtitle={kit.invented} lines={kit.certificate.lines.filter((line) => line.n > 2)} marks={marks} className="w4-wide-only-doc" />
      </div>
      <div className="w4-s2-card">
        <ShelfCard
          pack={pack}
          face={{
            claim,
            claimKey: `${levers.scope}-${result.expired}`,
            place: levers.scope === "alle" && levers.place === "regalkarte" ? kit.claim.place : pack.bench.place[levers.place],
            stichtag: fmt.t(pack.card.stichtag, { date: fmt.date(date) }),
            status: result.status,
            statusLabel: fmt.t(pack.card.status, { status: pack.statuses[result.status] }),
          }}
          layout="full"
          handles={false}
        />
      </div>
      {/* The two word levers sit right under the card they rewrite. */}
      <div className="w4-s2-levers" data-w4-levers="">
        <GlasSegmented
          label={pack.bench.scopeLabel}
          options={(["alle", "teil"] as const).map((value) => ({ value, label: pack.bench.scope[value] }))}
          value={levers.scope}
          onChange={onScope}
        />
        <GlasSegmented
          label={pack.bench.placeLabel}
          options={(["regalkarte", "website"] as const).map((value) => ({ value, label: pack.bench.place[value] }))}
          value={levers.place}
          onChange={onPlace}
        />
      </div>
      <div className="w4-s2-field" aria-label={pack.connect.field} role="img">
        <FieldDrawing outline={outline} cellarLabel={pack.connect.cellar} />
      </div>
      <div className="w4-s2-ruler">
        <RulerDrawing
          stichtag={date}
          gapLabel={gapLabel}
          dates={{ from: fmt.date(BIO.validFrom), until: fmt.date(BIO.validUntil), pin: fmt.date(date) }}
          showTicks
        />
        <GlasSlider
          label={pack.bench.sliderLabel}
          value={levers.offset}
          min={0}
          max={SLIDER_MAX}
          step={1}
          bigStep={30}
          onChange={onOffset}
          format={(value) => fmt.date(dateAt(value))}
          valueText={(value) => stichtagValue(pack, fmt, value)}
          announce={(value) => stichtagValue(pack, fmt, value)}
          ticks={[
            { value: 0, label: fmt.date(dateAt(0)) },
            { value: TICKS.validUntil },
            { value: TICKS.banDate },
            { value: offsetOf(STICHTAG), label: fmt.date(STICHTAG) },
            { value: TICKS.renewal },
            // The end stays unlabelled: its date would sit on top of the kit's Stichtag label.
            { value: SLIDER_MAX },
          ]}
        />
      </div>
      <section className="w4-checks" aria-label={pack.bench.panel} data-w4-checks="">
        <p className="w4-checks-head">
          <span>{pack.bench.panel}</span>
          <span className="w4-checks-verdict" data-w4-may={result.mayGoOut ? "yes" : "no"}>
            <StatusGlyph status={result.status} size={16} />
            {result.mayGoOut ? pack.bench.mayGoOut : pack.bench.mayNot}
          </span>
        </p>
        <ul>
          {CHECKS.map((id) => {
            const status = result.checks[id];
            return (
              <li key={`${id}-${status}`} className="w4-check" data-w4-check={id} data-status={status}>
                <StatusGlyph status={status} label={pack.statuses[status]} size={16} />
                <span className="w4-check-name">{pack.checkNames[id]}</span>
                <span className="w4-check-text">{checkSentence(pack, fmt, id, levers, result, date)}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
