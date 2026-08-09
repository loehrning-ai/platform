import { cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import { DistributionExplorer } from "@/components/data-science/simulators/distribution-explorer";
import { DriftSimulator } from "@/components/data-science/simulators/drift-simulator";
import { EncodingComparison } from "@/components/data-science/simulators/encoding-comparison";
import { FeatureSelectionSim } from "@/components/data-science/simulators/feature-selection-sim";
import { FlowingPipeline } from "@/components/data-science/simulators/flowing-pipeline";
import { ImputationRace } from "@/components/data-science/simulators/imputation-race";
import { LeakageDetector } from "@/components/data-science/simulators/leakage-detector";
import { MissingnessSim } from "@/components/data-science/simulators/missingness-sim";
import { OutlierDetector } from "@/components/data-science/simulators/outlier-detector";
import { PolynomialExpansion } from "@/components/data-science/simulators/polynomial-expansion";
import { PostDeployChecklist } from "@/components/data-science/simulators/post-deploy-checklist";
import { PrecisionRecallTradeoff } from "@/components/data-science/simulators/precision-recall-tradeoff";
import { ScalerDemo } from "@/components/data-science/simulators/scaler-demo";
import { ShadowDeployment } from "@/components/data-science/simulators/shadow-deployment";
import type { Locale } from "@/lib/i18n/locale";
import {
  DS_TRANSLATED_CORE_CHAPTER_IDS,
  DS_TRANSLATED_CORE_IDENTITY,
  __resetDsTranslatedCoreChapterCacheForTests,
  getAllDsTranslatedCoreChapters,
  getDsTranslatedCoreChapterComponent,
  getDsTranslatedCoreChapterMeta,
  type DsTranslatedCoreChapterId,
} from "./localized-core-content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  __resetDsTranslatedCoreChapterCacheForTests();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function renderChapter(id: DsTranslatedCoreChapterId, locale: Locale) {
  const Component = await getDsTranslatedCoreChapterComponent(id, locale);
  if (!Component) throw new Error(`Missing ${locale}/${id} test fixture.`);
  return render(
    <Component chapter={getDsTranslatedCoreChapterMeta(id, locale)} />,
  );
}

function sectionIds(container: HTMLElement): readonly string[] {
  return [...container.querySelectorAll(".section-label .n")].map(
    (node) => node.textContent ?? "",
  );
}

function machineProjection(container: HTMLElement) {
  return {
    sectionIds: sectionIds(container),
    panelCount: container.querySelectorAll(".panel").length,
    buttonCount: container.querySelectorAll("button").length,
    inputs: [...container.querySelectorAll("input")].map((input) => ({
      type: input.type,
      min: input.min,
      max: input.max,
      step: input.step,
      value: input.value,
    })),
    svgViewBoxes: [...container.querySelectorAll("svg")].map((svg) =>
      svg.getAttribute("viewBox"),
    ),
    tableBodies: [...container.querySelectorAll("table")].map((table) =>
      [...(table.tBodies[0]?.rows ?? [])].map((row) =>
        [...row.cells].map((cell) => cell.textContent ?? ""),
      ),
    ),
    codePayloads: [...container.querySelectorAll("code")].map(
      (code) => code.textContent ?? "",
    ),
  };
}

describe("Data Science German overview and chapters 01-12", () => {
  it("loads 13 explicit English and German modules without a sibling fallback", async () => {
    const [english, german] = await Promise.all([
      getAllDsTranslatedCoreChapters("en"),
      getAllDsTranslatedCoreChapters("de"),
    ]);

    expect(english.map(({ id }) => id)).toEqual(DS_TRANSLATED_CORE_CHAPTER_IDS);
    expect(german.map(({ id }) => id)).toEqual(DS_TRANSLATED_CORE_CHAPTER_IDS);

    const germanTitles = [
      "Überblick",
      "Grundlagen",
      "Exploration",
      "Datenbereinigung",
      "Merkmale",
      "Modellierung",
      "Evaluation",
      "Interpretation",
      "Experimente",
      "Kausalität",
      "Peeking und CUPED",
      "Betrieb",
      "Abschlussprojekt",
    ];

    for (const [index, source] of english.entries()) {
      expect(german[index]?.component, source.id).not.toBe(source.component);
      expect(german[index]?.meta.id, source.id).toBe(source.meta.id);
      expect(german[index]?.meta.number, source.id).toBe(source.meta.number);
      expect(german[index]?.meta.displayNumber, source.id).toBe(
        source.meta.displayNumber,
      );
      expect(german[index]?.meta.estimatedMinutes, source.id).toBe(
        source.meta.estimatedMinutes,
      );
      expect(german[index]?.meta.title, source.id).toBe(germanTitles[index]);
      expect(german[index]?.meta.subtitle, source.id).not.toBe(
        source.meta.subtitle,
      );
    }
  });

  it("locks chapter, progress, section, simulator, checkpoint, and scoring identity", () => {
    expect(DS_TRANSLATED_CORE_IDENTITY.chapterIds).toEqual(
      DS_TRANSLATED_CORE_CHAPTER_IDS,
    );
    expect(DS_TRANSLATED_CORE_IDENTITY.progressKeys).toEqual([
      "fund",
      "explore",
      "clean",
      "feature",
      "model",
      "eval",
      "interp",
      "exp",
      "causal",
      "peek",
      "deploy",
      "cap",
    ]);
    expect(DS_TRANSLATED_CORE_IDENTITY.progressKeys).not.toContain("home");
    expect(
      Object.values(DS_TRANSLATED_CORE_IDENTITY.sectionIdsByChapter).flat(),
    ).toHaveLength(40);
    expect(
      Object.values(DS_TRANSLATED_CORE_IDENTITY.simulatorIdsByChapter).flat(),
    ).toHaveLength(37);
    expect(DS_TRANSLATED_CORE_IDENTITY.checkpointKeys).toEqual([]);
    expect(DS_TRANSLATED_CORE_IDENTITY.scoringKeys).toEqual([]);
  });

  it("renders the same 40 numbered sections in the same order in both languages", async () => {
    for (const id of DS_TRANSLATED_CORE_CHAPTER_IDS) {
      const english = await renderChapter(id, "en");
      expect(sectionIds(english.container), `${id}/en`).toEqual(
        DS_TRANSLATED_CORE_IDENTITY.sectionIdsByChapter[id],
      );
      english.unmount();

      const german = await renderChapter(id, "de");
      expect(sectionIds(german.container), `${id}/de`).toEqual(
        DS_TRANSLATED_CORE_IDENTITY.sectionIdsByChapter[id],
      );
      german.unmount();
    }
  });

  it("preserves controls, table data, code payloads, and visualization geometry", async () => {
    for (const id of DS_TRANSLATED_CORE_CHAPTER_IDS) {
      const english = await renderChapter(id, "en");
      const englishProjection = machineProjection(english.container);
      english.unmount();

      const german = await renderChapter(id, "de");
      expect(machineProjection(german.container), id).toEqual(
        englishProjection,
      );
      german.unmount();
    }
  });

  it("renders reviewed German chapter and callout copy across the complete slice", async () => {
    const expected = {
      home: [
        "aus Daten Entscheidungen abzuleiten",
        "Kapitel öffnen",
        "Werkzeuge im Kurs",
      ],
      fund: [
        "Stichprobe und Grundgesamtheit",
        "Der Data-Science-Zyklus",
        "Kernaussagen",
      ],
      explore: [
        "Explorative Datenanalyse",
        "Fehlmuster bei Ausreißern",
        "Saubere Korrelationsanalyse",
      ],
      clean: ["Fehlwertmechanismen", "Data Leakage", "Saubere Umsetzung"],
      feature: [
        "Kategoriale Merkmale kodieren",
        "Merkmalsauswahl",
        "Interaktionsterme",
      ],
      model: [
        "Der Zielkonflikt zwischen",
        "Ein Modell auswählen",
        "Kernaussagen",
      ],
      eval: [
        "Die Konfusionsmatrix",
        "Die passende Metrik auswählen",
        "Eine Metrik enthält ein Werturteil",
      ],
      interp: [
        "Erklärungen einzelner Vorhersagen mit SHAP",
        "Globale Merkmalswichtigkeit durch Permutation",
        "Erklärungsbedarf vor dem Deployment definieren",
      ],
      exp: [
        "Ein synthetischer Experimentverlauf",
        "Vier Vorabfestlegungen",
        "etwa die vierfache Stichprobe",
      ],
      causal: [
        "Die verborgene Variable",
        "Quasi-Experimente",
        "Instrumentvariablen",
      ],
      peek: [
        "Peeking und optionales Stoppen",
        "Mehrfachvergleiche",
        "Statistische Power",
      ],
      deploy: [
        "Serving-Architektur",
        "Drift-Erkennung",
        "Feature Stores und Training-Serving-Skew",
      ],
      cap: [
        "Die Daten und ihre Schwierigkeit",
        "Die Pipeline, Schritt für Schritt",
        "Der Kurs ist abgeschlossen",
      ],
    } satisfies Record<DsTranslatedCoreChapterId, readonly string[]>;

    for (const id of DS_TRANSLATED_CORE_CHAPTER_IDS) {
      const view = await renderChapter(id, "de");
      const content = view.container.textContent ?? "";
      for (const marker of expected[id]) {
        expect(content, `${id}: ${marker}`).toContain(marker);
      }
      view.unmount();
    }
  });

  it("renders all 37 simulators with German learner-visible chrome", async () => {
    const expectedByChapter = {
      home: [],
      fund: ["Galtonbrett · Stichprobenverteilung"],
      explore: [
        "Verteilungen untersuchen",
        "Ausreißer erkennen",
        "Korrelationsmatrix",
      ],
      clean: [
        "Muster fehlender Werte",
        "Imputationsverfahren vergleichen",
        "Merkmale skalieren",
        "Leakage-Prüfung",
      ],
      feature: [
        "Kategoriale Merkmale kodieren",
        "Polynomiale Merkmalserweiterung",
        "Verfahren zur Merkmalsauswahl",
        "Interaktionsterme: A×B gegen A+B",
      ],
      model: ["Bias-Varianz-Verhalten"],
      eval: ["Schwellenwert · Konfusionsmatrix · ROC"],
      interp: [
        "SHAP-Wasserfall · Kreditentscheidung",
        "LIME · lokale lineare Erklärung",
        "Permutationswichtigkeit",
        "Globale und lokale Erklärungen",
      ],
      exp: ["Experimentverlauf"],
      causal: [
        "Confounding · die verborgene Variable",
        "DAG-Muster · für Z adjustieren?",
        "DAGs · die drei Muster",
        "Difference-in-Differences",
        "Instrumentalvariablen",
      ],
      peek: [
        "Wie Peeking die Falsch-Positiv-Rate erhöht",
        "Mehrfachtests und FWER",
        "CUPED: Varianzreduktion durch Kovariaten",
        "Statistische Power",
      ],
      deploy: [
        "Architektur für die Modellbereitstellung",
        "Drift-Simulator",
        "Shadow- und Canary-Deployment",
        "Feature Store und Training-Serving-Skew",
      ],
      cap: [
        "Datensatz-Explorer: Klassenungleichgewicht",
        "ML-Pipeline, Schritt für Schritt",
        "Abwägung zwischen Präzision und Recall",
        "Checkliste für die Produktionsreife",
      ],
    } satisfies Record<DsTranslatedCoreChapterId, readonly string[]>;

    let panelCount = 0;
    for (const id of DS_TRANSLATED_CORE_CHAPTER_IDS) {
      const view = await renderChapter(id, "de");
      const content = view.container.textContent ?? "";
      panelCount += view.container.querySelectorAll(".panel").length;
      for (const marker of expectedByChapter[id]) {
        expect(content, `${id}: ${marker}`).toContain(marker);
      }
      view.unmount();
    }

    const pipeline = render(
      <DataScienceLocaleProvider locale="de">
        <FlowingPipeline />
      </DataScienceLocaleProvider>,
    );
    expect(pipeline.container.textContent).toContain("01 · Daten");
    expect(pipeline.container.textContent).toContain("Rückmeldung");
    expect(pipeline.container.querySelectorAll("a.ov-loop-node")).toHaveLength(
      6,
    );
    pipeline.unmount();

    expect(panelCount).toBe(36);
    expect(panelCount + 1).toBe(37);
  });

  it("keeps German copy in simulator states reached through controls", () => {
    const renderGerman = (component: ReactNode) =>
      render(
        <DataScienceLocaleProvider locale="de">
          {component}
        </DataScienceLocaleProvider>,
      );

    const distribution = renderGerman(<DistributionExplorer />);
    fireEvent.click(distribution.getByRole("button", { name: "schief" }));
    expect(distribution.container.textContent).toContain("rechtsschief");
    distribution.unmount();

    const outliers = renderGerman(<OutlierDetector />);
    fireEvent.click(outliers.getByRole("button", { name: "IQR" }));
    expect(outliers.container.textContent).toContain(
      "Markiert Punkte jenseits von 1.5 × IQR",
    );
    outliers.unmount();

    const missingness = renderGerman(<MissingnessSim />);
    fireEvent.click(missingness.getByRole("button", { name: "MAR" }));
    expect(missingness.container.textContent).toContain(
      "Einkommen und Score fehlen in der EU-Region häufiger",
    );
    missingness.unmount();

    const imputation = renderGerman(<ImputationRace />);
    fireEvent.click(imputation.getByRole("button", { name: "KNN" }));
    expect(imputation.container.textContent).toContain(
      "Mittelt die 3 nach Index nächstgelegenen",
    );
    imputation.unmount();

    const scaling = renderGerman(<ScalerDemo />);
    fireEvent.click(scaling.getByRole("button", { name: "Min-Max" }));
    expect(scaling.container.textContent).toContain(
      "x′ = (x − min) / (max − min)",
    );
    expect(scaling.container.textContent).toContain(
      "Ausreißer stauchen die übrigen Werte",
    );
    scaling.unmount();

    const encoding = renderGerman(<EncodingComparison />);
    fireEvent.click(encoding.getByRole("button", { name: "Label" }));
    expect(encoding.container.textContent).toContain(
      "Diese Rangfolge hat keine sachliche Bedeutung",
    );
    fireEvent.click(encoding.getByRole("button", { name: "Target" }));
    expect(encoding.container.textContent).toContain("Out-of-Fold berechnet");
    encoding.unmount();

    const selection = renderGerman(<FeatureSelectionSim />);
    fireEvent.click(
      selection.getByRole("button", { name: "Mutual Information" }),
    );
    expect(selection.container.textContent).toContain(
      "kann nichtlineare marginale Abhängigkeit abbilden",
    );
    selection.unmount();

    const polynomial = renderGerman(<PolynomialExpansion />);
    fireEvent.click(polynomial.getByRole("button", { name: "Grad 3" }));
    expect(polynomial.container.textContent).toContain("Leichte Überanpassung");
    polynomial.unmount();

    const leakage = renderGerman(<LeakageDetector />);
    fireEvent.click(
      leakage.getByRole("button", { name: "target_mean_encoded" }),
    );
    fireEvent.click(leakage.getByRole("button", { name: "Merkmale prüfen" }));
    expect(leakage.container.textContent).toContain(
      "Das Modell sieht damit die gesuchte Antwort",
    );
    leakage.unmount();

    const shadow = renderGerman(<ShadowDeployment />);
    fireEvent.change(
      shadow.getByRole("slider", {
        name: "Prozentuale synthetische v2-Verschiebung",
      }),
      { target: { value: "100" } },
    );
    expect(shadow.container.textContent).toContain("Abweichungsrate");
    fireEvent.click(shadow.getByRole("button", { name: "Canary-Deployment" }));
    expect(shadow.container.textContent).toContain(
      "Ein definierter Anteil geeigneten Live-Verkehrs",
    );
    shadow.unmount();

    const tradeoff = renderGerman(<PrecisionRecallTradeoff />);
    fireEvent.change(
      tradeoff.getByRole("slider", { name: "Entscheidungsschwellenwert" }),
      { target: { value: "0.6" } },
    );
    expect(tradeoff.container.textContent).toContain("Hoher Schwellenwert");
    tradeoff.unmount();

    const checklist = renderGerman(<PostDeployChecklist />);
    fireEvent.click(
      checklist.getByRole("checkbox", { name: "Model Card erstellt" }),
    );
    expect(checklist.container.textContent).toContain("1 / 8 abgeschlossen");
    fireEvent.click(
      checklist.getByRole("button", {
        name: "Details zu Model Card erstellt anzeigen",
      }),
    );
    expect(checklist.container.textContent).toContain("Vorgesehene Nutzung");
    checklist.unmount();

    const drift = renderGerman(<DriftSimulator />);
    fireEvent.change(drift.getByRole("slider", { name: "Drift-Intensität" }), {
      target: { value: "2" },
    });
    expect(drift.container.textContent).toContain("Entscheidungsgrenze");
    drift.unmount();
  });

  it("preserves reviewed formulas and code identifiers in German", async () => {
    const expected = {
      home: ["12", "22", "~2h", "10k"],
      fund: ["180,000", "2.3%", "1/√n", "n=4", "SE≈1.7", "n=100", "SE≈0.35"],
      explore: ["1.5 × IQR", "Mahalanobis-Distanz"],
      clean: ["[0, 1]", "feature_was_missing"],
      feature: ["One-Hot", "A×B", "r=0.04"],
      model: ["Bias² + Varianz"],
      eval: ["0.1%", "99.9%", "τ=0.5", "0.7", "70%", "0.5", "PR-AUC"],
      interp: ["SHAP", "LIME", "Kapitel 09"],
      exp: ["+2", "80%", "α=0.05", "1 / Effekt²", "95%-KI"],
      causal: ["F-Statistik", "LATE"],
      peek: ["0.05", "1 − (1 − 0.05)ⁿ", "n = 20", "θ", "80%"],
      deploy: [
        "2023",
        "2025",
        "(actual − expected) × ln(actual/expected)",
        "v2",
        "0.30",
      ],
      cap: [
        "284,807",
        "0.17%",
        "284K",
        "492",
        "Rund 578",
        "99.83%",
        "scale_pos_weight = N_legit / N_fraud",
        "acht Lehrpunkte",
        "v1",
        "Kaggle",
      ],
    } satisfies Record<DsTranslatedCoreChapterId, readonly string[]>;

    for (const id of DS_TRANSLATED_CORE_CHAPTER_IDS) {
      const view = await renderChapter(id, "de");
      const content = view.container.textContent ?? "";
      for (const marker of expected[id]) {
        expect(content, `${id}: ${marker}`).toContain(marker);
      }
      view.unmount();
    }
  });

  it("does not leak representative English source copy into German prose or controls", async () => {
    const forbidden = [
      "turns noise into decisions",
      "By the end",
      "The curriculum",
      "Tools you'll see",
      "Open chapter",
      "Sample vs population",
      "Galton Board · Sampling Distribution",
      "Mean of means",
      "Key takeaways",
      "Distribution Explorer",
      "Outlier Detector",
      "Correlation Matrix",
      "Strong pairs",
      "Missingness Patterns",
      "Imputation Race",
      "Feature Scaling",
      "Leakage Detector",
      "Audit features",
      "Categorical encoding methods",
      "Polynomial feature expansion",
      "Feature selection methods",
      "Interaction terms: A×B vs A+B",
      "Bias-variance dance",
      "New training data",
      "Pick the metric before",
      "The confusion matrix",
      "Picking the right metric",
      "Peeking False-Positive Inflator",
      "A model you can’t explain",
      "Per-instance explanations",
      "Local approximation",
      "Global feature importance",
      "Global vs local",
      "A/B is how you learn",
      "The four pre-commits",
      "The lurking variable",
      "Causal graphs",
      "Classic DAG patterns",
      "Quasi-experiments",
      "Instrumental variables",
      "Every interim look inflates",
      "Multiple Testing & FWER",
      "CUPED, Variance Reduction via Covariates",
      "Statistical Power",
      "Model serving architecture",
      "Drift simulator",
      "Shadow & canary deployment",
      "Feature store & training-serving skew",
      "Dataset explorer, class imbalance",
      "ML pipeline, step-by-step",
      "Precision-recall tradeoff",
      "Production readiness checklist",
      "Back to the overview",
    ];

    for (const id of DS_TRANSLATED_CORE_CHAPTER_IDS) {
      const view = await renderChapter(id, "de");
      const content = view.container.textContent ?? "";
      for (const marker of forbidden) {
        expect(content, `${id}: ${marker}`).not.toContain(marker);
      }
      view.unmount();
    }
  });
});
