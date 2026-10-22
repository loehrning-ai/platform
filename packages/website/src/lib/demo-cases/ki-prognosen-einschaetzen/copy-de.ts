/**
 * Demo 01 "1.050 Stück, sieben Morgen": every word the demo shows in German.
 * du, real umlauts, no em or en dashes; U+2212 only in signed numbers. Store
 * names are invented; the UI writes "Standort {name}" in sentences so German
 * articles never vary.
 */
import type { Locale } from "@/lib/i18n/locale";
import { withTriplesTogether, type ForecastCopy } from "./copy-types";
import { fmtInt, fmtPct, MINUS } from "./fmt";
import type { SplitMessage } from "./logic";

/* ─── Deutsch ─────────────────────────────────────────────────────────── */

const DE_STORES = ["Zentrum", "Stadtrand", "Kleinstadt"] as const;
const DE_IN_SENTENCE = ["Standort Zentrum", "Standort Stadtrand", "Standort Kleinstadt"] as const;

function mornings(h: number): string {
  return h === 0 ? "An keinem Morgen" : h === 1 ? "An einem Morgen" : `An ${h} Morgen`;
}

function deMessage(m: SplitMessage, locale: Locale): string {
  const n = (value: number) => fmtInt(value, locale);
  const p = (value: number) => fmtPct(value, locale, 1);
  const p0 = (value: number) => fmtPct(value, locale, 0);
  switch (m.kind) {
    case "equal":
      return `Gleiche Teile klingen fair, aber die Kleinstadt bekommt ${p0(m.coverageSmall)} ihres Medians und das Zentrum ${p0(m.coverageCentre)}: ${n(m.unsold)} Geräte bleiben liegen, und das Zentrum schickt ${n(m.shortCentre)} Kunden ohne Gerät heim.`;
    case "overAsk":
      return `${DE_IN_SENTENCE[m.store]} bekommt mehr, als er angemeldet hat (${n(m.alloc)} statt ${n(m.ask)}). Bei Median-Nachfrage bleiben dort ${n(m.left)} liegen, während ${DE_IN_SENTENCE[m.shortStore]} ${n(m.short)} Kunden ohne Gerät heimschickt.`;
    case "overMedian":
      return `${DE_IN_SENTENCE[m.store]} liegt ${n(m.over)} über seinem Median. Diese ${n(m.over)} bleiben bei Median-Nachfrage liegen, während ${DE_IN_SENTENCE[m.shortStore]} ${n(m.short)} Kunden heimschickt.`;
    case "case":
      return `Das ist die Teilung aus dem Launch-Fall. Sie lässt der Kleinstadt mehr Luft nach unten (${p(m.headroomSmall)}) als dem Zentrum (${p(m.headroomCentre)}).`;
    case "median":
      return "Jeder Standort bekommt rund 89 % seines Medians und hat damit gleich viel Luft nach unten, rund 11 %. Die 320 angemeldeten, aber fehlenden Geräte bleiben sichtbar.";
    case "ask":
      return `Die Kleinstadt hat nur ${p(m.headroomSmall)} Luft nach unten: Kommt sie etwas schwächer, bleiben dort Geräte liegen, während das Zentrum Kunden heimschickt. Die Kleinstadt hat am stärksten überzogen (+26\u00A0%).`;
    case "preorders":
      return `Das Zentrum hat nur ${p(m.headroomCentre)} Luft nach unten, und die Kleinstadt schickt ${n(m.shortSmall)} Kunden heim. Vorbestellungen sind das früheste Signal, nicht die ganze Nachfrage.`;
    case "own":
      return `Am wenigsten Luft nach unten hat ${DE_IN_SENTENCE[m.store]} (${p(m.headroom)}): Kommt die Nachfrage dort schwächer, bleiben Geräte liegen.`;
  }
}

const DE: ForecastCopy = {
  stores: {
    names: DE_STORES,
    inSentence: DE_IN_SENTENCE,
    atStart: DE_IN_SENTENCE,
    order: "Zentrum / Stadtrand / Kleinstadt",
  },
  caseStrip: {
    heading: "Der Fall in drei Zahlen",
    asked: "angemeldet",
    askedNote: "So viel wollen die drei Standorte haben.",
    estimated: "geschätzt",
    estimatedNote: "So viel erwartet das Modell (Median).",
    delivered: "geliefert",
    deliveredNote: "Mehr gibt es nicht.",
    gap: (missing) => `${missing} angemeldete Geräte fehlen. Das bleibt sichtbar.`,
    figure: "Drei Balken im selben Maßstab: angemeldet 1.370, geschätzt 1.180, geliefert 1.050.",
  },
  thread: {
    label: "Schritte der Übung",
    steps: ["Verteilen", "Sieben Morgen", "Ergebnis"],
    current: "jetzt",
    done: "erledigt",
    resumed: "Fortgesetzt",
    resumedRestart: "Neu starten",
    resumedMorning: (day, total) => `Morgen ${day} von ${total}`,
    restarted: "Woche gelöscht.",
    undo: "Rückgängig",
  },
  split: {
    heading: "Verteilen",
    lead: "Verteile 1.050 Stück auf drei Standorte. Diese Teilung ist dein stehender Plan: Sie gilt an jedem Morgen, an dem die Prüfung anhält.",
    glossary: [
      { term: "Anmeldung", text: "was der Standort haben möchte" },
      { term: "Vorbestellungen", text: "was Kunden schon fest bestellt haben, das früheste Signal" },
      { term: "Median", text: "die Nachfrage, die das Modell erwartet: Sie kommt genauso oft höher wie niedriger" },
    ],
    reference: (ask, preorders, median) => `Anmeldung ${ask} · Vorbestellungen ${preorders} · Median ${median}`,
    inputLabel: (store) => `${store}, Stück`,
    fewer: (store) => `${store} 10 weniger`,
    more: (store) => `${store} 10 mehr`,
    keys: "Pfeiltasten: 10 Stück, mit Umschalt 50.",
    remaining: (n) => `Noch ${n} zu verteilen`,
    tooMany: (n) => `${n} zu viel`,
    allSplit: "Alle 1.050 verteilt.",
    check: "Prüfen",
    checkHint: "Prüfen geht, sobald genau 1.050 verteilt sind.",
    chartHeading: "Eine Lieferung, drei Standorte",
    pool: (given) => `Lieferung 1.050 · verteilt ${given}`,
    poolPlaced: "Lieferung 1.050 · alles verteilt",
    poolPlacedAria: "Lieferung 1.050 Stück: alles auf die drei Standorte verteilt.",
    poolAria: (given, left) => `Lieferung 1.050 Stück: ${given} verteilt, ${left} frei.`,
    rowBefore: (median) => `Median ${median}`,
    rowAfter: (alloc, median) => `${alloc} von Median ${median}`,
    short: (n) => `${n} Kunden ohne Gerät`,
    left: (n) => `${n} bleiben liegen`,
    exact: "genau der Median",
    barAria: (store, alloc, median, ask, note) => `${store}: ${alloc} von Median ${median}, angemeldet ${ask}, ${note}.`,
    legend: { median: "Median", ask: "Anmeldung", over: "über dem Median" },
    feedbackHeading: "Was deine Teilung bewirkt",
    headlineAll: "Bei Median-Nachfrage verkauft deine Teilung alle 1.050.",
    headlineLeft: (n) => `Bei Median-Nachfrage bleiben ${n} Geräte liegen.`,
    customersNone: "130 Kunden gehen trotzdem ohne Gerät heim: Erwartet sind 1.180, da sind 1.050. Das ändert keine Teilung.",
    customersSome: (total, unavoidable, extra) =>
      `${total} Kunden gehen ohne Gerät heim: ${unavoidable}, weil nur 1.050 da sind, und ${extra}, weil Geräte am falschen Standort liegen.`,
    message: deMessage,
    headroomLabel: "Luft nach unten",
    headroomNone: "keine",
    headroomDefinition: "So weit darf die Nachfrage unter den Median fallen, bevor Geräte liegen bleiben.",
    referenceLine:
      "Teilung nach Median: 480 / 365 / 205, jeder Standort rund 11 % Luft. Das ist die einfachste Regel; der Launch-Fall teilt 500 / 370 / 180, und bei Median-Nachfrage verkaufen beide alles.",
    stale: "Verteile wieder genau 1.050, dann rechnet die Seite neu.",
    presetsLabel: "Eine andere Regel ausprobieren",
    presets: {
      median: "Nach Median",
      ask: "Nach Anmeldung",
      preorders: "Nach Vorbestellungen",
      equal: "Zu gleichen Teilen",
      case: "Wie im Launch-Fall",
    },
    continueOwn: "Mit meiner Teilung weiter",
    continueMedian: "Mit 480 / 365 / 205 weiter",
    record: (plan, pattern) => `Dein stehender Plan: ${plan}, ${pattern}.`,
    patternNames: {
      median: "nach Median",
      ask: "nach Anmeldung",
      preorders: "nach Vorbestellungen",
      equal: "zu gleichen Teilen",
      case: "wie im Launch-Fall",
      own: "nach eigener Regel",
    },
  },
  mornings: {
    heading: "Sieben Morgen",
    preview:
      "Danach führst du eine Woche lang die Freigabe: Jeden Morgen kommen 50 Geräte, und du entscheidest, ob der Plan des Modells allein rausgeht.",
    directEntry: "Direkt zu den sieben Morgen",
    directEntryNote: "Dann gilt die Teilung nach Median als stehender Plan.",
    intro: (plan, delivery) =>
      `Woche 2 nach dem Launch. Jeden Morgen kommen 50 Geräte, und das Modell teilt sie nach seinem neuen Median. Besteht die Prüfung, geht dieser Plan allein raus; sonst entscheidet die Person vom Dienst, und bis dahin gilt dein stehender Plan: ${plan}, für 50 Geräte also ${delivery}.`,
    fallback: "Ohne Teil 1 gilt die Teilung nach Median.",
    ownerQuestion: "Wer entscheidet, wenn ein Check rot ist?",
    ownerOptions: {
      plannerOnDuty: "Der Planer oder die Planerin vom Dienst",
      analytics: "Das Analytics-Team",
      whoeverFree: "Wer gerade Zeit hat",
      custom: "Eigene Rolle",
    },
    customLabel: "Deine Rolle (bis 40 Zeichen)",
    customUse: "Übernehmen",
    ownerAnswers: {
      plannerOnDuty: "Eine benannte Rolle, die heute Dienst hat und über den Bestand entscheidet.",
      analytics: "Das Analytics-Team verantwortet das Modell, nicht den Bestand. Es klärt Ursachen, es gibt nicht frei.",
      whoeverFree: "Dann entscheidet niemand. Freigabe braucht einen Namen, bevor der Morgen beginnt.",
      custom: "Passt, wenn diese Rolle heute Dienst hat und über den Bestand entscheiden darf.",
    },
    ownerRightMark: "Passt",
    ownerWrongMark: "Nicht so",
    start: "Morgen 1 beginnen",
    ownerRecord: (owner) => `Bei Rot entscheidet: ${owner}.`,
    morningHeading: (day) => `Morgen ${day} von 7`,
    dayLabel: (day) => `Morgen ${day}`,
    weekLabel: "Die Woche",
    slotName: (day, state) => `Morgen ${day}: ${state}`,
    slotOpen: "noch offen",
    slotToday: "heute",
    tiles: {
      fresh: { name: "Frische", sub: "Alter der Daten", limit: "unter 2 Std." },
      wape: { name: "WAPE", sub: "Fehler, letzter Abschluss", limit: "unter 14 %" },
      bias: { name: "Bias", sub: "Richtung des Fehlers", limit: `zwischen ${MINUS}5\u00A0% und +5\u00A0%` },
      coverage: { name: "Spanne", sub: "p10 bis p90, Trefferquote der letzten 4 Wochen", limit: "über 80 %" },
    },
    pass: "besteht",
    fail: "rot",
    limitPrefix: "Grenze:",
    boardLabel: "Die Prüfung von heute",
    storeBias: "Bias je Standort",
    todayUnits: "Heute kommen 50 Geräte",
    modelPlan: "Plan des Modells",
    standingPlan: "Dein stehender Plan",
    events: {
      competitorToday: "Aus dem Vertrieb: Ein Wettbewerber senkt ab heute den Preis.",
      stockoutZentrum: "Aus dem Standort Zentrum: gestern ab Mittag ausverkauft.",
    },
    eventLabel: "Meldung",
    statusGreen: "Alle vier Prüfungen bestehen.",
    statusRed: (checks) => `Die Prüfung hält den Plan an: ${checks} rot. Du hast Dienst.`,
    promptGreen: "Läuft der Plan allein raus?",
    promptRed: "Was tust du?",
    options: {
      release: "Plan läuft allein raus",
      holdUnknown: "Anhalten: Etwas passiert, das das Modell nicht kennt",
      holdNearLimit: "Anhalten: Ein Wert liegt knapp an der Grenze",
      releaseOthersGreen: "Freigeben: WAPE, Bias und Spanne sind grün",
      waitRefresh: "Warten, bis die Daten frisch sind, dann neu prüfen",
      retrain: "Das Modell nachtrainieren lassen",
      releaseBestWape: "Freigeben: Der WAPE ist der beste der Woche",
      overrideReportBias: "Heute selbst teilen und den Bias der Kleinstadt als Auslöser fürs Nachtrainieren melden",
      waitFresh: "Warten, bis die Daten frisch sind",
      releaseMedianFine: "Freigeben: Der Median trifft",
      overrideAskWhy: "Heute selbst teilen und das Analytics-Team fragen, warum die Spanne so oft danebenliegt",
      lowerLimit: "Die Grenze für heute auf 70 % senken",
      retrainRaw: "Auf den Verkäufen von gestern nachtrainieren",
      overrideReconstruct: "Heute selbst teilen, die Nachfrage im Zentrum aus dem Abverkauf rekonstruieren und erst dann nachtrainieren",
      releaseAnyway: "Freigeben: Die Ampel übertreibt wegen eines einzigen Tages",
    },
    stamps: {
      rightRelease: "Richtig freigegeben",
      rightHold: "Richtig angehalten",
      rightAction: "Richtig gehandelt",
      missed: "Durchgerutscht",
      needless: "Unnötig angehalten",
      wrongStep: "Falscher Schritt",
    },
    why: [
      "So sieht der normale Morgen aus, und an ihm musst du nichts tun.",
      "WAPE, Bias und Spanne sind genau die Werte von gestern: Ohne frische Daten gibt es keinen neuen Abschluss.",
      "Der Fehler ist klein, aber fast der ganze Bias kommt aus der Kleinstadt, die seit Morgen 1 zu hoch liegt (+10 %, heute +27 %).",
      "Die Spanne verspricht, an 8 von 10 Tagen zu treffen, und trifft an 7. Das Modell ist sich sicherer, als es sein darf: Wo es danebenliegt, liegt es weiter daneben, als die Spanne zugibt.",
      "Die Preissenkung steht in keinem Merkmal, also kennt das Modell sie nicht.",
      `13,7 liegt unter 14, ${MINUS}4,6 zwischen ${MINUS}5 und +5, 81 über 80.`,
      "Ab Mittag konnte das Zentrum nichts mehr verkaufen. Deshalb wirkt das Modell dort zu hoch (+14,2 %). Erst die Nachfrage aus dem Abverkauf rekonstruieren, dann nachtrainieren.",
    ],
    consequences: [
      {
        holdUnknown: "Es liegt keine Meldung vor. Wer ohne Grund anhält, bringt allen bei, die Prüfung zu übergehen.",
        holdNearLimit: "81 % liegt über 80 %, das besteht. Knapp ist nicht rot.",
      },
      {
        releaseOthersGreen: "Der Plan teilt die 50 nach dem Bestand von gestern.",
        retrain: "Das Modell ist nicht das Problem, die Daten sind alt. Nachtrainieren auf alten Daten ändert nichts.",
      },
      {
        releaseBestWape:
          "Der Plan teilt 22 / 16 / 12 statt 23 / 17 / 10: 2 Geräte gehen in die Kleinstadt, die weniger verkauft, als das Modell glaubt.",
        waitFresh: "Die Daten sind 1,1 Stunden alt, also frisch. Warten ändert am Bias nichts.",
      },
      {
        releaseMedianFine: "Der Plan geht raus, als wäre die Unsicherheit so klein, wie das Modell glaubt.",
        lowerLimit:
          "Wer die Grenze senkt, wenn sie reißt, hat keine Grenze mehr. Grenzen ändert man vorher und mit Grund, nicht am Morgen.",
      },
      {
        release: "Der Plan teilt die 50 so, als gäbe es die Preissenkung nicht.",
        holdNearLimit: `Anhalten ist richtig, aber kein Wert liegt knapp (0,9 Std., 11,9\u00A0%, +1,6\u00A0%, 84\u00A0%). Der Grund ist die Meldung.`,
      },
      {
        holdNearLimit:
          "Wer bei Grün anhält, macht aus der Regel ein Bauchgefühl. Die Grenzen stehen vorher fest, damit niemand am Morgen neu verhandelt.",
        holdUnknown: "Es liegt keine Meldung vor.",
      },
      {
        retrainRaw:
          "Auf den gekappten Verkäufen lernt das Modell, dass das Zentrum weniger braucht, weil es nichts mehr hatte. Ab morgen bekäme das Zentrum weniger Geräte.",
        releaseAnyway: "Heute kann niemand prüfen, ob das Modell stimmt. Wer freigibt, verteilt blind.",
      },
    ],
    lessons: [
      "Alles grün und keine Meldung: Der Plan läuft allein.",
      "Alte Daten: erst frische Daten, dann der Plan.",
      "Ein Fehler, der in eine Richtung zeigt, ist ein Grund zum Nachtrainieren.",
      "Eine Grenze, die reißt, wird nicht gesenkt.",
      "Grün schaut auf gestern. Eine Meldung schlägt die Ampel.",
      "Knapp ist nicht rot.",
      "Ausverkauft heißt: Die Verkäufe zeigen nicht die Nachfrage.",
    ],
    yourPick: "Deine Wahl",
    otherPaths: "Die anderen Wege",
    rightPath: "Richtig",
    deliveryModel: (units) => `Heute geht der Plan des Modells raus: ${units}.`,
    deliveryStanding: (units) => `Heute gehen die 50 nach deinem stehenden Plan raus: ${units}.`,
    deliveryMedianNote: (units) => `Nach Median wären es ${units}.`,
    deliveryWaitData: "Die 50 warten, bis der Plan auf frischen Daten steht.",
    deliveryWaitStock: "Die 50 bleiben heute im Lager.",
    deliveryWaitRetrain: "Die 50 warten, bis das Modell neu trainiert ist.",
    next: "Nächster Morgen",
    toResult: "Zum Ergebnis",
  },
  result: {
    heading: "Ergebnis",
    preview:
      "Nach Morgen 7 steht hier deine Woche: wie viele Morgen richtig waren und was dein stehender Plan an den angehaltenen Morgen geliefert hat.",
    score: (n) => `${n} von 7 Morgen richtig.`,
    missed: (days) => `Durchgerutscht: Morgen ${days}.`,
    needless: (days) => `Unnötig angehalten: Morgen ${days}.`,
    wrongStep: (days) => `Falscher Schritt: Morgen ${days}.`,
    holdMornings: (h) => mornings(h),
    openingOwn: (pattern, split, m) =>
      `Am Anfang hast du ${pattern} geteilt (${split}). ${m} ging die Lieferung nach diesem Plan raus.`,
    openingMedian: (pattern, split, m) =>
      `Am Anfang hast du ${pattern} geteilt (${split}) und bist mit 480 / 365 / 205 weitergegangen. ${m} ging die Lieferung nach diesem Plan raus.`,
    openingMedianOnly: (m) =>
      `Du bist mit der Teilung nach Median weitergegangen (480 / 365 / 205). ${m} ging die Lieferung nach diesem Plan raus.`,
    openingFallback: (m) =>
      `Ohne eigene Teilung galt die Teilung nach Median (480 / 365 / 205). ${m} ging die Lieferung nach diesem Plan raus.`,
    deviation: (store, got, median) => `${store} bekam dabei ${got} Geräte, nach Median wären es ${median} gewesen.`,
    roomQuestion: "Würdest du jetzt wieder so teilen?",
    lessonsHeading: "Die Woche in sieben Sätzen",
    legend: {
      right: "richtig",
      missed: "durchgerutscht",
      needless: "unnötig angehalten",
      wrongStep: "falscher Schritt",
    },
    toTakeaways: "Zu deinen Mitnahmen",
    restart: "Woche neu starten",
    toWorkshop: "Zum Workshop",
    toCase: "Zum Launch-Fall (englisch)",
    record: (right) => `Woche geführt: ${right} von 7 Morgen richtig.`,
  },
  takeaways: {
    heading: "Zum Mitnehmen",
    intro: "Für deine eigene Prognose: eine Regel, ein Check und fünf Sätze. Alles steht hier, auch ohne die Übung zu spielen.",
    copy: "Kopieren",
    copied: "Kopiert",
    copiedAnnouncement: (title) => `${title} kopiert.`,
    copyFailed: "Kopieren ging nicht. Markiere den Text und kopiere ihn von Hand.",
    titles: ["Die Verteilregel", "Der Morgen-Check", "Fünf Sätze für deine Prognose"],
    rule: "Verteile knappe Ware nach der geschätzten Nachfrage je Standort (Median), nicht nach der Anmeldung. Kein Standort bekommt mehr als seinen Median, solange ein anderer darunter liegt. Gib allen denselben Anteil ihres Medians, dann hat jeder gleich viel Luft, falls die Nachfrage schwächer kommt. Was angemeldet ist und fehlt, bleibt für alle sichtbar.",
    checkNote: "Die Lücken sind deine Grenzen. In Klammern steht, was der Fall nimmt.",
    check: (owner) =>
      [
        "Jeden Morgen, bevor der Plan rausgeht:",
        "1. Sind die Daten jünger als ___ Stunden? (im Fall: 2)",
        "2. Liegt der WAPE des letzten Abschlusses unter ___ %? (im Fall: 14 %, die Baseline liegt bei 21 %)",
        `3. Liegt der Bias zwischen ${MINUS}___ % und +___ %? (im Fall: 5 %)`,
        "4. Trifft die Spanne p10 bis p90 so oft, wie sie verspricht? Gemessen über ___, mindestens ___ von 10. (im Fall: über 80 %)",
        "5. Passiert nichts, was das Modell nicht kennt: ein Wettbewerber, das Wetter, eine nicht eingetragene Aktion, ein Schock ohne Datum?",
        "6. War gestern kein Standort ausverkauft?",
        `Ein Nein: ${owner} entscheidet, bevor etwas rausgeht.`,
        "Ist ein Check rot, wird die Grenze nicht verschoben; erst die Ursache, dann der Plan.",
      ].join("\n"),
    sentencesNote:
      "Füll die Lücken für eine Prognose aus deiner Arbeit. Leere Lücken werden als ___ kopiert. Dein Entwurf bleibt nur in diesem Browser.",
    sentences: [
      [
        "Wir prognostizieren ",
        { blank: "was", label: "Was du prognostizierst" },
        " für ",
        { blank: "welchen Zeitraum", label: "Für welchen Zeitraum" },
        ", damit ",
        { blank: "welche Entscheidung", label: "Für welche Entscheidung" },
        " getroffen wird.",
      ],
      [
        "Die Baseline ist ",
        { blank: "welches heutige Verfahren", label: "Welches heutige Verfahren" },
        "; das Modell muss sie im WAPE auf Wochen schlagen, die es nicht kannte.",
      ],
      [
        "Zu wenig kostet uns ",
        { blank: "was", label: "Was zu wenig kostet" },
        ", zu viel kostet uns ",
        { blank: "was", label: "Was zu viel kostet" },
        ".",
      ],
      [
        "Der Plan geht allein raus, solange ",
        { blank: "welche Prüfungen", label: "Welche Prüfungen" },
        " bestehen und nichts passiert, was das Modell nicht kennt.",
      ],
      ["Bei einem Nein entscheidet ", { blank: "wer", label: "Wer entscheidet" }, ", bevor etwas rausgeht."],
    ],
    examplePrefix: "Im Fall:",
    examples: [
      "die Nachfrage je Standort · die Launchwochen · die Verteilung der 1.050 Geräte",
      "der Wert der Vorsaison, WAPE 21 %",
      "verlorene Launch-Verkäufe · gebundenes Kapital und teures Umlagern",
      "Frische, WAPE, Bias und Spanne",
      "der Planer oder die Planerin vom Dienst",
    ],
    ownerDefault: "der Planer oder die Planerin vom Dienst",
    blank: "___",
  },
  sources: {
    heading: "Woher die Zahlen kommen",
    fromCase: "Aus dem Launch-Fall des Workshops",
    fromCaseItems: [
      "Angemeldet 1.370, geschätzt 1.180, geliefert 1.050; Anmeldung, Vorbestellungen und Median je Standort.",
      "Die Teilung des Falls: 500 / 370 / 180.",
      "Die vier täglichen Prüfungen mit ihren Grenzen. Morgen 1 ist die Tafel des Falls.",
      "WAPE 12 % für das Modell, 21 % für die Baseline.",
      "Bei Ausverkauf sind Verkäufe nicht die Nachfrage. Wettbewerber und Wetter bleiben Risiken, keine Merkmale.",
    ],
    invented: "Für diese Übung erfunden",
    inventedItems: [
      "Die Namen der Standorte.",
      "Die Lieferung: 700 Geräte in der Startwoche, dann 50 an jedem Morgen von Woche 2.",
      "Die Werte der Morgen 2 bis 7 und die beiden Meldungen.",
      "Der Plan des Modells je Morgen: der Median je Standort, verschoben um dessen Bias.",
      "Das Fenster der Spanne: Trefferquote der letzten 4 Wochen.",
      "Luft nach unten rechnet nur mit dem Median, nicht mit der ganzen Spanne. Das ist eine Vereinfachung.",
    ],
    toCase: "Zum Launch-Fall (englisch)",
  },
};

export const DE_COPY: ForecastCopy = withTriplesTogether(DE);
