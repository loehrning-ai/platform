import type { ReactNode } from "react";
import { SafeLessonMarkup } from "@/components/safe-lesson-markup";

// ─── Data Science shared primitives ────────────────
//
// Typed port of `src/v8/shared.js`'s presentational primitives, replacing
// the source's `window.X` global-export pattern (a plain-script,
// no-bundler convention) with named exports/imports. `title`/`hook`/list
// items carry inline markup in source (e.g. `<em>`/`<strong>`/`<span
// class="accent">` emphasis). SafeLessonMarkup preserves that narrow
// formatting vocabulary without an HTML-injection boundary.

export interface HeroMetaItem {
  readonly k: string;
  readonly v: string;
}

export interface HeroProps {
  readonly eyebrow: string;
  /** May contain inline markup, as in source. */
  readonly title: string;
  /** May contain inline markup, as in source. */
  readonly hook: string;
  readonly meta?: readonly HeroMetaItem[];
}

export function Hero({ eyebrow, title, hook, meta }: HeroProps) {
  return (
    <header className="hero">
      <div className="hero-eyebrow">{eyebrow}</div>
      <h1 className="hero-title">
        <SafeLessonMarkup html={title} />
      </h1>
      <p className="hero-hook">
        <SafeLessonMarkup html={hook} />
      </p>
      {meta && (
        <div className="hero-meta">
          {meta.map((m, i) => (
            <div className="m" key={m.k} style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
              <div className="k">{m.k}</div>
              <div className="v">
                <SafeLessonMarkup html={m.v} />
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

export interface SectionLabelProps {
  readonly n: string;
  readonly children: ReactNode;
}

export function SectionLabel({ n, children }: SectionLabelProps) {
  return (
    <div className="section-label">
      <span className="n">{n}</span>
      <span className="t">{children}</span>
    </div>
  );
}

export interface PanelProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly meta?: ReactNode;
  readonly children: ReactNode;
  readonly caption?: ReactNode;
}

export function Panel({ eyebrow, title, meta, children, caption }: PanelProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">
          <span className="dot" />
          {eyebrow && <span className="lab">{eyebrow}</span>}
          <span className="name">{title}</span>
        </div>
        {meta && <div className="panel-meta">{meta}</div>}
      </div>
      <div className="panel-body">{children}</div>
      {caption && <div className="panel-caption">{caption}</div>}
    </div>
  );
}

interface CalloutListProps {
  readonly items: readonly string[];
  readonly title: string;
  readonly className?: string;
}

function CalloutList({ items, title, className }: CalloutListProps) {
  return (
    <div className={className ? `callout ${className}` : "callout"}>
      <div className="callout-head">{title}</div>
      <div className="callout-list">
        {items.map((item, i) => (
          <div className="callout-item" key={i}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <span>
              <SafeLessonMarkup html={item} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface CalloutItemsProps {
  readonly items: readonly string[];
  readonly title?: string;
}

export function AntiPatterns({ items, title = "Anti-patterns" }: CalloutItemsProps) {
  return <CalloutList items={items} title={title} />;
}

export function BestPractices({ items, title = "The right way" }: CalloutItemsProps) {
  return <CalloutList items={items} title={title} className="mint" />;
}

export interface TakeawayProps {
  readonly items: readonly string[];
}

export function Takeaway({ items }: TakeawayProps) {
  return (
    <div className="takeaway">
      <div className="takeaway-head">Key takeaways</div>
      <div className="takeaway-list">
        {items.map((item, i) => (
          <div className="takeaway-item" key={i}>
            <SafeLessonMarkup html={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
