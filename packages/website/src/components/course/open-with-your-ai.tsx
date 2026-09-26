"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";
import {
  buildOpenWithYourAiPrompt,
  OPEN_WITH_YOUR_AI_COPY,
  type OpenWithYourAiKind,
  type OpenWithYourAiResource,
} from "./open-with-your-ai-copy";

/**
 * "Open with your AI" on a reading surface.
 *
 * One control: it copies a ready prompt naming the MCP server address and
 * every resource address of the page the learner is on. The addresses stay
 * visible whether or not the clipboard works, and a refused clipboard writes
 * the whole prompt into the page instead of failing silently.
 *
 * The gate lives in `OpenWithYourAiRegion`, which is a server component: the
 * readiness predicate reads server environment, so a client island can never
 * decide whether the endpoint exists.
 */

interface OpenWithYourAiProps {
  readonly kind: OpenWithYourAiKind;
  readonly contextTitle: string;
  readonly resources: readonly OpenWithYourAiResource[];
  readonly serverUrl: string;
  readonly helpHref: string;
  readonly locale: Locale;
}

type CopyState = "idle" | "copied" | "failed";

export function OpenWithYourAi({
  kind,
  contextTitle,
  resources,
  serverUrl,
  helpHref,
  locale,
}: OpenWithYourAiProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const copy = OPEN_WITH_YOUR_AI_COPY[locale];
  const kindCopy = copy.kinds[kind];
  const prompt = buildOpenWithYourAiPrompt({
    kind,
    contextTitle,
    resources,
    serverUrl,
    locale,
  });

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <section
      aria-label={copy.label}
      data-open-with-your-ai={kind}
      className="mx-auto w-full max-w-[70rem] px-4 py-4 sm:px-6 lg:px-8"
    >
      <div className="border border-hairline bg-card">
        <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
          <div className="min-w-0">
            <p className="text-label text-muted-foreground">
              {copy.label}
            </p>
            <p className="mt-2 text-body font-semibold text-foreground">
              {kindCopy.heading}
            </p>
            <p className="mt-1 max-w-[62ch] text-sm leading-6 text-muted-foreground">
              {kindCopy.body}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={copyPrompt}
              className="inline-flex min-h-11 min-w-11 items-center gap-2 border border-foreground bg-transparent px-4 text-label text-foreground outline-none transition-colors duration-150 hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange motion-reduce:transition-none"
            >
              {copyState === "copied" ? (
                <Check size={14} aria-hidden="true" />
              ) : (
                <Copy size={14} aria-hidden="true" />
              )}
              {copy.copyAction}
            </button>
            <Link
              href={helpHref}
              prefetch={false}
              className="inline-flex min-h-11 min-w-11 items-center px-3 text-label text-foreground underline decoration-border underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange motion-reduce:transition-none"
            >
              {copy.helpLink}
            </Link>
          </div>
        </div>

        <dl className="grid border-t border-hairline sm:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="border-b border-hairline px-4 py-2 text-label text-muted-foreground sm:border-b-0">
            {copy.serverLabel}
          </dt>
          <dd className="border-b border-hairline px-4 py-2 last:border-b-0 sm:[&:not(:last-child)]:border-b">
            <code className="break-all font-mono text-xs text-foreground">
              {serverUrl}
            </code>
          </dd>
          <dt className="border-b border-hairline px-4 py-2 text-label text-muted-foreground sm:border-b-0">
            {resources.length === 1 ? copy.addressLabel : copy.addressesLabel}
          </dt>
          <dd className="border-b border-hairline px-4 py-2 last:border-b-0 sm:[&:not(:last-child)]:border-b">
            <ul className="grid gap-1">
              {resources.map((resource) => (
                <li key={resource.uri} className="min-w-0">
                  <code className="break-all font-mono text-xs text-foreground">
                    {resource.uri}
                  </code>
                </li>
              ))}
            </ul>
          </dd>
        </dl>

        <p
          role="status"
          aria-live="polite"
          className={
            copyState === "idle"
              ? "sr-only"
              : "border-t border-hairline px-4 py-2 text-caption text-muted-foreground"
          }
        >
          {copyState === "copied" ? copy.copiedNotice : null}
          {copyState === "failed" ? copy.copyFailedNotice : null}
        </p>

        {copyState === "failed" ? (
          <div className="border-t border-hairline px-4 pb-4 pt-2">
            <p className="text-label text-muted-foreground">
              {copy.promptLabel}
            </p>
            <pre className="mt-2 overflow-x-auto bg-inset p-3 font-mono text-xs leading-5 text-foreground">
              {prompt}
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}
