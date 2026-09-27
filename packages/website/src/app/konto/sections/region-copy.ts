import { SITE_ORIGIN } from "@/lib/seo/entity";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Copy and machine identity for three account regions: Deine KI, the
 * verification link on each Teilnahmebestätigung, and the data controls under
 * Konto verwalten.
 *
 * It sits beside the regions that render it so each region owns its own
 * strings; folding it into `AccountPageCopy` later is a mechanical move. The
 * install snippets are commands, not prose: they are identical in both
 * locales and therefore live outside the locale records.
 */

/**
 * Path of the platform's own MCP endpoint, relative to the site origin.
 *
 * The value is a constant rather than configuration: it is printed into a
 * learner's client configuration, so it must be the same string the route
 * itself is mounted at, and a deployment-specific override would silently
 * hand out an address that does not answer.
 */
export const AGENT_MCP_PATH = "/api/mcp";

/** Absolute MCP endpoint a learner enters in their own client. */
export function agentMcpEndpoint(): string {
  return `${SITE_ORIGIN}${AGENT_MCP_PATH}`;
}

export const AGENT_CLIENT_IDS = [
  "claude-desktop",
  "claude-code",
  "codex",
] as const;

export type AgentClientId = (typeof AGENT_CLIENT_IDS)[number];

/**
 * The exact text a learner pastes for each client.
 *
 * Claude Desktop takes the bare endpoint in its custom-connector dialog;
 * Claude Code takes one shell command; Codex takes a TOML table for its
 * configuration file. Nothing here is localized, because a mistranslated
 * command is a broken command.
 */
export function agentInstallSnippet(
  client: AgentClientId,
  endpoint: string,
): string {
  switch (client) {
    case "claude-desktop":
      return endpoint;
    case "claude-code":
      return `claude mcp add --transport http loehrning ${endpoint}`;
    case "codex":
      return `[mcp_servers.loehrning]\nurl = "${endpoint}"`;
  }
}

export interface AgentClientCopy {
  readonly id: AgentClientId;
  /** Product name of the client. Never translated. */
  readonly client: string;
  /** Where in that client the snippet goes. */
  readonly where: string;
}

export interface AgentAccessCopy {
  readonly heading: string;
  readonly intro: string;
  readonly endpointLabel: string;
  readonly endpointNote: string;
  readonly installHeading: string;
  readonly clients: readonly AgentClientCopy[];
  readonly statusLabel: string;
  readonly status: string;
  readonly grantsLink: string;
  readonly grantsSummary: string;
  readonly helpLink: string;
  readonly helpSummary: string;
  readonly copyAction: string;
  readonly copiedAction: string;
  readonly endpointCopyLabel: string;
  readonly snippetCopyLabel: (client: string) => string;
}

export const AGENT_ACCESS_COPY = {
  de: {
    heading: "Deine KI",
    intro:
      "Verbinde deinen eigenen KI-Client über den Endpunkt unten mit diesem Konto.",
    endpointLabel: "MCP-Endpunkt",
    endpointNote:
      "Die Adresse ist für alle Konten gleich. Was dein Client sehen darf, legt der Zugang fest, den du ausstellst.",
    installHeading: "In deinem Client eintragen",
    clients: [
      {
        id: "claude-desktop",
        client: "Claude Desktop",
        where:
          "Einstellungen, Connectors, Eigenen Connector hinzufügen. Dort die Adresse einsetzen.",
      },
      {
        id: "claude-code",
        client: "Claude Code",
        where: "Einmal im Terminal ausführen.",
      },
      {
        id: "codex",
        client: "Codex",
        where: "In die Datei ~/.codex/config.toml einfügen.",
      },
    ],
    statusLabel: "Status",
    status:
      "Der Endpunkt ist eingeschaltet. Ohne einen Zugang aus deinem Konto beantwortet er keine Anfrage, und jeder Aufruf wird protokolliert.",
    grantsLink: "Zugänge und Protokoll",
    grantsSummary:
      "Zugänge ausstellen, begrenzen, zurückziehen und nachlesen, was ein Client abgerufen hat.",
    helpLink: "Anleitung: eigene KI verbinden",
    helpSummary:
      "Einrichtung und was hilft, wenn ein Client die Verbindung ablehnt.",
    copyAction: "Kopieren",
    copiedAction: "Kopiert",
    endpointCopyLabel: "MCP-Endpunkt",
    snippetCopyLabel: (client) => `Einrichtung für ${client}`,
  },
  en: {
    heading: "Your AI",
    intro:
      "Connect your own AI client to this account through the endpoint below.",
    endpointLabel: "MCP endpoint",
    endpointNote:
      "The address is the same for every account. The grant you issue decides what your client may see.",
    installHeading: "Enter it in your client",
    clients: [
      {
        id: "claude-desktop",
        client: "Claude Desktop",
        where:
          "Settings, Connectors, Add custom connector. Paste the address there.",
      },
      {
        id: "claude-code",
        client: "Claude Code",
        where: "Run once in the terminal.",
      },
      {
        id: "codex",
        client: "Codex",
        where: "Add to the file ~/.codex/config.toml.",
      },
    ],
    statusLabel: "Status",
    status:
      "The endpoint is switched on. Without a grant from your account it answers no request, and every call is logged.",
    grantsLink: "Grants and audit trail",
    grantsSummary:
      "Issue, limit and revoke grants, and see what a client retrieved.",
    helpLink: "Guide: connect your own AI",
    helpSummary:
      "Setup, and what helps when a client refuses the connection.",
    copyAction: "Copy",
    copiedAction: "Copied",
    endpointCopyLabel: "MCP endpoint",
    snippetCopyLabel: (client) => `Setup for ${client}`,
  },
} as const satisfies Readonly<Record<Locale, AgentAccessCopy>>;

export interface RecordVerificationCopy {
  readonly link: string;
  readonly summary: string;
}

export const RECORD_VERIFICATION_COPY = {
  de: {
    link: "Prüfseite",
    summary:
      "prüft den Code deiner Bestätigung, ohne Anmeldung.",
  },
  en: {
    link: "Verification page",
    summary:
      "checks the code on your certificate of participation, no sign-in needed.",
  },
} as const satisfies Readonly<Record<Locale, RecordVerificationCopy>>;

export const ACCOUNT_CONTROL_IDS = ["export", "reset", "delete"] as const;

export type AccountControlId = (typeof ACCOUNT_CONTROL_IDS)[number];

export interface AccountControlCopy {
  readonly id: AccountControlId;
  readonly title: string;
  readonly body: string;
  readonly action: string;
}

export interface AccountControlsCopy {
  readonly intro: string;
  readonly items: readonly AccountControlCopy[];
}

/**
 * The three data controls, each opening the privacy workspace that performs
 * them. The account page names and describes them, and deliberately does not
 * carry a second copy of the confirmation flows: a deletion must be confirmed
 * in exactly one place.
 */
export const ACCOUNT_CONTROLS_COPY = {
  de: {
    intro:
      "Jede dieser Aktionen bestätigst du in der Datenverwaltung, damit nichts versehentlich passiert.",
    items: [
      {
        id: "export",
        title: "Daten exportieren",
        body: "Eine JSON-Datei mit deinen Konto- und Lerndaten.",
        action: "Öffnen",
      },
      {
        id: "reset",
        title: "Kursfortschritt zurücksetzen",
        body: "Setzt einen Kurs auf dem Server und in diesem Browser zurück. Andere Kurse bleiben unberührt.",
        action: "Öffnen",
      },
      {
        id: "delete",
        title: "Konto löschen",
        body: "Löscht Konto, E-Mail-Adresse und serverseitigen Fortschritt endgültig.",
        action: "Öffnen",
      },
    ],
  },
  en: {
    intro:
      "You confirm each of these in the data controls, so nothing happens by accident.",
    items: [
      {
        id: "export",
        title: "Export data",
        body: "A JSON file with your account and learning data.",
        action: "Open",
      },
      {
        id: "reset",
        title: "Reset course progress",
        body: "Resets one course on the server and in this browser. Other courses stay untouched.",
        action: "Open",
      },
      {
        id: "delete",
        title: "Delete account",
        body: "Permanently deletes account, email address and server-side progress.",
        action: "Open",
      },
    ],
  },
} as const satisfies Readonly<Record<Locale, AccountControlsCopy>>;
