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
      "Du kannst ihn einmal übernehmen. Übernommen wird nur, was deinen Kontostand voranbringt; der Browser behält seinen Stand.",
    action: "Lokalen Fortschritt übernehmen",
    sending: "Wird übernommen",
    successLabel: "Übernommen",
    successBody: (courses, lessons) =>
      `${courses} und ${lessons} sind jetzt in deinem Konto.`,
    successNothing:
      "Dein Konto war bereits auf demselben Stand.",
    reload: "Lernstand neu laden",
    failedLabel: "Übernahme nicht möglich",
    keepsLocal:
      "Dein lokaler Lernstand ist unverändert. Versuche es später erneut.",
    alreadyImported: (date) =>
      `Du hast am ${date} schon einen lokalen Lernstand übernommen. Ein zweiter Import ist nicht möglich.`,
    unknownError:
      "Die Verbindung zum Server ist fehlgeschlagen. Versuche es später erneut.",
    errors: {
      unsupported_media_type:
        "Der Server hat die Anfrage abgelehnt. Lade die Seite neu und versuche es erneut.",
      auth_unavailable:
        "Der Anmeldedienst antwortet gerade nicht. Versuche es in einigen Minuten erneut.",
      auth_not_configured:
        "In dieser Umgebung ist kein Lernkonto eingerichtet.",
      unauthorized:
        "Deine Anmeldung ist abgelaufen. Melde dich neu an und versuche es erneut.",
      rate_limit_exceeded:
        "Zu viele Versuche. Warte etwa eine Stunde.",
      rate_limit_unavailable:
        "Der Schutz vor zu vielen Anfragen ist gerade aus, deshalb wurde nichts geschrieben. Versuche es in einigen Minuten erneut.",
      payload_too_large: "Dein lokaler Lernstand ist für eine Übernahme zu groß.",
      progress_too_large:
        "Ein Kurs im lokalen Lernstand ist zu groß zum Speichern.",
      invalid_import:
        "Der Server kann das Format des lokalen Lernstands nicht annehmen.",
      unsupported_schema_version:
        "Der lokale Lernstand stammt aus einer älteren Version. Öffne einen Kurs, damit der Browser ihn aktualisiert, dann versuche es erneut.",
      progress_owner_mismatch:
        "Das angemeldete Konto hat gewechselt. Lade die Seite neu und versuche es erneut.",
      progress_conflict:
        "Dein Lernstand wurde gerade woanders geändert. Lade die Seite neu und versuche es erneut.",
      progress_read_failed:
        "Dein gespeicherter Lernstand ließ sich nicht lesen. Versuche es später erneut.",
      progress_write_failed:
        "Dein Lernstand ließ sich nicht speichern. Versuche es später erneut.",
      progress_store_unavailable:
        "Der Lernstand-Speicher ist gerade nicht erreichbar. Versuche es später erneut.",
    },
  },
  en: {
    label: "Local learning record",
    offerBody: (courses, lessons) =>
      `This browser holds progress your account does not know about yet: ${courses}, ${lessons}.`,
    offerNote:
      "You can transfer it once. Only what moves your account forward is transferred; the browser keeps its record.",
    action: "Transfer local progress",
    sending: "Transferring",
    successLabel: "Transferred",
    successBody: (courses, lessons) =>
      `${courses} and ${lessons} are now in your account.`,
    successNothing:
      "Your account already held the same state.",
    reload: "Reload the learning record",
    failedLabel: "Transfer not possible",
    keepsLocal:
      "Your local learning record is unchanged. Try again later.",
    alreadyImported: (date) =>
      `You already transferred a local learning record on ${date}. A second import is not possible.`,
    unknownError: "The connection to the server failed. Try again later.",
    errors: {
      unsupported_media_type:
        "The server rejected the request. Reload the page and try again.",
      auth_unavailable:
        "The sign-in service is not responding. Try again in a few minutes.",
      auth_not_configured:
        "This environment has no learning account configured.",
      unauthorized: "Your sign-in has expired. Sign in again and try once more.",
      rate_limit_exceeded: "Too many attempts. Wait about an hour.",
      rate_limit_unavailable:
        "The protection against excessive requests is down, so nothing was written. Try again in a few minutes.",
      payload_too_large:
        "Your local learning record is too large to be transferred.",
      progress_too_large:
        "A course in the local record is too large to store.",
      invalid_import:
        "The server cannot accept the format of the local record.",
      unsupported_schema_version:
        "The local learning record comes from an older version. Open a course so the browser updates it, then try again.",
      progress_owner_mismatch:
        "The signed-in account changed. Reload the page and try again.",
      progress_conflict:
        "Your learning record just changed elsewhere. Reload the page and try again.",
      progress_read_failed:
        "Your stored learning record could not be read. Try again later.",
      progress_write_failed:
        "Your learning record could not be saved. Try again later.",
      progress_store_unavailable:
        "The learning record store is unreachable. Try again later.",
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
