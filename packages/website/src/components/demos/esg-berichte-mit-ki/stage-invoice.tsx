"use client";

import type { Locale } from "@/lib/i18n/locale";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/export";
import { formatNumber, type Figures } from "@/lib/demo-cases/esg-berichte-mit-ki/figures";
import { SEPTEMBER_INVOICE, STROM } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import { affectedBy, LEDGER } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import { cascadeAt } from "@/lib/demo-cases/esg-berichte-mit-ki/motion";
import { meterCheck } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";
import { MonthStrip, StatusGlyph } from "./parts";

const AFFECTED = affectedBy("strom");

/** The late invoice, drawn as HTML (nachreichung/rechnung-EL-25-09.png). */
export function InvoiceCard({ pack, locale, compact = false }: { readonly pack: Pack; readonly locale: Locale; readonly compact?: boolean }) {
  const n = (value: number, digits = 0) => formatNumber(value, locale, digits);
  if (compact) {
    return (
      <p className="nw-invoice-compact">
        <span className="nw-invoice-title">{pack.invoice.title}</span>
        <span className="nw-invoice-kwh">{n(SEPTEMBER_INVOICE.kwh)} kWh</span>
      </p>
    );
  }
  return (
    <div className="nw-invoice">
      <p className="nw-invoice-title">{pack.invoice.title}</p>
      <p className="nw-invoice-sub">{pack.invoice.period}</p>
      <dl className="nw-invoice-rows">
        <dt>{pack.invoice.meterOld}</dt>
        <dd>{n(SEPTEMBER_INVOICE.meterOld)}</dd>
        <dt>{pack.invoice.meterNew}</dt>
        <dd>{n(SEPTEMBER_INVOICE.meterNew)}</dd>
        <dt>{pack.invoice.kwh}</dt>
        <dd>{n(SEPTEMBER_INVOICE.kwh)} kWh</dd>
        <dt>{pack.invoice.price}</dt>
        <dd>{n(SEPTEMBER_INVOICE.tariff, 2)} MKD/kWh</dd>
        <dt>{pack.invoice.total}</dt>
        <dd>{n(SEPTEMBER_INVOICE.totalMkd)} MKD</dd>
      </dl>
      <p className="nw-invoice-sub">{pack.invoice.mix}</p>
    </div>
  );
}

/** Beat 6: "Rechnung ablegen" and the cascade over the six answers that cite the electricity file. */
export function InvoiceStage({
  pack,
  locale,
  figures,
  t,
  filed,
}: {
  readonly pack: Pack;
  readonly locale: Locale;
  readonly figures: Figures;
  readonly t: number;
  readonly filed: boolean;
}) {
  if (!filed) {
    return (
      <div className="nw-stage nw-invoice-stage" data-scene="rechnung">
        <InvoiceCard pack={pack} locale={locale} />
      </div>
    );
  }
  const frame = cascadeAt(t);
  const check = meterCheck(SEPTEMBER_INVOICE.meterOld, SEPTEMBER_INVOICE.meterNew, SEPTEMBER_INVOICE.kwh);
  const n = (value: number, digits = 0) => formatNumber(value, locale, digits);
  const meterLine = fill(check.matches ? pack.invoice.meterCheck : pack.invoice.meterMismatch, {
    new: n(SEPTEMBER_INVOICE.meterNew),
    old: n(SEPTEMBER_INVOICE.meterOld),
    kwh: n(SEPTEMBER_INVOICE.kwh),
    difference: n(check.difference),
  });
  return (
    <div className="nw-stage" data-scene="kaskade">
      <InvoiceCard pack={pack} locale={locale} compact />
      <p className="nw-meter" style={{ opacity: frame.meter }}>
        {meterLine}
      </p>
      <div className="nw-cascade-energy" style={{ opacity: Math.max(frame.move, 0.4) }}>
        <MonthStrip
          rows={STROM}
          monthsShort={pack.three.monthsShort}
          twice={pack.three.twice}
          filled={{ month: 9, amount: SEPTEMBER_INVOICE.kwh, t: frame.insert }}
        />
        <p className="nw-total">
          <span className="nw-total-label">{pack.invoice.total2025}</span>
          <span className="nw-total-figure" data-cascade-total="">
            {n(frame.totalMwh, 1)} MWh
          </span>
          <span className="nw-total-label">{fill(pack.invoice.monthsLine, { months: frame.months })}</span>
        </p>
      </div>
      <ul className="nw-cascade">
        {AFFECTED.map((id, index) => {
          const row = LEDGER.find((entry) => entry.id === id)!;
          const shown = index < frame.rows;
          const flips = row.before !== row.after;
          return (
            <li key={id} className="nw-cascade-row" data-shown={shown ? "" : undefined} data-flipped={shown && flips ? "" : undefined}>
              <span className="nw-cell-id">{id}</span>
              <StatusGlyph status={row.before} size={12} />
              <span aria-hidden="true">→</span>
              <StatusGlyph status={shown ? row.after : row.before} size={12} />
              <span className="nw-cascade-why">
                {shown ? `${flips ? pack.invoice.becomes : pack.invoice.stays}: ${fill(pack.invoice.cascade[id as keyof Pack["invoice"]["cascade"]], figures)}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
