"use client";

import Link from "next/link";
import { trackDemoCta } from "@/lib/analytics";
import type { DemoCtaTarget } from "@/lib/analytics";
import { ArrowGlyph } from "@/components/werk";

const BASE =
  "group inline-flex min-h-11 items-center gap-2 border px-5 text-[0.9375rem] font-semibold transition-colors duration-[120ms] motion-reduce:transition-none";

export function DemoCta({
  slug,
  target,
  href,
  variant = "primary",
  children,
}: {
  slug: string;
  target: DemoCtaTarget;
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}) {
  // Primary: Mennige fill with paper text (5.40:1), once per page.
  // Secondary: ink outline on paper.
  const className =
    variant === "primary"
      ? `${BASE} border-brand-orange bg-brand-orange text-paper hover:border-kupfer-dark hover:bg-kupfer-dark`
      : `${BASE} border-border bg-transparent text-foreground hover:border-foreground hover:bg-card-hover`;

  return (
    <Link
      href={href}
      onClick={() => trackDemoCta(slug, target)}
      className={className}
    >
      {children}
      <ArrowGlyph />
    </Link>
  );
}
