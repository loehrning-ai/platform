import { Download } from "lucide-react";
import type { VorlageDownload } from "@/lib/vorlagen-shared";

interface DownloadButtonsProps {
  readonly slug: string;
  readonly downloads: readonly VorlageDownload[];
  readonly variant?: "primary" | "secondary";
}

export function DownloadButtons({
  slug,
  downloads,
  variant = "primary",
}: DownloadButtonsProps) {
  if (variant === "secondary") {
    return (
      <div className="flex flex-wrap gap-2">
        {downloads.map((download) => (
          <a
            key={download.format}
            href={download.href}
            download={slug + "." + download.format}
            className="inline-flex items-center gap-1.5 rounded-none border border-border bg-card/40 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
          >
            <Download className="h-3 w-3" aria-hidden="true" />
            {download.format.toUpperCase()}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {downloads.map((download) => (
        <a
          key={download.format}
          href={download.href}
          download={slug + "." + download.format}
          className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-foreground bg-brand-orange px-5 py-3 font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)]"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {download.label}
        </a>
      ))}
    </div>
  );
}
