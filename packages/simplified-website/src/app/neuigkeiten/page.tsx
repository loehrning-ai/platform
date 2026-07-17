import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";

export const metadata: Metadata = {
  title: "Was ist neu",
  description:
    "Neuigkeiten und Inhaltsaktualisierungen auf der freien KI-Lernplattform von loehrning.ai.",
  alternates: { canonical: "/neuigkeiten" },
  robots: { index: true, follow: true },
};

export default function NeuigkeitenPage() {
  const changelog = readFileSync(
    join(process.cwd(), "content", "changelog.md"),
    "utf-8"
  );

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="h-[3px] w-28 bg-brand-orange" />
        <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          Plattform-Updates
        </p>
        <h1 className="mt-5 text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-5xl">
          Was ist neu
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Diese Seite dokumentiert Inhaltsaktualisierungen, neue Kurse und
          Korrekturen auf der Plattform.
        </p>
        <div className="prose prose-invert mt-12 max-w-none">
          <MarkdownRenderer content={changelog} />
        </div>
      </div>
    </section>
  );
}
