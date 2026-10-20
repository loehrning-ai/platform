/**
 * Every visible string of "Wo stehe ich?" / "Where do I stand?" that is not
 * model data, in both locales, plus the number format of each. The model's own
 * labels (Branche, Bundesland, Größe, Textmenge, their levels, the source line)
 * come from explorer.json and, for English, from the overlay explorer.en.json
 * (see load.ts and localizeModel in model.ts).
 */

export type ExplorerLocale = "de" | "en";

export interface ExplorerCopy {
  readonly title: string;
  readonly of100: string;
  readonly unit: string;
  readonly meaning: string;
  readonly controlsAria: string;
  readonly privacy: string;
  readonly rescan: string;
  readonly tableAria: string;
  readonly tableBranche: string;
  readonly tableCaption: (fixed: string) => string;
  readonly fieldLabel: (total: string, solid: number, partial: boolean, from: number, to: number) => string;
  readonly under: string;
  readonly lessThan: string;
  readonly about: string;
  readonly to: string;
  readonly support: (n: string) => string;
  readonly noValue: string;
  readonly readout: (estimate: string, interval: string) => string;
  readonly readoutNone: string;
  readonly readoutThin: string;
  readonly group: (n: string) => string;
  readonly sizeWords: (label: string) => string;
  readonly thousands: string;
  readonly decimal: string;
}

export const EXPLORER_COPY: Readonly<Record<ExplorerLocale, ExplorerCopy>> = {
  de: {
    title: "Wo stehe ich?",
    of100: "von 100",
    unit: "1 Quadrat = 0,1 %, Modellschätzung",
    meaning: "Das sagt etwas über Sichtbarkeit, nicht über deinen Einsatz.",
    controlsAria: "Deine Angaben",
    rescan: "Wird mit geprüften Websites neu gerechnet.",
    privacy: "Dein Browser rechnet das allein. Es wird nichts gesendet, gespeichert oder gezählt.",
    tableAria: "Tabelle: Branche mal Textmenge",
    tableBranche: "Branche",
    tableCaption: (fixed) => `Auf einen Blick: Anteile pro 100 Firmen für ${fixed}. In Klammern steht das 95-%-Intervall.`,
    fieldLabel: (total, solid, partial, from, to) =>
      `Feld aus ${total} Quadraten. ${solid} sind gefüllt${partial ? " und eines teilweise" : ""}, der Bereich des 95-%-Intervalls umfasst die Quadrate ${from} bis ${to}.`,
    under: "unter 0,1",
    lessThan: "weniger als 0,1",
    about: "etwa",
    to: "bis",
    support: (n) => `Grundlage: ${n} Firmen.`,
    noValue: "zu wenige Firmen, kein Wert",
    readout: (estimate, interval) =>
      `${estimate.charAt(0).toUpperCase()}${estimate.slice(1)} von 100 GmbH-Startseiten wie deine nennen KI, wahrscheinlich ${interval}.`,
    readoutNone: "Zu wenige Startseiten wie deine, deshalb zeigt das Modell hier keinen Wert.",
    readoutThin: "Es gibt nur wenige Startseiten wie deine, die Schätzung stützt sich auf die Teile.",
    group: (n) => `${n} Firmen in dieser Gruppe`,
    sizeWords: (label) => (/Vertretungsberechtigte/.test(label) ? label : `${label} Vertretungsberechtigte`),
    thousands: ".",
    decimal: ",",
  },
  en: {
    title: "Where do I stand?",
    of100: "of 100",
    unit: "1 square = 0.1 %, model estimate",
    meaning: "This says something about visibility, not about how you use AI.",
    controlsAria: "Your details",
    rescan: "Being recalculated with checked websites.",
    privacy: "Your browser does the maths on its own. Nothing is sent, stored or counted.",
    tableAria: "Table: industry by text length",
    tableBranche: "Industry",
    tableCaption: (fixed) => `At a glance: shares per 100 firms for ${fixed}. The 95 % interval is in brackets.`,
    fieldLabel: (total, solid, partial, from, to) =>
      `Field of ${total} squares. ${solid} are filled${partial ? " and one partly" : ""}, the 95 % interval covers squares ${from} to ${to}.`,
    under: "under 0.1",
    lessThan: "fewer than 0.1",
    about: "about",
    to: "to",
    support: (n) => `Basis: ${n} firms.`,
    noValue: "too few firms, no value",
    readout: (estimate, interval) =>
      `${estimate.charAt(0).toUpperCase()}${estimate.slice(1)} of 100 GmbH homepages like yours mention AI, probably ${interval}.`,
    readoutNone: "Too few homepages like yours, so the model shows no value here.",
    readoutThin: "Only a few homepages are like yours, so the estimate rests on the parts.",
    group: (n) => `${n} firms in this group`,
    sizeWords: (label) => (/representatives/.test(label) ? label : `${label} authorised representatives`),
    thousands: ",",
    decimal: ".",
  },
};
