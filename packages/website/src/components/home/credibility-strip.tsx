import { HOME_COPY } from "@/components/home/home-copy";
import type { Locale } from "@/lib/i18n/locale";

export function CredibilityStrip({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const copy = HOME_COPY[locale].credibility;

  return (
    <section className="scroll-mt-24 py-12" data-testid="platform-principles">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="overline border-l-[3px] border-brand-orange pl-3">
          {copy.overline}
        </h2>

        <dl className="mt-6 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-4">
          {copy.principles.map((item, index) => (
            <div
              key={item.label}
              className="border-b border-r border-border p-4"
            >
              <dt>
                <span className="font-mono text-xs font-bold tabular-nums text-brand-orange">
                  {String(index + 1).padStart(2, "0")} · {item.label}
                </span>
                <span className="mt-3 block text-base font-bold text-foreground">
                  {item.title}
                </span>
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
