import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import {
  ClipHeading,
  VoiceAnchor,
  TierChip,
} from "@/components/ai-native/primitives";
import { getModule, getModuleLessons } from "@/lib/ai-native/data";
import { MODULE_IDS, type ModuleId } from "@/lib/ai-native/types";
import { SITE_URL } from "@/lib/seo/json-ld";

interface PageProps {
  params: Promise<{ moduleId: string }>;
}

export async function generateStaticParams() {
  return MODULE_IDS.map((moduleId) => ({ moduleId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleId } = await params;
  const mod = getModule(moduleId as ModuleId);
  if (!mod) return { title: "Modul nicht gefunden" };
  const moduleUrl = `${SITE_URL}/ai-native/kurs/${moduleId}`;
  return {
    title: `${mod.title}: AI-Native Arbeitskurs`,
    description: mod.description,
    robots: { index: false, follow: true },
    alternates: { canonical: moduleUrl },
    openGraph: {
      title: `${mod.title}: AI-Native Arbeitskurs`,
      description: mod.description,
      url: moduleUrl,
      type: "article",
    },
  };
}

export default async function AiNativeModulePage({ params }: PageProps) {
  const { moduleId } = await params;
  const mod = getModule(moduleId as ModuleId);
  if (!mod) notFound();

  const lessons = await getModuleLessons(moduleId as ModuleId);
  const allModules = MODULE_IDS;
  const idx = allModules.indexOf(moduleId as ModuleId);
  const prev = idx > 0 ? getModule(allModules[idx - 1]) : null;
  const next = idx < allModules.length - 1 ? getModule(allModules[idx + 1]) : null;

  return (
    <>
      {/* Dark dot-grid hero */}
      <section className="dark-section bg-[var(--color-dark-bg)] bg-dot-pattern-dark py-14 md:py-20">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <nav
            aria-label="Breadcrumb"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-dark-muted)]"
          >
            <Link
              href="/ai-native"
              className="transition-colors hover:text-brand-orange"
            >
              Kurs
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-brand-orange">Modul {mod.number}</span>
          </nav>

          <div className="mt-8 flex flex-wrap items-baseline gap-6">
            <span
              className="font-mono font-bold leading-[0.85] tracking-[-0.04em] text-brand-orange"
              style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)" }}
            >
              {mod.number}
            </span>
            <div className="min-w-[260px] flex-1">
              <div className="mb-2.5 flex flex-wrap items-center gap-3.5">
                <TierChip tier="FREE" />
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-dark-muted)]">
                  {mod.subtitle} · {lessons.length} Lektionen · {mod.durationMinutes}{" "}
                  Min.
                </span>
              </div>
              <ClipHeading
                as="h1"
                className="font-bold leading-[0.92] tracking-[-0.04em] text-[var(--color-dark-fg)]"
                style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
              >
                {mod.title}.
              </ClipHeading>
            </div>
          </div>

          {mod.voiceAnchor && (
            <div className="mt-12">
              <VoiceAnchor
                author={`Voice-Anchor · Modul ${mod.number}`}
                className="text-[var(--color-dark-fg)]"
              >
                {mod.voiceAnchor}
              </VoiceAnchor>
            </div>
          )}

          <p className="mt-10 max-w-[640px] text-[17px] leading-[1.65] text-[var(--color-dark-muted)]">
            {mod.description}
          </p>
        </div>
      </section>

      {/* Lesson list */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <div className="flex flex-wrap items-baseline justify-between gap-5">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange">
                Inhalt
              </p>
              <h2 className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}>
                Lektionen
              </h2>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {lessons.length} Einträge
            </span>
          </div>

          <ol className="mt-8 border-t border-foreground">
            {lessons.map((lesson) => {
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/ai-native/kurs/${mod.id}/${lesson.id}`}
                    className="grid grid-cols-[48px_1fr_auto] items-center gap-5 border-b border-border px-5 py-4 transition-colors hover:bg-card/40"
                  >
                    <span className="font-mono text-[12px] tracking-[0.05em] text-muted-foreground">
                      {lesson.number}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">
                          {lesson.title}
                        </h3>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                          · frei
                        </span>
                      </div>
                      <p className="mt-1 text-[13.5px] text-muted-foreground">
                        {lesson.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <span className="font-mono text-[12px] tracking-[0.05em] text-muted-foreground">
                        <Clock size={11} className="mr-1 inline" />
                        {lesson.durationMinutes} min
                      </span>
                      <ArrowRight size={14} className="text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>

          {/* Prev / Next module navigation */}
          <div className="mt-16 grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/ai-native/kurs/${prev.id}`}
                className="group block"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  ← Vorher
                </p>
                <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-brand-orange">
                  Modul {prev.number}: {prev.title}
                </p>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/ai-native/kurs/${next.id}`}
                className="group block text-right"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-orange">
                  Nächstes →
                </p>
                <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-brand-orange">
                  Modul {next.number}: {next.title}
                </p>
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
