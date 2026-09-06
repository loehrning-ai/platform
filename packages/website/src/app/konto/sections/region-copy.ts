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
      "Du kannst deinen eigenen KI-Client mit diesem Konto verbinden. Der Client spricht dabei nicht mit deinem Browser, sondern mit dem Endpunkt unten.",
    endpointLabel: "MCP-Endpunkt",
    endpointNote:
      "Diese Adresse ist für alle Konten gleich. Was dein Client sehen darf, entscheidet allein der Zugang, den du in deinem Konto ausstellst.",
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
      "Der Endpunkt ist in dieser Umgebung eingeschaltet. Ohne einen Zugang aus deinem Konto beantwortet er keine Anfrage, und jeder Aufruf steht im Protokoll.",
    grantsLink: "Zugänge und Protokoll",
    grantsSummary:
      "Zugang ausstellen, Reichweite begrenzen, jederzeit zurückziehen und nachlesen, was ein Client abgerufen hat.",
    helpLink: "Anleitung: eigene KI verbinden",
    helpSummary:
      "Schritt für Schritt, mit den Fällen, in denen ein Client die Verbindung ablehnt.",
    copyAction: "Kopieren",
    copiedAction: "Kopiert",
    endpointCopyLabel: "MCP-Endpunkt",
    snippetCopyLabel: (client) => `Einrichtung für ${client}`,
  },
  en: {
    heading: "Your AI",
    intro:
      "You can connect your own AI client to this account. The client does not talk to your browser; it talks to the endpoint below.",
    endpointLabel: "MCP endpoint",
    endpointNote:
      "This address is the same for every account. What your client may see is decided solely by the grant you issue in your account.",
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
      "The endpoint is switched on in this environment. Without a grant from your account it answers no request, and every call is recorded.",
    grantsLink: "Grants and audit trail",
    grantsSummary:
      "Issue a grant, limit its reach, withdraw it at any time, and read what a client actually retrieved.",
    helpLink: "Guide: connect your own AI",
    helpSummary:
      "Step by step, including the cases where a client refuses the connection.",
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
      "Dort wird der Code aus deiner Bestätigung geprüft, ohne Anmeldung.",
  },
  en: {
    link: "Verification page",
    summary:
      "That is where the code on your certificate of participation is checked, without a sign-in.",
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
      "Export, Zurücksetzen und Löschen laufen in der Datenverwaltung. Jede der drei Aktionen bestätigst du dort, damit sie nicht versehentlich ausgelöst wird.",
    items: [
      {
        id: "export",
        title: "Daten exportieren",
        body: "Eine JSON-Datei mit E-Mail-Adresse, Kursfortschritt, vorhandenen Quizversuchen und Exportzeitpunkt.",
        action: "Öffnen",
      },
      {
        id: "reset",
        title: "Kursfortschritt zurücksetzen",
        body: "Setzt einen einzelnen Kurs auf dem Server und in diesem Browser zurück. Andere Kurse bleiben unberührt.",
        action: "Öffnen",
      },
      {
        id: "delete",
        title: "Konto löschen",
        body: "Löscht Konto, E-Mail-Adresse und serverseitigen Fortschritt dauerhaft. Das lässt sich nicht rückgängig machen.",
        action: "Öffnen",
      },
    ],
  },
  en: {
    intro:
      "Export, reset, and deletion run in the data controls. You confirm each of the three there, so that none of them can be triggered by accident.",
    items: [
      {
        id: "export",
        title: "Export data",
        body: "A JSON file with your email address, course progress, existing quiz attempts, and the export time.",
        action: "Open",
      },
      {
        id: "reset",
        title: "Reset course progress",
        body: "Resets a single course on the server and in this browser. Other courses stay untouched.",
        action: "Open",
      },
      {
        id: "delete",
        title: "Delete account",
        body: "Permanently deletes the account, the email address, and server-side progress. This cannot be undone.",
        action: "Open",
      },
    ],
  },
} as const satisfies Readonly<Record<Locale, AccountControlsCopy>>;
