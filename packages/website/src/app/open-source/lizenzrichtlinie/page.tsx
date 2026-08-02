import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { readRootLicensePolicy } from "@/lib/open-source/license-policy.server";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPublicPageMetadata({
  title: "Lizenzrichtlinie",
  description:
    "Verbindliche Lizenzzuordnung für Code, Lerninhalte, Medien, Schriften und Marken der loehrning.ai Lernplattform.",
  path: "/open-source/lizenzrichtlinie",
});

export const dynamic = "force-static";

export default function LicensePolicyPage() {
  const policy = readRootLicensePolicy();

  return (
    <section className="py-20" aria-labelledby="license-policy-title">
      <div className="mx-auto max-w-4xl px-6">
        <Link
          href="/open-source"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Open Source
        </Link>
        <div className="mt-10 h-[3px] w-28 bg-brand-orange" />
        <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          Repository-Richtlinie
        </p>
        <h1
          id="license-policy-title"
          className="mt-5 text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl"
        >
          Lizenzrichtlinie
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Diese Seite wird beim Build direkt aus der verbindlichen Datei{" "}
          <code className="text-foreground">LICENSE_POLICY.md</code> im
          Repository-Stamm erzeugt. Der folgende Quelltext ist keine getrennte
          redaktionelle Kopie.
        </p>
        <dl className="mt-6 border border-border bg-card/35 p-4 text-sm">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              SHA-256 des Richtlinientexts
            </dt>
            <dd className="mt-2 break-all font-mono text-xs text-foreground">
              {policy.sha256}
            </dd>
          </div>
        </dl>
        <pre className="mt-8 overflow-x-auto whitespace-pre-wrap border border-border bg-card p-5 font-mono text-sm leading-relaxed text-foreground">
          <code>{policy.markdown}</code>
        </pre>
      </div>
    </section>
  );
}
