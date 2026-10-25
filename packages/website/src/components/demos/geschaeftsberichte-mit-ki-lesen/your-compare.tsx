import { useState } from "react";
import { applyPaste, prefill, type Derived, type OwnState } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/compare-state";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { fill, formatMoney, formatNumber, formatPercent } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";
import { parseMonth, parsePaste } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/parse";
import { noCalendarShare, verdictText } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/takeaway";
import { SwitchTwo } from "./switch-two";

interface Props {
  readonly pack: DemoPack;
  readonly own: OwnState;
  readonly derived: Derived;
  readonly onChange: (patch: Partial<OwnState>) => void;
  readonly onReplace: (next: OwnState) => void;
  readonly onStart: () => void;
}

type Side = "A" | "B";

const pad = (month: number) => String(month).padStart(2, "0");

/**
 * Month and year as two native selects: names come from the language pack, so
 * a German page never shows "October", nothing clips at 360 px, and the value
 * cannot be mistyped. Stored as "YYYY-MM", the format parseMonth reads.
 */
function MonthPick({ side, raw, pack, onPick }: { readonly side: Side; readonly raw: string; readonly pack: DemoPack; readonly onPick: (key: string) => void }) {
  const t = pack.cmp;
  const parsed = parseMonth(raw) ?? { year: 2023, month: 1 };
  const first = Math.min(2015, parsed.year);
  const last = Math.max(2035, parsed.year);
  const years = Array.from({ length: last - first + 1 }, (_, index) => first + index);
  return (
    <div className="mg-pick">
      <label className="mg-field">
        <span>{fill(t.monthLabel, { x: side })}</span>
        <select lang={pack.locale} value={parsed.month} onChange={(event) => onPick(`${parsed.year}-${pad(Number(event.target.value))}`)}>
          {pack.months.map((name, index) => (
            <option key={name} value={index + 1}>{name}</option>
          ))}
        </select>
      </label>
      <label className="mg-field">
        <span>{fill(t.yearLabel, { x: side })}</span>
        <select lang={pack.locale} value={parsed.year} onChange={(event) => onPick(`${event.target.value}-${pad(parsed.month)}`)}>
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Four numbers in, one result card out, recomputed on every keystroke (a pure function of the fields). */
export function YourCompare({ pack, own, derived, onChange, onReplace, onStart }: Props) {
  const t = pack.cmp;
  const days = own.unit !== "weeks";
  const calendar = own.unit === "cdays";
  const [pasteNote, setPasteNote] = useState<string>("");
  const word = (side: Side) => (side === "A" ? "a" : "b");

  const edit = (patch: Partial<OwnState>) => {
    onStart();
    onChange({ ...patch, edited: true });
  };

  const pasted = (text: string) => {
    onStart();
    if (text.trim() === "") {
      onChange({ paste: text });
      setPasteNote("");
      return;
    }
    const parsed = parsePaste(text, pack.locale);
    if (!parsed.ok) {
      onChange({ paste: text });
      setPasteNote(
        parsed.reason === "empty"
          ? t.pasteEmpty
          : fill(t.pasteThin, { n: parsed.needed, x: parsed.found.join(", ") || "0" }),
      );
      return;
    }
    const next = { ...applyPaste(own, parsed, pack), paste: text };
    onReplace(next);
    const names = fill(t.pasteOk, {
      a: pack.months[parsed.a.month - 1] ?? parsed.a.key,
      b: pack.months[parsed.b.month - 1] ?? parsed.b.key,
      g: t.granularity[parsed.granularity === "daily" && parsed.calendar ? "dailyAll" : parsed.granularity],
    });
    const extra = parsed.granularity === "monthly" ? ` ${t.pasteMonthly}` : "";
    setPasteNote(names + extra);
  };

  const column = (side: Side) => {
    const key = word(side);
    const val = (side === "A" ? own.aVal : own.bVal);
    const count = (side === "A" ? own.aN : own.bN);
    const month = side === "A" ? own.aMonth : own.bMonth;
    const hol = side === "A" ? own.aHol : own.bHol;
    const n = side === "A" ? derived.countA : derived.countB;
    const unit = t.unitW;
    const bad = derived.flagged;
    const gap = side === "A" ? own.aGap : own.bGap;
    return (
      <div className="mg-col" data-side={side}>
        {!days && (
          <label className="mg-field">
            <span>{fill(t.nameLabel, { x: side })}</span>
            <input
              type="text"
              value={side === "A" ? own.nameA : own.nameB}
              maxLength={24}
              autoComplete="off"
              onChange={(event) => edit(side === "A" ? { nameA: event.target.value } : { nameB: event.target.value })}
            />
          </label>
        )}
        {days && (
          <MonthPick
            side={side}
            raw={month}
            pack={pack}
            onPick={(key) => edit(side === "A" ? { aMonth: key } : { bMonth: key })}
          />
        )}
        <label className="mg-field">
          <span>{fill(t.valueLabel, { x: side })}</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={val}
            placeholder={fill(t.valuePlaceholder, { x: side })}
            aria-invalid={bad.includes(`${key}Val` as "aVal")}
            onChange={(event) => edit(side === "A" ? { aVal: event.target.value } : { bVal: event.target.value })}
          />
        </label>
        {!days ? (
          <label className="mg-field">
            <span>{`${unit} ${side}`}</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={count}
              placeholder={fill(t.countPlaceholder, { x: side })}
              aria-invalid={bad.includes(`${key}N` as "aN")}
              onChange={(event) => edit(side === "A" ? { aN: event.target.value } : { bN: event.target.value })}
            />
          </label>
        ) : (
          <div className="mg-field">
            <span id={`mg-hol-${key}`}>{fill(calendar ? t.holLabelC : t.holLabel, { x: side })}</span>
            <div className="mg-stepper" role="group" aria-labelledby={`mg-hol-${key}`}>
              <button type="button" className="mg-btn" aria-label={fill(calendar ? t.holDownC : t.holDown, { x: side })} onClick={() => edit(side === "A" ? { aHol: Math.max(0, hol - 1) } : { bHol: Math.max(0, hol - 1) })}>-</button>
              <output>{hol}</output>
              <button type="button" className="mg-btn" aria-label={fill(calendar ? t.holUpC : t.holUp, { x: side })} onClick={() => edit(side === "A" ? { aHol: hol + 1 } : { bHol: hol + 1 })}>+</button>
            </div>
            <span className="mg-hint">{n === null ? "" : fill(calendar ? t.daysCountC : t.daysCount, { n })}</span>
            {gap > 0 && hol === gap && (
              <p role="status" className="mg-flag">
                {gap === 1 ? (calendar ? t.pasteGapCOne : t.pasteGapOne) : fill(calendar ? t.pasteGapC : t.pasteGap, { n: gap })}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const r = derived.result;
  const u = pack.unit[own.unit].one;
  const money = (eur: number) => formatMoney(eur, pack.locale, pack.money);
  // The calendar's share of a rise; for a fall (no share exists) the signed gap between the two numbers, never "none" when they differ.
  const gapPoints = r.ok ? (r.p - r.h) * 100 : 0;
  const share = !r.ok
    ? ""
    : r.verdict === "reverse"
      ? t.shareReverse
      : r.h <= 0
        ? Math.abs(gapPoints) < 0.05
          ? t.shareNone
          : `${formatNumber(gapPoints, pack.locale, { digits: 1, sign: true })}\u202f${t.pp}`
        : noCalendarShare(r.s)
          ? t.shareNone
          : `${Math.round((r.s ?? 0) * 100)}\u202f%`;

  const wordShare = r.ok && !/\d/.test(share);

  return (
    <section className="mg-card mg-compare" aria-labelledby="mg-cmp-h">
      <div className="mg-cmp-head">
        <h2 id="mg-cmp-h" className="mg-h">{t.h}</h2>
        <p className="mg-tag" data-own={own.edited ? "" : undefined}>{own.edited ? t.own : t.example}</p>
      </div>
      <p className="mg-lede">{t.intro}</p>
      <SwitchTwo
        id="mg-unit"
        label={t.unitLabel}
        options={[t.unitW, calendar ? t.unitC : t.unitD]}
        value={days ? 1 : 0}
        onChange={(value) => edit({ unit: value === 1 ? (calendar ? "cdays" : "days") : "weeks" })}
      />
      <div className="mg-cols">
        {column("A")}
        {column("B")}
      </div>
      <label className="mg-field mg-metric">
        <span>{t.metricLabel}</span>
        <input type="text" value={own.metric} maxLength={30} autoComplete="off" onChange={(event) => edit({ metric: event.target.value })} />
      </label>
      {/* One message only: a scale word (Mio) is why the value is missing, so it replaces the generic "missing" note. */}
      {derived.scale.length > 0 ? (
        <p role="alert" className="mg-alert">{t.scaleWord}</p>
      ) : !r.ok ? (
        <p role="alert" className="mg-alert">{derived.note}</p>
      ) : (
        <div className="mg-result" aria-label={t.rowHead} role="group">
          <dl>
            <div>
              <dt>{t.headline}</dt>
              <dd className="mg-big">{formatPercent(r.h, pack.locale, { auto: true })}</dd>
            </div>
            <div>
              <dt>{fill(t.perUnit, { u })}</dt>
              <dd className="mg-big">{formatPercent(r.p, pack.locale, { auto: true })}</dd>
            </div>
            {/* A word (Gegenrichtung, keiner) is set small and bold under its label; only numbers get the big numeric style. */}
            <div className={wordShare ? "mg-stack" : undefined}>
              <dt>{r.h <= 0 ? t.gap : t.share}</dt>
              <dd className={wordShare ? "mg-word" : "mg-big"}>{share}</dd>
            </div>
          </dl>
          <p className="mg-small">
            {`${money(r.aPer)} / ${money(r.bPer)} (${u})`}
          </p>
          {derived.facts && (
            <p className="mg-sentence mg-strong" aria-live="polite">{verdictText(pack, derived.facts, true)}</p>
          )}
          <p className="mg-note">{own.unit === "weeks" ? t.honestyWeeks : calendar ? t.honestyCDays : t.honestyDays}</p>
          <p className="mg-hint">{t.thresholds}</p>
        </div>
      )}
      <div className="mg-paste">
        <label className="mg-field">
          <span>{t.paste}</span>
          <textarea
            rows={3}
            value={own.paste}
            placeholder={t.pastePlaceholder}
            spellCheck={false}
            onChange={(event) => pasted(event.target.value)}
          />
        </label>
        <p className="mg-hint">{t.pasteHint}</p>
        {pasteNote !== "" && <p role="status" className="mg-note">{pasteNote}</p>}
      </div>
      <button type="button" className="mg-btn mg-reset" onClick={() => { onStart(); onReplace(prefill(pack)); setPasteNote(""); }}>
        {t.reset}
      </button>
    </section>
  );
}

