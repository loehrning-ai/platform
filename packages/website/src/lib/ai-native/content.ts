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
      "RCTFC-Muster für Vertrieb, HR, Ops und Handwerk.",
    icon: BookOpen,
    count: "In den Lektionen",
  },
  {
    title: "Obsidian PARA-Struktur",
    description:
      "Beispiel-Vault nach PARA und MOC als Diagramm.",
    icon: Brain,
    count: "In Modul 3",
  },
  {
    title: "n8n-Workflow-Konzepte",
    description:
      "E-Mail-Triage, Meeting-Aufgaben und Wochenbericht als Diagramme.",
    icon: Workflow,
    count: "In Modul 4",
  },
  {
    title: "EU-AI-Act-Checklisten",
    description:
      "Anbieter- und Betreiberpflichten aus der Annex-III-Lektion.",
    icon: Shield,
    count: "In Modul 4",
  },
  {
    title: "Claude Skills-Beispiele",
    description:
      "Startermuster wie /invoice-parse, /angebot-draft und /meeting-summary-de.",
    icon: MessageSquare,
    count: "In Modul 2",
  },
  {
    title: "CLAUDE.md-Starter-Muster",
    description:
      "CLAUDE.md-Beispiele für Vertrieb, HR und Ops.",
    icon: Award,
    count: "In Modul 2",
  },
];

export const AI_NATIVE_BUNDLE_ITEMS_EN: readonly AiNativeBundleItem[] = [
  {
    title: "Prompt patterns from the lessons",
    description:
      "RCTFC patterns for sales, HR, operations and skilled trades.",
    icon: BookOpen,
    count: "In the lessons",
  },
  {
    title: "Obsidian PARA structure",
    description:
      "An example vault using PARA and MOC, as a diagram.",
    icon: Brain,
    count: "Module 3",
  },
  {
    title: "n8n workflow concepts",
    description:
      "Email triage, meeting actions and weekly report as diagrams.",
    icon: Workflow,
    count: "Module 4",
  },
  {
    title: "EU AI Act checklists",
    description:
      "Provider and deployer duties from the Annex III lesson.",
    icon: Shield,
    count: "Module 4",
  },
  {
    title: "Claude Skills examples",
    description:
      "Starter patterns for invoices, quotations and meeting summaries.",
    icon: MessageSquare,
    count: "Module 2",
  },
  {
    title: "CLAUDE.md starter patterns",
    description:
      "CLAUDE.md examples for sales, HR and operations.",
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
      "Nein. Der kostenlose KI-Führerschein wird empfohlen, weil dieser Kurs auf dessen Datenklassifizierung und Prompt-Basics aufbaut.",
  },
  {
    question: "Wie lange dauert der Arbeitskurs?",
    answer:
      "Rund 12 Stunden für Lektionen und Übungen, dazu 10 bis 15 Stunden für den optionalen Capstone, in deinem eigenen Tempo.",
  },
  {
    question: "Was kostet der Arbeitskurs?",
    answer:
      "Nichts. Alle vier Module und 27 Lektionen sind kostenlos; für den deutschen Kernkurs brauchst du ein kostenloses Lernkonto.",
  },
  {
    question: "Was behandelt der Kurs?",
    answer:
      "Abgegrenzte Aufgaben mit Claude, gepflegtes Wissen, begrenzte Automatisierung sowie Datenschutz- und AI-Act-Prüfpunkte. Der Kurs bescheinigt weder berufliche Kompetenz noch regulatorische Konformität.",
  },
  {
    question: "Ist der Kurs vollständig kostenlos?",
    answer:
      "Ja. Förderung, Bildungsgutscheine und Anbieterzertifizierung spielen deshalb keine Rolle.",
  },
  {
    question: "Was passiert, wenn ein gelehrtes Tool sich stark ändert?",
    answer:
      "Werkzeuglektionen tragen Prüfdaten und werden überarbeitet, wenn eine wesentliche Änderung die Anleitung betrifft. Nicht jede Anbieteränderung ist sofort abgebildet.",
  },
  {
    question: "Wie ist der Capstone strukturiert?",
    answer:
      "Du dokumentierst und testest einen begrenzten Workflow anhand einer Sieben-Punkte-Rubrik. Die Teilnahmebestätigung entsteht lokal aus deinem Fortschritt, ohne externe Prüfung oder Akkreditierung.",
  },
];

export const AI_NATIVE_FAQ_EN: readonly AiNativeFaqItem[] = [
  {
    question: "Do I need prior knowledge?",
    answer:
      "No. The free AI Fundamentals course is recommended because this course builds on its data classification and prompt basics.",
  },
  {
    question: "How long does the course take?",
    answer:
      "About 12 hours for lessons and exercises, plus 10 to 15 hours for the optional capstone, at your own pace.",
  },
  {
    question: "What does access cost?",
    answer:
      "Nothing. All four modules and 27 lessons are free; the protected reader needs a free learning account.",
  },
  {
    question: "What is the course's scope?",
    answer:
      "Scoped tasks with Claude, maintained knowledge, bounded automation, and data-protection and AI Act checks. The course certifies neither professional competence nor regulatory compliance.",
  },
  {
    question: "What happens when a tool changes?",
    answer:
      "Tool lessons carry review dates and are revised when a material change affects the instructions. Not every provider change is reflected immediately.",
  },
  {
    question: "How is the capstone assessed?",
    answer:
      "You document and test one bounded workflow against a seven-point self-review rubric. The completion record is created locally from your progress, without external examination or accreditation.",
  },
];

export function getAiNativeFaq(locale: Locale): readonly AiNativeFaqItem[] {
  return locale === "en" ? AI_NATIVE_FAQ_EN : AI_NATIVE_FAQ;
}

// ─── Trust Signals (Hero) ──────────────────────────────────────────────────

export const AI_NATIVE_TRUST_SIGNALS: readonly string[] = [
  "Von Tim Löhr kuratiert und öffentlich dokumentiert.",
  "Hintergrund in Informatik, Dateninfrastruktur und Analytics.",
  "Basiert auf frei zugänglichen Übungen, Demos und Arbeitsnotizen.",
];

export const AI_NATIVE_TRUST_SIGNALS_EN: readonly string[] = [
  "Curated by Tim Löhr and documented on this public platform.",
  "Background in computer science, data infrastructure and analytics.",
  "Built from openly available exercises, simulations and working notes.",
];

export function getAiNativeTrustSignals(locale: Locale): readonly string[] {
  return locale === "en"
    ? AI_NATIVE_TRUST_SIGNALS_EN
    : AI_NATIVE_TRUST_SIGNALS;
}
