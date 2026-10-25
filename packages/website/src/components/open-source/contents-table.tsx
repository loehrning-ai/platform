import type { Locale } from "@/lib/i18n/locale";
import type { ProjectArtifact, ToolArtifact } from "@/lib/open-source/artifacts";
import {
  OPEN_SOURCE_PAGE_COPY,
  localizeOpenSourceArtifact,
} from "@/lib/open-source/display-copy";

const ROW =
  "grid grid-cols-[2.25rem_minmax(0,0.8fr)_minmax(0,1.6fr)] gap-x-3 md:grid-cols-[2.25rem_minmax(0,0.8fr)_minmax(0,1.6fr)_3.5rem_4.5rem]";

/** The specimen book's contents: one row per plate, newest first. */
export function ContentsTable({
  entries,
  locale,
}: {
  readonly entries: readonly {
    readonly artifact: ToolArtifact | ProjectArtifact;
    readonly number: string;
  }[];
  readonly locale: Locale;
}) {
  const copy = OPEN_SOURCE_PAGE_COPY[locale];
  return (
    <nav aria-label={copy.contents.label} className="min-w-0">
      <p
        aria-hidden="true"
        className={`${ROW} border-b border-foreground pb-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground`}
      >
        <span>{copy.contents.number}</span>
        <span>{copy.contents.tool}</span>
        <span>{copy.contents.formula}</span>
        <span className="hidden md:inline">{copy.contents.license}</span>
        <span className="hidden md:inline">{copy.contents.revision}</span>
      </p>
      <ol>
        {entries.map(({ artifact: registryArtifact, number }) => {
          const artifact = localizeOpenSourceArtifact(registryArtifact, locale);
          const formula = artifact.guide.formula;
          return (
            <li key={artifact.id}>
              <a
                href={`#nr-${number}`}
                className={`${ROW} min-h-11 items-center border-b border-[var(--color-hairline)] py-2 text-sm text-foreground transition-colors duration-100 hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background`}
              >
                <span className="font-mono font-bold">{number}</span>
                <span className="font-semibold">{artifact.title}</span>
                <span className="min-w-0 text-pretty">
                  {formula ? (
                    <>
                      <code className="font-mono">{formula.input}</code>
                      {" "}
                      <span aria-hidden="true">→</span>
                      {" "}
                      {formula.output}
                    </>
                  ) : (
                    artifact.description
                  )}
                </span>
                <span className="hidden font-mono text-xs md:inline">
                  {artifact.license.licenseId ?? ""}
                </span>
                <span className="hidden font-mono text-xs md:inline">
                  {artifact.source.revision.slice(0, 7)}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
