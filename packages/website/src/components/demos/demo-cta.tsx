"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { trackDemoCta } from "@/lib/analytics";
import type { DemoCtaTarget } from "@/lib/analytics";

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
  const className =
    variant === "primary"
      ? "inline-flex min-h-11 items-center gap-2 border border-brand-orange bg-brand-orange px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white hover:border-foreground hover:bg-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      : "inline-flex min-h-11 items-center gap-2 border border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-foreground hover:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange";

  return (
    <Link
      href={href}
      onClick={() => trackDemoCta(slug, target)}
      className={className}
    >
      {children}
      <ArrowUpRight size={14} strokeWidth={2.5} />
    </Link>
  );
}
