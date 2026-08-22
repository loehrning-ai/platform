import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  DataWorkspaceAttestation,
  SyntheticTerminalResponse,
  SyntheticWorkspaceId,
} from "@/app/api/course-workspace/terminal/types";
import { DATA_WORKSPACE_COMMANDS } from "@/app/api/course-workspace/terminal/types";
import { getCourseProjectConfig } from "@/lib/course-projects/configs";
import {
  hasValidCourseProjectArtifact,
  serializeCourseProjectProgress,
} from "@/lib/course-projects/persistence";
import {
  COURSE_PROJECT_STAGE_IDS,
  type CourseProjectArtifactState,
} from "@/lib/course-projects/types";
import type { CourseSlug } from "@/lib/course/types";

import DataLab from "./data-lab";

type DataWorkspaceId = Exclude<SyntheticWorkspaceId, "pipeline-quality">;

const ATTESTATIONS = {
  "data-science-experiment": {
    schema: "data-workspace-attestation-v1",
    runtime: "node24",
    testsPassed: true,
    workspace: "data-science-experiment",
    fixtureVersion: "ds-leakage-v1",
    variant: "experiment",
    rowsRead: 249,
    controlN: 120,
    treatmentN: 118,
    missingRows: 11,
    controlRatePct: 42,
    safeTreatmentRatePct: 47,
    leakedTreatmentRatePct: 64,
    safeEffectPoints: 5,
    leakageInflationPoints: 17,
    interimLooks: 5,
    leakageDetected: true,
  },
  "data-engineering-pipeline": {
    schema: "data-workspace-attestation-v1",
    runtime: "node24",
    testsPassed: true,
    workspace: "data-engineering-pipeline",
    fixtureVersion: "de-events-v1",
    variant: "pipeline",
    inputEvents: 117,
    acceptedEvents: 102,
    duplicateEvents: 14,
    invalidEvents: 1,
    lateEvents: 8,
    firstOutput: 94,
    backfillOutput: 102,
    replayOutput: 102,
    reconciled: true,
    idempotent: true,
  },
  "data-infrastructure-recovery": {
    schema: "data-workspace-attestation-v1",
    runtime: "node24",
    testsPassed: true,
    workspace: "data-infrastructure-recovery",
    fixtureVersion: "di-partition-v1",
    variant: "control-room",
    peakBacklog: 9200,
    failureP95Ms: 684,
    recoveryP95Ms: 210,
    sloTargetMs: 250,
    failureDuplicateRatePct: 14.2,
    recoveryDuplicateRatePct: 0.8,
    dataLoss: 0,
    costMultiple: 2.4,
    sloBreached: true,
    recovered: true,
  },
} as const satisfies Readonly<
  Record<DataWorkspaceId, DataWorkspaceAttestation>
>;

function responseFor(workspace: DataWorkspaceId): SyntheticTerminalResponse {
  return {
    workspace,
    runtime: "node24",
    network: "deny-all",
    persistent: false,
    commands: DATA_WORKSPACE_COMMANDS[workspace].map((command, index) => ({
      commandId: command,
      command,
      stdout:
        index === 0
          ? JSON.stringify(ATTESTATIONS[workspace])
          : "tests 2\npass 2\nfail 0",
      stderr: "",
      exitCode: 0,
      durationMs: 5,
      truncated: false,
    })),
    diff: "",
    diffTruncated: false,
    attestation: ATTESTATIONS[workspace],
  };
}

function stubSuccessfulRun(workspace: DataWorkspaceId) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(responseFor(workspace)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderLab(
  courseSlug: CourseSlug,
  options: { verificationEnabled?: boolean } = {},
) {
  const onVerified = vi.fn();
  const onArtifactChange = vi.fn();
  const view = render(
    <DataLab
      config={getCourseProjectConfig(courseSlug)}
      lessonId="cap"
      locale="en"
      initialArtifact={null}
      verificationEnabled={options.verificationEnabled}
      onMeaningfulInteraction={vi.fn()}
      onArtifactChange={onArtifactChange}
      onVerified={onVerified}
    />,
  );
  return { ...view, onVerified, onArtifactChange };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe("DataLab", () => {
  it("executes and attests the leakage/peeking metric comparison before model-card verification", async () => {
    const fetchMock = stubSuccessfulRun("data-science-experiment");
    const { onVerified } = renderLab("data-science");
    expect(
      screen.getByText(/Executable experiment notebook/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Real Node 24 execution/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Attested execution results" }),
    ).toHaveClass("bg-[#e6e0d6]", "text-[#17130f]");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Enable leakage and peeking for the run",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Execute the isolated workspace for real",
      }),
    );
    expect(
      await screen.findByText(/post-outcome leakage inflates it to \+22 pp/i),
    ).toBeInTheDocument();
    expect(screen.getByText("+5 pp")).toBeInTheDocument();
    expect(screen.getByText("+17 pp")).toBeInTheDocument();
    expect(
      screen.getByText(/\$ node src\/experiment.mjs · exit 0/),
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/course-workspace/terminal",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          workspace: "data-science-experiment",
          commands: ["node src/experiment.mjs", "node --test"],
        }),
      }),
    );

    fireEvent.click(
      screen.getByLabelText(/Document only the safe \+5 pp comparison/i),
    );
    const rationale =
      "Use the safe +5 pp metric, reject leakage and peeking, then reproduce the registered run.";
    fireEvent.change(
      screen.getByLabelText(
        "Model-card limitation with metric and reproduction step",
      ),
      { target: { value: rationale } },
    );
    const verify = screen.getByRole("button", { name: "Verify project" });
    expect(verify).toBeEnabled();
    fireEvent.click(verify);

    const artifact = onVerified.mock
      .calls[0]?.[1] as CourseProjectArtifactState;
    expect(artifact.fields).toMatchObject({
      executionReceipt: "ds-leakage-v1:node24",
      executionVerified: true,
      testsPassed: true,
      safeMetricCompared: true,
      leakageDetected: true,
      peekingDetected: true,
      decision: "publish-safe-with-limits",
    });
    expect(JSON.stringify(artifact)).not.toContain(rationale);
    expect(
      hasValidCourseProjectArtifact(
        serializeCourseProjectProgress(null, {
          ...artifact,
          fields: {
            ...artifact.fields,
            stages: [...COURSE_PROJECT_STAGE_IDS],
          },
        }),
        "data",
        "data-science",
      ),
    ).toBe(true);
  });

  it("executes duplicate, late-event, backfill, reconciliation, and idempotency tests", async () => {
    stubSuccessfulRun("data-engineering-pipeline");
    renderLab("data-engineering-fundamentals");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Enable duplicates and lateness for the run",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Execute the isolated workspace for real",
      }),
    );

    expect(
      await screen.findByText(/Backfill and replay both end at 102/i),
    ).toBeInTheDocument();
    expect(screen.getByText("94 → 102")).toBeInTheDocument();
    expect(screen.getByText("102 · PASS")).toBeInTheDocument();
  });

  it("executes the infrastructure failure and zero-loss SLO recovery", async () => {
    stubSuccessfulRun("data-infrastructure-recovery");
    renderLab("data-infrastructure");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Enable partition and backlog for the run",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Execute the isolated workspace for real",
      }),
    );

    expect(
      await screen.findByText(/breaches the 250 ms SLO at 684 ms/i),
    ).toBeInTheDocument();
    expect(screen.getByText("210 ms")).toBeInTheDocument();
    expect(screen.getByText("2.4×")).toBeInTheDocument();
  });

  it("keeps a rapid double activation to one sandbox request", async () => {
    const pending = deferred<Response>();
    const fetchMock = vi.fn().mockImplementation(() => pending.promise);
    vi.stubGlobal("fetch", fetchMock);
    renderLab("data-science");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Enable leakage and peeking for the run",
      }),
    );
    const runButton = screen.getByRole("button", {
      name: "Execute the isolated workspace for real",
    });

    act(() => {
      runButton.click();
      runButton.click();
    });

    expect(runButton).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).signal?.aborted).toBe(
      false,
    );

    await act(async () => {
      pending.resolve(
        new Response(JSON.stringify(responseFor("data-science-experiment")), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    expect(
      await screen.findByText(/post-outcome leakage inflates it to \+22 pp/i),
    ).toBeInTheDocument();
    expect(runButton).toBeEnabled();
  });

  it("aborts an edited run and ignores its out-of-order failure", async () => {
    const stale = deferred<Response>();
    const current = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => stale.promise)
      .mockImplementationOnce(() => current.promise);
    vi.stubGlobal("fetch", fetchMock);
    renderLab("data-science");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Enable leakage and peeking for the run",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Execute the isolated workspace for real",
      }),
    );
    const staleSignal = (fetchMock.mock.calls[0]?.[1] as RequestInit).signal;
    const query = screen.getByRole("textbox", {
      name: "Pre-registered analysis plan",
    });
    fireEvent.change(query, {
      target: { value: `${(query as HTMLTextAreaElement).value} ` },
    });
    expect(staleSignal?.aborted).toBe(true);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Execute the isolated workspace for real",
      }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      current.resolve(
        new Response(JSON.stringify(responseFor("data-science-experiment")), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    expect(
      await screen.findByText(/post-outcome leakage inflates it to \+22 pp/i),
    ).toBeInTheDocument();

    await act(async () => {
      stale.resolve(
        new Response(JSON.stringify({ error: "terminal_not_ready" }), {
          status: 503,
        }),
      );
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("+5 pp")).toBeInTheDocument();
  });

  it("never fabricates output for an unavailable or malformed run", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "terminal_not_ready" }), {
          status: 503,
        }),
      ),
    );
    renderLab("data-science");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Enable leakage and peeking for the run",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Execute the isolated workspace for real",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /No execution was confirmed/,
    );
    expect(screen.queryByText("+5 pp")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();
  });

  it("does not send or persist the free-form plan and rationale", async () => {
    const fetchMock = stubSuccessfulRun("data-science-experiment");
    const { onVerified } = renderLab("data-science");
    const plan =
      "SELECT arm, completion_7d FROM synthetic_experiment EXCLUDE post_completion_score";
    fireEvent.change(
      screen.getByRole("textbox", { name: "Pre-registered analysis plan" }),
      {
        target: { value: plan },
      },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Enable leakage and peeking for the run",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Execute the isolated workspace for real",
      }),
    );
    await screen.findByText(/post-outcome leakage inflates/i);
    const requestBody = JSON.parse(
      String((fetchMock.mock.calls[0]?.[1] as RequestInit).body),
    ) as Record<string, unknown>;
    expect(JSON.stringify(requestBody)).not.toContain("SELECT");

    fireEvent.click(
      screen.getByLabelText(/Document only the safe \+5 pp comparison/i),
    );
    const rationale =
      "The +5 pp safe metric needs leakage and reproduction limits in the model card.";
    fireEvent.change(
      screen.getByLabelText(
        "Model-card limitation with metric and reproduction step",
      ),
      { target: { value: rationale } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Verify project" }));
    expect(JSON.stringify(onVerified.mock.calls[0]?.[1])).not.toContain(plan);
    expect(JSON.stringify(onVerified.mock.calls[0]?.[1])).not.toContain(
      rationale,
    );
  });

  it("locks final verification until the shared five-stage sequence is complete", async () => {
    stubSuccessfulRun("data-science-experiment");
    renderLab("data-science", { verificationEnabled: false });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Enable leakage and peeking for the run",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Execute the isolated workspace for real",
      }),
    );
    await screen.findByText(/post-outcome leakage inflates/i);
    fireEvent.click(
      screen.getByLabelText(/Document only the safe \+5 pp comparison/i),
    );
    fireEvent.change(
      screen.getByLabelText(
        "Model-card limitation with metric and reproduction step",
      ),
      {
        target: {
          value:
            "The safe +5 pp metric needs leakage and reproduction limits before publication.",
        },
      },
    );

    expect(
      screen.getByText(/Final verification remains locked/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();
  });

  it("rejects an incomplete analysis contract before any remote execution", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderLab("data-science");
    fireEvent.change(
      screen.getByRole("textbox", { name: "Pre-registered analysis plan" }),
      {
        target: { value: "SELECT * FROM synthetic_experiment" },
      },
    );
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent(
      /bounded analysis contract/i,
    );
    expect(
      screen.getByRole("button", {
        name: "Execute the isolated workspace for real",
      }),
    ).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
