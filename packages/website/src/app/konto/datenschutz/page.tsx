"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import type { CourseSlug } from "@/lib/course/types";
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

function exportPreflightErrorMessage(
  errorCode: unknown,
  status: number,
): string {
  switch (errorCode) {
    case "account_owner_mismatch":
      return "Die Kontozuordnung hat sich geändert. Lade die Seite neu und starte den Export erneut.";
    case "auth_not_configured":
      return "Der Datenexport ist in dieser Umgebung nicht eingerichtet.";
    case "auth_unavailable":
      return "Die Anmeldung kann vorübergehend nicht geprüft werden. Es wurde kein Export gestartet.";
    case "export_store_unavailable":
      return "Der geschützte Export-Datenspeicher ist vorübergehend nicht verfügbar.";
    case "unauthorized":
      return "Die Anmeldung ist nicht mehr gültig. Melde dich erneut an und starte den Export noch einmal.";
    default:
      return `Der Datenexport konnte nicht vorbereitet werden (Fehler ${status}).`;
  }
}

function unknownDeleteStatusMessage(): string {
  return "Der Löschstatus konnte nicht sicher ermittelt werden. Sende die Löschung nicht erneut. Lade die Seite neu: Wenn die Anmeldung nicht mehr möglich ist, wurde das Konto bereits gelöscht. Bleibt es erreichbar, wende dich an tim@loehrning.ai.";
}

export default function DatenschutzPage() {
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
        "Die Kontozuordnung ist noch nicht sicher bestätigt. Lade die Seite neu, bevor du den Export erneut startest.",
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
          exportPreflightErrorMessage(payload?.error, res.status),
        );
      }
      if (payload?.ready !== true || payload.ownerId !== accountId) {
        throw new Error(
          "Der Datenexport konnte nicht sicher vorbereitet werden.",
        );
      }
      if (getActiveProgressAccountId() !== accountId) {
        throw new Error(
          "Die Kontozuordnung hat sich während des Exports geändert. Es wurde keine Datei gespeichert.",
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
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler");
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
        "Die Kontozuordnung ist noch nicht sicher bestätigt. Lade die Seite neu, bevor du den Fortschritt zurücksetzt.",
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
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      const body = (await res.json()) as {
        readonly ownerId?: unknown;
        readonly resetAt?: unknown;
      };
      if (
        body.ownerId !== accountId ||
        typeof body.resetAt !== "string" ||
        !Number.isFinite(Date.parse(body.resetAt))
      ) {
        throw new Error("Ungültige Reset-Bestätigung");
      }
      if (getActiveProgressAccountId() !== accountId) {
        throw new Error(
          "Die Kontozuordnung hat sich während des Zurücksetzens geändert. Lokale Daten wurden nicht verändert.",
        );
      }
      // Delete the matching browser slice only after the server confirms the
      // row deletion. Otherwise the monotonic sync layer can recreate the
      // deleted server progress from stale local state.
      resetCourse(slug, body.resetAt);
      setResetStates((s) => ({ ...s, [slug]: "done" }));
    } catch (err) {
      setResetStates((s) => ({ ...s, [slug]: "error" }));
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler");
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
          "Für dieses Browserprofil läuft bereits eine Kontolöschung oder ihre Bestätigung steht noch aus. Es wurde keine weitere Löschanfrage gesendet. Lade die Seite neu und prüfe den Kontostatus.",
        );
      } else {
        setDeleteState("error");
        setErrorMsg(
          "Die Löschung konnte lokal nicht sicher vorbereitet werden. Es wurde keine Löschanfrage gesendet. Lade die Seite neu und prüfe, ob der Browser Website-Daten speichern darf.",
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
        "Der Löschstatus konnte wegen eines Verbindungsfehlers nicht sicher ermittelt werden. Sende die Löschung nicht erneut. Lade die Seite neu: Wenn die Anmeldung nicht mehr möglich ist, wurde das Konto bereits gelöscht. Bleibt es erreichbar, wende dich an tim@loehrning.ai.",
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
        setErrorMsg(unknownDeleteStatusMessage());
        return;
      }

      if (!cancelAccountDeletion(deletionEpoch)) {
        // The server rejected the request before deletion, but another tab or
        // a failed storage write prevented durable release of the local sync
        // barrier. Do not enable another request until ownership is reconciled.
        setDeleteState("unknown");
        setErrorMsg(
          "Die Löschung wurde serverseitig abgelehnt, aber die lokale Sperre konnte nicht sicher aufgehoben werden. Sende die Löschung nicht erneut. Lade die Seite neu und prüfe den Kontostatus.",
        );
        return;
      }
      setDeleteState("error");
      setErrorMsg(
        res.status === 403 && body?.error === "reauthentication_required"
          ? "Sicherheitsprüfung erforderlich: Melde dich ab und erneut per Login-Link an. Die Kontolöschung ist danach 15 Minuten lang freigegeben."
          : `Fehler ${res.status}`,
      );
      return;
    }

    if (body?.deleted !== true || body.ownerId !== accountId) {
      // An invalid success payload has the same ambiguity as a lost response.
      setDeleteState("unknown");
      setErrorMsg(
        "Der Server hat die Löschung nicht eindeutig bestätigt. Sende die Löschung nicht erneut. Die lokalen Lerndaten bleiben erhalten, bis der Kontostatus geklärt ist.",
      );
      return;
    }

    if (!confirmAccountDeletion(deletionEpoch, accountId, lease)) {
      // The server deleted the account, but the browser could not publish the
      // complete cross-tab cleanup protocol. Do not redirect while another tab
      // may still need explicit recovery.
      setDeleteState("unknown");
      setErrorMsg(
        "Das Konto wurde serverseitig gelöscht, aber die lokale Bereinigung konnte nicht vollständig koordiniert werden. Die Fortschrittssynchronisierung bleibt sicherheitshalber gesperrt. Lade die Seite nicht in weiteren Tabs und wende dich an tim@loehrning.ai.",
      );
      return;
    }
    // The active owner may have changed while the request was in flight.
    // Delete only the account identity captured before the request.
    clearAccountLocalLearningData(accountId);
    window.location.href = "/";
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
        "Die Kontozuordnung ist noch nicht sicher bestätigt. Lade die Seite neu, bevor du die Löschung erneut startest.",
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
        "In einem anderen Tab läuft bereits eine Kontolöschung. Es wurde keine weitere Löschanfrage gesendet. Warte dort auf das Ergebnis und lade diese Seite danach neu.",
      );
      return;
    }
    if (result.kind === "operation-failed") {
      setDeleteState("unknown");
      setErrorMsg(unknownDeleteStatusMessage());
      return;
    }
    setDeleteState("error");
    setErrorMsg(
      "Die Löschsperre konnte nicht sicher aktiviert werden; eine sichere tabübergreifende Kontolöschung ist in diesem Browser daher nicht möglich. Es wurde keine Löschanfrage gesendet.",
    );
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <nav className="mb-8">
          <Link
            href="/konto"
            className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Zurück zum Konto
          </Link>
        </nav>

        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          Freie Lernplattform · Datenschutz
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] text-foreground">
          Datenschutz &amp; Datenverwaltung.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Hier kannst du deine gespeicherten Daten exportieren, Kursfortschritt
          zurücksetzen oder dein Konto vollständig löschen.
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
              ? "Die Server-Synchronisierung wurde wegen einer nicht wiederholbaren Antwort angehalten. Dein Fortschritt bleibt in diesem Browser gespeichert, ist auf anderen Geräten aber möglicherweise nicht aktuell."
              : syncFailure === "retry_exhausted"
                ? "Die Server-Synchronisierung ist nach mehreren Versuchen weiterhin fehlgeschlagen. Dein Fortschritt bleibt in diesem Browser gespeichert und wird bei einer neuen Änderung oder wiederhergestellter Verbindung erneut übertragen."
                : "Die Server-Synchronisierung konnte nicht gestartet werden. Dein Fortschritt bleibt in diesem Browser gespeichert, bis die Verbindung erneut geprüft werden kann."}
          </p>
        )}

        {/* 1. Export */}
        <article className="mt-10 border border-border p-6">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">
            Meine Daten exportieren (Art. 20 DSGVO)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Du erhältst eine JSON-Datei mit deiner E-Mail-Adresse, deinem
            Kursfortschritt, vorhandenen historischen Quizversuchen und dem
            Exportzeitpunkt. Prüfe in der Datei, dass
            <code className="mx-1 font-mono text-[0.9em] text-foreground">
              export_complete
            </code>
            auf{" "}
            <code className="font-mono text-[0.9em] text-foreground">true</code>
            steht.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportState === "loading"}
            aria-busy={exportState === "loading"}
            className="mt-4 inline-flex items-center gap-2 border-2 border-foreground bg-background px-5 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[3px_3px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-foreground)] disabled:opacity-50"
          >
            {exportState === "loading"
              ? "Wird exportiert…"
              : exportState === "started"
                ? "Erneut herunterladen"
                : "Daten herunterladen"}
          </button>
          {exportState === "started" && (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-sm leading-relaxed text-muted-foreground"
            >
              Der Download wurde angefordert. Sobald der Browser eine JSON-Datei
              gespeichert hat, öffne sie erst nach Abschluss des Downloads und
              prüfe den Marker
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
            Kursfortschritt zurücksetzen
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Löscht Lektionen, Quiz- und Abschlussstatus des ausgewählten Kurses
            auf dem Server und in diesem Browser. Andere Kurse bleiben erhalten.
            Kursübergreifende XP, Badges, Streaks und Checkpoints bleiben als
            historische Lernaktivität bestehen. Der Server behält den Zeitpunkt
            des Resets als Schutz gegen veraltete Geräte; dieser Marker
            erscheint im Datenexport und verschwindet bei der Kontolöschung.
          </p>
          <ul className="mt-4 space-y-3">
            {/*
              COURSE_CATALOG is the canonical list of live courses using the
              unified local and server progress engine. Raw slugs never become
              labels on this compliance-sensitive page.
            */}
            {COURSE_CATALOG.map((course) => {
              const slug = course.slug;
              const state = resetStates[slug] ?? "idle";
              const confirmationId = `reset-confirmation-${slug}`;
              return (
                <li key={slug} className="flex flex-wrap items-center gap-3">
                  <div className="flex w-full flex-wrap items-center gap-3">
                    <span className="w-48 font-mono text-[12px] text-foreground">
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
                        ? "Zurücksetzen…"
                        : state === "done"
                          ? "Zurückgesetzt"
                          : state === "confirming"
                            ? "Ja, endgültig zurücksetzen"
                            : "Zurücksetzen"}
                    </button>
                    {state === "confirming" && (
                      <button
                        type="button"
                        onClick={() => cancelResetCourse(slug)}
                        className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      >
                        Abbrechen
                      </button>
                    )}
                  </div>
                  {state === "confirming" && (
                    <p
                      id={confirmationId}
                      role="alert"
                      className="w-full border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-destructive"
                    >
                      Fortschritt für {course.title} wirklich zurücksetzen?
                      Lektionen, Quiz- und Abschlussstatus dieses Kurses werden
                      auf dem Server und in diesem Browser gelöscht.
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
            Konto löschen (Art. 17 DSGVO)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Diese Aktion löscht dein Lernkonto, deine E-Mail-Adresse, den
            serverseitigen Kursfortschritt und historische Bewertungsversuche
            dauerhaft. Pseudonyme Missbrauchsschutz-Zähler und bereits
            zwischengespeicherte KI-Antworten enthalten keine rohe Kontokennung;
            sie laufen nach den in der Datenschutzerklärung genannten Fristen
            aus. Nach erfolgreich koordinierter Löschung bleibt ein lokaler
            Löschmarker mit der technischen Kontokennung höchstens 30 Tage
            gespeichert, damit auch pausierte Tabs die zugehörigen
            Browser-Lerndaten entfernen. Danach bleiben eine zufällige
            technische Generation und eine mit SHA-256 aus der technischen
            Kontokennung abgeleitete Löschkennung ohne rohe Kontokennung als
            dauerhafte Sperren gegen veraltete Tabs gespeichert. Höchstens 128
            solcher Löschkennungen werden vorgehalten; danach ersetzt eine
            globale Generation die bisherigen einzelnen Kennungen. Nur die
            Kennung des aktuellen Löschvorgangs bleibt für dessen wiederholbare
            Verarbeitung gespeichert. Die Löschung ist unwiderruflich.
          </p>
          {deleteState === "confirming" && (
            <p
              id="delete-account-confirmation"
              role="alert"
              className="mt-4 border border-red-500 bg-red-500/10 px-4 py-3 text-sm font-bold text-destructive"
            >
              Bist du sicher? Lernkonto, E-Mail-Adresse, Fortschritt und
              Bewertungsversuche werden dauerhaft gelöscht und können nicht
              wiederhergestellt werden.
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
            className={`mt-4 inline-flex items-center gap-2 border-2 px-5 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] shadow-[3px_3px_0_currentColor] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[5px_5px_0_currentColor] disabled:opacity-50 ${
              deleteState === "confirming"
                ? "border-red-500 text-destructive bg-red-500/10"
                : "border-foreground text-foreground bg-background"
            }`}
          >
            {deleteState === "loading"
              ? "Wird gelöscht…"
              : deleteState === "unknown"
                ? "Löschstatus unklar"
                : deleteState === "confirming"
                  ? "Ja, Konto endgültig löschen"
                  : "Konto löschen"}
          </button>
          {deleteState === "confirming" && (
            <button
              type="button"
              onClick={cancelDelete}
              className="ml-3 mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground underline-offset-4 hover:underline"
            >
              Abbrechen
            </button>
          )}
        </article>
      </div>
    </section>
  );
}
