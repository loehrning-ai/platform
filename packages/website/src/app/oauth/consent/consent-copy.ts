import type { Locale } from "@/lib/i18n/locale";

/**
 * Scopes the Supabase OAuth 2.1 server currently issues. Custom scopes are not
 * supported by the authorization server, so this list is closed. An
 * authorization request that still asks for something else is rendered through
 * `unknownScope`, never as a bare token the learner has to decode.
 */
export const KNOWN_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "phone",
] as const;

export type KnownOAuthScope = (typeof KNOWN_OAUTH_SCOPES)[number];

export function isKnownOAuthScope(value: string): value is KnownOAuthScope {
  return (KNOWN_OAUTH_SCOPES as readonly string[]).includes(value);
}

/**
 * Every way the consent flow can end without a grant. Each one renders a page,
 * never a redirect back to the client: an expired or unknown request must not
 * be able to steer the browser anywhere.
 */
export type ConsentErrorKind =
  | "missing-request"
  | "invalid-request"
  | "unknown-request"
  | "backend-unavailable"
  | "decision-failed";

export const CONSENT_ERROR_KINDS: readonly ConsentErrorKind[] = [
  "missing-request",
  "invalid-request",
  "unknown-request",
  "backend-unavailable",
  "decision-failed",
];

export function isConsentErrorKind(value: unknown): value is ConsentErrorKind {
  return (
    typeof value === "string" &&
    (CONSENT_ERROR_KINDS as readonly string[]).includes(value)
  );
}

export interface ConsentPageCopy {
  readonly metadata: { readonly title: string; readonly description: string };
  readonly eyebrow: string;
  readonly title: string;
  readonly introduction: (clientName: string) => string;
  readonly signedInAs: (identity: string) => string;
  readonly requestHeading: string;
  readonly clientNameLabel: string;
  readonly clientNameUnknown: string;
  readonly clientIdLabel: string;
  readonly clientSiteLabel: string;
  readonly clientSiteUnknown: string;
  readonly redirectHostLabel: string;
  readonly redirectHostUnknown: string;
  readonly redirectHostNote: string;
  readonly scopesHeading: string;
  readonly scopeLines: Record<KnownOAuthScope, string>;
  readonly unknownScope: (scope: string) => string;
  readonly noScopes: string;
  readonly platformAccess: string;
  readonly tokenPower: string;
  readonly approve: string;
  readonly deny: string;
  readonly denyNote: string;
  readonly errorEyebrow: string;
  readonly errorHeading: string;
  readonly errorBodies: Record<ConsentErrorKind, string>;
  readonly errorNextStep: string;
  readonly accountLink: string;
}

const DE: ConsentPageCopy = {
  metadata: {
    title: "Zugriff für eine App freigeben",
    description:
      "Prüfe, welche App auf dein Konto zugreifen möchte, und entscheide selbst.",
  },
  eyebrow: "Freigabe",
  title: "Zugriff für eine App freigeben",
  introduction: (clientName) =>
    `${clientName} möchte in deinem Namen auf loehrning.ai zugreifen.`,
  signedInAs: (identity) => `Angemeldet als ${identity}.`,
  requestHeading: "Wer fragt an",
  clientNameLabel: "App",
  clientNameUnknown: "Ohne hinterlegten Namen",
  clientIdLabel: "Client-ID",
  clientSiteLabel: "Website der App",
  clientSiteUnknown: "Keine hinterlegt",
  redirectHostLabel: "Weiterleitung an",
  redirectHostUnknown: "Nicht lesbar. Lehne im Zweifel ab.",
  redirectHostNote:
    "Nach deiner Entscheidung landest du auf diesem Host. Erkennst du ihn nicht, lehne ab.",
  scopesHeading: "Diese Berechtigungen werden angefragt",
  scopeLines: {
    openid:
      "Die App erhält deine Nutzer-ID als Nachweis, dass du hier angemeldet bist.",
    email:
      "Die App kann deine E-Mail-Adresse lesen und sehen, ob sie bestätigt ist.",
    profile:
      "Profil (Name, Profilbild): Die Agenten-Werkzeuge geben keine Profildaten heraus.",
    phone: "Die App kann deine hinterlegte Telefonnummer lesen.",
  },
  unknownScope: (scope) =>
    `Die Berechtigung „${scope}“ ist auf der Plattform nicht dokumentiert. Stimme nur zu, wenn du weißt, wofür die App sie braucht.`,
  noScopes:
    "Die App fragt keine zusätzlichen Profildaten an.",
  platformAccess:
    "Mit einer Freigabe darf die App über die Agenten-Schnittstelle nur deinen Lernfortschritt und deinen nächsten Schritt lesen. Schreiben oder löschen kann sie auf loehrning.ai nichts.",
  tokenPower:
    "Unsere Kontoseiten und Kontoeinstellungen lehnen das Zugriffstoken dieser App ab. Unser Anmeldedienst Supabase akzeptiert es bis zum Ablauf wie deine eigene Anmeldung, etwa um deine E-Mail-Adresse zu lesen. Gib die Freigabe nur Programmen, die du selbst installiert hast.",
  approve: "Zugriff erlauben",
  deny: "Ablehnen",
  denyNote:
    "Lehnst du ab, geht die App ohne Zugriff zurück. Dein Konto bleibt unverändert.",
  errorEyebrow: "Abgebrochen",
  errorHeading: "Freigabe nicht möglich",
  errorBodies: {
    "missing-request":
      "Diesem Aufruf fehlt die Kennung der Anfrage. Deshalb ist unklar, welche App du freigeben würdest.",
    "invalid-request":
      "Die Kennung in der Adresse hat ein ungültiges Format.",
    "unknown-request":
      "Diese Anfrage ist abgelaufen oder unbekannt, deshalb leiten wir dich nicht weiter.",
    "backend-unavailable":
      "Die Anmeldung ist gerade nicht erreichbar. Es liegt nicht an deiner App.",
    "decision-failed":
      "Deine Entscheidung konnte nicht gespeichert werden. Es wurde keine Freigabe erteilt.",
  },
  errorNextStep: "Starte die Verbindung in deiner App noch einmal.",
  accountLink: "Zurück zu deinem Konto",
};

const EN: ConsentPageCopy = {
  metadata: {
    title: "Approve access for an app",
    description:
      "Review which app wants to reach your account, then decide for yourself.",
  },
  eyebrow: "Authorization",
  title: "Approve access for an app",
  introduction: (clientName) =>
    `${clientName} wants to access loehrning.ai on your behalf.`,
  signedInAs: (identity) => `Signed in as ${identity}.`,
  requestHeading: "Who is asking",
  clientNameLabel: "App",
  clientNameUnknown: "No name registered",
  clientIdLabel: "Client ID",
  clientSiteLabel: "App website",
  clientSiteUnknown: "None registered",
  redirectHostLabel: "Redirect to",
  redirectHostUnknown: "Not readable. Deny if in doubt.",
  redirectHostNote:
    "After your decision you land on this host. If you do not recognize it, deny.",
  scopesHeading: "These permissions are requested",
  scopeLines: {
    openid:
      "The app receives your user ID as proof that you are signed in here.",
    email:
      "The app can read your email address and whether it has been confirmed.",
    profile:
      "Profile (name, profile picture): the agent tools return no profile data.",
    phone: "The app can read your stored phone number.",
  },
  unknownScope: (scope) =>
    `The permission "${scope}" is not documented on this platform. Approve only if you know what the app needs it for.`,
  noScopes:
    "The app requests no extra profile data.",
  platformAccess:
    "With an approval the app may only read your learning progress and your next step through the agent interface. It can never write or delete anything on loehrning.ai.",
  tokenPower:
    "Our account pages and account settings refuse this app's access token. Our sign-in service Supabase accepts it like your own sign-in until it expires, for example to read your email address. Only approve programs you installed yourself.",
  approve: "Allow access",
  deny: "Deny",
  denyNote:
    "If you deny, the app goes back without access. Your account stays unchanged.",
  errorEyebrow: "Stopped",
  errorHeading: "Authorization not possible",
  errorBodies: {
    "missing-request":
      "This call has no request id, so we cannot tell which app you would approve.",
    "invalid-request":
      "The request id in the address has an invalid format.",
    "unknown-request":
      "This request has expired or is unknown, so we do not redirect you.",
    "backend-unavailable":
      "Sign-in is unreachable right now. This is not your app's fault.",
    "decision-failed":
      "Your decision could not be saved. No access was granted.",
  },
  errorNextStep: "Start the connection again in your app.",
  accountLink: "Back to your account",
};

export const CONSENT_COPY: Record<Locale, ConsentPageCopy> = {
  de: DE,
  en: EN,
};

/**
 * One plain sentence per requested scope. A scope the authorization server has
 * not documented still gets a sentence, so the learner never has to approve a
 * bare token whose meaning is only guessable.
 */
export function scopeLine(scope: string, copy: ConsentPageCopy): string {
  return isKnownOAuthScope(scope)
    ? copy.scopeLines[scope]
    : copy.unknownScope(scope);
}
