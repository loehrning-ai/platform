import type {
  OpenSourceArtifactSource,
  ToolArtifact,
} from "../artifacts";

/**
 * Staging module for the CV Engine artifact record. It is deliberately not
 * imported by the registry, by any page, or by any component.
 *
 * Why this file exists at all: `assertOpenSourceArtifacts` runs at module load
 * over the unfiltered candidate array and requires `source.revision` to match
 * a 40 character lowercase commit SHA. The validator performs zero network
 * I/O, so a fabricated SHA would satisfy every gate in this repository while
 * encoding a provenance claim nobody can check. The CV Engine repository has
 * not been published, so no such commit exists yet.
 *
 * The record therefore lives here, typed so that the `source` field cannot be
 * written at all. When the repository is published, follow the "Staging a
 * record before Commit A" section of ARTIFACT_PUBLICATION.md: pin the real
 * commit, move the record into `OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES`, swap
 * `satisfies PendingToolArtifact` for `satisfies ToolArtifact`, repoint
 * `guide.documentation.href` at the public README, and delete this module
 * together with its spec.
 */

/**
 * Distributive `Omit`. `ToolArtifact` is `SoftwareArtifactBase<"tool"> &
 * SoftwareArtifactDelivery`, and `SoftwareArtifactDelivery` is a three member
 * union. A plain `Omit` would resolve the intersection first and collapse that
 * union into a single object type, silently losing the correlation that ties
 * `delivery: "source-only"` to an absent `launchHref`. Distributing over the
 * union preserves it, so the compiler still rejects a source only record that
 * carries a launch target.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * The complete artifact contract minus its provenance pin. The `source` field
 * does not exist at the type level, so there is no slot in which an unverified
 * claim could be written.
 */
export type PendingToolArtifact = DistributiveOmit<ToolArtifact, "source">;

/**
 * The slug matches the public repository name exactly. Everything derived from
 * it is built with template literals so a rename stays a single edit here plus
 * a `git mv` of the two asset files and their `ASSET_MANIFEST.json` rows.
 */
const SLUG = "cv-engine";

const ID = `tool:${SLUG}` as const;
const HREF = `/open-source/tools/${SLUG}` as const;
const LICENSE_HREF = `/artifacts/tools/${SLUG}/LICENSE.txt` as const;
const SCREENSHOT_SRC = `/artifacts/tools/${SLUG}/screenshot.webp` as const;

export const PENDING_CV_ENGINE_ARTIFACT = {
  id: ID,
  kind: "tool",
  publicationLifecycle: "draft",
  slug: SLUG,
  title: "CV Engine",
  eyebrow: "Werkzeug · Lebenslauf-Rendering",
  description:
    "Lokaler YAML-zu-PDF-Build für einseitige Lebensläufe, mit Browser-Editor, A4-Vorschau und optionaler KI. Überläufe blockiert der Build, statt sie zu drucken.",
  href: HREF,
  // Exact string, not a near miss: the detail route maps `"Englisch"` to
  // `inLanguage: "en"` in its JSON-LD and silently falls back to `"de"` for
  // every other value. The repository, its README and its commits are English.
  language: "Englisch",
  languageTag: "en",
  license: {
    href: LICENSE_HREF,
    sourcePath: "LICENSE",
    sha256: "36beaa24d27fc788e411a7fd7cc93d752878e6c51240a8abcc1156ff1451c5bd",
    sizeBytes: 1066,
    licenseId: "MIT",
  },
  // Source only: there is no hosted instance and none is planned. A hosted
  // editor would receive the CV of whoever opened it, which the delivery
  // contract and the honesty guardrail both rule out.
  delivery: "source-only",
  guide: {
    status: "experimental",
    statusNote:
      "Experimentell: das Schema in cv.yaml und die Vorlagen können sich noch ändern, es gibt keine gehostete Instanz, und Issues werden nicht garantiert beantwortet. Du betreibst das Werkzeug selbst, auf deinem eigenen Rechner. Bevor du etwas konfigurierst, lies docs/data-flow.md im Repository: dort steht als Diagramm, welcher Weg deiner Daten lokal bleibt und welcher nicht.",
    dataFlow:
      "Der Kern rendert vollständig lokal. cv.yaml, Schriften und CSS liegen im Checkout, der PDF-Build öffnet keinen Socket und braucht keinen API-Schlüssel. Der Browser-Editor ohne Konfiguration spricht nur mit 127.0.0.1 und hält seine Dokumente im Arbeitsspeicher des Servers; erst wenn du die Supabase-Variante selbst betreibst, liegen sie dauerhaft in deinem eigenen Projekt. Nach außen gehen allein die optionalen KI-Funktionen für Import und Textgenerierung, und zwar mit deinem eigenen Schlüssel; zeigst du sie auf ein lokales Ollama, endet auch dieser Aufruf auf deinem Rechner, denn du wählst, wo die KI läuft. Das vollständige Diagramm liegt als docs/data-flow.md im Repository.",
    prerequisites: [
      {
        label: "Python 3.13",
        detail:
          "Engine und Editor laufen auf CPython 3.13. Ältere Versionen sind nicht getestet.",
        href: "https://www.python.org/downloads/",
      },
      {
        label: "Pango und Cairo",
        detail:
          "WeasyPrint setzt das PDF über diese beiden Systembibliotheken. Fehlen sie, scheitert schon der erste Build, und zwar mit einem Fehler aus der Bibliothek statt aus dem Werkzeug.",
        href: "https://doc.courtbouillon.org/weasyprint/stable/first_steps.html",
      },
      {
        label: "Ein eigener API-Schlüssel, optional",
        detail:
          "Nur für den Import aus PDF oder DOCX und für generierte Textbausteine. Ohne Schlüssel funktionieren Formular, Vorschau und PDF-Build unverändert.",
      },
    ],
    installation: {
      summary:
        "Drei Schritte, alle lokal. Es gibt keinen Account, keinen Server und keinen Schlüssel, den du vorher besorgen müsstest.",
      steps: [
        {
          title: "Systembibliotheken installieren",
          detail:
            "Unter macOS genügt der Befehl unten. Unter Debian oder Ubuntu heißt er sudo apt install libpango-1.0-0 libpangoft2-1.0-0 libcairo2.",
          command: "brew install pango",
        },
        {
          title: "Abhängigkeiten hash-gepinnt installieren",
          detail:
            "requirements.lock hinterlegt für jedes Paket den erwarteten Hash. Weicht ein Artefakt davon ab, bricht pip ab, statt es zu installieren.",
          command: "python3 -m pip install --require-hashes -r requirements.lock",
        },
        {
          title: "Installation gegen die Testsuite prüfen",
          detail:
            "Die Suite deckt Renderer, Schema, Importer und die Sicherheitsregeln ab und braucht keinen laufenden Server. Die End-to-End-Tests bleiben hier bewusst außen vor, weil sie einen gestarteten Editor erwarten.",
          command: "python3 -m pytest tests/ --ignore=tests/e2e",
        },
      ],
    },
    usage: {
      summary:
        "Deine YAML-Datei ist der dauerhafte Weg, der Browser-Editor ist die Probierfläche, und der Build lässt die zweite Seite nicht durch.",
      steps: [
        {
          title: "Die eigene Datei anlegen und schreiben",
          detail:
            "content/cv.yaml ist der dauerhafte lokale Ort für deinen Lebenslauf, und die Datei ist im Repository bewusst von Git ausgenommen, damit deine Daten nicht versehentlich in einen Fork wandern. Du bearbeitest sie mit dem Editor, den du ohnehin benutzt.",
          command: "cp content/cv.example.yaml content/cv.yaml",
        },
        {
          title: "Formular und Vorschau ausprobieren",
          detail:
            "Flask bindet auf 127.0.0.1:5567, also nur auf deinen eigenen Rechner: links das Formular oder wahlweise die Rohdatei als YAML, rechts dieselbe A4-Seite, die WeasyPrint später druckt. Die Plakette über der Vorschau zeigt die Seitenzahl, grün bei einer Seite und rot ab der zweiten. Wichtig: dieser Modus hält alles nur im Arbeitsspeicher des Servers. Er schreibt nicht in content/cv.yaml, und ein Neustart setzt ihn zurück. Lade das PDF aus der Oberfläche herunter, bevor du den Prozess beendest. Wer dauerhaft im Formular arbeiten will, betreibt die Supabase-Variante aus DEPLOY.md selbst.",
          command: "ONEPAGER_DEMO_MODE=true python3 tools/editor/server.py",
        },
        {
          title: "Layout wechseln, statt Inhalt zu streichen",
          detail:
            "Acht Vorlagen liegen bei: classic, modern, sidebar, executive, technical, ats-compact, consulting und minimal. Themes steuern Akzentfarbe, Schrift und Dichte, und die Dichte lässt sich pro Build übersteuern.",
          command: "python3 engine/build.py --density tight",
        },
        {
          title: "Den Build entscheiden lassen",
          detail:
            "engine/build.py rendert das PDF und zählt die Seiten. Bei einer Seite endet der Befehl mit Exit-Code 0 und schreibt output/cv.pdf. Bei zwei Seiten schreibt er stattdessen die erste Überschrift der überzähligen Seite auf stderr, etwa First section on the overflow page: 'Projects', und endet mit Exit-Code 1. Ein zweiseitiges PDF entsteht dabei gar nicht erst.",
          command: "python3 engine/build.py",
        },
      ],
    },
    integration: {
      summary:
        "content/cv.yaml ist eine gewöhnliche Textdatei. Alles Weitere hängt daran: Versionierung, Import aus vorhandenen Dateien und der Aufruf aus einer Pipeline.",
      targets: [
        "YAML",
        "PDF",
        "DOCX",
        "rendercv",
        "Git",
        "Ollama",
        "OpenAI-kompatible APIs",
      ],
      steps: [
        {
          title: "Den Lebenslauf versionieren",
          detail:
            "Eine Datei, ein Diff. Du siehst nach zwei Jahren, was du geändert hast, statt eine weitere Word-Datei anzulegen. Im Werkzeug-Repository ist content/cv.yaml absichtlich ignoriert, damit deine Daten dort nicht landen; versioniere sie in deinem eigenen privaten Repository.",
          command: "git diff cv.yaml",
        },
        {
          title: "Vorhandene Dateien einlesen",
          detail:
            "rendercv-YAML und Klartext konvertiert der Importer deterministisch, ohne Anbieter und ohne Netz. PDF und DOCX laufen über den gewählten KI-Anbieter mit deinem Schlüssel; ohne Schlüssel scheitert dieser Pfad sauber, statt still etwas zu raten.",
        },
        {
          title: "Den Build in eine Pipeline hängen",
          detail:
            "Der Exit-Code ist die Schnittstelle: 0 nur dann, wenn genau eine Seite herauskommt. Damit taugt der Aufruf ohne weiteren Code als Gate in einer CI.",
          command: "python3 engine/build.py --output dist/cv.pdf",
        },
      ],
    },
    // Deliberately internal. The complete documentation set (README,
    // ARCHITECTURE, EXTENDING, docs/data-flow.md) ships inside the repository
    // and becomes publicly reachable only once that repository is published,
    // so the operating guide rendered on this page is the honest target until
    // then. Repoint this at the public README at admission.
    documentation: {
      label: "Anleitung auf dieser Seite",
      href: HREF,
    },
    screenshot: {
      src: SCREENSHOT_SRC,
      sourcePath: "docs/screenshots/preview-card.webp",
      // Rendered twice and visibly: as the image alt text and again as the
      // figure caption below it. Written as publishable prose for that reason.
      alt: "Der Editor in zwei Spalten: links die YAML-Ansicht des gespeicherten Lebenslaufs, deren erste Kommentarzeilen die Einseitenregel festhalten, rechts die A4-Vorschau in Seitenansicht mit der grünen Plakette 1 page in der Kopfzeile.",
      sha256: "8c402e73a3ac46498d5fbfe6f39e03eebf532e62fe4b5ae69941211e96492aff",
      sizeBytes: 132292,
      width: 1696,
      height: 1060,
    },
    relatedLearning: [
      {
        title: "AI-Native Arbeitskurs",
        description:
          "Die Arbeitsweise hinter dem Werkzeug: Intent formulieren, Kontext geben, Output prüfen. Genau die drei Schritte, die ein Import aus deinem alten PDF von dir verlangt.",
        href: "/ai-native",
      },
      {
        title: "Claude Course",
        description:
          "Englischer Open-Source-Kurs zu Prompting, Kontext und Evals. Nützlich, wenn du die optionalen KI-Funktionen nicht nur anklicken, sondern beurteilen willst.",
        href: "/kurse/open-source/claude",
      },
    ],
  },
} as const satisfies PendingToolArtifact;

/**
 * Proof that the staged record needs nothing but a provenance pin to become a
 * valid `ToolArtifact`. This lives in the non-test module on purpose:
 * `tsconfig.typecheck.json` excludes `*.test.ts`, so a composition written
 * only in the spec would never be typechecked.
 *
 * The returned value is what the eventual registry entry looks like. It is
 * only ever called with a fixture in tests today, because no real commit
 * exists to pass in.
 */
export function composeForValidation(
  source: OpenSourceArtifactSource,
): ToolArtifact {
  return { ...PENDING_CV_ENGINE_ARTIFACT, source };
}
