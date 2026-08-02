import type { Metadata } from "next";
import {
  DemoGrid,
  type DemoGridInitialFilters,
} from "@/components/demos/demo-grid";
import {
  DEMO_CATEGORIES,
  DEMO_LEVELS,
  demos,
  getAllIndustries,
  type DemoCategory,
  type DemoLevel,
} from "@/lib/demos";

export const metadata: Metadata = {
  title: "Praxisbeispiele",
  description:
    `${demos.length} KI-Praxisbeispiele im Lernbereich: drei Reifegrade, direkt im Browser, mit erklärten Annahmen.`,
  robots: { index: true, follow: true },
  alternates: { canonical: "/demos" },
  openGraph: {
    title: "Praxisbeispiele · loehrning.ai",
    description:
      `${demos.length} kursgebundene KI-Praxisbeispiele quer durch den Stack: Grundlagen, Mittel, Fortgeschritten.`,
    url: "https://loehrning.ai/demos",
    type: "website",
  },
};

type DemoSearchParams = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

interface DemosPageProps {
  readonly searchParams: Promise<DemoSearchParams>;
}

const DEMO_INDUSTRIES = new Set(getAllIndustries());

function isDemoLevel(value: unknown): value is DemoLevel {
  return (
    typeof value === "string" &&
    DEMO_LEVELS.some((candidate) => candidate === value)
  );
}

function isDemoCategory(value: unknown): value is DemoCategory {
  return (
    typeof value === "string" &&
    DEMO_CATEGORIES.some((candidate) => candidate === value)
  );
}

function singleValue(
  value: string | readonly string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function sanitizeDemoFilters(
  params: DemoSearchParams,
): DemoGridInitialFilters {
  const level = singleValue(params.level);
  const category = singleValue(params.cat);
  const industry = singleValue(params.industry);

  return {
    level: isDemoLevel(level) ? level : "alle",
    category: isDemoCategory(category) ? category : "Alle",
    industry:
      typeof industry === "string" && DEMO_INDUSTRIES.has(industry)
        ? industry
        : "",
  };
}

export default async function DemosPage({ searchParams }: DemosPageProps) {
  const initialFilters = sanitizeDemoFilters(await searchParams);
  const filterKey = [
    initialFilters.level,
    initialFilters.category,
    initialFilters.industry,
  ].join(":");

  return (
    <div className="min-h-[100svh]">
      {/* Hero */}
      <section className="border-b border-border/40 bg-card/10 px-6 pb-12 pt-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-brand-orange">
            Lernbereich · Praxisbeispiele · simuliert
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.03em] md:text-5xl">
            {demos.length} KI-Praxisbeispiele.
            <br />
            <span className="text-brand-orange">Drei Reifegrade.</span> Direkt im Browser.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Jedes Praxisbeispiel ist ein klickbarer Prototyp, vom Excel-Add-In für
            Einsteiger bis zur Multi-Agent-Pipeline. Filtere nach
            Reifegrad und prüfe die Arbeitsweise direkt im Browser.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 pb-20 pt-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <DemoGrid key={filterKey} initialFilters={initialFilters} />
        </div>
      </section>
    </div>
  );
}
