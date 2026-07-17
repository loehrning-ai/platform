"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
     
    console.error("[/demos] boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-20 text-center">
      <div className="font-mono text-xs uppercase tracking-[0.14em] text-brand-orange">
        ◆ Praxisbeispiel-Galerie derzeit nicht verfügbar
      </div>
      <h1 className="mt-4 max-w-xl text-3xl font-bold tracking-[-0.02em]">
        Wir konnten die Praxisbeispiel-Galerie gerade nicht laden.
      </h1>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">
        Das ist selten. Versuche es gleich nochmal, oder schau dir die Kurse an.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
        >
          Nochmal versuchen
        </button>
        <Link
          href="/kurse"
          className="border border-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Zurück zu den Kursen
        </Link>
      </div>
    </div>
  );
}
