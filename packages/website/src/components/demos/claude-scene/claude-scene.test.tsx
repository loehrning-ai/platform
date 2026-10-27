import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { GlasRoot } from "@/components/demos/glas/glas-root";
import { CLAUDE_SCENES } from "@/lib/claude-scenes";
import { promptsFor, type ClaudeRecording, type TimelineItem } from "@/lib/claude-runs";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { sceneKitFiles } from "./claude-scene-section";
import { ClaudeDesktopScene, fileReady, writtenByTurn } from "./claude-desktop-scene";
import { fileKind, fileSize } from "./file-kind";
import { MarkdownLite, parseMarkdown } from "./markdown-lite";
import { buildSchedule, clockLabel, frameAt, groupSteps, paceAnswer, REPLAY, seedFrom, wordChunks, type ReplayTurn } from "./replay-engine";

const SCENE = CLAUDE_SCENES["ki-prognosen-einschaetzen"];
if (!SCENE) throw new Error("W01 has a recorded scene");
const TAKE = SCENE.recordings[0] as ClaudeRecording;

function turnOf(recording: ClaudeRecording): ReplayTurn {
  return { ...recording, prompt: recording.prompt };
}

describe("replay engine (claude-desktop-spec 5)", () => {
  it("streams the recorded final text byte for byte, at most 40 characters a second", () => {
    const schedule = buildSchedule([turnOf(TAKE), ...TAKE.follow_ups], { seed: seedFrom(TAKE.id) });
    const finished = frameAt(schedule, Number.POSITIVE_INFINITY);
    expect(finished.done).toBe(true);
    expect(finished.turns[0]?.answer).toBe(TAKE.final_text);
    expect(finished.turns[1]?.answer).toBe(TAKE.follow_ups[0]?.final_text);
    for (const [index, turn] of schedule.turns.entries()) {
      const answers = schedule.events.filter((event) => event.turn === index && event.type === "answer");
      const first = answers[0];
      const last = answers[answers.length - 1];
      if (!first || !last || first.type !== "answer" || last.type !== "answer") continue;
      expect(last.end).toBe(turn.final_text.length);
      // Never faster than maxCps over the whole answer (jitter only slows single chunks).
      expect((last.at - first.at + 1000 / REPLAY.maxCps * first.end) / 1000).toBeGreaterThanOrEqual((turn.final_text.length / REPLAY.maxCps) * (1 - REPLAY.jitter) - 0.01);
    }
  });

  it("only ever shows a prefix of the answer, and the same seed gives the same replay", () => {
    const a = buildSchedule([turnOf(TAKE)], { seed: 7 });
    const b = buildSchedule([turnOf(TAKE)], { seed: 7 });
    expect(a.events).toEqual(b.events);
    for (const t of [0, 500, 2000, 8000, a.duration / 2, a.duration]) {
      const answer = frameAt(a, t).turns[0]?.answer ?? "";
      expect(TAKE.final_text.startsWith(answer)).toBe(true);
    }
    expect(frameAt(a, 0).turns[0]?.phase).toBe("sending");
  });

  it("shortens waiting, never content: think and step gaps are clamped and flagged", () => {
    const timeline: TimelineItem[] = [
      { t_ms: 20_000, kind: "tool_use", tool: "Skill", input: { skill: "s" } },
      { t_ms: 20_100, kind: "tool_result", is_error: false },
      { t_ms: 60_000, kind: "tool_use", tool: "Read", input: { file_path: "work/a.csv" } },
      { t_ms: 60_100, kind: "tool_result", is_error: true },
      { t_ms: 61_000, kind: "text_start" },
      { t_ms: 61_000, kind: "text", chunk: "Fertig." },
    ];
    const turn: ReplayTurn = { prompt: "Frage?", timeline, final_text: "Fertig.", stats: { duration_ms: 61_000, duration_api_ms: 1, ttft_ms: 1, num_turns: 2, output_tokens: 3 }, is_error: false, stop_reason: "end_turn" };
    const schedule = buildSchedule([turn]);
    expect(schedule.clamped).toEqual([true]);
    expect(schedule.pacing).toEqual(["approximated"]);
    expect(schedule.duration).toBeLessThan(REPLAY.sendMs + REPLAY.thinkMaxMs + REPLAY.stepMaxMs + REPLAY.stepMinMs + 1000);
    const steps = frameAt(schedule, Number.POSITIVE_INFINITY).turns[0]?.steps ?? [];
    expect(steps.map((step) => step.kind)).toEqual(["skill", "read", "other"]);
    expect(steps[2]?.isError).toBe(true);
    expect(frameAt(schedule, Number.POSITIVE_INFINITY).turns[0]?.realMs).toBe(61_000);
  });

  it("replays recorded deltas when they really streamed", () => {
    const text = "a".repeat(120);
    const timeline: TimelineItem[] = [{ t_ms: 0, kind: "text_start" }, ...Array.from({ length: 12 }, (_, index) => ({ t_ms: index * 300, kind: "text" as const, chunk: "a".repeat(10) }))];
    expect(paceAnswer(timeline, text, 1).pacing).toBe("recorded");
    expect(paceAnswer([{ t_ms: 0, kind: "text_start" }, { t_ms: 1, kind: "text", chunk: text }], text, 1).pacing).toBe("approximated");
  });

  it("chunks at word boundaries, folds Bash and Read rows and prints the timer", () => {
    expect(wordChunks("Kochen Sie 729 Gläser.").join("")).toBe("Kochen Sie 729 Gläser.");
    const rows = groupSteps([
      { kind: "read", tool: "Read", target: "a.csv" },
      { kind: "read", tool: "Read", target: "b.md" },
      { kind: "bash", tool: "Bash", target: "python3" },
      { kind: "bash", tool: "Bash", target: "python3" },
    ]);
    expect(rows.map((row) => [row.kind, row.target, row.count])).toEqual([
      ["read", "a.csv, b.md", 2],
      ["bash", "python3", 2],
    ]);
    expect(clockLabel(62_704)).toBe("1:03");
  });
});

describe("produced files", () => {
  it("opens a file only once the replay reached the last turn that changed it", () => {
    const take = SCENE.recordings.find((recording) => recording.id === "de-trauen-with-2") as ClaudeRecording;
    const written = writtenByTurn(take);
    // The question writes the rule file; the follow-up changes it with sed -i (the canteen stops).
    expect(written[0]?.has("pruefregel-linsensuppe.md")).toBe(true);
    expect(written[1]?.has("pruefregel-linsensuppe.md")).toBe(true);
    expect(fileReady("pruefregel-linsensuppe.md", written, 1)).toBe(false);
    expect(fileReady("pruefregel-linsensuppe.md", written, 2)).toBe(true);
  });
});

describe("MarkdownLite", () => {
  it("parses the recorded answer's tables, lists and bold into React, never HTML strings", () => {
    const blocks = parseMarkdown(TAKE.final_text);
    expect(blocks.some((block) => block.type === "table")).toBe(true);
    expect(blocks.some((block) => block.type === "list" && block.ordered)).toBe(true);
    const html = renderToStaticMarkup(<MarkdownLite source={"**Fett** und `code`\n\n<script>alert(1)</script>"} />);
    expect(html).toContain("<strong>Fett</strong>");
    expect(html).not.toContain("<script>");
  });

  it("nests an indented list under its item instead of running it into the item's text", () => {
    const html = renderToStaticMarkup(<MarkdownLite source={"1. Anfordern:\n   - 03.02.2025: Zertifikat\n   - Zuordnung\n2. Prüfen\n\n3. Ablegen"} />);
    expect(html).toBe("<ol start=\"1\"><li>Anfordern:<ul><li>03.02.2025: Zertifikat</li><li>Zuordnung</li></ul></li><li>Prüfen</li><li>Ablegen</li></ol>");
  });

  it("draws one record over many columns as label and value per line", () => {
    const html = renderToStaticMarkup(<MarkdownLite source={"| Nr | Frage | Antwort | Status | Grund |\n|---|---|---|---|---|\n| 1 | Strom | 279,7 MWh | LÜCKE | September fehlt |"} />);
    expect(html).toContain('<th scope="row">Grund</th><td>September fehlt</td>');
    expect(html).not.toContain("<thead>");
  });

  it("draws an unfinished construct at the stream edge as plain text", () => {
    const html = renderToStaticMarkup(<MarkdownLite source={"Das ist **halb"} streaming />);
    expect(html).not.toContain("<strong>");
  });

  it("keeps an underscore inside a word as a letter, also at the stream edge", () => {
    const html = renderToStaticMarkup(<MarkdownLite source={"Die Datei strom_2025.csv und strom_zusammenfassung_entwurf.txt, dazu _betont_ und __fett__."} />);
    expect(html).toContain("strom_2025.csv");
    expect(html).toContain("strom_zusammenfassung_entwurf.txt");
    expect(html).toContain("<em>betont</em>");
    expect(html).toContain("<strong>fett</strong>");
    const edge = renderToStaticMarkup(<MarkdownLite source={"Laut strom_2025"} streaming />);
    expect(edge).toContain("strom_2025");
  });
});

describe("file chips", () => {
  it("names the kind and the size", () => {
    expect(fileKind("kosten.md")).toBe("Markdown");
    expect(fileSize(2388, "de")).toBe("2 KB");
    expect(fileSize(569, "en")).toBe("569 B");
  });

  it("reads the kit files from the shipped zip and checks their bytes against the recording", () => {
    const files = sceneKitFiles(SCENE);
    const named = new Set(SCENE.recordings.flatMap((recording) => recording.kit_files.map((file) => file.name)));
    expect(Object.keys(files).sort()).toEqual([...named].sort());
    expect(files["kosten.md"]?.text).toContain("Glas");
  });
});

describe("ClaudeDesktopScene", () => {
  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  for (const locale of ["de", "en"] as const) {
    it(`${locale}: labels the depiction with its date and model, never shows a logo, and offers the real files`, () => {
      const copy = DEMOS_PAGE_COPY[locale].claudeScene;
      const prompt = promptsFor(SCENE, locale).prompts[0];
      const take = SCENE.recordings.find((recording) => recording.id === prompt?.withSkill[0]) as ClaudeRecording;
      const { container } = render(
        <GlasRoot tone="dunkel">
          <ClaudeDesktopScene scene={SCENE} locale={locale} skillName={TAKE.skill_name} kitFiles={sceneKitFiles(SCENE)} />
        </GlasRoot>,
      );
      const date = locale === "de" ? "26.10.2026" : "26 October 2026";
      // One line says what it is (a depiction, a real answer, its date and model); one chip, the take.
      expect(container.querySelector(".cds-caption")).toHaveTextContent(copy.caption(date, "Claude Opus 5.5"));
      expect(container.querySelector(".cds-caption")?.textContent).toMatch(locale === "de" ? /Darstellung.*aufgezeichnet am/ : /depiction.*recorded on/);
      expect(container.querySelectorAll(".cds-chips > *")).toHaveLength(1);
      // How it was recorded, the exact model id and the takes set aside stay in the plain-text version.
      const how = container.querySelector("[data-scene-how]") as HTMLElement;
      expect(how.textContent).toContain(copy.noAi);
      if ((prompt?.rejected ?? 0) > 0) expect(how.textContent).toContain(copy.rejected(prompt?.rejected ?? 0));
      expect(container.querySelector(".cds-transcript")?.textContent).toContain("claude-opus-5-5");
      expect(container.querySelector("img, [data-logo]")).toBeNull();
      // The drawn window is decoration; every control lives in the dock.
      expect(container.querySelector(".cds-chrome")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByRole("link", { name: copy.downloadSkill })).toHaveAttribute("href", `/skills/${TAKE.skill_name}.zip`);
      expect(screen.getByRole("button", { name: copy.copyPrompt })).toBeInTheDocument();
      const costs = locale === "de" ? "kosten.md" : "costs.md";
      expect(screen.getByRole("button", { name: `${copy.openFile}: ${costs}` })).toBeInTheDocument();
      // Both variants are recorded in both languages, so neither note shows.
      expect(screen.queryByText(copy.noWithout)).toBeNull();
      expect(container.textContent).not.toContain(copy.foreign);
      // The plain-text alternative carries both full answers.
      const transcript = container.querySelector(".cds-transcript") as HTMLElement;
      expect(within(transcript).getByText(copy.transcript)).toBeInTheDocument();
      expect(transcript.textContent).toContain("729");
      expect(transcript.textContent).toContain(take.follow_ups[0]?.prompt ?? "missing");
    });
  }

  it("shows the whole answer at once, offers the recorded follow-up, opens a file and the install sheet", () => {
    const copy = DEMOS_PAGE_COPY.de.claudeScene;
    render(
      <GlasRoot tone="dunkel">
        <ClaudeDesktopScene scene={SCENE} locale="de" skillName={TAKE.skill_name} kitFiles={sceneKitFiles(SCENE)} />
      </GlasRoot>,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: copy.showAll }));
    });
    const followUp = SCENE.prompts[0]?.followUpLabel as string;
    expect(screen.getByRole("button", { name: followUp })).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: `${copy.openFile}: pruefregel-linsensuppe.md` }));
    });
    expect(screen.getByRole("complementary", { name: `${copy.file}: pruefregel-linsensuppe.md` })).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: copy.install }));
    });
    expect(screen.getByRole("dialog", { name: copy.installTitle })).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
  });
});
