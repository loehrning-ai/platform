import Image from "next/image";
import { PROFILE_CONTAINER } from "@/components/about/profile-container";
import { SectionHead } from "@/components/werk/section-head";
import type { Locale } from "@/lib/i18n/locale";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";

// Institution marks, keyed by credential id. Only degree carries one today.
const INSTITUTION_MARKS: Partial<
  Record<"degree" | "international" | "research", { src: string; width: number; height: number }>
> = {
  degree: { src: "/ueber-mich/logos/fau.svg", width: 196, height: 28 },
};

/**
 * Academic background as three flat columns under a Kopflinie, separated by
 * hairlines from lg and stacked as hairline rows below. Subtitles are
 * Schiefer on paper (8.08:1), never Mennige on a tint; evidence links are a
 * plain list with ink square bullets.
 */
export function Credentials({ locale }: { readonly locale: Locale }) {
  const copy = PROFILE_COPY[locale].credentials;

  return (
    <section
      id="ausbildung"
      className="py-8 lg:py-10"
      aria-labelledby="credentials-heading"
      data-credential-spread
    >
      <div className={PROFILE_CONTAINER}>
        <SectionHead
          id="credentials-heading"
          title={copy.title}
          size="compact"
        />

        <div className="mt-6 grid min-w-0 border-t border-hairline lg:grid-cols-3">
          {copy.cards.map((credential) => {
            const mark = INSTITUTION_MARKS[credential.id];
            return (
              <article
                key={credential.id}
                className="min-w-0 border-b border-hairline py-5 lg:border-b-0 lg:border-l lg:px-6 lg:py-6 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              >
                <h3 className="break-words text-fluid-h3 font-bold text-foreground text-pretty [overflow-wrap:anywhere] max-sm:text-lg">
                  {credential.title}
                </h3>
                {credential.subtitle ? (
                  <p className="mt-1 break-words text-[0.9375rem] font-semibold text-muted-foreground [overflow-wrap:anywhere]">
                    {credential.subtitle}
                  </p>
                ) : null}
                {mark ? (
                  <Image
                    src={mark.src}
                    alt=""
                    aria-hidden="true"
                    width={mark.width}
                    height={mark.height}
                    loading="eager"
                    className="mt-3 h-7 w-auto max-w-full object-contain object-left grayscale"
                  />
                ) : null}
                <p className="mt-3 max-w-[60ch] break-words text-[0.9375rem] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {credential.detail}
                </p>
                {credential.evidence ? (
                  <ul className="mt-3 grid">
                    {credential.evidence.map((item) => (
                      <li
                        key={item.href}
                        className="grid min-w-0 grid-cols-[0.375rem_minmax(0,1fr)] items-start gap-3"
                      >
                        <span
                          className="mt-[1.1rem] size-1.5 bg-foreground"
                          aria-hidden="true"
                        />
                        <a
                          href={item.href}
                          className="inline-flex min-h-11 min-w-0 items-center break-words py-1 text-sm leading-snug text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground [overflow-wrap:anywhere]"
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
