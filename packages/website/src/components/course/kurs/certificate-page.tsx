"use client";

import { useRef, useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
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
import { getCourseSlice, subscribe } from "@/lib/progress/store";
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
import { trackCourseCompletion } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import { APP_CARD, APP_GHOST } from "@/components/lesson-engine/app-ui";

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
  const [ownerKind, setOwnerKind] =
    useState<LearningOwnerContext["kind"]>("unknown");
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
        courseSlug === "ai-native" && isCapstoneSubmitted(courseSlug);
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
      // Only the course and the step leave the browser; the typed name does not.
      trackCourseCompletion(courseSlug, "record_downloaded");
    } catch {
      if (!attemptIsCurrent()) return;
      setErrors({
        download:
          config.language === "en"
            ? "The PDF could not be generated and nothing was downloaded. Try again in a current browser."
            : "Die PDF konnte nicht erzeugt werden, es wurde nichts heruntergeladen. Versuch es in einem aktuellen Browser erneut.",
      });
    } finally {
      if (downloadAttemptRef.current === attempt) setLoading(false);
    }
  };

  if (!eligible || !completion) {
    return (
      <div className="course-app-ground min-h-[100svh]">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          <Link
            href={localizedCoursePath}
            className={cn(APP_GHOST, "-ml-3 min-h-11")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {config.language === "en" ? "Back to course" : "Zurück zum Kurs"}
          </Link>
          <section className={cn(APP_CARD, "mt-4 p-6 sm:p-8")}>
            <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lab-accent-soft text-lab-accent">
              <GraduationCap className="h-7 w-7" />
            </span>
            <h1 className="mt-4 break-words text-fluid-h2 font-bold tracking-[-0.02em] [overflow-wrap:anywhere]">
              {config.certificateTitle}
            </h1>
            <p
              role="status"
              className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground"
            >
              {ownerKind === "unknown"
                ? config.language === "en"
                  ? "Choose Continue locally above or wait for the account check."
                  : "Wähle oben Lokal weiterlernen oder warte auf die Kontoprüfung."
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
  const previewName = name.trim();

  return (
    <div className="course-app-ground min-h-[100svh]">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <MotionProvider>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <Link
              href={localizedCoursePath}
              className={cn(APP_GHOST, "-ml-3 min-h-11")}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {config.language === "en" ? "Back to course" : "Zurück zum Kurs"}
            </Link>

            {/* Certificate preview: a sheet of paper on a brand-lit frame. */}
            <div className="course-app-hero rounded-[32px] p-2.5 shadow-lab-lg sm:p-3.5">
              <div
                data-certificate-preview
                className="relative overflow-hidden rounded-[24px] border border-lab-line bg-card px-5 py-8 text-center sm:px-10 sm:py-12"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-3 rounded-[18px] border border-dashed border-lab-line"
                />
                <span
                  aria-hidden="true"
                  className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lab-accent text-paper shadow-lab-lg ring-8 ring-lab-accent-soft"
                >
                  <GraduationCap className="h-8 w-8" />
                </span>
                <h1 className="relative mt-5 max-w-full break-words text-fluid-h2 font-bold tracking-[-0.02em] [overflow-wrap:anywhere]">
                  {config.certificateTitle}
                </h1>
                <p className="relative mt-1 text-muted-foreground">
                  {config.certificateSubtitle}
                </p>
                <p
                  aria-hidden="true"
                  className={cn(
                    "relative mx-auto mt-6 max-w-[22ch] break-words border-b-2 border-lab-line pb-2 text-2xl font-semibold [overflow-wrap:anywhere]",
                    previewName ? "text-foreground" : "text-muted",
                  )}
                >
                  {previewName ||
                    (config.language === "en" ? "Your name" : "Dein Name")}
                </p>
                <div className="relative mt-6 flex flex-wrap justify-center gap-2">
                  <span className="inline-flex min-h-8 items-center rounded-full bg-paper px-3 text-sm font-medium text-muted-foreground ring-1 ring-lab-line">
                    {config.language === "en" ? "Completed on" : "Abgeschlossen am"}{" "}
                    {completionDate}
                  </span>
                  <span className="inline-flex min-h-8 items-center rounded-full bg-lab-good-soft px-3 text-sm font-semibold text-lab-good">
                    {completionMode === "quiz"
                      ? config.language === "en"
                        ? `Score: ${Math.round(quizResult.score * 100)}%`
                        : `Ergebnis: ${Math.round(quizResult.score * 100)}%`
                      : PREVIEW_COMPLETION_LABEL[config.language][completionMode]}
                  </span>
                </div>
                <p className="relative mt-6 break-words text-xs text-muted [overflow-wrap:anywhere]">
                  loehrning.ai | {config.certificateReferenceLabel}
                </p>
              </div>
            </div>

            {/* Certificate form */}
            <div className={cn(APP_CARD, "space-y-4 p-5 sm:p-7")}>
              <h2 className="text-xl font-bold tracking-[-0.015em]">
                {config.language === "en" ? "Add your name" : "Name eintragen"}
              </h2>
              <p className="text-[15px] text-muted-foreground">
                {config.language === "en"
                  ? "Your name goes only into the PDF, which your browser creates from your progress."
                  : "Dein Name steht nur in der PDF, die dein Browser aus deinem Lernstand erstellt."}
              </p>

              <form className="space-y-3" onSubmit={handleDownload}>
                <div>
                  <div className="relative">
                    <User
                      aria-hidden="true"
                      className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
                      className={`min-h-12 w-full rounded-full border bg-paper py-3 pl-11 pr-4 text-base text-foreground placeholder:text-muted focus-visible:border-lab-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent ${errors.name ? "border-destructive" : "border-border/70"}`}
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
                  className={cn(
                    "inline-flex min-h-11 w-full max-w-full items-center justify-center gap-2 break-words rounded-full px-6 py-3 text-center text-[15px] font-semibold transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto",
                    !loading
                      ? "bg-lab-accent text-paper shadow-lab-sm hover:bg-[#1f3a99]"
                      : "cursor-not-allowed bg-inset text-muted-foreground",
                  )}
                >
                  {loading ? (
                    <Loader2 aria-hidden="true" className="h-4 w-4" />
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
                  className="inline-flex items-center gap-2 rounded-full bg-lab-good-soft px-4 py-2 text-sm font-semibold text-lab-good"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {config.language === "en"
                    ? `${config.recordNoun.possessive} has been downloaded.`
                    : `${config.recordNoun.possessive} wurde heruntergeladen.`}
                </m.p>
              )}

              <p className="text-xs text-muted">
                {config.language === "en" ? (
                  <>
                    The PDF is not an official or legally binding
                    credential.{" "}
                    {config.recordNoun.demonstrative} is based on your own
                    self-assessment, not an external exam.
                  </>
                ) : (
                  <>
                    Die PDF ist keine behördliche oder rechtliche
                    Bescheinigung.{" "}
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
