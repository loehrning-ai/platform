import type { Metadata } from "next";
import { mergeGlossaries } from "@/lib/glossary/merge";
import { GlossarView } from "@/components/glossary/glossar-view";

export const metadata: Metadata = {
  title: "Glossar | KI-Begriffe von A bis Z",
  description: "Alle KI-Begriffe aus dem KI-Führerschein und dem EU-AI-Act-Kurs in einem öffentlichen Glossar. Von A bis Z, mit Kurskontext und englischen Fachbegriffen.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/glossar" },
};

export default function GlossarPage() {
  const entries = mergeGlossaries();
  return (
    <div className="mx-auto max-w-[860px] px-6 pb-32 pt-20">
      <div className="mb-9 h-[3px] w-[154px] bg-brand-orange" />
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
        KI-Kompetenzweg · Glossar
      </p>
      <h1 className="mt-6 text-[40px] font-bold leading-[0.94] tracking-[-0.05em] text-foreground sm:text-[56px]">
        KI-Begriffe<br />
        <span className="text-brand-orange">von A bis Z.</span>
      </h1>
      <p className="mt-6 max-w-[680px] text-[18px] leading-[1.5] text-muted-foreground">
        {entries.length} Begriffe aus dem KI-Führerschein, dem EU-AI-Act-Kurs und dem AI-Native Arbeitskurs. Mit englischen Fachbegriffen und direkten Links zu den Kursen.
      </p>
      <div className="mt-12">
        <GlossarView entries={entries} />
      </div>
    </div>
  );
}
