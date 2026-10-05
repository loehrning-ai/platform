"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Copy } from "lucide-react";
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
  /** "app": a compact disclosure card for the Grundlagen course reader. */
  readonly look?: "werk" | "app";
}

type CopyState = "idle" | "copied" | "failed";

export function OpenWithYourAi({
  kind,
  contextTitle,
  resources,
  serverUrl,
  helpHref,
  locale,
  look = "werk",
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

  if (look === "app") {
    return (
      <section
        aria-label={copy.label}
        data-open-with-your-ai={kind}
        className="course-app-ground mx-auto w-full px-4 pt-4 sm:px-6 lg:px-8"
      >
        <details className="group mx-auto max-w-5xl rounded-[22px] border border-lab-line/80 bg-card/90 shadow-lab-sm">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-[22px] px-4 py-2 text-[15px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-lab-accent [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lab-accent-soft text-lab-accent">
              <Copy size={15} />
            </span>
            <span className="min-w-0 flex-1 truncate">{kindCopy.heading}</span>
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className="px-4 pb-4">
            <p className="max-w-[62ch] text-sm leading-6 text-muted-foreground">{kindCopy.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyPrompt}
                className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-full bg-lab-accent px-5 text-sm font-semibold text-paper outline-none transition-colors duration-150 hover:bg-[#1f3a99] focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                {copyState === "copied" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copy.copyAction}
              </button>
              <Link
                href={helpHref}
                prefetch={false}
                className="inline-flex min-h-11 min-w-11 items-center rounded-full px-4 text-sm font-semibold text-lab-accent outline-none transition-colors duration-150 hover:bg-lab-accent-soft focus-visible:ring-2 focus-visible:ring-lab-accent motion-reduce:transition-none"
              >
                {copy.helpLink}
              </Link>
            </div>
            <dl className="mt-3 grid gap-2 rounded-[16px] bg-paper p-3 text-sm ring-1 ring-lab-line">
              <dt className="font-semibold text-muted-foreground">{copy.serverLabel}</dt>
              <dd>
                <code className="break-all font-mono text-xs text-foreground">{serverUrl}</code>
              </dd>
              <dt className="font-semibold text-muted-foreground">
                {resources.length === 1 ? copy.addressLabel : copy.addressesLabel}
              </dt>
              <dd>
                <ul className="grid gap-1">
                  {resources.map((resource) => (
                    <li key={resource.uri} className="min-w-0">
                      <code className="break-all font-mono text-xs text-foreground">{resource.uri}</code>
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
            <p role="status" aria-live="polite" className={copyState === "idle" ? "sr-only" : "mt-2 text-sm text-muted-foreground"}>
              {copyState === "copied" ? copy.copiedNotice : null}
              {copyState === "failed" ? copy.copyFailedNotice : null}
            </p>
            {copyState === "failed" ? (
              <div className="mt-2">
                <p className="text-sm font-semibold text-muted-foreground">{copy.promptLabel}</p>
                <pre className="mt-2 overflow-x-auto rounded-[14px] bg-inset p-3 font-mono text-xs leading-5 text-foreground">{prompt}</pre>
              </div>
            ) : null}
          </div>
        </details>
      </section>
    );
  }

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

        <dl className="grid border-t border-hairline sm:grid-cols-[9rem_minmax(0,1fr)] [&>dt:not(:first-child)]:border-t sm:[&>dd:not(:nth-child(2))]:border-t [&>*]:border-hairline">
          <dt className="px-4 pb-1 pt-2 text-label text-muted-foreground sm:pb-2">
            {copy.serverLabel}
          </dt>
          <dd className="px-4 pb-2 sm:pt-2">
            <code className="break-all font-mono text-xs text-foreground">
              {serverUrl}
            </code>
          </dd>
          <dt className="px-4 pb-1 pt-2 text-label text-muted-foreground sm:pb-2">
            {resources.length === 1 ? copy.addressLabel : copy.addressesLabel}
          </dt>
          <dd className="px-4 pb-2 sm:pt-2">
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
