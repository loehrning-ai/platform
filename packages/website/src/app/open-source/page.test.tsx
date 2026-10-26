import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OPEN_SOURCE_TOOL_ARTIFACTS } from "@/lib/open-source/artifacts";
import { ContentsTable } from "@/components/open-source/contents-table";
import { ToolWall, plateEntries } from "@/components/open-source/tool-plate";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import OpenSourcePage, { generateMetadata } from "./page";

describe("OpenSourcePage", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
    getRequestLocaleMock.mockResolvedValue("de");
  });

  it("numbers the published tools from the candidate order", async () => {
    const { container } = render(await OpenSourcePage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Werkzeuge zum Anfassen." }),
    ).toBeInTheDocument();
    const wall = screen.getByRole("list", { name: "Werkzeuge" });
    expect(wall).toHaveAttribute(
      "data-entry-count",
      String(OPEN_SOURCE_TOOL_ARTIFACTS.length),
    );
    expect(container.querySelector("#nr-01")).not.toBeNull();
    // Two listed; rotfaden is staged (pending/rotfaden.test.tsx renders the
    // wall with all three) and never reaches the public page before admission.
    expect(OPEN_SOURCE_TOOL_ARTIFACTS).toHaveLength(2);
    expect(container.querySelector("#nr-03")).toBeNull();
    expect(screen.queryByText(/rotfaden/)).toBeNull();
    // Below three tools the plates are the contents: no table repeats them.
    expect(screen.queryByRole("navigation", { name: "Inhalt" })).toBeNull();

    const graph = JSON.parse(
      container.querySelector<HTMLScriptElement>("script#open-source-jsonld")
        ?.textContent ?? "{}",
    )["@graph"];
    expect(graph[1].hasPart).toHaveLength(OPEN_SOURCE_TOOL_ARTIFACTS.length);
  });

  it("puts the newest plate first and gives every ruler a name", () => {
    const artifacts = OPEN_SOURCE_TOOL_ARTIFACTS;

    const { container } = render(
      <>
        <ContentsTable entries={plateEntries(artifacts)} locale="de" />
        <ToolWall artifacts={artifacts} locale="de" />
      </>,
    );

    const plates = [...container.querySelectorAll("ol[data-entry-count] > li")];
    expect(plates.map((plate) => plate.id)).toEqual(["nr-02", "nr-01"]);
    expect(
      container.querySelector("ol[data-entry-count]"),
    ).toHaveAttribute("data-entry-count", "2");
    const contents = within(container.querySelector("nav")!).getAllByRole("link");
    expect(contents.map((link) => link.getAttribute("href"))).toEqual([
      "#nr-02",
      "#nr-01",
    ]);
    for (const title of ["reelcode", "CV Engine"]) {
      expect(
        screen.getByRole("slider", { name: `Zeitleiste ${title}` }),
      ).toBeInTheDocument();
    }
  });

  it("renders the English page with localized routes and structured data", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    const { container } = render(await OpenSourcePage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Tools you can touch." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "License policy" }),
    ).toHaveAttribute("href", "/en/open-source/lizenzrichtlinie");

    const graph = JSON.parse(
      container.querySelector<HTMLScriptElement>("script#open-source-jsonld")
        ?.textContent ?? "{}",
    )["@graph"];
    expect(graph[1]).toMatchObject({
      url: "https://loehrning.ai/en/open-source",
      inLanguage: "en-GB",
    });
    expect(graph[1].hasPart[0].url).toBe(
      "https://loehrning.ai/en/open-source/tools/cv-engine",
    );
  });

  it.each([
    ["de", "/open-source", "Open Source", "de_DE"],
    ["en", "/en/open-source", "Open source", "en_GB"],
  ] as const)(
    "emits %s metadata with a language-specific canonical",
    async (locale, canonical, title, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.alternates).toMatchObject({ canonical });
      expect(metadata.openGraph).toMatchObject({
        locale: openGraphLocale,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );
});
