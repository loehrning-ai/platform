import { ArrowRight } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { HOME_COPY } from "@/components/home/home-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

export function FinalCta({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].finalCta;

  return (
    <Section spacing="default" className="scroll-mt-24" data-testid="final-cta">
      <Container size="3xl" className="text-center">
        <div className="mb-12 h-px w-full bg-border" />

        <div className="overflow-visible pb-2">
          <h2
            className="font-bold leading-[1.02] tracking-[-0.035em] text-foreground"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            {copy.headline}
          </h2>
        </div>

        <p className="mx-auto mt-8 max-w-md text-lg text-muted-foreground">
          {copy.body}
        </p>

        <div className="mt-10">
          <BrandButton href={localizeHref("/ki-check", locale)} variant="primary" surface="light">
            {copy.label} <ArrowRight size={15} />
          </BrandButton>
        </div>

        <div className="mx-auto mt-20 h-px w-full bg-brand-orange" />

        <p className="mt-4 text-right font-mono text-[10px] text-muted-foreground">
          // loehrning.ai
        </p>
      </Container>
    </Section>
  );
}
