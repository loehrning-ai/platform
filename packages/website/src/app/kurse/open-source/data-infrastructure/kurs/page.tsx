import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllDataInfraLessons } from "@/lib/data-infrastructure/data";
import { DATA_INFRA_TRACKS } from "@/lib/data-infrastructure/types";
import { SITE_URL } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Data Infrastructure: Lessons",
  description:
    "Twelve lessons on data infrastructure at IC5/staff system-design depth, across four tracks: Foundations, Storage, Movement, At Scale.",
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/kurse/open-source/data-infrastructure/kurs` },
};

export default async function DataInfrastructureKursIndexPage() {
  const lessons = await getAllDataInfraLessons();

  return (
    <div className="mx-auto max-w-[900px] px-6 py-16">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">the course</p>
      <h1 className="mt-3 text-[36px] font-bold tracking-[-0.03em] text-foreground md:text-[44px]">
        Four tracks. Twelve lessons.
      </h1>
      <p className="mt-3 max-w-[600px] text-[16px] leading-[1.5] text-muted-foreground">
        Storage internals, streaming semantics, lakehouse formats, and the operational craft, built around
        interactive simulators of every concept that's usually drawn on a whiteboard.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {DATA_INFRA_TRACKS.map((track, trackIndex) => {
          const trackLessons = lessons.filter((l) => l.trackId === track.id);
          return (
            <section key={track.id}>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                track 0{trackIndex + 1}
              </p>
              <h2 className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-foreground">{track.title}</h2>
              <p className="mt-1 text-[14px] text-muted-foreground">{track.hint}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {trackLessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={`/kurse/open-source/data-infrastructure/kurs/${lesson.id}`}
                      className="group flex h-full flex-col justify-between border-2 border-border bg-card p-4 transition-colors hover:border-brand-orange"
                    >
                      <div>
                        <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-orange">
                          lesson {String(lesson.number).padStart(2, "0")}
                        </p>
                        <h3 className="mt-1 text-[16px] font-semibold text-foreground">{lesson.title}</h3>
                        <p className="mt-1 text-[13px] leading-[1.4] text-muted-foreground">{lesson.hook}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                        <span>{lesson.durationMinutes} min read</span>
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
