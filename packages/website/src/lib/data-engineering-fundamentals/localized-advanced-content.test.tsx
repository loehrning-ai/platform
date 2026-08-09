import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "@/lib/i18n/locale";
import { IDEMPOTENT_WRITE_SQL } from "@/components/data-engineering-fundamentals/chapters/ch4-orchestrate";
import { DQ_OPERATOR_PY } from "@/components/data-engineering-fundamentals/chapters/ch5-quality";
import { DATASETSPEC_YAML } from "@/components/data-engineering-fundamentals/chapters/ch6-discover";
import { METRICS } from "@/components/data-engineering-fundamentals/chapters/ch7-serve";
import { ANNOTATED_SPEC_YAML } from "@/components/data-engineering-fundamentals/chapters/ch8-govern";
import {
  DISC_QUESTIONS,
  DISC_QUESTIONS_DE,
  SOLUTION_PENALTY,
  TIP_PENALTY,
} from "@/components/data-engineering-fundamentals/simulators/discovery-speedrun";
import {
  METRIC_REGISTRY,
  QUESTIONS,
  QUESTIONS_DE,
} from "@/components/data-engineering-fundamentals/simulators/metrics-sim";
import {
  BREAKAGE_COPY,
  BREAKAGE_COPY_DE,
  STAGES,
  STAGES_DE,
  TUTORIAL,
  TUTORIAL_DE,
} from "@/components/data-engineering-fundamentals/simulators/living-pipeline";
import {
  COLUMNS,
  COLUMNS_DE,
} from "@/components/data-engineering-fundamentals/simulators/permission-gate-sim";
import {
  CHECKS,
  CHECKS_DE,
  CORRUPTIONS,
  CORRUPTIONS_DE,
} from "@/components/data-engineering-fundamentals/simulators/trust-meter-sim";
import {
  DEF_TRANSLATED_ADVANCED_CHAPTER_IDS,
  DEF_TRANSLATED_ADVANCED_IDENTITY,
  __resetDefTranslatedAdvancedChapterCacheForTests,
  getAllDefTranslatedAdvancedChapters,
  getDefTranslatedAdvancedChapterComponent,
  type DefTranslatedAdvancedChapterId,
} from "./localized-advanced-content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  __resetDefTranslatedAdvancedChapterCacheForTests();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function renderChapter(
  id: DefTranslatedAdvancedChapterId,
  locale: Locale,
) {
  const chapters = await getAllDefTranslatedAdvancedChapters(locale);
  const chapter = chapters.find((entry) => entry.id === id);
  if (!chapter) throw new Error(`Missing ${locale}/${id} test fixture.`);
  const Component = chapter.component;
  return render(<Component chapter={chapter.meta} />);
}

function sectionIds(container: HTMLElement): readonly string[] {
  return [...container.querySelectorAll(".section-label .n")].map(
    (node) => node.textContent ?? "",
  );
}

function canonicalMarkup(html: string): string {
  const fixture = document.createElement("div");
  fixture.innerHTML = html;
  return fixture.innerHTML;
}

describe("Data Engineering Fundamentals German chapters 7-12", () => {
  it("loads six explicit English and German modules without fallback", async () => {
    const [english, german] = await Promise.all([
      getAllDefTranslatedAdvancedChapters("en"),
      getAllDefTranslatedAdvancedChapters("de"),
    ]);

    expect(english.map(({ id }) => id)).toEqual(
      DEF_TRANSLATED_ADVANCED_CHAPTER_IDS,
    );
    expect(german.map(({ id }) => id)).toEqual(
      DEF_TRANSLATED_ADVANCED_CHAPTER_IDS,
    );

    const germanTitles = [
      "Orchestrierung",
      "Qualität",
      "Ermittlung",
      "Bereitstellung",
      "Governance",
      "Abschlussprojekt",
    ];
    for (const [index, source] of english.entries()) {
      expect(german[index].component, source.id).not.toBe(source.component);
      expect(german[index].meta.id, source.id).toBe(source.meta.id);
      expect(german[index].meta.number, source.id).toBe(source.meta.number);
      expect(german[index].meta.displayNumber, source.id).toBe(
        source.meta.displayNumber,
      );
      expect(german[index].meta.estimatedMinutes, source.id).toBe(
        source.meta.estimatedMinutes,
      );
      expect(german[index].meta.accentHex, source.id).toBe(source.meta.accentHex);
      expect(german[index].meta.inkHex, source.id).toBe(source.meta.inkHex);
      expect(german[index].meta.title, source.id).toBe(germanTitles[index]);
      expect(german[index].meta.subtitle, source.id).not.toBe(
        source.meta.subtitle,
      );
    }

    await expect(
      getDefTranslatedAdvancedChapterComponent(
        "home" as DefTranslatedAdvancedChapterId,
        "de",
      ),
    ).resolves.toBeUndefined();
  });

  it("locks chapter, progress, section, simulator, and artifact identity", () => {
    expect(DEF_TRANSLATED_ADVANCED_IDENTITY.chapterIds).toEqual(
      DEF_TRANSLATED_ADVANCED_CHAPTER_IDS,
    );
    expect(DEF_TRANSLATED_ADVANCED_IDENTITY.progressKeys).toEqual(
      DEF_TRANSLATED_ADVANCED_CHAPTER_IDS,
    );
    expect(
      Object.values(
        DEF_TRANSLATED_ADVANCED_IDENTITY.sectionIdsByChapter,
      ).flat(),
    ).toHaveLength(16);
    expect(
      Object.values(
        DEF_TRANSLATED_ADVANCED_IDENTITY.simulatorIdsByChapter,
      ).flat(),
    ).toHaveLength(8);
    expect(DEF_TRANSLATED_ADVANCED_IDENTITY.checkpointKeys).toEqual([]);
    expect(DEF_TRANSLATED_ADVANCED_IDENTITY.scoringKeys).toEqual([]);
    expect(DEF_TRANSLATED_ADVANCED_IDENTITY.codeArtifacts).toHaveLength(4);
  });

  it("renders the same 16 numbered sections in the same order", async () => {
    for (const id of DEF_TRANSLATED_ADVANCED_CHAPTER_IDS) {
      const english = await renderChapter(id, "en");
      expect(sectionIds(english.container), `${id}/en`).toEqual(
        DEF_TRANSLATED_ADVANCED_IDENTITY.sectionIdsByChapter[id],
      );
      english.unmount();

      const german = await renderChapter(id, "de");
      expect(sectionIds(german.container), `${id}/de`).toEqual(
        DEF_TRANSLATED_ADVANCED_IDENTITY.sectionIdsByChapter[id],
      );
      german.unmount();
    }
  });

  it("renders reviewed German prose and callout copy across the slice", async () => {
    const expected = {
      orch: ["Pipelines sind Graphen", "Idempotenz im Simulator", "Fehlmuster"],
      qual: ["Vier Prüfungen für unterschiedliche Fehlerarten.", "Signaltabelle als Schranke"],
      disc: ["Die sechs Kürzel", "Lineage als Kamera"],
      serve: ["Metrikversion und Ausführungskontext deklarieren.", "Eine Metrik, mehrere Schnittstellen."],
      gov: ["Akteur-Annotationen", "Richtlinienzonen und abgeschottete Transformationen"],
      cap: ["Die laufende Pipeline", "Simulierte Zeilen durchlaufen sechs ausgewählte Kontrollen."],
    } satisfies Record<DefTranslatedAdvancedChapterId, readonly string[]>;

    for (const id of DEF_TRANSLATED_ADVANCED_CHAPTER_IDS) {
      const view = await renderChapter(id, "de");
      const text = view.container.textContent ?? "";
      for (const marker of expected[id]) {
        expect(text, `${id}: ${marker}`).toContain(marker);
      }
      view.unmount();
    }
  });

  it("renders all eight simulators with German learner-visible chrome", async () => {
    const expected = {
      orch: ["Quelle", "Backfill mit INSERT OVERWRITE"],
      qual: ["Prüfungsabdeckung"],
      disc: ["Katalogbefehle üben", "Lineage von fct_events"],
      serve: ["Dieselbe Frage mit und ohne Metrikschicht"],
      gov: ["Berechtigungsschranke"],
      cap: ["Kontrollkonsole", "Sechs modellierte Kontrollen. Jeden Fehlerzustand prüfen."],
    } satisfies Record<DefTranslatedAdvancedChapterId, readonly string[]>;

    let panelCount = 0;
    for (const id of DEF_TRANSLATED_ADVANCED_CHAPTER_IDS) {
      const view = await renderChapter(id, "de");
      const text = view.container.textContent ?? "";
      panelCount += view.container.querySelectorAll(".panel").length;
      for (const marker of expected[id]) {
        expect(text, `${id}: ${marker}`).toContain(marker);
      }
      view.unmount();
    }
    expect(panelCount).toBe(6);
    expect(panelCount + 2).toBe(8);
  });

  it("reuses all four protected code payloads byte-for-byte", async () => {
    const fixtures = [
      ["orch", IDEMPOTENT_WRITE_SQL],
      ["qual", DQ_OPERATOR_PY],
      ["disc", DATASETSPEC_YAML],
      ["gov", ANNOTATED_SPEC_YAML],
    ] as const;

    for (const [id, canonical] of fixtures) {
      const view = await renderChapter(id, "de");
      const code = view.container.querySelector(".code-body");
      expect(code, id).not.toBeNull();
      expect(code?.innerHTML, id).toBe(canonicalMarkup(canonical));
      view.unmount();
    }
  });

  it("preserves metric definitions and simulator machine contracts", () => {
    expect(Object.values(METRIC_REGISTRY)).toEqual(METRICS);
    expect(
      QUESTIONS_DE.map(({ metric, answer }) => ({ metric, answer })),
    ).toEqual(QUESTIONS.map(({ metric, answer }) => ({ metric, answer })));

    const discoveryContract = (questions: typeof DISC_QUESTIONS) =>
      questions.map(({ shortcut, accept, result }) => ({
        shortcut,
        accept: { source: accept.source, flags: accept.flags },
        resultKind: result.kind,
        schema: result.schema,
        children: result.children,
      }));
    expect(discoveryContract(DISC_QUESTIONS_DE)).toEqual(
      discoveryContract(DISC_QUESTIONS),
    );
    expect({ TIP_PENALTY, SOLUTION_PENALTY }).toEqual({
      TIP_PENALTY: 2,
      SOLUTION_PENALTY: 5,
    });

    expect(CHECKS_DE.map(({ id, weight }) => ({ id, weight }))).toEqual(
      CHECKS.map(({ id, weight }) => ({ id, weight })),
    );
    expect(
      Object.fromEntries(
        Object.entries(CORRUPTIONS_DE).map(
          ([id, { tripsBy, wrongVal }]) => [id, { tripsBy, wrongVal }],
        ),
      ),
    ).toEqual(
      Object.fromEntries(
        Object.entries(CORRUPTIONS).map(
          ([id, { tripsBy, wrongVal }]) => [id, { tripsBy, wrongVal }],
        ),
      ),
    );

    expect(
      COLUMNS_DE.map(({ id, type, pii, required }) => ({
        id,
        type,
        pii,
        required,
      })),
    ).toEqual(
      COLUMNS.map(({ id, type, pii, required }) => ({
        id,
        type,
        pii,
        required,
      })),
    );
    expect(
      STAGES_DE.map(({ k, n, color, ink }) => ({ k, n, color, ink })),
    ).toEqual(STAGES.map(({ k, n, color, ink }) => ({ k, n, color, ink })));
    expect(TUTORIAL_DE.map(({ stage }) => stage)).toEqual(
      TUTORIAL.map(({ stage }) => stage),
    );
    expect(
      Object.fromEntries(
        Object.entries(BREAKAGE_COPY_DE).map(([key, value]) => [
          key,
          value.code,
        ]),
      ),
    ).toEqual(
      Object.fromEntries(
        Object.entries(BREAKAGE_COPY).map(([key, value]) => [
          key,
          value.code,
        ]),
      ),
    );
  });

  it("does not leak representative English source copy into German UI", async () => {
    const forbidden = [
      "Pipelines are graphs",
      "Checks are cheap",
      "The six shortcuts",
      "What a metrics layer actually is",
      "Actor annotations",
      "The living pipeline",
      "Active checks",
      "Start practice",
      "Query trace",
      "Drag an actor",
      "sabotage console",
      "Anti-patterns",
      "The right way",
      "Key takeaways",
    ];

    for (const id of DEF_TRANSLATED_ADVANCED_CHAPTER_IDS) {
      const view = await renderChapter(id, "de");
      const text = view.container.textContent ?? "";
      for (const marker of forbidden) {
        expect(text, `${id}: ${marker}`).not.toContain(marker);
      }
      view.unmount();
    }
  });
});
