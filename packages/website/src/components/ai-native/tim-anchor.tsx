// No "use client": zero hooks/interactivity here — this component only
// forwards serializable props/children to the (client) primitives below.
// Server Components can render Client Components directly, so this stays a
// Server Component (performance hardening: keeps it out of the client JS
// bundle for the server-rendered ai-native page).
import {
  SectionShell,
  ClipHeading,
  Eyebrow,
  FadeBlock,
} from "@/components/ai-native/primitives";
import type { Locale } from "@/lib/i18n/locale";

/* TimAnchor — editorial "Der Kurator" section. */

const TIMELINE: readonly (readonly [string, string])[] = [
  ["2022", "M.Sc. Informatik · FAU Erlangen-Nürnberg"],
  ["2021-2025", "Datenrollen in internationalen Produkt- und Infrastrukturteams"],
  ["2025-2026", "Dateninfrastruktur und Analytics in einem globalen Technologieumfeld"],
  ["2026-heute", "loehrning.ai · freie Kurse, Simulationen und Arbeitsnotizen zu KI-gestützter Arbeit"],
];

const TIMELINE_EN: readonly (readonly [string, string])[] = [
  ["2022", "MSc Computer Science · FAU Erlangen-Nürnberg"],
  ["2021-2025", "Data roles in international product and infrastructure teams"],
  ["2025-2026", "Data infrastructure and analytics in a global technology environment"],
  ["2026-present", "loehrning.ai · open courses, simulations and working notes"],
];

export function AiNativeTimAnchor({ locale = "de" }: { readonly locale?: Locale }) {
  const isEnglish = locale === "en";
  const timeline = isEnglish ? TIMELINE_EN : TIMELINE;
  return (
    <SectionShell num="IX" label={isEnglish ? "Course editor" : "Kursredaktion"}>
      <div className="max-w-[720px]">
        <div>
          <Eyebrow>{isEnglish ? "Course editor" : "Verantwortlich für den Kurs"}</Eyebrow>
          <ClipHeading
            as="h2"
            className="mt-2.5 font-bold leading-none tracking-[-0.035em]"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            Tim Löhr.
            <br />
            {isEnglish ? "Computer scientist and course editor." : "Informatiker und Kursredakteur."}
          </ClipHeading>
          <FadeBlock delay={1}>
            <p className="mt-6 max-w-[560px] text-[17px] leading-[1.65] text-foreground">
              {isEnglish
                ? "MSc Computer Science from FAU Erlangen-Nürnberg, with a technical background in data infrastructure, analytics and automated analysis."
                : "M.Sc. Informatik an der FAU Erlangen-Nürnberg, mit technischem Hintergrund in Dateninfrastruktur, Analytics und automatisierter Auswertung."}
            </p>
          </FadeBlock>
          <FadeBlock delay={2}>
            <p className="mt-5 max-w-[560px] text-[16px] leading-[1.6] text-muted-foreground">
              {isEnglish
                ? "loehrning.ai publishes open material on AI-supported work. This course turns that material into lessons, local simulations and a bounded capstone."
                : "loehrning.ai veröffentlicht freie Materialien zu KI-gestützter Arbeit. Dieser Kurs strukturiert sie als Lektionen, lokale Simulationen und einen begrenzten Capstone."}
            </p>
          </FadeBlock>
          <FadeBlock delay={3}>
            <ol className="mt-9 grid max-w-[520px] gap-4">
              {timeline.map(([year, text]) => (
                <li
                  key={year}
                  className="grid grid-cols-[64px_1fr] items-baseline gap-4 border-b border-dashed border-border pb-3.5"
                >
                  <span className="font-mono text-[12.5px] font-bold tracking-[0.04em] text-brand-orange">
                    {year}
                  </span>
                  <span className="text-[14.5px] text-foreground">{text}</span>
                </li>
              ))}
            </ol>
          </FadeBlock>
        </div>

      </div>
    </SectionShell>
  );
}
