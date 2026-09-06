import type { Locale } from "@/lib/i18n/locale";
import { isRecord } from "./local-progress-snapshot";

/**
 * ─── Copy for the local progress import ──
 *
 * `errors` is keyed by the exact names POST /api/progress/import answers with.
 * Every one of them has an entry, so a learner never sees a status code or a
 * generic failure where the server was specific, and a new named error added
 * to the route shows up here as a missing key rather than as silent noise.
 */

interface CountWords {
  readonly one: string;
  readonly many: string;
}

const COUNT_WORDS: Readonly<
  Record<Locale, { readonly courses: CountWords; readonly lessons: CountWords }>
> = {
  de: {
    courses: { one: "Kurs", many: "Kurse" },
    lessons: { one: "Lektion", many: "Lektionen" },
  },
  en: {
    courses: { one: "course", many: "courses" },
    lessons: { one: "lesson", many: "lessons" },
  },
};

export function countLabel(
  locale: Locale,
  value: number,
  unit: "courses" | "lessons",
): string {
  const words = COUNT_WORDS[locale][unit];
  return `${value} ${value === 1 ? words.one : words.many}`;
}

export interface ImportIslandCopy {
  readonly label: string;
  readonly offerBody: (courses: string, lessons: string) => string;
  readonly offerNote: string;
  readonly action: string;
  readonly sending: string;
  readonly successLabel: string;
  readonly successBody: (courses: string, lessons: string) => string;
  readonly successNothing: string;
  readonly reload: string;
  readonly failedLabel: string;
  readonly keepsLocal: string;
  readonly alreadyImported: (date: string) => string;
  readonly unknownError: string;
  readonly errors: Readonly<Record<string, string>>;
}

export const IMPORT_COPY = {
  de: {
    label: "Lokaler Lernstand",
    offerBody: (courses, lessons) =>
      `In diesem Browser liegt Lernfortschritt, den dein Konto noch nicht kennt: ${courses}, ${lessons}.`,
    offerNote:
      "Du kannst ihn einmalig übernehmen. Der Stand im Browser bleibt dabei unverändert erhalten, und übernommen wird nur, was deinen Kontostand nach vorne bringt.",
    action: "Lokalen Fortschritt übernehmen",
    sending: "Wird übernommen",
    successLabel: "Übernommen",
    successBody: (courses, lessons) =>
      `${courses} und ${lessons} sind jetzt in deinem Konto. Der lokale Stand im Browser bleibt erhalten.`,
    successNothing:
      "Dein Konto war bereits auf demselben Stand. Es wurde nichts verändert.",
    reload: "Lernstand neu laden",
    failedLabel: "Übernahme nicht möglich",
    keepsLocal:
      "Dein lokaler Lernstand ist unverändert. Du kannst es später erneut versuchen.",
    alreadyImported: (date) =>
      `Für dieses Konto wurde bereits am ${date} ein lokaler Lernstand übernommen. Ein zweiter Import ist nicht vorgesehen.`,
    unknownError:
      "Die Verbindung zum Server ist fehlgeschlagen. Bitte versuche es später erneut.",
    errors: {
      unsupported_media_type:
        "Der Server hat die Anfrage nicht angenommen. Lade die Seite neu und versuche es erneut.",
      auth_unavailable:
        "Der Anmeldedienst antwortet gerade nicht. Versuche es in einigen Minuten erneut.",
      auth_not_configured:
        "In dieser Umgebung ist kein Lernkonto eingerichtet, deshalb gibt es kein Ziel für die Übernahme.",
      unauthorized:
        "Deine Anmeldung ist abgelaufen. Melde dich neu an und versuche es erneut.",
      rate_limit_exceeded:
        "Es gab zu viele Versuche. Warte etwa eine Stunde und versuche es erneut.",
      rate_limit_unavailable:
        "Der Schutz vor zu vielen Anfragen ist gerade nicht verfügbar, deshalb wurde nichts geschrieben. Versuche es in einigen Minuten erneut.",
      payload_too_large: "Dein lokaler Lernstand ist für eine Übernahme zu groß.",
      progress_too_large:
        "Ein einzelner Kurs aus dem lokalen Lernstand ist für die Speicherung zu groß.",
      invalid_import:
        "Der lokale Lernstand hat eine Form, die der Server nicht annehmen kann.",
      unsupported_schema_version:
        "Der lokale Lernstand stammt aus einer älteren Version. Öffne einen Kurs, damit der Browser ihn aktualisiert, und versuche es dann erneut.",
      progress_owner_mismatch:
        "Das angemeldete Konto hat sich zwischendurch geändert. Lade die Seite neu und versuche es erneut.",
      progress_conflict:
        "Dein Lernstand wurde gerade an anderer Stelle geändert. Lade die Seite neu und versuche es erneut.",
      progress_read_failed:
        "Dein gespeicherter Lernstand ließ sich nicht lesen. Versuche es später erneut.",
      progress_write_failed:
        "Dein Lernstand ließ sich nicht speichern. Versuche es später erneut.",
      progress_store_unavailable:
        "Der Speicher für den Lernstand ist gerade nicht erreichbar. Versuche es später erneut.",
    },
  },
  en: {
    label: "Local learning record",
    offerBody: (courses, lessons) =>
      `This browser holds progress your account does not know about yet: ${courses}, ${lessons}.`,
    offerNote:
      "You can transfer it once. The record in this browser stays exactly as it is, and only what moves your account forward is transferred.",
    action: "Transfer local progress",
    sending: "Transferring",
    successLabel: "Transferred",
    successBody: (courses, lessons) =>
      `${courses} and ${lessons} are now in your account. The local record in this browser is kept.`,
    successNothing:
      "Your account already held the same state. Nothing was changed.",
    reload: "Reload the learning record",
    failedLabel: "Transfer not possible",
    keepsLocal:
      "Your local learning record is unchanged. You can try again later.",
    alreadyImported: (date) =>
      `A local learning record was already transferred into this account on ${date}. A second import is not offered.`,
    unknownError: "The connection to the server failed. Please try again later.",
    errors: {
      unsupported_media_type:
        "The server did not accept the request. Reload the page and try again.",
      auth_unavailable:
        "The sign-in service is not responding. Try again in a few minutes.",
      auth_not_configured:
        "This environment has no learning account configured, so there is no target for the transfer.",
      unauthorized: "Your sign-in has expired. Sign in again and try once more.",
      rate_limit_exceeded: "Too many attempts. Wait about an hour and try again.",
      rate_limit_unavailable:
        "The protection against excessive requests is unavailable, so nothing was written. Try again in a few minutes.",
      payload_too_large:
        "Your local learning record is too large to be transferred.",
      progress_too_large:
        "A single course in the local record is too large to be stored.",
      invalid_import:
        "The local learning record has a shape the server cannot accept.",
      unsupported_schema_version:
        "The local learning record comes from an older version. Open a course so the browser updates it, then try again.",
      progress_owner_mismatch:
        "The signed-in account changed in the meantime. Reload the page and try again.",
      progress_conflict:
        "Your learning record was changed elsewhere just now. Reload the page and try again.",
      progress_read_failed:
        "Your stored learning record could not be read. Try again later.",
      progress_write_failed:
        "Your learning record could not be saved. Try again later.",
      progress_store_unavailable:
        "The store for the learning record is unreachable. Try again later.",
    },
  },
} as const satisfies Readonly<Record<Locale, ImportIslandCopy>>;

function formatDate(locale: Locale, value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toLocaleDateString(
    locale === "de" ? "de-DE" : "en-GB",
  );
}

/**
 * Translate one refused import into learner-facing copy.
 *
 * An unnamed or unexpected answer falls back to the transport message rather
 * than leaking a status code into the page.
 */
export function importErrorMessage(locale: Locale, body: unknown): string {
  const copy: ImportIslandCopy = IMPORT_COPY[locale];
  const error = isRecord(body) ? body.error : undefined;
  if (error === "progress_already_imported") {
    const date = formatDate(locale, isRecord(body) ? body.importedAt : null);
    return date ? copy.alreadyImported(date) : copy.errors.progress_conflict;
  }
  if (typeof error === "string" && error in copy.errors) {
    return copy.errors[error];
  }
  return copy.unknownError;
}
