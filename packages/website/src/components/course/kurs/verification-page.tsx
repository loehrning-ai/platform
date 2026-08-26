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
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import { MotionProvider } from "@/components/motion-provider";

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

type NonQuizMode = Exclude<CertificateCompletionMode, "quiz">;

/** Completion line for the two non-quiz eligibility paths, by course language. */
const COMPLETION_LABEL: Record<"de" | "en", Record<NonQuizMode, string>> = {
  de: {
    capstone: "Abschlussweg: Capstone-Rubrik",
    completion: "Abschlussweg: Alle Lektionen abgeschlossen",
  },
  en: {
    capstone: "Completion path: capstone rubric",
    completion: "Completion path: all lessons finished",
  },
};

type DecodeResult =
  | { readonly ok: true; readonly data: VerificationData }
  | { readonly ok: false; readonly reason: "malformed" | "course-mismatch" };
type DecodeFailureReason = Extract<DecodeResult, { ok: false }>["reason"];

// URL fragments are attacker-controlled and are processed on the main thread.
// A normal certificate payload is below 512 characters; this ceiling leaves
// ample compatibility room while bounding base64 decode, UTF-8 decode, and
// JSON parsing work.
export const MAX_CERTIFICATE_HASH_CHARS = 2_048;
const MAX_CERTIFICATE_JSON_BYTES = 1_536;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

// Derived from the canonical COURSE_SLUGS union — every
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
    if (
      encoded.length === 0 ||
      encoded.length > MAX_CERTIFICATE_HASH_CHARS ||
      encoded.length % 4 === 1 ||
      !BASE64URL_PATTERN.test(encoded)
    ) {
      return { ok: false, reason: "malformed" };
    }

    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";

    const binary = atob(base64);
    if (
      binary.length > MAX_CERTIFICATE_JSON_BYTES ||
      btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "") !== encoded
    ) {
      return { ok: false, reason: "malformed" };
    }
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
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
      !(
        parsed.m === "quiz" ||
        parsed.m === "capstone" ||
        parsed.m === "completion"
      ) ||
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
  readonly locale?: Locale;
}

export function VerificationPage({
  courseSlug,
  locale,
}: VerificationPageProps) {
  const config = getCourseConfig(courseSlug, locale);
  const [data, setData] = useState<VerificationData | null>(null);
  const [invalidReason, setInvalidReason] =
    useState<DecodeFailureReason | null>(null);

  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash;
      setData(null);
      setInvalidReason(null);
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
    };

    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [courseSlug]);

  const completionDate = data?.d
    ? new Date(data.d).toLocaleDateString(
        config.language === "en" ? "en-US" : "de-DE",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        },
      )
    : null;

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <MotionProvider>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={
                locale ? localizeHref(config.basePath, locale) : config.basePath
              }
              className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {config.language === "en"
                ? `Back to ${config.title}`
                : `Zurück zum ${config.title}`}
            </Link>

            {/*
            Stable page <h1>, present in every render state (checking / valid /
            invalid). Keeps exactly one h1 on the route at all times.
            The client-side decode used to leave the
            "checking" state with zero headings).
          */}
            <h1 className="sr-only">
              {config.language === "en"
                ? "Verify certificate data"
                : "Zertifikatdaten prüfen"}
            </h1>

            {data && (
              <div className="border-2 border-brand-sand bg-card p-5 text-center sm:p-8">
                <CheckCircle2 className="mx-auto h-12 w-12 text-brand-sand" />
                <p className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-sand">
                  {config.language === "en"
                    ? "QR data read"
                    : "QR-Daten gelesen"}
                </p>
                <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em]">
                  {config.certificateTitle}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {config.certificateSubtitle}
                </p>
                <div className="mx-auto mt-6 h-px w-16 bg-brand-sand" />
                <p className="mt-6 break-words text-lg font-semibold [overflow-wrap:anywhere]">
                  {data.n}
                </p>
                <div className="mt-4 space-y-1 font-mono text-sm text-muted-foreground">
                  <p>
                    {data.m === "quiz"
                      ? config.language === "en"
                        ? `Score: ${data.s}%`
                        : `Ergebnis: ${data.s}%`
                      : COMPLETION_LABEL[config.language][data.m]}
                  </p>
                  {completionDate && (
                    <p>
                      {config.language === "en" ? "Date" : "Datum"}:{" "}
                      {completionDate}
                    </p>
                  )}
                </div>
                <div className="mx-auto mt-6 h-px w-16 bg-border" />
                <p className="mt-4 text-xs text-muted">
                  loehrning.ai | {config.certificateReferenceLabel}
                </p>
                <p className="mt-3 border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
                  {config.language === "en" ? (
                    <>
                      {config.recordNoun.label}, generated locally. The QR data
                      is readable, but not server-verified, not
                      cryptographically signed, and not an official or legally
                      binding credential.
                    </>
                  ) : (
                    <>
                      {config.recordNoun.label}, lokal erzeugt. Die QR-Daten
                      sind lesbar, aber nicht servergeprüft, nicht
                      kryptografisch signiert und keine behördliche oder
                      rechtliche Bescheinigung.
                    </>
                  )}
                </p>
              </div>
            )}

            {invalidReason && (
              <div className="border-2 border-destructive/30 bg-card p-5 text-center sm:p-8">
                <XCircle className="mx-auto h-12 w-12 text-destructive" />
                <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em]">
                  {config.language === "en"
                    ? invalidReason === "course-mismatch"
                      ? "Certificate code doesn't match this course."
                      : "Certificate code unreadable"
                    : invalidReason === "course-mismatch"
                      ? "Zertifikatcode passt nicht zu diesem Kurs."
                      : "Zertifikatcode nicht lesbar"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {config.language === "en"
                    ? invalidReason === "course-mismatch"
                      ? "The link contains readable data, but points to a different course."
                      : "The link doesn't contain readable certificate data, or it's been corrupted."
                    : invalidReason === "course-mismatch"
                      ? "Der Link enthält lesbare Daten, verweist aber auf einen anderen Kurs."
                      : "Der Link enthält keine lesbaren Zertifikatdaten oder wurde beschädigt."}
                </p>
              </div>
            )}

            {!data && !invalidReason && (
              <div className="py-12 text-center">
                <p
                  role="status"
                  aria-live="polite"
                  className="text-muted-foreground"
                >
                  {config.language === "en"
                    ? "Reading certificate data…"
                    : "Zertifikatdaten werden gelesen…"}
                </p>
              </div>
            )}
          </m.div>
        </MotionProvider>
      </div>
    </div>
  );
}
