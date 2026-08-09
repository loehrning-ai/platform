import {
  BookOpen,
  Brain,
  Workflow,
  Shield,
  Award,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";

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

export const AI_NATIVE_BUNDLE_ITEMS_EN: readonly AiNativeBundleItem[] = [
  {
    title: "Prompt patterns from the lessons",
    description:
      "RCTFC prompt patterns for sales, HR, operations and skilled trades, kept beside the lessons that explain them.",
    icon: BookOpen,
    count: "In the lessons",
  },
  {
    title: "Obsidian PARA structure",
    description:
      "An example PARA and map-of-content structure for a maintained small-business knowledge base.",
    icon: Brain,
    count: "Module 3",
  },
  {
    title: "n8n workflow concepts",
    description:
      "Email triage, meeting actions and weekly reporting as diagrams and reviewable process descriptions, not deployable exports.",
    icon: Workflow,
    count: "Module 4",
  },
  {
    title: "EU AI Act checklists",
    description:
      "Structured notes on provider and deployer duties from the Annex III lesson. Educational material, not legal advice.",
    icon: Shield,
    count: "Module 4",
  },
  {
    title: "Claude Skills examples",
    description:
      "Starter patterns for invoice parsing, quotation drafting and meeting summaries, shown within their operating context.",
    icon: MessageSquare,
    count: "Module 2",
  },
  {
    title: "CLAUDE.md starter patterns",
    description:
      "Role-specific examples for sales, HR and operations. The course explains what belongs in the file and what does not.",
    icon: Award,
    count: "Module 2",
  },
];

export function getAiNativeBundleItems(
  locale: Locale,
): readonly AiNativeBundleItem[] {
  return locale === "en" ? AI_NATIVE_BUNDLE_ITEMS_EN : AI_NATIVE_BUNDLE_ITEMS;
}

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
      "Plane rund 12 Stunden für Lektionen und Übungen ein. Für den optionalen Capstone kommen etwa 10 bis 15 Stunden hinzu. Die Bearbeitung erfolgt im eigenen Tempo.",
  },
  {
    question: "Was kostet der Arbeitskurs?",
    answer:
      "Nichts. Alle vier Module, alle 27 Lektionen und die zugehörigen Lernvorlagen sind kostenlos. Für den deutschen Kernkurs brauchst du ein kostenloses Lernkonto. Keine Kreditkarte, keine versteckten Stufen.",
  },
  {
    question: "Was behandelt der Kurs?",
    answer:
      "Der Kurs behandelt klar abgegrenzte Aufgaben, Claude-Arbeitsumgebungen, gepflegtes Wissen, begrenzte Automatisierung sowie Datenschutz- und AI-Act-Prüfpunkte. Er bescheinigt keine berufliche Kompetenz oder regulatorische Konformität.",
  },
  {
    question: "Ist der Kurs vollständig kostenlos?",
    answer:
      "Ja. Der Kurs ist kostenlos und mit einem kostenlosen Lernkonto nutzbar. Förderlogik, Bildungsgutscheine und Anbieterzertifizierung spielen für diese freie Lernversion keine Rolle.",
  },
  {
    question: "Was passiert, wenn ein gelehrtes Tool sich stark ändert?",
    answer:
      "Werkzeugspezifische Lektionen tragen Prüfdaten und werden überarbeitet, wenn eine wesentliche Änderung die Anleitung betrifft. Ein Prüfziel garantiert nicht, dass jede Anbieteränderung sofort abgebildet ist.",
  },
  {
    question: "Wie ist der Capstone strukturiert?",
    answer:
      "Du dokumentierst und testest einen begrenzten Workflow anhand einer binären Sieben-Punkte-Rubrik. Die Teilnahmebestätigung wird lokal aus deinem Fortschritt erzeugt. Es gibt keine externe Prüfung, Akkreditierung oder behördliche Nachweiswirkung.",
  },
];

export const AI_NATIVE_FAQ_EN: readonly AiNativeFaqItem[] = [
  {
    question: "Do I need prior knowledge?",
    answer:
      "The AI Fundamentals course is recommended, not required. It covers basic AI concepts, data classification and prompt structure that this course uses without repeating in full.",
  },
  {
    question: "How long does the course take?",
    answer:
      "Plan about 12 hours for lessons and exercises, plus 10 to 15 hours for the optional capstone. The course is self-paced.",
  },
  {
    question: "What does access cost?",
    answer:
      "Nothing. All four modules, 27 lessons and the course materials are free. The protected reader requires a free learning account. No payment details are requested.",
  },
  {
    question: "What is the course's scope?",
    answer:
      "It teaches a Claude-centered working method, maintained knowledge, bounded automation and EU data-protection and AI Act considerations. It does not certify professional competence or regulatory compliance.",
  },
  {
    question: "What happens when a tool changes?",
    answer:
      "Tool-specific lessons carry review dates and are revised when a material change affects the instructions. A review target is not a guarantee that every provider change is reflected immediately.",
  },
  {
    question: "How is the capstone assessed?",
    answer:
      "You document and test one bounded workflow against a seven-point self-review rubric. The completion record is generated locally from your stored progress. There is no external examination or accreditation.",
  },
];

export function getAiNativeFaq(locale: Locale): readonly AiNativeFaqItem[] {
  return locale === "en" ? AI_NATIVE_FAQ_EN : AI_NATIVE_FAQ;
}

// ─── Trust Signals (Hero) ──────────────────────────────────────────────────

export const AI_NATIVE_TRUST_SIGNALS: readonly string[] = [
  "Von Tim Löhr kuratiert und öffentlich dokumentiert.",
  "Technischer Hintergrund in Informatik, Dateninfrastruktur und Analytics.",
  "Basiert auf frei zugänglichen Übungen, Demos und Arbeitsnotizen.",
];

export const AI_NATIVE_TRUST_SIGNALS_EN: readonly string[] = [
  "Curated by Tim Löhr and documented on this public platform.",
  "Technical background in computer science, data infrastructure and analytics.",
  "Built from openly available exercises, simulations and working notes.",
];

export function getAiNativeTrustSignals(locale: Locale): readonly string[] {
  return locale === "en"
    ? AI_NATIVE_TRUST_SIGNALS_EN
    : AI_NATIVE_TRUST_SIGNALS;
}
