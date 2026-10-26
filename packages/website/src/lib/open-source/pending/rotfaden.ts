import type {
  PendingToolArtifact,
  ToolArtifact,
} from "@/lib/open-source/artifacts";
import type { ArtifactEnglishCopy } from "@/lib/open-source/display-copy";

/**
 * rotfaden, staged before its repository's first public commit
 * (ARTIFACT_PUBLICATION.md, "Staging a record before Commit A"). Nothing
 * but the colocated spec imports this module.
 *
 * Two things land upstream at Commit A, because the record names them as
 * `derivedFrom`: the usage films `docs/media/usage-16x9.mp4` and
 * `docs/media/usage-9x16.mp4`, rendered with reelcode from real runs of
 * `rotfaden new` and `check`, the Workshop 06 deck, the kit's file list and
 * the demo on a phone. The files here are their muted re-encodes.
 *
 * On admission the record moves into `artifacts.ts` as
 * `composeForValidation(source)` returns it, and the English copy below
 * moves into `ENGLISH_ARTIFACT_COPY`.
 */

const SLUG = "rotfaden";
const REPOSITORY = `https://github.com/loehrning-ai/${SLUG}`;
const ARTIFACTS = `/artifacts/tools/${SLUG}`;
const MEDIA = `/media/tools/${SLUG}`;
/** Workshop 06 on this site, built from the repository's example of the same name. */
const WORKSHOP = "/workshops/angebote-mit-ki-vergleichen";
const EXAMPLE = "skills/rotfaden/examples/angebote-mit-ki-vergleichen";

export const ROTFADEN_PENDING_TOOL = {
  id: `tool:${SLUG}`,
  kind: "tool",
  publicationLifecycle: "published",
  slug: SLUG,
  title: "rotfaden",
  eyebrow: "Werkzeug · Workshops",
  description:
    "Claude-Code-Skill und Python-Skripte: Aus Thema und Marke wird ein geprüfter Workshop mit Deck, Kit und Demo fürs Telefon. Läuft lokal.",
  href: `/open-source/tools/${SLUG}`,
  language: "Englisch",
  languageTag: "en",
  license: {
    href: `${ARTIFACTS}/LICENSE.txt`,
    sourcePath: "LICENSE",
    sha256:
      "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    sizeBytes: 1066,
    licenseId: "MIT",
  },
  delivery: "source-only",
  guide: {
    status: "experimental",
    statusNote:
      "Version 0.2.0. Getestet unter macOS und Linux, nicht unter Windows. Der Check prüft, was ein Skript sehen kann: Layout, Offline, Zahlen mit Quelle, Sprache. Ob die Geschichte trägt und ob ein Fakt stimmt, entscheidest du. Du betreibst das Werkzeug selbst.",
    dataFlow:
      "Deck, Kit und Demo entstehen lokal als Dateien in deinem Projektordner. Das fertige Deck lädt nichts nach; der Check lässt jede Netzanfrage scheitern. Netz braucht nur das einmalige Setup (Playwright und Chromium, rund 200 MB) und eine Marke als Website-Adresse, die rotfaden einmal in Chromium öffnet. Die Recherche macht dein Agent mit deinem eigenen Konto.",
    prerequisites: [
      {
        label: "Python 3.9 oder neuer",
        detail:
          "Nur die Standardbibliothek. Ein Deck bauen braucht keinen Download und kein Konto.",
      },
      { label: "macOS oder Linux", detail: "Windows ist nicht getestet." },
      {
        label: "Playwright und Chromium",
        detail:
          "Nur für den Check im Browser. setup legt beides einmal in ~/.cache/rotfaden/venv ab, nie im System-Python.",
      },
      {
        label: "Claude Code, optional",
        detail:
          "Für den Skill, der Recherche, Deck, Kit und Demo in neun Phasen baut und prüft.",
      },
    ],
    installation: {
      summary: "Als Plugin in Claude Code, oder als Klon für die Kommandozeile.",
      steps: [
        {
          title: "Marktplatz in Claude Code hinzufügen",
          detail: "Einmal pro Rechner.",
          command: "/plugin marketplace add loehrning-ai/rotfaden",
        },
        {
          title: "Plugin installieren",
          detail: "Danach beschreibst du den Workshop in normalen Worten.",
          command: "/plugin install rotfaden@rotfaden",
        },
        {
          title: "Ohne Agent: klonen und einrichten",
          detail:
            "setup lädt Playwright und Chromium für den Check, rund 200 MB.",
          command: `(git clone ${REPOSITORY} && cd ${SLUG} && bin/rotfaden setup)`,
        },
      ],
    },
    usage: {
      summary:
        "Ein Projektordner pro Workshop. check sagt dir, was noch fehlt, eine Zeile pro Befund.",
      steps: [
        {
          title: "Projekt anlegen",
          detail:
            "Schreibt einen Ablauf für 90 Minuten, mit TODO überall, wo dein Inhalt hingehört.",
          command: `(cd ${SLUG} && bin/rotfaden new mein-workshop --topic "Angebote mit KI vergleichen" --brand press --minutes 90)`,
        },
        {
          title: "Prüfen",
          detail:
            "Scheitert an jedem TODO, bis der rote Faden steht. Das neue Projekt endet bei 26 errors.",
          command: `(cd ${SLUG} && bin/rotfaden check mein-workshop)`,
        },
        {
          title: "Das fertige Beispiel prüfen",
          detail:
            "Workshop 06 mit Deck, Kit und Demo. Endet bei 0 errors, 0 warnings.",
          command: `(cd ${SLUG} && bin/rotfaden check ${EXAMPLE} --demo --strict)`,
        },
      ],
    },
    integration: {
      summary:
        "Am stärksten mit einem Coding-Agenten: Er schreibt, rotfaden prüft, der Agent bessert nach, bis der Check 0 errors meldet.",
      targets: ["Claude Code", "andere Coding-Agenten", "CI", "HTML"],
      steps: [
        {
          title: "In Claude Code beschreiben",
          detail:
            "Etwa: Mach mir einen Workshop von 90 Minuten für Einkäufer zum Vergleich von Angeboten. Marke: unsere Website.",
        },
        {
          title: "Andere Agenten",
          detail:
            "Lass den Agenten skills/rotfaden/SKILL.md als Anleitung lesen. Details stehen in docs/other-agents.md.",
        },
        {
          title: "In der CI",
          detail:
            "Exit 0 besteht, 1 heißt Befunde, 2 heißt: Playwright oder Chromium fehlt.",
          command: "bin/rotfaden check my-deck/deck.html --strict",
        },
      ],
    },
    documentation: {
      label: "README im Repository",
      href: REPOSITORY,
    },
    screenshot: {
      src: `${ARTIFACTS}/screenshot.png`,
      sourcePath: "docs/media/social-preview.png",
      alt: "rotfaden: oben eine Folie mit FAIL und rot markiertem Text im unteren Rand, darunter der Check mit 0 errors.",
      sha256:
        "3c8dcb708bc9ba8093aaadecb5e18d90a0c544de03c606929193f5e25f73e374",
      sizeBytes: 110384,
      width: 1280,
      height: 640,
    },
    demo: [
      {
        src: `${ARTIFACTS}/demo/before-after.png`,
        sourcePath: "docs/media/before-after.png",
        alt: "Folie 5 des Starter-Decks zweimal: links blasser Text und vier Zeilen im unteren Rand, darüber 20 errors, 2 warnings; rechts korrigiert, darüber 0 errors, 0 warnings.",
        caption:
          "Drei eingebaute Fehler, alle gefunden: Text im unteren Rand, zu wenig Kontrast, eine nachgeladene Schrift.",
        sha256:
          "33330b6afce7d50e293fdd543ee62f120c980b7c1805f3cbeb78686241575206",
        sizeBytes: 90678,
        width: 1280,
        height: 520,
      },
      {
        src: `${ARTIFACTS}/demo/demo.png`,
        sourcePath: "docs/media/demo.png",
        alt: "Vier Telefon-Bildschirme der englischen Beispiel-Demo: Tipp, Auflösung, Methode und die Dateien für dein eigenes Claude.",
        caption:
          "Die Demo ist das Kit als Ablauf fürs Telefon, eine HTML-Datei ohne Netz.",
        sha256:
          "42df82e10bb29f445a92fd6e8541e3b8b82945fe08cd8be5b419cbe02c61dcb6",
        sizeBytes: 180653,
        width: 1280,
        height: 640,
      },
    ],
    relatedLearning: [
      {
        title: "Workshops",
        description:
          "Alle Workshops mit Deck und Kit, Workshop 06 ist mit rotfaden gebaut.",
        href: "/workshops",
      },
    ],
    formula: {
      input: "Thema und Marke",
      process:
        "Der Agent schneidet die Geschichte auf eine Frage und baut Deck, Kit und Demo; Skripte und Chromium prüfen",
      output: "geprüfter Workshop",
    },
    outputFilms: [
      {
        src: `${MEDIA}/usage-16x9.mp4`,
        sha256:
          "2c3b8a4b973e100f7e1f8cb4676c1390ac033b269ed68a497334997f07664e05",
        sizeBytes: 422416,
        derivedFrom: "docs/media/usage-16x9.mp4",
        width: 1280,
        height: 720,
        durationS: 22,
        poster: {
          src: `${MEDIA}/usage-16x9.jpg`,
          sha256:
            "aabb53837e0a424ec4b83d8c6d9828c778c4c850dd9636271553750cc07ffc81",
          sizeBytes: 79416,
        },
        alt: "Echte Läufe, gekürzt: new legt das Projekt an, check meldet 26 errors, dann das Deck von Workshop 06, die Dateien des Kits, die Demo am Telefon und check mit 0 errors.",
      },
      {
        src: `${MEDIA}/usage-9x16.mp4`,
        sha256:
          "8b2f6e325dad917403384f9a65f79e2254a96c7787a4e3c96a6eb6857e2dad17",
        sizeBytes: 433769,
        derivedFrom: "docs/media/usage-9x16.mp4",
        width: 720,
        height: 1280,
        durationS: 22,
        poster: {
          src: `${MEDIA}/usage-9x16.jpg`,
          sha256:
            "2dbbd939fb7f0c4b676fc02abd293c1edfffed736e74dfb3258c7a3b397750bb",
          sizeBytes: 73861,
        },
        alt: "Derselbe Film hochkant, für das Telefon.",
      },
    ],
    liveExample: {
      title: "Live-Beispiel: Workshop 06",
      summary:
        "Workshop 06, „Welches Angebot ist günstiger?“, ist mit rotfaden gebaut, aus dem Beispiel angebote-mit-ki-vergleichen im Repository. Der Fall und die drei Lieferanten sind erfunden.",
      links: [
        {
          label: "Deck",
          detail:
            "Die HTML-Datei aus rotfaden, unverändert. Pfeiltasten blättern, P öffnet die Sprecheransicht.",
          href: `${WORKSHOP}/slides.html`,
        },
        {
          label: "Sprecheransicht",
          detail: "Aktuelle und nächste Folie, Notizen je Schritt, die Zeit.",
          href: `${WORKSHOP}/presenter.html`,
        },
        {
          label: "Kit",
          detail:
            "Drei Angebote, eine Basis, vier Schritte zum Nachmachen mit deinem eigenen Claude.",
          href: `${WORKSHOP}/kit`,
        },
        {
          label: "Demo",
          detail: "Das Kit als Ablauf fürs Telefon: tippen, auflösen, nachrechnen.",
          href: "/demos/angebote-mit-ki-vergleichen",
        },
      ],
    },
  },
} as const satisfies PendingToolArtifact;

/** English overlay, in the order of the German record. */
export const ROTFADEN_ENGLISH_COPY: ArtifactEnglishCopy = {
  eyebrow: "Tool · Workshops",
  description:
    "Claude Code skill and Python scripts: a topic and a brand become a checked workshop with deck, kit and phone demo. Runs locally.",
  language: "English",
  guide: {
    statusNote:
      "Version 0.2.0. Tested on macOS and Linux, not on Windows. The check covers what a script can see: layout, offline, numbers with a source, language. Whether the story holds and whether a fact is true is your call. You run the tool yourself.",
    dataFlow:
      "Deck, kit and demo are built locally as files in your project folder. The finished deck loads nothing; the check fails any network request. Network is only needed for the one-time setup (Playwright and Chromium, about 200 MB) and for a brand given as a website address, which rotfaden opens once in Chromium. Your agent does the research with your own account.",
    prerequisites: [
      {
        label: "Python 3.9 or newer",
        detail:
          "Standard library only. Building a deck needs no download and no account.",
      },
      { label: "macOS or Linux", detail: "Windows is untested." },
      {
        label: "Playwright and Chromium",
        detail:
          "Only for the check in a browser. setup puts both in ~/.cache/rotfaden/venv once, never in the system Python.",
      },
      {
        label: "Claude Code, optional",
        detail:
          "For the skill that builds and checks research, deck, kit and demo in nine phases.",
      },
    ],
    installation: {
      summary: "As a plugin in Claude Code, or as a clone for the command line.",
      steps: [
        { title: "Add the marketplace in Claude Code", detail: "Once per machine." },
        {
          title: "Install the plugin",
          detail: "Then describe the workshop in plain words.",
        },
        {
          title: "Without an agent: clone and set up",
          detail: "setup downloads Playwright and Chromium for the check, about 200 MB.",
        },
      ],
    },
    usage: {
      summary:
        "One project folder per workshop. check tells you what is still missing, one line per finding.",
      steps: [
        {
          title: "Create a project",
          detail: "Writes a 90-minute running order with TODO wherever your content goes.",
        },
        {
          title: "Check",
          detail:
            "Fails on every TODO until the red line is written. The new project ends on 26 errors.",
        },
        {
          title: "Check the finished example",
          detail: "Workshop 06 with deck, kit and demo. Ends on 0 errors, 0 warnings.",
        },
      ],
    },
    integration: {
      summary:
        "Strongest with a coding agent: it writes, rotfaden checks, the agent fixes until the check reports 0 errors.",
      targets: ["Claude Code", "other coding agents", "CI", "HTML"],
      steps: [
        {
          title: "Describe it in Claude Code",
          detail:
            "For example: Make me a 90 minute workshop for buyers on comparing supplier quotes. Brand: our website.",
        },
        {
          title: "Other agents",
          detail:
            "Have the agent read skills/rotfaden/SKILL.md as its instructions. Details are in docs/other-agents.md.",
        },
        {
          title: "In CI",
          detail:
            "Exit 0 passes, 1 means findings, 2 means Playwright or Chromium is missing.",
        },
      ],
    },
    documentation: { label: "README in the repository" },
    screenshot: {
      alt: "rotfaden: a slide marked FAIL with text boxed in red in the bottom band, below it the check at 0 errors.",
    },
    demo: [
      {
        alt: "Slide 5 of the starter deck twice: on the left pale text and four lines in the bottom band, above it 20 errors, 2 warnings; on the right fixed, above it 0 errors, 0 warnings.",
        caption:
          "Three planted faults, all found: text in the bottom band, too little contrast, a font loaded from the web.",
      },
      {
        alt: "Four phone screens of the English example demo: the bet, the reveal, the method and the files for your own Claude.",
        caption: "The demo is the kit as a phone walkthrough, one HTML file without network.",
      },
    ],
    relatedLearning: [
      {
        title: "Workshops",
        description:
          "All workshops with deck and kit; Workshop 06 was built with rotfaden.",
      },
    ],
    formula: {
      process:
        "The agent cuts the story to one question and builds deck, kit and demo; scripts and Chromium check",
      output: "checked workshop",
    },
    quickstartNote:
      "Needs Python 3.9 or newer, nothing else. The check in a browser needs bin/rotfaden setup once (about 200 MB). In Claude Code: /plugin marketplace add loehrning-ai/rotfaden",
    outputFilmAlts: [
      "Real runs, cut: new creates the project, check reports 26 errors, then the Workshop 06 deck, the kit's files, the demo on a phone and check at 0 errors.",
      "The same film upright, for the phone.",
    ],
    liveExample: {
      title: "Live example: Workshop 06",
      summary:
        "Workshop 06, “Which offer is cheaper?”, was built with rotfaden from the repository's example angebote-mit-ki-vergleichen. The case and the three suppliers are invented. Deck and kit are in German.",
      links: [
        {
          label: "Deck",
          detail: "The HTML file from rotfaden, unchanged. Arrow keys page, P opens the presenter view.",
        },
        {
          label: "Presenter view",
          detail: "Current and next slide, notes per step, the time.",
        },
        {
          label: "Kit",
          detail: "Three offers, one basis, four steps to replay with your own Claude.",
        },
        {
          label: "Demo",
          detail: "The kit as a phone walkthrough: tap, reveal, recalculate.",
        },
      ],
    },
  },
};

/**
 * The record as it enters `artifacts.ts` once Commit A exists: the three
 * `source` fields, the README pinned to that revision, and the one-line
 * quickstart that checks the revision out.
 */
export function composeForValidation(source: ToolArtifact["source"]): ToolArtifact {
  const { guide } = ROTFADEN_PENDING_TOOL;
  return {
    ...ROTFADEN_PENDING_TOOL,
    source,
    guide: {
      ...guide,
      documentation: {
        ...guide.documentation,
        href: `${REPOSITORY}/blob/${source.revision}/README.md`,
      },
      quickstart: {
        command: `git clone ${REPOSITORY} && cd ${SLUG} && git checkout ${source.revision} && bin/rotfaden init my-deck && bin/rotfaden build my-deck`,
        note: "Braucht Python 3.9 oder neuer, sonst nichts. Der Check im Browser braucht einmal bin/rotfaden setup (rund 200 MB). In Claude Code: /plugin marketplace add loehrning-ai/rotfaden",
      },
    },
  };
}
