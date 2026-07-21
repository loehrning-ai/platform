"use client";

import { useState } from "react";
import Link from "next/link";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { UNIFIED_STORAGE_KEY } from "@/lib/progress/types";

export default function DatenschutzPage() {
  const [exportState, setExportState] = useState<"idle" | "loading" | "error">("idle");
  const [resetStates, setResetStates] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});
  const [deleteState, setDeleteState] = useState<"idle" | "confirming" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleExport() {
    setExportState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      const blob = await res.blob();
      const today = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loehrning-export-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportState("idle");
    } catch (err) {
      setExportState("error");
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  }

  async function handleResetCourse(slug: string) {
    setResetStates((s) => ({ ...s, [slug]: "loading" }));
    setErrorMsg(null);
    try {
      const res = await fetch("/api/account/reset-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug: slug }),
      });
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      setResetStates((s) => ({ ...s, [slug]: "done" }));
    } catch (err) {
      setResetStates((s) => ({ ...s, [slug]: "error" }));
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  }

  async function handleDelete() {
    if (deleteState !== "confirming") {
      setDeleteState("confirming");
      return;
    }
    setDeleteState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      const data: unknown = await res.json();
      if (data && typeof data === "object" && "deleted" in data && data.deleted) {
        // Clear localStorage gamification data
        try {
          localStorage.removeItem(UNIFIED_STORAGE_KEY);
        } catch {
          // non-fatal
        }
        window.location.href = "/";
      } else {
        throw new Error("Löschung fehlgeschlagen");
      }
    } catch (err) {
      setDeleteState("error");
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
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
          Hier kannst du deine gespeicherten Daten exportieren, Kursfortschritt zurücksetzen oder dein Konto vollständig löschen.
        </p>

        {errorMsg && (
          <p className="mt-4 border border-red-500 bg-red-500/10 px-4 py-2 font-mono text-[12px] text-red-400">
            {errorMsg}
          </p>
        )}

        {/* 1. Export */}
        <article className="mt-10 border border-border p-6">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">
            Meine Daten exportieren (Art. 20 DSGVO)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Du erhältst eine JSON-Datei mit deiner E-Mail-Adresse, deinem Kursfortschritt und dem Exportzeitpunkt.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportState === "loading"}
            className="mt-4 inline-flex items-center gap-2 border-2 border-foreground bg-background px-5 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[3px_3px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-foreground)] disabled:opacity-50"
          >
            {exportState === "loading" ? "Wird exportiert…" : "Daten herunterladen"}
          </button>
        </article>

        {/* 2. Reset per course */}
        <article className="mt-6 border border-border p-6">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">
            Kursfortschritt zurücksetzen
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Setzt den Serverfortschritt für den ausgewählten Kurs zurück. Dein lokaler Lernstand im Browser bleibt erhalten, bis du ihn dort manuell löschst.
          </p>
          <ul className="mt-4 space-y-3">
            {/*
              Scoped to COURSE_CATALOG (nativeStatus === "live"), not the full
              CourseSlug union: the 6 imported courses have no server-tracked
              progress to reset (external, unregistered in the shared
              engine), so listing them here would offer a reset action that
              does nothing — a compliance-sensitive page must never imply
              there is data to reset when there is none.
            */}
            {COURSE_CATALOG.map((course) => {
              const slug = course.slug;
              const state = resetStates[slug] ?? "idle";
              return (
                <li key={slug} className="flex items-center gap-4">
                  <span className="w-48 font-mono text-[12px] text-foreground">
                    {course.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleResetCourse(slug)}
                    disabled={state === "loading" || state === "done"}
                    className="border border-border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {state === "loading" ? "Zurücksetzen…" : state === "done" ? "Zurückgesetzt" : "Zurücksetzen"}
                  </button>
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
            Diese Aktion löscht deine E-Mail-Adresse und deinen gesamten gespeicherten Kursfortschritt dauerhaft. Die Löschung ist unwiderruflich.
          </p>
          {deleteState === "confirming" && (
            <p className="mt-4 border border-red-500 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
              Bist du sicher? Diese Aktion löscht alle deine Daten dauerhaft und kann nicht rückgängig gemacht werden.
            </p>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteState === "loading"}
            className={`mt-4 inline-flex items-center gap-2 border-2 px-5 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] shadow-[3px_3px_0_currentColor] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[5px_5px_0_currentColor] disabled:opacity-50 ${
              deleteState === "confirming"
                ? "border-red-500 text-red-400 bg-red-500/10"
                : "border-foreground text-foreground bg-background"
            }`}
          >
            {deleteState === "loading"
              ? "Wird gelöscht…"
              : deleteState === "confirming"
              ? "Ja, Konto endgültig löschen"
              : "Konto löschen"}
          </button>
          {deleteState === "confirming" && (
            <button
              type="button"
              onClick={() => setDeleteState("idle")}
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
