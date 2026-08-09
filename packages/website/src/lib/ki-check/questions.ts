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
    text: "Wie sicher fühlst du dich, wenn jemand fragt, was ein KI-Sprachmodell eigentlich macht?",
    options: [
      {
        score: 1,
        text: "Ich müsste passen. Für mich ist KI eine Blackbox.",
        meaning: "Startpunkt: Die Grundidee fehlt noch.",
      },
      {
        score: 2,
        text: "Ich habe eine grobe Vorstellung, aber es bleibt schwammig.",
        meaning: "Ein erstes Gefühl, aber noch keine klare Landkarte.",
      },
      {
        score: 3,
        text: "Ich kann in eigenen Worten erklären, wie so ein Modell Text erzeugt.",
        meaning: "Solide Basis: Du kannst es weitergeben.",
      },
      {
        score: 4,
        text: "Ich erkläre es anderen und ordne Begriffe wie Training oder Halluzination ein.",
        meaning: "Sicheres Fundament, auf dem alles Weitere aufbaut.",
      },
    ],
  },
  {
    id: "g2",
    dimensionId: "grundlagen",
    text: "Ein KI-Chat gibt dir eine Antwort, die überzeugend klingt. Was denkst du?",
    options: [
      {
        score: 1,
        text: "Wenn es flüssig klingt, wird es schon stimmen.",
        meaning: "Dass KI sicher klingen und trotzdem falsch liegen kann, ist neu.",
      },
      {
        score: 2,
        text: "Ich ahne, dass Fehler drin sein können, prüfe aber selten.",
        meaning: "Das Risiko ist dir bewusst, die Routine fehlt noch.",
      },
      {
        score: 3,
        text: "Ich weiß, dass KI Dinge erfinden kann, und prüfe Wichtiges nach.",
        meaning: "Gesundes Misstrauen: Du nutzt KI mündig.",
      },
      {
        score: 4,
        text: "Ich kann einschätzen, wann Halluzinationen wahrscheinlich sind, und steuere gegen.",
        meaning: "Du verstehst die Grenzen im Detail.",
      },
    ],
  },
  // --- Urteil -------------------------------------------------------------
  {
    id: "u1",
    dimensionId: "urteil",
    text: "Ein Video zeigt eine bekannte Person, die etwas Ungewöhnliches sagt. Deine Reaktion?",
    options: [
      {
        score: 1,
        text: "Video ist Video, das glaube ich erst einmal.",
        meaning: "Deepfakes sind für dich noch kein Thema.",
      },
      {
        score: 2,
        text: "Ich bin skeptisch, weiß aber nicht, woran ich eine Fälschung erkenne.",
        meaning: "Zweifel ja, Werkzeuge nein.",
      },
      {
        score: 3,
        text: "Ich achte auf typische Anzeichen und suche nach der Originalquelle.",
        meaning: "Du prüfst aktiv, bevor du teilst.",
      },
      {
        score: 4,
        text: "Ich erkenne Manipulationsmuster und zeige anderen, wie sie prüfen.",
        meaning: "Du bist eine verlässliche Instanz im Umfeld.",
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
        text: "Das wüsste ich nicht, KI ist doch neutral.",
        meaning: "Dass Daten Vorurteile tragen, ist ein neuer Gedanke.",
      },
      {
        score: 2,
        text: "Ich habe davon gehört, kann es aber nicht erklären.",
        meaning: "Das Stichwort Bias sagt dir etwas.",
      },
      {
        score: 3,
        text: "Mir ist klar, dass KI Verzerrungen aus den Trainingsdaten übernimmt.",
        meaning: "Du verstehst, woher Bias kommt.",
      },
      {
        score: 4,
        text: "Ich kann Beispiele nennen und weiß, wie man solchen Verzerrungen begegnet.",
        meaning: "Du denkst Wirkung und Gegenmaßnahmen zusammen.",
      },
    ],
  },
  // --- Recht --------------------------------------------------------------
  {
    id: "r1",
    dimensionId: "recht",
    text: "Kennst du die EU-Verordnung, die den Einsatz von KI regelt (den AI Act)?",
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
        text: "Ich weiß, welche Pflichten für Nutzer und Anbieter gelten.",
        meaning: "Du kannst konkrete Fälle einordnen.",
      },
    ],
  },
  {
    id: "r2",
    dimensionId: "recht",
    text: "Ab wann muss man Menschen sagen, dass sie mit einer KI sprechen oder KI-Inhalte sehen?",
    options: [
      {
        score: 1,
        text: "Keine Ahnung, darüber habe ich nie nachgedacht.",
        meaning: "Transparenzpflichten sind noch kein Thema.",
      },
      {
        score: 2,
        text: "Ich vermute, es gibt Regeln, kenne sie aber nicht.",
        meaning: "Eine Ahnung ist da.",
      },
      {
        score: 3,
        text: "Ich weiß, dass Chatbots und viele KI-Inhalte gekennzeichnet werden müssen.",
        meaning: "Du kennst die Kennzeichnungspflicht.",
      },
      {
        score: 4,
        text: "Ich kann sagen, welche Fälle Transparenz brauchen und wie man sie umsetzt.",
        meaning: "Du bist praktisch handlungsfähig.",
      },
    ],
  },
  // --- Verantwortung ------------------------------------------------------
  {
    id: "v1",
    dimensionId: "verantwortung",
    text: "Du willst einen KI-Chat mit Inhalten aus deiner Arbeit füttern. Woran denkst du zuerst?",
    options: [
      {
        score: 1,
        text: "Ich kopiere rein, was gerade da ist.",
        meaning: "Der Datenschutz-Reflex fehlt noch.",
      },
      {
        score: 2,
        text: "Ich zögere bei heiklen Daten, entscheide aber aus dem Bauch.",
        meaning: "Ein Bewusstsein ist da, klare Regeln fehlen.",
      },
      {
        score: 3,
        text: "Ich prüfe, ob personenbezogene oder vertrauliche Daten enthalten sind.",
        meaning: "Du triffst bewusste Entscheidungen.",
      },
      {
        score: 4,
        text: "Ich halte mich an klare Regeln, was rein darf und was nicht.",
        meaning: "Du arbeitest sicher und nachvollziehbar.",
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
        meaning: "Nachvollziehbarkeit ist noch kein Thema.",
      },
      {
        score: 2,
        text: "Ich merke es mir grob, dokumentiere aber nichts.",
        meaning: "Im Kopf ja, auf Papier nein.",
      },
      {
        score: 3,
        text: "Ich notiere, dass und wofür ich KI genutzt habe.",
        meaning: "Deine Nutzung ist nachvollziehbar.",
      },
      {
        score: 4,
        text: "Ich halte Prompt, Prüfung und Entscheidung so fest, dass andere es nachvollziehen.",
        meaning: "Du machst Verantwortung belegbar.",
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
        meaning: "Erste Versuche, aber ohne Methode.",
      },
      {
        score: 3,
        text: "Ich gebe Rolle, Kontext und Ziel an und arbeite mit Nachfragen.",
        meaning: "Du führst die KI gezielt.",
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
        meaning: "Ein kurzer Blick, aber kein echter Check.",
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
      "Du kannst KI für gewöhnliche Aufgaben einsetzen und mehrere Risiken erkennen. Vertiefe gezielt die schwächeren Felder.",
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
      "Du prüfst KI-Ergebnisse kritisch, schützt Daten und dokumentierst wichtige Entscheidungen. Wähle anhand der Feldwerte ein enges Vertiefungsthema.",
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
