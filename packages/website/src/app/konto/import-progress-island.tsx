"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrandButton } from "@/components/ui/brand-button";
import {
  summarizeImport,
  type ImportSummary,
} from "@/lib/progress/import-summary";
import type { UnifiedProgress } from "@/lib/progress/types";
import type { Locale } from "@/lib/i18n/locale";
import {
  IMPORT_COPY,
  countLabel,
  importErrorMessage,
} from "./import-progress-copy";
import {
  coerceProgressView,
  emptyProgressView,
  finiteNumberOrNull,
  isRecord,
  readAnonymousSnapshot,
} from "./local-progress-snapshot";

/**
 * ─── Local progress import, the browser half ──
 *
 * Offers this browser's anonymous localStorage namespace to the signed-in
 * account exactly once, and only when folding it in would actually move
 * something forward.
 *
 * Four properties this component is built around:
 *
 *  1. NO SUPABASE SDK. Ownership comes from `GET /api/progress`, which answers
 *     with the server-derived `ownerId` for the cookie-bound session. Pulling
 *     the browser client in here would put the whole SDK into the account
 *     page's first-load JavaScript to learn one string the server already has.
 *  2. NO LAYOUT SHIFT AT HYDRATION. The server renders nothing and the first
 *     client render renders nothing, so hydration reproduces the server DOM
 *     exactly. The offer can only appear afterwards, from an effect, once real
 *     local data has been read and the account has been asked what it holds.
 *  3. THE ANONYMOUS NAMESPACE IS READ-ONLY HERE. Nothing in this file writes
 *     to it, so a refused, failed or successful import all leave the browser's
 *     own copy exactly as it was.
 *  4. "NOTHING TO IMPORT" IS COMPUTED, NOT REMEMBERED. The preview is the
 *     difference between the account and the snapshot, so after a successful
 *     import the account already contains the snapshot, the next visit
 *     computes zero and the region renders nothing. No second marker in
 *     localStorage has to be kept in step with the server's one-shot marker,
 *     and a snapshot that adds nothing is never offered in the first place.
 *
 * The preview is an estimate of what WOULD merge, made from the fields the
 * account read exposes. It does not know about reset epochs the account may
 * hold, which the server applies before merging, so the numbers in the done
 * state come from the server's own summary in its answer, never from the
 * preview.
 */

const PROGRESS_ENDPOINT = "/api/progress";
const IMPORT_ENDPOINT = "/api/progress/import";

interface ImportOffer {
  readonly ownerId: string;
  /** The raw snapshot, posted exactly as it was stored. */
  readonly payload: unknown;
  readonly preview: ImportSummary;
}

type ImportStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "sending" }
  | { readonly kind: "done"; readonly merged: ImportSummary }
  | { readonly kind: "failed"; readonly message: string };

/**
 * The server's own count of what the import moved forward.
 *
 * These two numbers are read straight into a sentence, so they are narrowed
 * like any other response field: a missing, negative or fractional value would
 * otherwise reach a learner as "-1 Kurse" or "1.5 Lektionen". A zero here is
 * meaningful rather than a fallback, and says the account already held it all.
 */
function countedField(value: unknown): number {
  const parsed = finiteNumberOrNull(value);
  return parsed === null ? 0 : Math.max(0, Math.trunc(parsed));
}

function readMergedSummary(body: unknown): ImportSummary {
  if (!isRecord(body) || !isRecord(body.merged)) return { courses: 0, lessons: 0 };
  return {
    courses: countedField(body.merged.courses),
    lessons: countedField(body.merged.lessons),
  };
}

export function ImportProgressIsland({ locale }: { readonly locale: Locale }) {
  const [offer, setOffer] = useState<ImportOffer | null>(null);
  const [status, setStatus] = useState<ImportStatus>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const copy = IMPORT_COPY[locale];

  useEffect(() => {
    const snapshot = readAnonymousSnapshot();
    // No local namespace, an unreadable one, or one from an older build: stay
    // silent and never spend a request finding out what the account holds.
    if (!snapshot) return;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    let active = true;

    void (async () => {
      let account: UnifiedProgress;
      let ownerId: string;
      try {
        const response = await fetch(PROGRESS_ENDPOINT, {
          method: "GET",
          headers: { accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const body: unknown = await response.json();
        if (!isRecord(body) || typeof body.ownerId !== "string") return;
        ownerId = body.ownerId;
        account = coerceProgressView(body.progress) ?? emptyProgressView();
      } catch {
        // A record that cannot be read cannot be compared against, so there is
        // nothing honest to offer. The learner loses nothing by seeing no card,
        // and the local namespace is untouched either way.
        return;
      }
      if (!active) return;
      const preview = summarizeImport(account, snapshot.view);
      if (preview.courses === 0 && preview.lessons === 0) return;
      setOffer({ ownerId, payload: snapshot.raw, preview });
    })();

    // Unmount cancels whatever is in flight, the account read on this
    // controller or a confirmed import on a later one, so no answer lands in a
    // component that is gone.
    return () => {
      active = false;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const confirmImport = useCallback(() => {
    if (!offer) return;
    setStatus({ kind: "sending" });
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    void (async () => {
      let response: Response;
      try {
        response = await fetch(IMPORT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({
            expectedOwnerId: offer.ownerId,
            progress: offer.payload,
          }),
        });
      } catch {
        if (!controller.signal.aborted) {
          setStatus({ kind: "failed", message: copy.unknownError });
        }
        return;
      }
      const body: unknown = await response.json().catch(() => null);
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setStatus({ kind: "failed", message: importErrorMessage(locale, body) });
        return;
      }
      setStatus({ kind: "done", merged: readMergedSummary(body) });
      setOffer(null);
    })();
  }, [copy.unknownError, locale, offer]);

  if (status.kind === "done") {
    const { merged } = status;
    const nothingMoved = merged.courses === 0 && merged.lessons === 0;
    return (
      <div
        data-progress-import="done"
        className="mt-4 border border-border border-l-[3px] border-l-brand-orange bg-kupfer-mist p-4"
      >
        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
          {copy.successLabel}
        </p>
        <p role="status" className="mt-2 text-sm leading-relaxed text-foreground">
          {nothingMoved
            ? copy.successNothing
            : copy.successBody(
                countLabel(locale, merged.courses, "courses"),
                countLabel(locale, merged.lessons, "lessons"),
              )}
        </p>
        <div className="mt-4">
          <BrandButton
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            {copy.reload}
          </BrandButton>
        </div>
      </div>
    );
  }

  if (!offer) return null;

  return (
    <div
      data-progress-import={status.kind === "sending" ? "sending" : "offer"}
      className="mt-4 border border-border border-l-[3px] border-l-brand-orange p-4"
    >
      <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
        {copy.label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        {copy.offerBody(
          countLabel(locale, offer.preview.courses, "courses"),
          countLabel(locale, offer.preview.lessons, "lessons"),
        )}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {copy.offerNote}
      </p>
      {status.kind === "failed" ? (
        <div role="alert" className="mt-4 border-t border-border pt-4">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground">
            {copy.failedLabel}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {status.message}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {copy.keepsLocal}
          </p>
        </div>
      ) : null}
      <div className="mt-4">
        <BrandButton
          variant="primary"
          size="sm"
          onClick={confirmImport}
          disabled={status.kind === "sending"}
        >
          {status.kind === "sending" ? copy.sending : copy.action}
        </BrandButton>
      </div>
    </div>
  );
}
