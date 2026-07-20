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
      ? "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
      : "inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-foreground hover:text-background";

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
