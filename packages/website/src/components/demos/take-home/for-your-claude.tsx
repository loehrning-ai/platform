import { ArrowGlyph } from "@/components/werk";
import { CLAUDE_UI, fillSkillName } from "@/lib/claude-ui";
import { TAKEHOME_TARGET_ID } from "@/lib/demo-beats";
import { takeHomeFor } from "@/lib/demo-takehome";
import { resolveKit } from "@/lib/demo-takehome.server";
import type { DemoSlug } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import type { Locale } from "@/lib/i18n/locale";
import { downloadPathFor, VORLAGEN } from "@/lib/vorlagen/registry";
import { CopyButton } from "./copy-button";
import { PersonalLine } from "./personal-line";
import { ShareLink } from "./share-link";
import { FILE_CHIP, TAKEHOME_BUTTON } from "./styles";

const TAKEHOME_ANCHOR = TAKEHOME_TARGET_ID;

/** "27 KB", "1,2 MB" in German; "27 KB", "1.2 MB" in English. */
export function formatBytes(bytes: number, locale: Locale): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `${locale === "de" ? mb.replace(".", ",") : mb} MB`;
}

function DownloadButton({ href, label, fileName }: { readonly href: string; readonly label: string; readonly fileName: string }) {
  return (
    <a href={href} download={fileName} className={TAKEHOME_BUTTON} data-download={fileName}>
      <span>{label}</span>
      <ArrowGlyph direction="down" className="size-4" />
    </a>
  );
}

const ROW = "border-t-2 border-foreground py-5";
const ROW_HEAD = "text-[1.0625rem] font-bold";
const ROW_TEXT = "mt-1 max-w-[60ch] text-[0.9375rem] leading-normal text-muted-foreground text-pretty";
const ROW_ACTION = "mt-3 flex flex-wrap items-center gap-3";

/**
 * "Für deinen Claude" / "For your Claude": the one take-home block every v3
 * demo renders after the closing band. Server-rendered, always open (nothing
 * collapses), three small client islands (the personal line, copy, share).
 * Renders nothing for a demo without an entry in DEMO_TAKEHOME.
 */
export function ForYourClaude({ slug, locale }: { readonly slug: DemoSlug; readonly locale: Locale }) {
  const entry = takeHomeFor(slug);
  if (!entry) return null;
  const copy = DEMOS_PAGE_COPY[locale].takeHome;
  const ui = CLAUDE_UI[locale];
  const kit = resolveKit(entry.kit[locale]);
  const skill = entry.skill.locales?.[locale] ?? entry.skill.name;
  const templates = entry.templates.map(({ vorlage }) => {
    const found = VORLAGEN.find((item) => item.slug === vorlage && item.kind === "template");
    if (!found) throw new Error(`demo ${slug}: ${vorlage} is not a template in VORLAGEN`);
    return { slug: vorlage, fileName: found.downloadNames[locale], href: downloadPathFor(vorlage, locale) };
  });

  return (
    <section
      id={TAKEHOME_ANCHOR}
      aria-labelledby={`${TAKEHOME_ANCHOR}-title`}
      data-takehome={slug}
      className="mx-auto mt-12 max-w-[75rem] scroll-mt-24 px-4 sm:mt-16 sm:px-6"
    >
      <h2 id={`${TAKEHOME_ANCHOR}-title`} className="text-[1.75rem] font-black leading-tight sm:text-[2.25rem]">
        {copy.heading}
      </h2>
      <p className="mt-2 max-w-[56ch] text-[1.0625rem] leading-snug text-pretty">{copy.lede}</p>

      <ol className="mt-6 list-none p-0" data-takehome-rows="">
        <PersonalLine
          slug={slug}
          heading={copy.lineHeading}
          note={copy.lineNote}
          copyLabel={copy.copy}
          copiedLabel={copy.copied}
        />

        <li className={ROW} data-takehome-row="kit">
          <h3 className={ROW_HEAD}>{copy.kitHeading}</h3>
          <p className={ROW_TEXT}>{copy.kitLead}</p>
          <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
            {kit.shown.map((file) => (
              <li key={file} className={FILE_CHIP} data-kit-file={file}>
                {file.split("/").slice(1).join("/") || file}
              </li>
            ))}
          </ul>
          <div className={ROW_ACTION}>
            <DownloadButton href={kit.href} label={copy.kitButton} fileName={kit.fileName} />
            <span className="text-[0.875rem] text-muted-foreground">
              {copy.kitMeta(kit.fileName, formatBytes(kit.bytes, locale))}
            </span>
          </div>
        </li>

        <li className={ROW} data-takehome-row="skill">
          <h3 className={ROW_HEAD}>{copy.skillHeading}</h3>
          <p className={ROW_TEXT}>{copy.skillLead(skill)}</p>
          <div className={ROW_ACTION}>
            <DownloadButton href={`/skills/${skill}.zip`} label={copy.skillButton} fileName={`${skill}.zip`} />
          </div>
        </li>

        <li className={ROW} data-takehome-row="instructions">
          <h3 className={ROW_HEAD}>{copy.instructionsHeading}</h3>
          <p className={ROW_TEXT}>{copy.instructionsLead(entry.kit[locale].instructions.split("/").slice(1).join("/"))}</p>
          <pre
            className="mt-3 max-h-[18rem] overflow-auto whitespace-pre-wrap border border-foreground bg-card p-3 font-mono text-[0.8125rem] leading-relaxed [overflow-wrap:anywhere]"
            data-instructions=""
            tabIndex={0}
          >
            {kit.instructions}
          </pre>
          <div className={ROW_ACTION}>
            <CopyButton text={kit.instructions} label={copy.copy} doneLabel={copy.copied} />
          </div>
        </li>

        {templates.length > 0 ? (
          <li className={ROW} data-takehome-row="templates">
            <h3 className={ROW_HEAD}>{copy.templatesHeading}</h3>
            <ul className="mt-3 flex list-none flex-col gap-2 p-0">
              {templates.map((template) => (
                <li key={template.slug} className="flex flex-wrap items-center gap-3">
                  <span className={FILE_CHIP}>{template.fileName}</span>
                  <DownloadButton href={template.href} label={copy.templateButton} fileName={template.fileName} />
                </li>
              ))}
            </ul>
          </li>
        ) : null}

        <li className={ROW} data-takehome-row="install">
          <h3 className={ROW_HEAD}>{copy.installHeading}</h3>
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-[0.9375rem] font-bold">{ui.app.heading}</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.9375rem] leading-normal">
                {ui.app.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-2 text-[0.875rem] text-muted-foreground">{ui.app.adminNote}</p>
            </div>
            <div>
              <h4 className="text-[0.9375rem] font-bold">{ui.code.heading}</h4>
              <p className="mt-2 text-[0.9375rem]">{ui.code.allProjectsLabel}</p>
              <code className="mt-1 block bg-inset px-2 py-1 font-mono text-[0.8125rem] [overflow-wrap:anywhere]">
                {fillSkillName(ui.code.allProjects, skill)}
              </code>
              <p className="mt-2 text-[0.9375rem]">{ui.code.thisRepoLabel}</p>
              <code className="mt-1 block bg-inset px-2 py-1 font-mono text-[0.8125rem] [overflow-wrap:anywhere]">
                {fillSkillName(ui.code.thisRepo, skill)}
              </code>
              <p className="mt-2 text-[0.875rem] text-muted-foreground [overflow-wrap:anywhere]">
                {fillSkillName(ui.code.result, skill)}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-[0.9375rem] font-semibold">{ui.noSync}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-[0.9375rem] font-bold">{ui.project.heading}</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.9375rem] leading-normal">
                {ui.project.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-2 text-[0.875rem] text-muted-foreground">{ui.project.plans}</p>
            </div>
          </div>
        </li>

        <li className={ROW} data-takehome-row="share">
          <p className="max-w-[60ch] text-[0.9375rem] leading-normal text-pretty">{copy.phoneLine}</p>
          <div className={ROW_ACTION}>
            <ShareLink label={copy.share} copiedLabel={copy.shareCopied} title={copy.heading} />
          </div>
        </li>
      </ol>
    </section>
  );
}
