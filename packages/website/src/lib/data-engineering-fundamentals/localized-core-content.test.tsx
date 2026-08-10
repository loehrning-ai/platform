import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "@/lib/i18n/locale";
import {
  CUMULATIVE_SQL,
} from "@/components/data-engineering-fundamentals/chapters/ch2-store";
import { DEDUP_SQL } from "@/components/data-engineering-fundamentals/chapters/ch1-5-streaming";
import { KAFKA_TO_WAREHOUSE_SQL } from "@/components/data-engineering-fundamentals/chapters/ch1-ingest";
import {
  DEF_TRANSLATED_CORE_CHAPTER_IDS,
  DEF_TRANSLATED_CORE_IDENTITY,
  __resetDefTranslatedCoreChapterCacheForTests,
  getAllDefTranslatedCoreChapters,
  getDefTranslatedCoreChapterComponent,
  type DefTranslatedCoreChapterId,
} from "./localized-core-content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  __resetDefTranslatedCoreChapterCacheForTests();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function renderChapter(id: DefTranslatedCoreChapterId, locale: Locale) {
  const chapters = await getAllDefTranslatedCoreChapters(locale);
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

describe("Data Engineering Fundamentals German chapters 1-6", () => {
  it("loads six explicit English and German modules without a sibling fallback", async () => {
    const [english, german] = await Promise.all([
      getAllDefTranslatedCoreChapters("en"),
      getAllDefTranslatedCoreChapters("de"),
    ]);

    expect(english.map(({ id }) => id)).toEqual(
      DEF_TRANSLATED_CORE_CHAPTER_IDS,
    );
    expect(german.map(({ id }) => id)).toEqual(
      DEF_TRANSLATED_CORE_CHAPTER_IDS,
    );
    const germanTitles = [
      "Überblick",
      "Grundlagen",
      "Datenaufnahme",
      "Streaming",
      "Speicherung",
      "Verarbeitung",
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
      getDefTranslatedCoreChapterComponent(
        "orch" as DefTranslatedCoreChapterId,
        "de",
      ),
    ).resolves.toBeUndefined();
  });

  it("locks chapter, progress, section, simulator, checkpoint, scoring, and code identity", () => {
    expect(DEF_TRANSLATED_CORE_IDENTITY.chapterIds).toEqual(
      DEF_TRANSLATED_CORE_CHAPTER_IDS,
    );
    expect(DEF_TRANSLATED_CORE_IDENTITY.progressKeys).toEqual(
      DEF_TRANSLATED_CORE_CHAPTER_IDS,
    );
    expect(
      Object.values(DEF_TRANSLATED_CORE_IDENTITY.sectionIdsByChapter).flat(),
    ).toHaveLength(20);
    expect(
      Object.values(DEF_TRANSLATED_CORE_IDENTITY.simulatorIdsByChapter).flat(),
    ).toHaveLength(10);
    expect(DEF_TRANSLATED_CORE_IDENTITY.checkpointKeys).toEqual([]);
    expect(DEF_TRANSLATED_CORE_IDENTITY.scoringKeys).toEqual([]);
    expect(DEF_TRANSLATED_CORE_IDENTITY.codeArtifacts).toEqual([
      "kafka_to_warehouse_events.sql",
      "fct_events_dedup.sql",
      "user_lifetime_points.sql",
    ]);
  });

  it("renders the same 20 numbered sections in the same order in both languages", async () => {
    for (const id of DEF_TRANSLATED_CORE_CHAPTER_IDS) {
      const english = await renderChapter(id, "en");
      expect(sectionIds(english.container), `${id}/en`).toEqual(
        DEF_TRANSLATED_CORE_IDENTITY.sectionIdsByChapter[id],
      );
      english.unmount();

      const german = await renderChapter(id, "de");
      expect(sectionIds(german.container), `${id}/de`).toEqual(
        DEF_TRANSLATED_CORE_IDENTITY.sectionIdsByChapter[id],
      );
      german.unmount();
    }
  });

  it("renders reviewed German chapter and callout copy across the complete slice", async () => {
    const expected = {
      home: ["Eine Datenpipeline", "Kapitel öffnen"],
      fund: ["Grundlagen: Speicher, Formate und Engines.", "Fehlmuster", "Kernaussagen"],
      ingest: ["Zwei Uhren, ein Ereignis", "Saubere Umsetzung"],
      stream: ["Kontinuierliche Verarbeitung", "Warehouse-Grenze"],
      store: ["Gestern + heute = heutiger kumulativer Zustand.", "Die Abfrage"],
      comp: ["Drei Engines, dieselben Bytes.", "Verteilungen der Join-Schlüssel prüfen."],
    } satisfies Record<DefTranslatedCoreChapterId, readonly string[]>;

    for (const id of DEF_TRANSLATED_CORE_CHAPTER_IDS) {
      const view = await renderChapter(id, "de");
      const text = view.container.textContent ?? "";
      for (const marker of expected[id]) expect(text, `${id}: ${marker}`).toContain(marker);
      view.unmount();
    }
  });

  it("renders all ten simulators with German learner-visible chrome", async () => {
    const expectedByChapter = {
      home: ["Aufnahme", "Abschlussprojekt"],
      fund: [
        "Der Stack aus sieben Schichten",
        "Der Weg eines Bytes",
        "Zeilen- und Spaltenscan im Vergleich",
        "SQL → AST → logisch → physisch → Stages",
        "Gleiches SQL. Andere Laufzeitbedingungen.",
      ],
      ingest: ["Kafka zum Warehouse · Watermark verschieben"],
      stream: ["Das Förderband der Datenaufnahme"],
      store: ["user_lifetime_points · Tag für Tag"],
      comp: ["Shuffle und Joins in Bewegung"],
    } satisfies Record<DefTranslatedCoreChapterId, readonly string[]>;

    let panelCount = 0;
    for (const id of DEF_TRANSLATED_CORE_CHAPTER_IDS) {
      const view = await renderChapter(id, "de");
      const text = view.container.textContent ?? "";
      panelCount += view.container.querySelectorAll(".panel").length;
      for (const marker of expectedByChapter[id]) {
        expect(text, `${id}: ${marker}`).toContain(marker);
      }
      view.unmount();
    }
    expect(panelCount).toBe(9);
    expect(panelCount + 1).toBe(10);
  });

  it("uses the canonical SQL payloads byte-for-byte in German chapters", async () => {
    const fixtures = [
      ["ingest", KAFKA_TO_WAREHOUSE_SQL],
      ["stream", DEDUP_SQL],
      ["store", CUMULATIVE_SQL],
    ] as const;

    for (const [id, canonical] of fixtures) {
      const view = await renderChapter(id, "de");
      const code = view.container.querySelector(".code-body");
      expect(code, id).not.toBeNull();
      const fixture = document.createElement("div");
      fixture.innerHTML = canonical;
      expect(code?.innerHTML, id).toBe(fixture.innerHTML);
      view.unmount();
    }
  });

  it("does not leak representative English source copy into German prose or controls", async () => {
    const forbidden = [
      "Think like a data engineer by lunch",
      "The quiet shift that changed every warehouse",
      "Two clocks, one event",
      "The Ingestion Conveyor Belt",
      "Yesterday's snapshot",
      "Watch a join actually happen",
      "Anti-patterns",
      "The right way",
      "Key takeaways",
      "Scroll horizontally",
      "Pause stream",
      "Run scan",
    ];

    for (const id of DEF_TRANSLATED_CORE_CHAPTER_IDS) {
      const view = await renderChapter(id, "de");
      const text = view.container.textContent ?? "";
      for (const marker of forbidden) {
        expect(text, `${id}: ${marker}`).not.toContain(marker);
      }
      view.unmount();
    }
  });
});
