/**
 * Renders the post's copy strings. The copy uses a small, closed markup so
 * whole sentences stay in one string (and in one piece for the voice lint):
 *
 *   [text](target)   link; targets are statute keys, EUR-Lex keys, in-page
 *                    anchors, site paths or https URLs (see resolveTarget)
 *   **text**         bold lead-in
 *   {date:claimId}   a date from the legal registry
 *   {range:a:b}      a date window from two registry claims
 *   {stand}          the sheet's review date
 *   {de:text}        a German term in English copy, rendered with lang="de"
 *                    so screen-reader voices switch language (WCAG 3.1.2)
 *
 * Output is React elements only; nothing is parsed as HTML.
 */

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { keepLegalRefsTogether } from "../../_components/legal-text";
import { claimDate, claimRange } from "./dates";

export interface RichContext {
  readonly locale: Locale;
  /** The sheet's lastReviewed, formatted for the locale. */
  readonly stand: string;
}

const STATUTES = {
  betrvg: "betrvg",
  bbig: "bbig_2005",
  jarbschg: "jarbschg",
} as const;

const TOKEN =
  /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\{(date|range|stand)(?::([a-z0-9-]+))?(?::([a-z0-9-]+))?\}|\{de:([^{}]+)\}/g;

type Target =
  | {
      readonly kind: "external";
      readonly href: string;
      /** The linked page's language, where the target fixes it. */
      readonly hrefLang?: "de";
    }
  | { readonly kind: "anchor"; readonly href: string }
  | { readonly kind: "internal"; readonly href: string };

/** Maps a copy target to a URL. Unknown targets throw at render and test time. */
export function resolveTarget(target: string, locale: Locale): Target {
  const statute = target.match(/^(betrvg|bbig|jarbschg):(\d+[a-z]?)$/);
  if (statute) {
    const slug = STATUTES[statute[1] as keyof typeof STATUTES];
    return {
      kind: "external",
      href: `https://www.gesetze-im-internet.de/${slug}/__${statute[2]}.html`,
      hrefLang: "de",
    };
  }
  const eli = target.match(/^eli:(\d{4})\/(\d+)$/);
  if (eli) {
    return {
      kind: "external",
      href: `https://eur-lex.europa.eu/eli/reg/${eli[1]}/${eli[2]}/oj`,
    };
  }
  if (/^#[a-z0-9-]+$/.test(target)) return { kind: "anchor", href: target };
  if (/^\/[a-z0-9/-]*$/.test(target)) {
    return { kind: "internal", href: localizeHref(target, locale) };
  }
  if (/^https:\/\/[^\s"'<>]+$/.test(target)) return { kind: "external", href: target };
  throw new Error(`unknown link target in post copy: ${target}`);
}

function tokenText(
  kind: string,
  first: string | undefined,
  second: string | undefined,
  context: RichContext,
): string {
  if (kind === "stand") return context.stand;
  if (kind === "date" && first) return claimDate(first, context.locale);
  if (kind === "range" && first && second) {
    return claimRange(first, second, context.locale, { compact: true });
  }
  throw new Error(`malformed date token in post copy: ${kind}:${first ?? ""}`);
}

/** The plain text a copy string renders to (for word counts and metadata). */
export function richToText(source: string, context: RichContext): string {
  return source.replace(
    TOKEN,
    (
      _match,
      linkText?: string,
      _target?: string,
      bold?: string,
      kind?: string,
      a?: string,
      b?: string,
      german?: string,
    ) => {
      if (linkText !== undefined) return linkText;
      if (bold !== undefined) return bold;
      if (german !== undefined) return german;
      return tokenText(kind!, a, b, context);
    },
  );
}

export function Rich({
  source,
  context,
}: {
  source: string;
  context: RichContext;
}): ReactNode {
  const nodes: ReactNode[] = [];
  let pending = "";
  let last = 0;
  const flush = () => {
    if (pending !== "") nodes.push(keepLegalRefsTogether(pending));
    pending = "";
  };

  for (const match of source.matchAll(TOKEN)) {
    pending += source.slice(last, match.index);
    last = match.index + match[0].length;
    const [, linkText, target, bold, kind, a, b, german] = match;
    if (linkText !== undefined && target !== undefined) {
      flush();
      const resolved = resolveTarget(target, context.locale);
      const label = keepLegalRefsTogether(linkText);
      nodes.push(
        resolved.kind === "internal" ? (
          <Link key={nodes.length} href={resolved.href}>
            {label}
          </Link>
        ) : (
          <a
            key={nodes.length}
            href={resolved.href}
            hrefLang={resolved.kind === "external" ? resolved.hrefLang : undefined}
          >
            {label}
          </a>
        ),
      );
    } else if (bold !== undefined) {
      flush();
      nodes.push(<strong key={nodes.length}>{keepLegalRefsTogether(bold)}</strong>);
    } else if (german !== undefined) {
      flush();
      nodes.push(
        <span key={nodes.length} lang="de">
          {keepLegalRefsTogether(german)}
        </span>,
      );
    } else {
      pending += tokenText(kind!, a, b, context);
    }
  }
  pending += source.slice(last);
  flush();
  return nodes.map((node, index) => <Fragment key={index}>{node}</Fragment>);
}
