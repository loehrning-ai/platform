import type { Locale } from "./locale";

export type ProfileMilestone = Readonly<{
  period: string;
  role: string;
  company: string;
  description: string;
}>;

export type ProfileCredential = Readonly<{
  id: "degree" | "international" | "research";
  title: string;
  subtitle?: string;
  detail: string;
  evidence?: readonly Readonly<{ label: string; href: string }>[];
}>;

type ProfileCopy = Readonly<{
  metadata: Readonly<{
    title: string;
    description: string;
    socialTitle: string;
    portraitAlt: string;
  }>;
  breadcrumbHome: string;
  personJobTitle: string;
  personDescription: string;
  knowsAbout: readonly string[];
  hero: Readonly<{
    eyebrow: string;
    title: string;
    intro: string;
    detail: string;
    portraitCaption: string;
    roleLabel: string;
    roleValue: string;
    focusLabel: string;
    focusValue: string;
    accessLabel: string;
    accessValue: string;
  }>;
  stations: Readonly<{
    ariaLabel: string;
    eyebrow: string;
    title: string;
    notice: string;
  }>;
  timeline: Readonly<{
    eyebrow: string;
    title: string;
    intro: string;
    ariaLabel: string;
    currentLabel: string;
    milestones: readonly ProfileMilestone[];
  }>;
  credentials: Readonly<{
    eyebrow: string;
    title: string;
    intro: string;
    cards: readonly ProfileCredential[];
  }>;
  editorial: Readonly<{
    eyebrow: string;
    title: string;
    intro: string;
    policies: readonly Readonly<{ title: string; body: string }>[];
    guidePrefix: string;
    guideLabel: string;
  }>;
  contact: Readonly<{
    eyebrow: string;
    title: string;
    intro: string;
    linksLabel: string;
    email: string;
    linkedIn: string;
    github: string;
    feedbackPrefix: string;
    feedbackLabel: string;
  }>;
}>;

export const PROFILE_COPY: Readonly<Record<Locale, ProfileCopy>> = {
  de: {
    metadata: {
      title: "Über Tim Löhr",
      description:
        "Profil von Tim Löhr, Kurator von loehrning.ai: berufliche Stationen, Ausbildung, redaktionelle Arbeitsweise und Kontakt.",
      socialTitle: "Tim Löhr · Kurator von loehrning.ai",
      portraitAlt: "Tim Löhr vor der Golden Gate Bridge",
    },
    breadcrumbHome: "Start",
    personJobTitle: "Kurator von loehrning.ai",
    personDescription:
      "Tim Löhr entwickelt loehrning.ai als weitgehend öffentliches Lernarchiv für KI, Datenarbeit und technische Praxis.",
    knowsAbout: [
      "KI-Kompetenz",
      "Data Engineering",
      "Dateninfrastruktur",
      "AI-native Workflows",
      "EU AI Act",
    ],
    hero: {
      eyebrow: "Person und Arbeit",
      title: "Ich baue loehrning.ai als öffentliches Lernarchiv.",
      intro:
        "Ich bin Tim Löhr. Beruflich habe ich als Data Scientist bei Apple und Red Bull sowie als Data Engineer bei Meta gearbeitet.",
      detail:
        "Auf dieser Plattform veröffentliche ich Kurse, Bücher, Demos, Workshops und technische Notizen. Vier Grundlagen-Reader benötigen ein kostenloses Lernkonto; die übrigen veröffentlichten Lernmaterialien sind ohne Konto erreichbar. Aussagen sollen nachvollziehbar, Quellen sichtbar und Grenzen ausdrücklich sein.",
      portraitCaption: "Tim Löhr · loehrning.ai",
      roleLabel: "Rolle",
      roleValue: "Kurator und Entwickler",
      focusLabel: "Schwerpunkte",
      focusValue: "KI-Kompetenz · Datenarbeit · technische Praxis",
      accessLabel: "Plattform",
      accessValue: "Freier Zugang · öffentliche Quellen",
    },
    stations: {
      ariaLabel: "Frühere berufliche Stationen",
      eyebrow: "Berufliche Einordnung",
      title: "Frühere Arbeitgeber",
      notice:
        "Die genannten Unternehmen dienen ausschließlich der biografischen Einordnung. Sie bestätigen oder unterstützen loehrning.ai nicht.",
    },
    timeline: {
      eyebrow: "Laufbahn",
      title: "Berufliche Stationen",
      intro:
        "Die Chronologie zeigt Zeitraum, Rolle und Arbeitsschwerpunkt jeder Station.",
      ariaLabel: "Chronologie der beruflichen Stationen",
      currentLabel: "Aktuell",
      milestones: [
        {
          period: "2021",
          role: "Werkstudent",
          company: "Amazon",
          description: "Erste Datenrolle neben dem Studium.",
        },
        {
          period: "2022–2024",
          role: "Data Scientist",
          company: "Apple",
          description: "Analytics, Datenmodelle und operative Auswertung.",
        },
        {
          period: "2024–2025",
          role: "Data Scientist",
          company: "Red Bull",
          description:
            "KI-Werkzeuge für Fachbereiche, MLOps und Supply-Chain-Analytics.",
        },
        {
          period: "2025–2026",
          role: "Data Engineer",
          company: "Meta",
          description: "Datenqualität, Pipelines und Analytics-Systeme.",
        },
        {
          period: "Seit 2026",
          role: "Kurator",
          company: "loehrning.ai",
          description:
            "Freie Kurse, Bücher, Demos und technische Arbeitsnotizen.",
        },
      ],
    },
    credentials: {
      eyebrow: "Ausbildung und Forschung",
      title: "Akademischer Hintergrund",
      intro:
        "Studium, internationale Programme und Forschungsarbeit, die für die veröffentlichten Inhalte fachlich relevant sind.",
      cards: [
        {
          id: "degree",
          title: "M.Sc. Informatik",
          subtitle: "FAU Erlangen-Nürnberg",
          detail:
            "Abschluss mit Auszeichnung und Deutschlandstipendium. Schwerpunkte: Daten, Machine Learning und Software Engineering.",
        },
        {
          id: "international",
          title: "Internationale Ausbildung",
          subtitle: "Oxford ML Summer School · EELISA Pisa",
          detail:
            "NLP × Finance in Oxford und Innovation Management an der SSSA.",
        },
        {
          id: "research",
          title: "KI-Forschung",
          detail:
            "Machine Learning in klinischen Studien und angewandter Datenanalyse.",
          evidence: [
            {
              label:
                "Fachartikel: KI-Trendanalyse in Healthcare-Podcasts · Evolutionary Intelligence (2024)",
              href: "https://doi.org/10.1007/s12065-023-00878-4",
            },
            {
              label:
                "Konferenzbeitrag: Auswahl einer Studienpopulation für Diabetes-Studien · GI SKILL 2021",
              href: "https://dl.gi.de/handle/20.500.12116/37772",
            },
          ],
        },
      ],
    },
    editorial: {
      eyebrow: "Arbeitsweise",
      title: "Wie ich Inhalte prüfe",
      intro:
        "Die öffentlichen Inhaltsregeln trennen Quellen, Einordnung und Grenzen. Drei Grundsätze gelten für jede veröffentlichte Seite.",
      policies: [
        {
          title: "Primärquellen vor Behauptungen",
          body: "Rechtliche, regulatorische, wissenschaftliche und produktbezogene Aussagen stützen sich auf Primärquellen. Zeitabhängige Inhalte tragen ein Prüfdatum.",
        },
        {
          title: "Beobachtung und Einordnung trennen",
          body: "Beobachtete Fakten, Interpretation, Beispiele und Empfehlungen werden als unterschiedliche Aussagearten behandelt. Annahmen in Rechnern und Simulationen bleiben sichtbar.",
        },
        {
          title: "Grenzen ausdrücklich nennen",
          body: "Die Plattform verspricht weder Akkreditierung noch Rechtssicherheit, Compliance oder garantierte Ergebnisse. Überfällige Prüfungen und bekannte Einschränkungen werden nicht verdeckt.",
        },
      ],
      guidePrefix: "Die vollständigen öffentlichen Regeln stehen in",
      guideLabel: "CONTENT_GUIDE.md",
    },
    contact: {
      eyebrow: "Kontakt",
      title: "Direkter Kontakt",
      intro:
        "Fragen zu Inhalten, Korrekturen und technische Zusammenarbeit erreichen mich per E-Mail oder LinkedIn.",
      linksLabel: "Kontaktwege",
      email: "E-Mail schreiben",
      linkedIn: "Auf LinkedIn schreiben",
      github: "GitHub-Profil öffnen",
      feedbackPrefix: "Inhaltliche Fehler lassen sich auch über",
      feedbackLabel: "das Feedback-Formular",
    },
  },
  en: {
    metadata: {
      title: "About Tim Löhr",
      description:
        "Profile of Tim Löhr, curator of loehrning.ai: previous roles, education, editorial practice, and contact details.",
      socialTitle: "Tim Löhr · Curator of loehrning.ai",
      portraitAlt: "Tim Löhr in front of the Golden Gate Bridge",
    },
    breadcrumbHome: "Home",
    personJobTitle: "Curator of loehrning.ai",
    personDescription:
      "Tim Löhr develops loehrning.ai as a largely public learning archive for AI, data work, and technical practice.",
    knowsAbout: [
      "AI literacy",
      "Data engineering",
      "Data infrastructure",
      "AI-native workflows",
      "EU AI Act",
    ],
    hero: {
      eyebrow: "Person and work",
      title: "I build loehrning.ai as a public learning archive.",
      intro:
        "I am Tim Löhr. I previously worked as a data scientist at Apple and Red Bull and as a data engineer at Meta.",
      detail:
        "On this platform, I publish courses, books, demos, workshops, and technical notes. Four foundation readers require a free learning account; the other published learning materials are available without an account. Claims should be traceable, sources visible, and limitations explicit.",
      portraitCaption: "Tim Löhr · loehrning.ai",
      roleLabel: "Role",
      roleValue: "Curator and developer",
      focusLabel: "Focus",
      focusValue: "AI literacy · data work · technical practice",
      accessLabel: "Platform",
      accessValue: "Free access · public sources",
    },
    stations: {
      ariaLabel: "Previous professional roles",
      eyebrow: "Professional context",
      title: "Previous employers",
      notice:
        "The companies named here provide biographical context only. They do not endorse or support loehrning.ai.",
    },
    timeline: {
      eyebrow: "Career",
      title: "Professional timeline",
      intro:
        "The chronology shows the period, role, and area of work for each position.",
      ariaLabel: "Chronology of professional roles",
      currentLabel: "Current",
      milestones: [
        {
          period: "2021",
          role: "Working student",
          company: "Amazon",
          description: "First data role alongside university studies.",
        },
        {
          period: "2022–2024",
          role: "Data scientist",
          company: "Apple",
          description: "Analytics, data models, and operational analysis.",
        },
        {
          period: "2024–2025",
          role: "Data scientist",
          company: "Red Bull",
          description:
            "AI tools for specialist teams, MLOps, and supply-chain analytics.",
        },
        {
          period: "2025–2026",
          role: "Data engineer",
          company: "Meta",
          description: "Data quality, pipelines, and analytics systems.",
        },
        {
          period: "Since 2026",
          role: "Curator",
          company: "loehrning.ai",
          description:
            "Free courses, books, demos, and technical working notes.",
        },
      ],
    },
    credentials: {
      eyebrow: "Education and research",
      title: "Academic background",
      intro:
        "Degree work, international programmes, and research relevant to the material published here.",
      cards: [
        {
          id: "degree",
          title: "M.Sc. Computer Science",
          subtitle: "FAU Erlangen-Nuremberg",
          detail:
            "Graduated with distinction and received a Deutschlandstipendium. Focus: data, machine learning, and software engineering.",
        },
        {
          id: "international",
          title: "International education",
          subtitle: "Oxford ML Summer School · EELISA Pisa",
          detail: "NLP × Finance at Oxford and Innovation Management at SSSA.",
        },
        {
          id: "research",
          title: "AI research",
          detail:
            "Machine learning in clinical trials and applied data analysis.",
          evidence: [
            {
              label:
                "Journal article: AI trend analysis in healthcare podcasts · Evolutionary Intelligence (2024)",
              href: "https://doi.org/10.1007/s12065-023-00878-4",
            },
            {
              label:
                "Conference paper: identifying a trial population for diabetes studies · GI SKILL 2021",
              href: "https://dl.gi.de/handle/20.500.12116/37772",
            },
          ],
        },
      ],
    },
    editorial: {
      eyebrow: "Editorial practice",
      title: "How I review content",
      intro:
        "The public content rules separate sources, interpretation, and limitations. Three principles apply to every published page.",
      policies: [
        {
          title: "Primary sources before claims",
          body: "Legal, regulatory, scientific, and product claims rely on primary sources. Time-dependent material carries a review date.",
        },
        {
          title: "Separate observation from interpretation",
          body: "Observed facts, interpretation, examples, and recommendations are treated as different kinds of statement. Assumptions in calculators and simulations remain visible.",
        },
        {
          title: "State limitations explicitly",
          body: "The platform does not promise accreditation, legal certainty, compliance, or guaranteed outcomes. Overdue reviews and known limitations are not concealed.",
        },
      ],
      guidePrefix: "The complete public rules are documented in",
      guideLabel: "CONTENT_GUIDE.md",
    },
    contact: {
      eyebrow: "Contact",
      title: "Contact me directly",
      intro:
        "Questions about the material, corrections, and technical collaboration can be sent by email or LinkedIn.",
      linksLabel: "Contact methods",
      email: "Send an email",
      linkedIn: "Message me on LinkedIn",
      github: "Open GitHub profile",
      feedbackPrefix: "Content errors can also be reported through",
      feedbackLabel: "the feedback form",
    },
  },
} as const;
