import {
  FileSearch,
  Gift,
  Languages,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Card, IconTile, type CardAccent } from "@/components/ui/card";
import { HOME_COPY } from "@/components/home/home-copy";
import type { Locale } from "@/lib/i18n/locale";

const principlePresentation: ReadonlyArray<{
  readonly icon: LucideIcon;
  readonly accent: CardAccent;
}> = [
  { icon: Gift, accent: "kupfer" },
  { icon: Languages, accent: "sand" },
  { icon: FileSearch, accent: "amber" },
  { icon: UserCheck, accent: "kupfer" },
];

export function CredibilityStrip({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].credibility;

  return (
    <section
      className="scroll-mt-24 border-t border-border py-16"
      data-testid="platform-principles"
    >
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="overline mb-8">{copy.overline}</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.principles.map((item, index) => {
            const presentation = principlePresentation[index];
            return (
            <div
              key={item.label}
              className="h-full"
            >
              <Card accent={presentation.accent} className="h-full gap-4">
                <div className="flex items-center gap-3">
                  <IconTile icon={presentation.icon} accent={presentation.accent} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                    {item.label}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {item.title}
                  </div>
                  <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </div>
                </div>
              </Card>
            </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 h-[2px] w-10 bg-brand-orange" />

        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
          {copy.summary}
        </p>
      </div>
    </section>
  );
}
