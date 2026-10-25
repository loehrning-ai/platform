import "server-only";

import type { Locale } from "@/lib/i18n/locale";

/**
 * The words of the Monatsgrenze demo, both languages. Server only: index.tsx
 * picks one pack and passes it to the client demo as props, so the browser
 * bundle carries a single language (checked by demo-contract.test.ts). A pack
 * is plain data: strings, numbers, arrays and objects, no functions. Templates
 * use {name} placeholders that format.ts `fill` replaces.
 */
interface UnitWords {
  readonly one: string;
  readonly many: string;
  /** Dative singular and plural, for "bei 12 Arbeitstagen". English repeats the plain forms. */
  readonly oneDat: string;
  readonly manyDat: string;
  readonly label: string;
}

export interface DemoPack {
  readonly locale: Locale;
  readonly money: { readonly mio: string; readonly full: string };
  readonly numWords: readonly string[];
  readonly months: readonly string[];
  readonly spoken: { readonly plus: string; readonly minus: string; readonly percent: string };
  readonly unit: {
    readonly weeks: UnitWords;
    readonly days: UnitWords;
    /** All calendar days of a month (a paste with weekend rows). */
    readonly cdays: UnitWords;
  };
  readonly stage: {
    readonly sub: string;
    readonly region: string;
    readonly weeks: string;
    readonly nudgeL: string;
    readonly nudgeR: string;
    readonly sw1: string;
    readonly sw2: string;
    readonly switchLabel: string;
    readonly handleLabel: string;
    readonly handleValue: string;
    readonly handleValuePer: string;
    readonly rulerCap: string;
    readonly minWeeks: string;
    readonly attr: string;
    readonly spanHead: string;
    readonly rulerAlt: string;
    readonly unitsNote: string;
    readonly stampOne: string;
    readonly stampMany: string;
    readonly stampNeg: string;
    readonly stampPerNeg: string;
    readonly hint: string;
    readonly ask: string;
    readonly monthA: string;
    readonly monthB: string;
    readonly weekCount: string;
    readonly mean: string;
    readonly tableCaption: string;
    readonly tableHead: readonly string[];
    readonly chartAlt: string;
    readonly live: string;
    readonly room: string;
  };
  readonly act2: {
    readonly h: string;
    readonly intro: string;
    readonly sw1: string;
    readonly sw2: string;
    readonly switchLabel: string;
    readonly lead: string;
    readonly mult: string;
    readonly close: string;
    readonly vp: string;
    readonly trig: string;
    readonly trigLabel: string;
    readonly trigDown: string;
    readonly trigUp: string;
    readonly trigValue: string;
    readonly trigTag: string;
    readonly trigHint: string;
    readonly payoff: string;
    readonly rowAlt: string;
    readonly scaleCount: string;
    readonly scaleRate: string;
    readonly live: string;
  };
  readonly verdict: {
    readonly calendarOne: string;
    readonly calendarMany: string;
    readonly calendarDayOne: string;
    readonly calendarDayMany: string;
    readonly calendarCDayOne: string;
    readonly calendarCDayMany: string;
    readonly mixed: string;
    readonly real: string;
    readonly equal: string;
    readonly flat: string;
    readonly none: string;
    readonly reverse: string;
    readonly shrinks: string;
    readonly downWorse: string;
    readonly downPart: string;
    readonly downFlips: string;
    readonly downSame: string;
    readonly thin: string;
  };
  readonly cmp: {
    readonly h: string;
    readonly intro: string;
    readonly example: string;
    readonly own: string;
    readonly reset: string;
    readonly nameLabel: string;
    readonly valueLabel: string;
    readonly valuePlaceholder: string;
    readonly countPlaceholder: string;
    readonly unitLabel: string;
    readonly unitW: string;
    readonly unitD: string;
    readonly monthLabel: string;
    readonly holLabel: string;
    readonly holDown: string;
    readonly holUp: string;
    readonly daysCount: string;
    readonly metricLabel: string;
    readonly rowHead: string;
    readonly headline: string;
    readonly perUnit: string;
    readonly share: string;
    readonly shareNone: string;
    readonly shareReverse: string;
    readonly gap: string;
    readonly pp: string;
    readonly yearLabel: string;
    readonly thresholds: string;
    readonly honestyWeeks: string;
    readonly honestyDays: string;
    readonly honestyCDays: string;
    readonly unitC: string;
    readonly daysCountC: string;
    readonly holLabelC: string;
    readonly holDownC: string;
    readonly holUpC: string;
    readonly pasteGapC: string;
    readonly pasteGapCOne: string;
    readonly thin: string;
    readonly notNumber: string;
    readonly countMin: string;
    readonly valuePos: string;
    readonly tooMany: string;
    readonly tooBig: string;
    readonly fieldNames: { readonly aVal: string; readonly aN: string; readonly bVal: string; readonly bN: string };
    readonly scaleWord: string;
    readonly paste: string;
    readonly pasteHint: string;
    readonly pastePlaceholder: string;
    readonly pasteEmpty: string;
    readonly pasteThin: string;
    readonly pasteOk: string;
    readonly pasteMonthly: string;
    readonly pasteGap: string;
    readonly pasteGapOne: string;
    readonly granularity: { readonly daily: string; readonly dailyAll: string; readonly weekly: string; readonly monthly: string };
  };
  readonly take: {
    readonly h: string;
    readonly intro: string;
    readonly empty: string;
    readonly sentenceLabel: string;
    readonly promptLabel: string;
    readonly rulesLabel: string;
    readonly copySentence: string;
    readonly copyPrompt: string;
    readonly copyRules: string;
    readonly dlRules: string;
    readonly copied: string;
    readonly copyFailed: string;
    readonly downloaded: string;
    readonly fileName: string;
    readonly metric: string;
    readonly s1: string;
    readonly inMonth: string;
    readonly inOther: string;
    readonly countsMonth: string;
    readonly countsOther: string;
    readonly per: string;
    readonly limit: string;
    readonly attr: string;
    readonly prompt: string;
    readonly rules: {
      readonly title: string;
      readonly lead: string;
      readonly r1h: string;
      readonly r1: string;
      readonly r1proof: string;
      readonly r1share: string;
      readonly r2h: string;
      readonly r2: string;
      readonly r2proof: string;
      readonly r3h: string;
      readonly r3: string;
      readonly r3trigger: string;
      readonly r3gap: string;
      readonly r4h: string;
      readonly r4: string;
    };
  };
}

export const COPY = {
  de: {
    locale: "de",
    money: { mio: "{v} Mio. €", full: "{v} €" },
    numWords: ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"],
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    spoken: { plus: "plus", minus: "minus", percent: "Prozent" },
    unit: {
      weeks: { one: "Lieferwoche", many: "Lieferwochen", oneDat: "Lieferwoche", manyDat: "Lieferwochen", label: "Lieferwochen" },
      days: { one: "Arbeitstag", many: "Arbeitstage", oneDat: "Arbeitstag", manyDat: "Arbeitstagen", label: "Arbeitstage" },
      cdays: { one: "Kalendertag", many: "Kalendertage", oneDat: "Kalendertag", manyDat: "Kalendertagen", label: "Kalendertage" },
    },
    stage: {
      sub: "September gegen August, neun Lieferwochen",
      region: "Monatsgrenze: Schlagzeile und Umsatz der neun Lieferwochen",
      weeks: "Wochen: {a} | {b}",
      nudgeL: "Linie nach links",
      nudgeR: "Linie nach rechts",
      sw1: "Gesamt",
      sw2: "Pro Woche",
      switchLabel: "Rechnen als",
      handleLabel: "Monatsgrenze zwischen den Lieferwochen",
      handleValue: "Schnitt nach Woche {k}, Schlagzeile {h}",
      handleValuePer: "Schnitt nach Woche {k}, pro Woche {p}",
      rulerCap: "Neun Wochen, ein Beispiel. Jede Verschiebung um eine ganze Woche.",
      minWeeks: "Mindestens drei Wochen je Seite.",
      attr: "Wochen zugeordnet nach Startdatum.",
      spanHead: "Spanne {a} bis {b}",
      rulerAlt: "Spanne der Schlagzeilen: {a} bis {b} Prozent; pro Woche {c} bis {d} Prozent.",
      unitsNote: "Nach Stück: {x}",
      stampOne: "Rund {s} % des Anstiegs sind die zusätzliche Woche.",
      stampMany: "Rund {s} % des Anstiegs sind die {n} zusätzlichen Wochen.",
      stampNeg: "Hier schrumpft der Bericht. Der Kalender dreht das Vorzeichen.",
      hint: "Schieb die Linie. Dann tippe auf Pro Woche.",
      ask: "Stimmt das?",
      stampPerNeg: "Pro Woche passiert hier fast nichts ({p}). Die {h} der Schlagzeile waren Kalender.",
      monthA: "August",
      monthB: "September",
      weekCount: "{n} Wochen",
      mean: "Ø {v}",
      tableCaption: "Die neun Lieferwochen von NORTHWIND",
      tableHead: ["Wochenstart", "Umsatz in Euro", "Stück"],
      chartAlt: "Neun Lieferwochen als Blöcke, aufgeteilt auf zwei Monate.",
      live: "Schnitt {a} | {b}. Schlagzeile {h}, pro Woche {p}.",
      room: "Raum-Modus",
    },
    act2: {
      h: "Gleiche Bewegung, anderer Befund",
      intro: "Defektmeldungen im September, nach Linie.",
      sw1: "Stück",
      sw2: "pro 1.000 Stück",
      switchLabel: "Defektmeldungen zählen als",
      lead: "CRAFT liegt {x} % vor NEST.",
      mult: "CRAFT hat das {x}-Fache der nächstschlechten Linie.",
      close: "Nach Stück liegt CRAFT knapp vor NEST. Pro 1.000 Stück ist es das {x}-Fache.",
      vp: "Wo die Vertriebsleitung recht hat: CRAFT verbesserte sich von 3,21 auf 2,51 je 1.000 Stück, als einzige Linie.",
      trig: "Freigabe, wenn Oktober unter {x} je 1.000 Stück und Ausschuss unter 8 % des Umsatzes liegt.",
      trigLabel: "Auslöser je 1.000 Stück",
      trigDown: "Auslöser um 0,10 senken",
      trigUp: "Auslöser um 0,10 erhöhen",
      trigValue: "Auslöser {x} je 1.000 Stück",
      trigTag: "Auslöser {x}",
      trigHint: "Tippe auf pro 1.000 Stück, dann setzt du hier den Auslöser.",
      payoff: "Das Wachstum war Kalender. Das Defektproblem bleibt.",
      rowAlt: "{line}: {records} Defektmeldungen, {rate} je 1.000 Stück",
      scaleCount: "Defektmeldungen",
      scaleRate: "je 1.000 Stück",
      live: "Defektmeldungen {mode}. {sentence}",
    },
    verdict: {
      calendarOne: "Rund {s} % des Anstiegs sind die zusätzliche Woche.",
      calendarMany: "Rund {s} % des Anstiegs sind die {n} zusätzlichen Wochen.",
      calendarDayOne: "Rund {s} % des Anstiegs ist der zusätzliche Arbeitstag.",
      calendarDayMany: "Rund {s} % des Anstiegs sind die {n} zusätzlichen Arbeitstage.",
      calendarCDayOne: "Rund {s} % des Anstiegs ist der zusätzliche Kalendertag.",
      calendarCDayMany: "Rund {s} % des Anstiegs sind die {n} zusätzlichen Kalendertage.",
      mixed: "Etwa {s} % des Anstiegs erklärt der Kalender, der Rest ist Wachstum.",
      real: "Der Kalender erklärt nur {s} %: das Wachstum ist überwiegend real.",
      equal: "Beide Zeiträume sind gleich lang: der Kalender erklärt nichts.",
      flat: "Die Schlagzeile ist unverändert; pro {u} ergibt sich {p}.",
      none: "Der Kalender erklärt nichts vom Anstieg. Pro {u} sind es {p}.",
      reverse: "Der Kalender wirkt hier in die Gegenrichtung: der spätere Zeitraum hat weniger {units}, pro {u} ist das Wachstum höher ({p}).",
      shrinks: "Pro {u} sinkt der Wert ({p}); die Schlagzeile ist ein Kalendereffekt.",
      downWorse: "Pro {u} fällt es noch stärker ({p}): der Kalender hat den Rückgang verdeckt.",
      downPart: "Ein Teil des Rückgangs ist Kalender: pro {u} sind es {p}.",
      downFlips: "Pro {u} sind es {p}: der Rückgang ist Kalender.",
      downSame: "Der Kalender ändert hier nichts: pro {u} sind es ebenfalls {p}.",
      thin: "Zu wenig Daten für ein Urteil.",
    },
    cmp: {
      h: "Dein Vergleich",
      intro: "Zwei Zeiträume, vier Zahlen. Das Ergebnis rechnet bei jeder Eingabe mit.",
      example: "Beispiel: NORTHWIND",
      own: "Deine Zahlen",
      reset: "Zurück zum Beispiel",
      nameLabel: "Name Zeitraum {x}",
      valueLabel: "Wert {x}",
      valuePlaceholder: "Wert Monat {x}",
      countPlaceholder: "Anzahl {x}",
      unitLabel: "Einheit",
      unitW: "Lieferwochen",
      unitD: "Arbeitstage",
      monthLabel: "Monat {x}",
      holLabel: "Feiertage {x}",
      holDown: "Einen Feiertag weniger {x}",
      holUp: "Einen Feiertag mehr {x}",
      daysCount: "{n} Arbeitstage",
      metricLabel: "Wofür stehen die Werte? (zum Beispiel Umsatz)",
      rowHead: "Ergebnis",
      headline: "Schlagzeile",
      perUnit: "Pro {u}",
      share: "Kalenderanteil",
      shareNone: "keiner",
      shareReverse: "Gegenrichtung",
      gap: "Unterschied",
      pp: "PP",
      yearLabel: "Jahr {x}",
      thresholds: "Ab 80 % Kalender, 30 bis 80 % gemischt, darunter echtes Wachstum.",
      honestyWeeks: "Gerechnet pro Lieferwoche, gleich lange Wochen angenommen. Feiertage, Aktionen und Lieferrhythmus bleiben unberücksichtigt.",
      honestyDays: "Gerechnet pro Arbeitstag (Montag bis Freitag minus deine Feiertage). Aktionen und Lieferrhythmus bleiben unberücksichtigt.",
      honestyCDays: "Gerechnet pro Kalendertag (alle Tage des Monats minus deine freien Tage). Aktionen und Lieferrhythmus bleiben unberücksichtigt.",
      unitC: "Kalendertage",
      daysCountC: "{n} Kalendertage",
      holLabelC: "Freie Tage {x}",
      holDownC: "Einen freien Tag weniger {x}",
      holUpC: "Einen freien Tag mehr {x}",
      pasteGapCOne: "Aus deiner Einfügung: 1 Tag ohne Wert zählt als frei. Ändere das mit den Knöpfen.",
      pasteGapC: "Aus deiner Einfügung: {n} Tage ohne Wert zählen als frei. Ändere das mit den Knöpfen.",
      thin: "Zu wenig Daten. Es fehlt: {x}.",
      notNumber: "{x}: keine Zahl erkannt.",
      countMin: "{x} muss mindestens 1 sein.",
      valuePos: "{x} muss größer als 0 sein.",
      tooMany: "Eine Anzahl über {n} ist hier kaum gemeint (Wochen oder Tage, nicht Stück?). Prüfe: {x}.",
      tooBig: "Ein Anstieg über 10.000 % ist kaum gemeint. Prüfe, ob beide Werte im selben Maß stehen (Euro, nicht Mio.; gleiche Spalte).",
      fieldNames: { aVal: "Wert A", aN: "Anzahl A", bVal: "Wert B", bN: "Anzahl B" },
      scaleWord: "Bitte die volle Zahl eingeben, ohne Mio. oder Tsd.",
      paste: "Optional: Zeilen aus Excel einfügen (Datum, Wert)",
      pasteHint: "Füllt die Felder oben. Alles bleibt auf deinem Gerät.",
      pastePlaceholder: "02.09.2023\t4409249",
      pasteEmpty: "Keine Zeile mit Datum und Wert gefunden. Erwartet: 02.09.2023, Tab, 4409249.",
      pasteThin: "Zu wenig Daten: ich brauche mindestens zwei Monate mit je {n} Werten. Gefunden: {x}.",
      pasteOk: "{a} und {b} übernommen ({g}). Prüfe die Felder.",
      pasteMonthly: "Monatswerte erkannt: trage die Anzahl selbst ein.",
      pasteGapOne: "Aus deiner Einfügung: 1 Arbeitstag ohne Wert zählt als Feiertag. Ändere das mit den Knöpfen.",
      pasteGap: "Aus deiner Einfügung: {n} Arbeitstage ohne Wert zählen als Feiertage. Ändere das mit den Knöpfen.",
      granularity: { daily: "Tageswerte, Mo bis Fr", dailyAll: "Tageswerte inklusive Sa und So", weekly: "Wochenwerte", monthly: "Monatswerte" },
    },
    take: {
      h: "Mitnehmen",
      intro: "Aus deinen Zahlen gebaut. Alles steht in voller Länge da, bevor du es kopierst.",
      empty: "Fülle oben die Felder, dann entsteht hier dein Satz.",
      sentenceLabel: "Berichtssatz",
      promptLabel: "Prompt für deine KI",
      rulesLabel: "Regeldatei",
      copySentence: "Satz kopieren",
      copyPrompt: "Prompt kopieren",
      copyRules: "Regeln kopieren",
      dlRules: "Regeldatei laden",
      copied: "Kopiert",
      copyFailed: "Kopieren nicht möglich. Markiere den Text und kopiere ihn selbst.",
      downloaded: "Datei geladen",
      fileName: "regeln-fuer-meine-berichte.md",
      metric: "Umsatz",
      s1: "{metric} {b}: {vb} gegenüber {va} {inA} ({h}).",
      inMonth: "im {a}",
      inOther: "in {a}",
      countsMonth: "Der {b} hat {nb} {units}, der {a} {na}.",
      countsOther: "{b} hat {nb} {units}, {a} {na}.",
      per: "Pro {u}: {pb} gegenüber {pa} ({p}).",
      limit: "Vergleichbar heißt nicht richtig: Feiertage und Aktionen sind nicht berücksichtigt.",
      attr: "Zugeordnet nach Startdatum der Woche.",
      prompt:
        "Lies zuerst {file}. Der Bericht nennt {h} für {b} gegenüber {a} ({va} bei {na} {units}, {vb} bei {nb}). Prüfe aus meinen Rohdaten, ob die Monate vergleichbar sind. Rechne pro {u}, zeig deinen Rechenweg, nenne die Datei und die Spalte, aus der du es hast, und sag mir, wie viel der {h} übrig bleibt. Wo du etwas nicht prüfen kannst, schreib 'nicht prüfbar' und warum.",
      rules: {
        title: "# Regeln für meine Berichte",
        lead: "Lies diese Datei, bevor du einen Bericht liest. Gilt für jede Zahl, die ich dir gebe.",
        r1h: "## {n}. Gleich lange Zeiträume",
        r1: "Zähle vor jedem Vergleich die Lieferwochen (oder Arbeitstage) beider Monate. Nenne die Schlagzeile UND den Wert pro {u}.",
        r1proof: "Beleg: {a}/{b}: {h} wurden {p}.",
        r1share: "Der Kalender erklärt rund {s} %.",
        r2h: "## {n}. Das Richtige im Nenner",
        r2: "Zähle Defektmeldungen je 1.000 ausgelieferte Stück, nie die Rohzahl allein.",
        r2proof: "Beleg (Beispiel NORTHWIND): CRAFT {ra} gegen NEST {rb} ({lead}) wurden {pa} gegen {pb} je 1.000 ({mult} x).",
        r3h: "## {n}. Grenze im selben Satz",
        r3: "Sage in jedem Befund, was die Zahl nicht sagt und wann die Entscheidung kippt.",
        r3trigger: "Auslöser (Beispiel NORTHWIND): {m} unter {t} Defektmeldungen je 1.000 Stück und Ausschuss unter 8 % des Umsatzes.",
        r3gap: "Nicht prüfbar mit diesen Daten (Beispiel NORTHWIND): Marge je Produkt, Retouren je Linie. Ersetze das durch deine Lücken.",
        r4h: "## {n}. Schreibweise",
        r4: "Vergleichbar heißt nicht richtig. Wo ein Wert nicht prüfbar ist, schreibe \"nicht prüfbar\" und warum. Nenne Datei und Spalte der Quelle.",
      },
    },
  },
  en: {
    locale: "en",
    money: { mio: "EUR {v}M", full: "EUR {v}" },
    numWords: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    spoken: { plus: "plus", minus: "minus", percent: "percent" },
    unit: {
      weeks: { one: "shipping week", many: "shipping weeks", oneDat: "shipping week", manyDat: "shipping weeks", label: "Shipping weeks" },
      days: { one: "working day", many: "working days", oneDat: "working day", manyDat: "working days", label: "Working days" },
      cdays: { one: "calendar day", many: "calendar days", oneDat: "calendar day", manyDat: "calendar days", label: "Calendar days" },
    },
    stage: {
      sub: "September against August, nine shipping weeks",
      region: "The Month Line: headline and revenue of nine shipping weeks",
      weeks: "Weeks: {a} | {b}",
      nudgeL: "Move line left",
      nudgeR: "Move line right",
      sw1: "Total",
      sw2: "Per week",
      switchLabel: "Work out as",
      handleLabel: "Month line between the shipping weeks",
      handleValue: "Cut after week {k}, headline {h}",
      handleValuePer: "Cut after week {k}, per week {p}",
      rulerCap: "Nine weeks, one example. Each shift is one whole week.",
      minWeeks: "At least three weeks per side.",
      attr: "Weeks assigned by start date.",
      spanHead: "Range {a} to {b}",
      rulerAlt: "Range of the headlines: {a} to {b} percent; per week {c} to {d} percent.",
      unitsNote: "By units: {x}",
      stampOne: "Around {s} % of the increase is the extra week.",
      stampMany: "Around {s} % of the increase is the {n} extra weeks.",
      stampNeg: "Here the report shrinks. The calendar flips the sign.",
      hint: "Drag the line. Then tap Per week.",
      ask: "Is that right?",
      stampPerNeg: "Per week almost nothing happens here ({p}). The {h} of the headline was calendar.",
      monthA: "August",
      monthB: "September",
      weekCount: "{n} weeks",
      mean: "Avg {v}",
      tableCaption: "The nine shipping weeks of NORTHWIND",
      tableHead: ["Week start", "Revenue in euros", "Units"],
      chartAlt: "Nine shipping weeks as blocks, split into two months.",
      live: "Cut {a} | {b}. Headline {h}, per week {p}.",
      room: "Room mode",
    },
    act2: {
      h: "Same move, different finding",
      intro: "Defect records in September, by line.",
      sw1: "Count",
      sw2: "per 1,000 units",
      switchLabel: "Count defect records as",
      lead: "CRAFT leads NEST by {x} %.",
      mult: "CRAFT is {x} times the next-worst line.",
      close: "By count CRAFT is just ahead of NEST. Per 1,000 units it is {x} times.",
      vp: "Where the VP of Sales is right: CRAFT improved from 3.21 to 2.51 per 1,000 units, the only line that did.",
      trig: "Release if October is below {x} per 1,000 units and scrap under 8 % of revenue.",
      trigLabel: "Trigger per 1,000 units",
      trigDown: "Lower the trigger by 0.10",
      trigUp: "Raise the trigger by 0.10",
      trigValue: "Trigger {x} per 1,000 units",
      trigTag: "Trigger {x}",
      trigHint: "Tap per 1,000 units, then set the trigger here.",
      payoff: "The growth was calendar. The defect problem stays.",
      rowAlt: "{line}: {records} defect records, {rate} per 1,000 units",
      scaleCount: "Defect records",
      scaleRate: "per 1,000 units",
      live: "Defect records {mode}. {sentence}",
    },
    verdict: {
      calendarOne: "Around {s} % of the increase is the extra week.",
      calendarMany: "Around {s} % of the increase is the {n} extra weeks.",
      calendarDayOne: "Around {s} % of the increase is the extra working day.",
      calendarDayMany: "Around {s} % of the increase is the {n} extra working days.",
      calendarCDayOne: "Around {s} % of the increase is the extra calendar day.",
      calendarCDayMany: "Around {s} % of the increase is the {n} extra calendar days.",
      mixed: "About {s} % of the increase is the calendar, the rest is growth.",
      real: "The calendar explains only {s} %: the growth is mostly real.",
      equal: "Both periods are the same length: the calendar explains nothing.",
      flat: "The headline is unchanged; per {u} it comes to {p}.",
      none: "The calendar explains none of the increase. Per {u} it is {p}.",
      reverse: "The calendar works the other way here: the later period has fewer {units}, per {u} the growth is higher ({p}).",
      shrinks: "Per {u} the value falls ({p}); the headline is a calendar effect.",
      downWorse: "Per {u} it falls even harder ({p}): the calendar hid the decline.",
      downPart: "Part of the decline is calendar: per {u} it is {p}.",
      downFlips: "Per {u} it is {p}: the decline is calendar.",
      downSame: "The calendar changes nothing here: per {u} it is also {p}.",
      thin: "Not enough data for a verdict.",
    },
    cmp: {
      h: "Your comparison",
      intro: "Two periods, four numbers. The result updates with every keystroke.",
      example: "Example: NORTHWIND",
      own: "Your numbers",
      reset: "Back to the example",
      nameLabel: "Name of period {x}",
      valueLabel: "Value {x}",
      valuePlaceholder: "Value period {x}",
      countPlaceholder: "Count {x}",
      unitLabel: "Unit",
      unitW: "Shipping weeks",
      unitD: "Working days",
      monthLabel: "Month {x}",
      holLabel: "Holidays {x}",
      holDown: "One holiday fewer {x}",
      holUp: "One holiday more {x}",
      daysCount: "{n} working days",
      metricLabel: "What do the values stand for? (for example revenue)",
      rowHead: "Result",
      headline: "Headline",
      perUnit: "Per {u}",
      share: "Calendar share",
      shareNone: "none",
      shareReverse: "opposite",
      gap: "Difference",
      pp: "pp",
      yearLabel: "Year {x}",
      thresholds: "From 80 % calendar, 30 to 80 % mixed, below that real growth.",
      honestyWeeks: "Worked out per shipping week, equal-length weeks assumed. Holidays, promotions and delivery rhythm are not accounted for.",
      honestyDays: "Worked out per working day (Monday to Friday minus your holidays). Promotions and delivery rhythm are not accounted for.",
      honestyCDays: "Worked out per calendar day (every day of the month minus your days off). Promotions and delivery rhythm are not accounted for.",
      unitC: "Calendar days",
      daysCountC: "{n} calendar days",
      holLabelC: "Days off {x}",
      holDownC: "One day off fewer {x}",
      holUpC: "One day off more {x}",
      pasteGapCOne: "From your paste: 1 day without a value counts as a day off. Change it with the buttons.",
      pasteGapC: "From your paste: {n} days without a value count as days off. Change it with the buttons.",
      thin: "Not enough data. Missing: {x}.",
      notNumber: "{x}: no number recognised.",
      countMin: "{x} must be at least 1.",
      valuePos: "{x} must be greater than 0.",
      tooMany: "A count above {n} is hardly meant here (weeks or days, not units?). Check: {x}.",
      tooBig: "An increase above 10,000 % is hardly meant. Check that both values use the same scale (euros, not millions; same column).",
      fieldNames: { aVal: "Value A", aN: "Count A", bVal: "Value B", bN: "Count B" },
      scaleWord: "Please enter the full number, without M or k.",
      paste: "Optional: paste rows from Excel (date, value)",
      pasteHint: "Fills the fields above. Everything stays on your device.",
      pastePlaceholder: "2023-09-02\t4409249",
      pasteEmpty: "No line with a date and a value found. Expected: 2023-09-02, tab, 4409249.",
      pasteThin: "Not enough data: I need at least two months with {n} values each. Found: {x}.",
      pasteOk: "{a} and {b} filled in ({g}). Check the fields.",
      pasteMonthly: "Monthly values found: enter the count yourself.",
      pasteGapOne: "From your paste: 1 working day without a value counts as a holiday. Change it with the buttons.",
      pasteGap: "From your paste: {n} working days without a value count as holidays. Change it with the buttons.",
      granularity: { daily: "daily values, Mon to Fri", dailyAll: "daily values including Sat and Sun", weekly: "weekly values", monthly: "monthly values" },
    },
    take: {
      h: "Take with you",
      intro: "Built from your numbers. Everything is shown in full before you copy it.",
      empty: "Fill in the fields above, and your sentence appears here.",
      sentenceLabel: "Report sentence",
      promptLabel: "Prompt for your AI",
      rulesLabel: "Rules file",
      copySentence: "Copy sentence",
      copyPrompt: "Copy prompt",
      copyRules: "Copy rules",
      dlRules: "Download rules",
      copied: "Copied",
      copyFailed: "Copying is not possible here. Select the text and copy it yourself.",
      downloaded: "File downloaded",
      fileName: "report-rules.md",
      metric: "Revenue",
      s1: "{metric} {b}: {vb} against {va} {inA} ({h}).",
      inMonth: "in {a}",
      inOther: "in {a}",
      countsMonth: "{b} has {nb} {units}, {a} {na}.",
      countsOther: "{b} has {nb} {units}, {a} {na}.",
      per: "Per {u}: {pb} against {pa} ({p}).",
      limit: "Comparable does not mean right: holidays and promotions are not accounted for.",
      attr: "Weeks assigned by start date.",
      prompt:
        "Read {file} first. The report states {h} for {b} against {a} ({va} at {na} {units}, {vb} at {nb}). Check from my raw data whether the months are comparable. Work per {u}, show your working, name the file and the column you took it from, and tell me how much of the {h} is left. Where you cannot check something, write 'not checkable' and why.",
      rules: {
        title: "# Rules for my reports",
        lead: "Read this file before you read a report. It applies to every number I give you.",
        r1h: "## {n}. Equal-length periods",
        r1: "Before every comparison, count the shipping weeks (or working days) of both months. Give the headline AND the value per {u}.",
        r1proof: "Evidence: {a}/{b}: {h} became {p}.",
        r1share: "The calendar explains around {s} %.",
        r2h: "## {n}. The right denominator",
        r2: "Count defect records per 1,000 units shipped, never the raw count alone.",
        r2proof: "Evidence (example NORTHWIND): CRAFT {ra} against NEST {rb} ({lead}) became {pa} against {pb} per 1,000 ({mult} x).",
        r3h: "## {n}. A limit in the same sentence",
        r3: "In every finding, say what the number does not say and when the decision flips.",
        r3trigger: "Trigger (example NORTHWIND): {m} below {t} defect records per 1,000 units and scrap under 8 % of revenue.",
        r3gap: "Not checkable with this data (example NORTHWIND): margin per product, returns per line. Replace with your own gaps.",
        r4h: "## {n}. Wording",
        r4: "Comparable does not mean right. Where a value is not checkable, write \"not checkable\" and why. Name the file and column of the source.",
      },
    },
  },
} as const satisfies Record<Locale, DemoPack>;
