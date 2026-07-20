"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Award, GraduationCap, Trophy } from "lucide-react";
import {
  isWorkshopQuizPassed,
  isCertificateEligible,
} from "@/lib/progress";
import { EASE_OUT_EXPO } from "@/lib/animations";

/**
 * AI-Native quiz + certificate CTA (shared course architecture).
 *
 * Mirrors the arc of the two free courses: once you have worked through the
 * course, take the Workshop-Quiz, then download a local participation PDF.
 * The PDF is reachable via the quiz OR the capstone rubric completion gate.
 *
 * Client-only: progress lives in localStorage, so the dynamic state hydrates
 * after mount. Server render shows the neutral "start the quiz" state.
 */
export function AiNativeQuizCertCta() {
  const [mounted, setMounted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    setMounted(true);
    setQuizPassed(isWorkshopQuizPassed("ai-native"));
    setEligible(isCertificateEligible("ai-native"));
  }, []);

  const showCert = mounted && eligible;

  return (
    <m.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className="mt-12 border-2 border-foreground bg-card/40 p-6 shadow-[4px_4px_0_0_var(--color-foreground)] md:p-8"
      aria-labelledby="an-quiz-cert-heading"
    >
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        <Award size={12} className="mr-1.5 inline" />
        Abschluss
      </p>
      <h2
        id="an-quiz-cert-heading"
        className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-foreground"
      >
        Workshop-Quiz und Teilnahmebestätigung
      </h2>
      <p className="mt-2 max-w-[640px] text-[14.5px] leading-[1.55] text-muted-foreground">
        {showCert
          ? quizPassed
            ? "Bestanden. Lade jetzt deine personalisierte Teilnahmebestätigung herunter. Der QR-Code macht die lokalen Angaben lesbar, aber nicht servergeprüft."
            : "Capstone-Rubrik vollständig markiert. Du kannst jetzt deine personalisierte Teilnahmebestätigung herunterladen. Der QR-Code macht die lokalen Angaben lesbar, aber nicht servergeprüft."
          : "20 Fragen aus allen vier Modulen. 70% zum Bestehen, 25 Minuten Zeit. Danach gibt es eine lokale Teilnahmebestätigung. Alternativ schaltet auch eine vollständig markierte Capstone-Rubrik die PDF frei."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href="/ai-native/kurs/quiz"
          className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
        >
          <Trophy className="h-4 w-4" />
          {quizPassed ? "Quiz wiederholen" : "Workshop-Quiz starten"}
        </Link>

        {showCert && (
          <Link
            href="/ai-native/kurs/zertifikat"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-card px-5 py-3 text-sm font-bold uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
          >
            <GraduationCap className="h-4 w-4" />
            Teilnahmebestätigung herunterladen
          </Link>
        )}
      </div>
    </m.section>
  );
}
