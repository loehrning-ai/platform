import type { Locale } from "@/lib/i18n/locale";
import { AGENT_HELP_COPY_DE } from "./eigene-ki-copy.de";
import { AGENT_HELP_COPY_EN } from "./eigene-ki-copy.en";

/**
 * Every visitor-facing string on /hilfe/eigene-ki, in both locales.
 *
 * The page documents a surface that can be switched off, half configured, or
 * built but not yet reachable, so the copy carries a state for each of those
 * cases instead of one confident happy path. Numbers are never written here:
 * the page passes the real constants from the modules that enforce them, so a
 * changed ceiling changes the page.
 */

/** Stable anchors, identical in both locales, so a shared link keeps working. */
export const AGENT_HELP_SECTION_IDS = {
  overview: "was-das-ist",
  desktop: "claude-desktop",
  code: "claude-code",
  codex: "codex",
  tokens: "zugriffsschluessel",
  chat: "chat-im-konto",
  addresses: "adressen",
  limits: "grenzen",
  privacy: "was-gespeichert-wird",
} as const;

export type AgentHelpSectionKey = keyof typeof AGENT_HELP_SECTION_IDS;

export const AGENT_HELP_SECTION_ORDER = [
  "overview",
  "desktop",
  "code",
  "codex",
  "tokens",
  "chat",
  "addresses",
  "limits",
  "privacy",
] as const satisfies readonly AgentHelpSectionKey[];

export interface AgentHelpWalkthrough {
  readonly title: string;
  readonly intro: string;
  readonly steps: readonly string[];
  readonly snippetLabel: string;
  readonly snippet: (serverUrl: string) => string;
  readonly note: string;
}

export interface AgentHelpResourceExample {
  readonly uri: string;
  readonly label: string;
}

export interface AgentHelpCopy {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
  readonly indexLabel: string;
  readonly endpointLabel: string;
  readonly statusReady: {
    readonly title: string;
    readonly body: string;
  };
  readonly statusOff: {
    readonly title: string;
    readonly body: string;
  };
  readonly sectionTitles: Record<AgentHelpSectionKey, string>;
  readonly overview: {
    readonly intro: string;
    readonly facts: (toolCount: number) => readonly string[];
    readonly readOnlyTitle: string;
    readonly readOnlyBody: string;
  };
  readonly desktop: AgentHelpWalkthrough;
  readonly code: AgentHelpWalkthrough;
  readonly codex: AgentHelpWalkthrough;
  readonly tokens: {
    readonly intro: string;
    readonly steps: readonly string[];
    readonly snippetLabel: string;
    readonly snippet: (serverUrl: string) => string;
    readonly format: string;
    readonly limit: (maxActive: number) => string;
    /** What a token unlocks today. Always rendered. */
    readonly bearerActive: string;
    /**
     * The caveat that used to say a sent token was not read yet. Empty now
     * that the endpoint resolves a bearer; the page renders it only when it
     * carries text, and eigene-ki-copy.test.ts keeps it tied to the endpoint
     * source so it can never claim the wrong thing again.
     */
    readonly bearerPending: string;
    readonly oauthPending: string;
    readonly accountLink: string;
  };
  readonly chat: {
    readonly intro: string;
    readonly steps: readonly string[];
    readonly cost: string;
    readonly transcript: string;
    readonly limits: (messagesPerHour: number, toolCalls: number) => string;
    readonly offTitle: string;
    readonly offBody: string;
    readonly accountLink: string;
  };
  readonly addresses: {
    readonly intro: string;
    readonly examples: readonly AgentHelpResourceExample[];
    readonly localeNote: string;
    readonly islandNote: string;
  };
  readonly limits: {
    readonly intro: string;
    readonly requests: (maxPerHour: number) => string;
    readonly output: (maxKilobytes: number) => string;
    readonly search: (maxResults: number, maxQueryChars: number) => string;
    readonly chat: (
      messagesPerHour: number,
      messageKibibytes: number,
    ) => string;
    readonly tokens: (maxActive: number, nameChars: number) => string;
    readonly unavailable: string;
  };
  readonly privacy: {
    readonly intro: string;
    readonly logged: readonly string[];
    readonly notLogged: readonly string[];
    readonly revoke: string;
    readonly accountLink: string;
  };
  readonly backToHelp: string;
}

export const AGENT_HELP_COPY: Record<Locale, AgentHelpCopy> = {
  de: AGENT_HELP_COPY_DE,
  en: AGENT_HELP_COPY_EN,
};
