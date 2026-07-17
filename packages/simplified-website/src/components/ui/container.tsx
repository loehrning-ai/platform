import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Container — shared max-width + responsive gutter primitive (responsive-layout hardening)
 *
 * Replaces the 5 ad-hoc `max-w-* px-6` shell recipes scattered across pages with
 * ONE responsive gutter (px-5 sm:px-6 lg:px-8 — narrower on phones, roomier on
 * desktop) and a `size` prop for the content measure. Pair with <Section>:
 *   <Section><Container size="5xl">…</Container></Section>
 */

type Size = "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "prose";

const MAXW: Record<Size, string> = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  prose: "max-w-prose",
};

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  size?: Size;
  as?: ElementType;
}

export function Container({
  children,
  className,
  size = "6xl",
  as: Tag = "div",
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={cn("mx-auto w-full px-5 sm:px-6 lg:px-8", MAXW[size], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
