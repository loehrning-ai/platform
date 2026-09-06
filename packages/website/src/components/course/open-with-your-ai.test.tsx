import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { findLesson, bookById, workshopBySlug } from "@/lib/mcp/catalog";
import {
  parseResourceUri,
  bookUri,
  lessonUri,
  workshopUri,
} from "@/lib/mcp/uris";
import { OpenWithYourAi } from "./open-with-your-ai";
import {
  buildOpenWithYourAiPrompt,
  OPEN_WITH_YOUR_AI_COPY,
} from "./open-with-your-ai-copy";

/**
 * Drives the real island and the real prompt builder.
 *
 * The load-bearing claims: the copied prompt names the server address and
 * every resource address of the page, both addresses stay readable without a
 * clipboard, every control is a 44 pixel target, and a refused clipboard
 * writes the prompt into the page instead of pretending the copy worked.
 */

const SERVER_URL = "https://loehrning.ai/api/mcp";
const HELP_HREF = "/hilfe/eigene-ki";

const LESSON_RESOURCES = [
  { uri: "lesson://ki-fuehrerschein/block_1_lesson_1", title: "Erste Lektion" },
  {
    uri: "lesson://ki-fuehrerschein/block_1_lesson_2",
    title: "Zweite Lektion",
  },
] as const;

function stubClipboard(writeText: (value: string) => Promise<void>): void {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
}

function renderIsland(
  overrides: Partial<Parameters<typeof OpenWithYourAi>[0]> = {},
) {
  return render(
    <OpenWithYourAi
      kind="lesson"
      contextTitle="Block 1: Entdeckung"
      resources={LESSON_RESOURCES}
      serverUrl={SERVER_URL}
      helpHref={HELP_HREF}
      locale="de"
      {...overrides}
    />,
  );
}

afterEach(cleanup);

describe("open-with-your-ai prompt", () => {
  it("names the server and every resource address of the page", () => {
    const prompt = buildOpenWithYourAiPrompt({
      kind: "lesson",
      contextTitle: "Block 1: Entdeckung",
      resources: LESSON_RESOURCES,
      serverUrl: SERVER_URL,
      locale: "de",
    });

    expect(prompt).toContain(SERVER_URL);
    for (const resource of LESSON_RESOURCES) {
      expect(prompt).toContain(resource.uri);
      expect(prompt).toContain(resource.title);
    }
    expect(prompt).toContain("Block 1: Entdeckung");
  });

  it("builds a prompt in each locale and never mixes them", () => {
    const input = {
      kind: "chapter" as const,
      contextTitle: "Die KI-Landschaft: Der Eisberg",
      resources: [{ uri: "book://ki-landschaft/01_eisberg", title: "Eisberg" }],
      serverUrl: SERVER_URL,
    };

    const german = buildOpenWithYourAiPrompt({ ...input, locale: "de" });
    const english = buildOpenWithYourAiPrompt({ ...input, locale: "en" });

    expect(german).toContain(
      OPEN_WITH_YOUR_AI_COPY.de.kinds.chapter.promptTask,
    );
    expect(german).not.toContain(
      OPEN_WITH_YOUR_AI_COPY.en.kinds.chapter.promptTask,
    );
    expect(english).toContain(
      OPEN_WITH_YOUR_AI_COPY.en.kinds.chapter.promptTask,
    );
    expect(english).not.toContain(
      OPEN_WITH_YOUR_AI_COPY.de.kinds.chapter.promptTask,
    );
  });

  it("keeps a workshop prompt from taking the decision labs off the learner", () => {
    const prompt = buildOpenWithYourAiPrompt({
      kind: "workshop",
      contextTitle: "KI-Prognosen einschätzen",
      resources: [
        { uri: "workshop://ki-prognosen-einschaetzen", title: "Prognosen" },
      ],
      serverUrl: SERVER_URL,
      locale: "de",
    });

    expect(prompt).toContain("Entscheidungsaufgaben nicht ab");
  });
});

describe("<OpenWithYourAi>", () => {
  it("shows the server address and the resource addresses without any interaction", () => {
    renderIsland();

    expect(screen.getByText(SERVER_URL)).toBeInTheDocument();
    for (const resource of LESSON_RESOURCES) {
      expect(screen.getByText(resource.uri)).toBeInTheDocument();
    }
  });

  it("names the region so a screen reader can find it, in both locales", () => {
    const { unmount } = renderIsland();
    expect(
      screen.getByRole("region", { name: OPEN_WITH_YOUR_AI_COPY.de.label }),
    ).toBeInTheDocument();
    unmount();

    renderIsland({ locale: "en" });
    expect(
      screen.getByRole("region", { name: OPEN_WITH_YOUR_AI_COPY.en.label }),
    ).toBeInTheDocument();
  });

  it("copies the full prompt and confirms it in a live region", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderIsland();

    fireEvent.click(
      screen.getByRole("button", {
        name: OPEN_WITH_YOUR_AI_COPY.de.copyAction,
      }),
    );

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0]![0] as string;
    expect(copied).toContain(SERVER_URL);
    expect(copied).toContain(LESSON_RESOURCES[0].uri);
    expect(
      await screen.findByText(OPEN_WITH_YOUR_AI_COPY.de.copiedNotice),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      OPEN_WITH_YOUR_AI_COPY.de.copiedNotice,
    );
  });

  it("writes the prompt into the page when the clipboard refuses", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    renderIsland();

    fireEvent.click(
      screen.getByRole("button", {
        name: OPEN_WITH_YOUR_AI_COPY.de.copyAction,
      }),
    );

    expect(
      await screen.findByText(OPEN_WITH_YOUR_AI_COPY.de.copyFailedNotice),
    ).toBeInTheDocument();
    expect(
      screen.getByText(OPEN_WITH_YOUR_AI_COPY.de.promptLabel),
    ).toBeInTheDocument();
    const shown = document.querySelector("pre")?.textContent ?? "";
    expect(shown).toContain(SERVER_URL);
    expect(shown).toContain(LESSON_RESOURCES[1].uri);
  });

  it("says nothing in the live region before the learner acts", () => {
    renderIsland();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("gives every control a 44 pixel target and links to the setup guide", () => {
    renderIsland();

    const button = screen.getByRole("button", {
      name: OPEN_WITH_YOUR_AI_COPY.de.copyAction,
    });
    expect(button.className).toContain("min-h-11");
    expect(button.className).toContain("min-w-11");

    const link = screen.getByRole("link", {
      name: OPEN_WITH_YOUR_AI_COPY.de.helpLink,
    });
    expect(link).toHaveAttribute("href", HELP_HREF);
    expect(link.className).toContain("min-h-11");
    expect(link.className).toContain("min-w-11");
  });

  it("labels a single address in the singular and several in the plural", () => {
    const { unmount } = renderIsland({
      kind: "workshop",
      resources: [
        { uri: "workshop://ki-prognosen-einschaetzen", title: "Prognosen" },
      ],
    });
    expect(
      screen.getByText(OPEN_WITH_YOUR_AI_COPY.de.addressLabel),
    ).toBeInTheDocument();
    unmount();

    renderIsland();
    expect(
      screen.getByText(OPEN_WITH_YOUR_AI_COPY.de.addressesLabel),
    ).toBeInTheDocument();
  });
});

describe("open-with-your-ai addresses", () => {
  it("uses address shapes the MCP server actually parses", () => {
    const uris = [
      lessonUri("ki-fuehrerschein", "block_1_lesson_1", "de"),
      lessonUri("ki-fuehrerschein", "block_1_lesson_1", "en"),
      workshopUri("ki-prognosen-einschaetzen", "de"),
      bookUri("ki-landschaft", "01_eisberg", "en"),
    ];

    for (const uri of uris) {
      expect(() => parseResourceUri(uri)).not.toThrow();
    }
  });

  it("addresses a lesson, a workshop and a chapter that exist in the registries", () => {
    expect(
      findLesson("ki-fuehrerschein", "block_1_lesson_1", "de"),
    ).toBeDefined();
    expect(workshopBySlug("ki-prognosen-einschaetzen", "de")).toBeDefined();
    expect(bookById("ki-landschaft")).toBeDefined();
  });
});
