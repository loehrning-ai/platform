"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { ChevronUp } from "lucide-react";
import type { TocHeading } from "@/lib/book-reader-content";
import { ChapterTocLinks } from "./chapter-reader-client";

interface ChapterTocSheetProps {
  /** Visible label of the trigger in the reader bar. */
  readonly summaryLabel: string;
  /** Heading printed at the top of the open sheet. */
  readonly heading: string;
  /** Accessible name of the contents navigation inside the sheet. */
  readonly navLabel: string;
  readonly headings: TocHeading[];
  /** Rendered under the contents list, for example the all-chapters link. */
  readonly children?: ReactNode;
}

/**
 * The chapter contents as a sheet below `lg`. A native `<details>` owns the
 * open state, so the server renders it closed, nothing flips at hydration, and
 * the sheet still opens and closes with scripting disabled. The trigger lives
 * in the reader bar; the panel is positioned against that fixed bar and opens
 * upward from it, so opening it moves nothing else on the page.
 *
 * Scripting adds only what a disclosure cannot do on its own: a heading link
 * closes the sheet (the page scrolls, the sheet has done its job), Escape
 * closes it and hands focus back to the trigger, and a tap outside closes it.
 */
export function ChapterTocSheet({
  summaryLabel,
  heading,
  navLabel,
  headings,
  children,
}: ChapterTocSheetProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback((restoreFocus: boolean) => {
    const details = detailsRef.current;
    if (!details?.open) return;
    details.open = false;
    if (restoreFocus) summaryRef.current?.focus();
  }, []);

  // Registered only while the sheet is open, so a closed sheet costs nothing
  // per pointer event.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: Event) => {
      const details = detailsRef.current;
      if (
        details &&
        event.target instanceof Node &&
        details.contains(event.target)
      ) {
        return;
      }
      close(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [close, open]);

  const handleToggle = () => {
    setOpen(detailsRef.current?.open ?? false);
  };

  const handleClick = (event: ReactMouseEvent<HTMLDetailsElement>) => {
    if (
      event.target instanceof Element &&
      event.target.closest("a[href]") !== null
    ) {
      close(false);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== "Escape" || !detailsRef.current?.open) return;
    event.preventDefault();
    close(true);
  };

  return (
    <details
      ref={detailsRef}
      data-chapter-toc-sheet
      className="group/toc shrink-0"
      onToggle={handleToggle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <summary
        ref={summaryRef}
        className="flex min-h-11 min-w-11 cursor-pointer select-none list-none items-center gap-1 px-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground outline-none hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden"
      >
        {summaryLabel}
        <ChevronUp
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-150 group-open/toc:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div
        data-chapter-toc-sheet-panel
        className="absolute inset-x-0 bottom-full max-h-[min(24rem,60dvh)] overflow-y-auto overscroll-contain border-t-[3px] border-brand-orange bg-background px-4 py-4 [&_a]:min-h-11"
      >
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {heading}
        </p>
        <nav aria-label={navLabel}>
          <ChapterTocLinks headings={headings} />
        </nav>
        {children}
      </div>
    </details>
  );
}
