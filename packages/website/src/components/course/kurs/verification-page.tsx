"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { m } from "framer-motion";
// JSON-free config module (performance hardening): importing from ./data here
// would pull the full lesson/quiz JSON graph into this client bundle.
import { getCourseConfig } from "@/lib/course/config";
import {
  CERTIFICATE_QR_VERSION,
  type CertificateCompletionMode,
} from "@/lib/course/certificate-constants";
import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";

/**
 * Shared certificate-verification screen for every free course.
 * The route pages pass a `courseSlug`; all
 * course-specific copy comes from `CourseConfig`.
 */

interface VerificationData {
  n: string; // name
  s: number | null; // score percentage for quiz path
  m: CertificateCompletionMode; // completion mode
  d: string; // completedAt ISO
  c: CourseSlug; // course slug
  v: number; // version
}

/** Completion line for the two non-quiz eligibility paths. */
const COMPLETION_LABEL: Record<Exclude<CertificateCompletionMode, "quiz">, string> = {
  capstone: "Abschlussweg: Capstone-Rubrik",
  completion: "Abschlussweg: Alle Lektionen abgeschlossen",
};

type DecodeResult =
  | { readonly ok: true; readonly data: VerificationData }
  | { readonly ok: false; readonly reason: "malformed" | "course-mismatch" };
type DecodeFailureReason = Extract<DecodeResult, { ok: false }>["reason"];

// Derived from the canonical COURSE_SLUGS union (plan 007 stage 8) — every
// course's QR certificate decodes correctly, not just the original 4.
function isCourseSlug(value: unknown): value is CourseSlug {
  return (
    typeof value === "string" &&
    (COURSE_SLUGS as readonly string[]).includes(value)
  );
}

function decodeHash(hash: string, courseSlug: CourseSlug): DecodeResult {
  try {
    const encoded = hash.startsWith("#") ? hash.slice(1) : hash;
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";

    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const parsed = JSON.parse(json);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.n !== "string" ||
      parsed.n.trim().length < 2 ||
      parsed.n.trim().length > 120 ||
      !(
        parsed.s === null ||
        (typeof parsed.s === "number" &&
          Number.isFinite(parsed.s) &&
          parsed.s >= 0 &&
          parsed.s <= 100)
      ) ||
      !(parsed.m === "quiz" || parsed.m === "capstone" || parsed.m === "completion") ||
      (parsed.m === "quiz" && parsed.s === null) ||
      (parsed.m !== "quiz" && parsed.s !== null) ||
      typeof parsed.d !== "string" ||
      Number.isNaN(Date.parse(parsed.d)) ||
      parsed.v !== CERTIFICATE_QR_VERSION ||
      !isCourseSlug(parsed.c)
    ) {
      return { ok: false, reason: "malformed" };
    }
    if (parsed.c !== courseSlug) {
      return { ok: false, reason: "course-mismatch" };
    }
    return {
      ok: true,
      data: {
        n: parsed.n.trim(),
        s: parsed.s,
        m: parsed.m,
        d: parsed.d,
        c: parsed.c,
        v: parsed.v,
      },
    };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

interface VerificationPageProps {
  readonly courseSlug: CourseSlug;
}

export function VerificationPage({ courseSlug }: VerificationPageProps) {
  const config = getCourseConfig(courseSlug);
  const [data, setData] = useState<VerificationData | null>(null);
  const [invalidReason, setInvalidReason] = useState<DecodeFailureReason | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash === "#") {
      setInvalidReason("malformed");
      return;
    }
    const decoded = decodeHash(hash, courseSlug);
    if (decoded.ok) {
      setData(decoded.data);
    } else {
      setInvalidReason(decoded.reason);
    }
  }, [courseSlug]);

  const completionDate = data?.d
    ? new Date(data.d).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="mx-auto max-w-lg px-6 py-16">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href={config.basePath}
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum {config.title}
          </Link>

          {/*
            Stable page <h1>, present in every render state (checking / valid /
            invalid). Keeps exactly one h1 on the route at all times.
            The client-side decode used to leave the
            "checking" state with zero headings).
          */}
          <h1 className="sr-only">Zertifikatdaten prüfen</h1>

          {data && (
            <div className="border-2 border-brand-sand bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-brand-sand" />
              <p className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-sand">
                QR-Daten gelesen
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em]">
                {config.certificateTitle}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {config.certificateSubtitle}
              </p>
              <div className="mx-auto mt-6 h-px w-16 bg-brand-sand" />
              <p className="mt-6 text-lg font-semibold">{data.n}</p>
              <div className="mt-4 space-y-1 font-mono text-sm text-muted-foreground">
                <p>
                  {data.m === "quiz"
                    ? `Ergebnis: ${data.s}%`
                    : COMPLETION_LABEL[data.m]}
                </p>
                {completionDate && <p>Datum: {completionDate}</p>}
              </div>
              <div className="mx-auto mt-6 h-px w-16 bg-border" />
              <p className="mt-4 text-xs text-muted">
                loehrning.ai | {config.certificateReferenceLabel}
              </p>
              <p className="mt-3 border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
                {config.recordNoun.label}, lokal erzeugt. Die QR-Daten sind lesbar,
                aber nicht servergeprüft, nicht kryptografisch signiert und keine
                behördliche oder rechtliche Bescheinigung.
              </p>
            </div>
          )}

          {invalidReason && (
            <div className="border-2 border-destructive/30 bg-card p-8 text-center">
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em]">
                {invalidReason === "course-mismatch"
                  ? "Zertifikatcode passt nicht zu diesem Kurs."
                  : "Zertifikatcode nicht lesbar"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {invalidReason === "course-mismatch"
                  ? "Der Link enthält lesbare Daten, verweist aber auf einen anderen Kurs."
                  : "Der Link enthält keine lesbaren Zertifikatdaten oder wurde beschädigt."}
              </p>
            </div>
          )}

          {!data && !invalidReason && (
            <div className="py-16 text-center">
              <p role="status" aria-live="polite" className="text-muted-foreground">
                Zertifikatdaten werden gelesen…
              </p>
            </div>
          )}
        </m.div>
      </div>
    </div>
  );
}
