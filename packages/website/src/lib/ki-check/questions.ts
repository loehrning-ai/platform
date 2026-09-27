// KI-Check — question bank, dimension metadata and score bands.
//
// Ten Likert questions across five AI-literacy dimensions (two each). Every
// option carries a short "meaning" reveal so the check teaches while it
// measures. German du-form, warm and concrete. Keep this file free of em- and
// en-dashes (content-lint hard-fails) and of React imports (scoring and build
// scripts import it).

import type {
  DimensionId,
  DimensionMeta,
  Question,
  RatingBand,
  StageBand,
} from "./types";

/** Canonical dimension order used for the radar, the steps and the results. */
export const DIMENSION_ORDER: readonly DimensionId[] = [
  "grundlagen",
  "urteil",
  "recht",
  "verantwortung",
  "praxis",
] as const;

export const DIMENSIONS: readonly DimensionMeta[] = [
  {
    id: "grundlagen",
    name: "KI verstehen",
    short: "Grundlagen",
    description: "Was KI im Kern macht und wo ihre Grenzen liegen.",
    accent: "kupfer",
    iconName: "Lightbulb",
  },
  {
    id: "urteil",
    name: "Kritisch einordnen",
    short: "Urteil",
    description: "Deepfakes, Verzerrungen und die Verlässlichkeit von KI.",
    accent: "amber",
    iconName: "ScanSearch",
  },
  {
    id: "recht",
    name: "Regeln kennen",
    short: "Recht",
    description: "Was der EU AI Act für den Alltag mit KI bedeutet.",
    accent: "kupfer",
    iconName: "Scale",
  },
  {
    id: "verantwortung",
    name: "Verantwortung tragen",
    short: "Verantwortung",
    description: "Datenschutz, Transparenz und nachvollziehbare Nutzung.",
    accent: "sand",
    iconName: "ShieldCheck",
  },
  {
    id: "praxis",
    name: "In der Arbeit anwenden",
    short: "Praxis",
    description: "KI gezielt einsetzen und Ergebnisse prüfen.",
    accent: "amber",
    iconName: "Workflow",
  },
] as const;

export const QUESTIONS: readonly Question[] = [
  // --- Grundlagen ---------------------------------------------------------
  {
    id: "g1",
    dimensionId: "grundlagen",
    text: "Könntest du erklären, was ein KI-Sprachmodell macht?",
    options: [
      {
        score: 1,
        text: "Nein, für mich ist KI eine Blackbox.",
        meaning: "Die Grundidee fehlt noch.",
      },
      {
        score: 2,
        text: "Grob, aber es bliebe schwammig.",
        meaning: "Du hast ein erstes Bild, aber noch kein klares Modell.",
      },
      {
        score: 3,
        text: "Ja, ich kann in eigenen Worten erklären, wie es Text erzeugt.",
        meaning: "Du kannst es anderen erklären.",
      },
      {
        score: 4,
        text: "Ja, auch Begriffe wie Training und Halluzination.",
        meaning: "Du kennst die Begriffe, auf die alles Weitere baut.",
      },
    ],
  },
  {
    id: "g2",
    dimensionId: "grundlagen",
    text: "Ein KI-Chat antwortet überzeugend. Was nimmst du an?",
    options: [
      {
        score: 1,
        text: "Wenn es flüssig klingt, wird es schon stimmen.",
        meaning: "Eine sicher klingende Antwort kann trotzdem falsch sein.",
      },
      {
        score: 2,
        text: "Fehler sind möglich, aber ich prüfe selten.",
        meaning: "Das Risiko ist dir bewusst, die Routine fehlt noch.",
      },
      {
        score: 3,
        text: "KI kann Dinge erfinden, also prüfe ich Wichtiges nach.",
        meaning: "Du behandelst KI-Antworten als Material zum Prüfen.",
      },
      {
        score: 4,
        text: "Ich erkenne riskante Antworten und wähle die passende Prüfung.",
        meaning: "Du verbindest bekannte Fehlerarten mit passenden Kontrollen.",
      },
    ],
  },
  // --- Urteil -------------------------------------------------------------
  {
    id: "u1",
    dimensionId: "urteil",
    text: "Ein Video zeigt eine bekannte Person, die etwas Ungewöhnliches sagt. Was tust du?",
    options: [
      {
        score: 1,
        text: "Video ist Video, das glaube ich erst einmal.",
        meaning: "Deepfakes hast du noch nicht im Blick.",
      },
      {
        score: 2,
        text: "Ich bin skeptisch, weiß aber nicht, woran ich eine Fälschung erkenne.",
        meaning: "Du zweifelst, aber dir fehlt eine Prüfmethode.",
      },
      {
        score: 3,
        text: "Ich achte auf typische Anzeichen und suche nach der Originalquelle.",
        meaning: "Du prüfst aktiv, bevor du teilst.",
      },
      {
        score: 4,
        text: "Ich erkenne Manipulationsmuster und zeige anderen, wie sie prüfen.",
        meaning: "Andere können deine Prüfmethode wiederholen.",
      },
    ],
  },
  {
    id: "u2",
    dimensionId: "urteil",
    text: "Warum kann eine KI bei Bewerbungen oder Krediten Menschen benachteiligen?",
    options: [
      {
        score: 1,
        text: "Keine Ahnung, ich dachte, KI ist neutral.",
        meaning: "Trainingsdaten können bestehende Vorurteile enthalten.",
      },
      {
        score: 2,
        text: "Ich habe davon gehört, kann es aber nicht erklären.",
        meaning: "Du kennst das Wort Bias, aber nicht den Mechanismus.",
      },
      {
        score: 3,
        text: "Ich weiß, dass KI Verzerrungen aus Trainingsdaten übernimmt.",
        meaning: "Du verstehst, woher Bias kommt.",
      },
      {
        score: 4,
        text: "Ich kenne Beispiele und Wege, Verzerrungen zu erkennen und zu senken.",
        meaning: "Du verbindest das Risiko mit Tests und Gegenmaßnahmen.",
      },
    ],
  },
  // --- Recht --------------------------------------------------------------
  {
    id: "r1",
    dimensionId: "recht",
    text: "Wie gut kennst du den AI Act, die KI-Verordnung der EU?",
    options: [
      {
        score: 1,
        text: "Davon habe ich noch nichts gehört.",
        meaning: "Der rechtliche Rahmen ist Neuland.",
      },
      {
        score: 2,
        text: "Den Namen kenne ich, die Inhalte nicht.",
        meaning: "Du weißt, dass es Regeln gibt.",
      },
      {
        score: 3,
        text: "Ich kenne die Grundidee mit den Risikoklassen.",
        meaning: "Du kannst die Logik grob einordnen.",
      },
      {
        score: 4,
        text: "Ich kenne Rollen und Pflichten für einen konkreten Fall.",
        meaning: "Du kannst konkrete Fälle einordnen.",
      },
    ],
  },
  {
    id: "r2",
    dimensionId: "recht",
    text: "Wann muss man Menschen sagen, dass sie mit KI sprechen oder KI-Inhalte sehen?",
    options: [
      {
        score: 1,
        text: "Keine Ahnung, darüber habe ich nie nachgedacht.",
        meaning: "Transparenzpflichten sind noch kein Thema.",
      },
      {
        score: 2,
        text: "Ich vermute, es gibt Regeln, kenne sie aber nicht.",
        meaning: "Du ahnst eine Pflicht, kannst sie aber nicht einordnen.",
      },
      {
        score: 3,
        text: "Ich weiß, dass Chatbots und bestimmte KI-Inhalte gekennzeichnet werden müssen.",
        meaning: "Du kennst die Kennzeichnungspflicht.",
      },
      {
        score: 4,
        text: "Ich weiß, welche Fälle Kennzeichnung brauchen und wie man sie umsetzt.",
        meaning: "Du setzt die Pflicht in einen Arbeitsschritt um.",
      },
    ],
  },
  // --- Verantwortung ------------------------------------------------------
  {
    id: "v1",
    dimensionId: "verantwortung",
    text: "Du willst Arbeitsinhalte in einen KI-Chat kopieren. Was prüfst du zuerst?",
    options: [
      {
        score: 1,
        text: "Ich kopiere rein, was gerade da ist.",
        meaning: "Die Datenschutz-Prüfung fehlt noch.",
      },
      {
        score: 2,
        text: "Ich zögere bei heiklen Daten, entscheide aber aus dem Bauch.",
        meaning: "Du siehst das Problem, aber dir fehlen klare Regeln.",
      },
      {
        score: 3,
        text: "Ich prüfe, ob personenbezogene oder vertrauliche Daten enthalten sind.",
        meaning: "Du prüfst die Daten, bevor du sie eingibst.",
      },
      {
        score: 4,
        text: "Ich halte mich an klare Regeln, welche Daten rein dürfen.",
        meaning: "Dein Umgang ist einheitlich und überprüfbar.",
      },
    ],
  },
  {
    id: "v2",
    dimensionId: "verantwortung",
    text: "Eine KI hat dir bei einer wichtigen Entscheidung geholfen. Was hältst du fest?",
    options: [
      {
        score: 1,
        text: "Nichts, das Ergebnis zählt.",
        meaning: "Später sieht niemand, was die KI beigetragen hat.",
      },
      {
        score: 2,
        text: "Ich merke es mir grob, schreibe aber nichts auf.",
        meaning: "Die Begründung hängt an deinem Gedächtnis.",
      },
      {
        score: 3,
        text: "Ich notiere, dass und wofür ich KI genutzt habe.",
        meaning: "Deine Nutzung ist nachvollziehbar.",
      },
      {
        score: 4,
        text: "Ich halte Prompt, Prüfung, Ergebnis und meine Entscheidung fest.",
        meaning: "Andere können nachprüfen, wie die Entscheidung entstand.",
      },
    ],
  },
  // --- Praxis -------------------------------------------------------------
  {
    id: "p1",
    dimensionId: "praxis",
    text: "Wie gehst du an eine Aufgabe heran, bei der KI helfen könnte?",
    options: [
      {
        score: 1,
        text: "Ich mache alles von Hand, KI kommt mir nicht in den Sinn.",
        meaning: "KI ist noch nicht Teil deines Werkzeugkastens.",
      },
      {
        score: 2,
        text: "Ich tippe einen kurzen Satz und nehme, was kommt.",
        meaning: "Du probierst, aber ohne Methode.",
      },
      {
        score: 3,
        text: "Ich gebe Rolle, Kontext und Ziel an und arbeite mit Nachfragen.",
        meaning: "Du steuerst die KI mit klaren Vorgaben.",
      },
      {
        score: 4,
        text: "Ich baue mir wiederverwendbare Abläufe für wiederkehrende Aufgaben.",
        meaning: "Du arbeitest systematisch mit KI.",
      },
    ],
  },
  {
    id: "p2",
    dimensionId: "praxis",
    text: "Wie prüfst du, was eine KI dir für die Arbeit liefert?",
    options: [
      {
        score: 1,
        text: "Ich übernehme das Ergebnis meist direkt.",
        meaning: "Die Prüf-Routine fehlt noch.",
      },
      {
        score: 2,
        text: "Ich lese drüber, verlasse mich im Zweifel aber darauf.",
        meaning: "Du liest es, testest es aber nicht.",
      },
      {
        score: 3,
        text: "Ich prüfe Fakten und passe den Ton an, bevor ich es nutze.",
        meaning: "Du bleibst verantwortlich für das Ergebnis.",
      },
      {
        score: 4,
        text: "Ich habe feste Prüfschritte und weiß, wo KI besonders fehleranfällig ist.",
        meaning: "Review ist bei dir ein fester Arbeitsschritt.",
      },
    ],
  },
] as const;

/** Five-rung composite ladder. Bands are [min, max) except the last (inclusive). */
export const STAGE_BANDS: readonly StageBand[] = [
  {
    level: 1,
    label: "Neugierig",
    min: 0,
    max: 20,
    blurb:
      "Die Grundbegriffe und Prüfschritte sind neu. Beginne mit Funktionsweise, Fehlertypen und Datenregeln.",
  },
  {
    level: 2,
    label: "Orientiert",
    min: 20,
    max: 40,
    blurb:
      "Du kennst mehrere Themen. Es fehlt noch eine feste Methode für Prüfung, Datenverwendung und Regeln.",
  },
  {
    level: 3,
    label: "Solide",
    min: 40,
    max: 60,
    blurb:
      "Du setzt KI für gewöhnliche Aufgaben ein und erkennst mehrere Risiken. Vertiefe die schwächeren Felder.",
  },
  {
    level: 4,
    label: "Sicher",
    min: 60,
    max: 80,
    blurb:
      "Du setzt KI bewusst ein und kannst deine Prüfschritte erklären. Kläre die rechtlichen und betrieblichen Details deiner Rolle.",
  },
  {
    level: 5,
    label: "Souverän",
    min: 80,
    max: 100,
    blurb:
      "Du prüfst KI-Ergebnisse kritisch, schützt Daten und dokumentierst wichtige Entscheidungen. Wähle nach den Feldwerten ein Vertiefungsthema.",
  },
] as const;

/** Per-dimension rating labels + bar tint, keyed by the normalized 0-100 score. */
export const RATING_BANDS: readonly RatingBand[] = [
  { min: 0, max: 25, label: "Startpunkt", toneVar: "--color-brand-amber" },
  { min: 25, max: 50, label: "Im Aufbau", toneVar: "--color-brand-amber" },
  { min: 50, max: 75, label: "Solide", toneVar: "--color-brand-sand" },
  { min: 75, max: 100.01, label: "Stark", toneVar: "--color-brand-orange" },
] as const;

export function dimensionMetaFor(id: DimensionId): DimensionMeta {
  const meta = DIMENSIONS.find((d) => d.id === id);
  if (!meta) {
    throw new Error(`Unknown KI-Check dimension: ${id}`);
  }
  return meta;
}

/** Total number of questions in the check. */
export const TOTAL_QUESTIONS = QUESTIONS.length;
