import {
  BookOpen,
  Brain,
  Workflow,
  Shield,
  Award,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

// ─── Canonical course URL ──────────────────────────────────────────────────

export const AI_NATIVE_URL = "/ai-native";

// ─── Bundle Items (for the learning-materials section) ─────────────────────

export interface AiNativeBundleItem {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly count: string;
}

export const AI_NATIVE_BUNDLE_ITEMS: readonly AiNativeBundleItem[] = [
  {
    title: "Prompt-Muster aus den Lektionen",
    description:
      "RCTFC-strukturierte Prompt-Muster nach Rollen (Vertrieb, HR, Ops, Handwerk). Direkt in den Lektionen eingebettet.",
    icon: BookOpen,
    count: "In den Lektionen",
  },
  {
    title: "Obsidian PARA-Struktur",
    description:
      "Beispielstruktur für einen Mittelstand-Vault nach PARA + MOC. Als Lerndiagramm in Modul 3.",
    icon: Brain,
    count: "In Modul 3",
  },
  {
    title: "n8n-Workflow-Konzepte",
    description:
      "Email-Triage, Meeting-Actions, Wochenbericht: als Diagramme und Ablaufbeschreibungen, kein Code-Export.",
    icon: Workflow,
    count: "In Modul 4",
  },
  {
    title: "EU-AI-Act-Checklisten",
    description:
      "Provider- und Deployer-Pflichten aus dem Annex-III-Deep-Dive. Als strukturierte Übersicht in Modul 4.",
    icon: Shield,
    count: "In Modul 4",
  },
  {
    title: "Claude Skills-Beispiele",
    description:
      "/invoice-parse, /angebot-draft, /meeting-summary-de: Startermuster direkt in den Lektionen.",
    icon: MessageSquare,
    count: "In Modul 2",
  },
  {
    title: "CLAUDE.md-Starter-Muster",
    description:
      "Rollen-spezifische CLAUDE.md-Beispiele für Vertrieb, HR und Ops. Als Lernbeispiele in Modul 2 eingebettet.",
    icon: Award,
    count: "In Modul 2",
  },
];

// ─── FAQ ────────────────────────────────────────────────────────────────────

export interface AiNativeFaqItem {
  readonly question: string;
  readonly answer: string;
}

export const AI_NATIVE_FAQ: readonly AiNativeFaqItem[] = [
  {
    question: "Brauche ich Vorkenntnisse?",
    answer:
      "Ja, wir empfehlen den kostenlosen KI-Führerschein zuvor. Der deckt EU-AI-Act-Compliance, Datenklassifizierung und Prompt-Basics ab. Der Arbeitskurs baut darauf auf.",
  },
  {
    question: "Wie lange dauert der Arbeitskurs?",
    answer:
      "12-15 Stunden Lernzeit insgesamt (Lektionen + Übungen + Capstone). Selbstlern-Format. Empfehlung: über 4-8 Wochen.",
  },
  {
    question: "Was kostet der Arbeitskurs?",
    answer:
      "Nichts. Alle vier Module, alle 27 Lektionen und die zugehörigen Lernvorlagen sind kostenlos. Für den deutschen Kernkurs brauchst du ein kostenloses Lernkonto. Keine Kreditkarte, keine versteckten Stufen.",
  },
  {
    question: "Was ist der Unterschied zu Chef-Treff oder anderen AI-Kursen?",
    answer:
      "Der Fokus liegt auf Claude-first-Arbeitsweise, EU AI Act, Obsidian und Mittelstand-Vokabular. Die Materialien ergänzen die Lektionen mit Skills-Mustern, Prompts, Vault-Struktur, MCP-Hinweisen und n8n-Flow-Beispielen.",
  },
  {
    question: "Ist der Kurs wirklich kostenlos?",
    answer:
      "Ja. Der Kurs ist kostenlos und mit einem kostenlosen Lernkonto nutzbar. Förderlogik, Bildungsgutscheine und Anbieterzertifizierung spielen für diese freie Lernversion keine Rolle.",
  },
  {
    question: "Was passiert, wenn ein gelehrtes Tool sich stark ändert?",
    answer:
      "Wir aktualisieren betroffene Lektionen binnen 30 Tagen. Die Updates sind, wie der ganze Arbeitskurs, kostenlos.",
  },
  {
    question: "Wie ist der Capstone strukturiert?",
    answer:
      "7 Tage, 10-15 Stunden Scope. Du dokumentierst und testest einen echten Workflow und checkst ihn anhand der binären 7-Punkte-Rubrik selbst ab. Das Zertifikat ist eine Teilnahmebestätigung, keine geprüfte Prüfungsleistung, keine behördliche Nachweisform. Eine externe Prüfung findet nicht statt.",
  },
];

// ─── Trust Signals (Hero) ──────────────────────────────────────────────────

export const AI_NATIVE_TRUST_SIGNALS: readonly string[] = [
  "Von Tim Löhr kuratiert und öffentlich dokumentiert.",
  "Technischer Hintergrund in Informatik, Dateninfrastruktur und Analytics.",
  "Basiert auf frei zugänglichen Übungen, Demos und Arbeitsnotizen.",
];
