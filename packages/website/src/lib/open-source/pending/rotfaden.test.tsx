import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentsTable } from "@/components/open-source/contents-table";
import { LiveExample } from "@/components/open-source/live-example";
import { OutputFilm } from "@/components/open-source/output-film";
import { ToolWall, plateEntries } from "@/components/open-source/tool-plate";
import {
  OPEN_SOURCE_ARTIFACT_CANDIDATES,
  OPEN_SOURCE_TOOL_ARTIFACTS,
  assertOpenSourceArtifacts,
} from "@/lib/open-source/artifacts";
import {
  ROTFADEN_ENGLISH_COPY,
  ROTFADEN_PENDING_TOOL,
  composeForValidation,
} from "./rotfaden";

/** The only place a 40-character hex string may appear: an obvious fixture. */
const FIXTURE_REVISION = "0123456789abcdef0123456789abcdef01234567";
const REPOSITORY = "https://github.com/loehrning-ai/rotfaden";
const composed = composeForValidation({
  href: REPOSITORY,
  revision: FIXTURE_REVISION,
  revisionHref: `${REPOSITORY}/commit/${FIXTURE_REVISION}`,
});
const guide = ROTFADEN_PENDING_TOOL.guide;
const specimen = guide.specimen;

const PUBLIC = resolve(process.cwd(), "public");
const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "..", "..", "ASSET_MANIFEST.json"), "utf8"),
) as { assets: { path: string; sizeBytes: number; sha256: string }[] };

function stored(src: string) {
  const bytes = readFileSync(resolve(PUBLIC, `.${src}`));
  return {
    bytes,
    sizeBytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

/** Every file the record names, with the size and hash it records. */
const ASSETS = [
  { src: ROTFADEN_PENDING_TOOL.license.href, ...ROTFADEN_PENDING_TOOL.license },
  guide.screenshot,
  ...guide.demo,
  ...guide.outputFilms,
  ...guide.outputFilms.map((film) => film.poster),
  specimen.film,
  specimen.film.poster,
];

/** The handler type of every track in an mp4: `vide`, `soun`, ... */
function trackHandlers(bytes: Buffer): string[] {
  const handlers: string[] = [];
  for (let at = bytes.indexOf("hdlr"); at !== -1; at = bytes.indexOf("hdlr", at + 4)) {
    handlers.push(bytes.subarray(at + 12, at + 16).toString("latin1"));
  }
  return handlers;
}

describe("staged rotfaden record", () => {
  it("passes the real validator once a pin exists, beside every candidate", () => {
    expect(() =>
      assertOpenSourceArtifacts([...OPEN_SOURCE_ARTIFACT_CANDIDATES, composed]),
    ).not.toThrow();
    expect(composed.guide.quickstart?.command).toContain(
      `git checkout ${FIXTURE_REVISION}`,
    );
    expect(composed.guide.quickstart?.command).toMatch(
      /&& bin\/rotfaden new mein-workshop --topic "[^"]+" && bin\/rotfaden check mein-workshop$/,
    );
    expect(composed.guide.documentation.href).toBe(
      `${REPOSITORY}/blob/${FIXTURE_REVISION}/README.md`,
    );
  });

  it("carries no source and stays out of every catalog", () => {
    expect("source" in ROTFADEN_PENDING_TOOL).toBe(false);
    expect(
      OPEN_SOURCE_ARTIFACT_CANDIDATES.map((artifact) => artifact.id),
    ).not.toContain(ROTFADEN_PENDING_TOOL.id);
    expect(OPEN_SOURCE_TOOL_ARTIFACTS.map((artifact) => artifact.slug)).not.toContain(
      ROTFADEN_PENDING_TOOL.slug,
    );
  });

  it("names the install line in the installation guide", () => {
    expect(guide.installation.steps[0].command).toBe(
      "/plugin marketplace add loehrning-ai/rotfaden",
    );
  });

  it.each(ASSETS.map((asset) => [asset.src, asset] as const))(
    "stores %s byte for byte, as the record and ASSET_MANIFEST.json say",
    (src, asset) => {
      const file = stored(src);
      expect(file.sizeBytes).toBe(asset.sizeBytes);
      expect(file.sha256).toBe(asset.sha256);
      const row = manifest.assets.find(
        (entry) => entry.path === `packages/website/public${src}`,
      );
      expect(row).toMatchObject({ sizeBytes: file.sizeBytes, sha256: file.sha256 });
    },
  );

  it("ships silent films: one video track, no sound track", () => {
    for (const film of [...guide.outputFilms, specimen.film]) {
      // `mdir` is the handler of the empty metadata box, not a track.
      const handlers = trackHandlers(stored(film.src).bytes);
      expect(handlers.filter((handler) => handler !== "mdir")).toEqual(["vide"]);
    }
  });

  it("has an English line for every German one", () => {
    const english = ROTFADEN_ENGLISH_COPY.guide;
    expect(english.prerequisites).toHaveLength(guide.prerequisites.length);
    expect(english.installation.steps).toHaveLength(guide.installation.steps.length);
    expect(english.usage.steps).toHaveLength(guide.usage.steps.length);
    expect(english.integration.steps).toHaveLength(guide.integration.steps.length);
    expect(english.demo).toHaveLength(guide.demo.length);
    expect(english.relatedLearning).toHaveLength(guide.relatedLearning.length);
    expect(english.outputFilmAlts).toHaveLength(guide.outputFilms.length);
    expect(english.liveExample?.links).toHaveLength(guide.liveExample.links.length);
  });
});

describe("the open-source wall with the staged entry", () => {
  const order = [...OPEN_SOURCE_ARTIFACT_CANDIDATES, composed];
  const artifacts = [...OPEN_SOURCE_TOOL_ARTIFACTS, composed];

  it("holds three entries, two listed and one staged, newest first", () => {
    const { container } = render(
      <>
        <ContentsTable entries={plateEntries(artifacts, order)} locale="de" />
        <ToolWall artifacts={artifacts} locale="de" order={order} />
      </>,
    );
    expect(OPEN_SOURCE_TOOL_ARTIFACTS).toHaveLength(2);
    const wall = container.querySelector("ol[data-entry-count]");
    expect(wall).toHaveAttribute("data-entry-count", "3");
    const plates = [...container.querySelectorAll("ol[data-entry-count] > li")];
    expect(plates.map((plate) => plate.id)).toEqual(["nr-03", "nr-02", "nr-01"]);

    const plate = within(plates[0] as HTMLElement);
    expect(plate.getByRole("heading", { level: 2, name: "rotfaden" })).toBeInTheDocument();
    // the plate plays the square specimen film, not the 2:1 screenshot
    expect(plates[0].querySelector("video source")).toHaveAttribute("src", specimen.film.src);
    expect(plates[0].textContent).toContain(specimen.film.alt);
    expect(plates[0].querySelector(`img[src="${guide.screenshot.src}"]`)).toBeNull();
    expect(
      within(container.querySelector("nav")!).getByRole("link", { name: /rotfaden/ }),
    ).toHaveAttribute("href", "#nr-03");
  });

  it("plays both usage films, muted, from their posters", () => {
    const { container } = render(
      <>
        {guide.outputFilms.map((film) => (
          <OutputFilm
            key={film.src}
            film={film}
            title="rotfaden"
            labels={{ play: "Abspielen", pause: "Anhalten" }}
          />
        ))}
      </>,
    );
    const videos = [...container.querySelectorAll("video")];
    expect(videos.map((video) => video.querySelector("source")?.getAttribute("src"))).toEqual([
      "/media/tools/rotfaden/usage-16x9.mp4",
      "/media/tools/rotfaden/usage-9x16.mp4",
    ]);
    for (const video of videos) {
      expect(video.muted).toBe(true);
      expect(video).toHaveAttribute("preload", "none");
      expect(video.getAttribute("poster")).toMatch(/^\/media\/tools\/rotfaden\/usage-.+\.jpg$/);
    }
    expect(screen.getAllByRole("button", { name: "Abspielen: rotfaden" })).toHaveLength(2);
  });

  it("links the Workshop 06 deck, presenter view, kit and demo", () => {
    render(<LiveExample example={guide.liveExample} locale="de" />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Live-Beispiel: Workshop 06" }),
    ).toBeInTheDocument();
    const links = within(screen.getByRole("list")).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/workshops/angebote-mit-ki-vergleichen/slides.html",
      "/workshops/angebote-mit-ki-vergleichen/presenter.html",
      "/workshops/angebote-mit-ki-vergleichen/kit",
      "/demos/angebote-mit-ki-vergleichen",
    ]);
    expect(screen.getByText(/sind erfunden/)).toBeInTheDocument();
    expect(screen.queryByText(/Live gehalten/)).toBeNull();
  });

  it("localizes the page routes for English and keeps the German deck file", () => {
    const english = ROTFADEN_ENGLISH_COPY.guide.liveExample!;
    render(
      <LiveExample
        example={{
          ...english,
          links: guide.liveExample.links.map((link, index) => ({
            ...link,
            ...english.links[index],
          })),
        }}
        locale="en"
      />,
    );
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      "/workshops/angebote-mit-ki-vergleichen/slides.html",
      "/workshops/angebote-mit-ki-vergleichen/presenter.html",
      "/en/workshops/angebote-mit-ki-vergleichen/kit",
      "/en/demos/angebote-mit-ki-vergleichen",
    ]);
  });
});
