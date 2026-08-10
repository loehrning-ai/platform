// No "use client": zero hooks/interactivity — plain static markup, rendered as
// a Server Component from the homepage (keeps it out of the client JS bundle).
// Card + IconTile are server-safe (no hooks).
//
// This is the ONE place the supporting resources live on the homepage. They
// used to be duplicated (once under the courses, once in the closing chips);
// now they sit here as a single compact set, lighter than the course cards so
// the courses stay the main event.
import { BookOpen, GraduationCap, LayoutDashboard, Pencil, Presentation, type LucideIcon } from "lucide-react";
import { Github } from "@/components/icons/brand";
import Link from "next/link";
import { Card, IconTile, type CardAccent } from "@/components/ui/card";
import { HOME_COPY } from "@/components/home/home-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

const resourcePresentation: ReadonlyArray<{
  readonly icon: LucideIcon;
  readonly accent: CardAccent;
}> = [
  { icon: Pencil, accent: "kupfer" },
  { icon: BookOpen, accent: "amber" },
  { icon: LayoutDashboard, accent: "sand" },
  { icon: Presentation, accent: "amber" },
  { icon: Github, accent: "sand" },
];

export function Workflow({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].workflow;

  return (
    <section
      id="ressourcen"
      className="relative scroll-mt-24 bg-background pt-16 pb-10 md:pt-20 md:pb-12"
      data-testid="ressourcen-section"
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="overline mb-4">{copy.overline}</p>
        <h2
          className="text-balance font-bold leading-[1.02] tracking-[-0.035em] text-foreground"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
        >
          {copy.headline}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {copy.introduction}
        </p>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.resources.map((row, index) => {
            const presentation = resourcePresentation[index];
            return (
            <Card
              key={row.label}
              href={localizeHref(row.href, locale)}
              accent={presentation.accent}
              className="h-full gap-3"
            >
              <div className="flex items-start gap-3">
                <IconTile icon={presentation.icon} accent={presentation.accent} />
                <div className="min-w-0">
                  <span className="text-base font-bold tracking-[-0.02em] text-foreground group-hover:text-brand-orange">
                    {row.label}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                    {row.body}
                  </span>
                </div>
              </div>
            </Card>
            );
          })}
        </div>

        {/* Honest progress/login note — showcases the account feature once. */}
        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-kupfer-mist p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 md:items-center">
            <IconTile icon={GraduationCap} accent="kupfer" />
            <p className="text-sm leading-relaxed text-foreground">
              {copy.accountBody}
            </p>
          </div>
          <Link
            href={localizeHref("/konto", locale)}
            prefetch={false}
            className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange underline-offset-4 hover:underline"
          >
            {copy.accountCta} &#8594;
          </Link>
        </div>
      </div>
    </section>
  );
}
