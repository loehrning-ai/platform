"use client";

import { Download } from "lucide-react";
import { CommandBlock } from "@/components/open-source/command-block";
import { CommandCopyButton } from "@/components/open-source/command-copy-button";
import type { Locale } from "@/lib/i18n/locale";
import { CV_LIVE_COPY } from "@/lib/open-source/cv-live/copy";
import type { CvLiveState } from "@/lib/open-source/cv-live/live-data";
import { CV_LIVE_COMMAND } from "@/lib/open-source/cv-live/pin";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/yaml" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The take-home for the state on screen: PDF, cv.yaml, build command, prompt. */
export function CvLiveTakeHome({
  locale,
  state,
  yaml,
}: {
  readonly locale: Locale;
  readonly state: CvLiveState;
  readonly yaml: string;
}) {
  const copy = CV_LIVE_COPY[locale];
  const row =
    "grid gap-3 border-t border-foreground py-5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-6";
  const title = "text-base font-bold tracking-[-0.01em]";
  const detail = "text-pretty text-sm leading-relaxed text-muted-foreground";
  const action =
    "inline-flex min-h-11 w-fit items-center gap-2 border-2 border-foreground bg-background px-4 text-sm font-semibold text-foreground transition-colors duration-100 hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange";
  const pdfName = state.pdf?.href.split("/").at(-1) ?? "";

  return (
    <section aria-labelledby="cv-live-take-home" className="mt-12 sm:mt-16" data-cv-take-home="">
      <h2 id="cv-live-take-home" className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">
        {copy.takeHome}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {copy.takeHomeLead}
      </p>
      <div className="mt-6 border-b border-foreground">
        <div className={row}>
          <h3 className={title}>{copy.pdfTitle}</h3>
          <div className="flex flex-col gap-3">
            {state.pdf ? (
              <>
                <p className={`${detail} break-all`}>
                  {copy.pdfFile(pdfName, Math.round(state.pdf.sizeBytes / 1024))}
                </p>
                <a href={state.pdf.href} download className={action} data-cv-pdf="">
                  <Download size={16} aria-hidden="true" />
                  {copy.pdfButton}
                </a>
              </>
            ) : (
              <p className={detail}>{state.exitCode === 1 ? copy.noPdf : copy.pdfMissing}</p>
            )}
          </div>
        </div>
        <div className={row}>
          <h3 className={`${title} font-mono`}>{copy.yamlTitle}</h3>
          <div className="flex flex-col gap-3">
            <p className={detail}>{copy.yamlDetail}</p>
            <button
              type="button"
              className={action}
              data-cv-yaml=""
              onClick={() => download("cv.yaml", yaml)}
            >
              <Download size={16} aria-hidden="true" />
              {copy.yamlButton}
            </button>
          </div>
        </div>
        <div className={row}>
          <h3 className={title}>{copy.cliTitle}</h3>
          <div className="flex min-w-0 flex-col gap-3">
            <p className={detail}>{copy.cliDetail}</p>
            <CommandBlock command={CV_LIVE_COMMAND} label={copy.cliLabel} locale={locale} />
          </div>
        </div>
        <div className={row}>
          <h3 className={title}>{copy.promptTitle}</h3>
          <div className="flex min-w-0 flex-col gap-3">
            <p className={detail}>{copy.promptDetail}</p>
            <div className="flow-root border border-foreground bg-background p-1.5">
              <CommandCopyButton
                command={copy.prompt}
                label={copy.promptLabel}
                locale={locale}
                className="float-right ml-2"
              />
              <p className="px-1.5 py-2 text-sm leading-relaxed">{copy.prompt}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
