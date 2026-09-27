import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { loadQuestionSheet } from "@/lib/vorlagen/registry";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import KiInDerAusbildungPage, { generateMetadata } from "./page";
import { SECTION_IDS } from "./post-copy";

const POST = BLOG_POSTS.find((post) => post.slug === "ki-in-der-ausbildung")!;

/** Rendered article text with a space between text nodes. */
function articleText(): string {
  const article = document.querySelector("article.post-wz");
  if (!article) throw new Error("article.post-wz missing");
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  while (walker.nextNode()) parts.push(walker.currentNode.textContent ?? "");
  return parts.join(" ").replace(/\s+/g, " ");
}

// Claims the fact check dropped or reworded. None may come back on the page.
const DROPPED_OR_REPLACED = [
  /Azubi-Recruiting/i,
  /u-form/i,
  /Hochschule Koblenz/i,
  /15 Prozent/,
  /49 Prozent/,
  /Studie eines Anbieters/,
  /Vendor study/i,
  /am Gesetzestext geprüft/,
  /against the statute text/i,
  /abgerufen am/i,
  /\baccessed\b/i,
  /Die markierte Station/,
  /The marked station/,
  /Material für Ausbildungspersonal/,
  /aus Sicht der Unternehmen/,
  /material for training staff/i,
  /from the companies' side/i,
  /KI in Abschlussprüfungen/,
  /AI in final exams/i,
  /muss er dafür nicht mehr unterschrieben sein/,
];

beforeEach(() => {
  getRequestLocaleMock.mockReset();
});

afterEach(cleanup);

describe("KiInDerAusbildungPage", () => {
  it("renders the German article, every section and the whole sheet", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    render(await KiInDerAusbildungPage());
    const sheet = await loadQuestionSheet("ki-in-der-ausbildung-fragen", "de");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "KI in der Ausbildung: Fragen für JAV und Betriebsrat",
      }),
    ).toBeInTheDocument();
    for (const id of SECTION_IDS) {
      expect(document.getElementById(id), `section #${id}`).not.toBeNull();
    }
    expect(screen.getAllByRole("heading", { level: 5 })).toHaveLength(
      sheet.questionCount,
    );
    expect(document.querySelector("a[download]")).toHaveAttribute(
      "href",
      "/vorlagen/ki-in-der-ausbildung-fragen.md",
    );
    expect(
      screen.getByRole("button", { name: "Fragenliste drucken" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "§ Lesepunkte" }),
    ).toBeInTheDocument();

    const text = articleText();
    expect(text).toContain("Keine Rechtsberatung");
    expect(text).toMatch(/§\s37\sAbs\.\s6/);
    expect(text).toMatch(/1\.\sOktober\s2026/);
    expect(text).toMatch(/30\.\sNovember\s2026/);
    expect(text).toMatch(/2\.\sDezember\s2027/);
    expect(text).toMatch(/Stand:\s27\.\sSeptember\s2026\.\sKeine Rechtsberatung\./);
    expect(text).not.toContain("Weiterlesen");
    expect(text).not.toContain("Zertifikat erforderlich");
    expect(text).not.toContain("sicherstellen");
    for (const pattern of DROPPED_OR_REPLACED) {
      expect(text, String(pattern)).not.toMatch(pattern);
    }
  });

  it("links the hero to the sheet and says each thing once", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    render(await KiInDerAusbildungPage());

    const hero = document.getElementById("hero")!;
    // The reason to visit is in the first view: jump, print, download.
    const actions = hero.querySelector(".wz-hero__actions")!;
    expect(
      within(actions as HTMLElement).getByRole("link", { name: /Zur Fragenliste/ }),
    ).toHaveAttribute("href", "#fragen");
    expect(
      within(actions as HTMLElement).getByRole("button", { name: "Drucken" }),
    ).not.toHaveClass("wz-btn--primary");
    expect(
      within(actions as HTMLElement).getByRole("link", { name: "Markdown" }),
    ).toHaveAttribute("download");
    // One lede sentence; the audience is the "Für" fact only.
    expect(hero.querySelectorAll(".wz-hero__lede")).toHaveLength(1);
    expect(hero.querySelector(".wz-hero__intro")).toBeNull();
    expect(within(hero).queryByRole("link", { name: "zum Drucken und Herunterladen" })).toBeNull();
    expect(hero).not.toHaveTextContent("Vorwissen brauchst du keins");
    const grenzen = document.getElementById("grenzen")!.textContent ?? "";
    expect(grenzen.match(/Keine Rechtsberatung/g)).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Was die JAV kann und welche Rechte der Betriebsrat hat",
      }),
    ).toBeInTheDocument();
    // The exercise lines up with the title column like every other block.
    expect(document.querySelector(".wz-task")?.parentElement).toHaveClass("wz-body");
    expect(document.querySelector("#fragen .wz-caption")).toHaveTextContent(
      "Druckt auf A4, keine Frage wird auf zwei Seiten getrennt.",
    );
  });

  it("marks rows that link to pages in the other language", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    render(await KiInDerAusbildungPage());

    const faq = document.querySelector(
      '#quellen a[href="https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers"]',
    );
    expect(faq).toHaveAttribute("hreflang", "en");
    expect(faq).toHaveTextContent("auf Englisch");
    const statute = document.querySelector(
      '#quellen a[href="https://www.gesetze-im-internet.de/betrvg/"]',
    );
    expect(statute).toHaveAttribute("hreflang", "de");
    expect(statute).not.toHaveTextContent("auf Englisch");
    expect(document.getElementById("weiterlernen")).not.toHaveTextContent(
      "auf Englisch",
    );
  });

  it("derives the Route from the registry and the sheet's review date", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    render(await KiInDerAusbildungPage());

    const route = screen.getByRole("list", { name: "Termine" });
    const stations = within(route).getAllByRole("listitem");
    expect(stations.map((station) => station.getAttribute("data-state"))).toEqual([
      "past",
      "past",
      "future",
      "future",
    ]);
    expect(stations[2]).toHaveTextContent(
      "1. Oktober 2026 bis 30. November 2026",
    );
    expect(stations[2]).toHaveTextContent("(kommt noch)");
    expect(stations[0]).toHaveTextContent("(gilt schon)");
    expect(route.querySelector('[data-state="current"]')).toBeNull();
    // The legend names the date the stations are drawn for.
    expect(route.nextElementSibling).toHaveTextContent(
      /^Stationen mit Stand 27\.\sSeptember\s2026\. .*Markiert heißt, sie läuft gerade\./,
    );
  });

  it("links statutes, the exercise questions and the catalog courses", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    render(await KiInDerAusbildungPage());

    expect(
      // Link names carry U+00A0 after each marker (keepLegalRefsTogether).
      screen.getByRole("link", { name: /^§\s64\sAbs\.\s1\sBetrVG$/ }),
    ).toHaveAttribute("href", "https://www.gesetze-im-internet.de/betrvg/__64.html");
    expect(
      screen.getByRole("link", { name: /^§\s43\sAbs\.\s1\sNr\.\s2\sBBiG$/ }),
    ).toHaveAttribute(
      "href",
      "https://www.gesetze-im-internet.de/bbig_2005/__43.html",
    );
    // One tap target for the three questions (44px rule): the phrase links
    // to the first of them.
    const exercise = document.querySelector(".wz-task")!;
    expect(
      [...exercise.querySelectorAll("a")].map((link) => [
        link.textContent,
        link.getAttribute("href"),
      ]),
    ).toEqual([["die Fragen 3, 6 und 7", "#frage-3"]]);
    for (const target of ["frage-3", "frage-6", "frage-7"]) {
      expect(document.getElementById(target)).not.toBeNull();
    }
    for (const href of ["/ki-und-gesellschaft", "/eu-ai-act-kurs", "/ki-fuehrerschein"]) {
      expect(document.querySelector(`#weiterlernen a[href="${href}"]`)).not.toBeNull();
    }
    expect(
      screen.getByRole("link", { name: "Feedback-Formular" }),
    ).toHaveAttribute("href", "/feedback");
  });

  it("states a reading time within two minutes of the rendered German text", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    render(await KiInDerAusbildungPage());

    const words = articleText()
      .split(" ")
      .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
    const minutes = Math.ceil(words / 230);
    expect(Math.abs(POST.readingTimeMin - minutes)).toBeLessThanOrEqual(2);
  });

  it("renders the English article without German UI labels", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    render(await KiInDerAusbildungPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "AI in apprenticeships: questions for youth representatives and works councils",
      }),
    ).toBeInTheDocument();
    expect(document.querySelector("a[download]")).toHaveAttribute(
      "href",
      "/vorlagen/ki-in-der-ausbildung-fragen.en.md",
    );
    expect(
      screen.getByRole("navigation", { name: "§ Reading points" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Print the question list" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to the blog" }),
    ).toHaveAttribute("href", "/en/blog");

    const text = articleText();
    for (const german of ["Rechtsgrundlage", "Fragenliste drucken", "Übung"]) {
      expect(text).not.toContain(german);
    }
    expect(text).toMatch(/Status:\s27\sSeptember\s2026\.\sNot legal advice\./);
    expect(text).toMatch(/1\sOctober\s2026\sto\s30\sNovember\s2026/);
    expect(text).toMatch(/Milestones as of 27\sSeptember\s2026\./);
    expect(text).toContain("Instead, the law gives it a fixed place");
    expect(text).toContain("see to it that laws, collective agreements");
    expect(text).not.toContain("You need no prior knowledge");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "What the JAV can do and which rights the works council has",
      }),
    ).toBeInTheDocument();
    expect(
      within(document.getElementById("hero")!).getByRole("link", {
        name: /To the question list/,
      }),
    ).toHaveAttribute("href", "#fragen");

    // German terms carry lang="de" (WCAG 3.1.2); axe does not check this.
    const german = [...document.querySelectorAll('article.post-wz [lang="de"]')]
      .filter((node) => node.tagName === "SPAN")
      .map((node) => node.textContent);
    expect(german).toEqual(
      expect.arrayContaining([
        "Jugend- und Auszubildendenvertretung",
        "Einigungsstelle",
        "Künstliche Intelligenz und Mitbestimmung",
        "Berichtsheft",
        "Bundesarbeitsgericht",
      ]),
    );
    // German-only targets say so: hreflang and a visible word.
    expect(
      screen.getByRole("link", { name: /^Section\s64\(1\)\sBetrVG$/ }),
    ).toHaveAttribute("hreflang", "de");
    for (const href of [
      "https://www.gesetze-im-internet.de/betrvg/",
      "https://www.bibb.de/de/207534.php",
    ]) {
      const row = document.querySelector(`article.post-wz a.wz-row[href="${href}"]`);
      expect(row, href).toHaveAttribute("hreflang", "de");
      expect(row, href).toHaveTextContent("in German");
    }
    expect(
      document.querySelector(
        'a.wz-row[href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj"]',
      ),
    ).not.toHaveTextContent("in German");
    for (const pattern of DROPPED_OR_REPLACED) {
      expect(text, String(pattern)).not.toMatch(pattern);
    }
    for (const href of [
      "/en/ki-und-gesellschaft",
      "/en/eu-ai-act-kurs",
      "/en/ki-fuehrerschein",
    ]) {
      expect(document.querySelector(`#weiterlernen a[href="${href}"]`)).not.toBeNull();
    }
  });

  it("builds localized metadata with manifest dates for both locales", async () => {
    for (const locale of ["de", "en"] as const) {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();
      const path =
        locale === "de"
          ? "/blog/ki-in-der-ausbildung"
          : "/en/blog/ki-in-der-ausbildung";
      expect(metadata.alternates).toMatchObject({
        canonical: path,
        languages: {
          de: "/blog/ki-in-der-ausbildung",
          en: "/en/blog/ki-in-der-ausbildung",
        },
      });
      expect(metadata.openGraph).toMatchObject({
        type: "article",
        publishedTime: POST.datePublished,
        modifiedTime: POST.dateModified,
        url: `https://loehrning.ai${path}`,
      });
      expect(metadata.robots).toMatchObject({ index: true, follow: true });
    }
  });

  it("describes the sheet as a CC BY 4.0 Markdown part in the JSON-LD", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    render(await KiInDerAusbildungPage());

    const script = document.getElementById("ki-in-der-ausbildung-jsonld");
    const graph = JSON.parse(script?.textContent ?? "{}") as {
      "@graph": Record<string, unknown>[];
    };
    const posting = graph["@graph"].find(
      (entry) => entry["@type"] === "BlogPosting",
    ) as Record<string, unknown> & { hasPart: Record<string, unknown> };
    expect(posting.datePublished).toBe(POST.datePublished);
    expect(posting.inLanguage).toBe("de-DE");
    expect(posting.wordCount).toEqual(expect.any(Number));
    expect(posting.hasPart).toMatchObject({
      "@type": "DigitalDocument",
      encodingFormat: "text/markdown",
      url: "https://loehrning.ai/vorlagen/ki-in-der-ausbildung-fragen.md",
      license: "https://creativecommons.org/licenses/by/4.0/",
      dateModified: "2026-09-27",
    });
  });
});
