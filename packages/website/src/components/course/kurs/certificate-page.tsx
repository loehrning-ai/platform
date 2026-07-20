"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { ArrowLeft, Download, GraduationCap, Loader2, User } from "lucide-react";
import {
  isCertificateEligible,
  isCapstoneSubmitted,
  getWorkshopQuizResult,
} from "@/lib/course/progress";
// JSON-free config module (performance hardening): importing from ./data here
// would pull the full lesson/quiz JSON graph into this client bundle.
import { getCourseConfig } from "@/lib/course/config";
import { certificateFormSchema } from "@/lib/course/validation";
import type { CertificateCompletionMode } from "@/lib/course/certificate-constants";
import type { CourseSlug } from "@/lib/course/types";

/**
 * Shared certificate screen for every free course (shared course architecture,
 *). The route pages pass a `courseSlug`; all course-specific
 * copy (title, reference label, file stem) comes from `CourseConfig`.
 */

interface CertificatePageProps {
  readonly courseSlug: CourseSlug;
}

/** Downloaded-file completion line for the two non-quiz eligibility paths. */
const TEXT_FALLBACK_COMPLETION_LABEL: Record<
  Exclude<CertificateCompletionMode, "quiz">,
  string
> = {
  capstone: "Abschluss: Capstone-Rubrik vollständig",
  completion: "Abschluss: Alle Lektionen abgeschlossen",
};

/** On-screen preview completion line for the two non-quiz eligibility paths. */
const PREVIEW_COMPLETION_LABEL: Record<
  Exclude<CertificateCompletionMode, "quiz">,
  string
> = {
  capstone: "Abschlussweg: Capstone-Rubrik",
  completion: "Abschlussweg: Alle Lektionen abgeschlossen",
};

export function CertificatePage({ courseSlug }: CertificatePageProps) {
  const config = getCourseConfig(courseSlug);
  const router = useRouter();
  const [eligible, setEligible] = useState(false);
  const [name, setName] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Derived from localStorage / the client clock — must not run during render
  // (hydration hazard), so it lives in state populated by the effect below.
  const [completion, setCompletion] = useState<{
    quizResult: { passed: boolean; score: number; completedAt: string | null };
    completionMode: CertificateCompletionMode;
    completionDate: string;
  } | null>(null);

  useEffect(() => {
    // Eligible via one of three paths: workshop quiz passed, (AI-Native) the
    // capstone rubric submitted, or every catalog lesson completed (plan 007
    // stage 4's generic "completion" fallback).
    const ok = isCertificateEligible(courseSlug);
    setEligible(ok);
    if (!ok) {
      router.push(config.coursePath);
      return;
    }

    const quizResult = getWorkshopQuizResult(courseSlug);
    const completionMode: CertificateCompletionMode = quizResult.passed
      ? "quiz"
      : isCapstoneSubmitted(courseSlug)
        ? "capstone"
        : "completion";
    const completionDate = new Date(
      quizResult.completedAt ?? Date.now(),
    ).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    setCompletion({ quizResult, completionMode, completionDate });
  }, [router, courseSlug, config.coursePath]);

  const handleDownload = async () => {
    if (!completion) return;
    const { quizResult, completionMode, completionDate } = completion;
    // Validate with Zod
    const result = certificateFormSchema.safeParse({ name });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const fileBase = `${config.certificateFileStem}-${name.trim().replace(/\s+/g, "-")}`;

    setLoading(true);
    try {
      // Dynamic import to keep jsPDF out of the main bundle
      const { generateCertificatePdf } = await import("@/lib/pdf/certificate-pdf");
      const blob = await generateCertificatePdf(
        {
          name: name.trim(),
          score: completionMode === "quiz" ? quizResult.score : null,
          completionMode,
          completionDate,
          completedAt: quizResult.completedAt ?? new Date().toISOString(),
        },
        config,
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase}.pdf`;
      a.click();
      // Defer revocation: revoking synchronously after click() can race the
      // download in Firefox and cancel it.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloaded(true);
    } catch {
      // Fallback to text certificate if PDF generation fails
      const certText = [
        `${config.certificateTitle.toUpperCase()}: ${config.certificateSubtitle}`,
        "",
        `Name: ${name.trim()}`,
        `Datum: ${completionDate}`,
        completionMode === "quiz"
          ? `Ergebnis: ${Math.round(quizResult.score * 100)}% (bestanden)`
          : TEXT_FALLBACK_COMPLETION_LABEL[completionMode],
        "",
        "loehrning.ai | Tim Löhr",
      ].join("\n");
      const blob = new Blob([certText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase}.txt`;
      a.click();
      // Defer revocation: revoking synchronously after click() can race the
      // download in Firefox and cancel it.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloaded(true);
    } finally {
      setLoading(false);
    }
  };

  if (!eligible || !completion) return null;
  const { quizResult, completionMode, completionDate } = completion;

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <Link
            href={config.coursePath}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Kurs
          </Link>

          {/* Certificate Preview */}
          <div className="border-2 border-brand-orange bg-card p-8 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-brand-orange" />
            <h1 className="mt-4 text-3xl font-bold tracking-[-0.03em]">
              {config.certificateTitle}
            </h1>
            <p className="mt-1 text-muted-foreground">{config.certificateSubtitle}</p>
            <div className="mx-auto mt-6 h-px w-20 bg-brand-orange" />
            <p className="mt-6 font-mono text-sm text-muted-foreground">
              Abgeschlossen am {completionDate}
            </p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {completionMode === "quiz"
                ? `Ergebnis: ${Math.round(quizResult.score * 100)}%`
                : PREVIEW_COMPLETION_LABEL[completionMode]}
            </p>
            <div className="mx-auto mt-6 h-px w-20 bg-border" />
            <p className="mt-4 text-xs text-muted">
              loehrning.ai | {config.certificateReferenceLabel}
            </p>
          </div>

          {/* Certificate form */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{config.recordNoun.label} herunterladen</h2>
            <p className="text-sm text-muted-foreground">
              Trag deinen Namen ein. Die PDF wird lokal in deinem Browser aus
              deinem Lernstand erstellt, sie wird nicht serverseitig ausgestellt.
            </p>

            <div className="space-y-3">
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    aria-label="Vor- und Nachname"
                    placeholder="Vor- und Nachname"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((prev) => { const { name: _, ...rest } = prev; return rest; }); }}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "error-name" : undefined}
                    className={`w-full border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${errors.name ? "border-destructive" : "border-border"}`}
                  />
                </div>
                {errors.name && <p id="error-name" className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              aria-busy={loading}
              className={`inline-flex items-center gap-2 border-2 border-foreground px-7 py-3.5 text-sm font-bold uppercase tracking-wide shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] ${
                !loading
                  ? "bg-brand-orange text-white hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                  : "cursor-not-allowed bg-border text-muted-foreground shadow-none"
              }`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {loading ? "Wird generiert…" : `${config.recordNoun.label} herunterladen`}
            </button>

            {downloaded && (
              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-brand-sand"
              >
                {config.recordNoun.possessive} wurde heruntergeladen.
              </m.p>
            )}

            <p className="text-xs text-muted">
              Der Name wird nur in die heruntergeladene Datei geschrieben. Der
              Kursfortschritt bleibt lokal im Browser gespeichert; die PDF ist keine
              behördliche oder rechtliche Bescheinigung. {config.recordNoun.demonstrative} basiert
              auf deiner eigenen Einschätzung, nicht auf einer externen Prüfung.
            </p>
          </div>
        </m.div>
      </div>
    </div>
  );
}
