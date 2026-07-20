import { Suspense } from "react";
import type { Metadata } from "next";
import { DemoGrid } from "@/components/demos/demo-grid";
import { demos } from "@/lib/demos";

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

export default function DemosPage() {
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
          <Suspense
            fallback={
              <div
                role="status"
                aria-live="polite"
                className="py-20 text-center font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground"
              >
                ◆ Praxisbeispiele werden geladen…
              </div>
            }
          >
            <DemoGrid />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
