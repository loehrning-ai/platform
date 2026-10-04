import type { Locale } from "@/lib/i18n/locale";
import type { OpenSourceArtifact, SoftwareArtifactStatus } from "./artifacts";

export const OPEN_SOURCE_PAGE_COPY = {
  de: {
    metadata: {
      title: "Open Source",
      description:
        "Offene Werkzeuge von loehrning.ai mit öffentlichem Quellstand, Lizenz und Betriebsanleitung.",
      socialDescription:
        "Offene Werkzeuge mit öffentlichem Quellstand, die du selbst betreibst.",
    },
    eyebrow: "Open Source · selbst betreibbar",
    title: "Open-Source-Werkzeuge",
    introduction:
      "Prüfe an echten Ansichten und am Quellstand, was ein Werkzeug leistet, bevor du es auf deinem Rechner betreibst.",
    externalTab: ", öffnet in neuem Tab",
    showcase: {
      heading: "Jetzt veröffentlicht",
      entryCount: (count: number) =>
        count === 1 ? "1 offenes Werkzeug" : `${count} offene Werkzeuge`,
      detail: "Details ansehen",
      source: "Quellcode",
      previewGroup: "Produktansichten auswählen",
      previewCounter: (current: number, total: number) =>
        `Ansicht ${current}/${total}`,
      previewSelect: (label: string) => `${label} anzeigen`,
      previewLabels: ["Editor", "Formular", "YAML", "Darstellung", "PDF"],
      facts: {
        delivery: "Betrieb",
        license: "Lizenz",
        status: "Status",
      },
      delivery: {
        "source-only": "Lokal",
        "internal-route": "Im Browser",
        "external-service": "Externer Dienst",
        "hosted-service": "Gehostet von loehrning.ai · Hetzner EU",
      },
      evidenceSummary: "Quellstand und Veröffentlichung",
      pinnedSource: "Gepinnter Quellstand",
      publicationStandard:
        "Gelistet erst mit öffentlichem Repository, unveränderlichem Commit, eindeutiger Lizenz und vollständiger Betriebsanleitung.",
      licensePolicy: "Lizenzrichtlinie",
    },
    footnoteTitle: "Rechte und Lizenzen",
    footnote:
      "Code, Lerntexte und Medien haben getrennte Lizenzen. Welche gilt, steht jeweils am Projekt.",
    platformCode: "Plattform-Code",
    licensePolicy: "Lizenzrichtlinie",
    courses: "Zu den Kursen zum visuellen Lernen",
  },
  en: {
    metadata: {
      title: "Open source",
      description:
        "Open loehrning.ai tools with a public source revision, license and operating guide.",
      socialDescription:
        "Open tools with a public source revision that you run yourself.",
    },
    eyebrow: "Open source · self-hosted",
    title: "Open source tools",
    introduction:
      "Check real views and the source revision to see what a tool does before you run it on your machine.",
    externalTab: ", opens in a new tab",
    showcase: {
      heading: "Published now",
      entryCount: (count: number) =>
        count === 1 ? "1 open tool" : `${count} open tools`,
      detail: "View details",
      source: "Source",
      previewGroup: "Choose a product view",
      previewCounter: (current: number, total: number) =>
        `View ${current}/${total}`,
      previewSelect: (label: string) => `Show ${label}`,
      previewLabels: ["Editor", "Form", "YAML", "Display", "PDF"],
      facts: {
        delivery: "Run",
        license: "License",
        status: "Status",
      },
      delivery: {
        "source-only": "Local",
        "internal-route": "In browser",
        "external-service": "External service",
        "hosted-service": "Hosted by loehrning.ai · Hetzner EU",
      },
      evidenceSummary: "Source and publication",
      pinnedSource: "Pinned source revision",
      publicationStandard:
        "Listed only with a public repository, immutable commit, unambiguous license, and complete operating guide.",
      licensePolicy: "License policy",
    },
    footnoteTitle: "Rights and licenses",
    footnote:
      "Code, learning text and media carry separate licenses. Each project states which one applies.",
    platformCode: "Platform source",
    licensePolicy: "License policy",
    courses: "Browse visual-learning courses",
  },
} as const;

export const OPEN_SOURCE_SHARED_COPY = {
  de: {
    published: "Veröffentlicht",
    entries: (count: number) =>
      count === 1 ? "1 Eintrag" : `${count} Einträge`,
    kinds: { tool: "Werkzeug", project: "Projekt", video: "Video" },
    statuses: {
      experimental: "Experimentell",
      stable: "Stabil",
      maintenance: "Wartungsmodus",
      archived: "Archiviert",
    },
    detail: "Detail",
    open: "Öffnen",
    practiceExample: "Praxisbeispiel",
    license: "Lizenz",
    source: "Quelle",
    commit: "Commit",
    status: "Status",
    newTab: "Wird in einem neuen Tab geöffnet.",
  },
  en: {
    published: "Published",
    entries: (count: number) => (count === 1 ? "1 entry" : `${count} entries`),
    kinds: { tool: "Tool", project: "Project", video: "Video" },
    statuses: {
      experimental: "Experimental",
      stable: "Stable",
      maintenance: "Maintenance mode",
      archived: "Archived",
    },
    detail: "Details",
    open: "Open",
    practiceExample: "Example",
    license: "License",
    source: "Source",
    commit: "Commit",
    status: "Status",
    newTab: "Opens in a new tab.",
  },
} as const satisfies Record<
  Locale,
  {
    readonly published: string;
    readonly entries: (count: number) => string;
    readonly kinds: Record<OpenSourceArtifact["kind"], string>;
    readonly statuses: Record<SoftwareArtifactStatus, string>;
    readonly detail: string;
    readonly open: string;
    readonly practiceExample: string;
    readonly license: string;
    readonly source: string;
    readonly commit: string;
    readonly status: string;
    readonly newTab: string;
  }
>;

export const OPEN_SOURCE_DETAIL_COPY = {
  de: {
    breadcrumbHome: "Start",
    back: "Open Source",
    transcript: "Transkript lesen",
    videoLabel: "Video",
    language: "Sprache",
    commit: "Commit",
    license: "Lizenz",
    licenseText: "Lizenztext",
    open: "Öffnen",
    sourceRevision: "Quellstand",
    externalTab: ", öffnet in neuem Tab",
  },
  en: {
    breadcrumbHome: "Home",
    back: "Open source",
    transcript: "Read transcript",
    videoLabel: "Video",
    language: "Language",
    commit: "Commit",
    license: "License",
    licenseText: "License text",
    open: "Open",
    sourceRevision: "Source revision",
    externalTab: ", opens in a new tab",
  },
} as const;

export const SOFTWARE_GUIDE_COPY = {
  de: {
    copy: "Kopieren",
    copied: "Kopiert",
    copyCommand: (title: string) => `Befehl für ${title}`,
    publicationStatus: "Veröffentlichungsstatus",
    dataFlow: "Datenfluss",
    shortDemo: "Kurzdemo",
    demoIntroduction:
      "Vier Aufnahmen aus dem gepinnten Quellstand, in der Reihenfolge der Nutzung.",
    prerequisites: "Voraussetzungen",
    installation: "Installation",
    usage: "Verwendung",
    integration: "Integration",
    integrationTargets: "Schnittstellen und Ziele",
    documentation: "Dokumentation und Vertiefung",
    externalTab: ", öffnet in neuem Tab",
  },
  en: {
    copy: "Copy",
    copied: "Copied",
    copyCommand: (title: string) => `Command for ${title}`,
    publicationStatus: "Publication status",
    dataFlow: "Data flow",
    shortDemo: "Short walkthrough",
    demoIntroduction:
      "Four captures from the pinned source revision, in the order you use the tool.",
    prerequisites: "Requirements",
    installation: "Installation",
    usage: "Use",
    integration: "Integration",
    integrationTargets: "Interfaces and targets",
    documentation: "Documentation and further reading",
    externalTab: ", opens in a new tab",
  },
} as const;

const CV_ENGINE_ENGLISH_COPY = {
  eyebrow: "Tool · CV rendering",
  description:
    "Local YAML-to-PDF build for one-page CVs, with a browser editor, A4 preview and optional AI. The build rejects a second page.",
  language: "English",
  guide: {
    statusNote:
      "The cv.yaml schema and templates may still change, there is no hosted instance, and issue responses are not guaranteed. You run the tool yourself on your own computer. Before configuring it, read docs/data-flow.md in the repository. Its diagram shows which data paths stay local.",
    dataFlow:
      "The core runs entirely locally: cv.yaml, fonts and CSS stay in the checkout; the PDF build opens no socket, needs no API key. Unconfigured, the editor talks only to 127.0.0.1 and keeps documents in memory; only the self-hosted Supabase variant (DEPLOY.md) saves them. Optional AI import and text generation call out with your key, or stay local with Ollama.",
    prerequisites: [
      {
        label: "Python 3.13",
        detail:
          "The engine and editor run on CPython 3.13; older versions are untested.",
      },
      {
        label: "Pango and Cairo",
        detail:
          "WeasyPrint uses these system libraries to typeset the PDF. Without them, the first build fails with a library error.",
      },
      {
        label: "Your own API key, optional",
        detail:
          "Only for PDF or DOCX import and generated text. The form, preview and PDF build work without a key.",
      },
    ],
    installation: {
      summary:
        "You pin the checkout to the reviewed source revision and install it in its own virtual environment, with no account, external server or key.",
      steps: [
        {
          title: "Install system libraries",
          detail:
            "On macOS, the command below is enough; on Debian or Ubuntu, use sudo apt install libpango-1.0-0 libpangoft2-1.0-0 libcairo2.",
        },
        {
          title: "Check out the reviewed source revision",
          detail:
            "This guide, its screenshots and checksums belong to exactly this revision.",
        },
        {
          title: "Create a Python virtual environment",
          detail:
            "It keeps the dependencies apart from your global Python installation.",
        },
        {
          title: "Install hash-pinned dependencies",
          detail:
            "requirements.lock records the expected hash for every package; pip stops on any mismatch.",
        },
        {
          title: "Verify the installation with the test suite",
          detail:
            "The suite checks the renderer, schema, importer and security rules without a running server. End-to-end tests need a running editor and are excluded.",
        },
      ],
    },
    usage: {
      summary:
        "You write in the YAML file, try things in the editor and let the build check the page count.",
      steps: [
        {
          title: "Create and edit your local file",
          detail:
            "content/cv.yaml is the durable local source for your CV. Git ignores it so personal data cannot reach a fork by accident.",
        },
        {
          title: "Try the form and preview",
          detail:
            "Flask binds only to 127.0.0.1:5567. Form or raw YAML is on the left, the A4 page WeasyPrint prints on the right; the badge shows the page count, green for one page and red from two. This mode keeps everything in memory and does not write content/cv.yaml, so download the PDF before you stop the process.",
        },
        {
          title: "Change the layout instead of deleting content",
          detail:
            "Eight templates are included: classic, modern, sidebar, executive, technical, ats-compact, consulting and minimal. Themes set accent colour, font and density; you can override density per build.",
        },
        {
          title: "Let the build decide",
          detail:
            "engine/build.py renders the PDF and counts its pages. One page returns exit code 0 and writes output/cv.pdf. With two pages, no PDF is written; the command reports the first heading on the overflow page to stderr, for example First section on the overflow page: 'Projects', and returns exit code 1.",
        },
      ],
    },
    integration: {
      summary:
        "content/cv.yaml is a plain text file, so Git, the importer and CI work with it directly.",
      steps: [
        {
          title: "Version the CV",
          detail:
            "Every change becomes a diff you can still read years later. Version content/cv.yaml only in your own private repository.",
        },
        {
          title: "Import existing files",
          detail:
            "The importer converts rendercv YAML and plain text deterministically, without a provider or network. PDF and DOCX go through the selected AI provider with your key; without a key, this path stops with an error.",
        },
        {
          title: "Add the build to a pipeline",
          detail:
            "The exit code is the interface: 0 only for exactly one page. That makes the command a CI gate without extra code.",
        },
      ],
    },
    documentation: { label: "README in the repository" },
    screenshot: {
      alt: "The editor: YAML on the left, the A4 preview with its 1 page badge on the right.",
    },
    demo: [
      {
        alt: "The editor form at Experience: one card per entry with labelled fields for role, company, period and bullet points, plus reorder arrows.",
        caption:
          "Every field has a visible label. Reorder and shorten lists without touching YAML.",
      },
      {
        alt: "The same screen with the YAML tab active: raw text with syntax highlighting on the left, the unchanged A4 preview on the right.",
        caption:
          "The YAML tab lets you write text directly. Form and file share one source.",
      },
      {
        alt: "The display panel open above the form: controls for accent colour, font, density and paper tone, then presets such as Default, Forest and Harvard Crimson.",
        caption:
          "If the text does not fit on one page, change the accent, font or density.",
      },
      {
        alt: "The finished PDF as one A4 page with header, experience, education, skills and projects.",
        caption:
          "The build delivers exactly one page.",
      },
    ],
    relatedLearning: [
      {
        title: "AI-native work course",
        description:
          "Practise reviewing AI output, such as the import from your old PDF.",
      },
    ],
  },
} as const;

/**
 * Returns display copy only. Publication identifiers, URLs, commits, commands,
 * hashes, licenses, dimensions, and lifecycle fields always come from the
 * validated registry record.
 */
export function localizeOpenSourceArtifact<Artifact extends OpenSourceArtifact>(
  artifact: Artifact,
  locale: Locale,
): Artifact {
  if (
    locale === "de" ||
    artifact.id !== "tool:cv-engine" ||
    artifact.kind !== "tool"
  ) {
    return artifact;
  }

  const copy = CV_ENGINE_ENGLISH_COPY;
  const guide = artifact.guide;
  return {
    ...artifact,
    eyebrow: copy.eyebrow,
    description: copy.description,
    language: copy.language,
    guide: {
      ...guide,
      statusNote: copy.guide.statusNote,
      dataFlow: copy.guide.dataFlow,
      prerequisites: guide.prerequisites.map((item, index) => ({
        ...item,
        ...copy.guide.prerequisites[index],
      })),
      installation: {
        ...guide.installation,
        summary: copy.guide.installation.summary,
        steps: guide.installation.steps.map((step, index) => ({
          ...step,
          ...copy.guide.installation.steps[index],
        })),
      },
      usage: {
        ...guide.usage,
        summary: copy.guide.usage.summary,
        steps: guide.usage.steps.map((step, index) => ({
          ...step,
          ...copy.guide.usage.steps[index],
        })),
      },
      integration: {
        ...guide.integration,
        summary: copy.guide.integration.summary,
        steps: guide.integration.steps.map((step, index) => ({
          ...step,
          ...copy.guide.integration.steps[index],
        })),
      },
      documentation: {
        ...guide.documentation,
        ...copy.guide.documentation,
      },
      screenshot: {
        ...guide.screenshot,
        ...copy.guide.screenshot,
      },
      demo: guide.demo?.map((step, index) => ({
        ...step,
        ...copy.guide.demo[index],
      })),
      relatedLearning: guide.relatedLearning.map((item, index) => ({
        ...item,
        ...copy.guide.relatedLearning[index],
      })),
    },
  } as Artifact;
}
