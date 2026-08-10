"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import type { CourseSlug } from "@/lib/course/types";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  clearAccountLocalLearningData,
  getActiveProgressAccountId,
  resetCourse,
} from "@/lib/progress/store";
import {
  beginAccountDeletion,
  cancelAccountDeletion,
  confirmAccountDeletion,
  getAccountDeletionControlState,
} from "@/lib/progress/account-deletion-control";
import {
  type AccountDeletionLockLease,
  withAccountDeletionOriginLock,
} from "@/lib/progress/account-deletion-lock";
import {
  getProgressSyncFailure,
  getServerProgressSyncFailure,
  subscribeProgressSyncFailure,
} from "@/lib/progress/sync-status";
import { isDefiniteDeleteFailure } from "./deletion-response-policy";

function localized(locale: Locale, de: string, en: string): string {
  return locale === "en" ? en : de;
}

function exportPreflightErrorMessage(
  locale: Locale,
  errorCode: unknown,
  status: number,
): string {
  switch (errorCode) {
    case "account_owner_mismatch":
      return localized(
        locale,
        "Die Kontozuordnung hat sich geändert. Lade die Seite neu und starte den Export erneut.",
        "The account assignment changed. Reload the page and start the export again.",
      );
    case "auth_not_configured":
      return localized(
        locale,
        "Der Datenexport ist in dieser Umgebung nicht eingerichtet.",
        "Data export is not configured in this environment.",
      );
    case "auth_unavailable":
      return localized(
        locale,
        "Die Anmeldung kann vorübergehend nicht geprüft werden. Es wurde kein Export gestartet.",
        "The sign-in cannot be verified at present. No export was started.",
      );
    case "export_store_unavailable":
      return localized(
        locale,
        "Der geschützte Export-Datenspeicher ist vorübergehend nicht verfügbar.",
        "The protected export data store is temporarily unavailable.",
      );
    case "unauthorized":
      return localized(
        locale,
        "Die Anmeldung ist nicht mehr gültig. Melde dich erneut an und starte den Export noch einmal.",
        "The sign-in is no longer valid. Sign in again and restart the export.",
      );
    default:
      return localized(
        locale,
        `Der Datenexport konnte nicht vorbereitet werden (Fehler ${status}).`,
        `The data export could not be prepared (error ${status}).`,
      );
  }
}

function unknownDeleteStatusMessage(locale: Locale): string {
  return localized(
    locale,
    "Der Löschstatus konnte nicht sicher ermittelt werden. Sende die Löschung nicht erneut. Lade die Seite neu: Wenn die Anmeldung nicht mehr möglich ist, wurde das Konto bereits gelöscht. Bleibt es erreichbar, wende dich an tim@loehrning.ai.",
    "The deletion status could not be determined safely. Do not submit the deletion again. Reload the page: if sign-in is no longer possible, the account has already been deleted. If it remains accessible, contact tim@loehrning.ai.",
  );
}

export function DatenschutzClient({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const courses = localizeCatalog(COURSE_CATALOG, locale);
  const [exportState, setExportState] = useState<
    "idle" | "loading" | "started" | "error"
  >("idle");
  const [resetStates, setResetStates] = useState<
    Record<string, "idle" | "confirming" | "loading" | "done" | "error">
  >({});
  const [deleteState, setDeleteState] = useState<
    "idle" | "confirming" | "loading" | "error" | "unknown"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const resetButtonRefs = useRef<
    Partial<Record<CourseSlug, HTMLButtonElement | null>>
  >({});
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const syncFailure = useSyncExternalStore(
    subscribeProgressSyncFailure,
    getProgressSyncFailure,
    getServerProgressSyncFailure,
  );

  async function handleExport() {
    setExportState("loading");
    setErrorMsg(null);
    const accountId = getActiveProgressAccountId();
    if (!accountId) {
      setExportState("error");
      setErrorMsg(
        localized(
          locale,
          "Die Kontozuordnung ist noch nicht sicher bestätigt. Lade die Seite neu, bevor du den Export erneut startest.",
          "The account assignment has not yet been verified safely. Reload the page before restarting the export.",
        ),
      );
      return;
    }
    try {
      const res = await fetch("/api/account/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedOwnerId: accountId,
          preflight: true,
        }),
      });
      const payload = (await res.json().catch(() => null)) as {
        readonly error?: unknown;
        readonly ready?: unknown;
        readonly ownerId?: unknown;
      } | null;
      if (!res.ok) {
        throw new Error(
          exportPreflightErrorMessage(locale, payload?.error, res.status),
        );
      }
      if (payload?.ready !== true || payload.ownerId !== accountId) {
        throw new Error(
          localized(
            locale,
            "Der Datenexport konnte nicht sicher vorbereitet werden.",
            "The data export could not be prepared safely.",
          ),
        );
      }
      if (getActiveProgressAccountId() !== accountId) {
        throw new Error(
          localized(
            locale,
            "Die Kontozuordnung hat sich während des Exports geändert. Es wurde keine Datei gespeichert.",
            "The account assignment changed during export. No file was saved.",
          ),
        );
      }

      // Submit the actual export as a native attachment download. The browser
      // streams the response directly to its download manager; the page never
      // holds the potentially large JSON body, parsed object, and Blob in
      // memory at the same time.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/account/export";
      form.hidden = true;
      form.acceptCharset = "UTF-8";
      const owner = document.createElement("input");
      owner.type = "hidden";
      owner.name = "expectedOwnerId";
      owner.value = accountId;
      form.appendChild(owner);
      const language = document.createElement("input");
      language.type = "hidden";
      language.name = "locale";
      language.value = locale;
      form.appendChild(language);
      document.body.appendChild(form);
      try {
        form.requestSubmit();
      } finally {
        form.remove();
      }
      // A successful Content-Disposition response starts a browser-managed
      // download without navigating away. An early server failure deliberately
      // renders its small, accessible error document in this tab instead of
      // disappearing inside a hidden frame.
      setExportState("started");
    } catch (err) {
      setExportState("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : localized(locale, "Unbekannter Fehler", "Unknown error"),
      );
    }
  }

  async function handleResetCourse(slug: CourseSlug) {
    if ((resetStates[slug] ?? "idle") !== "confirming") {
      setResetStates((states) => ({ ...states, [slug]: "confirming" }));
      setErrorMsg(null);
      return;
    }

    setResetStates((s) => ({ ...s, [slug]: "loading" }));
    setErrorMsg(null);
    const accountId = getActiveProgressAccountId();
    if (!accountId) {
      setResetStates((states) => ({ ...states, [slug]: "error" }));
      setErrorMsg(
        localized(
          locale,
          "Die Kontozuordnung ist noch nicht sicher bestätigt. Lade die Seite neu, bevor du den Fortschritt zurücksetzt.",
          "The account assignment has not yet been verified safely. Reload the page before resetting progress.",
        ),
      );
      return;
    }
    try {
      const res = await fetch("/api/account/reset-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: slug,
          expectedOwnerId: accountId,
        }),
      });
      if (!res.ok) {
        throw new Error(
          localized(
            locale,
            `Fehler ${res.status}`,
            `Error ${res.status}`,
          ),
        );
      }
      const body = (await res.json()) as {
        readonly ownerId?: unknown;
        readonly resetAt?: unknown;
      };
      if (
        body.ownerId !== accountId ||
        typeof body.resetAt !== "string" ||
        !Number.isFinite(Date.parse(body.resetAt))
      ) {
        throw new Error(
          localized(
            locale,
            "Ungültige Reset-Bestätigung",
            "Invalid reset confirmation",
          ),
        );
      }
      if (getActiveProgressAccountId() !== accountId) {
        throw new Error(
          localized(
            locale,
            "Die Kontozuordnung hat sich während des Zurücksetzens geändert. Lokale Daten wurden nicht verändert.",
            "The account assignment changed during the reset. Local data was not changed.",
          ),
        );
      }
      // Delete the matching browser slice only after the server confirms the
      // row deletion. Otherwise the monotonic sync layer can recreate the
      // deleted server progress from stale local state.
      resetCourse(slug, body.resetAt);
      setResetStates((s) => ({ ...s, [slug]: "done" }));
    } catch (err) {
      setResetStates((s) => ({ ...s, [slug]: "error" }));
      setErrorMsg(
        err instanceof Error
          ? err.message
          : localized(locale, "Unbekannter Fehler", "Unknown error"),
      );
    }
  }

  function cancelResetCourse(slug: CourseSlug) {
    resetButtonRefs.current[slug]?.focus();
    setResetStates((states) => ({ ...states, [slug]: "idle" }));
  }

  function cancelDelete() {
    deleteButtonRef.current?.focus();
    setDeleteState("idle");
  }

  async function performAccountDeletion(
    accountId: string,
    lease: AccountDeletionLockLease,
  ) {
    const deletionEpoch = beginAccountDeletion(accountId);
    if (!deletionEpoch) {
      const existing = getAccountDeletionControlState();
      if (existing.phase === "pending" || existing.phase === "confirmed") {
        setDeleteState("unknown");
        setErrorMsg(
          localized(
            locale,
            "Für dieses Browserprofil läuft bereits eine Kontolöschung oder ihre Bestätigung steht noch aus. Es wurde keine weitere Löschanfrage gesendet. Lade die Seite neu und prüfe den Kontostatus.",
            "An account deletion is already running in this browser profile, or its confirmation is still pending. No further deletion request was sent. Reload the page and check the account status.",
          ),
        );
      } else {
        setDeleteState("error");
        setErrorMsg(
          localized(
            locale,
            "Die Löschung konnte lokal nicht sicher vorbereitet werden. Es wurde keine Löschanfrage gesendet. Lade die Seite neu und prüfe, ob der Browser Website-Daten speichern darf.",
            "The deletion could not be prepared safely in the browser. No deletion request was sent. Reload the page and check whether the browser can store site data.",
          ),
        );
      }
      return;
    }

    let res: Response;
    try {
      res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedOwnerId: accountId }),
      });
    } catch {
      // A lost client response cannot prove whether the server committed the
      // deletion. Keep sync paused and local data untouched.
      setDeleteState("unknown");
      setErrorMsg(
        localized(
          locale,
          "Der Löschstatus konnte wegen eines Verbindungsfehlers nicht sicher ermittelt werden. Sende die Löschung nicht erneut. Lade die Seite neu: Wenn die Anmeldung nicht mehr möglich ist, wurde das Konto bereits gelöscht. Bleibt es erreichbar, wende dich an tim@loehrning.ai.",
          "The deletion status could not be determined safely because of a connection error. Do not submit the deletion again. Reload the page: if sign-in is no longer possible, the account has already been deleted. If it remains accessible, contact tim@loehrning.ai.",
        ),
      );
      return;
    }

    const body = (await res.json().catch(() => null)) as {
      readonly error?: unknown;
      readonly deleted?: unknown;
      readonly ownerId?: unknown;
    } | null;

    if (!res.ok) {
      // Only exact application errors whose control flow ends before deletion,
      // or whose reconciliation confirms the account still exists, are safe
      // to cancel. A proxy/CDN error or unknown payload can arrive after the
      // server committed, so it must keep synchronization paused.
      if (!isDefiniteDeleteFailure(body?.error, res.status)) {
        setDeleteState("unknown");
        setErrorMsg(unknownDeleteStatusMessage(locale));
        return;
      }

      if (!cancelAccountDeletion(deletionEpoch)) {
        // The server rejected the request before deletion, but another tab or
        // a failed storage write prevented durable release of the local sync
        // barrier. Do not enable another request until ownership is reconciled.
        setDeleteState("unknown");
        setErrorMsg(
          localized(
            locale,
            "Die Löschung wurde serverseitig abgelehnt, aber die lokale Sperre konnte nicht sicher aufgehoben werden. Sende die Löschung nicht erneut. Lade die Seite neu und prüfe den Kontostatus.",
            "The server rejected the deletion, but the local block could not be released safely. Do not submit the deletion again. Reload the page and check the account status.",
          ),
        );
        return;
      }
      setDeleteState("error");
      setErrorMsg(
        res.status === 403 && body?.error === "reauthentication_required"
          ? localized(
              locale,
              "Sicherheitsprüfung erforderlich: Melde dich ab und erneut mit einer verfügbaren Anmeldemethode an. Die Kontolöschung ist danach 15 Minuten lang freigegeben.",
              "Security check required: sign out and sign in again using an available sign-in method. Account deletion is then available for 15 minutes.",
            )
          : localized(
              locale,
              `Fehler ${res.status}`,
              `Error ${res.status}`,
            ),
      );
      return;
    }

    if (body?.deleted !== true || body.ownerId !== accountId) {
      // An invalid success payload has the same ambiguity as a lost response.
      setDeleteState("unknown");
      setErrorMsg(
        localized(
          locale,
          "Der Server hat die Löschung nicht eindeutig bestätigt. Sende die Löschung nicht erneut. Die lokalen Lerndaten bleiben erhalten, bis der Kontostatus geklärt ist.",
          "The server did not confirm the deletion unambiguously. Do not submit the deletion again. Local learning data remains in place until the account status has been resolved.",
        ),
      );
      return;
    }

    if (!confirmAccountDeletion(deletionEpoch, accountId, lease)) {
      // The server deleted the account, but the browser could not publish the
      // complete cross-tab cleanup protocol. Do not redirect while another tab
      // may still need explicit recovery.
      setDeleteState("unknown");
      setErrorMsg(
        localized(
          locale,
          "Das Konto wurde serverseitig gelöscht, aber die lokale Bereinigung konnte nicht vollständig koordiniert werden. Die Fortschrittssynchronisierung bleibt sicherheitshalber gesperrt. Lade die Seite nicht in weiteren Tabs und wende dich an tim@loehrning.ai.",
          "The account was deleted on the server, but the local cleanup could not be coordinated completely. Progress synchronisation remains blocked as a precaution. Do not load the page in additional tabs and contact tim@loehrning.ai.",
        ),
      );
      return;
    }
    // The active owner may have changed while the request was in flight.
    // Delete only the account identity captured before the request.
    clearAccountLocalLearningData(accountId);
    window.location.href = localizeHref("/", locale);
  }

  async function handleDelete() {
    if (deleteState !== "confirming") {
      setDeleteState("confirming");
      return;
    }
    const accountId = getActiveProgressAccountId();
    if (!accountId) {
      setDeleteState("error");
      setErrorMsg(
        localized(
          locale,
          "Die Kontozuordnung ist noch nicht sicher bestätigt. Lade die Seite neu, bevor du die Löschung erneut startest.",
          "The account assignment has not yet been verified safely. Reload the page before restarting the deletion.",
        ),
      );
      return;
    }

    // One origin-global Web Lock makes DELETE single-flight across tabs and
    // accounts. The deletion scalar and storage cutover are also global; two
    // account-specific locks could otherwise publish competing generations.
    setDeleteState("loading");
    setErrorMsg(null);
    const result = await withAccountDeletionOriginLock(
      { ifAvailable: true },
      (lease) => performAccountDeletion(accountId, lease),
    );
    if (result.kind === "acquired") return;
    if (result.kind === "contended") {
      setDeleteState("unknown");
      setErrorMsg(
        localized(
          locale,
          "In einem anderen Tab läuft bereits eine Kontolöschung. Es wurde keine weitere Löschanfrage gesendet. Warte dort auf das Ergebnis und lade diese Seite danach neu.",
          "An account deletion is already running in another tab. No further deletion request was sent. Wait for the result there, then reload this page.",
        ),
      );
      return;
    }
    if (result.kind === "operation-failed") {
      setDeleteState("unknown");
      setErrorMsg(unknownDeleteStatusMessage(locale));
      return;
    }
    setDeleteState("error");
    setErrorMsg(
      localized(
        locale,
        "Die Löschsperre konnte nicht sicher aktiviert werden; eine sichere tabübergreifende Kontolöschung ist in diesem Browser daher nicht möglich. Es wurde keine Löschanfrage gesendet.",
        "The deletion lock could not be activated safely, so this browser cannot perform a safe cross-tab account deletion. No deletion request was sent.",
      ),
    );
  }

  return (
    <section className="py-20" aria-labelledby="account-privacy-title">
      <div className="mx-auto max-w-3xl break-words px-6">
        <nav className="mb-8">
          <Link
            href={localizeHref("/konto", locale)}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground underline-offset-4 hover:underline"
          >
            {localized(locale, "← Zurück zum Konto", "← Back to account")}
          </Link>
        </nav>

        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          {localized(
            locale,
            "Freie Lernplattform · Datenschutz",
            "Open learning platform · Privacy",
          )}
        </p>
        <h1
          id="account-privacy-title"
          className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] text-foreground"
        >
          {localized(
            locale,
            "Datenschutz & Datenverwaltung.",
            "Privacy and data management.",
          )}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {localized(
            locale,
            "Hier kannst du deine gespeicherten Daten exportieren, Kursfortschritt zurücksetzen oder dein Konto vollständig löschen.",
            "Export your stored data, reset course progress, or delete your account completely.",
          )}
        </p>

        {errorMsg && (
          <p
            role="alert"
            className="mt-4 border border-red-500 bg-red-500/10 px-4 py-2 font-mono text-[12px] text-destructive"
          >
            {errorMsg}
          </p>
        )}

        {syncFailure && (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 border border-amber-700 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
          >
            {syncFailure === "permanent"
              ? localized(
                  locale,
                  "Die Server-Synchronisierung wurde wegen einer nicht wiederholbaren Antwort angehalten. Dein Fortschritt bleibt in diesem Browser gespeichert, ist auf anderen Geräten aber möglicherweise nicht aktuell.",
                  "Server synchronisation stopped after a non-retryable response. Your progress remains stored in this browser, but it may not be current on other devices.",
                )
              : syncFailure === "retry_exhausted"
                ? localized(
                    locale,
                    "Die Server-Synchronisierung ist nach mehreren Versuchen weiterhin fehlgeschlagen. Dein Fortschritt bleibt in diesem Browser gespeichert und wird bei einer neuen Änderung oder wiederhergestellter Verbindung erneut übertragen.",
                    "Server synchronisation still failed after several attempts. Your progress remains stored in this browser and will be sent again after a new change or when the connection is restored.",
                  )
                : localized(
                    locale,
                    "Die Server-Synchronisierung konnte nicht gestartet werden. Dein Fortschritt bleibt in diesem Browser gespeichert, bis die Verbindung erneut geprüft werden kann.",
                    "Server synchronisation could not start. Your progress remains stored in this browser until the connection can be checked again.",
                  )}
          </p>
        )}

        {/* 1. Export */}
        <article className="mt-10 border border-border p-6">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">
            {localized(
              locale,
              "Meine Daten exportieren (Art. 20 DSGVO)",
              "Export my data (Article 20 GDPR)",
            )}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {localized(
              locale,
              "Du erhältst eine JSON-Datei mit deiner E-Mail-Adresse, deinem Kursfortschritt, vorhandenen historischen Quizversuchen und dem Exportzeitpunkt. Prüfe in der Datei, dass",
              "You receive a JSON file containing your email address, course progress, existing historical quiz attempts, and the export time. Check that",
            )}{" "}
            <code className="mx-1 font-mono text-[0.9em] text-foreground">
              export_complete
            </code>
            {" "}
            {localized(locale, "auf", "is set to")}{" "}
            <code className="font-mono text-[0.9em] text-foreground">true</code>
            {localized(locale, " steht.", ".")}
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportState === "loading"}
            aria-busy={exportState === "loading"}
            className="mt-4 inline-flex items-center gap-2 border-2 border-foreground bg-background px-5 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[3px_3px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-foreground)] disabled:opacity-50"
          >
            {exportState === "loading"
              ? localized(locale, "Wird exportiert…", "Exporting…")
              : exportState === "started"
                ? localized(
                    locale,
                    "Erneut herunterladen",
                    "Download again",
                  )
                : localized(
                    locale,
                    "Daten herunterladen",
                    "Download data",
                  )}
          </button>
          {exportState === "started" && (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-sm leading-relaxed text-muted-foreground"
            >
              {localized(
                locale,
                "Der Download wurde angefordert. Sobald der Browser eine JSON-Datei gespeichert hat, öffne sie erst nach Abschluss des Downloads und prüfe den Marker",
                "The download was requested. Once the browser has saved a JSON file, open it only after the download has finished and check the marker",
              )}{" "}
              <code className="mx-1 font-mono text-[0.9em] text-foreground">
                export_complete
              </code>
              .
            </p>
          )}
        </article>

        {/* 2. Reset per course */}
        <article className="mt-6 border border-border p-6">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">
            {localized(
              locale,
              "Kursfortschritt zurücksetzen",
              "Reset course progress",
            )}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {localized(
              locale,
              "Löscht Lektionen, Quiz- und Abschlussstatus des ausgewählten Kurses auf dem Server und in diesem Browser. Andere Kurse bleiben erhalten. Kursübergreifende XP, Badges, Streaks und Checkpoints bleiben als historische Lernaktivität bestehen. Der Server behält den Zeitpunkt des Resets als Schutz gegen veraltete Geräte; dieser Marker erscheint im Datenexport und verschwindet bei der Kontolöschung.",
              "Deletes lesson, quiz, and completion status for the selected course on the server and in this browser. Other courses remain intact. Cross-course XP, badges, streaks, and checkpoints remain as historical learning activity. The server retains the reset time to protect against stale devices; this marker appears in the data export and is removed when the account is deleted.",
            )}
          </p>
          <ul className="mt-4 space-y-3">
            {/*
              COURSE_CATALOG is the canonical list of live courses using the
              unified local and server progress engine. Raw slugs never become
              labels on this compliance-sensitive page.
            */}
            {courses.map((course) => {
              const slug = course.slug;
              const state = resetStates[slug] ?? "idle";
              const confirmationId = `reset-confirmation-${slug}`;
              return (
                <li key={slug} className="flex flex-wrap items-center gap-3">
                  <div className="flex w-full flex-wrap items-center gap-3">
                    <span className="w-48 min-w-0 break-words font-mono text-[12px] text-foreground">
                      {course.title}
                    </span>
                    <button
                      ref={(node) => {
                        resetButtonRefs.current[slug] = node;
                      }}
                      type="button"
                      onClick={() => handleResetCourse(slug)}
                      disabled={state === "loading" || state === "done"}
                      aria-busy={state === "loading"}
                      aria-expanded={state === "confirming"}
                      aria-controls={
                        state === "confirming" ? confirmationId : undefined
                      }
                      aria-describedby={
                        state === "confirming" ? confirmationId : undefined
                      }
                      className="border border-border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-50"
                    >
                      {state === "loading"
                        ? localized(locale, "Zurücksetzen…", "Resetting…")
                        : state === "done"
                          ? localized(locale, "Zurückgesetzt", "Reset")
                          : state === "confirming"
                            ? localized(
                                locale,
                                "Ja, endgültig zurücksetzen",
                                "Yes, reset permanently",
                              )
                            : localized(locale, "Zurücksetzen", "Reset")}
                    </button>
                    {state === "confirming" && (
                      <button
                        type="button"
                        onClick={() => cancelResetCourse(slug)}
                        className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      >
                        {localized(locale, "Abbrechen", "Cancel")}
                      </button>
                    )}
                  </div>
                  {state === "confirming" && (
                    <p
                      id={confirmationId}
                      role="alert"
                      className="w-full border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-destructive"
                    >
                      {localized(
                        locale,
                        `Fortschritt für ${course.title} wirklich zurücksetzen? Lektionen, Quiz- und Abschlussstatus dieses Kurses werden auf dem Server und in diesem Browser gelöscht.`,
                        `Reset progress for ${course.title}? Lesson, quiz, and completion status for this course will be deleted on the server and in this browser.`,
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </article>

        {/* 3. Delete account */}
        <article className="mt-6 border border-red-900/50 p-6">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">
            {localized(
              locale,
              "Konto löschen (Art. 17 DSGVO)",
              "Delete account (Article 17 GDPR)",
            )}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {localized(
              locale,
              "Diese Aktion löscht dein Lernkonto, deine E-Mail-Adresse, den serverseitigen Kursfortschritt und historische Bewertungsversuche dauerhaft. Pseudonyme Missbrauchsschutz-Zähler und bereits zwischengespeicherte KI-Antworten enthalten keine rohe Kontokennung; sie laufen nach den in der Datenschutzerklärung genannten Fristen aus. Nach erfolgreich koordinierter Löschung bleibt ein lokaler Löschmarker mit der technischen Kontokennung höchstens 30 Tage gespeichert, damit auch pausierte Tabs die zugehörigen Browser-Lerndaten entfernen. Danach bleiben eine zufällige technische Generation und eine mit SHA-256 aus der technischen Kontokennung abgeleitete Löschkennung ohne rohe Kontokennung als dauerhafte Sperren gegen veraltete Tabs gespeichert. Höchstens 128 solcher Löschkennungen werden vorgehalten; danach ersetzt eine globale Generation die bisherigen einzelnen Kennungen. Nur die Kennung des aktuellen Löschvorgangs bleibt für dessen wiederholbare Verarbeitung gespeichert. Die Löschung ist unwiderruflich.",
              "This action permanently deletes your learning account, email address, server-side course progress, and historical assessment attempts. Pseudonymous abuse-prevention counters and cached AI responses contain no raw account identifier; they expire under the periods stated in the privacy policy. After a successfully coordinated deletion, a local deletion marker containing the technical account identifier remains for no more than 30 days so that suspended tabs also remove the associated browser learning data. A random technical generation and a deletion identifier derived with SHA-256 from the technical account identifier then remain, without the raw account identifier, as permanent blocks against stale tabs. No more than 128 such deletion identifiers are retained; a global generation then replaces the previous individual identifiers. Only the identifier for the current deletion remains available for idempotent processing. Deletion cannot be reversed.",
            )}
          </p>
          {deleteState === "confirming" && (
            <p
              id="delete-account-confirmation"
              role="alert"
              className="mt-4 border border-red-500 bg-red-500/10 px-4 py-3 text-sm font-bold text-destructive"
            >
              {localized(
                locale,
                "Bist du sicher? Lernkonto, E-Mail-Adresse, Fortschritt und Bewertungsversuche werden dauerhaft gelöscht und können nicht wiederhergestellt werden.",
                "Are you sure? The learning account, email address, progress, and assessment attempts will be deleted permanently and cannot be restored.",
              )}
            </p>
          )}
          <button
            ref={deleteButtonRef}
            type="button"
            onClick={handleDelete}
            disabled={deleteState === "loading" || deleteState === "unknown"}
            aria-expanded={deleteState === "confirming"}
            aria-controls={
              deleteState === "confirming"
                ? "delete-account-confirmation"
                : undefined
            }
            className={`mt-4 inline-flex max-w-full items-center gap-2 whitespace-normal border-2 px-5 py-3 text-center font-mono text-[12px] font-bold uppercase tracking-[0.06em] shadow-[3px_3px_0_currentColor] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[5px_5px_0_currentColor] disabled:opacity-50 ${
              deleteState === "confirming"
                ? "border-red-500 text-destructive bg-red-500/10"
                : "border-foreground text-foreground bg-background"
            }`}
          >
            {deleteState === "loading"
              ? localized(locale, "Wird gelöscht…", "Deleting…")
              : deleteState === "unknown"
                ? localized(
                    locale,
                    "Löschstatus unklar",
                    "Deletion status unknown",
                  )
                : deleteState === "confirming"
                  ? localized(
                      locale,
                      "Ja, Konto endgültig löschen",
                      "Yes, delete account permanently",
                    )
                  : localized(locale, "Konto löschen", "Delete account")}
          </button>
          {deleteState === "confirming" && (
            <button
              type="button"
              onClick={cancelDelete}
              className="ml-3 mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground underline-offset-4 hover:underline"
            >
              {localized(locale, "Abbrechen", "Cancel")}
            </button>
          )}
        </article>
      </div>
    </section>
  );
}
