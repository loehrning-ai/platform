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
      body: "Kopiere den Auftrag und gib ihn deinem eigenen KI-Programm. Es liest die Lektionen dieses Blocks direkt von der Plattform, im gleichen Wortlaut wie du.",
      promptOpening: (contextTitle) =>
        `Ich lerne gerade auf loehrning.ai: ${contextTitle}.`,
      promptTask:
        "Fasse den Inhalt in eigenen Worten zusammen, nenne die drei wichtigsten Punkte und stelle mir danach drei Verständnisfragen. Nimm nur, was im Text steht, und erfinde nichts dazu.",
    },
    chapter: {
      heading: "Dieses Kapitel mit deiner KI öffnen",
      body: "Kopiere den Auftrag und gib ihn deinem eigenen KI-Programm. Es liest dieses Kapitel direkt von der Plattform, im gleichen Wortlaut wie du.",
      promptOpening: (contextTitle) =>
        `Ich lese gerade auf loehrning.ai: ${contextTitle}.`,
      promptTask:
        "Fasse das Kapitel in eigenen Worten zusammen, nenne die drei wichtigsten Punkte und sage mir, welche Aussage im Text belegt ist und welche nicht. Nimm nur, was im Text steht.",
    },
    workshop: {
      heading: "Diesen Workshop mit deiner KI öffnen",
      body: "Kopiere den Auftrag und gib ihn deinem eigenen KI-Programm. Es liest den Ablauf und die Materialien direkt von der Plattform.",
      promptOpening: (contextTitle) =>
        `Ich arbeite gerade einen Workshop auf loehrning.ai durch: ${contextTitle}.`,
      promptTask:
        "Führe mich Schritt für Schritt durch den Ablauf. Nimm mir die Entscheidungsaufgaben nicht ab, sondern stelle mir die Fragen und warte auf meine Antwort. Nimm nur, was im Text steht.",
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
    "Kopieren hat nicht geklappt. Der Auftrag steht jetzt hier, du kannst ihn selbst markieren.",
  promptLabel: "Auftrag für dein Programm",
  helpLink: "Programm einrichten",
};

const EN: OpenWithYourAiCopy = {
  label: "Open with your AI",
  kinds: {
    lesson: {
      heading: "Open this block with your AI",
      body: "Copy the prompt and hand it to your own AI program. It reads the lessons of this block straight from the platform, in the same wording you see.",
      promptOpening: (contextTitle) =>
        `I am working through this on loehrning.ai: ${contextTitle}.`,
      promptTask:
        "Summarise the content in your own words, name the three most important points, and then ask me three comprehension questions. Use only what the text says and invent nothing.",
    },
    chapter: {
      heading: "Open this chapter with your AI",
      body: "Copy the prompt and hand it to your own AI program. It reads this chapter straight from the platform, in the same wording you see.",
      promptOpening: (contextTitle) =>
        `I am reading this on loehrning.ai: ${contextTitle}.`,
      promptTask:
        "Summarise the chapter in your own words, name the three most important points, and tell me which claim the text supports and which it does not. Use only what the text says.",
    },
    workshop: {
      heading: "Open this workshop with your AI",
      body: "Copy the prompt and hand it to your own AI program. It reads the steps and the materials straight from the platform.",
      promptOpening: (contextTitle) =>
        `I am working through a workshop on loehrning.ai: ${contextTitle}.`,
      promptTask:
        "Walk me through the steps one at a time. Do not settle the decision labs for me: ask me the question and wait for my answer. Use only what the text says.",
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
    "Copying did not work. The prompt is written out below, so you can select it yourself.",
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
