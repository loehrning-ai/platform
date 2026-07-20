"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import { fadeUp } from "@/lib/animations";
import { CareerTimeline } from "@/components/about/career-timeline";
import { CredibilityLogos } from "@/components/about/credibility-logos";
import { Credentials } from "@/components/about/credentials";
import { TIM_ENTITY, GITHUB_ORG } from "@/lib/seo/entity";

export function UeberMichContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative border-b border-border/50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col gap-12 md:flex-row md:items-center">
            <m.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="order-first shrink-0 md:order-last"
            >
              <Image
                src="/ueber-mich/tim-loehr.jpg"
                alt="Porträt von Tim Löhr vor der Golden Gate Bridge"
                width={288}
                height={288}
                priority
                className="h-48 w-48 rounded-full border-2 border-border object-cover shadow-[6px_6px_0_0_var(--color-brand-orange)] sm:h-64 sm:w-64 md:h-72 md:w-72"
              />
            </m.div>
            <m.div initial="hidden" animate="visible" className="min-w-0 flex-1">
              <m.p
                custom={0}
                variants={fadeUp}
                className="text-sm font-semibold uppercase tracking-wider text-brand-orange"
              >
                Über Tim Löhr
              </m.p>
              <m.h1
                custom={1}
                variants={fadeUp}
                className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl md:text-5xl"
              >
                Ich bin Tim Löhr, Data Engineer bei Meta.
              </m.h1>
              <m.p
                custom={2}
                variants={fadeUp}
                className="mt-6 max-w-2xl text-lg text-muted-foreground"
              >
                Davor war ich Data Scientist bei Apple und Red Bull. loehrning.ai
                habe ich gebaut, um das Wissen aus dieser Arbeit öffentlich zu
                machen: als freies Lernarchiv, nicht hinter einer Paywall.
              </m.p>
              <m.p
                custom={3}
                variants={fadeUp}
                className="mt-4 max-w-2xl text-lg text-muted-foreground"
              >
                Du findest hier kostenlose Kurse, Bücher, Demos und
                meine Arbeitsnotizen zu KI-nativer Arbeit.
              </m.p>
              <m.div
                custom={4}
                variants={fadeUp}
                className="mt-8 flex flex-wrap gap-3"
              >
                <a
                  href={TIM_ENTITY.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card/40 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Linkedin size={16} className="text-brand-sand" />
                  Auf LinkedIn vernetzen
                </a>
                <a
                  href={TIM_ENTITY.personalGithubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card/40 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Github size={16} className="text-brand-sand" />
                  GitHub
                </a>
                <a
                  href={GITHUB_ORG.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card/40 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Github size={16} className="text-brand-sand" />
                  Lern-Organisation auf GitHub
                </a>
              </m.div>
            </m.div>
          </div>
        </div>
      </section>

      <CredibilityLogos />
      <CareerTimeline />
      <Credentials />

      {/* Redaktionelle Richtlinien */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <m.p
              custom={0}
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-wider text-brand-orange"
            >
              Editorial
            </m.p>
            <m.h2
              custom={1}
              variants={fadeUp}
              className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
            >
              Redaktionelle Richtlinien
            </m.h2>
            <m.div
              custom={2}
              variants={fadeUp}
              className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground"
            >
              <p>
                Alle Inhalte dieser Plattform unterliegen einem festgelegten
                Prüfrhythmus. Rechtliche Inhalte (EU AI Act, Artikel 4) werden
                monatlich geprüft, bis die Übergangsfrist im August 2026 abläuft,
                danach quartalsweise. Tool- und Anbieterinhalte alle sechs
                Wochen. Grundlegende KI-Konzepte halbjährlich.
              </p>
              <p>
                Jeder Inhaltsblock zeigt den letzten Prüfmonat am Ende der Seite.
                Wenn eine Prüfung überfällig ist, erscheint ein sichtbarer Hinweis
                ("Aktualisierung ausstehend"). Das gilt auch bei vorübergehender
                Überlastung: Ich blende keine Hinweise aus.
              </p>
              <p>
                Zahlen werden inline zitiert, direkt nach der Behauptung. Keine
                Fußnoten. Keine Zahlen ohne Quelle. Vereinfachungen werden als
                solche gekennzeichnet. Kein Kurs und kein Zertifikat wird als
                Compliance-Nachweis bezeichnet.
              </p>
              <p>
                Die vollständigen Redaktionsrichtlinien sind im Repository unter{" "}
                <code className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-xs text-brand-orange">
                  CONTENT_GUIDE.md
                </code>{" "}
                dokumentiert.
              </p>
            </m.div>
          </m.div>
        </div>
      </section>

      {/* Kontakt */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <m.p
              custom={0}
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-wider text-brand-orange"
            >
              Kontakt
            </m.p>
            <m.h2
              custom={1}
              variants={fadeUp}
              className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
            >
              Du erreichst mich direkt.
            </m.h2>
            <m.p
              custom={2}
              variants={fadeUp}
              className="mt-6 max-w-2xl text-muted-foreground"
            >
              Für Fragen, Feedback und berufliche Anfragen: Schreib mir per
              E-Mail oder auf LinkedIn.
            </m.p>
            <m.div
              custom={3}
              variants={fadeUp}
              className="mt-8 flex flex-wrap gap-4"
            >
              <a
                href={`mailto:${TIM_ENTITY.email}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card/40 px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail size={16} className="text-brand-sand" />
                {TIM_ENTITY.email}
              </a>
              <a
                href={TIM_ENTITY.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card/40 px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Linkedin size={16} className="text-brand-sand" />
                LinkedIn
              </a>
              <a
                href={TIM_ENTITY.personalGithubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card/40 px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github size={16} className="text-brand-sand" />
                GitHub
              </a>
            </m.div>
            <m.p
              custom={4}
              variants={fadeUp}
              className="mt-6 text-sm text-muted-foreground"
            >
              Korrekturen und Fehler in Inhalten meldest du am besten über{" "}
              <a
                href="/feedback"
                className="underline underline-offset-2 hover:text-foreground"
              >
                /feedback
              </a>
              .
            </m.p>
          </m.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="h-[400px] w-[600px] rounded-full bg-brand-orange/8 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <m.h2
              custom={0}
              variants={fadeUp}
              className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
            >
              Weiter zu den{" "}
              <span className="text-gradient-static">Kursen</span>.
            </m.h2>
            <m.p
              custom={1}
              variants={fadeUp}
              className="mt-4 text-lg text-muted-foreground"
            >
              Kurse, Bücher und Demos bleiben frei zugänglich.
            </m.p>
            <m.div custom={2} variants={fadeUp} className="mt-8">
              <BrandButton href="/kurse" variant="primary" surface="light">
                Kurse ansehen <ArrowRight size={18} />
              </BrandButton>
            </m.div>
          </m.div>
        </div>
      </section>
    </>
  );
}
