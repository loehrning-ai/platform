import type { Locale } from "@/lib/i18n/locale";

/**
 * Copy and prompt text for the "open with your AI" action on reading surfaces.
 *
 * The prompt is built here rather than in the island so it can be asserted
 * against the canonical resource URI builders in a unit test: a prompt that
 * named an address the MCP server does not serve would send a learner's own
 * program to a dead resource.
 */

/** Canonical path of the setup guide for a learner's own AI program. */
export const AGENT_HELP_PATH = "/hilfe/eigene-ki";

export type OpenWithYourAiKind = "lesson" | "chapter" | "workshop";

export interface OpenWithYourAiResource {
  /** A `lesson://`, `workshop://` or `book://` address from `@/lib/mcp/uris`. */
  readonly uri: string;
  readonly title: string;
}

interface KindStrings {
  readonly heading: string;
  readonly body: string;
  readonly promptOpening: (contextTitle: string) => string;
  readonly promptTask: string;
}

export interface OpenWithYourAiCopy {
  readonly label: string;
  readonly kinds: Record<OpenWithYourAiKind, KindStrings>;
  readonly promptServerLine: (serverUrl: string) => string;
  readonly promptResourceIntro: string;
  readonly serverLabel: string;
  readonly addressLabel: string;
  readonly addressesLabel: string;
  readonly copyAction: string;
  readonly copiedNotice: string;
  readonly copyFailedNotice: string;
  readonly promptLabel: string;
  readonly helpLink: string;
}

const DE: OpenWithYourAiCopy = {
  label: "Mit deiner KI öffnen",
  kinds: {
    lesson: {
      heading: "Diesen Block mit deiner KI öffnen",
      body: "Dein KI-Programm liest damit die Lektionen des Blocks im Originalwortlaut.",
      promptOpening: (contextTitle) =>
        `Ich lerne gerade auf loehrning.ai: ${contextTitle}.`,
      promptTask:
        "Fasse den Inhalt zusammen, nenne die drei wichtigsten Punkte und stell mir dann drei Verständnisfragen. Nutze nur den Text.",
    },
    chapter: {
      heading: "Dieses Kapitel mit deiner KI öffnen",
      body: "Dein KI-Programm liest damit das Kapitel im Originalwortlaut.",
      promptOpening: (contextTitle) =>
        `Ich lese gerade auf loehrning.ai: ${contextTitle}.`,
      promptTask:
        "Fasse das Kapitel zusammen, nenne die drei wichtigsten Punkte und sag mir, welche Aussagen belegt sind und welche nicht. Nutze nur den Text.",
    },
    workshop: {
      heading: "Diesen Workshop mit deiner KI öffnen",
      body: "Dein KI-Programm liest damit Ablauf und Materialien von der Plattform.",
      promptOpening: (contextTitle) =>
        `Ich arbeite gerade einen Workshop auf loehrning.ai durch: ${contextTitle}.`,
      promptTask:
        "Führe mich Schritt für Schritt durch den Ablauf. Nimm mir die Entscheidungsaufgaben nicht ab: Stell mir die Fragen und warte auf meine Antwort. Nutze nur den Text.",
    },
  },
  promptServerLine: (serverUrl) => `Server (HTTP): ${serverUrl}`,
  promptResourceIntro:
    "Verbinde dich mit dem MCP-Server der Plattform und lies diese Inhalte:",
  serverLabel: "Server",
  addressLabel: "Adresse",
  addressesLabel: "Adressen",
  copyAction: "Auftrag kopieren",
  copiedNotice: "Auftrag kopiert.",
  copyFailedNotice:
    "Kopieren hat nicht geklappt. Markiere den Auftrag unten selbst.",
  promptLabel: "Auftrag für dein Programm",
  helpLink: "Programm einrichten",
};

const EN: OpenWithYourAiCopy = {
  label: "Open with your AI",
  kinds: {
    lesson: {
      heading: "Open this block with your AI",
      body: "Your AI program uses it to read the block's lessons in their original wording.",
      promptOpening: (contextTitle) =>
        `I am working through this on loehrning.ai: ${contextTitle}.`,
      promptTask:
        "Summarise the content, name the three most important points, then ask me three comprehension questions. Use only the text.",
    },
    chapter: {
      heading: "Open this chapter with your AI",
      body: "Your AI program uses it to read the chapter in its original wording.",
      promptOpening: (contextTitle) =>
        `I am reading this on loehrning.ai: ${contextTitle}.`,
      promptTask:
        "Summarise the chapter, name the three most important points, and tell me which claims are supported and which are not. Use only the text.",
    },
    workshop: {
      heading: "Open this workshop with your AI",
      body: "Your AI program uses it to read the steps and materials from the platform.",
      promptOpening: (contextTitle) =>
        `I am working through a workshop on loehrning.ai: ${contextTitle}.`,
      promptTask:
        "Walk me through the steps one at a time. Do not settle the decision labs for me: ask me the questions and wait for my answer. Use only the text.",
    },
  },
  promptServerLine: (serverUrl) => `Server (HTTP): ${serverUrl}`,
  promptResourceIntro:
    "Connect to the platform's MCP server and read this content:",
  serverLabel: "Server",
  addressLabel: "Address",
  addressesLabel: "Addresses",
  copyAction: "Copy prompt",
  copiedNotice: "Prompt copied.",
  copyFailedNotice:
    "Copying did not work. Select the prompt below yourself.",
  promptLabel: "Prompt for your program",
  helpLink: "Set up your program",
};

export const OPEN_WITH_YOUR_AI_COPY: Record<Locale, OpenWithYourAiCopy> = {
  de: DE,
  en: EN,
};

export interface OpenWithYourAiPromptInput {
  readonly kind: OpenWithYourAiKind;
  readonly contextTitle: string;
  readonly resources: readonly OpenWithYourAiResource[];
  readonly serverUrl: string;
  readonly locale: Locale;
}

/**
 * The ready prompt a learner hands to their own program: what they are
 * reading, the server address, every resource address of this page, and a
 * task that keeps the program inside the text.
 */
export function buildOpenWithYourAiPrompt({
  kind,
  contextTitle,
  resources,
  serverUrl,
  locale,
}: OpenWithYourAiPromptInput): string {
  const copy = OPEN_WITH_YOUR_AI_COPY[locale];
  const kindCopy = copy.kinds[kind];
  const addresses = resources.map(
    (resource) => `- ${resource.uri} (${resource.title})`,
  );

  return [
    kindCopy.promptOpening(contextTitle),
    "",
    copy.promptResourceIntro,
    copy.promptServerLine(serverUrl),
    ...addresses,
    "",
    kindCopy.promptTask,
  ].join("\n");
}
