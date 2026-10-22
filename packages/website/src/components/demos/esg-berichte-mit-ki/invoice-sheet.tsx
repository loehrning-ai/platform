import { INVOICE_EL_25_09 } from "@/lib/demo-cases/esg-berichte-mit-ki/constants";

interface Field {
  readonly mk: string;
  readonly gloss: string;
  readonly value: string;
  readonly mix?: boolean;
}

/** The fields of inbox/4-september-invoice.png, Macedonian labels with the English gloss printed on it. */
const FIELDS: readonly Field[] = [
  { mk: "Бр.", gloss: "invoice no.", value: INVOICE_EL_25_09.number },
  { mk: "Период на фактурирање", gloss: "billing period", value: INVOICE_EL_25_09.period },
  { mk: "Претходна / тековна состојба", gloss: "previous / current reading", value: INVOICE_EL_25_09.printedReadings },
  { mk: "Количина", gloss: "quantity", value: INVOICE_EL_25_09.printedQuantity },
  { mk: "Тарифа", gloss: "tariff", value: INVOICE_EL_25_09.tariff },
  { mk: "Износ", gloss: "amount", value: INVOICE_EL_25_09.amount },
  { mk: "Енергетски микс", gloss: "supply mix", value: INVOICE_EL_25_09.supplyMix, mix: true },
];

interface Props {
  readonly caption: string;
  /** Once read, the supply-mix line gets the Rost bar and this note. */
  readonly mixNote: string | null;
}

/** The September invoice as a typeset sheet: no image, the same fields. */
export function InvoiceSheet({ caption, mixNote }: Props) {
  return (
    <figure className="eb-inv" aria-labelledby="eb-inv-cap">
      <div className="eb-inv-top">
        <p className="eb-inv-from" lang="mk">
          Лумиволт Снабдување ДООЕЛ
        </p>
        <p className="eb-inv-title">
          <span lang="mk">ФАКТУРА</span> <span className="eb-inv-gloss" lang="en">invoice</span>
        </p>
      </div>
      <dl className="eb-inv-fields">
        {FIELDS.map((field) => (
          <div
            key={field.mk}
            className="eb-inv-row"
            data-decisive={field.mix && mixNote ? "" : undefined}
          >
            <dt>
              <span lang="mk">{field.mk}</span> <span className="eb-inv-gloss" lang="en">({field.gloss})</span>
            </dt>
            <dd>
              <span lang={field.mix ? "mk" : undefined}>{field.value}</span>
              {field.mix ? (
                <span className="eb-inv-gloss" lang="en">
                  {" "}
                  (not specified)
                </span>
              ) : null}
              {field.mix && mixNote ? <span className="eb-inv-note">{mixNote}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      <figcaption id="eb-inv-cap" className="eb-inv-cap">
        {caption}
      </figcaption>
    </figure>
  );
}
