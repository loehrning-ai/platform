/**
 * Course-track taxonomy (CI v3.1). Kept separate from catalog.ts so the catalog
 * stays plain data (no React/icon imports leak into build scripts). The UI joins
 * a course slug to its track meta to render the icon tile, accent and badge that
 * make the three course types legible at a glance.
 *
 * Three tracks:
 *   zertifikat  — the 4 native German certified courses (Kupfer)
 *   github-lab  — the 6 English MIT technical courses, external (Sand)
 *   brainster   — applied client workshops turned courses (Amber)
 */

export type CourseTrack = "zertifikat" | "github-lab" | "brainster";
export type TrackAccent = "kupfer" | "sand" | "amber";

export interface TrackMeta {
  readonly track: CourseTrack;
  readonly accent: TrackAccent;
  /** lucide-react export name; resolved to a component in the UI layer. */
  readonly iconName: string;
  /** Short type badge shown on the card. */
  readonly badge: string;
}

/** Per-course track meta, keyed by catalog slug. */
export const TRACK_META: Record<string, TrackMeta> = {
  // Zertifikatskurse — native, certified, German
  "ki-fuehrerschein": { track: "zertifikat", accent: "kupfer", iconName: "GraduationCap", badge: "Zertifikat · Deutsch" },
  "ki-und-gesellschaft": { track: "zertifikat", accent: "kupfer", iconName: "Users", badge: "Zertifikat · Deutsch" },
  "eu-ai-act-kurs": { track: "zertifikat", accent: "kupfer", iconName: "Scale", badge: "Zertifikat · Deutsch" },
  "ai-native": { track: "zertifikat", accent: "kupfer", iconName: "Bot", badge: "Zertifikat · Deutsch" },

  // GitHub-Labs — imported, MIT, English, external
  "data-engineering-fundamentals": { track: "github-lab", accent: "sand", iconName: "Database", badge: "GitHub · MIT · Englisch" },
  "data-science": { track: "github-lab", accent: "sand", iconName: "LineChart", badge: "GitHub · MIT · Englisch" },
  "data-infrastructure": { track: "github-lab", accent: "sand", iconName: "Server", badge: "GitHub · MIT · Englisch" },
  "codex": { track: "github-lab", accent: "sand", iconName: "TerminalSquare", badge: "GitHub · MIT · Englisch" },
  "claude": { track: "github-lab", accent: "sand", iconName: "Sparkles", badge: "GitHub · MIT · Englisch" },
  "ai-native-operator": { track: "github-lab", accent: "sand", iconName: "Workflow", badge: "GitHub · MIT · Englisch" },
};

export function trackMetaFor(slug: string): TrackMeta {
  return (
    TRACK_META[slug] ?? {
      track: "zertifikat",
      accent: "kupfer",
      iconName: "BookOpen",
      badge: "Kurs",
    }
  );
}

/** Section headers + explainers for the three-track /kurse layout. */
export const TRACK_SECTIONS: ReadonlyArray<{
  readonly track: CourseTrack;
  readonly accent: TrackAccent;
  readonly title: string;
  readonly eyebrow: string;
  readonly blurb: string;
}> = [
  {
    track: "zertifikat",
    accent: "kupfer",
    title: "Zertifikatskurse",
    eyebrow: "Deutsch · mit Nachweis",
    blurb:
      "Der Lernpfad in vier Schritten, auf Deutsch, mit gespeichertem Fortschritt und Teilnahmebestätigung. Fang oben an und arbeite dich vor.",
  },
  {
    track: "github-lab",
    accent: "sand",
    title: "GitHub-Labs",
    eyebrow: "Englisch · Open Source · extern",
    blurb:
      "Technische Vertiefung als interaktive Browserkurse, quelloffen auf GitHub (MIT). Extern gehostet, ohne Konto, mit Live-Simulationen.",
  },
  {
    track: "brainster",
    accent: "amber",
    title: "Angewandte Kurse",
    eyebrow: "Praxis · Live gebaut",
    blurb:
      "Kurse aus echten Workshops: ein Arbeitsablauf, den du Schritt für Schritt mitbaust, mit Material zum Nachbauen mit eigenen Zahlen.",
  },
];

/** Applied ("Brainster") course track. Business reports is live; forecasting is in preparation. */
export interface BrainsterCourse {
  readonly slug: string;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly href: string;
  readonly duration: string;
  readonly language: "Deutsch" | "Englisch";
  readonly audience: string;
  readonly status: "live" | "prep";
  readonly iconName: string;
}

export const BRAINSTER_COURSE_CATALOG: readonly BrainsterCourse[] = [
  {
    slug: "geschaeftsberichte-mit-ki-lesen",
    title: "Geschäftsberichte mit KI lesen",
    tagline: "Baue live einen KI-Analysten für monatliche Geschäftsberichte.",
    description:
      "Du baust in der Claude-App Schritt für Schritt einen Analysten, der Monatsberichte einliest, Kennzahlen exakt berechnet und Auffälligkeiten erklärt. Mit Übungs-Kit zum Nachbauen.",
    href: "/workshops/geschaeftsberichte-mit-ki-lesen",
    duration: "ca. 75 Min.",
    language: "Deutsch",
    audience: "Controlling, Finance, Reporting",
    status: "live",
    iconName: "Presentation",
  },
  {
    slug: "ai-forecasting",
    title: "AI-Forecasting",
    tagline: "Nachfrage und Kennzahlen mit KI vorhersagen und prüfen.",
    description:
      "Von der Datenaufbereitung bis zur belastbaren Prognose: Wie KI bei Forecasting hilft, wo ihre Grenzen liegen und wie du Ergebnisse kritisch prüfst.",
    href: "/kurse",
    duration: "in Vorbereitung",
    language: "Deutsch",
    audience: "Planung, Supply Chain, Analytik",
    status: "prep",
    iconName: "TrendingUp",
  },
];
