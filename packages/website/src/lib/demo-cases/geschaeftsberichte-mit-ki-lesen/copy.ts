import "server-only";

/**
 * Every visible word of "Eine Datei, drei Antworten", German and English, the
 * same shape. Numbers, dates, file names and the line's name come in through
 * {placeholders} from data.ts and definitions.ts (copy.test.ts checks that no
 * number hides in here). Server only: index.tsx hands one pack to the browser.
 */

const DE = {
  locale: "de",
  money: "{v} €",
  stageLabel:
    "Die Qualitätsmeldungen von {line} im August und September, auf drei Arten gezählt",
  months: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
  date: "{d}. {m}",
  monthOf: { aug: "August", sep: "September" },
  verdicts: { better: "besser", same: "gleich", worse: "schlechter" },
  verdictPhrase: {
    better: "besser geworden",
    same: "gleich geblieben",
    worse: "schlechter geworden",
  },
  verdictGlyph: {
    better: "Pfeil nach unten",
    same: "Gleichheitszeichen",
    worse: "Pfeil nach oben",
  },
  counters: {
    records: {
      label: "Meldungen",
      short: "Meldungen",
      unit: "Meldungen",
      kind: "Vorgänge",
    },
    affected: {
      label: "Betroffene Stück",
      short: "Stück betroffen",
      unit: "betroffene Stück",
      kind: "Menge",
    },
    scrapped: {
      label: "Verschrottete Stück",
      short: "Stück verschrottet",
      unit: "verschrottete Stück",
      kind: "Menge",
    },
  },
  per: "je {per} versandte Stück",
  perShort: "je {per}",
  absolute: "ohne Nenner",
  perWeek: "je Versandwoche",
  invented: "Erfundene Firma, erfundene Zahlen",
  more: "Mehr dazu",
  captionMore: "Mehr",
  captionLess: "Weniger",
  close: "Schließen",
  resize: "Größe ändern",
  table: {
    open: "Tabelle",
    title: "Die Zahlen hinter dem Bild",
    what: "Zählweise",
    aug: "August",
    sep: "September",
    change: "Veränderung",
  },
  chip: {
    label: "Steckbrief",
    count: "{n} von {max} Zeilen",
    countShort: "{n}/{max}",
    title: "Dein Steckbrief für die {line}-Qualität",
    empty: "Diese Zeile füllt ein späterer Schritt.",
    lines: {
      decision: "Entscheidung",
      numerator: "Zähler",
      denominator: "Nenner",
      period: "Zeitraum",
      source: "Quelle",
      limit: "Grenze",
      trigger: "Auslöser",
    },
  },
  report: {
    kicker: "Monatsbericht September {year}, Abschnitt {section}",
    speaker: "Der VP Sales schreibt:",
    strip:
      "Der Bericht sagt, die Defekte seien von {a} auf {b} je {per} Stück gefallen.",
    quoteBefore:
      "„Und die Qualität dreht bereits: Bei {line} fielen die Defekte von ",
    quoteFigure: "{a} auf {b} je {per} Stück",
    quoteAfter: ". Keine andere Linie hat sich verbessert.“",
    open: "Bericht öffnen",
    sheetTitle: "Monatsbericht September, Abschnitt {section}",
    sheetLead:
      "Der Bericht nennt die Zahlen ohne Steckbrief. Er sagt nicht, was er gezählt hat.",
    tableHead: "{line} im Bericht",
    rows: {
      units: "Versandte Stück im September",
      growth: "Gegenüber August",
      revenue: "Umsatz im September",
      price: "Durchschnittspreis",
      defects: "Defekte je {per} Stück, August und September",
    },
  },
  scale: {
    title: "Veränderung von August zu September",
    zones: { better: "besser", same: "gleich", worse: "schlechter" },
    reportTag: "Bericht",
    ghostTag: "ohne Nenner",
    lensLabel: "Zählweise auf der Skala",
    lensValue: "{counter}, {denom}: {change}, also {verdict}",
    more: "Wir zählen eine Änderung unter {band} als gleich. Diese Grenze haben wir für die Demo gesetzt, sie steht nicht im Kit.",
    tickLabel: "{counter}, {denom}: {change}",
  },
  trays: {
    month: "{month} · {units} versandte Stück",
    records: "{n} Meldungen",
    legend: "Gefüllt heißt verschrottet, schraffiert heißt nachgearbeitet.",
    small:
      "Sehr kleine Meldungen sind etwas größer gezeichnet, damit du sie antippen kannst.",
    pebble: "Meldung {id} vom {date}",
    sheetTitle: "Meldung {id}",
    row: "Zeile aus ncr_records.csv",
    scrap:
      "Diese Meldung zählt als eine Meldung, als {qty} betroffene Stück und als {qty} verschrottete Stück, weil sie verschrottet wurde.",
    rework:
      "Diese Meldung zählt als eine Meldung, als {qty} betroffene Stück und als null verschrottete Stück, weil sie nachgearbeitet wurde.",
    prev: "Vorherige Meldung",
    next: "Nächste Meldung",
    types: {
      documentation: "Dokumentation",
      dimensional: "Maßhaltigkeit",
      weld_crack: "Schweißriss",
      surface_finish: "Oberfläche",
      fastener_torque: "Anzugsmoment",
    },
    scrapWord: "verschrottet",
    reworkWord: "nachgearbeitet",
  },
  guess: {
    caption:
      "Mit diesem Satz will der VP Sales, der Vertriebschef, mehr Marketinggeld für {line}. Schätze, bevor du die Daten siehst: Ist die Qualität im September besser geworden?",
    label: "Deine Schätzung",
    options: { worse: "Schlechter", same: "Gleich", better: "Besser" },
    done: "Du hast ‚{guess}‘ geschätzt. Unter dem Satz liegen jetzt {aug} Meldungen aus dem August und {sep} aus dem September. Jedes Kästchen ist eine Meldung, also ein Eintrag über ein fehlerhaftes Los aus der Fertigung.",
  },
  count: {
    invite:
      "Was gezählt wird, heißt Zähler. Wähle unten einen anderen Zähler oder zieh den Punkt auf der Skala.",
    entry:
      "Hinter dem Satz stehen {aug} Meldungen im August und {sep} im September. Eine Meldung hält ein fehlerhaftes Los fest, egal wie viele Stück es betrifft.",
    records:
      "Zählst du Meldungen wie der Bericht, fällt die Zahl von {a} auf {b} je {per} versandte Stück. Nach dieser Zählweise ist die Qualität besser geworden.",
    affected:
      "Zählst du betroffene Stück, bleibt die Zahl fast gleich: {a} je {per} versandte Stück im August, {b} im September. Es gab weniger Meldungen, aber eine Meldung betraf im Schnitt mehr Stück, {qSep} statt {qAug}.",
    scrapped:
      "Zählst du nur verschrottete Stück, steigt die Zahl von {a} auf {b} je {per} versandte Stück. Nach dieser Zählweise ist die Qualität schlechter geworden.",
    allThree:
      "Je nach Zähler ergeben dieselben {total} Meldungen aus August und September drei Antworten: besser, gleich oder schlechter. Der Bericht nennt nur eine davon und sagt nicht, wie er gezählt hat.",
    guessEcho:
      "Für jede der drei Antworten gibt es eine ehrliche Zählweise, auch für deine Schätzung ‚{guess}‘.",
    control: "Was wird gezählt?",
    denomLabel: "Nenner: je {per} versandte Stück",
    denomEntry:
      "Der Nenner ist die Zahl, durch die du teilst, hier die versandten Stück: {uAug} im August und {uSep} im September. Schalte ihn aus und sieh, was passiert.",
    denomOff: {
      affected:
        "Ohne Nenner steigen die betroffenen Stück von {a} auf {b}. Im September wurden aber {more} Stück mehr versandt, und wer mehr liefert, hat mehr Stück, die fehlerhaft sein können.",
      records:
        "Ohne Nenner sinkt die Zahl der Meldungen nur von {a} auf {b}. Mit Nenner fällt sie stärker, weil im September {more} Stück mehr versandt wurden.",
      scrapped:
        "Ohne Nenner steigen die verschrotteten Stück von {a} auf {b}. Ein Teil dieses Anstiegs kommt nur daher, dass im September {more} Stück mehr versandt wurden.",
    },
    denomOn:
      "Deshalb legt das Kit den Nenner fest: Es rechnet immer je {per} versandte Stück.",
    live: "Nach dieser Zählweise ist die Qualität {verdict}.",
  },
  merge: {
    entry:
      "Die Qualitätssicherung darf Meldungen derselben Maschine aus derselben Woche zu einer zusammenfassen. Im September geht das an {cells} Stellen, sie sind umrandet. Zieh eine Meldung auf ihre Nachbarin oder tippe auf die Stelle.",
    first:
      "Kein einziges Stück ist besser geworden, und trotzdem sinkt die Zahl der Meldungen auf {r} je {per} versandte Stück.",
    all: "Aus {from} Meldungen sind {to} geworden. Die betroffenen Stück bleiben bei {aff} und die verschrotteten bei {scr} je {per} versandte Stück.",
    closing:
      "Eine Bedingung, die sich durch Zusammenfassen erfüllen lässt, schreibst du besser in Stück.",
    grid: "September nach Maschine und Woche",
    week: "Woche ab {date}",
    cell: "{machine}, Woche ab {date}: {n} Meldungen",
    cellMerged:
      "{machine}, Woche ab {date}: {n} Meldungen zu einer zusammengefasst",
    mergeCell: "{machine}, Woche ab {date}: {n} Meldungen, zusammenfassen",
    merged: "{n} in 1",
    lift: "Meldung {id}, zum Zusammenfassen auf die Nachbarin ziehen",
    gauges: {
      records: "Meldungen je {per}",
      affected: "Betroffene je {per}",
      scrapped: "Verschrottete je {per}",
      unchanged: "unverändert",
    },
    all_button: "Alle zusammenfassen",
    undo: "Rückgängig",
    conditionHead: "Die Bedingung, die Claude ohne Skill vorgeschlagen hat",
    conditionDate: "aufgezeichnet am {date}",
    conditionRead: "Claudes Bedingung ohne Skill ansehen",
    conditionUnits:
      "Diese Bedingung zählt betroffene Stück. Zusammenfassen ändert sie deshalb nicht: Im September liegt der Anteil vorher wie nachher bei {v}.",
    gapsLead:
      "Für einen Steckbrief fehlen ihr drei Angaben. Tippe auf eine markierte Stelle.",
    gaps: {
      denominator:
        "‚Anteil‘ sagt nicht, woran: an den versandten oder an den gefertigten Stück. Das legt im Steckbrief der Nenner fest.",
      period:
        "‚Über mehrere Wochen‘ sagt nicht, wie viele Wochen es sind und ob je Woche oder zusammen gerechnet wird. Das legt der Zeitraum fest.",
      trigger:
        "‚Deutlich‘ und ‚zum Beispiel‘ nennen keine feste Grenze. Ab welchem Wert das Marketing startet, legt im Steckbrief der Auslöser fest.",
    },
    gapLines: {
      denominator: "Nenner",
      period: "Zeitraum",
      trigger: "Auslöser",
    },
    choose: "Welchen Zähler schreibst du in deinen Steckbrief?",
  },
  period: {
    entry:
      "Laut Bericht versendet {line} im September {g} mehr Stück als im August. Die Datei zählt jede Versandwoche zu dem Monat, in dem sie beginnt, deshalb hat ihr September {sepDays} Tage und ihr August nur {augDays}. Zieh die Woche ab dem {last} in den Oktober.",
    dropped:
      "Ohne die Woche ab dem {last} versendet {line} im September {g2} weniger als im August. Das Plus im Bericht hängt also an dieser einen Woche.",
    perWeek:
      "Teilst du jeden Monat durch seine Versandwochen, versendet {line} im September je Woche {g3} weniger als im August. So rechnet das Kit, und ein Monat mit fünf Wochen hat dann keinen Vorsprung mehr.",
    perWeekDropped:
      "Je Versandwoche und ohne die Woche ab dem {last} versendet {line} im September {g4} weniger als im August. Das Kit zählt diese Woche zum September, weil sie dort beginnt, und kommt auf {g3} weniger.",
    control: "Worüber zählst du?",
    options: { month: "Monatssumme", week: "Je Versandwoche" },
    endLabel: "Wo endet der September?",
    endValue: "Der September endet am {date}",
    bracket: "{month}: {from} bis {to}, {days} Tage",
    noRows: "Für diese Tage hat die Datei keine Zeilen.",
    october: "Oktober",
    readout: "{line}, versandte Stück: {g}",
    bar: "Woche ab {date}: {units} Stück",
    handle: "Woche ab dem {date}, in den Oktober ziehen",
    company:
      "Das ganze Unternehmen wächst als Monatssumme um {cm} und je Versandwoche um {cw}. Die zweite Zahl steht erst in Abschnitt {section} desselben Berichts.",
    rule: "Das Kit ordnet jede Versandwoche dem Monat zu, in dem ihr erster Tag liegt.",
  },
  trace: {
    entry:
      "Der Bericht nennt {eur} Umsatz für {line} im September. Darunter liegen {rows} Zeilen der Versanddatei, eine Spalte je Woche. Zieh die zwei Griffe so, dass sie die Wochen einrahmen, die der Bericht September nennt.",
    four: "Mit den vier Wochen vom {from} bis zum {to} kommst du auf {sum}. Das sind {diff} weniger als im Bericht.",
    other: "Mit diesen Wochen kommst du auf {sum}. Der Bericht nennt {eur}.",
    match:
      "Mit den fünf Wochen bis zur Woche ab dem {last} triffst du die Zahl im Bericht genau. Umsatz heißt hier Stück mal Listenpreis, ohne Rabatte und ohne Kosten.",
    start: "Erste Woche",
    end: "Letzte Woche",
    range: "Von der Woche ab {from} bis zur Woche ab {to}",
    readout: "{rows} Zeilen, {sum}",
    bin: "{model} · {price}",
    reportCell: "Bericht: {eur}",
    reportMatch: "stimmt mit dem Bericht überein",
    perWeek:
      "Je Versandwoche nahm {line} im September {sep} ein und im August {aug}, also praktisch gleich viel.",
    prices:
      "Das Kit hat zwei Durchschnittspreise: {report} im Bericht, Umsatz geteilt durch Stück, und {scrap} für den Wert des Ausschusses. Der Steckbrief muss sagen, welchen er nimmt.",
    legend: "Durchgezogen {e1}, schraffiert {e2}, gepunktet {g1}",
  },
  decide: {
    entry:
      "Dein Steckbrief sagt jetzt, was gezählt wird, wodurch geteilt wird, über welchen Zeitraum und aus welcher Datei. Es fehlt der Auslöser, also der Wert, unter dem das Marketing freigegeben wird.",
    raster:
      "Dieselben Daten tragen vier verschiedene Entscheidungen. Welche davon gilt, legt erst der Steckbrief fest.",
    rasterTitle: "Entscheidungsraster",
    rasterOpen: "Alle sechs Entscheidungen",
    outcome: "Was aus deinem Steckbrief folgt",
    cardLines: "Dein Steckbrief, die drei Zeilen zum Ändern",
    change: "Zeile ändern",
    decisions: {
      rework:
        "Erst wird {line} nachgearbeitet, und das zusätzliche Marketing wartet einen Monat.",
      holdCause:
        "Das Marketing wartet, bis die Ursache an den sechs Maschinen gefunden ist.",
      vp: "{line} bekommt mehr Marketing im dritten Quartal, so wie es der VP Sales vorschlägt.",
      holdDemand:
        "Das Marketing wartet, weil die Meldungen sinken, die Nachfrage je Versandwoche aber auch.",
    },
    yours: "Deine Zelle",
    triggerLabel: "Auslöser",
    triggerShort: "unter {v}",
    triggerValue: "Freigabe unter {v} {unit} je {per} versandte Stück",
    triggerToday: "Im September liegt der Wert bei {v}.",
    kitTag: "Vorschlag im Kit: {v}",
    demoTag: "Startwert der Demo: {v}",
    checks: {
      units: "Deine Bedingung zählt Stück.",
      unitsNo: "Deine Bedingung zählt Meldungen.",
      notMet: "Im September ist sie noch nicht erfüllt.",
      notMetNo: "Im September wäre sie schon erfüllt.",
      named: "Sie nennt Zeitraum und Quelle.",
      namedNo: "Zeitraum oder Quelle fehlen noch.",
      gameable:
        "Diese Bedingung ließe sich schon im September erfüllen, wenn die Qualitätssicherung Meldungen zusammenfasst. Aus {from} Meldungen würden {to}, und die Zahl läge bei {r}.",
    },
    rule: "Die Regel aus dem Workshop:",
    objective:
      "Eine Kennzahl bedeutet nur, was ihr Steckbrief sagt. Erst Zähler, Nenner und Zeitraum festlegen, dann eine Zahl bis zur Datenzeile prüfen, dann entscheiden.",
    scrap:
      "Die {units} verschrotteten Stück aus dem September sind zum mittleren Listenpreis von {price} zusammen {eur} wert, {share} des Umsatzes von {line}.",
    kitBlock:
      "So schreibt Schritt 2 im Kit deine Wahl in den Skill northwind-metrics:",
    copy: "Kopieren",
    copied: "Kopiert",
    triggers: {
      records:
        "Freigabe, wenn {line} im Oktober unter {t} Meldungen je {per} versandte Stück liegt.",
      affected:
        "Freigabe, wenn betroffene {line}-Stück im Oktober unter {t} je {per} versandte Stück liegen.",
      scrapped:
        "Freigabe, wenn verschrottete {line}-Stück im Oktober unter {t} je {per} versandte Stück liegen.",
    },
    values: {
      decision: "Mehr Marketing für {line} im dritten Quartal, ja oder nein",
      denominator: "versandte Stück in denselben Wochen, je {per}",
      denominatorNone: "keiner",
      period: {
        month: "Monatssumme, eine Meldung gehört zum Monat ihres Datums",
        week: "je Versandwoche",
      },
      source:
        "ncr_records.csv, Spalte qty_affected; demand_actuals.csv, Spalte units_actual",
      limit:
        "Die Stück in den Meldungen sind eine Produktionsmenge, versandte Stück eine Liefermenge. Die Quote ist eine Näherung.",
      kind: "{counter} ({kind})",
    },
    denomOptions: { per1000: "Je {per} versandte Stück", none: "Ohne Nenner" },
  },
  free: {
    caption:
      "Hier mischst du alle Zählweisen frei. Jede Einstellung rechnet die Demo aus derselben Datei.",
    reading:
      "Zählst du {unit} {denom}, geht die Zahl von {a} auf {b}, das sind {change}. Nach dieser Zählweise ist die Qualität {verdict}.",
    readingMerged:
      "Dabei sind die Meldungen zusammengefasst, wo es erlaubt ist.",
    readingEnds: "Dabei endet der September am {date}.",
    noDecision:
      "Ohne Nenner vergleicht diese Zahl zwei verschieden große Monate. Darauf baut das Raster keine Entscheidung.",
    merge: "Meldungen zusammenfassen",
    end: "Der September endet",
    ends: { oct6: "am {oct6}", sep29: "am {sep29}" },
    decision: "Entscheidung, wenn der Steckbrief diesen Zähler nimmt",
    levers: "Weitere Einstellungen",
    leversTitle: "Alle Einstellungen",
  },
  own: {
    caption:
      "Leg jetzt für eine Kennzahl aus deiner Arbeit fest, was sie zählt. Daten brauchst du dafür nicht.",
    privacy:
      "Was du hier eingibst oder einfügst, bleibt in diesem Browser-Tab und wird an keinen Server geschickt.",
    heading: "Dein Steckbrief",
    preview: "So steht er im Skill",
    exampleNote: "Grau ist ein Beispiel, bis du die Zeile selbst füllst.",
    noFindings: "Keine Hinweise.",
    add: "Steckbrief hinzufügen",
    count: "{n} von {max} Steckbriefen",
    needs:
      "Hinzufügen geht, sobald Kennzahl, Zähler, Nenner und Zeitraum stehen.",
    full: "Mehr als {max} Steckbriefe nimmt der Skill nicht auf.",
    added: "Deine Steckbriefe",
    remove: "Entfernen",
    clear: "Eigene Eingaben löschen",
    forks: {
      kind: {
        label: "Der Zähler zählt",
        hint: "zum Beispiel Meldungen oder Stück, wie in Schritt 2",
        events: "Vorgänge",
        quantity: "Menge",
      },
      denom: {
        label: "Nenner",
        hint: "wie der Schalter in Schritt 2",
        with: "Mit Nenner",
        without: "Ohne Nenner",
      },
      period: {
        label: "Zeitraum",
        hint: "Monatssumme oder je Woche, wie in Schritt 4",
        month: "Monatssumme",
        week: "Je Woche",
        workday: "Je Arbeitstag",
      },
      reported: {
        label: "Zahl",
        hint: "wie die Defekte im Bericht",
        reported: "Berichtet",
        adjusted: "Bereinigt",
      },
    },
    fields: {
      name: { label: "Kennzahl", placeholder: "Reklamationsquote Werk zwei" },
      decision: {
        label: "Entscheidung, die sie stützt",
        placeholder: "Lieferant für Bauteil X wechseln, ja oder nein",
      },
      numerator: { label: "Zähler", placeholder: "Reklamierte Stück" },
      denominator: {
        label: "Nenner",
        placeholder: "Gelieferte Stück im selben Zeitraum",
      },
      sourceFile: {
        label: "Quelle: Datei oder System",
        placeholder: "Export reklamationen.xlsx",
      },
      sourceColumn: {
        label: "Spalte oder Feld",
        placeholder: "menge_reklamiert",
      },
      limit: {
        label: "Grenze",
        placeholder: "Zählt nur gemeldete Reklamationen, keine Kulanzfälle.",
      },
      trigger: {
        label: "Auslöser",
        placeholder: "Wechsel, wenn die Quote zwei Monate über dem Plan liegt.",
      },
    },
    rules: {
      R1: "Dein Zähler zählt Vorgänge. Zusammenfassen oder Aufteilen ändert den Wert, ohne dass sich in der Sache etwas ändert. Schreib eine Mengen-Variante daneben.",
      R2: "Absolute Zahlen wachsen mit dem Volumen. Ohne Nenner ist mehr Geschäft nicht von mehr Problemen zu unterscheiden.",
      R3: "Kalendermonate haben 28 bis 31 Tage und 4 oder 5 Wochenanfänge. Vergleiche je Woche, je Arbeitstag oder mit dem Vorjahresmonat.",
      R4: "Dein Steckbrief nennt eine Datei, aber keine Spalte. Ohne Spalte lässt sich die Zahl nicht zurückverfolgen.",
      R5: "Jede Kennzahl hat eine Grenze. Sie gehört in den Satz mit der Zahl, nicht in eine Fußnote.",
      R6: "Bereinigt ist eine eigene Definition. Nenne die berichtete Zahl zuerst und schreib dazu, was du herausrechnest.",
      R7: "Dein Auslöser misst Vorgänge. Prüfe, ob er sich durch Zusammenfassen erreichen lässt.",
      R8: "Ohne Entscheidung lässt sich nicht sagen, welcher Zähler der richtige ist.",
    },
    cite: "Quellen: die Auslegungen der US-Börsenaufsicht SEC zu bereinigten Kennzahlen und die Leitlinien der europäischen Wertpapieraufsicht zu alternativen Leistungskennzahlen.",
    card: {
      decision: "Entscheidung",
      numerator: "Zähler",
      denominator: "Nenner",
      period: "Zeitraum",
      source: "Quelle",
      limit: "Grenze",
      trigger: "Auslöser",
      column: "Spalte",
      comparison: "verglichen mit",
      none: "keiner",
      unset: "nicht festgelegt",
      kinds: { events: "Vorgänge", quantity: "Menge" },
      periods: {
        month: "Monatssumme",
        week: "je Woche",
        workday: "je Arbeitstag",
        quarter: "Quartal",
        year: "Geschäftsjahr",
        other: "anderer Zeitraum",
      },
      comparisons: {
        previous: "Vorperiode",
        lastYear: "Vorjahresperiode",
        plan: "Plan",
      },
      adjusted: "bereinigt",
    },
    referencesTitle: "Unsere Steckbriefe",
    file: {
      open: "Mit deiner Datei ausprobieren",
      close: "Datei ausblenden",
      drop: "Zieh eine CSV-Datei hierher oder tippe, um eine auszuwählen. Die Datei bleibt auf diesem Gerät.",
      pick: "Datei auswählen",
      dateColumn: "Datumsspalte",
      qtyColumn: "Mengenspalte",
      noQtyOption: "keine",
      rows: "Zeilen gezählt",
      qty: "Menge summiert",
      same: "Ob du Zeilen zählst oder die Menge summierst, deine Zahl ist im {m2} {dir}.",
      differ:
        "Zählst du Zeilen, ist deine Zahl im {m2} {dirRows}. Summierst du die Menge, ist sie {dirQty}. Leg im Steckbrief fest, was gilt.",
      noQty:
        "Deine Datei hat keine Mengenspalte, deshalb zählen wir nur Zeilen.",
      dirs: { up: "gestiegen", down: "gesunken", flat: "gleich geblieben" },
      take: "In den Steckbrief übernehmen",
      taken: "Übernommen: Der Zähler zählt jetzt {kind}.",
      months: "{m1} gegen {m2}",
      errors: {
        tooBig:
          "Die Datei ist größer als ein Megabyte. Nimm einen Ausschnitt mit den letzten Monaten.",
        tooMany:
          "Die Datei hat mehr Zeilen, als die Demo liest. Nimm einen Ausschnitt mit den letzten Monaten.",
        empty:
          "In der Datei stehen keine Zeilen unter der Kopfzeile. Prüf, ob die erste Zeile die Spaltennamen enthält.",
        noDate:
          "Die Demo findet keine Spalte mit Datumswerten. Sie erkennt Daten in der Form Jahr-Monat-Tag oder Tag.Monat.Jahr.",
        noMonths:
          "Die Datei enthält keine zwei vollen Kalendermonate. Nimm eine Datei, die mindestens zwei ganze Monate abdeckt.",
        read: "Die Datei ließ sich nicht als Text lesen. Speichere sie als CSV mit UTF-8 und versuch es noch einmal.",
      },
    },
  },
  takehome: {
    caption:
      "Nimm den Skill mit deinen Steckbriefen mit. Er wird hier in deinem Browser gepackt.",
    captionEmpty:
      "Ohne eigene Steckbriefe bekommst du den Skill mit dem Format zum Ausfüllen.",
    zip: "Skill mit deinen Steckbriefen laden",
    zipEmpty: "Skill laden",
    zipNote:
      "Darin liegt {file} unverändert, dazu references/steckbriefe.md mit {n} Steckbriefen.",
    zipNoteEmpty: "Darin liegt {file} unverändert, so wie unter /skills.",
    craft: "Auch den {line}-Steckbrief aus Schritt 6 hinzufügen",
    template: "Vorlage für ein Teamtreffen",
    kit: "Das Kit",
    kitLine:
      "Jede Zahl, die du oben gesehen hast, stammt aus diesen Dateien des Kits.",
    moreOpen: "Projektanweisungen und Prüf-Prompts",
    moreClose: "Weniger anzeigen",
    instructionsHead: "Projektanweisungen mit deinen Steckbriefen",
    instructionsLead:
      "Wenn dein Claude keine Skills nutzt, füge diesen Text in einem Projekt unter Anweisungen ein. Projekte gibt es in jedem Plan, im kostenlosen Plan bis zu fünf.",
    promptsHead: "Zwei Prüf-Prompts",
    prompts: [
      "Nenne für jede Zahl in deiner Antwort Datei und Spalte. Welche hast du aus den Daten gerechnet, welche aus dem Bericht übernommen?",
      "Welche andere Definition dieser Kennzahl liegt nahe? Rechne sie aus und stell beide Werte nebeneinander.",
    ],
    copy: "Kopieren",
    copied: "Kopiert",
    below:
      "Unten unter „Für deinen Claude“ siehst du, wie Claude mit und ohne diesen Skill auf dieselben Dateien antwortet.",
  },
  kit: {
    defectsHeading: "{line}-Defekte",
    demandHeading: "{line}-Nachfrage",
    releaseHeading: "Freigabebedingung",
    numeratorLabel: "Zähler",
    periodLabel: "Zeitraum",
    denominatorLine:
      "- Nenner: versandte Stück in denselben Wochen (demand_actuals.csv, units_actual), je {per}",
    bases: {
      month: "Monatssumme (alle Wochen, deren week_start im Monat liegt).",
      week: "Je Versandwoche (Monatssumme geteilt durch die Zahl der week_start-Werte im Monat).",
    },
  },
};

export type DemoPack = typeof DE;

const EN: DemoPack = {
  locale: "en",
  money: "€{v}",
  stageLabel:
    "The quality records of {line} in August and September, counted in three ways",
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  date: "{d} {m}",
  monthOf: { aug: "August", sep: "September" },
  verdicts: { better: "better", same: "the same", worse: "worse" },
  verdictPhrase: {
    better: "improved",
    same: "stayed the same",
    worse: "got worse",
  },
  verdictGlyph: {
    better: "arrow down",
    same: "equals sign",
    worse: "arrow up",
  },
  counters: {
    records: {
      label: "Records",
      short: "Records",
      unit: "records",
      kind: "events",
    },
    affected: {
      label: "Affected units",
      short: "Affected units",
      unit: "affected units",
      kind: "quantity",
    },
    scrapped: {
      label: "Scrapped units",
      short: "Scrapped units",
      unit: "scrapped units",
      kind: "quantity",
    },
  },
  per: "per {per} units shipped",
  perShort: "per {per}",
  absolute: "no denominator",
  perWeek: "per shipping week",
  invented: "Invented company, invented figures",
  more: "More on this",
  captionMore: "More",
  captionLess: "Less",
  close: "Close",
  resize: "Resize",
  table: {
    open: "Table",
    title: "The figures behind the picture",
    what: "Way of counting",
    aug: "August",
    sep: "September",
    change: "Change",
  },
  chip: {
    label: "Metric card",
    count: "{n} of {max} lines",
    countShort: "{n}/{max}",
    title: "Your metric card for {line} quality",
    empty: "A later step fills this line.",
    lines: {
      decision: "Decision",
      numerator: "Numerator",
      denominator: "Denominator",
      period: "Period",
      source: "Source",
      limit: "Limit",
      trigger: "Trigger",
    },
  },
  report: {
    kicker: "Monthly report September {year}, section {section}",
    speaker: "The VP of Sales writes:",
    strip: "The report says defects fell from {a} to {b} per {per} units.",
    quoteBefore: "“And quality is already turning: {line}'s defects fell from ",
    quoteFigure: "{a} to {b} per {per} units",
    quoteAfter: ". No other line improved.”",
    open: "Open the report",
    sheetTitle: "Monthly report September, section {section}",
    sheetLead:
      "The report gives the figures without a metric card. It doesn't say what it counted.",
    tableHead: "{line} in the report",
    rows: {
      units: "Units shipped in September",
      growth: "Against August",
      revenue: "Revenue in September",
      price: "Average price",
      defects: "Defects per {per} units, August and September",
    },
  },
  scale: {
    title: "Change from August to September",
    zones: { better: "better", same: "the same", worse: "worse" },
    reportTag: "Report",
    ghostTag: "no denominator",
    lensLabel: "Way of counting on the scale",
    lensValue: "{counter}, {denom}: {change}, so {verdict}",
    more: "We count a change under {band} as the same. We set that limit for the demo; it isn't in the kit.",
    tickLabel: "{counter}, {denom}: {change}",
  },
  trays: {
    month: "{month} · {units} units shipped",
    records: "{n} records",
    legend: "Filled means scrapped, hatched means reworked.",
    small:
      "Very small records are drawn a little larger so that you can tap them.",
    pebble: "Record {id} from {date}",
    sheetTitle: "Record {id}",
    row: "Row from ncr_records.csv",
    scrap:
      "This record counts as one record, as {qty} affected units and as {qty} scrapped units, because it was scrapped.",
    rework:
      "This record counts as one record, as {qty} affected units and as zero scrapped units, because it was reworked.",
    prev: "Previous record",
    next: "Next record",
    types: {
      documentation: "Documentation",
      dimensional: "Dimensional",
      weld_crack: "Weld crack",
      surface_finish: "Surface finish",
      fastener_torque: "Fastener torque",
    },
    scrapWord: "scrapped",
    reworkWord: "reworked",
  },
  guess: {
    caption:
      "With this sentence, the VP of Sales asks for more marketing money for {line}. Guess before you see the data: did quality improve in September?",
    label: "Your guess",
    options: { worse: "Worse", same: "The same", better: "Better" },
    done: "You guessed '{guess}'. Below the sentence are now {aug} records from August and {sep} from September. Each square is one record, an entry about a faulty batch from production.",
  },
  count: {
    invite:
      "What gets counted is called the numerator. Choose another numerator below or drag the dot on the scale.",
    entry:
      "Behind the sentence are {aug} records in August and {sep} in September. A record notes one faulty batch, however many units it covers.",
    records:
      "Count records, as the monthly report does, and the figure falls from {a} to {b} per {per} units shipped. By this count, quality improved.",
    affected:
      "Count affected units and the figure barely moves: {a} per {per} units shipped in August, {b} in September. There were fewer records, but on average one record covered more units, {qSep} instead of {qAug}.",
    scrapped:
      "Count only scrapped units and the figure rises from {a} to {b} per {per} units shipped. By this count, quality got worse.",
    allThree:
      "Depending on the numerator, the same {total} records from August and September give three answers: better, the same or worse. The report gives only one of them and doesn't say how it counted.",
    guessEcho:
      "Each of the three answers has an honest way of counting behind it, including your guess, '{guess}'.",
    control: "What gets counted?",
    denomLabel: "Denominator: per {per} units shipped",
    denomEntry:
      "The denominator is the number you divide by, here units shipped: {uAug} in August and {uSep} in September. Switch it off and watch what happens.",
    denomOff: {
      affected:
        "Without a denominator, affected units rise from {a} to {b}. But September shipped {more} more units, and the more you ship, the more units can be faulty.",
      records:
        "Without a denominator, the number of records only falls from {a} to {b}. With one, it falls further, because September shipped {more} more units.",
      scrapped:
        "Without a denominator, scrapped units rise from {a} to {b}. Part of that rise comes only from September shipping {more} more units.",
    },
    denomOn:
      "That is why the kit fixes the denominator: it always counts per {per} units shipped.",
    live: "By this count, quality {verdict}.",
  },
  merge: {
    entry:
      "The quality team may merge records from the same machine in the same week into one. In September that is possible in {cells} places, and they are outlined. Drag a record onto its neighbour or tap the place.",
    first:
      "Not a single unit got better, and still the number of records drops to {r} per {per} units shipped.",
    all: "{from} records have become {to}. Affected units stay at {aff} and scrapped units at {scr} per {per} units shipped.",
    closing: "A condition that merging can satisfy is better written in units.",
    grid: "September by machine and week",
    week: "Week beginning {date}",
    cell: "{machine}, week beginning {date}: {n} records",
    cellMerged: "{machine}, week beginning {date}: {n} records merged into one",
    mergeCell: "{machine}, week beginning {date}: {n} records, merge them",
    merged: "{n} in 1",
    lift: "Record {id}, drag it onto its neighbour to merge",
    gauges: {
      records: "Records per {per}",
      affected: "Affected per {per}",
      scrapped: "Scrapped per {per}",
      unchanged: "unchanged",
    },
    all_button: "Merge all",
    undo: "Undo",
    conditionHead: "The condition Claude proposed without the skill",
    conditionDate: "recorded on {date}",
    conditionRead: "See Claude's condition without the skill",
    conditionUnits:
      "This condition counts affected units, so merging doesn't change it: in September the share stands at {v} before and after.",
    gapsLead: "For a metric card it lacks three things. Tap a marked phrase.",
    gaps: {
      denominator:
        "'Share' doesn't say of what: of the units shipped or of the units made. On a metric card, the denominator settles that.",
      period:
        "'Over several comparable weeks' doesn't say how many weeks, or whether to count per week or in total. The period settles that.",
      trigger:
        "'Such as' and 'well below' set no fixed threshold. On a metric card, the trigger says from which value marketing starts.",
    },
    gapLines: {
      denominator: "Denominator",
      period: "Period",
      trigger: "Trigger",
    },
    choose: "Which numerator goes into your metric card?",
  },
  period: {
    entry:
      "The report says {line} shipped {g} more units in September than in August. The file puts each shipping week in the month it begins in, so its September has {sepDays} days and its August only {augDays}. Drag the week beginning {last} into October.",
    dropped:
      "Without the week beginning {last}, {line} ships {g2} fewer units in September than in August. So the increase in the report rests on that one week.",
    perWeek:
      "Divide each month by its shipping weeks, and {line} ships {g3} fewer units per week in September than in August. That is how the kit counts, and a month with five weeks no longer has a head start.",
    perWeekDropped:
      "Per shipping week and without the week beginning {last}, {line} ships {g4} fewer units in September than in August. The kit counts that week in September, because it begins there, and gets {g3} fewer.",
    control: "What do you count over?",
    options: { month: "Month total", week: "Per shipping week" },
    endLabel: "Where does September end?",
    endValue: "September ends on {date}",
    bracket: "{month}: {from} to {to}, {days} days",
    noRows: "The file has no rows for these days.",
    october: "October",
    readout: "{line}, units shipped: {g}",
    bar: "Week starting {date}: {units} units",
    handle: "Week starting {date}, drag it into October",
    company:
      "The whole company grows by {cm} as a month total and by {cw} per shipping week. The second figure only appears in section {section} of the same report.",
    rule: "The kit assigns each shipping week to the month in which its first day falls.",
  },
  trace: {
    entry:
      "The report gives {eur} of revenue for {line} in September. Below it are {rows} rows of the shipping file, one column per week. Drag the two handles so that they frame the weeks the report calls September.",
    four: "With the four weeks from {from} to {to} you get {sum}. That is {diff} less than the report says.",
    other: "With these weeks you get {sum}. The report says {eur}.",
    match:
      "With the five weeks up to the week beginning {last} you hit the report's figure exactly. Revenue here means units times list price, with no discounts and no costs.",
    start: "First week",
    end: "Last week",
    range: "From the week starting {from} to the week starting {to}",
    readout: "{rows} rows, {sum}",
    bin: "{model} · {price}",
    reportCell: "Report: {eur}",
    reportMatch: "matches the report",
    perWeek:
      "Per shipping week {line} took {sep} in September and {aug} in August, practically the same.",
    prices:
      "The kit has two average prices: {report} in the report, revenue divided by units, and {scrap} for valuing scrap. The metric card must say which one it uses.",
    legend: "Solid {e1}, hatched {e2}, dotted {g1}",
  },
  decide: {
    entry:
      "Your metric card now says what is counted, what it is divided by, over which period and from which file. What is missing is the trigger, the value below which marketing is released.",
    raster:
      "The same data supports four different decisions. Only the card settles which one applies.",
    rasterTitle: "Decision grid",
    rasterOpen: "All six decisions",
    outcome: "What follows from your card",
    cardLines: "Your metric card, the three lines you can change",
    change: "Change this line",
    decisions: {
      rework:
        "{line} is reworked first, and the extra marketing waits a month.",
      holdCause:
        "Marketing waits until the cause on the six machines has been found.",
      vp: "{line} gets more marketing in the third quarter, as the VP of Sales proposes.",
      holdDemand:
        "Marketing waits, because records are falling, but so is demand per shipping week.",
    },
    yours: "Your cell",
    triggerLabel: "Trigger",
    triggerShort: "below {v}",
    triggerValue: "Release below {v} {unit} per {per} units shipped",
    triggerToday: "In September the figure is {v}.",
    kitTag: "Kit suggestion: {v}",
    demoTag: "Demo starting value: {v}",
    checks: {
      units: "Your condition counts units.",
      unitsNo: "Your condition counts records.",
      notMet: "It is not yet met in September.",
      notMetNo: "It would already be met in September.",
      named: "It names the period and the source.",
      namedNo: "The period or the source is still missing.",
      gameable:
        "This condition could already be met in September if the quality team merged records. {from} records would become {to}, and the figure would be {r}.",
    },
    rule: "The rule from the workshop:",
    objective:
      "A metric means only what its card says. Pin down numerator, denominator and period, trace one figure to its rows, then decide.",
    scrap:
      "The {units} scrapped units from September are worth {eur} at the average list price of {price}, {share} of {line}'s revenue.",
    kitBlock:
      "This is how step 2 of the kit writes your choice into the northwind-metrics skill:",
    copy: "Copy",
    copied: "Copied",
    triggers: {
      records:
        "Release when {line} is below {t} records per {per} units shipped in October.",
      affected:
        "Release when affected {line} units in October are below {t} per {per} units shipped.",
      scrapped:
        "Release when scrapped {line} units in October are below {t} per {per} units shipped.",
    },
    values: {
      decision: "More marketing for {line} in the third quarter, yes or no",
      denominator: "units shipped in the same weeks, per {per}",
      denominatorNone: "none",
      period: {
        month: "month total, a record belongs to the month of its date",
        week: "per shipping week",
      },
      source:
        "ncr_records.csv, column qty_affected; demand_actuals.csv, column units_actual",
      limit:
        "Units in the records are a production quantity, units shipped a delivery quantity. The rate is an approximation.",
      kind: "{counter} ({kind})",
    },
    denomOptions: {
      per1000: "Per {per} units shipped",
      none: "No denominator",
    },
  },
  free: {
    caption:
      "Here you mix every way of counting freely. The demo computes each setting from the same file.",
    reading:
      "Count {unit} {denom}, and the figure goes from {a} to {b}, a change of {change}. By this count, quality {verdict}.",
    readingMerged: "Records are merged wherever that is allowed.",
    readingEnds: "September ends on {date}.",
    noDecision:
      "Without a denominator, this figure compares two months of different size. The grid bases no decision on it.",
    merge: "Merge records",
    end: "September ends",
    ends: { oct6: "on {oct6}", sep29: "on {sep29}" },
    decision: "Decision if the card takes this numerator",
    levers: "More settings",
    leversTitle: "All settings",
  },
  own: {
    caption:
      "Now pin down what one metric from your own work counts. You don't need any data for that.",
    privacy:
      "What you type or add here stays in this browser tab and is never sent to a server.",
    heading: "Your metric card",
    preview: "How it reads in the skill",
    exampleNote: "Grey is an example until you fill the line yourself.",
    noFindings: "No notes.",
    add: "Add metric card",
    count: "{n} of {max} metric cards",
    needs:
      "You can add it once the metric, numerator, denominator and period are set.",
    full: "The skill takes no more than {max} metric cards.",
    added: "Your metric cards",
    remove: "Remove",
    clear: "Clear your entries",
    forks: {
      kind: {
        label: "The numerator counts",
        hint: "for example records or units, as in step 2",
        events: "Events",
        quantity: "Quantity",
      },
      denom: {
        label: "Denominator",
        hint: "like the switch in step 2",
        with: "With denominator",
        without: "No denominator",
      },
      period: {
        label: "Period",
        hint: "month total or per week, as in step 4",
        month: "Month total",
        week: "Per week",
        workday: "Per working day",
      },
      reported: {
        label: "Figure",
        hint: "like the defects in the report",
        reported: "Reported",
        adjusted: "Adjusted",
      },
    },
    fields: {
      name: { label: "Metric", placeholder: "Complaint rate, plant two" },
      decision: {
        label: "Decision it supports",
        placeholder: "Switch supplier for part X, yes or no",
      },
      numerator: { label: "Numerator", placeholder: "Units complained about" },
      denominator: {
        label: "Denominator",
        placeholder: "Units delivered in the same period",
      },
      sourceFile: {
        label: "Source: file or system",
        placeholder: "Export complaints.xlsx",
      },
      sourceColumn: { label: "Column or field", placeholder: "qty_complained" },
      limit: {
        label: "Limit",
        placeholder: "Counts only reported complaints, no goodwill cases.",
      },
      trigger: {
        label: "Trigger",
        placeholder: "Switch when the rate is above plan for two months.",
      },
    },
    rules: {
      R1: "Your numerator counts events. Merging or splitting changes the figure although nothing has changed in fact. Add a quantity version next to it.",
      R2: "Absolute figures grow with volume. Without a denominator, more business cannot be told apart from more problems.",
      R3: "Calendar months have 28 to 31 days and 4 or 5 week starts. Compare per week, per working day or with the same month last year.",
      R4: "Your card names a file but no column. Without a column the figure cannot be traced.",
      R5: "Every metric has a limit. It belongs in the sentence with the figure, not in a footnote.",
      R6: "Adjusted is a definition of its own. Give the reported figure first and say what you take out.",
      R7: "Your trigger measures events. Check whether merging alone could meet it.",
      R8: "Without a decision, nobody can say which numerator is the right one.",
    },
    cite: "Sources: the US SEC's interpretations on adjusted measures and the European securities regulator's guidelines on alternative performance measures.",
    card: {
      decision: "Decision",
      numerator: "Numerator",
      denominator: "Denominator",
      period: "Period",
      source: "Source",
      limit: "Limit",
      trigger: "Trigger",
      column: "column",
      comparison: "compared with",
      none: "none",
      unset: "not set",
      kinds: { events: "events", quantity: "quantity" },
      periods: {
        month: "month total",
        week: "per week",
        workday: "per working day",
        quarter: "quarter",
        year: "financial year",
        other: "other period",
      },
      comparisons: {
        previous: "previous period",
        lastYear: "same period last year",
        plan: "plan",
      },
      adjusted: "adjusted",
    },
    referencesTitle: "Our metric cards",
    file: {
      open: "Try it with your own file",
      close: "Hide the file part",
      drop: "Drag a CSV file here or tap to choose one. The file stays on this device.",
      pick: "Choose a file",
      dateColumn: "Date column",
      qtyColumn: "Quantity column",
      noQtyOption: "none",
      rows: "Rows counted",
      qty: "Quantity summed",
      same: "Whether you count rows or sum the quantity, your figure {dir} in {m2}.",
      differ:
        "Count rows and your figure {dirRows} in {m2}. Sum the quantity and it {dirQty}. Settle in your card which one counts.",
      noQty: "Your file has no quantity column, so we only count rows.",
      dirs: { up: "rose", down: "fell", flat: "stayed the same" },
      take: "Use it in the metric card",
      taken: "Done: the numerator now counts {kind}.",
      months: "{m1} against {m2}",
      errors: {
        tooBig:
          "The file is larger than one megabyte. Take an extract with the last few months.",
        tooMany:
          "The file has more rows than the demo reads. Take an extract with the last few months.",
        empty:
          "There are no rows below the header line. Check that the first line holds the column names.",
        noDate:
          "The demo finds no column with dates. It reads dates written as year-month-day or day.month.year.",
        noMonths:
          "The file doesn't contain two full calendar months. Take a file that covers at least two whole months.",
        read: "The file couldn't be read as text. Save it as a CSV in UTF-8 and try again.",
      },
    },
  },
  takehome: {
    caption:
      "Take the skill home with your metric cards. It is packed here in your browser.",
    captionEmpty:
      "Without cards of your own, you get the skill with the format to fill in.",
    zip: "Download the skill with your metric cards",
    zipEmpty: "Download the skill",
    zipNote:
      "It holds {file} unchanged, plus references/steckbriefe.md with {n} metric cards.",
    zipNoteEmpty: "It holds {file} unchanged, as under /skills.",
    craft: "Also add the {line} card from step 6",
    template: "Template for a team meeting",
    kit: "The kit",
    kitLine: "Every figure you saw above comes from these files of the kit.",
    moreOpen: "Project instructions and check prompts",
    moreClose: "Show less",
    instructionsHead: "Project instructions with your metric cards",
    instructionsLead:
      "If your Claude doesn't use skills, paste this text into a project under Instructions. Projects exist on every plan, up to five on the free plan.",
    promptsHead: "Two check prompts",
    prompts: [
      "For every number in your answer, name the file and column. Which did you compute from the data, and which did you take from the report?",
      "Which other definition of this metric is plausible? Compute it and put both values side by side.",
    ],
    copy: "Copy",
    copied: "Copied",
    below:
      "Further down, under “For your Claude”, you can see how Claude answers about the same files with and without this skill.",
  },
  kit: {
    defectsHeading: "{line} defects",
    demandHeading: "{line} demand",
    releaseHeading: "Release condition",
    numeratorLabel: "Numerator",
    periodLabel: "Period",
    denominatorLine:
      "- Denominator: units shipped in the same weeks (demand_actuals.csv, units_actual), per {per}",
    bases: {
      month: "Month total (all weeks whose week_start falls in the month).",
      week: "Per shipping week (month total divided by the number of week_start values in the month).",
    },
  },
};

export const COPY = { de: DE, en: EN } as const;
