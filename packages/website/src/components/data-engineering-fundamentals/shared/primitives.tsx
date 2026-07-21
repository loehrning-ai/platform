import type { CSSProperties, ReactNode } from "react";

// ─── Shared presentational primitives (plan 011 stage 2) ────────────
//
// Ported from the source's `src/chapters/shared.js`, replacing the
// `Object.assign(window, {...})` global-export pattern with named exports.
// `title`/`hook`/list-item props carry small, author-controlled HTML
// fragments (e.g. "<span class='accent'>...</span>", "<b>...</b>") exactly
// as the source authored them — rendered via `dangerouslySetInnerHTML`,
// matching source, never user input.

export interface HeroMetaItem {
  readonly k: string;
  readonly v: string;
}

export interface HeroProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly hook: string;
  readonly meta?: readonly HeroMetaItem[];
  readonly accent?: string;
}

export function Hero({ eyebrow, title, hook, meta, accent }: HeroProps) {
  return (
    <header className="hero" style={accent ? ({ "--chapter-accent": accent } as CSSProperties) : undefined}>
      <div className="hero-eyebrow">{eyebrow}</div>
      <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="hero-hook" dangerouslySetInnerHTML={{ __html: hook }} />
      {meta && meta.length > 0 && (
        <div className="hero-meta">
          {meta.map((m, i) => (
            <div className="m" key={i}>
              <div className="k">{m.k}</div>
              <div className="v" dangerouslySetInnerHTML={{ __html: m.v }} />
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
      <span>{children}</span>
    </div>
  );
}

export interface CalloutListProps {
  readonly items: readonly string[];
  readonly title?: string;
}

export function AntiPatterns({ items, title = "Anti-patterns" }: CalloutListProps) {
  return (
    <div className="callout">
      <div className="callout-head">{title}</div>
      <div className="callout-list">
        {items.map((it, i) => (
          <div className="callout-item" key={i}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <span dangerouslySetInnerHTML={{ __html: it }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BestPractices({ items, title = "The right way" }: CalloutListProps) {
  return (
    <div className="callout mint">
      <div className="callout-head">{title}</div>
      <div className="callout-list">
        {items.map((it, i) => (
          <div className="callout-item" key={i}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <span dangerouslySetInnerHTML={{ __html: it }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export interface TakeawayProps {
  readonly items: readonly string[];
}

export function Takeaway({ items }: TakeawayProps) {
  return (
    <div className="takeaway">
      <div className="takeaway-head">Key takeaways</div>
      <div className="takeaway-list">
        {items.map((it, i) => (
          <div className="takeaway-item" key={i} dangerouslySetInnerHTML={{ __html: it }} />
        ))}
      </div>
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
          <span>{title}</span>
        </div>
        {meta && <div className="panel-meta">{meta}</div>}
      </div>
      <div className="panel-body">{children}</div>
      {caption && <div className="panel-caption">{caption}</div>}
    </div>
  );
}

export interface TermProps {
  /**
   * Only the real (non-anonymized) term is ported — the source's
   * `internalMode`-swapped generic name is never reachable in the shipped
   * app (its only toggle lived in the stripped `TweaksPanel`), so this
   * primitive always renders the real term, matching that default.
   */
  readonly meta: string;
}

export function Term({ meta }: TermProps) {
  return <code className="term">{meta}</code>;
}
