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
import type { Locale } from "@/lib/i18n/locale";

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

const COLUMNS_EN: readonly Column[] = [
  {
    n: "01",
    tag: "Foundation",
    title: "Task and prompt structure",
    hook: "Define the work before asking a model to perform it.",
    body: "Specify role, context, task, output format and constraints. Treat the context window as a limited working set and state how the result will be checked.",
    skills: ["Prompt structure", "Context budget", "Failure modes"],
    meta: "5 lessons · 50 min",
  },
  {
    n: "02",
    tag: "Tools",
    title: "Claude workspace",
    hook: "Select the interface that fits the task.",
    body: "Use chat for dialogue, Artifacts for reviewable outputs and Claude Code for bounded work on files. Projects, Skills and MCP provide context and controlled connections.",
    skills: ["Projects", "Skills", "Claude Code"],
    meta: "7 lessons · 76 min",
  },
  {
    n: "03",
    tag: "Knowledge",
    title: "Maintained knowledge",
    hook: "Make source material searchable, citable and reviewable.",
    body: "Organize notes with PARA and maps of content, connect selected tools and keep provenance visible. Retrieval quality depends on maintained source material.",
    skills: ["Obsidian", "Retrieval", "Source review"],
    meta: "7 lessons · 89 min",
  },
  {
    n: "04",
    tag: "Automation",
    title: "Controlled workflows",
    hook: "Automate bounded steps, not undefined responsibility.",
    body: "Map repeated work, identify human review points and test a small n8n workflow. The capstone documents one pilot and its controls.",
    skills: ["n8n", "Governance", "Capstone"],
    meta: "8 lessons · 88 min",
  },
];

export function AiNativeSkillGraph({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const isEnglish = locale === "en";
  const columns = isEnglish ? COLUMNS_EN : COLUMNS;
  return (
    <SectionShell
      num="IV"
      label={isEnglish ? "Learning structure" : "Lernstruktur"}
    >
      <Eyebrow>
        {isEnglish ? "How the modules connect" : "Wie die Module zusammenhängen"}
      </Eyebrow>
      <ClipHeading
        as="h2"
        className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        {isEnglish ? "Four modules." : "Vier Module."}
        <br />
        {isEnglish ? "One reviewable workflow." : "Ein prüfbarer Ablauf."}
      </ClipHeading>
      <FadeBlock delay={1}>
        <p className="mt-5 max-w-[680px] text-[18px] leading-[1.55] text-muted-foreground">
          {isEnglish
            ? "Each module adds a specific capability: define the task, configure the workspace, maintain knowledge and automate bounded steps."
            : "Jedes Modul ergänzt eine konkrete Fähigkeit: Aufgabe definieren, Arbeitsumgebung einrichten, Wissen pflegen und begrenzte Schritte automatisieren."}
        </p>
      </FadeBlock>

      {/* Stat row */}
      <FadeBlock delay={2}>
        <div className="mt-10 grid grid-cols-2 gap-6 border-y border-border py-6 md:grid-cols-4">
          <div>
            <CountUp value={4} className="text-[2.5rem] text-brand-orange" />
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
              {isEnglish ? "Modules" : "Module"}
            </p>
          </div>
          <div>
            <CountUp value={27} className="text-[2.5rem] text-brand-orange" />
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
              {isEnglish ? "Lessons" : "Lektionen"}
            </p>
          </div>
          <div>
            <CountUp
              value={12}
              suffix="h"
              className="text-[2.5rem] text-brand-orange"
            />
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
              {isEnglish ? "Lesson time" : "Lernzeit"}
            </p>
          </div>
          <div>
            <span
              className="font-mono font-bold tracking-[-0.02em] text-brand-orange"
              style={{ fontSize: "2.5rem" }}
            >
              ∞
            </span>
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
              {isEnglish ? "own practice" : "eigene Praxis"}
            </p>
          </div>
        </div>
      </FadeBlock>

      {/* Editorial column spread */}
      <FadeBlock delay={3}>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {columns.map((col) => (
            <article
              key={col.n}
              className="flex flex-col border-t border-t-border pt-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-bold tracking-[0.02em] text-brand-orange">
                  {col.n}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                    {col.tag}
                  </span>
                </div>
              </div>
              <h3 className="mt-4 text-[20px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
                {col.title}
              </h3>
              <p className="mt-2 text-[14.5px] leading-[1.45] text-foreground">
                {col.hook}
              </p>
              <p className="mt-3 text-[14px] leading-[1.55] text-muted-foreground">
                {col.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {col.skills.map((s) => (
                  <span
                    key={s}
                    className="border border-border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                {col.meta}
              </div>
            </article>
          ))}
        </div>
      </FadeBlock>

      {/* Legend */}
      <FadeBlock delay={5}>
        <div className="mt-12 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>{isEnglish ? "Foundation" : "Fundament"}</span>
            <span>→</span>
            <span>{isEnglish ? "Tools" : "Werkzeuge"}</span>
            <span>→</span>
            <span>{isEnglish ? "Knowledge" : "Wissen"}</span>
            <span>→</span>
            <span className="text-brand-orange">
              {isEnglish ? "Automation" : "Automatisierung"}
            </span>
          </div>
          <p className="mt-4 max-w-[640px] text-[14px] leading-[1.55] text-muted-foreground">
            <span className="font-bold text-brand-orange">
              {isEnglish
                ? "All four modules are free"
                : "Alle vier Module sind kostenlos"}
            </span>{" "}
            {isEnglish
              ? "and the protected reader uses a free learning account."
              : "und der geschützte Reader nutzt ein kostenloses Lernkonto."}
          </p>
        </div>
      </FadeBlock>
    </SectionShell>
  );
}
