import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd(), "content");
const sourceRoot = join(process.cwd(), "src");
const repositoryRoot = join(process.cwd(), "../..");

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

function readPublicFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "generated") continue;
      files.push(...readPublicFiles(path));
      continue;
    }

    if (/\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(entry.name)) continue;
    if (
      ![".json", ".md", ".mdx", ".ts", ".tsx"].includes(extname(entry.name))
    ) {
      continue;
    }
    files.push(readFileSync(path, "utf8"));
  }

  return files;
}

describe("public learning content claim hygiene", () => {
  const reviewedFiles = [
    "ai-native/modul-4-lessons.json",
    "eu-ai-act-kurs/block-6-praxis-lessons.json",
    "ki-und-gesellschaft/block-3-ethik-lessons.json",
    "books/ki-arbeitsalltag/13_anhang.md",
    "books/ki-landschaft/01_eisberg.md",
    "books/ki-landschaft/02_methodik.md",
    "books/ki-landschaft/03_reifegrad_ueberblick.md",
    "books/ki-landschaft/04_bundesland.md",
    "books/ki-landschaft/05_branchen.md",
    "books/ki-landschaft/06_eu_ki_verordnung.md",
    "books/ki-landschaft/07_schnellstart.md",
    "books/ki-landschaft/08_fahrplan.md",
    "books/ki-landschaft/09_ausblick.md",
    "books/ki-landschaft/10_anhang.md",
  ];

  const reviewedFreelancerBookFiles = [
    "books/ki-tools-selbststaendige/02_grundlagen.md",
    "books/ki-tools-selbststaendige/03_prompting.md",
    "books/ki-tools-selbststaendige/04_akquise.md",
    "books/ki-tools-selbststaendige/09_branchen.md",
    "books/ki-tools-selbststaendige/10_automatisierung.md",
    "books/ki-tools-selbststaendige/13_prompt_bibliothek.md",
  ];

  it("documents the account boundary for the four native core curricula", () => {
    const readme = readFileSync(join(repositoryRoot, "README.md"), "utf8");
    const environmentExample = readFileSync(
      join(process.cwd(), ".env.example"),
      "utf8",
    );
    const documentation = `${readme}\n${environmentExample}`;

    expect(documentation).toContain(
      "four native core curricula require a configured Supabase learning account",
    );
    expect(documentation).toContain("four native core-course readers, quizzes");
    expect(documentation).not.toContain(
      "No credentials are required for courses",
    );
    expect(documentation).not.toContain(
      "Anonymous learners can read all courses",
    );
  });

  it("does not expose the private company scoring dataset", () => {
    const corpus = reviewedFiles.map(read).join("\n");
    expect(corpus).not.toMatch(
      /Digifyde|34[.]879|130 digitale Signale|93[,.]3 Prozent/iu,
    );
  });

  it("does not restore the superseded Article 4 competence guarantee wording", () => {
    const corpus = [
      ...readPublicFiles(root),
      ...readPublicFiles(sourceRoot),
    ].join("\n");

    expect(corpus).not.toMatch(
      /maßnahmen (?:für ein angemessenes niveau an|zur entwicklung (?:der|von)) ki-kompetenz|measures to ensure an appropriate level of ai literacy|measures to develop the ai literacy|measures that develop the ai literacy/iu,
    );
    expect(corpus).toMatch(
      /Maßnahmen,? die die Entwicklung der KI-Kompetenz[^.]*unterstützen/iu,
    );
    expect(corpus).toMatch(
      /measures (?:that|to) support the development of AI literacy/iu,
    );
  });

  it("does not restore vendor, template, or Article 22 absolutes", () => {
    const corpus = reviewedFiles.map(read).join("\n");
    expect(corpus).not.toContain(
      "Anthropic ist vertrauenswürdig, DSGVO-konform",
    );
    expect(corpus).not.toContain("Vier der acht Vorlagen sind direkt");
    expect(corpus).not.toContain(
      "zum Download benötigst du ein kostenloses Konto",
    );
    expect(corpus).not.toContain("Claude Opus 4.7");
    expect(corpus).not.toContain("Llama 3.3 70B");
  });

  it("keeps the open book manifest mapped to files that exist", () => {
    const manifest = JSON.parse(read("books/ki-landschaft/manifest.json")) as {
      chapters: Array<{ sourceFile: string }>;
    };

    for (const chapter of manifest.chapters) {
      expect(() =>
        read(`books/ki-landschaft/${chapter.sourceFile}`),
      ).not.toThrow();
    }
  });

  it("does not restore unsupported outcome or first-person authority claims", () => {
    const corpus = reviewedFreelancerBookFiles.map(read).join("\n");

    expect(corpus).not.toMatch(
      /10x besser|dominierst du die lokale Suche|Zeitgewinn-Tracker|Aus drei Jahren Workshops|hunderten Klienten-Sessions|Mein erster KI-gestützter Workshop|Das läuft seit 8 Monaten|Ich habe mit 1 Automation angefangen|mein gesamter Angebotsaufwand/iu,
    );
    expect(corpus).not.toMatch(
      /unter 2 Euro im Monat|unter 50 Cent|1-3 Cent pro Anfrage|ab 20 EUR\/Monat für 750|ab 9 EUR\/Monat|37- bis 52-fache|rund 75-fach/iu,
    );
    expect(corpus).toContain(
      "Fiktives Rechenbeispiel, kein Ergebnisversprechen",
    );
    expect(corpus).toContain(
      "Ein negativer Wert ist ein gültiges Pilotergebnis",
    );
  });

  it("uses reserved domains and unmistakable dummy identities in public examples", () => {
    const corpus = [
      ...readPublicFiles(root),
      ...readPublicFiles(sourceRoot),
    ].join("\n");
    // Inline SVG path data is machine geometry, not learner-visible prose.
    // Strip it before looking for telephone-shaped digit sequences.
    const proseCorpus = corpus.replace(/\bpath:\s*"M[^"]*"/gsu, "");
    // DOI link targets can contain telephone-shaped numeric suffixes. They are
    // publication identifiers, not learner-visible example identities.
    const proseWithoutDoiLinks = proseCorpus.replace(
      /\bhttps:\/\/doi[.]org\/10[.]\d{4,9}\/[-._;()/:a-z0-9]+/giu,
      "",
    );
    const emails =
      proseCorpus.match(
        /(?<!\\)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gu,
      ) ?? [];

    for (const email of emails) {
      const domain = email.toLowerCase().split("@")[1];
      const allowed =
        domain === "loehrning.ai" ||
        domain === "example.com" ||
        domain.endsWith(".example") ||
        domain.endsWith(".invalid");
      expect(allowed, `non-reserved example email: ${email}`).toBe(true);
    }

    const realLookingPhones =
      proseWithoutDoiLinks.match(
        /(?:\+49[ /-]?[1-9][0-9 /-]{6,}|\b0[1-9][0-9]{1,4}[ /-][0-9][0-9 /-]{4,})/gu,
      ) ?? [];
    expect(realLookingPhones).toEqual([]);

    expect(proseCorpus).not.toMatch(
      /Max Mustermann|Müller Maschinenbau|Maria Schubert|Franz & Voigt|Dr\. Lea Kirchner|Bauer Maschinen|Sabine Vogt|Thomas Schmidt|Schmidt GmbH|Meier AG|Keller KG/iu,
    );
  });
});
