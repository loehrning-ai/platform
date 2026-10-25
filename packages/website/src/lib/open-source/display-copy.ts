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
    title: "Werkzeuge zum Anfassen.",
    introduction:
      "Du klonst sie und betreibst sie selbst. Jedes zeigt, was reingeht und was rauskommt.",
    externalTab: ", öffnet in neuem Tab",
    contents: {
      label: "Inhalt",
      number: "Nr",
      tool: "Werkzeug",
      formula: "Formel",
      license: "Lizenz",
      revision: "Stand",
    },
    wall: "Werkzeuge",
    plate: {
      number: "Nr.",
      input: "Eingabe",
      output: "Ausgabe",
      view: "Ansehen",
      source: "Quellcode",
      status: "Status",
      license: "Lizenz",
      language: "Sprache",
      revision: "Stand",
      runs: "Läuft",
      delivery: {
        "source-only": "Lokal, ohne Cloud",
        "internal-route": "Im Browser",
        "external-service": "Externer Dienst",
        "hosted-service": "Gehostet von loehrning.ai · Hetzner EU",
      },
    },
    rights:
      "Rechte und Lizenzen: Code unter der Lizenz im Repository, Texte und Bilder siehe Lizenzrichtlinie.",
    platformCode: "Plattform-Code",
    licensePolicy: "Lizenzrichtlinie",
    courses: "Zu den Kursen",
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
    title: "Tools you can touch.",
    introduction:
      "You clone them and run them yourself. Each one shows what goes in and what comes out.",
    externalTab: ", opens in a new tab",
    contents: {
      label: "Contents",
      number: "No.",
      tool: "Tool",
      formula: "Formula",
      license: "License",
      revision: "Revision",
    },
    wall: "Tools",
    plate: {
      number: "No.",
      input: "Input",
      output: "Output",
      view: "View",
      source: "Source",
      status: "Status",
      license: "License",
      language: "Language",
      revision: "Revision",
      runs: "Runs",
      delivery: {
        "source-only": "Locally, no cloud",
        "internal-route": "In browser",
        "external-service": "External service",
        "hosted-service": "Hosted by loehrning.ai · Hetzner EU",
      },
    },
    rights:
      "Rights and licenses: code under the license in its repository, texts and images see the license policy.",
    platformCode: "Platform source",
    licensePolicy: "License policy",
    courses: "Browse the courses",
  },
} as const;

/** Copy of the specimen stage, ruler and play controls. */
export const SPECIMEN_COPY = {
  de: {
    ruler: (title: string) => `Zeitleiste ${title}`,
    hint: "Ziehen oder tippen zum Spulen",
    play: "Abspielen",
    pause: "Anhalten",
    again: "Nochmal",
    chapters: (title: string) => `Kapitel von ${title}`,
  },
  en: {
    ruler: (title: string) => `Timeline ${title}`,
    hint: "Drag or tap to scrub",
    play: "Play",
    pause: "Pause",
    again: "Again",
    chapters: (title: string) => `Chapters of ${title}`,
  },
} as const;

/** The drawn CV Engine specimen: chapters, toy button, live region, caption. */
export const CV_ENGINE_SPECIMEN_COPY = {
  de: {
    chapters: [
      "Daten rein",
      "Seite füllt sich",
      "Zweite Seite, Build bricht ab",
      "Layout statt Kürzen",
    ],
    toy: "Noch eine Station",
    toyBack: "Zurück auf eine Seite",
    twoPages: "Zwei Seiten. Der Build bricht ab.",
    onePage: "Eine Seite. Exit 0.",
    onePageBadge: "1 Seite",
    twoPagesBadge: "2 Seiten",
    caption: "Nachgestellt. So verhält sich engine/build.py.",
  },
  en: {
    chapters: [
      "Data in",
      "Page fills up",
      "Second page, build stops",
      "Layout, not cuts",
    ],
    toy: "One more job",
    toyBack: "Back to one page",
    twoPages: "Two pages. The build stops.",
    onePage: "One page. Exit 0.",
    onePageBadge: "1 page",
    twoPagesBadge: "2 pages",
    caption: "Reconstructed. This is how engine/build.py behaves.",
  },
} as const;

/** An extra line under a tool's stage, keyed by artifact id. */
export const STAGE_NOTES: Record<string, Record<Locale, string>> = {
  "tool:reelcode": {
    de: "Jedes Bild entsteht aus einer Webseite zu einem Zeitpunkt. An der Zeitleiste hältst du denselben Zeitpunkt.",
    en: "Every frame comes from a web page at one moment in time. On the timeline you hold that same moment.",
  },
};

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
    back: "Alle Werkzeuge",
    transcript: "Transkript lesen",
    videoLabel: "Video",
    language: "Sprache",
    commit: "Commit",
    license: "Lizenz",
    licenseText: "Lizenztext",
    open: "Öffnen",
    sourceRevision: "Quellstand",
    externalTab: ", öffnet in neuem Tab",
    oneCommand: "Ein Befehl. Dann läuft es bei dir.",
    whatItDoes: "Was es macht",
    formulaColumns: ["Rein", "Dazwischen", "Raus"],
    realOutput: (count: number) =>
      `Echtes Ergebnis · ${count} ${count === 1 ? "Aufnahme" : "Aufnahmen"}`,
  },
  en: {
    breadcrumbHome: "Home",
    back: "All tools",
    transcript: "Read transcript",
    videoLabel: "Video",
    language: "Language",
    commit: "Commit",
    license: "License",
    licenseText: "License text",
    open: "Open",
    sourceRevision: "Source revision",
    externalTab: ", opens in a new tab",
    oneCommand: "One command. Then it runs on your machine.",
    whatItDoes: "What it does",
    formulaColumns: ["In", "In between", "Out"],
    realOutput: (count: number) =>
      `Real output · ${count} ${count === 1 ? "capture" : "captures"}`,
  },
} as const;

export const SOFTWARE_GUIDE_COPY = {
  de: {
    copy: "Kopieren",
    copied: "Kopiert",
    copyCommand: (title: string) => `Befehl für ${title}`,
    dataFlow: "Datenfluss",
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
    dataFlow: "Data flow",
    prerequisites: "Requirements",
    installation: "Installation",
    usage: "Use",
    integration: "Integration",
    integrationTargets: "Interfaces and targets",
    documentation: "Documentation and further reading",
    externalTab: ", opens in a new tab",
  },
} as const;

interface EnglishProcedure {
  readonly summary: string;
  readonly steps: readonly { readonly title: string; readonly detail: string }[];
}

/**
 * English display copy of one artifact. Lists are index-aligned with the
 * registry record. Commands, paths, hashes, chapter tokens and every other
 * publication fact always come from the registry.
 */
interface ArtifactEnglishCopy {
  readonly eyebrow: string;
  readonly description: string;
  readonly language: string;
  readonly guide: {
    readonly statusNote: string;
    readonly dataFlow: string;
    readonly prerequisites: readonly {
      readonly label: string;
      readonly detail: string;
    }[];
    readonly installation: EnglishProcedure;
    readonly usage: EnglishProcedure;
    readonly integration: EnglishProcedure & {
      readonly targets?: readonly string[];
    };
    readonly documentation: { readonly label: string };
    readonly screenshot: { readonly alt: string };
    readonly demo?: readonly { readonly alt: string; readonly caption: string }[];
    readonly relatedLearning: readonly {
      readonly title: string;
      readonly description: string;
    }[];
    readonly formula?: { readonly process: string; readonly output: string };
    readonly quickstartNote?: string;
    readonly specimenAlt?: string;
    readonly outputFilmAlts?: readonly string[];
  };
}

const CV_ENGINE_ENGLISH_COPY: ArtifactEnglishCopy = {
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
    formula: {
      process: "WeasyPrint sets the A4 page and counts the pages",
      output: "cv.pdf, exactly one page",
    },
    quickstartNote:
      "First: brew install pango. On Debian or Ubuntu: step 1 of the installation below. Needs Python 3.13, runs locally, no key needed.",
  },
};

const REELCODE_ENGLISH_COPY: ArtifactEnglishCopy = {
  eyebrow: "Tool · Motion design",
  description:
    "Claude Code plugin and engine: one project.json becomes a film with music, in four formats at once. Runs locally.",
  language: "English",
  guide: {
    statusNote:
      "Version 0.1. Tested on macOS, on Linux only in CI, not on Windows. The project.json format may still change and issue responses are not guaranteed. You run the tool yourself.",
    dataFlow:
      "Everything renders locally: a server on 127.0.0.1, Chromium without network, capture refuses outside addresses. Network is only needed for the one-time setup (about 1.2 GB for Chromium and Python packages) and the optional ElevenLabs voice-over with your own key.",
    prerequisites: [
      { label: "Node.js 20 or newer", detail: "For the CLI and the engine." },
      { label: "ffmpeg", detail: "Cuts and encodes the formats." },
      { label: "Python 3.12 or uv", detail: "For music and mixing on the beat." },
      {
        label: "Claude Code, optional",
        detail: "For the plugin that drives draft, review and fixes.",
      },
    ],
    installation: {
      summary: "Clone, switch to the reviewed revision, set up once.",
      steps: [
        {
          title: "Check out the reviewed source revision",
          detail:
            "This guide, its films and checksums belong to exactly this revision.",
        },
        {
          title: "Install dependencies",
          detail: "npx then runs the copy in your checkout.",
        },
        {
          title: "Set up once",
          detail:
            "Downloads Chromium for Playwright (about 570 MB) and the Python packages (about 290 MB).",
        },
        {
          title: "Check the installation",
          detail: "doctor tells you what is still missing.",
        },
      ],
    },
    usage: {
      summary:
        "You describe the film in project.json, reelcode renders every format.",
      steps: [
        {
          title: "Render the example film",
          detail: "A draft takes about a minute on Apple Silicon.",
        },
        {
          title: "Your own project from a template",
          detail:
            "Eight templates, such as data-story, product-launch or logo-sting.",
        },
        {
          title: "Render the final",
          detail: "60 frames per second with motion blur.",
        },
      ],
    },
    integration: {
      summary:
        "Strongest with a coding agent: it writes project.json, scores its draft on a contact sheet and fixes it.",
      targets: ["Claude Code", "other coding agents", "project.json", "MP4"],
      steps: [
        {
          title: "Add the marketplace in Claude Code",
          detail: "Once per machine.",
        },
        {
          title: "Install the plugin",
          detail: "Then you describe the film in plain words.",
        },
        {
          title: "Other agents",
          detail: "Have the agent read docs/AGENTS_GUIDE.md first.",
        },
      ],
    },
    documentation: { label: "README in the repository" },
    screenshot: {
      alt: "reelcode: the same line WE MAKE TYPE MOVE in 9:16, 1:1, 4:5 and 16:9.",
    },
    demo: [
      {
        alt: "Contact sheet with 32 frames from the example film, in six rows.",
        caption:
          "How the agent checks its draft: look at the contact sheet, score it, fix it.",
      },
    ],
    relatedLearning: [
      {
        title: "AI-native work course",
        description: "Practise reviewing and fixing an agent's drafts.",
      },
    ],
    formula: {
      process:
        "Chromium renders every frame as seek(t), ffmpeg encodes, Python puts music on the beat",
      output: "a film in four formats",
    },
    quickstartNote:
      "Needs Node.js 20, ffmpeg and Python 3.12 or uv. Setup downloads about 1.2 GB once. Then in Claude Code: /plugin marketplace add loehrning-ai/reelcode",
    specimenAlt:
      "The example film: type on the beat, from ON THE BEAT to REELCODE.",
    outputFilmAlts: [
      "The same film in 9:16, 1:1 and 4:5, with 16:9 below, frame for frame in sync.",
    ],
  },
};

/** Every published tool or project needs an entry here. */
export const ENGLISH_ARTIFACT_COPY: Readonly<
  Record<string, ArtifactEnglishCopy>
> = {
  "tool:cv-engine": CV_ENGINE_ENGLISH_COPY,
  "tool:reelcode": REELCODE_ENGLISH_COPY,
};

function overlaySteps<Step extends object>(
  steps: readonly Step[],
  english: EnglishProcedure["steps"],
): Step[] {
  return steps.map((step, index) => ({ ...step, ...english[index] }));
}

/**
 * Returns display copy only. Publication identifiers, URLs, commits, commands,
 * hashes, licenses, dimensions, and lifecycle fields always come from the
 * validated registry record.
 */
export function localizeOpenSourceArtifact<Artifact extends OpenSourceArtifact>(
  artifact: Artifact,
  locale: Locale,
): Artifact {
  const copy = ENGLISH_ARTIFACT_COPY[artifact.id];
  if (locale === "de" || !copy || artifact.kind === "video") {
    return artifact;
  }

  const guide = artifact.guide;
  const english = copy.guide;
  const specimen = guide.specimen;
  return {
    ...artifact,
    eyebrow: copy.eyebrow,
    description: copy.description,
    language: copy.language,
    guide: {
      ...guide,
      statusNote: english.statusNote,
      dataFlow: english.dataFlow,
      prerequisites: guide.prerequisites.map((item, index) => ({
        ...item,
        ...english.prerequisites[index],
      })),
      installation: {
        summary: english.installation.summary,
        steps: overlaySteps(guide.installation.steps, english.installation.steps),
      },
      usage: {
        summary: english.usage.summary,
        steps: overlaySteps(guide.usage.steps, english.usage.steps),
      },
      integration: {
        summary: english.integration.summary,
        targets: english.integration.targets ?? guide.integration.targets,
        steps: overlaySteps(guide.integration.steps, english.integration.steps),
      },
      documentation: { ...guide.documentation, ...english.documentation },
      screenshot: { ...guide.screenshot, ...english.screenshot },
      demo: guide.demo?.map((step, index) => ({
        ...step,
        ...english.demo?.[index],
      })),
      relatedLearning: guide.relatedLearning.map((item, index) => ({
        ...item,
        ...english.relatedLearning[index],
      })),
      formula:
        guide.formula && english.formula
          ? { ...guide.formula, ...english.formula }
          : guide.formula,
      quickstart:
        guide.quickstart && english.quickstartNote
          ? { ...guide.quickstart, note: english.quickstartNote }
          : guide.quickstart,
      specimen:
        specimen?.kind === "film" && english.specimenAlt
          ? { ...specimen, film: { ...specimen.film, alt: english.specimenAlt } }
          : specimen,
      outputFilms: guide.outputFilms?.map((film, index) => ({
        ...film,
        alt: english.outputFilmAlts?.[index] ?? film.alt,
      })),
    },
  } as Artifact;
}
