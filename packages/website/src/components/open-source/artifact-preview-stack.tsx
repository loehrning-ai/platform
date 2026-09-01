"use client";

import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent } from "react";

export interface ArtifactPreviewFrame {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly caption: string;
}

interface ArtifactPreviewStackProps {
  readonly frames: readonly ArtifactPreviewFrame[];
  readonly groupLabel: string;
  readonly counterLabels: readonly string[];
  readonly selectLabels: readonly string[];
}

export function ArtifactPreviewStack({
  frames,
  groupLabel,
  counterLabels,
  selectLabels,
}: ArtifactPreviewStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const activeFrame = frames[activeIndex];

  if (!activeFrame) return null;

  function selectFrame(index: number) {
    setActiveIndex(index);
    buttonRefs.current[index]?.focus();
  }

  function handleSelectorKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % frames.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + frames.length) % frames.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = frames.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    selectFrame(nextIndex);
  }

  return (
    <section
      aria-label={groupLabel}
      className="border-t border-border bg-card"
      data-artifact-preview-stack
    >
      <figure aria-labelledby={`${id}-caption`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-foreground/[0.035] p-3 sm:p-5">
          <div className="absolute inset-3 sm:inset-5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 translate-x-3 translate-y-2 rotate-[1.4deg] border border-border bg-background"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-2 translate-y-1 -rotate-[0.8deg] border border-border bg-card"
            />
            <div
              key={activeFrame.src}
              className="pointer-events-none absolute inset-0 z-10 overflow-hidden border border-brand-orange bg-background shadow-[0_18px_45px_rgba(24,20,16,0.13)] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none"
              data-preview-frame={activeIndex}
              data-preview-active="true"
            >
              <Image
                src={activeFrame.src}
                alt=""
                width={activeFrame.width}
                height={activeFrame.height}
                sizes="(min-width: 1024px) 640px, (min-width: 640px) calc(100vw - 96px), calc(100vw - 56px)"
                className="h-full w-full object-contain"
                priority={activeIndex === 0}
              />
            </div>
          </div>
        </div>

        <figcaption
          id={`${id}-caption`}
          className="grid min-h-[4.75rem] gap-1 border-t border-border px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-baseline sm:gap-4 sm:px-4"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange tabular-nums">
            {counterLabels[activeIndex]}
          </span>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="grid text-sm leading-relaxed text-muted-foreground"
            data-preview-caption-stack
          >
            {frames.map((frame, index) => {
              const active = index === activeIndex;
              return (
                <span
                  key={frame.src}
                  aria-hidden={active ? undefined : true}
                  className={`col-start-1 row-start-1 ${active ? "visible" : "invisible"}`}
                  data-preview-caption={index}
                  data-preview-caption-active={active ? "true" : "false"}
                >
                  {frame.caption}
                </span>
              );
            })}
          </span>
        </figcaption>
      </figure>

      <div
        role="group"
        aria-label={groupLabel}
        className="grid grid-cols-2 border-t border-border sm:grid-cols-5"
      >
        {frames.map((frame, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={frame.src}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              type="button"
              aria-pressed={active}
              aria-label={selectLabels[index]}
              className={`min-h-11 border-b border-r px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-[0.08em] outline-none transition-[background-color,border-color,color] duration-150 [touch-action:manipulation] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset motion-reduce:transition-none sm:border-b-0 ${
                active
                  ? "border-brand-orange bg-brand-orange text-white hover:bg-brand-orange hover:text-white focus-visible:ring-white"
                  : "border-border bg-background text-muted-foreground hover:bg-card-hover hover:text-foreground focus-visible:ring-foreground"
              }`}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => handleSelectorKeyDown(event, index)}
            >
              <span aria-hidden="true" className="mr-2 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              {frame.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
