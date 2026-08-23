"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { DEMO_HEIGHT } from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

type PromptScannerModule = typeof import("./prompt-scanner-demo");

let scannerModulePromise: Promise<PromptScannerModule> | null = null;

function loadPromptScanner(): Promise<PromptScannerModule> {
  if (!scannerModulePromise) {
    scannerModulePromise = import("./prompt-scanner-demo").catch(
      (error: unknown) => {
        scannerModulePromise = null;
        throw error;
      },
    );
  }
  return scannerModulePromise;
}

/**
 * Keeps the substantial scanner UI out of the initial detail-page dependency
 * graph. A fixed-height status preserves layout, and the real widget loads as
 * it approaches the viewport. Browsers without IntersectionObserver fail open
 * to the interactive widget.
 */
export default function PromptScannerLoader() {
  const { locale } = useDemoLocale();
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [Scanner, setScanner] = useState<ComponentType | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    let observer: IntersectionObserver | null = null;

    const activate = () => {
      observer?.disconnect();
      void loadPromptScanner()
        .then(({ default: PromptScanner }) => {
          if (mounted) setScanner(() => PromptScanner);
        })
        .catch(() => {
          if (mounted) setUnavailable(true);
        });
    };

    const placeholder = placeholderRef.current;
    if (!placeholder || typeof IntersectionObserver === "undefined") {
      activate();
      return () => {
        mounted = false;
      };
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) activate();
      },
      { rootMargin: "64px 0px", threshold: 0.01 },
    );
    observer.observe(placeholder);

    return () => {
      mounted = false;
      observer?.disconnect();
    };
  }, []);

  if (Scanner) return <Scanner />;

  return (
    <div
      ref={placeholderRef}
      role={unavailable ? "alert" : "status"}
      aria-live={unavailable ? "assertive" : "polite"}
      className="grid place-items-center text-center text-sm text-muted-foreground"
      style={{ minHeight: DEMO_HEIGHT }}
    >
      {unavailable
        ? DEMOS_PAGE_COPY[locale].errors.detailHeading
        : DEMOS_PAGE_COPY[locale].shell.loading}
    </div>
  );
}
