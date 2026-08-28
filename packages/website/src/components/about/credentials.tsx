import { BookOpen, GraduationCap, Globe2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";

const ICONS = {
  degree: GraduationCap,
  international: Globe2,
  research: BookOpen,
} as const;

const CREDENTIAL_STYLES = {
  degree: "bg-brand-lilac/45 md:col-span-7",
  international: "bg-brand-sky/45 md:col-span-5 md:mt-8",
  research: "bg-paper md:col-span-10 md:col-start-2",
} as const;

const ICON_STYLES = {
  degree: "bg-brand-acid/70",
  international: "bg-brand-pink/65",
  research: "bg-brand-teal/45",
} as const;

export function Credentials({ locale }: { readonly locale: Locale }) {
  const copy = PROFILE_COPY[locale].credentials;

  return (
    <section
      id="ausbildung"
      className="border-t border-border bg-background py-10"
      aria-labelledby="credentials-heading"
      data-credential-spread
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="grid gap-4 border-b border-border pb-6 md:grid-cols-[minmax(0,0.7fr)_minmax(18rem,0.5fr)] md:items-end md:gap-8">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">
              {copy.eyebrow}
            </p>
            <h2
              id="credentials-heading"
              className="mt-3 text-pretty text-3xl font-bold tracking-[-0.04em] text-foreground"
            >
              {copy.title}
            </h2>
          </div>
          <p className="min-w-0 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {copy.intro}
          </p>
        </header>

        <div className="mt-7 grid min-w-0 gap-4 md:grid-cols-12 md:gap-5">
          {copy.cards.map((credential, index) => {
            const Icon = ICONS[credential.id];
            return (
              <article
                key={credential.id}
                className={`group relative min-w-0 border-t-[3px] border-foreground p-5 shadow-card ring-1 ring-foreground/15 sm:p-6 ${CREDENTIAL_STYLES[credential.id]}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className={`inline-flex h-11 w-11 items-center justify-center text-foreground ring-1 ring-foreground/25 ${ICON_STYLES[credential.id]}`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 break-words text-pretty text-xl font-bold tracking-[-0.025em] text-foreground [overflow-wrap:anywhere]">
                  {credential.title}
                </h3>
                {credential.subtitle ? (
                  <p className="mt-2 break-words text-sm font-semibold text-brand-orange [overflow-wrap:anywhere]">
                    {credential.subtitle}
                  </p>
                ) : null}
                <p className="mt-3 max-w-2xl break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {credential.detail}
                </p>
                {credential.evidence ? (
                  <ul className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2">
                    {credential.evidence.map((item) => (
                      <li
                        key={item.href}
                        className="grid min-w-0 grid-cols-[0.5rem_minmax(0,1fr)] gap-3 bg-brand-acid/25 px-3 py-2 text-xs leading-relaxed text-muted-foreground ring-1 ring-foreground/15"
                      >
                        <span
                          className="mt-[0.42rem] h-1.5 w-1.5 bg-brand-orange"
                          aria-hidden="true"
                        />
                        <a
                          href={item.href}
                          className="inline-flex min-h-11 min-w-0 items-center break-words underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-current [overflow-wrap:anywhere]"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
