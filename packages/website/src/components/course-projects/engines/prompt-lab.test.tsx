import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getCourseProjectConfig } from "@/lib/course-projects/configs";
import {
  hasValidCourseProjectArtifact,
  serializeCourseProjectProgress,
} from "@/lib/course-projects/persistence";
import type {
  CourseProjectArtifactState,
  CourseProjectEngineProps,
} from "@/lib/course-projects/types";
import {
  COURSE_PROJECT_STAGE_IDS,
  getCourseProjectLocalLearningReceipt,
} from "@/lib/course-projects/types";

import PromptLab from "./prompt-lab";

function renderLab(overrides: Partial<CourseProjectEngineProps> = {}) {
  const onVerified = vi.fn();
  const onArtifactChange = vi.fn();
  const onMeaningfulInteraction = vi.fn();
  const view = render(
    <PromptLab
      config={getCourseProjectConfig("ai-native")}
      lessonId="modul_4_lesson_8"
      locale="en"
      initialArtifact={null}
      onMeaningfulInteraction={onMeaningfulInteraction}
      onArtifactChange={onArtifactChange}
      onVerified={onVerified}
      {...overrides}
    />,
  );
  return { ...view, onVerified, onArtifactChange, onMeaningfulInteraction };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

function makeJsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function completeWorkflowSetup() {
  fireEvent.change(screen.getByLabelText("Working context"), {
    target: {
      value:
        "Synthetic context with enough detail for a bounded analysis task.",
    },
  });
  fireEvent.change(screen.getByLabelText("Workflow instruction"), {
    target: {
      value:
        "Analyze the task. Output a table and do not add unsupported claims.",
    },
  });
  fireEvent.click(screen.getByLabelText(/I confirm that the inputs/));
  fireEvent.click(screen.getByLabelText(/Human approval before/));
  fireEvent.click(screen.getByLabelText(/Testable stop condition/));
  fireEvent.click(screen.getByLabelText(/Owner, fallback/));
}

function completeClaudeSetup() {
  fireEvent.change(screen.getByLabelText("Working context"), {
    target: {
      value:
        "Synthetic museum sources A through C conflict on the exhibition date.",
    },
  });
  fireEvent.change(screen.getByLabelText("Prompt A · baseline"), {
    target: {
      value:
        "Create an exhibition outline. Output a table and do not invent claims.",
    },
  });
  fireEvent.change(screen.getByLabelText("Prompt B · grounded"), {
    target: {
      value:
        "Create the outline from source A-C, cite evidence, and refuse uncertain unsupported claims.",
    },
  });
  fireEvent.click(screen.getByLabelText(/Human approval before/));
  fireEvent.click(screen.getByLabelText(/Testable stop condition/));
  fireEvent.click(screen.getByLabelText(/Owner, fallback/));
  fireEvent.click(screen.getByLabelText(/I confirm that the inputs/));
}

function completeGroundingEvidence() {
  fireEvent.change(screen.getByLabelText("Comparison verdict"), {
    target: { value: "b-stronger" },
  });
  const sourceSelects = screen.getAllByLabelText(/Evidence status/);
  const redlineSelects = screen.getAllByLabelText(/Redline/);
  fireEvent.change(sourceSelects[0]!, { target: { value: "conflict" } });
  fireEvent.change(redlineSelects[0]!, { target: { value: "qualify" } });
  fireEvent.change(sourceSelects[1]!, { target: { value: "source-c" } });
  fireEvent.change(redlineSelects[1]!, { target: { value: "retain" } });
  fireEvent.change(sourceSelects[2]!, { target: { value: "gap" } });
  fireEvent.change(redlineSelects[2]!, { target: { value: "remove" } });
  fireEvent.change(screen.getByLabelText(/Response A · Factuality · Score/), {
    target: { value: "2" },
  });
  fireEvent.change(screen.getByLabelText(/Response A · Completeness · Score/), {
    target: { value: "2" },
  });
  fireEvent.change(
    screen.getByLabelText(/Response A · Calibration\/uncertainty · Score/),
    { target: { value: "1" } },
  );
  fireEvent.change(
    screen.getByLabelText(/Response A · Format compliance · Score/),
    {
      target: { value: "3" },
    },
  );
  fireEvent.change(screen.getByLabelText(/Response B · Factuality · Score/), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByLabelText(/Response B · Completeness · Score/), {
    target: { value: "3" },
  });
  fireEvent.change(
    screen.getByLabelText(/Response B · Calibration\/uncertainty · Score/),
    { target: { value: "4" } },
  );
  fireEvent.change(
    screen.getByLabelText(/Response B · Format compliance · Score/),
    {
      target: { value: "4" },
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PromptLab", () => {
  it("excludes consent and model selection but signals a prompt diagnostic edit synchronously", () => {
    const { onMeaningfulInteraction } = renderLab();

    fireEvent.click(screen.getByLabelText(/I confirm that the inputs/));
    fireEvent.change(screen.getByLabelText("Requested model"), {
      target: { value: "google/gemini-2.5-flash-lite" },
    });
    expect(onMeaningfulInteraction).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Working context"), {
      target: { value: "Synthetic bounded context" },
    });
    expect(onMeaningfulInteraction).toHaveBeenCalledTimes(1);
  });

  it("posts the strict practice payload and verifies only after structured provider evidence", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          mode: "complete",
          text: "Provider evidence",
          model: "anthropic/claude-haiku-4.5",
          provider: "anthropic",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { onVerified } = renderLab();
    const verify = screen.getByRole("button", { name: "Verify project" });

    expect(screen.getByLabelText("Requested model")).toHaveValue(
      "anthropic/claude-haiku-4.5",
    );
    expect(screen.getByText(/deployment may deny it/i)).toBeInTheDocument();

    expect(verify).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Working context"), {
      target: {
        value:
          "A synthetic operations team needs an evidence-bound weekly decision memo.",
      },
    });
    fireEvent.change(screen.getByLabelText("Workflow instruction"), {
      target: {
        value:
          "Create the weekly memo. Output a table, use only supplied facts, and do not invent missing evidence.",
      },
    });
    fireEvent.click(
      screen.getByLabelText(
        "I confirm that the inputs are synthetic or approved for disclosure.",
      ),
    );
    fireEvent.click(screen.getByLabelText(/Human approval before/));
    fireEvent.click(screen.getByLabelText(/Testable stop condition/));
    fireEvent.click(screen.getByLabelText(/Owner, fallback/));
    fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

    await screen.findByText("Provider evidence");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/ai-native/practice");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual([
      "locale",
      "mode",
      "model",
      "prompt",
    ]);
    expect(body.mode).toBe("complete");
    expect(body.locale).toBe("en");
    expect(body.model).toBe("anthropic/claude-haiku-4.5");
    expect(body.prompt).toContain("<working_context>");
    expect(body).not.toHaveProperty("lessonId");
    expect(
      screen.getByText("anthropic · anthropic/claude-haiku-4.5"),
    ).toBeInTheDocument();

    expect(verify).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Check output against approval/));
    expect(verify).toBeEnabled();
    fireEvent.click(verify);
    expect(onVerified).toHaveBeenCalledTimes(1);
    const serializedArtifact = JSON.stringify(onVerified.mock.calls[0]?.[1]);
    expect(serializedArtifact).not.toContain("weekly memo");
    expect(serializedArtifact).not.toContain("evidence-bound");
    expect(onVerified.mock.calls[0]?.[1]).toMatchObject({
      version: 1,
      engineKind: "prompt",
      fields: { providerEvidence: "success" },
    });
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
        "prompt",
        "ai-native",
      ),
    ).toBe(true);
  });

  it("accepts an exactly identified Google completion for the selected Gemini model", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeJsonResponse(200, {
          mode: "complete",
          text: "Gemini provider evidence",
          model: "google/gemini-2.5-flash-lite",
          provider: "google",
        }),
      ),
    );
    const { onArtifactChange } = renderLab();
    fireEvent.change(screen.getByLabelText("Requested model"), {
      target: { value: "google/gemini-2.5-flash-lite" },
    });
    completeWorkflowSetup();
    fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

    expect(
      await screen.findByText("Gemini provider evidence"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("google · google/gemini-2.5-flash-lite"),
    ).toBeInTheDocument();
    expect(onArtifactChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fields: expect.objectContaining({
          providerEvidence: "success",
          providerModel: "google/gemini-2.5-flash-lite",
        }),
      }),
    );
  });

  it("keeps a rapid double activation to one provider request", async () => {
    const pending = deferred<Response>();
    const fetchMock = vi.fn().mockImplementation(() => pending.promise);
    vi.stubGlobal("fetch", fetchMock);
    renderLab();
    completeWorkflowSetup();

    const runButton = screen.getByRole("button", { name: "Run provider" });
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
        makeJsonResponse(200, {
          mode: "complete",
          text: "Single provider response",
          model: "anthropic/claude-haiku-4.5",
          provider: "anthropic",
        }),
      );
    });

    expect(
      await screen.findByText("Single provider response"),
    ).toBeInTheDocument();
    expect(runButton).toBeEnabled();
  });

  it("aborts an edited run and ignores its deferred response after the replacement succeeds", async () => {
    const stale = deferred<Response>();
    const current = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => stale.promise)
      .mockImplementationOnce(() => current.promise);
    vi.stubGlobal("fetch", fetchMock);
    renderLab();
    completeWorkflowSetup();

    fireEvent.click(screen.getByRole("button", { name: "Run provider" }));
    const staleSignal = (fetchMock.mock.calls[0]?.[1] as RequestInit).signal;
    fireEvent.change(screen.getByLabelText("Workflow instruction"), {
      target: {
        value:
          "Analyze the replacement task. Output a table and do not add unsupported claims.",
      },
    });
    expect(staleSignal?.aborted).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

    await act(async () => {
      current.resolve(
        makeJsonResponse(200, {
          mode: "complete",
          text: "Current provider evidence",
          model: "anthropic/claude-haiku-4.5",
          provider: "anthropic",
        }),
      );
    });
    expect(
      await screen.findByText("Current provider evidence"),
    ).toBeInTheDocument();

    await act(async () => {
      stale.resolve(
        makeJsonResponse(200, {
          mode: "complete",
          text: "Stale provider evidence",
          model: "anthropic/claude-haiku-4.5",
          provider: "anthropic",
        }),
      );
    });
    expect(
      screen.queryByText("Stale provider evidence"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Current provider evidence")).toBeInTheDocument();
  });

  it.each([
    [
      "missing mode",
      {
        text: "Unattested output",
        model: "anthropic/claude-haiku-4.5",
        provider: "anthropic",
      },
    ],
    [
      "mismatched mode",
      {
        mode: "place-word",
        text: "Wrong response mode",
        model: "anthropic/claude-haiku-4.5",
        provider: "anthropic",
      },
    ],
    [
      "missing model",
      {
        mode: "complete",
        text: "Unidentified model output",
        provider: "anthropic",
      },
    ],
    [
      "mismatched model",
      {
        mode: "complete",
        text: "Wrong model output",
        model: "google/gemini-2.5-flash-lite",
        provider: "google",
      },
    ],
    [
      "missing provider",
      {
        mode: "complete",
        text: "Unidentified provider output",
        model: "anthropic/claude-haiku-4.5",
      },
    ],
    [
      "provider mismatched to model prefix",
      {
        mode: "complete",
        text: "Wrong provider output",
        model: "anthropic/claude-haiku-4.5",
        provider: "google",
      },
    ],
    [
      "empty text",
      {
        mode: "complete",
        text: "   ",
        model: "anthropic/claude-haiku-4.5",
        provider: "anthropic",
      },
    ],
  ])(
    "rejects a 200 response with %s as malformed and non-verifying",
    async (_caseName, payload) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeJsonResponse(200, payload)),
      );
      const { onVerified, onArtifactChange } = renderLab();
      completeWorkflowSetup();
      fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

      expect(
        await screen.findByText("Failure class: Malformed response"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /degraded mode/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Verify project" }),
      ).toBeDisabled();
      expect(onVerified).not.toHaveBeenCalled();
      expect(onArtifactChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fields: expect.objectContaining({
            providerEvidence: "none",
            completionMode: "incomplete",
          }),
        }),
      );
    },
  );

  it("issues a distinct local-learning receipt after provider unavailability without fabricating provider evidence", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(401, { error: "auth_unavailable" }),
        ),
    );
    const onExecutionReceipt = vi.fn();
    const { onArtifactChange, onVerified } = renderLab({
      onExecutionReceipt,
    });
    completeWorkflowSetup();
    fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

    await screen.findByText("Failure class: Authentication/access");
    expect(
      screen.getByText(/Local synthetic learning run · no model call/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Provider evidence$/i)).not.toBeInTheDocument();

    const localRun = screen.getByRole("button", {
      name: "Run local learning check",
    });
    fireEvent.click(localRun);
    fireEvent.click(localRun);

    const localReceipt = getCourseProjectLocalLearningReceipt("ai-native");
    expect(onExecutionReceipt).toHaveBeenCalledTimes(1);
    expect(onExecutionReceipt).toHaveBeenCalledWith(localReceipt);
    expect(localRun).toBeDisabled();
    await waitFor(() =>
      expect(onArtifactChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fields: expect.objectContaining({
            providerEvidence: "none",
            executionReceipt: null,
            learningReceipt: localReceipt,
            completionMode: "local-learning",
            providerFailureClass: "auth",
          }),
        }),
      ),
    );

    const artifact = onArtifactChange.mock.calls.at(-1)?.[0] as
      CourseProjectArtifactState | undefined;
    expect(artifact).toBeDefined();
    expect(
      hasValidCourseProjectArtifact(
        serializeCourseProjectProgress(null, {
          ...artifact!,
          fields: {
            ...artifact!.fields,
            stages: [...COURSE_PROJECT_STAGE_IDS],
          },
        }),
        "prompt",
        "ai-native",
      ),
    ).toBe(false);
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it.each([
    [
      "disabled",
      { code: "practice_disabled", error: "Live mode is not enabled." },
      /Course policy · disabled/i,
    ],
    [
      "not-ready",
      {
        code: "model_not_allowed",
        error: "The requested model is not allowed for this course.",
      },
      /Course policy · model not enabled/i,
    ],
  ])(
    "labels explicit %s policy stops as degraded and never treats them as verification",
    async (_policy, failure, failureClass) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeJsonResponse(503, failure)),
      );
      const { onVerified, onArtifactChange } = renderLab();
      completeWorkflowSetup();
      fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

      expect(await screen.findByText(failureClass)).toBeInTheDocument();
      expect(screen.getByText(/Degraded learning path:/i)).toHaveTextContent(
        /No provider evidence exists/i,
      );
      expect(screen.queryByText("Provider evidence")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Verify project" }),
      ).toBeDisabled();
      fireEvent.click(
        screen.getByRole("button", { name: "Acknowledge degraded mode" }),
      );
      fireEvent.click(screen.getByLabelText(/explicit policy stop/));
      expect(
        screen.getByText(/separate, non-equivalent learning path/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Verify project" }),
      ).toBeDisabled();
      expect(onVerified).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(onArtifactChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            fields: expect.objectContaining({
              providerEvidence: "none",
              completionMode: "degraded-policy",
            }),
          }),
        ),
      );
      const artifact = onArtifactChange.mock.calls.at(
        -1,
      )?.[0] as CourseProjectArtifactState;
      expect(
        hasValidCourseProjectArtifact(
          serializeCourseProjectProgress(null, artifact),
          "prompt",
          "ai-native",
        ),
      ).toBe(false);
    },
  );

  it("retains Claude secondary-prompt readiness in bounded local-learning evidence", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(401, { error: "auth_unavailable" }),
        ),
    );
    const onExecutionReceipt = vi.fn();
    const { onArtifactChange } = renderLab({
      config: getCourseProjectConfig("claude"),
      onExecutionReceipt,
    });
    completeClaudeSetup();
    fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

    await screen.findByText("Failure class: Authentication/access");
    fireEvent.click(
      screen.getByRole("button", { name: "Run local learning check" }),
    );

    const localReceipt = getCourseProjectLocalLearningReceipt("claude");
    expect(onExecutionReceipt).toHaveBeenCalledWith(localReceipt);
    await waitFor(() =>
      expect(onArtifactChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fields: expect.objectContaining({
            variant: "claude",
            secondaryReady: true,
            learningReceipt: localReceipt,
            executionReceipt: null,
            providerEvidence: "none",
            completionMode: "local-learning",
            providerFailureClass: "auth",
          }),
        }),
      ),
    );
  });

  it.each([
    {
      failureClass: "Failure class: Authentication/access",
      name: "auth",
      response: () => makeJsonResponse(503, { error: "auth_unavailable" }),
    },
    {
      failureClass: "Failure class: Validation",
      name: "validation",
      response: () =>
        makeJsonResponse(400, { error: "Validierung fehlgeschlagen." }),
    },
    {
      failureClass: "Failure class: Usage limit/budget",
      name: "quota",
      response: () =>
        makeJsonResponse(429, {
          error: "Das Tagesbudget für Modell-Tokens ist erreicht.",
        }),
    },
    {
      failureClass: "Failure class: Upstream provider",
      name: "upstream/provider",
      response: () =>
        makeJsonResponse(503, {
          error: "The provider is temporarily unavailable.",
        }),
    },
    {
      failureClass: "Failure class: Upstream provider",
      name: "upstream model not-ready",
      response: () =>
        makeJsonResponse(503, {
          code: "model_not_ready",
          error: "The model is not ready.",
        }),
    },
    {
      failureClass: "Failure class: Upstream provider",
      name: "spoofed policy prose without a policy code",
      response: () =>
        makeJsonResponse(503, {
          code: "provider_unavailable",
          error: "Live mode is not enabled.",
        }),
    },
    {
      failureClass: "Failure class: Network",
      name: "network",
      response: () => Promise.reject(new TypeError("network unavailable")),
    },
    {
      failureClass: "Failure class: Malformed response",
      name: "malformed response",
      response: () => makeJsonResponse(200, { mode: "complete" }),
    },
  ])(
    "keeps $name failures non-verifying and offers no degraded completion",
    async ({ failureClass, response }) => {
      vi.stubGlobal("fetch", vi.fn().mockImplementation(response));
      const { onVerified, onArtifactChange } = renderLab();
      completeWorkflowSetup();
      fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

      expect(await screen.findByText(failureClass)).toBeInTheDocument();
      expect(
        screen.getAllByText(/This operational failure is not evidence/i),
      ).toHaveLength(2);
      expect(
        screen.queryByRole("button", { name: /degraded mode/i }),
      ).not.toBeInTheDocument();
      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).toBeDisabled();
      }
      expect(
        screen.getByRole("button", { name: "Verify project" }),
      ).toBeDisabled();
      expect(onVerified).not.toHaveBeenCalled();
      expect(onArtifactChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fields: expect.objectContaining({
            providerEvidence: "none",
            completionMode: "incomplete",
          }),
        }),
      );
    },
  );

  it("keeps a successful primary Claude result visible when the grounded comparison fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeJsonResponse(200, {
          mode: "complete",
          text: "Preserved primary Claude answer",
          model: "anthropic/claude-haiku-4.5",
          provider: "anthropic",
        }),
      )
      .mockResolvedValueOnce(
        makeJsonResponse(200, {
          mode: "complete",
          text: "Grounded answer from the wrong provider",
          model: "anthropic/claude-haiku-4.5",
          provider: "google",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { onVerified, onArtifactChange } = renderLab({
      config: getCourseProjectConfig("claude"),
    });
    fireEvent.change(screen.getByLabelText("Working context"), {
      target: {
        value:
          "Synthetic museum sources A through C conflict on the exhibition date.",
      },
    });
    fireEvent.change(screen.getByLabelText("Prompt A · baseline"), {
      target: {
        value:
          "Create an exhibition outline. Output a table and do not invent claims.",
      },
    });
    fireEvent.change(screen.getByLabelText("Prompt B · grounded"), {
      target: {
        value:
          "Create the outline from source A-C, cite evidence, and refuse uncertain unsupported claims.",
      },
    });
    fireEvent.click(screen.getByLabelText(/Human approval before/));
    fireEvent.click(screen.getByLabelText(/Testable stop condition/));
    fireEvent.click(screen.getByLabelText(/Owner, fallback/));
    fireEvent.click(screen.getByLabelText(/I confirm that the inputs/));
    fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

    expect(
      await screen.findByText("Preserved primary Claude answer"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/primary Claude response remains visible/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Failure class: Malformed response"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Response B · real API response/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Grounded answer from the wrong provider"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();
    expect(onVerified).not.toHaveBeenCalled();
    expect(onArtifactChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fields: expect.objectContaining({
          providerEvidence: "none",
          completionMode: "incomplete",
        }),
      }),
    );
  });

  it("does not trust legacy generic unavailability as policy evidence", () => {
    renderLab({
      initialArtifact: {
        version: 1,
        engineKind: "prompt",
        fields: {
          privacyConfirmed: true,
          goalReady: true,
          contextReady: true,
          constraintsReady: true,
          secondaryReady: true,
          approvalGate: true,
          stopCondition: true,
          handoffDefined: true,
          evaluation: "stop",
          providerEvidence: "unavailable",
        },
      },
    });
    expect(screen.getByText(/No provider run yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /degraded mode/i }),
    ).not.toBeInTheDocument();
  });

  it("never appends German server prose to an English provider error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Das Tagesbudget für Modell-Tokens ist erreicht.",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    renderLab();
    fireEvent.change(screen.getByLabelText("Working context"), {
      target: {
        value:
          "Synthetic context with enough detail for a bounded analysis task.",
      },
    });
    fireEvent.change(screen.getByLabelText("Workflow instruction"), {
      target: {
        value:
          "Analyze the task. Output a table and do not add unsupported claims.",
      },
    });
    fireEvent.click(screen.getByLabelText(/I confirm that the inputs/));
    fireEvent.click(screen.getByLabelText(/Human approval before/));
    fireEvent.click(screen.getByLabelText(/Testable stop condition/));
    fireEvent.click(screen.getByLabelText(/Owner, fallback/));
    fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

    expect(
      await screen.findByText(/usage or provider budget was exhausted/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Tagesbudget/)).not.toBeInTheDocument();
  });

  it("renders and gates Claude's two real provider variants plus claim-evidence evaluation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeJsonResponse(200, {
          mode: "complete",
          text: "Baseline answer",
          model: "anthropic/claude-haiku-4.5",
          provider: "anthropic",
        }),
      )
      .mockResolvedValueOnce(
        makeJsonResponse(200, {
          mode: "complete",
          text: "Grounded answer [Source A]",
          model: "anthropic/claude-haiku-4.5",
          provider: "anthropic",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { onVerified, onArtifactChange } = renderLab({
      config: getCourseProjectConfig("claude"),
    });
    completeClaudeSetup();
    fireEvent.click(screen.getByRole("button", { name: "Run provider" }));

    await screen.findByText("Baseline answer");
    expect(screen.getByText("Grounded answer [Source A]")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstRequest = JSON.parse(
      String((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body),
    ) as { prompt: string };
    const secondRequest = JSON.parse(
      String((fetchMock.mock.calls[1]?.[1] as RequestInit | undefined)?.body),
    ) as { prompt: string };
    expect(firstRequest.prompt).toContain("<synthetic_source_packet>");
    expect(secondRequest.prompt).toContain("<synthetic_source_packet>");
    expect(firstRequest.prompt).toContain("Source C · Conservation log");
    expect(secondRequest.prompt).toContain("Source C · Conservation log");
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Comparison verdict"), {
      target: { value: "b-stronger" },
    });
    const sourceSelects = screen.getAllByLabelText(/Evidence status/);
    const redlineSelects = screen.getAllByLabelText(/Redline/);
    fireEvent.change(sourceSelects[0]!, { target: { value: "source-a" } });
    fireEvent.change(redlineSelects[0]!, { target: { value: "retain" } });
    expect(
      screen.getByText(/conflicts with the source packet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();

    completeGroundingEvidence();
    fireEvent.change(screen.getByLabelText("Comparison verdict"), {
      target: { value: "a-stronger" },
    });
    expect(
      screen.getByText(/verdict must agree with the totals/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Comparison verdict"), {
      target: { value: "b-stronger" },
    });
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Verify project" }));
    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(onVerified.mock.calls[0]?.[1]).toMatchObject({
      fields: {
        twoOutputEvidence: true,
        comparisonDecision: "b-stronger",
        claimReviewCode: 423153,
        rubricScores: 22133344,
      },
    });
    const serializedArtifact = JSON.stringify(onVerified.mock.calls[0]?.[1]);
    expect(serializedArtifact).not.toContain("Baseline answer");
    expect(serializedArtifact).not.toContain("Grounded answer");
    expect(serializedArtifact).not.toContain("Synthetic museum");
    expect(
      Object.values(
        (onVerified.mock.calls[0]?.[1] as CourseProjectArtifactState).fields,
      ).every(
        (value) =>
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean",
      ),
    ).toBe(true);
    expect(onArtifactChange).toHaveBeenCalled();
  });

  it("renders the operator graph, budget, approvals, and intervention gate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeJsonResponse(200, {
          mode: "complete",
          text: "Run trace",
          model: "anthropic/claude-haiku-4.5",
          provider: "anthropic",
        }),
      ),
    );
    const { onVerified } = renderLab({
      config: getCourseProjectConfig("ai-native-operator"),
    });
    expect(
      screen.getByText("Scout → Analyst → Critic → Editor"),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Working context"), {
      target: {
        value:
          "Synthetic support tickets require an improvement report with bounded roles.",
      },
    });
    fireEvent.change(screen.getByLabelText("Delegation instruction"), {
      target: {
        value:
          "Create the report. Output claims with evidence and do not send externally.",
      },
    });
    fireEvent.click(screen.getByLabelText(/Human approval before/));
    fireEvent.click(screen.getByLabelText(/Testable stop condition/));
    fireEvent.click(screen.getByLabelText(/Critic intervention/));
    fireEvent.click(screen.getByLabelText(/I confirm that the inputs/));
    fireEvent.click(screen.getByRole("button", { name: "Run provider" }));
    await screen.findByText("Run trace");
    fireEvent.click(screen.getByLabelText(/Stop the faulty path/));
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Verify project" }));
    expect(onVerified.mock.calls[0]?.[1]).toMatchObject({
      fields: {
        variant: "ai-native-operator",
        budget: 4,
        evaluation: "intervene",
      },
    });
    expect(JSON.stringify(onVerified.mock.calls[0]?.[1])).not.toContain(
      "Synthetic support tickets",
    );
  });

  it("rehydrates evidence flags without restoring learner text or provider output", () => {
    renderLab({
      config: getCourseProjectConfig("claude"),
      initialArtifact: {
        version: 1,
        engineKind: "prompt",
        fields: {
          variant: "claude",
          privacyConfirmed: true,
          goalReady: true,
          contextReady: true,
          constraintsReady: true,
          approvalGate: true,
          stopCondition: true,
          handoffDefined: true,
          twoOutputEvidence: true,
          comparisonDecision: "b-stronger",
          claimReviewCode: 423153,
          rubricScores: 22133344,
          providerEvidence: "success",
          completionMode: "provider-success",
          providerModel: "anthropic/claude-haiku-4.5",
        },
      },
    });
    expect(screen.getByLabelText("Working context")).toHaveValue("");
    expect(screen.getByLabelText("Prompt A · baseline")).toHaveValue("");
    expect(screen.getByLabelText("Prompt B · grounded")).toHaveValue("");
    expect(
      screen.getByText(/Provider output is not stored/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeEnabled();
  });

  it("keeps final verification locked until all five shared stages are complete", () => {
    const { onVerified } = renderLab({
      verificationEnabled: false,
      initialArtifact: {
        version: 1,
        engineKind: "prompt",
        fields: {
          variant: "ai-native",
          privacyConfirmed: true,
          goalReady: true,
          contextReady: true,
          constraintsReady: true,
          secondaryReady: true,
          approvalGate: true,
          stopCondition: true,
          handoffDefined: true,
          evaluation: "workflow",
          providerEvidence: "success",
          completionMode: "provider-success",
          providerModel: "anthropic/claude-haiku-4.5",
        },
      },
    });

    expect(
      screen.getByText(/remains locked until all five/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify project" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Verify project" }));
    expect(onVerified).not.toHaveBeenCalled();
  });
});
