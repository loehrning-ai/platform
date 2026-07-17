import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { getModules } from "@/lib/ai-native/data";
import { AiNativeQuizCertCta } from "@/components/ai-native/kurs/quiz-cert-cta";

export const metadata: Metadata = {
  title: "AI-Native Arbeitskurs: Kurs",
  description:
    "4 Module, 27 Lektionen. Komplett kostenlos ohne Anmeldung. Mit Workshop-Quiz, Teilnahmebestätigung und lokal gespeichertem Fortschritt.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://loehrning.ai/ai-native/kurs" },
  openGraph: {
    title: "AI-Native Arbeitskurs: Kursübersicht",
    description:
      "4 Module, 27 Lektionen. Komplett kostenlos ohne Anmeldung. Mit Workshop-Quiz und Teilnahmebestätigung.",
    url: "https://loehrning.ai/ai-native/kurs",
    type: "website",
  },
};

export default function AiNativeCourseIndexPage() {
  const modules = getModules();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      <header className="mb-12">
        <Link
          href="/ai-native"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← loehrning.ai/ai-native
        </Link>
        <h1
          className="mt-4 font-bold tracking-[-0.03em] text-foreground"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
        >
          AI-Native Arbeitskurs: Kurs
        </h1>
        <p className="mt-3 text-muted-foreground">
          4 Module, 27 Lektionen. Selbst-paced, komplett kostenlos im
          Browser. Starte mit Modul 1.
        </p>
      </header>

      <ol className="space-y-4">
        {modules.map((mod) => (
          <li key={mod.id}>
            <Link
              href={`/ai-native/kurs/${mod.id}`}
              className="group block rounded-none border border-border/50 bg-card/30 p-6 transition-colors hover:border-brand-orange/40"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-brand-orange font-mono text-xl font-bold text-white">
                  {mod.number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {mod.title}
                    </h2>
                    <span className="rounded-none bg-brand-sand/15 px-2 py-0.5 text-xs font-medium text-brand-sand">
                      Kostenlos
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mod.subtitle}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                    {mod.description}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {mod.durationMinutes} Min.
                    </span>
                    <span>•</span>
                    <span>{mod.lessonCount} Lektionen</span>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="mt-2 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-orange"
                />
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <AiNativeQuizCertCta />
    </div>
  );
}
