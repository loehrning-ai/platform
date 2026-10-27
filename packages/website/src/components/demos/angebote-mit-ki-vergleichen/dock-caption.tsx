"use client";

/**
 * The caption in the dock: what just happened and what it means, in full sentences. It never clips:
 * the stage gives the dock the room the caption needs, and the workbench above gives way instead.
 */
export function DockCaption({ sentences }: { readonly sentences: readonly string[] }) {
  return (
    <div className="av4-caption" data-av4-caption="" aria-live="polite">
      {sentences.map((sentence) => (
        <p key={sentence}>{sentence}</p>
      ))}
    </div>
  );
}
