import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import type { JsonLdGraph } from "@/lib/seo/json-ld";
import {
  getImportedCourse,
  IMPORTED_COURSE_CATALOG,
} from "@/lib/courses/catalog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return IMPORTED_COURSE_CATALOG.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getImportedCourse(slug);
  if (!course) return {};
  const socialImage = {
    url: `${SITE_URL}${course.href}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${course.title} Open-Source-Interaktivkurs auf loehrning.ai`,
  };

  return {
    title: `${course.title}: Open-Source-Interaktivkurs`,
    description: course.description,
    robots: { index: true, follow: true },
    alternates: { canonical: course.href },
    openGraph: {
      title: `${course.title}: Open-Source-Interaktivkurs`,
      description: course.description,
      url: `${SITE_URL}${course.href}`,
      siteName: "loehrning.ai",
      locale: "de_DE",
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.title}: Open-Source-Interaktivkurs`,
      description: course.description,
      images: [{ url: socialImage.url, alt: socialImage.alt }],
    },
  };
}

export default async function OpenSourceCoursePage({ params }: PageProps) {
  const { slug } = await params;
  const course = getImportedCourse(slug);
  if (!course) notFound();

  const courseJsonLd: JsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Kurse",
            item: `${SITE_URL}/kurse`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: course.title,
            item: `${SITE_URL}${course.href}`,
          },
        ],
      },
      {
        "@type": "Course",
        name: course.title,
        description: course.description,
        url: `${SITE_URL}${course.href}`,
        inLanguage: course.language === "Englisch" ? "en" : "de",
        isAccessibleForFree: true,
        provider: { "@id": ORG_ID },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: course.launchHref,
        },
        teaches: course.topics,
        about: course.topics.map((topic) => ({ "@type": "Thing", name: topic })),
        license: course.licenseHref.startsWith("/")
          ? `${SITE_URL}${course.licenseHref}`
          : course.licenseHref,
      },
    ],
  };

  return (
    <>
      <JsonLd data={courseJsonLd} id={`open-source-course-${course.slug}-jsonld`} />
      <section className="mx-auto max-w-[1180px] px-6 pb-32 pt-20">
        <Link
          href="/kurse"
          className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Zur Kursübersicht
        </Link>

        <div className="mt-8 h-[3px] w-[154px] bg-brand-orange" />

        <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.65fr)] lg:items-start">
          <section>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              {course.eyebrow}
            </p>
            <h1 className="mt-6 max-w-[900px] text-[40px] font-bold leading-[0.96] tracking-[-0.045em] text-foreground sm:text-[56px] md:text-[76px]">
              {course.title}
            </h1>
            <p className="mt-7 max-w-[760px] text-[20px] font-semibold leading-[1.35] tracking-[-0.02em] text-foreground">
              {course.tagline}
            </p>
            <p className="mt-5 max-w-[760px] text-[17px] leading-[1.65] text-muted-foreground">
              {course.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {course.sourceFacts.map((fact) => (
                <span
                  key={fact}
                  className="border border-foreground bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-foreground"
                >
                  {fact}
                </span>
              ))}
              {course.topics.map((topic) => (
                <span
                  key={topic}
                  className="border border-border bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {topic}
                </span>
              ))}
            </div>

            <div className="mt-10 grid gap-4 border-y border-border py-5 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  Umfang
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {course.lessonCountLabel === `${course.unitCount} ${course.unitLabel}`
                    ? course.lessonCountLabel
                    : `${course.unitCount} ${course.unitLabel} · ${course.lessonCountLabel}`}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  Dauer
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {course.duration}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  Sprache · Lizenz
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {course.language} · MIT
                </p>
              </div>
            </div>

            <section
              aria-labelledby="integration-heading"
              className="mt-10 border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_var(--color-foreground)]"
            >
              <h2
                id="integration-heading"
                className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange"
              >
                Integration auf loehrning.ai
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                {course.integrationNote}
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Die Kursübersicht, Detailseiten, Lizenzverweise und Quellen sind in
                den Stil dieser Plattform eingebunden. Der interaktive Kurs selbst
                bleibt als Open-Source-Browserkurs erhalten, damit seine Simulatoren
                ohne globale Sicherheitslockerung der Website funktionieren.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Der Start-Button öffnet timloehr.me in einem neuen Tab. Dort läuft
                der eigenständige Kurs mit eigener Browser-Speicherung; Fortschritt
                und Zertifikate auf loehrning.ai bleiben davon getrennt.
              </p>
            </section>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href={course.launchHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-[#A5370F] hover:shadow-[6px_6px_0_var(--color-foreground)]"
              >
                Extern öffnen
                <span className="sr-only">: {course.title} auf timloehr.me, neuer Tab</span>
                <ExternalLink size={15} aria-hidden="true" />
              </a>
              <a
                href={course.sourceCommitHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card hover:shadow-[6px_6px_0_var(--color-foreground)]"
              >
                GitHub-Quelle
                <span className="sr-only"> für {course.title}, neuer Tab</span>
                <Github size={15} aria-hidden="true" />
              </a>
              <Link
                href={course.licenseHref}
                className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card hover:shadow-[6px_6px_0_var(--color-foreground)]"
              >
                MIT-Lizenz
                <span className="sr-only"> für {course.title}</span>
              </Link>
            </div>
          </section>

          <aside
            aria-labelledby="course-aside-heading"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <div className="border-2 border-foreground bg-background p-3 shadow-[6px_6px_0_var(--color-foreground)]">
              <div className="relative aspect-[16/10] overflow-hidden border border-border bg-card">
                <Image
                  src={course.imageSrc}
                  alt={course.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="mt-6 border border-border bg-card p-5">
              <h2
                id="course-aside-heading"
                className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange"
              >
                Warum nicht direkt eingebettet?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Die Quellkurse sind eigenständige HTML/CSS/JS-Browserkurse. Eine
                direkte Einbettung würde fremde globale Skripte, eigene
                localStorage-Stores und lockerere CSP-Regeln benötigen. Diese
                Plattform hält die Sicherheitsgrenze bewusst enger.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
