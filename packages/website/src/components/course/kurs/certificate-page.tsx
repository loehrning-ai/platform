"use client";

import { useRef, useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import {
  ArrowLeft,
  Download,
  GraduationCap,
  Loader2,
  User,
} from "lucide-react";
import {
  isCertificateEligible,
  isCapstoneSubmitted,
  getWorkshopQuizResult,
} from "@/lib/course/progress";
import {
  getCourseSlice,
  subscribe,
} from "@/lib/progress/store";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
  type LearningOwnerContext,
} from "@/lib/progress/browser-learning-storage";
// JSON-free config module (performance hardening): importing from ./data here
// would pull the full lesson/quiz JSON graph into this client bundle.
import { getCourseConfig } from "@/lib/course/config";
import { certificateFormSchema } from "@/lib/course/validation";
import type { CertificateCompletionMode } from "@/lib/course/certificate-constants";
import type { CourseSlug } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import { MotionProvider } from "@/components/motion-provider";

/**
 * Shared certificate screen for every free course (shared course architecture,
 *). The route pages pass a `courseSlug`; all course-specific
 * copy (title, reference label, file stem) comes from `CourseConfig`.
 */

interface CertificatePageProps {
  readonly courseSlug: CourseSlug;
  readonly locale?: Locale;
}

type NonQuizMode = Exclude<CertificateCompletionMode, "quiz">;

/** On-screen preview completion line for the two non-quiz eligibility paths. */
const PREVIEW_COMPLETION_LABEL: Record<
  "de" | "en",
  Record<NonQuizMode, string>
> = {
  de: {
    capstone: "Abschlussweg: Capstone-Rubrik",
    completion: "Abschlussweg: Alle Lektionen abgeschlossen",
  },
  en: {
    capstone: "Completion path: capstone rubric",
    completion: "Completion path: all lessons finished",
  },
};

export function CertificatePage({ courseSlug, locale }: CertificatePageProps) {
  const config = getCourseConfig(courseSlug, locale);
  const localizedCoursePath = locale
    ? localizeHref(config.coursePath, locale)
    : config.coursePath;
  const router = useRouter();
  const [eligible, setEligible] = useState(false);
  const [name, setName] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ownerKind, setOwnerKind] = useState<LearningOwnerContext["kind"]>(
    "unknown",
  );
  const nameInputRef = useRef<HTMLInputElement>(null);
  const downloadAttemptRef = useRef(0);
  // Derived from localStorage / the client clock — must not run during render
  // (hydration hazard), so it lives in state populated by the effect below.
  const [completion, setCompletion] = useState<{
    quizResult: { passed: boolean; score: number; completedAt: string | null };
    completionMode: CertificateCompletionMode;
    completionDate: string;
    completedAt: string;
  } | null>(null);

  useEffect(() => {
    return subscribe(() => {
      if (getLearningOwnerContext().kind === "unknown") {
        downloadAttemptRef.current += 1;
        setEligible(false);
        setCompletion(null);
        setLoading(false);
        return;
      }
      // Eligibility is canonical across account, companion and certificate:
      // every lesson, plus the configured quiz or AI-Native capstone when one
      // exists.
      const ok = isCertificateEligible(courseSlug);
      setEligible(ok);
      if (!ok) {
        downloadAttemptRef.current += 1;
        setCompletion(null);
        setLoading(false);
        router.push(localizedCoursePath);
        return;
      }

      const quizResult = getWorkshopQuizResult(courseSlug);
      const aiNativeCapstonePath =
        courseSlug === "ai-native" &&
        isCapstoneSubmitted(courseSlug);
      const completionMode: CertificateCompletionMode = quizResult.passed
        ? "quiz"
        : aiNativeCapstonePath
          ? "capstone"
          : "completion";
      const completedAt =
        quizResult.completedAt ?? getCourseSlice(courseSlug).lastActivity;
      const completionDate = new Date(completedAt).toLocaleDateString(
        config.language === "en" ? "en-US" : "de-DE",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        },
      );
      setCompletion({
        quizResult,
        completionMode,
        completionDate,
        completedAt,
      });
    });
  }, [router, courseSlug, config.language, localizedCoursePath]);

  useEffect(() => {
    setOwnerKind(getLearningOwnerContext().kind);
    const unsubscribe = subscribeLearningOwner((owner) => {
      downloadAttemptRef.current += 1;
      setOwnerKind(owner.kind);
      setCompletion(null);
      setEligible(false);
      setName("");
      setDownloaded(false);
      setLoading(false);
      setErrors({});
    });
    return () => {
      downloadAttemptRef.current += 1;
      unsubscribe();
    };
  }, []);

  const handleDownload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ownerAtStart = getLearningOwnerContext();
    if (!completion || ownerAtStart.kind === "unknown") return;
    const ownerGeneration = ownerAtStart.generation;
    const attempt = downloadAttemptRef.current + 1;
    downloadAttemptRef.current = attempt;
    const attemptIsCurrent = () => {
      const owner = getLearningOwnerContext();
      return (
        downloadAttemptRef.current === attempt &&
        owner.kind !== "unknown" &&
        owner.generation === ownerGeneration
      );
    };
    const { quizResult, completionMode, completionDate, completedAt } =
      completion;
    // Validate with Zod
    const result = certificateFormSchema.safeParse({ name });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] =
            config.language === "en"
              ? issue.code === "too_big"
                ? "The name must be 100 characters or fewer."
                : "Enter your full name."
              : issue.message;
        }
      }
      setErrors(fieldErrors);
      nameInputRef.current?.focus();
      return;
    }
    setErrors({});

    const fileBase = `${config.certificateFileStem}-${name.trim().replace(/\s+/g, "-")}`;

    setLoading(true);
    try {
      // Dynamic import to keep jsPDF out of the main bundle
      const { generateCertificatePdf } =
        await import("@/lib/pdf/certificate-pdf");
      if (!attemptIsCurrent()) return;
      const blob = await generateCertificatePdf(
        {
          name: name.trim(),
          score: completionMode === "quiz" ? quizResult.score : null,
          completionMode,
          completionDate,
          completedAt,
        },
        config,
      );
      if (!attemptIsCurrent()) return;

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
      if (!attemptIsCurrent()) return;
      setErrors({
        download:
          config.language === "en"
            ? "The PDF could not be generated. No certificate was downloaded. Retry in a current browser."
            : "Die PDF konnte nicht erzeugt werden. Es wurde keine Bescheinigung heruntergeladen. Versuche es erneut in einem aktuellen Browser.",
      });
    } finally {
      if (downloadAttemptRef.current === attempt) setLoading(false);
    }
  };

  if (!eligible || !completion) {
    return (
      <div className="min-h-[100svh] bg-background">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            href={localizedCoursePath}
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {config.language === "en" ? "Back to course" : "Zurück zum Kurs"}
          </Link>
          <section className="mt-5 border-2 border-brand-orange bg-card p-5 sm:p-7">
            <GraduationCap
              className="h-10 w-10 text-brand-orange"
              aria-hidden="true"
            />
            <h1 className="mt-3 break-words text-3xl font-bold tracking-[-0.03em] [overflow-wrap:anywhere]">
              {config.certificateTitle}
            </h1>
            <p
              role="status"
              className="mt-3 max-w-[58ch] text-sm leading-relaxed text-muted-foreground"
            >
              {ownerKind === "unknown"
                ? config.language === "en"
                  ? "Choose Continue locally above or wait for account verification to load your completion record."
                  : "Wähle oben Lokal weiterlernen oder warte auf die Kontoprüfung, um deinen Abschlussstand zu laden."
                : config.language === "en"
                  ? "Checking the completion record."
                  : "Abschlussstand wird geprüft."}
            </p>
          </section>
        </div>
      </div>
    );
  }
  const { quizResult, completionMode, completionDate } = completion;

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <MotionProvider>
          <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <Link
            href={localizedCoursePath}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {config.language === "en" ? "Back to course" : "Zurück zum Kurs"}
          </Link>

          {/* Certificate Preview */}
          <div className="border-2 border-brand-orange bg-card p-5 text-center sm:p-8">
            <GraduationCap className="mx-auto h-12 w-12 text-brand-orange" />
            <h1 className="mt-4 max-w-full break-words text-3xl font-bold tracking-[-0.03em] [overflow-wrap:anywhere]">
              {config.certificateTitle}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {config.certificateSubtitle}
            </p>
            <div className="mx-auto mt-6 h-px w-20 bg-brand-orange" />
            <p className="mt-6 font-mono text-sm text-muted-foreground">
              {config.language === "en" ? "Completed on" : "Abgeschlossen am"}{" "}
              {completionDate}
            </p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {completionMode === "quiz"
                ? config.language === "en"
                  ? `Score: ${Math.round(quizResult.score * 100)}%`
                  : `Ergebnis: ${Math.round(quizResult.score * 100)}%`
                : PREVIEW_COMPLETION_LABEL[config.language][completionMode]}
            </p>
            <div className="mx-auto mt-6 h-px w-20 bg-border" />
            <p className="mt-4 break-words text-xs text-muted [overflow-wrap:anywhere]">
              loehrning.ai | {config.certificateReferenceLabel}
            </p>
          </div>

          {/* Certificate form */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {config.language === "en"
                ? `Download ${config.recordNoun.label}`
                : `${config.recordNoun.label} herunterladen`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {config.language === "en"
                ? "Enter your name. The PDF is generated locally in your browser from your progress, it isn't issued server-side."
                : "Trag deinen Namen ein. Die PDF wird lokal in deinem Browser aus deinem Lernstand erstellt, sie wird nicht serverseitig ausgestellt."}
            </p>

            <form className="space-y-3" onSubmit={handleDownload}>
              <div>
                <div className="relative">
                  <User
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    ref={nameInputRef}
                    type="text"
                    name="name"
                    autoComplete="name"
                    aria-label={
                      config.language === "en"
                        ? "Full name"
                        : "Vor- und Nachname"
                    }
                    placeholder={
                      config.language === "en"
                        ? "Full name"
                        : "Vor- und Nachname"
                    }
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((prev) => {
                        const { name: _, ...rest } = prev;
                        return rest;
                      });
                    }}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "error-name" : undefined}
                    className={`w-full border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${errors.name ? "border-destructive" : "border-border"}`}
                  />
                </div>
                {errors.name && (
                  <p
                    id="error-name"
                    role="alert"
                    className="mt-1 text-xs text-destructive"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className={`inline-flex max-w-full items-center gap-2 break-words border-2 border-foreground px-5 py-3.5 text-left text-sm font-bold uppercase tracking-wide shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] sm:px-7 ${
                  !loading
                    ? "bg-brand-orange text-white hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                    : "cursor-not-allowed bg-border text-muted-foreground shadow-none"
                }`}
              >
                {loading ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <Download aria-hidden="true" className="h-4 w-4" />
                )}
                {loading
                  ? config.language === "en"
                    ? "Generating…"
                    : "Wird generiert…"
                  : config.language === "en"
                    ? `Download ${config.recordNoun.label}`
                    : `${config.recordNoun.label} herunterladen`}
              </button>
            </form>

            {errors.download && (
              <p role="alert" className="text-sm text-destructive">
                {errors.download}
              </p>
            )}

            {downloaded && (
              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-brand-sand"
              >
                {config.language === "en"
                  ? `${config.recordNoun.possessive} has been downloaded.`
                  : `${config.recordNoun.possessive} wurde heruntergeladen.`}
              </m.p>
            )}

            <p className="text-xs text-muted">
              {config.language === "en" ? (
                <>
                  The name is only written into the downloaded file. Your course
                  progress stays local in the browser; the PDF is not an
                  official or legally binding credential.{" "}
                  {config.recordNoun.demonstrative} is based on your own
                  self-assessment, not an external exam.
                </>
              ) : (
                <>
                  Der Name wird nur in die heruntergeladene Datei geschrieben.
                  Der Kursfortschritt bleibt lokal im Browser gespeichert; die
                  PDF ist keine behördliche oder rechtliche Bescheinigung.{" "}
                  {config.recordNoun.demonstrative} basiert auf deiner eigenen
                  Einschätzung, nicht auf einer externen Prüfung.
                </>
              )}
            </p>
          </div>
          </m.div>
        </MotionProvider>
      </div>
    </div>
  );
}
