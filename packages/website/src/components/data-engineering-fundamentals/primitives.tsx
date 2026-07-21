import type { CSSProperties, ReactNode } from "react";

// ─── Data Engineering Fundamentals shared primitives (plan 011 stage 2) ─
//
// Typed port of `src/chapters/shared.js`'s presentational primitives,
// replacing the source's `window.X` global-export pattern (a plain-script,
// no-bundler convention) with named exports/imports. `title`/`hook`/list
// items carry inline markup in source (e.g. `<b>`/`<code>` emphasis), so
// `dangerouslySetInnerHTML` is kept here exactly as source used it — every
// caller is this course's own statically-authored, source-controlled
// content (ported in later stages), never user input.
//
// `Term` drops source's `internalMode` branch (`shared.js`'s `MM_MAP`
// vendor-name-swap easter egg): `App.js` never exposes a UI control to
// toggle `internalMode` (not in `TopBar`, not in `TweaksPanel`, which this
// plan strips entirely per its own constraints) — only reachable by hand-
// editing localStorage. Always rendering the `meta` (public vendor) name
// matches the only value real users could ever see.

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
  /** CSS color, applied as the `--chapter-accent` custom property. */
  readonly accent?: string;
}

export function Hero({ eyebrow, title, hook, meta, accent }: HeroProps) {
  const style = accent ? ({ "--chapter-accent": accent } as CSSProperties) : undefined;
  return (
    <header className="hero" style={style}>
      <div className="hero-eyebrow">{eyebrow}</div>
      <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="hero-hook" dangerouslySetInnerHTML={{ __html: hook }} />
      {meta && (
        <div className="hero-meta">
          {meta.map((m) => (
            <div className="m" key={m.k}>
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
            <span dangerouslySetInnerHTML={{ __html: item }} />
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
          <div className="takeaway-item" key={i} dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </div>
    </div>
  );
}

export interface TermProps {
  /** The public/vendor name — see the module doc comment on `internalMode`. */
  readonly meta: string;
}

export function Term({ meta }: TermProps) {
  return <code className="term">{meta}</code>;
}

export interface CodeBlockProps {
  readonly title: string;
  readonly lang: string;
  /** Pre-tokenized syntax-highlighted HTML, as source's `code-body` blocks carry. */
  readonly html: string;
}

/**
 * The `.code`/`.code-head`/`.code-body` block repeated verbatim across every
 * source chapter file (SQL/Python/YAML snippets with `tok-*` syntax-highlight
 * spans baked in as HTML, matching source's own pre-tokenized strings).
 */
export function CodeBlock({ title, lang, html }: CodeBlockProps) {
  return (
    <div className="code">
      <div className="code-head">
        <span>{title}</span>
        <span className="lang">{lang}</span>
      </div>
      <div className="code-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
