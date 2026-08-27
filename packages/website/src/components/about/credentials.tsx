import { BookOpen, GraduationCap, Globe2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";

const ICONS = {
  degree: GraduationCap,
  international: Globe2,
  research: BookOpen,
} as const;

export function Credentials({ locale }: { readonly locale: Locale }) {
  const copy = PROFILE_COPY[locale].credentials;

  return (
    <section
      id="ausbildung"
      className="border-t border-border bg-card/30 py-10"
      aria-labelledby="credentials-heading"
      data-proof-bento
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

        <div className="mt-5 grid min-w-0 gap-px border border-border bg-border md:grid-cols-2">
          {copy.cards.map((credential, index) => {
            const Icon = ICONS[credential.id];
            return (
              <article
                key={credential.id}
                className={`group relative min-w-0 bg-background p-5 sm:p-6 ${
                  credential.id === "research" ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center border border-border bg-card text-brand-orange">
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
                  <ul className="mt-4 grid gap-px border-t border-border bg-border pt-px md:grid-cols-2">
                    {credential.evidence.map((item) => (
                      <li
                        key={item.href}
                        className="grid min-w-0 grid-cols-[0.5rem_minmax(0,1fr)] gap-3 bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground"
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
