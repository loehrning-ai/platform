import "server-only";

import type { Locale } from "@/lib/i18n/locale";

/**
 * The words of "Hundert Startwochen" / "A Hundred Launch Weeks", both
 * languages. Server only: index.tsx picks one pack and passes it to the
 * client demo, so the browser bundle carries a single language. A pack is
 * plain data. `{name}` slots are filled by format.ts `fill`.
 */
export interface DemoPack {
  readonly locale: Locale;
  readonly defaultUnit: string;
  readonly restDefault: string;
  readonly restCustom: string;
  readonly chart: {
    readonly counterLabel: string;
    readonly captions: {
      readonly threeQuarters: string;
      readonly moreThanHalf: string;
      readonly half: string;
      readonly lessThanHalf: string;
      readonly rare: string;
    };
    readonly detents: {
      readonly today: string;
      readonly forecast: string;
      readonly p90: string;
      readonly best: string;
    };
    readonly statShort: string;
    readonly statLeft: string;
    readonly axisFrom: string;
    readonly xCaption: string;
    readonly assumption: string;
    readonly tailCue: string;
    readonly request: string;
    readonly legend: {
      readonly short: string;
      readonly enough: string;
      readonly left: string;
    };
    /** The big label on the red region. */
    readonly redLabel: string;
    readonly badgeCase: string;
    readonly badgeOwn: string;
    readonly footnote: string;
    readonly chartLabel: string;
    readonly chartDesc: string;
    readonly xp: {
      readonly p10: string;
      readonly p50: string;
      readonly p90: string;
    };
  };
  readonly controls: {
    readonly chipsLabel: string;
    readonly chipNames: {
      readonly today: string;
      readonly forecast: string;
      readonly p90: string;
      readonly best: string;
    };
    readonly chipCount: string;
    readonly sliderLabel: string;
    readonly sliderValue: string;
    readonly announce: string;
    readonly announceLayer2: string;
    readonly announceLayer3: string;
    readonly waageTitle: string;
    readonly sliderHint: string;
    readonly waageLead: string;
    readonly waageTail: string;
    readonly waageLabel: string;
    readonly waageDiamond: string;
    readonly stripLabel: string;
    readonly stripCells: readonly string[];
    readonly stripCell: string;
    readonly miniBar: string;
    readonly replay: string;
  };
  readonly form: {
    readonly title: string;
    readonly lead: string;
    readonly p10: string;
    readonly p10Hint: string;
    readonly p50: string;
    readonly p50Hint: string;
    readonly p90: string;
    readonly p90Hint: string;
    readonly supply: string;
    readonly ratio: string;
    readonly ratioHint: string;
    readonly unit: string;
    readonly unitHint: string;
    readonly reset: string;
    readonly privacy: string;
    readonly lastValid: string;
    readonly supplyMoved: string;
    readonly supplyFar: string;
    readonly errors: {
      readonly order: string;
      readonly number: string;
      readonly negative: string;
      readonly ratio: string;
      readonly unit: string;
    };
  };
  readonly takeaways: {
    readonly heading: string;
    readonly copy: string;
    readonly copied: string;
    readonly selectCopy: string;
    readonly mailTitle: string;
    readonly questionsTitle: string;
    readonly workingTitle: string;
    readonly questionsIntro: string;
    readonly questions: readonly string[];
    readonly mail: {
      readonly head: string;
      readonly atForecastLess: string;
      readonly atForecast: string;
      readonly equalWeight: string;
      readonly weighBelow: string;
      readonly weighAbove: string;
      readonly open: string;
    };
    readonly working: string;
    readonly workingNoPlan: string;
  };
}

export const COPY = {
  de: {
    locale: "de",
    defaultUnit: "Stück",
    restDefault: "ein übriges Stück",
    restCustom: "eine übrige Einheit",
    chart: {
      counterLabel: "Startwochen, in denen das Lager nicht reicht",
      captions: {
        threeQuarters: "Rund 3 von 4 Wochen zu wenig",
        moreThanHalf: "Mehr als jede zweite Woche zu wenig",
        half: "Die Hälfte der Wochen zu wenig",
        lessThanHalf: "Seltener als jede zweite Woche",
        rare: "Selten zu wenig, dafür viel übrig",
      },
      detents: {
        today: "heute",
        forecast: "Prognose",
        p90: "oben",
        best: "bester Wert",
      },
      statShort: "fehlen im Schnitt",
      statLeft: "übrig im Schnitt",
      axisFrom: "Achse ab {lo}",
      xCaption:
        "100 mögliche Startwochen, sortiert von wenig bis viel Nachfrage.",
      assumption:
        "Annahme: gleichmäßig verteilt zwischen unten, Prognose und oben. Keine Messung.",
      tailCue: "Gestrichelt: darüber hinaus geschätzt.",
      request: "Anfrage {n}",
      legend: { short: "fehlt", enough: "verkauft", left: "übrig" },
      redLabel: "fehlt in {n} von 100",
      badgeCase: "Workshop-Fall (erfunden)",
      badgeOwn: "Eigener Fall",
      footnote:
        "Ausverkauft heißt nicht: keine Nachfrage. Verkäufe enden am Lager, das Rote sieht kein Verkaufsbericht.",
      chartLabel:
        "Hundert mögliche Startwochen als Treppe, nach Nachfrage sortiert. Lager {cap}: In {n} von 100 Wochen reicht es nicht.",
      chartDesc:
        "Die Spanne reicht von unten {p10} über die Prognose {p50} bis oben {p90}. Angenommen ist ein gleichmäßiger Verlauf dazwischen. Rot ist, was über dem Lager liegt und fehlt.",
      xp: { p10: "unten", p50: "Prognose", p90: "oben" },
    },
    controls: {
      chipsLabel: "Lager auf einen Wert setzen",
      chipNames: {
        today: "Lager heute",
        forecast: "Prognose",
        p90: "Oben",
        best: "Bester Wert",
      },
      chipCount: "{n}/100",
      sliderLabel: "Lager",
      sliderValue: "Lager {cap}, in {n} von 100 möglichen Startwochen zu wenig",
      announce: "{n} von 100 zu wenig",
      announceLayer2: "Waage verfügbar",
      announceLayer3: "Wochenleiste verfügbar",
      waageTitle: "Was kostet ein Fehlgriff?",
      sliderHint:
        "Pfeiltasten verschieben das Lager. Enter springt zur nächsten Marke und nach der letzten wieder zur ersten, Umschalt plus Enter rückwärts.",
      waageLead: "Ein verpasster Verkauf wiegt so schwer wie",
      waageTail: "ein übriges Stück (deine Annahme)",
      waageLabel: "Gewicht eines verpassten Verkaufs",
      waageDiamond: "bester Wert {opt} bei {r} : 1",
      stripLabel: "Andere Woche ansehen",
      stripCells: ["W-4", "W-3", "W-2", "W-1", "Start", "W+1", "W+2"],
      stripCell: "Woche {week}, in {n} von 100 zu wenig",
      miniBar: "Lager {cap}",
      replay: "Nochmal",
    },
    form: {
      title: "Mein Fall",
      lead: "Setz die Spanne deiner eigenen Prognose ein. Die Treppe rechnet sofort mit.",
      p10: "Unten",
      p10Hint: "In 9 von 10 Wochen mehr",
      p50: "Prognose (Mitte)",
      p50Hint: "In der Hälfte der Wochen mehr",
      p90: "Oben",
      p90Hint: "Nur in 1 von 10 Wochen mehr",
      supply: "Lager heute",
      ratio: "Verpasster Verkauf = x übrige Stücke",
      ratioHint: "1 bis 20",
      unit: "Einheit",
      unitHint: "Stück",
      reset: "Fall zurücksetzen",
      privacy:
        "Bleibt auf deinem Gerät. Nichts wird gesendet oder gespeichert.",
      lastValid: "Zeigt noch den letzten gültigen Fall",
      supplyMoved: "Lag außerhalb deiner Spanne, jetzt auf der Prognose. Ändere es, wenn du magst.",
      supplyFar: "Weit außerhalb der Spanne: Das Ergebnis ist dann fast immer 0 oder 100 von 100.",
      errors: {
        order:
          "Unten muss kleiner sein als die Prognose, und die Prognose kleiner als oben.",
        number: "Bitte eine Zahl eingeben, zum Beispiel 1.180.",
        negative: "Zahlen müssen 0 oder größer sein.",
        ratio: "Das Gewicht liegt zwischen 1 und 20.",
        unit: "Die Einheit hat höchstens 12 Zeichen.",
      },
    },
    takeaways: {
      heading: "Zum Mitnehmen, aus deiner Linie gebaut",
      copy: "Kopieren",
      copied: "Kopiert",
      selectCopy: "Markieren und kopieren",
      mailTitle: "Satz für die Mail",
      questionsTitle: "3 Fragen für die Runde",
      workingTitle: "Rechenweg mit Annahme",
      questionsIntro: "Vor jeder Prognose-Zahl fragen:",
      questions: [
        "Welche Spanne gehört zur Zahl, von unten bis oben?",
        "Was wiegt schwerer, zu wenig oder zu viel, und um welchen Faktor?",
        "Fehler worauf: Stück oder Prozent je Zeile? Und wer entscheidet, wenn der Tages-Check kippt?",
      ],
      mail: {
        head: "Prognose {p50} {u} (Spanne {p10} bis {p90}), Lager {cap}: In {n} von 100 möglichen Startwochen reicht das Lager nicht, im Schnitt fehlen {short} {u}.",
        atForecastLess: "Bei Lager {p50} wären es noch {nP50} von 100.",
        atForecast: "Bei Lager {p50} wären es {nP50} von 100.",
        equalWeight:
          "Bei gleichem Gewicht beider Fehler ist die Prognose {p50} selbst die Planzahl.",
        weighBelow:
          "Wiegt ein verpasster Verkauf {r}-mal so schwer wie {rest} (unsere Annahme), ist {opt} die bessere Planzahl.",
        weighAbove:
          "Wiegt ein verpasster Verkauf {r}-mal so schwer wie {rest} (unsere Annahme), liegt das Lager auf oder über der besseren Planzahl {opt}.",
        open: "Offen: Wer bekommt die fehlenden {u} zuerst, und nach welcher Regel?",
      },
      working:
        "Planzahl {opt} = {pct}. Perzentil bei Verhältnis {r} : 1 (unsere Annahme). Quelle: Prognose-Spanne p10 {p10}, p50 {p50}, p90 {p90}; Annahme: linear zwischen den drei Werten, 100 gleich wahrscheinliche Szenarien, keine Messung. Lager {cap}: fehlt in {n} von 100, Ø fehlt {short}, Ø übrig {left}.",
      workingNoPlan:
        "Quelle: Prognose-Spanne p10 {p10}, p50 {p50}, p90 {p90}; Annahme: linear zwischen den drei Werten, 100 gleich wahrscheinliche Szenarien, keine Messung. Lager {cap}: fehlt in {n} von 100, Ø fehlt {short}, Ø übrig {left}.",
    },
  },
  en: {
    locale: "en",
    defaultUnit: "units",
    restDefault: "leftover unit",
    restCustom: "leftover unit",
    chart: {
      counterLabel: "launch weeks where the stock falls short",
      captions: {
        threeQuarters: "About 3 of 4 weeks short",
        moreThanHalf: "More than every second week short",
        half: "Half the weeks short",
        lessThanHalf: "Short less than every second week",
        rare: "Rarely short, but a lot left over",
      },
      detents: {
        today: "today",
        forecast: "forecast",
        p90: "high",
        best: "best value",
      },
      statShort: "missing on average",
      statLeft: "left over on average",
      axisFrom: "Axis from {lo}",
      xCaption: "100 possible launch weeks, sorted from low to high demand.",
      assumption:
        "Assumption: spread evenly between low, forecast and high. Not a measurement.",
      tailCue: "Dashed: estimated beyond that.",
      request: "Request {n}",
      legend: { short: "missing", enough: "sold", left: "left over" },
      redLabel: "short in {n} of 100",
      badgeCase: "Workshop case (invented)",
      badgeOwn: "Your case",
      footnote:
        "Sold out does not mean no demand. Sales stop at the shelf; no sales report ever sees the red.",
      chartLabel:
        "A hundred possible launch weeks as a staircase, sorted by demand. Stock {cap}: in {n} of 100 weeks it is not enough.",
      chartDesc:
        "The range runs from low {p10} through the forecast {p50} to high {p90}. An even course in between is assumed. Red is what lies above the stock and is missing.",
      xp: { p10: "low", p50: "forecast", p90: "high" },
    },
    controls: {
      chipsLabel: "Set the stock to a value",
      chipNames: {
        today: "Stock today",
        forecast: "Forecast",
        p90: "High",
        best: "Best value",
      },
      chipCount: "{n}/100",
      sliderLabel: "Stock",
      sliderValue: "Stock {cap}, short in {n} of 100 possible launch weeks",
      announce: "{n} of 100 short",
      announceLayer2: "Scale available",
      announceLayer3: "Week strip available",
      waageTitle: "What does a wrong call cost?",
      sliderHint:
        "Arrow keys move the stock. Enter jumps to the next mark and, after the last, back to the first; Shift plus Enter goes backwards.",
      waageLead: "A missed sale weighs as much as",
      waageTail: "a leftover unit (your assumption)",
      waageLabel: "Weight of a missed sale",
      waageDiamond: "best value {opt} at {r} : 1",
      stripLabel: "Look at another week",
      stripCells: ["W-4", "W-3", "W-2", "W-1", "Launch", "W+1", "W+2"],
      stripCell: "Week {week}, short in {n} of 100",
      miniBar: "Stock {cap}",
      replay: "Replay",
    },
    form: {
      title: "Your case",
      lead: "Enter the range of your own forecast. The staircase recalculates at once.",
      p10: "Low",
      p10Hint: "More than this in 9 of 10 weeks",
      p50: "Forecast (middle)",
      p50Hint: "More than this in half the weeks",
      p90: "High",
      p90Hint: "More than this in only 1 of 10 weeks",
      supply: "Stock today",
      ratio: "Missed sale = x leftover units",
      ratioHint: "1 to 20",
      unit: "Unit",
      unitHint: "units",
      reset: "Reset to workshop case",
      privacy: "Stays on your device. Nothing is sent or stored.",
      lastValid: "Still showing the last valid case",
      supplyMoved: "Was outside your range, now on the forecast. Change it if you like.",
      supplyFar: "Far outside the range: the result will almost always be 0 or 100 of 100.",
      errors: {
        order: "Low must be below the forecast, and the forecast below high.",
        number: "Please enter a number, for example 1,180.",
        negative: "Numbers must be 0 or more.",
        ratio: "The weight is between 1 and 20.",
        unit: "The unit has at most 12 characters.",
      },
    },
    takeaways: {
      heading: "To take with you, built from your line",
      copy: "Copy",
      copied: "Copied",
      selectCopy: "Select and copy",
      mailTitle: "Sentence for the email",
      questionsTitle: "3 questions for the room",
      workingTitle: "Working and assumption",
      questionsIntro: "Before every forecast number, ask:",
      questions: [
        "Which range belongs to the number, from low to high?",
        "Which weighs more, too little or too much, and by what factor?",
        "Error on what: units or percent per row? And who decides when the daily check tips?",
      ],
      mail: {
        head: "Forecast {p50} {u} (range {p10} to {p90}), stock {cap}: in {n} of 100 possible launch weeks the stock is not enough, on average {short} {u} are missing.",
        atForecastLess: "At stock {p50} it would still be {nP50} of 100.",
        atForecast: "At stock {p50} it would be {nP50} of 100.",
        equalWeight:
          "With equal weight on both mistakes, the forecast {p50} itself is the plan number.",
        weighBelow:
          "If a missed sale weighs {r} times as much as a {rest} (our assumption), {opt} is the better plan number.",
        weighAbove:
          "If a missed sale weighs {r} times as much as a {rest} (our assumption), the stock is at or above the better plan number {opt}.",
        open: "Open: who gets the missing {u} first, and by which rule?",
      },
      working:
        "Plan number {opt} = {pct} percentile at ratio {r} : 1 (our assumption). Source: forecast range p10 {p10}, p50 {p50}, p90 {p90}; assumption: linear between the three values, 100 equally likely scenarios, not a measurement. Stock {cap}: short in {n} of 100, avg. missing {short}, avg. leftover {left}.",
      workingNoPlan:
        "Source: forecast range p10 {p10}, p50 {p50}, p90 {p90}; assumption: linear between the three values, 100 equally likely scenarios, not a measurement. Stock {cap}: short in {n} of 100, avg. missing {short}, avg. leftover {left}.",
    },
  },
} as const satisfies Record<Locale, DemoPack>;
