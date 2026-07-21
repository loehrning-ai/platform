import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DEF_CHAPTERS, getDefChapterMeta, type DefChapterId } from "@/lib/data-engineering-fundamentals/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import ChOverview from "./ch-overview";
import Ch0Fundamentals from "./ch0-fundamentals";
import Ch1Ingest from "./ch1-ingest";
import Ch15Streaming from "./ch1-5-streaming";
import Ch2Store from "./ch2-store";
import Ch3Compute from "./ch3-compute";
import Ch4Orchestrate from "./ch4-orchestrate";
import Ch5Quality from "./ch5-quality";
import Ch6Discover from "./ch6-discover";
import Ch7Serve from "./ch7-serve";
import Ch8Govern from "./ch8-govern";
import Ch9Capstone from "./ch9-capstone";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});


describe("all 12 chapter components render with real ported content, not placeholders ", () => {
  it("ChOverview renders the real hero copy and all 10 pipeline stops", () => {
    render(<ChOverview />);
    expect(screen.getByText(/Think like a/)).toBeInTheDocument();
    expect(screen.getByText("Capstone")).toBeInTheDocument();
    expect(screen.getAllByText("Kafka").length).toBeGreaterThan(0);
  });

  it("Ch0Fundamentals renders real section prose and all 5 of its simulators", () => {
    render(<Ch0Fundamentals chapter={getDefChapterMeta("fund")} />);
    expect(screen.getByText("The 7-layer stack")).toBeInTheDocument();
    expect(screen.getAllByText("A byte's journey").length).toBeGreaterThan(0);
    expect(screen.getByText("Row vs columnar scanner")).toBeInTheDocument();
    expect(screen.getByText("SQL → AST → logical → physical → stages")).toBeInTheDocument();
    expect(screen.getByText("Same SQL. Different physics.")).toBeInTheDocument();
  });

  it("Ch1Ingest renders the watermark section and simulator", () => {
    render(<Ch1Ingest chapter={getDefChapterMeta("ingest")} />);
    expect(screen.getByText("Two clocks, one event")).toBeInTheDocument();
    expect(screen.getByText("kafka-to-warehouse · drag the watermark")).toBeInTheDocument();
  });

  it("Ch15Streaming renders the conveyor simulator", () => {
    render(<Ch15Streaming chapter={getDefChapterMeta("stream")} />);
    expect(screen.getByText("The Ingestion Conveyor Belt")).toBeInTheDocument();
  });

  it("Ch2Store renders the cumulative scrubber", () => {
    render(<Ch2Store chapter={getDefChapterMeta("store")} />);
    expect(screen.getByText("user_lifetime_points · day by day")).toBeInTheDocument();
  });

  it("Ch3Compute renders the shuffle simulator", () => {
    render(<Ch3Compute chapter={getDefChapterMeta("comp")} />);
    expect(screen.getByText("Shuffles & joins, in motion")).toBeInTheDocument();
  });

  it("Ch4Orchestrate renders the DAG diagram and backfill simulator", () => {
    render(<Ch4Orchestrate chapter={getDefChapterMeta("orch")} />);
    expect(screen.getByText("raw_events")).toBeInTheDocument();
    expect(screen.getByText(/Backfill with INSERT OVERWRITE/)).toBeInTheDocument();
  });

  it("Ch5Quality renders the trust meter", () => {
    render(<Ch5Quality chapter={getDefChapterMeta("qual")} />);
    expect(screen.getByText("Trust Meter")).toBeInTheDocument();
  });

  it("Ch6Discover renders the discovery speedrun intro and lineage camera", () => {
    render(<Ch6Discover chapter={getDefChapterMeta("disc")} />);
    expect(screen.getByText("Discovery Speedrun")).toBeInTheDocument();
    expect(screen.getByText("Lineage of fct_events")).toBeInTheDocument();
  });

  it("Ch7Serve renders the metrics registry and simulator", () => {
    render(<Ch7Serve chapter={getDefChapterMeta("serve")} />);
    expect(screen.getByText("daily_active_users")).toBeInTheDocument();
    expect(screen.getByText("The same question: with and without a metrics layer")).toBeInTheDocument();
  });

  it("Ch8Govern renders the permission gate simulator", () => {
    render(<Ch8Govern chapter={getDefChapterMeta("gov")} />);
    expect(screen.getByText("Permission Gate")).toBeInTheDocument();
  });

  it("Ch9Capstone renders the living pipeline with all 6 contracts", () => {
    render(<Ch9Capstone chapter={getDefChapterMeta("cap")} />);
    expect(screen.getByText("Six contracts. Every one is load-bearing.")).toBeInTheDocument();
  });

  it("every chapter's real accent/ink hex from source flows into the Hero", () => {
    for (const meta of DEF_CHAPTERS) {
      expect(meta.accentHex).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("getDefChapterMeta throws on an unknown id instead of silently returning undefined", () => {
    expect(() => getDefChapterMeta("nope" as DefChapterId)).toThrow();
  });
});
