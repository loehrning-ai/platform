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

/* TimAnchor — editorial "Der Kurator" section. */

const TIMELINE: readonly (readonly [string, string])[] = [
  ["2022", "M.Sc. Informatik · FAU Erlangen-Nürnberg"],
  ["2021-2025", "Datenrollen in internationalen Produkt- und Infrastrukturteams"],
  ["2025-2026", "Dateninfrastruktur und Analytics in einem globalen Technologieumfeld"],
  ["2026-heute", "loehrning.ai · freie Kurse, Demos und Arbeitsnotizen zu KI-nativer Arbeit"],
];

export function AiNativeTimAnchor() {
  return (
    <SectionShell num="IX" label="Der Kurator">
      <div className="max-w-[720px]">
        <div>
          <Eyebrow>Wer das macht</Eyebrow>
          <ClipHeading
            as="h2"
            className="mt-2.5 font-bold leading-none tracking-[-0.035em]"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            Tim Löhr.
            <br />
            Kein Guru. Ingenieur.
          </ClipHeading>
          <FadeBlock delay={1}>
            <p className="mt-6 max-w-[560px] text-[17px] leading-[1.65] text-foreground">
              M.Sc. Informatik (FAU Erlangen-Nürnberg). Technischer Hintergrund
              in Dateninfrastruktur, Analytics und automatisierter Auswertung.
              Kein LinkedIn-Trainer, sondern jemand, der KI-Werkzeuge täglich
              als Arbeitsumgebung nutzt.
            </p>
          </FadeBlock>
          <FadeBlock delay={2}>
            <p className="mt-5 max-w-[560px] text-[16px] leading-[1.6] text-muted-foreground">
              loehrning.ai sammelt hier öffentliche Materialien zu KI-nativer
              Arbeit. Dieser Arbeitskurs verdichtet die Arbeitsweise in Übungen,
              Demos und Capstone-Projekten.
            </p>
          </FadeBlock>
          <FadeBlock delay={3}>
            <ol className="mt-9 grid max-w-[520px] gap-4">
              {TIMELINE.map(([year, text]) => (
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
