import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";
import type { Book } from "@/lib/books";
import type {
  LoadedChapter,
  ChapterNeighbours,
  BookChapterMeta,
} from "@/lib/book-reader-content";
import { CalloutRenderer } from "./callout-renderer";
import { ChapterReaderClient } from "./chapter-reader-client";

interface ChapterReaderProps {
  readonly book: Book;
  readonly chapter: LoadedChapter;
  readonly neighbours: ChapterNeighbours;
  readonly allChapters: readonly BookChapterMeta[];
}

/**
 * Server Component shell for the book chapter reader. The markdown body
 * (react-markdown + remark/rehype pipeline) renders on the server; only the
 * interactive chrome (scroll progress, TOC scroll-spy, arrow-key navigation)
 * ships as a client island (./chapter-reader-client), which receives the
 * rendered article via the `content` prop. The page's props are unchanged.
 */
export function ChapterReader({
  book,
  chapter,
  neighbours,
  allChapters,
}: ChapterReaderProps) {
  const content = (
    <article
      aria-label={chapter.meta.title}
      // Prose colours are bound to the theme CSS variables, NOT the fixed
      // `prose-invert` (which forced light text and produced a 1.3:1
      // light-on-light body on the default Kalkweiss page - release hardening). The
      // vars flip with `prefers-color-scheme`, so body text is the
      // AAA-tuned muted-foreground (#4f4640 ~7:1 on light) in light mode
      // and the light token in dark mode. Tailwind darkMode is "class"
      // here, so `dark:prose-invert` would never fire under the media-query
      // theme; the var binding is the theme-aware fix.
      className="prose prose-stone max-w-[70ch] [--tw-prose-body:var(--color-muted-foreground)] [--tw-prose-headings:var(--color-foreground)] [--tw-prose-bold:var(--color-foreground)] [--tw-prose-quotes:var(--color-foreground)] [--tw-prose-bullets:var(--color-muted-foreground)] [--tw-prose-counters:var(--color-muted-foreground)] [--tw-prose-captions:var(--color-muted-foreground)] prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-brand-orange prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-card/60 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-pre:bg-stone-900 prose-table:text-sm"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeAutolink, { behavior: "wrap" }]]}
        components={{
          blockquote: ({ children }) => (
            <CalloutRenderer>{children}</CalloutRenderer>
          ),
          // GitHub-Flavored-Markdown renders "- [ ]" lines as disabled
          // checkbox inputs. They are decorative (the list text carries
          // the meaning) and unlabeled, which axe/Lighthouse flag as a
          // "label" violation. Hide them from assistive tech (release hardening).
          input: ({ type, ...rest }) =>
            type === "checkbox" ? (
              <input
                type="checkbox"
                {...rest}
                aria-hidden="true"
                tabIndex={-1}
              />
            ) : (
              <input type={type} {...rest} />
            ),
          // Book tables are wider than a phone viewport; without a
          // scroll container they clip past 390px (regression coverage
          // mobile finding). The wrapper keeps the page itself free of
          // horizontal overflow while the table scrolls in place. It is
          // keyboard-focusable with an accessible name so keyboard users
          // can scroll it (WCAG scrollable-region-focusable, release hardening).
          table: ({ children }) => (
            <div
              className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
              data-horizontal-scroll
              tabIndex={0}
              role="group"
              aria-label="Tabelle, horizontal scrollbar"
            >
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {chapter.rawMarkdown}
      </ReactMarkdown>
    </article>
  );

  return (
    <ChapterReaderClient
      book={book}
      chapterMeta={chapter.meta}
      headings={chapter.headings}
      readingTimeMinutes={chapter.readingTimeMinutes}
      neighbours={neighbours}
      allChapters={allChapters}
      content={content}
    />
  );
}
