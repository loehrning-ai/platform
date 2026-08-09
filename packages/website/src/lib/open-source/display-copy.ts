import type { Locale } from "@/lib/i18n/locale";
import type {
  OpenSourceArtifact,
  SoftwareArtifactStatus,
} from "./artifacts";

export const OPEN_SOURCE_PAGE_COPY = {
  de: {
    metadata: {
      title: "Open Source",
      description:
        "Veröffentlichte Werkzeuge von loehrning.ai mit öffentlichem Repository, festem Quellstand, Lizenz und Betriebsanleitung.",
      socialDescription:
        "Veröffentlichte Werkzeuge mit öffentlichem Repository, festem Commit, Lizenz und Anleitung.",
    },
    eyebrow: "Open Source",
    title: "Veröffentlichte Werkzeuge. Quellstand prüfbar.",
    introductionPrefix: "Hier stehen veröffentlichte Artefakte der GitHub-Organisation",
    introductionSuffix:
      ". Jeder Eintrag nennt Repository, unveränderlichen Commit, Lizenz, Installationsweg, Datenfluss und bekannte Grenzen. Andere Repositories der Organisation sind nicht automatisch veröffentlichte Plattform-Artefakte.",
    coursesPrefix: "Die technischen Lernkurse findest du unter",
    sourcePrinciple: "Quellenprinzip",
    sourcePlatform: "Quellplattform",
    snapshot: "Stand",
    externalTab: ", öffnet in neuem Tab",
    repositoryLanguage:
      "Die Repositories, Anleitungen und Commits auf GitHub sind auf Englisch. Diese Seite bleibt deutsch.",
    publicationStandard: "Veröffentlichungsstandard",
    publicationStandardBody:
      "Ein Eintrag erscheint hier erst mit vier Nachweisen: einem öffentlichen GitHub-Repository, einem unveränderlichen Commit als geprüftem Quellstand, einer eindeutigen Lizenz mit lokal gespeicherter Kopie und einer Anleitung für Installation, Verwendung und Integration. Unvollständige Einträge werden nicht gelistet.",
    codeAndEditorial: "Code und redaktionelle Inhalte",
    platformCode: "Plattform-Code auf GitHub",
    codeAndEditorialBefore:
      "Der",
    codeAndEditorialMiddle:
      "steht unter MIT. Sichtbarer Quelltext bedeutet nicht automatisch freie Wiederverwendung aller Lerntexte, Marken- oder Medieninhalte. Die verbindliche Zuordnung steht in der",
    licensePolicy: "Lizenzrichtlinie",
    codeAndEditorialAfter:
      "und in den Lizenzangaben jedes veröffentlichten Eintrags.",
    publishedStatus: (count: number) => {
      if (count === 0) return "Noch kein Eintrag veröffentlicht";
      if (count === 1) return "1 veröffentlichter Eintrag";
      return `${count} veröffentlichte Einträge`;
    },
  },
  en: {
    metadata: {
      title: "Open source",
      description:
        "Published loehrning.ai tools with a public repository, pinned source revision, license, and operating guide.",
      socialDescription:
        "Published tools with a public repository, pinned commit, license, and operating guide.",
    },
    eyebrow: "Open source",
    title: "Published tools. Verifiable source.",
    introductionPrefix: "This directory lists published artifacts from the GitHub organisation",
    introductionSuffix:
      ". Every entry identifies its repository, immutable commit, license, installation path, data flow, and known limits. Other repositories in the organisation are not automatically published platform artifacts.",
    coursesPrefix: "Technical learning courses are listed under",
    sourcePrinciple: "Source policy",
    sourcePlatform: "Source platform",
    snapshot: "Current state",
    externalTab: ", opens in a new tab",
    repositoryLanguage:
      "The repositories, guides, and commits on GitHub are written in English. This page provides the English platform description.",
    publicationStandard: "Publication standard",
    publicationStandardBody:
      "An entry appears here only after four checks: a public GitHub repository, an immutable commit as the reviewed source revision, an unambiguous license with a locally stored copy, and a guide covering installation, use, and integration. Incomplete entries are not listed.",
    codeAndEditorial: "Code and editorial content",
    platformCode: "Platform code on GitHub",
    codeAndEditorialBefore: "The",
    codeAndEditorialMiddle:
      "is licensed under MIT. Visible source code does not automatically permit reuse of all course text, trademarks, or media. The binding allocation is defined in the",
    licensePolicy: "license policy",
    codeAndEditorialAfter:
      "and in the license information for each published entry.",
    publishedStatus: (count: number) => {
      if (count === 0) return "No published entries";
      if (count === 1) return "1 published entry";
      return `${count} published entries`;
    },
  },
} as const;

export const OPEN_SOURCE_SHARED_COPY = {
  de: {
    published: "Veröffentlicht",
    entries: (count: number) => (count === 1 ? "1 Eintrag" : `${count} Einträge`),
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
      "Vier Aufnahmen aus dem Werkzeug, in der Reihenfolge, in der du es benutzt. Alle stammen aus dem gepinnten Quellstand.",
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
      "Four captures from the tool in the order in which it is used. Every image comes from the pinned source revision.",
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
    "Local YAML-to-PDF build for one-page CVs, with a browser editor, A4 preview, and optional AI. The build rejects overflow instead of printing it.",
  language: "English",
  guide: {
    statusNote:
      "Experimental: the cv.yaml schema and templates may still change, no hosted instance exists, and issue responses are not guaranteed. You run the tool yourself on your own computer. Before configuring it, read docs/data-flow.md in the repository. Its diagram shows which data paths stay local and which do not.",
    dataFlow:
      "The core renderer runs entirely locally. cv.yaml, fonts, and CSS stay in the checkout; the PDF build opens no socket and needs no API key. Without extra configuration, the browser editor talks only to 127.0.0.1 and keeps documents in server memory. Documents persist only if you operate the Supabase variant in your own project. The optional AI functions for import and text generation are the only external calls and use your own key. Pointing them at a local Ollama instance also keeps that call on your computer because you choose where the model runs. The complete diagram is in docs/data-flow.md in the repository.",
    prerequisites: [
      {
        label: "Python 3.13",
        detail:
          "The engine and editor run on CPython 3.13. Older versions have not been tested.",
      },
      {
        label: "Pango and Cairo",
        detail:
          "WeasyPrint uses these system libraries to typeset the PDF. If they are missing, the first build fails with a library error rather than a tool error.",
      },
      {
        label: "Your own API key, optional",
        detail:
          "Required only for PDF or DOCX import and generated text. The form, preview, and PDF build work unchanged without a key.",
      },
    ],
    installation: {
      summary:
        "The checkout is pinned to the reviewed source revision and installed in a dedicated virtual environment. No account, external server, or API key is required first.",
      steps: [
        {
          title: "Install system libraries",
          detail:
            "On macOS, the command below is sufficient. On Debian or Ubuntu, use sudo apt install libpango-1.0-0 libpangoft2-1.0-0 libcairo2.",
        },
        {
          title: "Check out the reviewed source revision",
          detail:
            "Clone the public repository and switch to the exact revision covered by this guide, its screenshots, and its checksums.",
        },
        {
          title: "Create a Python virtual environment",
          detail:
            "The environment isolates the tool's dependencies from the global Python installation. Every subsequent Python command calls its interpreter directly.",
        },
        {
          title: "Install hash-pinned dependencies",
          detail:
            "requirements.lock records the expected hash for every package. pip stops if an artifact does not match instead of installing it.",
        },
        {
          title: "Verify the installation with the test suite",
          detail:
            "The suite covers the renderer, schema, importer, and security rules without requiring a running server. End-to-end tests are excluded because they expect a running editor.",
        },
      ],
    },
    usage: {
      summary:
        "The YAML file is the durable source, the browser editor is the working surface, and the build rejects a second page.",
      steps: [
        {
          title: "Create and edit your local file",
          detail:
            "content/cv.yaml is the durable local source for the CV. The repository deliberately ignores it so personal data cannot enter a fork by accident. Edit it with your normal editor.",
        },
        {
          title: "Try the form and preview",
          detail:
            "Flask binds to 127.0.0.1:5567, so it is reachable only from your computer. The form or raw YAML appears on the left, and the same A4 page later printed by WeasyPrint appears on the right. The badge above the preview reports the page count: green for one page and red from page two. This mode keeps all data only in server memory. It does not write content/cv.yaml, and restarting clears it. Download the PDF before stopping the process. To persist form edits, self-host the Supabase variant documented in DEPLOY.md.",
        },
        {
          title: "Change the layout instead of deleting content",
          detail:
            "Eight templates are included: classic, modern, sidebar, executive, technical, ats-compact, consulting, and minimal. Themes control accent colour, font, and density; density can also be overridden per build.",
        },
        {
          title: "Let the build decide",
          detail:
            "engine/build.py renders the PDF and counts its pages. One page returns exit code 0 and writes output/cv.pdf. Two pages instead report the first heading on the overflow page to stderr, for example First section on the overflow page: 'Projects', and return exit code 1. No two-page PDF is produced.",
        },
      ],
    },
    integration: {
      summary:
        "content/cv.yaml is an ordinary text file. Version control, imports, and pipeline execution all connect through it.",
      steps: [
        {
          title: "Version the CV",
          detail:
            "One file produces one diff. Changes remain visible years later instead of becoming another Word file. content/cv.yaml is deliberately ignored in the tool repository; version it only in your own private repository.",
        },
        {
          title: "Import existing files",
          detail:
            "The importer converts rendercv YAML and plain text deterministically, without a provider or network request. PDF and DOCX use the selected AI provider with your key. Without a key, this path fails explicitly instead of guessing.",
        },
        {
          title: "Add the build to a pipeline",
          detail:
            "The exit code is the interface: 0 only when the output is exactly one page. This makes the command usable as a CI gate without additional code.",
        },
      ],
    },
    documentation: { label: "README in the repository" },
    screenshot: {
      alt: "The two-column editor: YAML for the stored CV on the left, including opening comments that state the one-page rule, and the A4 page preview on the right with a green 1 page badge in the header.",
    },
    demo: [
      {
        alt: "The editor form with the Experience section open. Each entry is a card with labelled fields for role, company, period, and bullet points, plus controls for reordering.",
        caption:
          "Every field has a visible label. Lists can be reordered and shortened without editing YAML.",
      },
      {
        alt: "The same screen with the YAML tab active: raw CV text with syntax highlighting on the left and the unchanged A4 preview on the right.",
        caption:
          "Switch to the YAML tab to work in text. The form and file share one source and cannot drift apart.",
      },
      {
        alt: "The display controls open above the form: accent colour, font, density, and paper tone, followed by named presets such as Default, Forest, and Harvard Crimson.",
        caption:
          "If the text does not fit on one page, adjust the accent, font, or density instead of deleting content.",
      },
      {
        alt: "The completed PDF rasterised as one A4 page, with a header, experience, education, skills, and projects.",
        caption:
          "The build renders exactly one page. If the CV overflows, the command fails and identifies the heading that no longer fits.",
      },
    ],
    relatedLearning: [
      {
        title: "AI-native work course",
        description:
          "The workflow behind the tool: state intent, provide context, and review the output. These are the same three steps required when importing an existing PDF.",
      },
      {
        title: "Claude course",
        description:
          "An English open-source course on prompting, context, and evaluations. Use it to assess the optional AI functions instead of treating them as a black box.",
      },
    ],
  },
} as const;

/**
 * Returns display copy only. Publication identifiers, URLs, commits, commands,
 * hashes, licenses, dimensions, and lifecycle fields always come from the
 * validated registry record.
 */
export function localizeOpenSourceArtifact<
  Artifact extends OpenSourceArtifact,
>(artifact: Artifact, locale: Locale): Artifact {
  if (locale === "de" || artifact.id !== "tool:cv-engine" || artifact.kind !== "tool") {
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
