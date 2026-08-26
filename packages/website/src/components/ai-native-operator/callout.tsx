import type { JSX } from "react";
import { Quote, FileCode2, Info, AlertTriangle } from "lucide-react";
import type { AiNativeOperatorCallout } from "@/lib/ai-native-operator/types";

/**
 * Callout — renders the 4 source callout kinds (quote/spec/note/warn),
 * ported from `ai-native-operator/course-app.js:87` (Callout). English
 * copy. Presentational only, no store dependency.
 */
export function Callout({
  c,
}: {
  readonly c: AiNativeOperatorCallout;
}): JSX.Element {
  if (c.kind === "quote") {
    return (
      <aside className="my-8 border-l-[3px] border-brand-orange bg-card/40 p-6">
        <Quote className="h-4 w-4 text-brand-orange" aria-hidden="true" />
        <p className="mt-2 text-[18px] font-medium leading-[1.5] text-foreground">
          &ldquo;{c.text}&rdquo;
        </p>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
          {c.attr}
        </p>
      </aside>
    );
  }

  if (c.kind === "spec") {
    return (
      <aside className="my-8 border-2 border-border bg-card/60">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <FileCode2
            className="h-3.5 w-3.5 text-brand-orange"
            aria-hidden="true"
          />
          <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
            {c.h}
          </p>
        </div>
        <pre
          role="region"
          aria-label={c.h}
          tabIndex={0}
          className="max-w-full overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.6] text-foreground"
        >
          {c.lines.map((line, i) => (
            <span
              key={i}
              className={
                line.startsWith("#")
                  ? "block font-bold text-brand-orange"
                  : "block"
              }
            >
              {line || " "}
            </span>
          ))}
        </pre>
      </aside>
    );
  }

  const Icon = c.kind === "warn" ? AlertTriangle : Info;
  return (
    <aside
      className={
        c.kind === "warn"
          ? "my-8 border-2 border-destructive/40 bg-destructive/5 p-5"
          : "my-8 border-2 border-brand-orange/40 bg-brand-orange/5 p-5"
      }
    >
      <div className="flex items-center gap-2">
        <Icon
          className={
            c.kind === "warn"
              ? "h-4 w-4 text-destructive"
              : "h-4 w-4 text-brand-orange"
          }
          aria-hidden="true"
        />
        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground">
          {c.h}
        </p>
      </div>
      <p className="mt-2 text-[14px] leading-[1.55] text-muted-foreground">
        {c.text}
      </p>
    </aside>
  );
}

export default Callout;
