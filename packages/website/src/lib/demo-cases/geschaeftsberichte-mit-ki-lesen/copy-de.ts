/**
 * Deutsch: every word of "Die Zahl, die trägt". Imported only by server
 * code (copy.ts); the client receives this object as a prop.
 */

import type { NorthwindCopy } from "./copy-types";

export const de: NorthwindCopy = {
  intro: {
    facts: "4 Stationen · ca. 10 Min. · ohne Konto",
    half: "Das ist die Hälfte des Workshops ohne KI; die andere Hälfte macht Claude im Kit.",
    stationsLabel: "Stationen",
  },
  stationLinks: {
    bericht: "Bericht",
    vergleichen: "1 Vergleichen",
    maengel: "2 Mängel",
    pruefen: "3 Prüfen",
    entscheiden: "4 Entscheide",
    mitnehmen: "Mitnehmen",
  },
  headings: {
    bericht: "Was der Bericht sagt",
    vergleichen: "1 · Vergleichen",
    maengel: "2 · Mängel",
    pruefen: "3 · Prüfen",
    entscheiden: "4 · Entscheide",
    mitnehmen: "Zum Mitnehmen",
  },
  verdict: { holds: "trägt", misleads: "täuscht", absent: "nicht in den Daten" },
  empty: "Wähle eine Antwort.",
  lines: {
    AURA: "AURA",
    CRAFT: "CRAFT",
    ECHO: "ECHO",
    NEST: "NEST",
    BREW: "BREW",
    PULSE: "PULSE",
    BEAM: "BEAM",
    TOTAL: "Firma",
  },
  report: {
    figuresLabel: "Die drei Zahlen, mit denen der Septemberbericht aufmacht",
    figures: [
      { value: "+26\u00a0%", label: "Einheiten gegenüber August", note: "Bericht, Abschnitt 1" },
      {
        value: "4,12\u00a0Mio.\u00a0€",
        label: "CRAFT, auf 9.162 Einheiten, Ø\u00a0450\u00a0€",
        note: "Bericht, Abschnitt 2",
      },
      {
        value: "23",
        label: "Mängelmeldungen bei CRAFT, die meisten aller Linien",
        note: "Bericht, Abschnitt 3",
      },
    ],
    quote:
      "CRAFT ist unser Premium-Zugpferd. 4,12\u00a0Mio.\u00a0€ auf unserem dünnsten Volumen beweisen, dass die Nachfrage da ist. Lasst uns mehr Q3-Marketingbudget dahinterstellen. Die Mängel sind ein Fertigungsproblem, das wir parallel beheben, kein Grund, das Wachstum zu bremsen.",
    attribution: "Vertriebsleiter, Bericht Abschnitt 6, übersetzt und gekürzt",
    gutLegend: "Dein Bauchgefühl, bevor du rechnest",
    gutNote: "Du siehst es am Ende neben deinem Blatt.",
  },
  decisionLabel: {
    rework: "Erst nacharbeiten, Zusatzbudget einen Monat halten",
    marketing: "Mehr Q3-Marketing jetzt, die Mängel parallel beheben",
  },
  decisionShort: { rework: "Erst nacharbeiten", marketing: "Mehr Q3-Marketing" },
  compare: {
    legend: "Wogegen vergleichst du einen Monat?",
    options: {
      "line-month": {
        label: "Jede Linie, Septembersumme gegen Augustsumme",
        result:
          "CRAFT\u00a0+22,4\u00a0%, die Firma +26,0\u00a0%. September hat fünf Wochenstarts, August vier: eine Woche mehr allein macht +25\u00a0%.",
        bridge: "Blank 4 · Vergleich: Jede Linie, Septembersumme gegen Augustsumme.",
      },
      "total-week": {
        label: "Die ganze Firma, je Lieferwoche gerechnet",
        result:
          "+0,8\u00a0% je Woche. Die Summe verdeckt drei Linien, die je Woche schrumpfen: PULSE\u00a0−3,5\u00a0%, CRAFT\u00a0−2,1\u00a0%, NEST\u00a0−0,4\u00a0%.",
        bridge: "Blank 4 · Vergleich: Die ganze Firma gegen den Vormonat, je Lieferwoche gerechnet.",
      },
      "line-week": {
        label: "Jede Linie, je Lieferwoche gerechnet",
        result:
          "Je Lieferwoche gerechnet schrumpfen drei Linien: PULSE\u00a0−3,5\u00a0%, CRAFT\u00a0−2,1\u00a0%, NEST\u00a0−0,4\u00a0%. Abschnitt 1 sagt, alle sieben seien gewachsen.",
        bridge:
          "Blank 4 · Vergleich: Jede Linie gegen ihren eigenen Vormonat, je Lieferwoche gerechnet, nie nur die Firmensumme.",
      },
    },
    headline: {
      "line-month": "Firma, Septembersumme gegen Augustsumme",
      "total-week": "Firma, je Lieferwoche",
      "line-week": "CRAFT, je Lieferwoche",
    },
    report:
      "Steht im Bericht: +0,8\u00a0% in Abschnitt 7, ganz hinten. Die +26\u00a0% stehen in Abschnitt 1. CRAFTs\u00a0−2,1\u00a0% steht nirgends, das rechnest du hier.",
    figureCaption:
      "Einheiten je Wochenstart im Auszug, August und September. Die Woche ab 30.09. zählt zum September, obwohl sechs ihrer sieben Tage im Oktober liegen. Quelle: demand_actuals.csv, Spalte week_start.",
    figureAug: "August",
    figureSep: "September",
    figureFrom: "ab 30.09.",
    figurePerWeek: "im Schnitt je Woche",
    barsHeading: "Einheiten gegenüber August",
    barsBasis: {
      report: "So rechnet der Bericht: Monatssumme gegen Monatssumme.",
      month: "Monatssumme gegen Monatssumme.",
      week: "Je Lieferwoche gerechnet.",
    },
    totalOnly: "Die sieben Linien stecken in dieser einen Zahl.",
  },
  defects: {
    legend: "Was zählt als Mangel?",
    options: {
      count: {
        label: "Mängelmeldungen (NCRs) je Linie, als Anzahl im Monat",
        result:
          "CRAFT 23, NEST 19: 21\u00a0% mehr. Rohzahlen folgen dem Volumen, und NEST liefert 1,8-mal so viele Einheiten wie CRAFT.",
        bridge: "Blank 1 · Mängel: Mängel sind NCRs aus der Produktion, je Linie und Monat, als Anzahl.",
      },
      per1000: {
        label: "Mängelmeldungen (NCRs) je 1.000 gelieferte Einheiten",
        result:
          "CRAFT 2,51 je 1.000, NEST 1,13: das 2,2-Fache. Gezählt wird in der Produktion, geteilt durch gelieferte Einheiten, so wie der Bericht in Abschnitt 7.",
        bridge:
          "Blank 1 · Mängel: Mängel sind NCRs aus der Produktion, je Linie und Monat, verglichen je 1.000 gelieferte Einheiten. Keine Kundenretouren.",
      },
      returns: {
        label: "Kundenretouren je Linie, so wie der NCR-Feed sie zählt",
        result:
          "Der NCR-Feed zählt Fehler in der Produktion, vor dem Versand. Retouren hängen an keiner Linie: diese Zahl gibt es hier nicht.",
        bridge: "Blank 1 · Mängel: Mängel sind Kundenretouren je Linie, aus dem NCR-Feed.",
      },
    },
    report:
      "Steht im Bericht: 2,51 gegen 1,13 in Abschnitt 7. Abschnitt 3 zeigt nur die Rohzahlen, und Abschnitt 6 argumentiert mit ihnen.",
    ladderCaption: "Mängel je Linie, September. Quelle: ncr_records.csv und demand_actuals.csv.",
    ladderScale: {
      count: "Anzahl Meldungen, 0 bis 25",
      per1000: "Meldungen je 1.000\u00a0Einheiten, 0 bis 3",
      returns: "Kundenretouren je Linie",
    },
    noReport: "keine Meldung",
    notInData: "nicht in den Daten",
    echo: "keine NCR, aber offene P2-Eskalation: Akku-Schwellungen, PL",
    flagged: "geflaggt",
    noise: "Rauschen",
    lineHeader: "Linie",
    valueHeader: "Wert",
  },
  flag: {
    legend: "Wann flaggst du eine Linie, bevor Budget fließt?",
    markedAbove: "Oben in der Leiter markiert:",
    options: {
      chronic: {
        label: "Höchste Preisspanne und höchste Quote, zwei Monate in Folge",
        result:
          "Geflaggt: CRAFT. 199 bis 699\u00a0€, 3,21 je 1.000 im August, 2,51 im September, beide Male die höchste Quote. Die Quote fällt, der Ausschuss steigt: 12,3\u00a0% der CRAFT-Einheiten im August, 16,8\u00a0% im September. Zum Listenpreis sind das 691\u00a0Tsd.\u00a0€, 16,8\u00a0% des CRAFT-Umsatzes (1.539 Stück × 449\u00a0€, dem Mittel der drei Listenpreise); was die Stücke gekostet haben, steht in keiner Datei.",
        bridge:
          "Blank 5 · Flag: Flagge die Linie mit der höchsten Preisspanne und der höchsten Mängelquote je 1.000. Zwei Monate in Folge: erst nacharbeiten, dann Budget. Das Flag ist eine Frage, kein Urteil.",
      },
      rising: {
        label: "Jede Linie, deren Mängelquote gegenüber dem Vormonat steigt",
        result:
          "Geflaggt: AURA, NEST, PULSE. PULSE wegen 0,70 → 0,71, das ist Rauschen. CRAFT ist frei, weil 3,21 auf 2,51 fällt, obwohl 2,51 die höchste Quote ist.",
        bridge: "Blank 5 · Flag: Flagge jede Linie, deren Mängelquote gegenüber dem Vormonat steigt.",
      },
      "most-reports": {
        label: "Die Linie mit den meisten Meldungen, zwei Monate in Folge",
        result:
          "Geflaggt: CRAFT, mit 24 und 23 Meldungen. Richtige Linie, falscher Grund: NEST liegt mit 19 nur vier dahinter und liefert 1,8-mal so viel. So argumentiert der Bericht in Abschnitt 6. Mit mehr NEST-Volumen flaggt diese Regel NEST, obwohl CRAFT je 1.000\u00a0Einheiten 2,2-mal so oft fehlt.",
        bridge: "Blank 5 · Flag: Flagge die Linie mit den meisten Mängelmeldungen, zwei Monate in Folge.",
      },
    },
    evidenceRate: "Mängel je 1.000\u00a0Einheiten",
    evidenceScrap: "Ausschuss, Anteil der CRAFT-Einheiten",
    evidenceValue: "Ausschuss im September, zum Listenpreis",
    evidenceShare: "des CRAFT-Umsatzes",
    falls: "fällt",
    rises: "steigt",
  },
  bridge: {
    title: "Für Prompt 2",
    caption:
      "Schick zuerst Prompt 2. Wenn Claude nach Blank 1 fragt, füg das hier als Antwort ein. Das sind deine Antworten, auch die schwachen: änder sie oben, bevor du kopierst.",
    disabled: "Erst Station 1 oder 2.",
    lead: {
      one: "Das sind meine eigenen Antworten auf Blank {answered}. Frag mich nur noch Blank {rest}.",
      other: "Das sind meine eigenen Antworten auf Blank {answered}. Frag mich nur noch Blank {rest}.",
    },
    listAnd: "und",
    limits: {
      marketing:
        "Blank 6 · Grenzen: Nenne die Grenze im selben Satz wie die Zahl. Offen bleiben Marge je Linie, Retouren je Linie und ob Marketing CRAFT bewegt.",
      weeks:
        "Blank 6 · Grenzen: Nenne die Grenze im selben Satz wie die Zahl. Offen bleiben Marge je Linie, Retouren je Linie und ob September mehr Lieferwochen hatte.",
      rate: "Blank 6 · Grenzen: Nenne die Grenze im selben Satz wie die Zahl. Offen bleiben Marge je Linie, Mängel je 1.000\u00a0Einheiten und ob Marketing CRAFT bewegt.",
    },
  },
  check: {
    intro:
      "So kann eine Antwort von Claude aussehen: Zahl und Quelle. Für die Übung vorbereitet, nicht jede Angabe hält. Sag vorher, was die Quelle zeigt.",
    group: "Was zeigt die Quelle?",
    truth: { match: "stimmt", differs: "weicht ab", nowhere: "steht nirgends" },
    claims: {
      "craft-units": {
        label: "CRAFT-Einheiten, September",
        source: "Quelle: demand_actuals.csv, Spalte units_actual",
        result:
          "Stimmt. 95 CRAFT-Zeilen mit Wochenstart im September, units_actual summiert: 9.162. Das ist die Prüfung, die Prompt 3 verlangt.",
        total: "Summe units_actual, 95 Zeilen: 9.162",
      },
      "nest-ncr": {
        label: "NEST-Mängel, September",
        source: "Quelle: ncr_records.csv, Zeilen mit line = NEST",
        result:
          "Weicht ab. Im September stehen 19 NEST-Zeilen in ncr_records.csv. 12 ist der Augustwert: richtige Datei, falscher Zeitraum.",
        total: "NEST-Zeilen im September: 19. Im August: 12.",
      },
      "craft-revenue": {
        label: "CRAFT-Umsatz, September",
        source: "Quelle: demand_actuals.csv × product_lines.csv, Menge × Listenpreis",
        result:
          "Stimmt. 95 Zeilen, jede Menge × Listenpreis ihres Modells: 4.124.238\u00a0€. Gerechnet, und die Quelle sagt es. So darf eine gerechnete Zahl aussehen.",
        total: "Summe über 95 Zeilen: 4.124.238\u00a0€",
      },
      "craft-marketing": {
        label: "CRAFT-Marketing",
        source: "Quelle: campaign_master.csv, Spalte budget_eur",
        result:
          "Steht nirgends. campaign_master.csv hat keine Spalte für die Linie, und die Startdaten reichen von 2021 bis 2024. 2.032.716\u00a0€ ÷ 7 Linien = 290.388\u00a0€: geteilt, nicht gelesen, mit richtiger Datei als Quelle.",
        total: "Summe budget_eur, alle Kampagnen 2021 bis 2024: 2.032.716\u00a0€",
      },
    },
    echo: {
      same: "Du hast gesagt: {said}. Die Quelle bestätigt das.",
      differs: "Du hast gesagt: {said}. Die Quelle zeigt: {truth}.",
    },
    sourceShows: "Quelle zeigt {value}",
    sourceNone: "Quelle zeigt: keine Linie",
    more: "+ {count} weitere Zeilen",
    missingColumn: "line?",
    counter: "Geprüft: {count} von {of}",
    closing:
      "Die Prüffrage unten fragt genau das: Datei, Spalte, Zeitraum, gerechnet oder gelesen.",
  },
  decide: {
    intro: "Sechs Zeilen für den Vertriebsleiter. Jede Zeile muss in den Daten stehen.",
    rows: {
      decision: "Entscheidung",
      number: "Die Zahl, die trägt",
      cost: "Was ein Irrtum kostet",
      open: "Was die Daten offenlassen",
      counter: "Stärkstes Gegenargument",
      trigger: "Wann das Geld fließt",
    },
    sheetRows: {
      decision: "Entscheidung",
      number: "Die Zahl",
      cost: "Irrtum kostet",
      open: "Offen",
      counter: "Gegenargument",
      trigger: "Freigabe",
    },
    options: {
      decision: {
        rework: {
          label: "Erst nacharbeiten, Zusatzbudget einen Monat halten",
          fact: "Das entscheidet auch der Workshop. Halten wird es erst mit den fünf Zeilen darunter.",
          sheet: "Erst nacharbeiten, das Zusatzbudget einen Monat halten.",
        },
        marketing: {
          label: "Mehr Q3-Marketing jetzt, die Mängel parallel beheben",
          fact: "Für mehr Nachfrage steht hier keine Zahl: je Lieferwoche liefert CRAFT 2,1\u00a0% weniger als im August. Für den Ausschuss schon: 16,8\u00a0% der CRAFT-Einheiten im September.",
          sheet: "Mehr Q3-Marketing jetzt, die Mängel parallel beheben.",
        },
      },
      number: {
        "craft-mom": {
          label: "+22,4\u00a0% mehr CRAFT-Einheiten als im August",
          fact: "Eine Woche mehr allein macht +25\u00a0%. Je Lieferwoche gerechnet: CRAFT\u00a0−2,1\u00a0%.",
          sheet:
            "+22,4\u00a0% mehr CRAFT-Einheiten als im August (demand_actuals.csv, August und September 2023).",
        },
        "rate-251": {
          label: "2,51 Mängel je 1.000\u00a0Einheiten, 2,2-mal NEST",
          fact: "Gilt, egal wie viele Wochen der Monat hat (Bericht, Abschnitt 7).",
          sheet:
            "2,51 Mängel je 1.000\u00a0Einheiten, 2,2-mal NEST (ncr_records.csv und demand_actuals.csv, September 2023).",
        },
        "rev-412": {
          label: "4,12\u00a0Mio.\u00a0€ Umsatz auf nur 9.162 Einheiten",
          fact: "Umsatz ist hier Menge × Listenpreis, keine Marge: Stückkosten stehen in keiner Datei. Und je Lieferwoche liefert CRAFT 2,1\u00a0% weniger Einheiten.",
          sheet:
            "4,12\u00a0Mio.\u00a0€ Umsatz auf nur 9.162 Einheiten (demand_actuals.csv und product_lines.csv, September 2023).",
        },
        "scrap-691": {
          label: "691\u00a0Tsd.\u00a0€ Ausschuss, bewertet zum Listenpreis",
          fact: "Die Grenze steht im selben Satz: bewertet zum Listenpreis. Was die Stücke gekostet haben, steht in keiner Datei.",
          sheet:
            "691\u00a0Tsd.\u00a0€ Ausschuss, bewertet zum Listenpreis (ncr_records.csv und product_lines.csv, September 2023).",
        },
        "ncr-23": {
          label: "23 Mängelmeldungen, mehr als jede andere Linie",
          vp: "NEST hat 19. Wegen vier Meldungen bremst du meine Linie?",
          fact: "Je 1.000\u00a0Einheiten: CRAFT 2,51, NEST 1,13, das 2,2-Fache. NEST liefert 1,8-mal so viele Einheiten.",
          sheet: "23 Mängelmeldungen, mehr als jede andere Linie (ncr_records.csv, September 2023).",
        },
      },
      cost: {
        "both-ways": {
          label: "Zu früh gebremst fehlt Umsatz, zu früh gefördert kaufen wir Ausschuss mit",
          fact: "Kosten in beide Richtungen.",
          sheet: "Zu früh gebremst fehlt Umsatz, zu früh gefördert kaufen wir Ausschuss mit.",
        },
        "lost-revenue": {
          label: "Jeder Monat ohne Zusatzbudget kostet CRAFT bis zu 4,12\u00a0Mio.\u00a0€ Umsatz",
          fact: "Was das Zusatzbudget bewegt, steht in keiner Datei: Budgets sind je Kampagne gebucht, nicht je Linie. 4,12\u00a0Mio.\u00a0€ ist der ganze Septemberumsatz von CRAFT.",
          sheet: "Jeder Monat ohne Zusatzbudget kostet CRAFT bis zu 4,12\u00a0Mio.\u00a0€ Umsatz.",
        },
        "scrap-on-top": {
          label: "Mit Zusatzbudget kommen jeden Monat 691\u00a0Tsd.\u00a0€ Ausschuss (Listenpreis) dazu",
          vp: "Der Ausschuss fällt auch an, wenn ich kein Budget bekomme.",
          fact: "Da hat er recht: die 691\u00a0Tsd.\u00a0€ zum Listenpreis entstehen auch ohne Zusatzbudget. Ein Irrtum kostet in beide Richtungen.",
          sheet: "Mit Zusatzbudget kommen jeden Monat 691\u00a0Tsd.\u00a0€ Ausschuss (Listenpreis) dazu.",
        },
      },
      open: {
        weeks: {
          label: "Marge je Linie, Retouren je Linie, ob September mehr Lieferwochen hatte",
          fact: "Die Wochen stehen in den Daten: fünf Wochenstarts im September in demand_actuals.csv. Offen ist dagegen, ob Marketing CRAFT bewegt.",
          sheet: "Marge je Linie, Retouren je Linie, ob September mehr Lieferwochen hatte.",
        },
        marketing: {
          label: "Marge je Linie, Retouren je Linie, ob Marketing CRAFT bewegt",
          fact: "Genau die drei Grenzen, die keine Datei schließt.",
          sheet: "Marge je Linie, Retouren je Linie, ob Marketing CRAFT bewegt.",
        },
        rate: {
          label: "Marge je Linie, Mängel je 1.000\u00a0Einheiten, ob Marketing CRAFT bewegt",
          fact: "Die Quote steht in den Daten: ncr_records.csv geteilt durch demand_actuals.csv. Offen sind dagegen die Retouren je Linie.",
          sheet: "Marge je Linie, Mängel je 1.000\u00a0Einheiten, ob Marketing CRAFT bewegt.",
        },
      },
      counter: {
        "price-margin": {
          label: "CRAFT erzielt 2,4-mal AURAs Durchschnittspreis, also die beste Marge",
          fact: "Preis ist keine Marge. Stückkosten stehen in keiner Datei.",
          sheet: "CRAFT erzielt 2,4-mal AURAs Durchschnittspreis, also die beste Marge.",
        },
        "count-fell": {
          label: "Die Meldungen sinken schon: 24 im August, nur noch 23 im September",
          fact: "Eine Meldung weniger, in einem Monat mit einer Woche mehr. Das stärkere Argument hat der Vertriebsleiter: je 1.000\u00a0Einheiten fiel die Quote um 22\u00a0%.",
          sheet: "Die Meldungen sinken schon: 24 im August, nur noch 23 im September.",
        },
        "rate-fell": {
          label: "Nur CRAFTs Quote fiel: von 3,21 auf 2,51 je 1.000\u00a0Einheiten",
          fact: "Das gehört ihm, und darum dauert die Sperre nur einen Monat. Zugleich stieg der Ausschuss von 12,3\u00a0% auf 16,8\u00a0% der Einheiten.",
          sheet: "Nur CRAFTs Quote fiel, von 3,21 auf 2,51 je 1.000\u00a0Einheiten.",
        },
      },
      trigger: {
        "rate-only": {
          label: "Oktober unter 2,51 Mängeln je 1.000 gelieferten Einheiten",
          fact: "Das schaffte der September schon gegenüber dem August: Quote 3,21 → 2,51, Ausschuss 12,3\u00a0% → 16,8\u00a0% der Einheiten. Ohne Ausschussbedingung gibst du frei, während mehr verschrottet wird.",
          sheet: "Oktober unter 2,51 Mängeln je 1.000 gelieferten Einheiten.",
        },
        revenue: {
          label: "Oktober-Umsatz von CRAFT über 4,12\u00a0Mio.\u00a0€, bei gleichem Budget",
          fact: "Umsatz misst die Nachfrage, nicht die Mängel. Und der Oktober hat im Auszug vier Wochenstarts (07., 14., 21., 28.), der September fünf: die Hürde scheitert schon am Kalender.",
          sheet: "Oktober-Umsatz von CRAFT über 4,12\u00a0Mio.\u00a0€, bei gleichem Budget.",
        },
        "rate-and-scrap": {
          label: "Oktober unter 2,51 je 1.000 und Ausschuss unter 8\u00a0% vom Umsatz",
          fact: "Unter 2,51 verlangt nur, dass der Trend hält. Der Workshop nimmt es trotzdem: die Sperre soll einen Monat kosten, nicht ein Quartal, und die zweite Bedingung verlangt, den Ausschuss mehr als zu halbieren (16,8\u00a0% → unter 8\u00a0%).",
          sheet: "Oktober unter 2,51 je 1.000 und Ausschuss unter 8\u00a0% vom Umsatz.",
        },
      },
    },
    against: {
      marketing:
        "Deine Zahl spricht gegen deine Entscheidung: sie spricht fürs Nacharbeiten, denn sie zeigt, was das Zusatzbudget an Mängeln mitkaufen würde.",
      rework:
        "Deine Zahl spricht gegen deine Entscheidung: sie ist ein Argument für mehr Budget, nicht fürs Nacharbeiten, und selbst dafür trägt sie nicht.",
    },
    vpLabel: "Einwand des Vertriebsleiters",
    dataLabel: "Was die Daten sagen",
    sheetHeading: "Dein Blatt",
    sheetHolds: "Dein Blatt trägt: 6 von 6 Zeilen.",
    sheetHolding: { one: "{count} von 6 Zeilen trägt.", other: "{count} von 6 Zeilen tragen." },
    sheetOpen: { one: "{count} Zeile offen.", other: "{count} Zeilen offen." },
    gut: {
      turned: "Bauch: {gut}. Blatt: {decision}. Deine Regeln haben die Entscheidung gedreht.",
      "same-holds": "Bauch und Blatt sagen dasselbe, jetzt mit Zahlen, die tragen.",
      "same-weak": "Bauch und Blatt sagen dasselbe, aber das Blatt trägt noch nicht.",
    },
    workshopHeading: "So entscheidet der Workshop",
    workshop:
      "Erst nacharbeiten. Das zusätzliche Q3-Marketing einen Monat halten. Ein Euro von sechs wird vor dem Versand verschrottet, bewertet zum Listenpreis, und der Großteil der +26\u00a0% ist die fünfte Lieferwoche. Freigabe, jetzt vereinbart: Oktober unter 2,51 je 1.000 und Ausschuss unter 8\u00a0% des Umsatzes. Wo der Vertriebsleiter recht hat: CRAFTs Quote fiel in einem Monat um 22\u00a0%, als einzige Linie mit Meldungen. Deshalb dauert die Sperre nur einen Monat. Offen bleiben Marge, Retouren je Linie und ob Marketing CRAFT bewegt.",
    workshopSource: "Folie 16 des Workshops.",
    weakTag: { misleads: "[täuscht]", absent: "[nicht in den Daten]" },
  },
  takeaways: {
    traps: {
      title: "Vier Fallen",
      text: [
        "Lies zuerst, was der Bericht nicht sagen kann, dann die Schlagzeile. Danach vier Fallen:",
        "1. Ungleiche Zeiträume: Hat der Monat mehr Wochen, Arbeitstage oder Buchungstage als der Vormonat? Dann je Woche oder je Tag vergleichen.",
        "2. Anzahl statt Quote: Mängel, Retouren und Tickets je 1.000\u00a0Einheiten vergleichen, nie als Rohzahl zwischen Linien.",
        "3. Die Regel „nur wenn es steigt“: Sie lässt die schlechteste Linie durch, sobald sie sich leicht bessert. Flagge nach Höhe, nicht nur nach Richtung.",
        "4. Gerechnet statt gelesen: Frag bei jeder Zahl nach Datei, Spalte und Zeitraum. Eine geteilte Summe ist keine gemessene Zahl, und der richtige Wert aus dem falschen Monat ist ein falscher Wert.",
      ].join("\n"),
      caption: "Jede Falle kam in diesem Septemberbericht vor.",
    },
    check: {
      title: "Die Prüffrage",
      text: "Zeig mir für jede Zahl in deiner letzten Antwort Datei, Spalte und Zeitraum, aus denen sie stammt. Welche Zahlen hast du gerechnet oder erschlossen statt gelesen?",
      caption:
        "Nach jeder Antwort mit Zahlen, in jedem Werkzeug. „Zeitraum“ fängt die 12 aus dem August, „gerechnet“ fängt die geteilte Summe.",
    },
    sheet: {
      title: "Das Entscheidungsblatt",
      text: [
        "Entscheidung: …",
        "Die Zahl: … (mit Datei und Zeitraum)",
        "Irrtum kostet: … (in beide Richtungen)",
        "Offen: … (was keine Datei zeigt)",
        "Gegenargument: … (das stärkste, aus den Daten)",
        "Freigabe: … (eine Zahl und ein Termin)",
      ].join("\n"),
      caption: "Die sechs Zeilen passen auf jeden Monatsbericht.",
      exampleTitle: "Dein Blatt für NORTHWIND, als Beispiel",
    },
  },
  ui: {
    copy: "Kopieren",
    copied: "Kopiert",
    copyFailed: "Kopieren ging nicht. Markiere den Text.",
    reset: "Von vorn",
    resetNote: "Setzt alle Stationen zurück.",
    provenance:
      "Zahlen: NORTHWIND-Kit, August und September 2023, erfunden. Nachgerechnet im Browser.",
  },
};
