"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import {
  SectionShell,
  ClipHeading,
  Eyebrow,
} from "@/components/ai-native/primitives";
import { getAiNativeFaq } from "@/lib/ai-native/content";
import { EASE_OUT_EXPO } from "@/lib/animations";
import type { Locale } from "@/lib/i18n/locale";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

/* FAQ — editorial accordion: numbered questions, big +/- toggle,
 * Kupfer top-border on open row. One item open at a time. */

function AiNativeFaqSectionContent({ locale = "de" }: { readonly locale?: Locale }) {
  const [open, setOpen] = useState<number | null>(0);
  const isEnglish = locale === "en";
  const items = getAiNativeFaq(locale);

  return (
    <SectionShell num="X" label={isEnglish ? "Course facts" : "Kursfragen"}>
      <Eyebrow>FAQ</Eyebrow>
      <ClipHeading
        as="h2"
        className="mt-2.5 font-bold leading-none tracking-[-0.035em]"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        {isEnglish ? "Course scope and access." : "Umfang und Zugang."}
      </ClipHeading>
      <div className="mt-12 max-w-[860px]">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={`border-b border-border transition-colors ${
                isOpen ? "border-t-[3px] border-t-brand-orange" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="grid w-full cursor-pointer grid-cols-[40px_1fr_40px] items-center gap-4 py-5 text-left"
              >
                <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-brand-orange">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[18px] font-semibold leading-[1.3] tracking-[-0.01em] text-foreground md:text-[19px]">
                  {item.question}
                </span>
                <span
                  className={`text-right font-mono text-[22px] leading-none transition-colors ${
                    isOpen ? "text-brand-orange" : "text-muted-foreground"
                  }`}
                  aria-hidden="true"
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    initial={{ maxHeight: 0, opacity: 0 }}
                    animate={{ maxHeight: 480, opacity: 1 }}
                    exit={{ maxHeight: 0, opacity: 0 }}
                    transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[680px] py-1 pb-7 pl-14 pr-2 text-[15.5px] leading-[1.65] text-muted-foreground">
                      {item.answer}
                    </p>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

export const AiNativeFaqSection = withMotionProvider(AiNativeFaqSectionContent);
