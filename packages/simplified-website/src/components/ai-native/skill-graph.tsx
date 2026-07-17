// No "use client": zero hooks/interactivity here — this component only
// forwards serializable props/children to (client) primitives. Stays a
// Server Component (performance hardening: keeps it out of the client bundle).
import {
  SectionShell,
  ClipHeading,
  Eyebrow,
  FadeBlock,
  CountUp,
} from "@/components/ai-native/primitives";

/* SkillGraph — editorial column spread showing how the 4 modules connect.
 * No graph, no complex animation — just 4 articles with clear hierarchy. */

interface Column {
  readonly n: string;
  readonly tag: string;
  readonly title: string;
  readonly hook: string;
  readonly body: string;
  readonly skills: readonly string[];
  readonly meta: string;
}

const COLUMNS: readonly Column[] = [
  {
    n: "01",
    tag: "Fundament",
    title: "Prompt-Architektur",
    hook: "Wie man mit Sprachmodellen redet.",
    body: "Rolle, Kontext, Format, Constraints. Wann man Beispiele gibt, wann man es lässt. Wie man Kontext-Fenster denkt, nicht als Box, sondern als knappes Budget.",
    skills: ["Prompt-Craft", "Kontext-Budget", "Fehler-Modi"],
    meta: "6 Lektionen · 2h",
  },
  {
    n: "02",
    tag: "Werkzeuge",
    title: "Tool-Orchestrierung",
    hook: "Claude hat drei Oberflächen. Modul zwei zeigt alle.",
    body: "Chat für Dialog. Artifacts für Dokumente, die neben dem Gespräch entstehen. Claude Code für Dateien und Daten. Welches Werkzeug wann, und warum sich das nicht ausschließt.",
    skills: ["Artifacts", "Sub-Agents", "Claude Code"],
    meta: "7 Lektionen · 2.5h",
  },
  {
    n: "03",
    tag: "Praxis",
    title: "Workflow-Integration",
    hook: "Assistants in Prozesse einbauen: so, dass sie bleiben.",
    body: "MCP-Server, die Claude mit deinen Tools verbinden. Eval-Loops, die Qualität messbar machen. Governance, die nicht erstickt. Was passiert, wenn ein Team das täglich nutzt.",
    skills: ["MCP", "Evaluation", "Governance"],
    meta: "7 Lektionen · 2.5h",
  },
  {
    n: "04",
    tag: "Capstone",
    title: "AI-native Arbeiten",
    hook: "Denkweise, Teams, Lern-Loops.",
    body: "Wie du deine Arbeit neu auflegst, nicht nur optimierst. Wie du anderen beibringst, was du gelernt hast. Am Ende: ein eigener Workflow, gebaut, getestet, verteidigt.",
    skills: ["Methodik", "Teams", "Lernmaterialien"],
    meta: "6 Lektionen · 2h",
  },
];

export function AiNativeSkillGraph() {
  return (
    <SectionShell num="IV" label="Skill Graph" dark>
      <Eyebrow className="text-brand-sand">Wie alles zusammenhängt</Eyebrow>
      <ClipHeading
        as="h2"
        className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-[var(--color-dark-fg)]"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        Vier Module.
        <br />
        Ein Bogen.
      </ClipHeading>
      <FadeBlock delay={1}>
        <p className="mt-5 max-w-[680px] text-[18px] leading-[1.55] text-[var(--color-dark-muted)]">
          Kein Ranking, keine Hierarchie. Jedes Modul öffnet die nächste
          Fähigkeit. Wer bei Modul vier steht, kommt leichter zu Modul eins
          zurück, nicht umgekehrt.
        </p>
      </FadeBlock>

      {/* Stat row */}
      <FadeBlock delay={2}>
        <div className="mt-10 grid grid-cols-2 gap-6 border-y border-[var(--color-dark-border)] py-6 md:grid-cols-4">
          <div>
            <CountUp value={4} className="text-[2.5rem] text-brand-orange" />
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)]">
              Module
            </p>
          </div>
          <div>
            <CountUp value={27} className="text-[2.5rem] text-brand-orange" />
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)]">
              Lektionen
            </p>
          </div>
          <div>
            <CountUp
              value={9}
              suffix="h"
              className="text-[2.5rem] text-brand-orange"
            />
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)]">
              Kernzeit
            </p>
          </div>
          <div>
            <span
              className="font-mono font-bold tracking-[-0.02em] text-brand-orange"
              style={{ fontSize: "2.5rem" }}
            >
              ∞
            </span>
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)]">
              eigene Praxis
            </p>
          </div>
        </div>
      </FadeBlock>

      {/* Editorial column spread */}
      <FadeBlock delay={3}>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {COLUMNS.map((col) => (
            <article
              key={col.n}
              className="flex flex-col border-t border-t-[var(--color-dark-border)] pt-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-bold tracking-[0.02em] text-brand-orange">
                  {col.n}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)]">
                    {col.tag}
                  </span>
                </div>
              </div>
              <h3 className="mt-4 text-[20px] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--color-dark-fg)]">
                {col.title}
              </h3>
              <p className="mt-2 text-[14.5px] leading-[1.45] text-brand-amber">
                {col.hook}
              </p>
              <p className="mt-3 text-[14px] leading-[1.55] text-[var(--color-dark-muted)]">
                {col.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {col.skills.map((s) => (
                  <span
                    key={s}
                    className="border border-[var(--color-dark-border)] px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-dark-muted)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-dark-muted)]">
                {col.meta}
              </div>
            </article>
          ))}
        </div>
      </FadeBlock>

      {/* Legend */}
      <FadeBlock delay={5}>
        <div className="mt-12 border-t border-[var(--color-dark-border)] pt-6">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-dark-muted)]">
            <span>Fundament</span>
            <span>→</span>
            <span>Werkzeuge</span>
            <span>→</span>
            <span>Praxis</span>
            <span>→</span>
            <span className="text-brand-orange">Capstone</span>
          </div>
          <p className="mt-4 max-w-[640px] text-[14px] leading-[1.55] text-[var(--color-dark-muted)]">
            <span className="font-bold text-brand-orange">
              Alle 4 Module sind kostenlos
            </span>{" "}
            und ohne Kurs-Zugang offen.
          </p>
        </div>
      </FadeBlock>
    </SectionShell>
  );
}
