"use client";

/**
 * The caption in the dock: what just happened and why it matters, in full
 * sentences. It always shows every sentence (scene captions keep to three
 * short ones), so the deciding sentence is never folded away.
 */
export function DockCaption({ sentences }: { readonly sentences: readonly string[] }) {
  if (sentences.length === 0) return null;
  return (
    <div className="w05-caption" data-w05-caption="">
      <div className="w05-caption-text" aria-live="polite">
        {sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
      </div>
    </div>
  );
}
