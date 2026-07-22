import type { JSX } from "react";
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";
import type { CodexBlock } from "@/lib/codex/types";

/**
 * Renders one `CodexBlock`. Kept as a standalone component (not inlined
 * into the reader) so the four source presentational patterns — prose,
 * pull-quote, callout, card-grid — each get their own source-faithful
 * treatment instead of collapsing into one markdown blockquote style.
 */
export function CodexBlockView({ block }: { readonly block: CodexBlock }): JSX.Element {
  switch (block.kind) {
    case "prose":
      return <MarkdownRenderer content={block.markdown} />;
    case "pull-quote":
      return (
        <blockquote className="my-6 border-l-2 border-brand-orange py-1 pl-5 text-[20px] font-semibold italic leading-[1.4] text-foreground md:text-[24px]">
          {block.text}
        </blockquote>
      );
    case "callout":
      return (
        <div className="my-4 flex items-start gap-2.5 border-l-2 border-brand-orange bg-brand-orange/5 px-5 py-4">
          <span aria-hidden="true" className="mt-0.5 text-brand-orange">
            ▸
          </span>
          <p className="text-[14px] leading-relaxed text-foreground">
            {block.title && <strong className="font-bold">{block.title} </strong>}
            {block.body}
          </p>
        </div>
      );
    case "card-grid":
      return (
        <div className="my-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {block.cards.map((card, i) => (
            <div key={i} className="border-2 border-border bg-card p-4">
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                {card.eyebrow}
              </p>
              <h4 className="mt-1.5 text-[15px] font-semibold text-foreground">{card.title}</h4>
              <p className="mt-1.5 text-[13px] leading-[1.5] text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      );
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}

export default CodexBlockView;
