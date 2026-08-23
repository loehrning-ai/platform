import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  REPOSITORY_TERMINAL_COMMANDS,
  SYNTHETIC_TERMINAL_COMMAND_LABELS,
} from "@/app/api/course-workspace/terminal/types";
import { getCourseProjectConfig } from "@/lib/course-projects/configs";
import { COURSE_PROJECT_STAGE_IDS } from "@/lib/course-projects/types";
import {
  hasValidCourseProjectArtifact,
  serializeCourseProjectProgress,
} from "@/lib/course-projects/persistence";
import type { CourseProjectArtifactState } from "@/lib/course-projects/types";

import RepoLab from "./repo-lab";

const SCOPED_DIFF = `diff --git a/src/pipeline.mjs b/src/pipeline.mjs
--- a/src/pipeline.mjs
+++ b/src/pipeline.mjs
-  return records; // BUG: duplicate event IDs pass through
+  return [...new Map(records.map((record) => [record.id, record])).values()];
`;

function verifiedResponse() {
  const outputs = [
    "/vercel/sandbox/workspace\n",
    "README.md\nsrc\n",
    '{"input":4,"output":4}\n',
    "# pass 0\n# fail 1\n",
    "bounded fix applied to src/pipeline.mjs\n",
    "# pass 1\n# fail 0\n",
    "",
    "",
    " M src/pipeline.mjs\n",
    SCOPED_DIFF,
  ];
  return {
    workspace: "pipeline-quality",
    runtime: "node24",
    network: "deny-all",
    persistent: false,
    commands: REPOSITORY_TERMINAL_COMMANDS.map((commandId, index) => ({
      commandId,
      command: SYNTHETIC_TERMINAL_COMMAND_LABELS[commandId],
      stdout: outputs[index] ?? "",
      stderr: "",
      exitCode: index === 3 ? 1 : 0,
      durationMs: 12,
      truncated: false,
    })),
    diff: SCOPED_DIFF,
    diffTruncated: false,
    attestation: {
      contract: "pipeline-quality-v1",
      workspace: "pipeline-quality",
      outcome: "verified",
      commandCount: 10,
    },
  };
}

function setup(options?: { readonly verificationEnabled?: boolean }) {
  const onVerified = vi.fn();
  const onMeaningfulInteraction = vi.fn();
  const view = render(
    <RepoLab
      config={getCourseProjectConfig("codex")}
      lessonId="L12"
      locale="en"
      initialArtifact={null}
      verificationEnabled={options?.verificationEnabled}
      onMeaningfulInteraction={onMeaningfulInteraction}
      onArtifactChange={vi.fn()}
      onVerified={onVerified}
    />,
  );
  const input = screen.getByLabelText("Enter an allowed command");
  const execute = (command: string) => {
    fireEvent.change(input, { target: { value: command } });
    fireEvent.click(screen.getByRole("button", { name: "Run command" }));
  };
  return { ...view, execute, onVerified, onMeaningfulInteraction };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

function enterValidSpec(): void {
  fireEvent.change(screen.getByLabelText("Editable AGENTS.md task contract"), {
    target: {
      value:
        "Scope: src/pipeline.mjs. Non-goal: public API changes. Acceptance: canonical sandbox sequence and scoped diff pass.",
    },
  });
}

async function runRealSandbox(): Promise<void> {
  fireEvent.click(screen.getByRole("radio", { name: /Isolated real run/ }));
  fireEvent.click(screen.getByRole("button", { name: "Start isolated run" }));
  await screen.findByText("$ node --test · exit 1");
}

describe("RepoLab", () => {
  it("signals the first task-contract edit synchronously", () => {
    const { onMeaningfulInteraction } = setup();
    fireEvent.change(
      screen.getByLabelText("Editable AGENTS.md task contract"),
      { target: { value: "Scope: synthetic retry task" } },
    );
    expect(onMeaningfulInteraction).toHaveBeenCalledTimes(1);
  });

  it("exposes code as a named keyboard region and labels simulation non-verifying", () => {
    setup();
    const codeRegion = screen.getByRole("region", {
      name: "Virtual file: src/retry.ts",
    });
    expect(codeRegion).toHaveAttribute("tabindex", "0");
    expect(codeRegion).toHaveClass("overflow-x-auto");
    expect(
      screen.getByText(/green status marks are not acceptance evidence/i),
    ).toBeInTheDocument();
  });

  it("keeps every browser-simulated check non-verifying", () => {
    const { execute, onVerified } = setup();
    enterValidSpec();
    execute("codex run");
    execute("bun test");
    execute("bun run typecheck");
    execute("bun run lint");
    execute("git diff");

    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();
    expect(onVerified).not.toHaveBeenCalled();
    expect(
      screen.getByText(/fully attested real Sandbox sequence/i),
    ).toBeInTheDocument();
  });

  it("rejects non-allowlisted browser commands and reset removes all evidence", () => {
    const { execute } = setup();
    execute("rm -rf .");
    expect(screen.getByText(/not on the local allowlist/i)).toBeInTheDocument();
    enterValidSpec();
    execute("reset");
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();
    expect(
      screen.getByLabelText("Editable AGENTS.md task contract"),
    ).toHaveValue("");
  });

  it("runs the canonical sequence and verifies only its strict attestation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(verifiedResponse()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { onVerified } = setup();
    enterValidSpec();
    await runRealSandbox();

    expect(
      screen.getByRole("region", { name: "Actual Git diff" }),
    ).toHaveTextContent("return [...new Map");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/course-workspace/terminal");
    expect(JSON.parse(String(init.body))).toEqual({
      workspace: "pipeline-quality",
      commands: REPOSITORY_TERMINAL_COMMANDS,
    });
    const verify = screen.getByRole("button", { name: "Verify project" });
    expect(verify).toBeEnabled();
    fireEvent.click(verify);
    expect(onVerified).toHaveBeenCalledWith(
      expect.stringContaining("fully attested isolated Sandbox sequence"),
      expect.objectContaining({
        engineKind: "repo",
        fields: expect.objectContaining({
          specReady: true,
          sandboxAttested: true,
          attestationContract: "pipeline-quality-v1",
          commandSequence: "canonical",
          baselineFailed: true,
          postfixPassed: true,
          checksPassed: true,
          diffScoped: true,
        }),
      }),
    );
    const artifact = onVerified.mock
      .calls[0]?.[1] as CourseProjectArtifactState;
    expect(
      hasValidCourseProjectArtifact(
        serializeCourseProjectProgress(null, {
          ...artifact,
          fields: {
            ...artifact.fields,
            stages: [...COURSE_PROJECT_STAGE_IDS],
          },
        }),
        "repo",
        "codex",
      ),
    ).toBe(true);
  });

  it("keeps a rapid double activation to one sandbox request", async () => {
    const pending = deferred<Response>();
    const fetchMock = vi.fn().mockImplementation(() => pending.promise);
    vi.stubGlobal("fetch", fetchMock);
    setup();
    fireEvent.click(screen.getByRole("radio", { name: /Isolated real run/ }));
    const runButton = screen.getByRole("button", {
      name: "Start isolated run",
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
        new Response(JSON.stringify(verifiedResponse()), { status: 200 }),
      );
    });

    expect(
      await screen.findByText("$ node --test · exit 1"),
    ).toBeInTheDocument();
    expect(runButton).toBeEnabled();
  });

  it("fences out-of-order sandbox responses and aborts the active request on unmount", async () => {
    const stale = deferred<Response>();
    const current = deferred<Response>();
    const pendingUnmount = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => stale.promise)
      .mockImplementationOnce(() => current.promise)
      .mockImplementationOnce(() => pendingUnmount.promise);
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = setup();
    fireEvent.click(screen.getByRole("radio", { name: /Isolated real run/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start isolated run" }));
    const staleSignal = (fetchMock.mock.calls[0]?.[1] as RequestInit).signal;
    fireEvent.click(screen.getByRole("radio", { name: /Browser simulation/ }));
    expect(staleSignal?.aborted).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: /Isolated real run/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start isolated run" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      current.resolve(
        new Response(JSON.stringify(verifiedResponse()), { status: 200 }),
      );
    });
    expect(
      await screen.findByText("$ node --test · exit 1"),
    ).toBeInTheDocument();

    await act(async () => {
      stale.resolve(
        new Response(JSON.stringify({ error: "terminal_not_ready" }), {
          status: 503,
        }),
      );
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start isolated run" }));
    const unmountSignal = (fetchMock.mock.calls[2]?.[1] as RequestInit).signal;
    unmount();
    expect(unmountSignal?.aborted).toBe(true);
  });

  it("refuses malformed, partial, reordered, or truncated success payloads", async () => {
    for (const mutate of [
      (payload: ReturnType<typeof verifiedResponse>) => {
        payload.commands = payload.commands.slice(1) as typeof payload.commands;
      },
      (payload: ReturnType<typeof verifiedResponse>) => {
        payload.commands = [...payload.commands].reverse();
      },
      (payload: ReturnType<typeof verifiedResponse>) => {
        payload.commands[0]!.truncated = true;
      },
      (payload: ReturnType<typeof verifiedResponse>) => {
        payload.attestation.contract = "spoofed";
      },
    ]) {
      const payload = verifiedResponse();
      mutate(payload);
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify(payload), { status: 200 }),
          ),
      );
      const view = setup();
      fireEvent.click(
        screen.getAllByRole("radio", { name: /Isolated real run/ }).at(-1)!,
      );
      fireEvent.click(
        screen.getAllByRole("button", { name: "Start isolated run" }).at(-1)!,
      );
      expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
      expect(view.onVerified).not.toHaveBeenCalled();
      document.body.replaceChildren();
    }
  });

  it("keeps final acceptance locked until the shared five-stage gate opens", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(verifiedResponse()), { status: 200 }),
        ),
    );
    setup({ verificationEnabled: false });
    enterValidSpec();
    await runRealSandbox();
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/All five project stages completed/),
    ).toBeInTheDocument();
  });

  it("labels an unavailable real run without fabricating terminal output", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "terminal_not_ready" }), {
          status: 503,
        }),
      ),
    );
    setup();
    await runRealSandbox().catch(() => undefined);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Real sandbox unavailable/,
      ),
    );
    expect(screen.queryByText(/exit 0/)).not.toBeInTheDocument();
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});
