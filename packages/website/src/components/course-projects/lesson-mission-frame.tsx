import { type JSX } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { LessonMissionFrame as LessonMissionFrameData } from "@/lib/course-projects/lesson-mission-binding";

export interface LessonMissionFrameProps {
  readonly frame: LessonMissionFrameData;
  readonly locale: Locale;
}

/** Visible authored-content bridge between the active lesson and its lab. */
export function LessonMissionFrame({
  frame,
  locale,
}: LessonMissionFrameProps): JSX.Element {
  return (
    <article
      data-lesson-mission-id={frame.missionId}
      data-lesson-skill-id={frame.skillId}
      data-lesson-scenario-seed={frame.scenarioSeed}
      className="border-b border-border pb-5"
    >
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-brand-orange-dark">
        {frame.label}
      </p>
      <h3 className="mt-2 text-balance text-lg font-black leading-tight text-foreground">
        {frame.title}
      </h3>
      <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
        {frame.objective}
      </p>
      {frame.keyConcepts.length > 0 ? (
        <ul
          aria-label={locale === "de" ? "Schlüsselkonzepte" : "Key concepts"}
          className="mt-3 flex min-w-0 flex-wrap gap-2"
        >
          {frame.keyConcepts.map((concept) => (
            <li
              key={concept}
              className="max-w-full break-words border border-border bg-background px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-foreground"
            >
              {concept}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 border-l-4 border-brand-orange pl-3 text-xs font-semibold leading-relaxed text-foreground">
        {frame.bridge}
      </p>
    </article>
  );
}
