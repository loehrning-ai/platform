import Link from "next/link";
import { Github, Linkedin } from "@/components/icons/brand";
import { STAND_DATE, LAST_UPDATED } from "@/lib/content-meta";
import { GITHUB_ORG, TIM_ENTITY } from "@/lib/seo/entity";

export function Footer() {
  // Keep static output reproducible. The public content date is the explicit
  // update signal and advances through reviewed source changes.
  const year = LAST_UPDATED.slice(0, 4);

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <span className="text-lg font-bold text-foreground">
              loehrning<span className="text-brand-orange">.ai</span>
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Kurse, Bücher, Demos und Arbeitsnotizen.
              <br />
              KI-native Arbeit, öffentlich dokumentiert.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Lernen</h2>
              <div className="flex flex-col gap-2">
                <Link
                  href="/kurse"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Alle Kurse
                </Link>
                <Link
                  href="/ki-fuehrerschein"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  KI-Führerschein
                </Link>
                <Link
                  href="/ki-und-gesellschaft"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  KI und Gesellschaft
                </Link>
                <Link
                  href="/eu-ai-act-kurs"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  EU AI Act Kurs
                </Link>
                <Link
                  href="/ai-native"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  AI-Native Arbeitskurs
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Anwenden</h2>
              <div className="flex flex-col gap-2">
                <Link
                  href="/blog"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
                <Link
                  href="/buecher"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Lernbücher
                </Link>
                <Link
                  href="/demos"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Praxisbeispiele
                </Link>
                <Link
                  href="/workshops"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Workshops
                </Link>
                <Link
                  href="/open-source"
                  prefetch={false}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Open Source
                </Link>
              </div>
            </div>
          </div>

          {/* Legal & Support */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Plattform
            </h2>
            <div className="flex flex-col gap-2">
              <Link
                href="/ueber-mich"
                prefetch={false}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Über Tim
              </Link>
              <Link
                href="/neuigkeiten"
                prefetch={false}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Neuigkeiten
              </Link>
              <Link
                href="/hilfe"
                prefetch={false}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Hilfe
              </Link>
              <Link
                href="/bekannte-grenzen"
                prefetch={false}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Bekannte Grenzen
              </Link>
              <Link
                href="/feedback"
                prefetch={false}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Rückmeldung
              </Link>
              <Link
                href="/impressum"
                prefetch={false}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Impressum
              </Link>
              <Link
                href="/datenschutz"
                prefetch={false}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Datenschutz
              </Link>
              <Link
                href="/open-source/lizenzrichtlinie"
                prefetch={false}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Lizenzrichtlinie
              </Link>
              <Link
                href="/ueber-die-plattform"
                prefetch={false}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Über die Plattform
              </Link>
              <a
                href={GITHUB_ORG.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub-Organisation
              </a>
            </div>
            <div className="flex gap-4 pt-2">
              <a
                href={TIM_ENTITY.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a
                href={GITHUB_ORG.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub-Organisation loehrning-ai"
              >
                <Github size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-2 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <span>
            &copy; {year} loehrning.ai · Tim Löhr
          </span>
          <span
            data-testid="footer-data-pill"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
          >
            Datenstand: {STAND_DATE} · Letzte Aktualisierung: {LAST_UPDATED}
          </span>
        </div>
      </div>
    </footer>
  );
}
