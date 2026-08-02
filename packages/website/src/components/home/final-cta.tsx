import { ArrowRight } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";

export function FinalCta() {
  return (
    <Section spacing="default" className="scroll-mt-24" data-testid="final-cta">
      <Container size="3xl" className="text-center">
        <div className="mb-12 h-px w-full bg-border" />

        <div className="overflow-visible pb-2">
          <h2
            className="font-bold leading-[1.02] tracking-[-0.035em] text-foreground"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            Deinen Start bestimmen.
          </h2>
        </div>

        <p className="mx-auto mt-8 max-w-md text-lg text-muted-foreground">
          Der KI-Check bestimmt deinen passenden Einstieg. Bücher, Demos und
          Workshops sind öffentlich. Die vier deutschen Kernkurse nutzen ein
          kostenloses Konto für deinen Fortschritt.
        </p>

        <div className="mt-10">
          <BrandButton href="/ki-check" variant="primary" surface="light">
            Start bestimmen <ArrowRight size={15} />
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
