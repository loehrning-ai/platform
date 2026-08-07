import type { LucideProps } from "lucide-react";
import { forwardRef } from "react";

/**
 * Github and Linkedin, kept locally.
 *
 * lucide-react removed every brand icon in v1 — they are third-party
 * trademarks, and lucide stopped shipping them rather than license them one
 * by one. Both marks are still needed here (footer, nav, /ueber-mich), so the
 * two paths live in the repo instead of in a dependency.
 *
 * The geometry is lucide-react v0.577.0's own, which is ISC-licensed and is
 * exactly what this site rendered before the upgrade, so nothing shifts
 * visually. Both are forwardRef components so they satisfy `LucideIcon`,
 * which track-icon.ts and the workflow map store these in alongside real
 * Lucide icons — a plain function component does not structurally match it.
 *
 * Source: lucide-icons/lucide, ISC. https://github.com/lucide-icons/lucide
 */

type BrandIconProps = Omit<LucideProps, "ref">;

function svgProps(
  name: string,
  { size = 24, strokeWidth = 2, className, ...rest }: BrandIconProps,
) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    // Lucide stamps `lucide lucide-<name>` on every icon. Keep it: stylesheets
    // and tests select on `svg.lucide-github`, and this file exists precisely
    // so nothing downstream notices the icons left the dependency.
    className: ["lucide", `lucide-${name}`, className].filter(Boolean).join(" "),
    ...rest,
  };
}

export const Github = forwardRef<SVGSVGElement, BrandIconProps>(
  function Github(props, ref) {
    return (
      <svg ref={ref} {...svgProps("github", props)}>
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    );
  },
);

export const Linkedin = forwardRef<SVGSVGElement, BrandIconProps>(
  function Linkedin(props, ref) {
    return (
      <svg ref={ref} {...svgProps("linkedin", props)}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  },
);
