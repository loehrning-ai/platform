import type { JSX } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyableBlockquote, CopyablePre } from "./markdown-copyable";

/**
 * MarkdownRenderer: the single shared lesson markdown renderer for all three
 * courses (shared course architecture). Replaces the two drifted
 * copies (`lib/course` + `lib/ai-native`).
 *
 * Server Component: the markdown -> HTML pipeline (react-markdown + remark-gfm)
 * runs at render time on the server, so static consumers (Neuigkeiten,
 * course readers) ship no react-markdown in their client bundle. The only
 * interactive part — the `copyable` clipboard button — is a small client island
 * (./markdown-copyable).
 *
 * `copyable` (default `false`) adds a copy-to-clipboard button to every code
 * block and prompt-like blockquote (the AI-Native delight). With it off, the
 * output matches the original KI-Führerschein renderer byte-for-byte.
 */
interface MarkdownRendererProps {
  readonly content: string;
  readonly copyable?: boolean;
}

export function MarkdownRenderer({
  content,
  copyable = false,
}: MarkdownRendererProps): JSX.Element {
  return (
    <div className="prose-kupfer max-w-[76ch]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-6 mt-10 text-3xl font-bold tracking-[-0.03em] text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-8 text-2xl font-bold tracking-[-0.03em] text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-4 list-disc space-y-1.5 text-foreground/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-4 list-decimal space-y-1.5 text-foreground/90">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) =>
            copyable ? (
              <CopyableBlockquote>{children}</CopyableBlockquote>
            ) : (
              <blockquote className="mb-4 border-l-2 border-brand-orange pl-4 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="block overflow-x-auto border border-border bg-card p-4 font-mono text-sm text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="whitespace-normal border border-border bg-card px-1.5 py-0.5 font-mono text-sm text-brand-orange [overflow-wrap:anywhere]">
                {children}
              </code>
            );
          },
          pre: ({ children }) =>
            copyable ? (
              <CopyablePre>{children}</CopyablePre>
            ) : (
              <pre className="mb-4">{children}</pre>
            ),
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-card">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-foreground/90">
              {children}
            </td>
          ),
          hr: () => <hr className="my-8 border-border" />,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-brand-orange underline decoration-brand-orange/30 transition-colors hover:text-kupfer-dark hover:decoration-kupfer-dark/30"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
