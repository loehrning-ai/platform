"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { DsReaderShell } from "@/components/data-science/reader-shell";
import { isDsNumberedChapterId } from "@/lib/data-science/types";

// ─── Chapter-reader chrome (plan 012 stage 5) ─────────────────────────
//
// Delegates to the reusable DsReaderShell (also consumed directly by the
// course-root page.tsx, which has no layout.tsx of its own — see that
// component's own doc comment for why a shared layout.tsx can't wrap both
// the Overview and the future certificate/verification routes, stage 13).
// An unknown chapterSlug still resolves a sidebar active-state fallback
// here; the actual 404 is decided by page.tsx's own notFound() call, which
// Next.js renders as this segment's not-found.tsx nested inside this same
// layout.

export default function DsChapterLayout({ children }: { readonly children: ReactNode }) {
  const params = useParams<{ chapterSlug: string }>();
  const activeId = isDsNumberedChapterId(params.chapterSlug) ? params.chapterSlug : "home";
  return <DsReaderShell activeId={activeId}>{children}</DsReaderShell>;
}
