"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import {
  SectionShell,
  ClipHeading,
  Eyebrow,
  FadeBlock,
} from "@/components/ai-native/primitives";
import { AI_NATIVE_BUNDLE_ITEMS } from "@/lib/ai-native/content";
import { cn } from "@/lib/utils";

/* BundleShowcase — section with hover/click-driven split:
 *   LEFT:  numbered list of learning-material bausteine + access block
 *   RIGHT: sticky detail pane showing active baustein's full info */

export function AiNativeBundleShowcase() {
  const [active, setActive] = useState(0);
  const items = AI_NATIVE_BUNDLE_ITEMS;
  const current = items[active];
  const CurrentIcon = current.icon;

  return (
    <SectionShell id="os-bundle" num="VIII" label="Lernmaterialien">
      <Eyebrow>Kursmaterial</Eyebrow>
      <ClipHeading
        as="h2"
        className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        Die <span className="text-brand-orange">Lernmaterialien</span>.
        <br />
        Muster, nicht Autopilot.
      </ClipHeading>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        {/* LEFT — list + access */}
        <div>
          <FadeBlock delay={1}>
            <p className="max-w-[520px] text-[17px] leading-[1.6] text-muted-foreground">
              Der Arbeitskurs ist das Fundament. Die Lernmaterialien sind in
              den Lektionen eingebettet, Prompt-Muster, Diagramme und
              Checklisten direkt im Kontext.
            </p>
          </FadeBlock>

          <div className="mt-8 grid gap-1.5">
            {items.map((item, i) => {
              const isActive = i === active;
              return (
                <button
                  key={item.title}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  className={cn(
                    "grid grid-cols-[44px_1fr_auto] items-center gap-4 border-l-2 px-4 py-3.5 text-left transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-150",
                    isActive
                      ? "border-brand-orange bg-brand-orange/10"
                      : "border-border hover:bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[11px] font-bold uppercase tracking-[0.14em]",
                      isActive ? "text-brand-orange" : "text-muted-foreground",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "text-[15px] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-foreground/80",
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <FadeBlock delay={3}>
            <div className="mt-10 border border-border bg-brand-orange/5 p-6">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span
                  className="font-mono font-bold tracking-[-0.04em] text-brand-orange"
                  style={{ fontSize: "clamp(2.75rem, 6vw, 3.5rem)" }}
                >
                  Kostenlos
                </span>
                <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  mit Lernkonto
                </span>
              </div>
              <p className="mt-3.5 text-[14px] leading-[1.55] text-muted-foreground">
                Arbeitskurs Modul 1-4, komplett kostenlos mit Lernkonto. Alle
                Lernmaterialien sind in den Lektionen eingebettet.
              </p>
              <div className="mt-5">
                <BrandButton
                  href="/ai-native/kurs/modul_1"
                  prefetch={false}
                  variant="primary"
                  size="sm"
                >
                  Kurs starten <ArrowRight size={13} />
                </BrandButton>
              </div>
            </div>
          </FadeBlock>
        </div>

        {/* RIGHT — sticky detail pane */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-border bg-card p-8 min-h-[420px]">
            <div className="flex items-start justify-between gap-4">
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                Baustein {String(active + 1).padStart(2, "0")}
              </span>
              <span className="inline-flex h-10 w-10 items-center justify-center border border-border bg-brand-orange/10 text-brand-orange">
                <CurrentIcon size={18} />
              </span>
            </div>
            <h3 className="mt-4 text-[26px] font-bold leading-[1.2] tracking-[-0.01em] text-foreground">
              {current.title}
            </h3>
            <p className="mt-4 text-[16px] leading-[1.6] text-muted-foreground">
              {current.description}
            </p>
            <div className="mt-7 border-t border-dashed border-border pt-5">
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Wo
              </span>
              <p className="mt-2 font-mono text-[14px] text-foreground">
                {current.count}
              </p>
            </div>
            <div className="mt-5 border-t border-dashed border-border pt-5">
              <p className="text-[13px] leading-[1.55] text-muted-foreground">
                Die Lernmaterialien sind direkt in den Lektionen eingebettet
                und dort im fachlichen Kontext erklärt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
