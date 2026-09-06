import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CommandCopyButton } from "@/components/open-source/command-copy-button";
import { AGENT_HELP_PATH } from "@/components/course/open-with-your-ai-copy";
import {
  ACCOUNT_CHAT_MAX_MESSAGE_BYTES,
  ACCOUNT_CHAT_MAX_TOOL_CALLS,
  ACCOUNT_CHAT_USER_RATE_LIMIT_MAX,
} from "@/lib/anthropic-chat/config";
import {
  MAX_ACTIVE_TOKENS,
  TOKEN_NAME_MAX_LENGTH,
} from "@/app/konto/ki/agent-account-contract";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  MCP_ENDPOINT_PATH,
  MCP_MAX_OUTPUT_BYTES,
  MCP_RATE_LIMIT_MAX,
  MCP_SEARCH_MAX_QUERY_LENGTH,
  MCP_SEARCH_RESULT_LIMIT,
} from "@/lib/mcp/config";
import { MCP_TOOLS } from "@/lib/mcp/tools/registry";
import {
  getAgentRuntimeFeatures,
  type AgentRuntimeFeatures,
} from "@/lib/runtime-features";
import { absoluteUrl } from "@/lib/seo/entity";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";
import {
  AGENT_HELP_COPY,
  AGENT_HELP_SECTION_IDS,
  AGENT_HELP_SECTION_ORDER,
  type AgentHelpCopy,
  type AgentHelpSectionKey,
  type AgentHelpWalkthrough,
} from "./eigene-ki-copy";

const PATH = AGENT_HELP_PATH;
const ACCOUNT_AGENT_PATH = "/konto/ki";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = AGENT_HELP_COPY[locale].metadata;
  const localizedPath = localizeHref(PATH, locale);
  const metadata = createPublicPageMetadata({
    title: copy.title,
    description: copy.description,
    path: localizedPath,
    locale,
  });

  return {
    ...metadata,
    alternates: {
      ...buildLocaleAlternates(PATH, contentLocalesForPath(PATH)),
      canonical: localizedPath,
    },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          locale: locale === "de" ? "de_DE" : "en_GB",
        }
      : metadata.openGraph,
  };
}

function sectionNumber(key: AgentHelpSectionKey): string {
  const index = AGENT_HELP_SECTION_ORDER.indexOf(key);
  return String(index + 1).padStart(2, "0");
}

function Section({
  sectionKey,
  copy,
  children,
}: {
  readonly sectionKey: AgentHelpSectionKey;
  readonly copy: AgentHelpCopy;
  readonly children: ReactNode;
}) {
  const id = AGENT_HELP_SECTION_IDS[sectionKey];
  const headingId = `${id}-titel`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="mt-7 min-w-0 scroll-mt-24"
    >
      <div className="grid gap-2 border-b border-foreground pb-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-end">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
          {sectionNumber(sectionKey)}
        </p>
        <h2
          id={headingId}
          className="text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-3xl"
        >
          {copy.sectionTitles[sectionKey]}
        </h2>
      </div>
      <div className="mt-4 grid min-w-0 gap-3 text-sm leading-6 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function Steps({ steps }: { readonly steps: readonly string[] }) {
  return (
    <ol className="grid min-w-0 gap-px bg-border">
      {steps.map((step, index) => (
        <li
          key={step}
          className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] gap-2 bg-background p-3"
        >
          <span className="font-mono text-xs font-bold tabular-nums text-brand-orange">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 break-words leading-6">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Snippet({
  label,
  code,
  locale,
}: {
  readonly label: string;
  readonly code: string;
  readonly locale: Locale;
}) {
  return (
    <div className="min-w-0 border border-border bg-card p-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
        <CommandCopyButton command={code} label={label} locale={locale} />
      </div>
      <pre className="mt-2 overflow-x-auto border border-border bg-background p-3 font-mono text-xs leading-5 text-foreground">
        {code}
      </pre>
    </div>
  );
}

function Walkthrough({
  sectionKey,
  copy,
  walkthrough,
  serverUrl,
  locale,
}: {
  readonly sectionKey: AgentHelpSectionKey;
  readonly copy: AgentHelpCopy;
  readonly walkthrough: AgentHelpWalkthrough;
  readonly serverUrl: string;
  readonly locale: Locale;
}) {
  return (
    <Section sectionKey={sectionKey} copy={copy}>
      <p className="max-w-[68ch]">{walkthrough.intro}</p>
      <Steps steps={walkthrough.steps} />
      <Snippet
        label={walkthrough.snippetLabel}
        code={walkthrough.snippet(serverUrl)}
        locale={locale}
      />
      <p className="max-w-[68ch] border-l-[3px] border-brand-orange pl-3">
        {walkthrough.note}
      </p>
    </Section>
  );
}

function AccountLink({
  label,
  locale,
}: {
  readonly label: string;
  readonly locale: Locale;
}) {
  return (
    <p>
      <Link
        href={localizeHref(ACCOUNT_AGENT_PATH, locale)}
        prefetch={false}
        className="inline-flex min-h-11 min-w-11 items-center border border-foreground bg-background px-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-foreground outline-none transition-colors duration-150 hover:bg-kupfer-mist focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange motion-reduce:transition-none"
      >
        {label}
      </Link>
    </p>
  );
}

function StateNote({
  title,
  body,
}: {
  readonly title: string;
  readonly body: string;
}) {
  return (
    <p className="max-w-[68ch] border-l-[3px] border-brand-orange bg-kupfer-mist p-3">
      <strong className="text-foreground">{title} </strong>
      {body}
    </p>
  );
}

function AgentHelpContent({
  locale,
  features,
}: {
  readonly locale: Locale;
  readonly features: AgentRuntimeFeatures;
}) {
  const copy = AGENT_HELP_COPY[locale];
  const serverUrl = absoluteUrl(MCP_ENDPOINT_PATH);
  const status = features.agentAccess ? copy.statusReady : copy.statusOff;

  return (
    <article
      className="mx-auto w-full max-w-[70rem] px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8"
      data-agent-help
    >
      <header className="overflow-hidden border border-foreground bg-card">
        <div className="h-1 bg-brand-orange" aria-hidden="true" />
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0 p-5 sm:p-7 lg:p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 max-w-4xl text-pretty text-[clamp(2rem,4.5vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.04em] text-foreground">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-[62ch] text-pretty text-base leading-7 text-muted-foreground">
              {copy.intro}
            </p>

            <p className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {copy.endpointLabel}
            </p>
            <div className="mt-2 grid min-w-0 gap-2 border border-foreground bg-background p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <code className="min-w-0 break-all font-mono text-sm text-foreground">
                {serverUrl}
              </code>
              <CommandCopyButton
                command={serverUrl}
                label={copy.endpointLabel}
                locale={locale}
              />
            </div>
            <p className="mt-3 max-w-[62ch] text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">{status.title} </strong>
              {status.body}
            </p>
          </div>

          <nav
            aria-label={copy.indexLabel}
            className="min-w-0 border-t border-foreground bg-kupfer-mist p-4 lg:border-l lg:border-t-0"
          >
            <div className="flex min-h-11 items-center justify-between gap-3 border border-foreground bg-background px-3">
              <span
                className="font-mono text-lg font-bold text-brand-orange"
                aria-hidden="true"
              >
                /
              </span>
              <h2 className="min-w-0 flex-1 break-words font-mono text-xs font-bold uppercase tracking-[0.1em] text-foreground">
                {copy.indexLabel}
              </h2>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {String(AGENT_HELP_SECTION_ORDER.length).padStart(2, "0")}
              </span>
            </div>
            <ol className="mt-2 grid gap-px bg-border">
              {AGENT_HELP_SECTION_ORDER.map((key) => (
                <li key={key} className="min-w-0 bg-background">
                  <Link
                    href={localizeHref(
                      `${PATH}#${AGENT_HELP_SECTION_IDS[key]}`,
                      locale,
                    )}
                    className="grid min-h-11 min-w-0 grid-cols-[1.9rem_minmax(0,1fr)] items-center gap-1.5 px-2 py-2 text-xs leading-4 text-muted-foreground outline-none transition-colors duration-150 hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange motion-reduce:transition-none"
                  >
                    <span className="font-mono tabular-nums text-brand-orange">
                      {sectionNumber(key)}
                    </span>
                    <span className="min-w-0 break-words">
                      {copy.sectionTitles[key]}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      <Section sectionKey="overview" copy={copy}>
        <p className="max-w-[68ch]">{copy.overview.intro}</p>
        <ul className="grid min-w-0 gap-px bg-border">
          {copy.overview.facts(MCP_TOOLS.length).map((fact) => (
            <li
              key={fact}
              className="min-w-0 break-words bg-background p-3 leading-6"
            >
              {fact}
            </li>
          ))}
        </ul>
        <StateNote
          title={copy.overview.readOnlyTitle}
          body={copy.overview.readOnlyBody}
        />
      </Section>

      <Walkthrough
        sectionKey="desktop"
        copy={copy}
        walkthrough={copy.desktop}
        serverUrl={serverUrl}
        locale={locale}
      />
      <Walkthrough
        sectionKey="code"
        copy={copy}
        walkthrough={copy.code}
        serverUrl={serverUrl}
        locale={locale}
      />
      <Walkthrough
        sectionKey="codex"
        copy={copy}
        walkthrough={copy.codex}
        serverUrl={serverUrl}
        locale={locale}
      />

      <Section sectionKey="tokens" copy={copy}>
        <p className="max-w-[68ch]">{copy.tokens.intro}</p>
        <Steps steps={copy.tokens.steps} />
        <Snippet
          label={copy.tokens.snippetLabel}
          code={copy.tokens.snippet(serverUrl)}
          locale={locale}
        />
        <p className="max-w-[68ch]">{copy.tokens.format}</p>
        <p className="max-w-[68ch]">{copy.tokens.limit(MAX_ACTIVE_TOKENS)}</p>
        <p className="max-w-[68ch]">{copy.tokens.bearerActive}</p>
        {copy.tokens.bearerPending ? (
          <p className="max-w-[68ch] border-l-[3px] border-brand-orange pl-3">
            {copy.tokens.bearerPending}
          </p>
        ) : null}
        {features.oauthServer ? null : (
          <p className="max-w-[68ch] border-l-[3px] border-brand-orange pl-3">
            {copy.tokens.oauthPending}
          </p>
        )}
        {features.agentAccess ? (
          <AccountLink label={copy.tokens.accountLink} locale={locale} />
        ) : null}
      </Section>

      <Section sectionKey="chat" copy={copy}>
        {features.byoChat ? (
          <>
            <p className="max-w-[68ch]">{copy.chat.intro}</p>
            <Steps steps={copy.chat.steps} />
            <p className="max-w-[68ch]">{copy.chat.cost}</p>
            <p className="max-w-[68ch]">{copy.chat.transcript}</p>
            <p className="max-w-[68ch]">
              {copy.chat.limits(
                ACCOUNT_CHAT_USER_RATE_LIMIT_MAX,
                ACCOUNT_CHAT_MAX_TOOL_CALLS,
              )}
            </p>
            <AccountLink label={copy.chat.accountLink} locale={locale} />
          </>
        ) : (
          <>
            <p className="max-w-[68ch]">{copy.chat.intro}</p>
            <StateNote title={copy.chat.offTitle} body={copy.chat.offBody} />
          </>
        )}
      </Section>

      <Section sectionKey="addresses" copy={copy}>
        <p className="max-w-[68ch]">{copy.addresses.intro}</p>
        <dl className="grid min-w-0 gap-px bg-border sm:grid-cols-[11rem_minmax(0,1fr)]">
          {copy.addresses.examples.map((example) => (
            <div key={example.uri} className="grid min-w-0 gap-px sm:contents">
              <dt className="bg-background p-3 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                {example.label}
              </dt>
              <dd className="min-w-0 bg-background p-3">
                <code className="break-all font-mono text-xs text-foreground">
                  {example.uri}
                </code>
              </dd>
            </div>
          ))}
        </dl>
        <p className="max-w-[68ch]">{copy.addresses.localeNote}</p>
        <p className="max-w-[68ch]">{copy.addresses.islandNote}</p>
      </Section>

      <Section sectionKey="limits" copy={copy}>
        <p className="max-w-[68ch]">{copy.limits.intro}</p>
        <ul className="grid min-w-0 gap-px bg-border">
          {[
            copy.limits.requests(MCP_RATE_LIMIT_MAX),
            copy.limits.output(MCP_MAX_OUTPUT_BYTES / 1024),
            copy.limits.search(
              MCP_SEARCH_RESULT_LIMIT,
              MCP_SEARCH_MAX_QUERY_LENGTH,
            ),
            copy.limits.chat(
              ACCOUNT_CHAT_USER_RATE_LIMIT_MAX,
              ACCOUNT_CHAT_MAX_MESSAGE_BYTES / 1024,
            ),
            copy.limits.tokens(MAX_ACTIVE_TOKENS, TOKEN_NAME_MAX_LENGTH),
          ].map((line) => (
            <li
              key={line}
              className="min-w-0 break-words bg-background p-3 leading-6"
            >
              {line}
            </li>
          ))}
        </ul>
        <p className="max-w-[68ch]">{copy.limits.unavailable}</p>
      </Section>

      <Section sectionKey="privacy" copy={copy}>
        <p className="max-w-[68ch]">{copy.privacy.intro}</p>
        <ul className="grid min-w-0 gap-px bg-border">
          {[...copy.privacy.logged, ...copy.privacy.notLogged].map((line) => (
            <li
              key={line}
              className="min-w-0 break-words bg-background p-3 leading-6"
            >
              {line}
            </li>
          ))}
        </ul>
        <p className="max-w-[68ch]">{copy.privacy.revoke}</p>
        {features.agentAccess ? (
          <AccountLink label={copy.privacy.accountLink} locale={locale} />
        ) : null}
      </Section>

      <p className="mt-7">
        <Link
          href={localizeHref("/hilfe", locale)}
          className="inline-flex min-h-11 min-w-11 items-center border border-border px-3 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground outline-none transition-colors duration-150 hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange motion-reduce:transition-none"
        >
          {copy.backToHelp}
        </Link>
      </p>
    </article>
  );
}

export default async function EigeneKiHelpPage() {
  const locale = await getRequestLocale();
  return (
    <AgentHelpContent locale={locale} features={getAgentRuntimeFeatures()} />
  );
}
