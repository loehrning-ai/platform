"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function BackGlyph() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className="size-4 shrink-0">
      <path d="M17 10H4M9 5l-5 5 5 5" />
    </svg>
  );
}

/**
 * The bar's back glyph. Server-rendered to /demos; when the visitor came from
 * the workshop page (?source=workshop) it points back there and says so. The
 * URL is read once after hydration, so the page stays static.
 */
export function DemoBackLink({
  demosHref,
  demosLabel,
  workshopHref,
  workshopLabel,
}: {
  readonly demosHref: string;
  readonly demosLabel: string;
  readonly workshopHref: string | null;
  readonly workshopLabel: string;
}) {
  const [fromWorkshop, setFromWorkshop] = useState(false);
  useEffect(() => {
    if (!workshopHref) return;
    if (new URLSearchParams(window.location.search).get("source") === "workshop") setFromWorkshop(true);
  }, [workshopHref]);
  const toWorkshop = fromWorkshop && workshopHref !== null;
  const label = toWorkshop ? workshopLabel : demosLabel;
  return (
    <Link
      prefetch={false}
      href={toWorkshop ? workshopHref : demosHref}
      className="demo-bar-back"
      data-demo-back={toWorkshop ? "workshop" : "demos"}
      aria-label={label}
    >
      <BackGlyph />
      <span className="max-sm:sr-only">{label}</span>
    </Link>
  );
}
