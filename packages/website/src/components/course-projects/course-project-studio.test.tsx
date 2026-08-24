import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useEffect, type ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseProjectEngineProps } from "@/lib/course-projects/types";
import {
  parseCourseProjectProgress,
  serializeCourseProjectProgress,
} from "@/lib/course-projects/persistence";
import {
  getCourseProjectDraftStorageKey,
  parseCourseProjectDraft,
  serializeCourseProjectDraft,
} from "@/lib/course-projects/project-draft";
import {
  COURSE_PROJECT_STAGE_IDS,
  getCourseProjectExecutionReceipt,
} from "@/lib/course-projects/types";
import {
  getCourseLessonMissions,
  getCourseProjectCheckpointMissions,
  type LessonMissionId,
} from "@/lib/course-projects/lesson-mission-catalog";
import { getLessonMissionProfile } from "@/lib/course-projects/lesson-missions";
import {
  createEmptyLessonMissionState,
  getLessonMissionStorageKey,
  parseLessonMissionState,
  serializeLessonMissionState,
} from "@/lib/course-projects/lesson-mission-persistence";
import {
  activateAccountLearningOwner,
  activateAnonymousLearningOwner,
  getOwnedLocalLearningItem,
  prepareAccountLearningStorage,
  setOwnedLocalLearningItem,
  setUnknownLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { verifiedCourseProjectArtifact } from "@/lib/course-projects/test-artifact";
import {
  getExerciseResult,
  saveExerciseResultWithCheckpoint,
  subscribe,
} from "@/lib/progress";
import {
  CourseProjectStudio as CourseProjectStudioUnderTest,
  getMeaningfulArtifactFingerprint,
  type CourseProjectStudioProps,
} from "./course-project-studio";

function CourseProjectStudio(
  props: Omit<CourseProjectStudioProps, "lessonContext"> & {
    readonly lessonContext?: CourseProjectStudioProps["lessonContext"];
  },
) {
  return (
    <CourseProjectStudioUnderTest
      {...props}
      lessonContext={
        props.lessonContext ?? {
          title: `Authored ${props.lessonId}`,
          objective: `Apply the authored focus for ${props.lessonId}.`,
          keyConcepts: ["Evidence boundary"],
        }
      }
    />
  );
}

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockEngine = ({
      config,
      initialArtifact,
      onMeaningfulInteraction,
      onExecutionReceipt,
      onArtifactChange,
      onVerified,
    }: CourseProjectEngineProps) => {
      useEffect(() => {
        onArtifactChange(
          initialArtifact ?? {
            version: 1,
            engineKind: config.engineKind,
            fields: {
              context: "Initial synthetic artifact",
              ready: false,
              patched: false,
            },
          },
        );
      }, [config.engineKind, initialArtifact, onArtifactChange]);

      return (
        <div data-testid="mock-project-engine">
          <span>{config.engineKind}</span>
          <span data-testid="hydrated-field">
            {String(
              initialArtifact?.fields.context ??
                initialArtifact?.fields.workspace ??
                initialArtifact?.fields.executionReceipt ??
                "empty",
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              onMeaningfulInteraction?.();
              onArtifactChange({
                version: 1,
                engineKind: config.engineKind,
                fields: {
                  context: "Current synthetic artifact",
                  ready: true,
                  patched: true,
                },
              });
            }}
          >
            Update artifact
          </button>
          <button
            type="button"
            onClick={() => {
              const receipt = getCourseProjectExecutionReceipt(
                config.courseSlug,
              );
              onArtifactChange(
                verifiedCourseProjectArtifact(config.courseSlug),
              );
              onExecutionReceipt?.(receipt);
            }}
          >
            Run artifact
          </button>
          <button
            type="button"
            onClick={() =>
              onArtifactChange(
                initialArtifact ?? {
                  version: 1,
                  engineKind: config.engineKind,
                  fields: {
                    context: "Initial synthetic artifact",
                    ready: false,
                    patched: false,
                  },
                },
              )
            }
          >
            Emit initial artifact
          </button>
          <button
            type="button"
            onClick={() =>
              onVerified(
                "Checked artifact",
                verifiedCourseProjectArtifact(config.courseSlug),
              )
            }
          >
            Verify artifact
          </button>
          <button
            type="button"
            onClick={() =>
              onVerified("Invalid artifact", {
                version: 1,
                engineKind: config.engineKind,
                fields: { ready: true },
              })
            }
          >
            Verify invalid artifact
          </button>
        </div>
      );
    };
    return MockEngine as ComponentType<CourseProjectEngineProps>;
  },
}));

vi.mock("@/lib/progress", () => ({
  getCourseSlice: vi.fn(() => ({ resetAt: undefined })),
  getExerciseResult: vi.fn(),
  saveExerciseResultWithCheckpoint: vi.fn(),
  subscribe: vi.fn((listener: () => void) => {
    listener();
    return () => undefined;
  }),
}));

const mockedGetExerciseResult = vi.mocked(getExerciseResult);
const mockedSaveExerciseResult = vi.mocked(saveExerciseResultWithCheckpoint);
const mockedSubscribe = vi.mocked(subscribe);
let progressListener: ((snapshot: never) => void) | null = null;

const DAY_MS = 24 * 60 * 60 * 1000;

function seedDurablyCompletedMissions(
  courseSlug: CourseProjectStudioProps["courseSlug"],
  missionIds: readonly string[],
): void {
  const profile = getLessonMissionProfile(courseSlug);
  const seededAttemptAt = Date.now();
  const state = {
    ...createEmptyLessonMissionState(),
    predictionId: profile.predictionChoices[0].id,
    revealed: true,
    workspaceOpened: true,
    manipulated: true,
    executionReceipt: getCourseProjectExecutionReceipt(courseSlug),
    evidenceId: profile.evidence.correctId,
    revisionId: profile.revision.correctId,
    retrievalId: profile.retrieval.correctId,
    retrievalMastered: true,
    retrievalFirstChoiceId: profile.retrieval.correctId,
    retrievalAttemptCount: 1,
    retrievalSuccessLevel: 1 as const,
    // Relative so the fixture never expires: the retrieval queue reads the
    // real clock, so an absolute next-due date turns "0 reviews are due" red
    // the day after it is written. The gap must stay exactly one interval
    // (level 1 = 1 day) or hasExactRetrievalSchedule rejects the record and
    // the whole state parses to null.
    retrievalLastAttemptAt: new Date(seededAttemptAt).toISOString(),
    retrievalNextDueAt: new Date(seededAttemptAt + DAY_MS).toISOString(),
    transferId: profile.transfer.correctId,
  };
  for (const mission of getCourseLessonMissions(courseSlug)) {
    if (!missionIds.includes(mission.id)) continue;
    expect(
      setOwnedLocalLearningItem(
        getLessonMissionStorageKey(courseSlug, mission.lessonId),
        serializeLessonMissionState(state, null),
      ),
    ).toBe(true);
  }
}

function seedDraftWithCompletedMissions(
  courseSlug: CourseProjectStudioProps["courseSlug"],
  missionIds: readonly LessonMissionId[],
  artifact: Parameters<typeof serializeCourseProjectDraft>[2],
): void {
  seedDurablyCompletedMissions(courseSlug, missionIds);
  window.localStorage.setItem(
    getCourseProjectDraftStorageKey(courseSlug),
    serializeCourseProjectDraft(courseSlug, missionIds, artifact, null),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  activateAnonymousLearningOwner();
  mockedGetExerciseResult.mockReturnValue(undefined);
  mockedSaveExerciseResult.mockReturnValue({
    checkpointWasNew: true,
    durable: true,
  });
  mockedSubscribe.mockImplementation((listener) => {
    progressListener = listener as (snapshot: never) => void;
    listener({} as never);
    return () => undefined;
  });
});

describe("CourseProjectStudio", () => {
  it("renders no studio for noncheckpoint or noncanonical lessons", () => {
    const view = render(
      <CourseProjectStudio
        courseSlug="data-science"
        lessonId="home"
        locale="en"
      />,
    );

    expect(view.container).toBeEmptyDOMElement();
    expect(mockedSaveExerciseResult).not.toHaveBeenCalled();

    view.rerender(
      <CourseProjectStudio courseSlug="codex" lessonId="L02" locale="en" />,
    );
    expect(view.container).toBeEmptyDOMElement();
  });

  it("renders the active lesson's authored frame around the stable course probe", async () => {
    const { container } = render(
      <CourseProjectStudio
        courseSlug="codex"
        lessonId="L01"
        locale="en"
        lessonContext={{
          title: "A mental model for delegated work",
          objective: "Separate intent, execution, and verification.",
          keyConcepts: ["Bounded autonomy", "Verification"],
        }}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "A mental model for delegated work",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      container.querySelector('h1, [role="heading"][aria-level="1"], h2, h3'),
    ).toHaveAttribute("aria-level", "1");
    expect(
      screen.getByRole("heading", { level: 2, name: "The Repository Mission" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Separate intent, execution, and verification."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Key concepts" }),
    ).toHaveTextContent("Bounded autonomy");

    const lessonHeading = screen.getByRole("heading", {
      level: 1,
      name: "A mental model for delegated work",
    });
    const collapse = screen.getByRole("button", {
      name: "Collapse signal circuit",
    });
    const controlledBody = document.getElementById(
      collapse.getAttribute("aria-controls") ?? "missing",
    );
    expect(controlledBody).not.toContainElement(lessonHeading);

    fireEvent.click(collapse);

    expect(controlledBody).toHaveAttribute("hidden");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "A mental model for delegated work",
      }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelectorAll("h1")).toHaveLength(0);
  });

  it("nests its lesson heading when a custom route already owns H1", async () => {
    render(
      <CourseProjectStudio
        courseSlug="codex"
        lessonId="L01"
        locale="en"
        missionHeadingLevel={2}
        lessonContext={{
          title: "A mental model for delegated work",
          objective: "Separate intent, execution, and verification.",
        }}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "A mental model for delegated work",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("does not activate or report project evidence while the learning owner is unknown", async () => {
    setUnknownLearningOwner();
    render(
      <CourseProjectStudio courseSlug="codex" lessonId="L01" locale="en" />,
    );

    const open = await screen.findByRole("button", { name: "Open studio" });
    expect(open).toBeDisabled();
    fireEvent.click(open);
    expect(screen.queryByTestId("mock-project-engine")).not.toBeInTheDocument();
    expect(mockedSaveExerciseResult).not.toHaveBeenCalled();

    act(() => {
      activateAnonymousLearningOwner();
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Open studio" })).toBeEnabled(),
    );
  });

  it("ignores prompt consent and model-only changes but counts bounded prompt diagnostics", () => {
    const base = {
      version: 1,
      engineKind: "prompt",
      fields: {
        privacyConfirmed: false,
        providerModel: "anthropic/claude-haiku-4.5",
        goalReady: false,
        contextReady: false,
        constraintsReady: false,
        secondaryReady: false,
        approvalGate: false,
        stopCondition: false,
        handoffDefined: false,
        budget: 800,
        evaluation: "",
        providerEvidence: "none",
      },
    } as const;
    const consentAndModelOnly = {
      ...base,
      fields: {
        ...base.fields,
        privacyConfirmed: true,
        providerModel: "google/gemini-2.5-flash-lite",
      },
    } as const;
    const boundedPromptRevision = {
      ...consentAndModelOnly,
      fields: { ...consentAndModelOnly.fields, goalReady: true },
    } as const;

    expect(getMeaningfulArtifactFingerprint(consentAndModelOnly)).toBe(
      getMeaningfulArtifactFingerprint(base),
    );
    expect(getMeaningfulArtifactFingerprint(boundedPromptRevision)).not.toBe(
      getMeaningfulArtifactFingerprint(base),
    );
  });

  it("renders localized project framing but does not mount an engine before activation", () => {
    const { container } = render(
      <CourseProjectStudio
        courseSlug="ki-und-gesellschaft"
        lessonId="arbeit-1-1"
        locale="de"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Die Evidenzredaktion" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Synthetischer Fall")).toBeInTheDocument();
    expect(screen.getAllByText("Einordnen")).toHaveLength(2);
    expect(screen.getByText("Übertragen")).toBeInTheDocument();
    expect(
      container.querySelectorAll('[data-course-project] [aria-current="step"]'),
    ).toHaveLength(1);
    expect(
      container.querySelector('[data-course-project] [aria-current="step"]'),
    ).toHaveTextContent("Einordnen");
    expect(
      screen.getByRole("heading", { name: "Einordnen" }).closest("section"),
    ).toHaveTextContent("Versiegelte Ausgangsnotiz");
    expect(screen.getByText(/Angewandtes Kursprojekt/)).toHaveClass(
      "text-[#ffc6aa]",
    );
    expect(screen.getByText("Lieferobjekt")).toHaveClass(
      "text-brand-orange-dark",
    );
    expect(container.querySelector("#course-project-studio")).not.toBeNull();
    expect(
      screen.getByRole("toolbar", { name: "Arbeitsbereich-Layout" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Projektbrief einklappen" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", {
        name: "Bereiche nebeneinander andocken",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Vollbild öffnen" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("mock-project-engine")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Werkstatt öffnen" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("activates the selected engine only after the learner clicks", async () => {
    render(
      <CourseProjectStudio courseSlug="codex" lessonId="L01" locale="en" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open studio" }));

    expect(await screen.findByTestId("mock-project-engine")).toHaveTextContent(
      "repo",
    );
    const workspace = screen.getByLabelText(
      "Workspace active: The Repository Mission",
    );
    await waitFor(() => expect(workspace).toHaveFocus());
  });

  it("unmounts an active engine when navigation reaches a locked checkpoint", async () => {
    const view = render(
      <CourseProjectStudio courseSlug="codex" lessonId="L01" locale="en" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open studio" }));
    expect(await screen.findByTestId("mock-project-engine")).toBeInTheDocument();

    view.rerender(
      <CourseProjectStudio courseSlug="codex" lessonId="L12" locale="en" />,
    );

    expect(screen.queryByTestId("mock-project-engine")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open studio" })).toBeDisabled();
  });

  it("uses container-width auto-fit grids for stages and acceptance criteria", () => {
    const { container } = render(
      <CourseProjectStudio courseSlug="codex" lessonId="L01" locale="en" />,
    );

    const autoFitGrids = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[style*="repeat(auto-fit, minmax(min(100%"]',
      ),
    );
    expect(autoFitGrids.length).toBeGreaterThanOrEqual(2);
    expect(
      autoFitGrids.some((element) =>
        element.style.gridTemplateColumns.includes("20rem"),
      ),
    ).toBe(true);
    expect(
      autoFitGrids.some((element) =>
        element.style.gridTemplateColumns.includes("9rem"),
      ),
    ).toBe(true);
    expect(container.innerHTML).not.toContain("sm:grid-cols-5");
    expect(container.innerHTML).not.toContain("xl:grid-cols");
  });

  it("does not count the engine's initial artifact emission as manipulation", async () => {
    render(
      <CourseProjectStudio courseSlug="codex" lessonId="L01" locale="en" />,
    );

    await screen.findByRole("button", { name: /Commit prediction/ });
    fireEvent.click(
      screen.getByRole("radio", { name: /smallest reproducing test/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Commit prediction/ }));
    fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));
    fireEvent.click(screen.getByRole("button", { name: /Open instrument/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Inspect/ })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Update artifact" }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^Run: incomplete$/ }),
      ).toHaveAttribute("aria-disabled", "false");
    });
    expect(screen.getByRole("button", { name: /^Inspect:/ })).toBeDisabled();
  });

  it("persists the verified artifact exercise only after all five stages", async () => {
    seedDraftWithCompletedMissions(
      "claude",
      getCourseLessonMissions("claude").map((mission) => mission.id),
      null,
    );
    render(
      <CourseProjectStudio
        courseSlug="claude"
        lessonId="mental-model"
        locale="en"
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(/Project acceptance unlocks only/)).toBeVisible(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Open studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Run artifact" }));
    await waitFor(() =>
      expect(
        screen.queryByText(/Project acceptance unlocks only/),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Verify artifact" }));

    expect(mockedSaveExerciseResult).toHaveBeenCalledWith(
      "claude",
      "safety",
      expect.objectContaining({
        exerciseId: "project-claude-evidence-lab",
        kind: "course-project-prompt",
        completed: true,
        score: 1,
        attempts: 1,
        skipped: false,
        summary: expect.stringMatching(/^@cp1:/),
      }),
      "project-claude-evidence-lab:verified",
    );
    const savedResult = mockedSaveExerciseResult.mock.calls[0]?.[2];
    const parsed = parseCourseProjectProgress(savedResult?.summary, "prompt");
    expect(parsed.summary).toBe("Checked artifact");
    expect(parsed.artifact).toMatchObject({
      version: 1,
      engineKind: "prompt",
      fields: { stages: COURSE_PROJECT_STAGE_IDS },
    });
    expect(screen.getByText("Checked artifact")).toBeInTheDocument();
    expect(screen.getByText("Project verified")).toBeInTheDocument();
  });

  it("does not award a checkpoint or show success after the exercise write changes owner", async () => {
    seedDraftWithCompletedMissions(
      "claude",
      getCourseLessonMissions("claude").map((mission) => mission.id),
      null,
    );
    mockedSaveExerciseResult.mockImplementation(() => {
      setUnknownLearningOwner();
      return { checkpointWasNew: true, durable: true };
    });
    render(
      <CourseProjectStudio
        courseSlug="claude"
        lessonId="mental-model"
        locale="en"
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Open studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Run artifact" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify artifact" }));

    expect(mockedSaveExerciseResult).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Checked artifact")).not.toBeInTheDocument();
    expect(screen.queryByText("Project verified")).not.toBeInTheDocument();
  });

  it("keeps verification incomplete when the progress write is not durable", async () => {
    seedDraftWithCompletedMissions(
      "claude",
      getCourseLessonMissions("claude").map((mission) => mission.id),
      null,
    );
    mockedSaveExerciseResult.mockReturnValue({
      checkpointWasNew: false,
      durable: false,
    });
    render(
      <CourseProjectStudio
        courseSlug="claude"
        lessonId="mental-model"
        locale="en"
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Open studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Run artifact" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify artifact" }));

    expect(mockedSaveExerciseResult).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Verification was not stored/i,
    );
    expect(screen.queryByText("Checked artifact")).not.toBeInTheDocument();
    expect(screen.queryByText("Project verified")).not.toBeInTheDocument();
  });

  it("rejects direct verification while the cumulative project stages are incomplete", () => {
    render(
      <CourseProjectStudio
        courseSlug="claude"
        lessonId="mental-model"
        locale="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify artifact" }));

    expect(mockedSaveExerciseResult).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        /Project acceptance unlocks only after all five stage missions/,
      ),
    ).toBeInTheDocument();
  });

  it("rejects same-kind evidence that fails the course semantic gate", async () => {
    seedDraftWithCompletedMissions(
      "claude",
      getCourseLessonMissions("claude").map((mission) => mission.id),
      null,
    );
    render(
      <CourseProjectStudio
        courseSlug="claude"
        lessonId="mental-model"
        locale="en"
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Open studio" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Verify invalid artifact" }),
    );

    expect(mockedSaveExerciseResult).not.toHaveBeenCalled();
    expect(screen.queryByText("Invalid artifact")).not.toBeInTheDocument();
  });

  it("clears and remounts the workspace across an in-place account transition", async () => {
    Object.defineProperty(window.navigator, "locks", {
      configurable: true,
      value: {
        request: vi.fn(
          async (
            name: string,
            _options: LockOptions,
            callback: (lock: Lock | null) => unknown,
          ) => callback({ name, mode: "exclusive" } as Lock),
        ),
      },
    });
    expect(await prepareAccountLearningStorage()).toBe(true);
    expect(activateAccountLearningOwner("account-a").kind).toBe("account");
    const draftKey = getCourseProjectDraftStorageKey("codex");
    seedDurablyCompletedMissions(
      "codex",
      getCourseLessonMissions("codex")
        .slice(0, 1)
        .map((mission) => mission.id),
    );
    setOwnedLocalLearningItem(
      draftKey,
      serializeCourseProjectDraft(
        "codex",
        getCourseLessonMissions("codex")
          .slice(0, 1)
          .map((mission) => mission.id),
        {
          version: 1,
          engineKind: "repo",
          fields: { workspace: "pipeline-quality" },
        },
        null,
      ),
    );

    render(
      <CourseProjectStudio courseSlug="codex" lessonId="L01" locale="en" />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Open studio" }));
    expect(screen.getByTestId("hydrated-field")).toHaveTextContent(
      "pipeline-quality",
    );

    act(() => {
      expect(activateAccountLearningOwner("account-b").kind).toBe("account");
    });
    await waitFor(() =>
      expect(
        screen.queryByTestId("mock-project-engine"),
      ).not.toBeInTheDocument(),
    );
    expect(document.body).not.toHaveTextContent("pipeline-quality");
    expect(getOwnedLocalLearningItem(draftKey)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open studio" }));
    expect(await screen.findByTestId("hydrated-field")).toHaveTextContent(
      "Initial synthetic artifact",
    );
    expect(getOwnedLocalLearningItem(draftKey)).not.toContain(
      "pipeline-quality",
    );
  });

  it("clears a mounted partial project when the course reset boundary changes", async () => {
    const draftKey = getCourseProjectDraftStorageKey("codex");
    seedDurablyCompletedMissions(
      "codex",
      getCourseLessonMissions("codex")
        .slice(0, 1)
        .map((mission) => mission.id),
    );
    window.localStorage.setItem(
      draftKey,
      serializeCourseProjectDraft(
        "codex",
        getCourseLessonMissions("codex")
          .slice(0, 1)
          .map((mission) => mission.id),
        {
          version: 1,
          engineKind: "repo",
          fields: { workspace: "pipeline-quality" },
        },
        null,
      ),
    );
    render(
      <CourseProjectStudio courseSlug="codex" lessonId="L01" locale="en" />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Open studio" }));
    expect(screen.getByTestId("hydrated-field")).toHaveTextContent(
      "pipeline-quality",
    );
    expect(
      screen.getByRole("button", { name: /Predict: complete/i }),
    ).toBeEnabled();

    act(() => {
      progressListener?.({
        courses: {
          codex: {
            lessons: {},
            resetAt: "2026-08-13T12:30:00.000Z",
          },
        },
      } as never);
    });

    await waitFor(() =>
      expect(
        screen.queryByTestId("mock-project-engine"),
      ).not.toBeInTheDocument(),
    );
    expect(document.body).not.toHaveTextContent("pipeline-quality");
    expect(
      screen.getByRole("radio", { name: /smallest reproducing test/i }),
    ).not.toBeChecked();
    expect(window.localStorage.getItem(draftKey)).toBeNull();
  });

  it("shows persisted completion from the progress subscription", () => {
    const persistedResult = {
      exerciseId: "project-data-science-experiment",
      kind: "course-project-data",
      completed: true,
      score: 1,
      attempts: 1,
      completedAt: "2026-08-13T12:00:00.000Z",
      skipped: false,
      summary: serializeCourseProjectProgress(
        "Notebook and model card verified",
        {
          ...verifiedCourseProjectArtifact("data-science"),
        },
      ),
    } as const;
    mockedGetExerciseResult.mockReturnValue(persistedResult);
    mockedSubscribe.mockImplementation((listener) => {
      listener({
        schemaVersion: 3,
        courses: {
          "data-science": {
            lessons: {
              cap: {
                sectionsRead: [],
                quizScore: null,
                quizTotal: null,
                completed: false,
                exercisesCompleted: {
                  [persistedResult.exerciseId]: persistedResult,
                },
              },
            },
            workshopQuiz: { passed: false, score: 0, completedAt: null },
            capstoneSubmitted: false,
            startedAt: "2026-08-13T12:00:00.000Z",
            lastActivity: "2026-08-13T12:00:00.000Z",
          },
        },
        xp: 0,
        checkpoints: {},
        badges: {},
        streak: { days: 0, last: null },
        lastActivity: "2026-08-13T12:00:00.000Z",
      });
      return () => undefined;
    });

    render(
      <CourseProjectStudio courseSlug="data-science" lessonId="fund" locale="en" />,
    );

    expect(
      screen.getByText("Notebook and model card verified"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/verified artifact milestone/i),
    ).toBeInTheDocument();
    expect(mockedGetExerciseResult).toHaveBeenCalledWith(
      "data-science",
      "cap",
      "project-data-science-experiment",
    );

    fireEvent.click(screen.getByRole("button", { name: "Open studio" }));
    expect(screen.getByTestId("hydrated-field")).toHaveTextContent(
      "ds-leakage-v1:node24",
    );
  });

  it("keeps unverified artifact edits in session without inflating persisted attempts", () => {
    render(
      <CourseProjectStudio courseSlug="codex" lessonId="L01" locale="en" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Update artifact" }));

    expect(screen.getByTestId("hydrated-field")).toHaveTextContent(
      "Current synthetic artifact",
    );
    expect(mockedSaveExerciseResult).not.toHaveBeenCalled();
  });

  it("preserves earlier receipts and re-adds only the current receipt after reset and recompletion", async () => {
    const missions = getCourseProjectCheckpointMissions("codex");
    const first = missions[0]!;
    const second = missions[1]!;
    const draftKey = getCourseProjectDraftStorageKey("codex");
    seedDurablyCompletedMissions("codex", [first.id, second.id]);
    window.localStorage.setItem(
      draftKey,
      serializeCourseProjectDraft(
        "codex",
        [first.id, second.id],
        verifiedCourseProjectArtifact("codex"),
        null,
      ),
    );

    const view = render(
      <CourseProjectStudio
        courseSlug="codex"
        lessonId={second.lessonId}
        locale="en"
      />,
    );
    expect(screen.getByText("0 reviews are due")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Open studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Update artifact" }));

    await waitFor(() => {
      const stored = getOwnedLocalLearningItem(draftKey);
      expect(stored).not.toBeNull();
      expect(stored).toContain(`\"${first.lessonId}\"`);
      expect(stored).toContain(`\"${second.lessonId}\"`);
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Reset lesson mission" }),
    );
    await waitFor(() => {
      const stored = getOwnedLocalLearningItem(draftKey);
      expect(stored).not.toBeNull();
      expect(stored).toContain(`\"${first.lessonId}\"`);
      expect(stored).not.toContain(`\"${second.lessonId}\"`);
    });

    const missionProfile = getLessonMissionProfile("codex");
    fireEvent.click(
      screen.getByRole("radio", {
        name: new RegExp(missionProfile.predictionChoices[0]!.label.en, "i"),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Commit prediction/ }));
    fireEvent.click(screen.getByRole("button", { name: /Manipulate/ }));
    fireEvent.click(screen.getByRole("button", { name: "Update artifact" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^Run: incomplete$/ }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Run: incomplete$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Run artifact" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Inspect/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Inspect/ }));
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(
          missionProfile.evidence.choices.find(
            (choice) => choice.id === missionProfile.evidence.correctId,
          )!.label.en,
          "i",
        ),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(
          missionProfile.revision.choices.find(
            (choice) => choice.id === missionProfile.revision.correctId,
          )!.label.en,
          "i",
        ),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Rule from memory" }),
      {
        target: {
          value: "The smallest reproducing test isolates the failure boundary.",
        },
      },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Commit recall and open options",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(
          missionProfile.retrieval.choices.find(
            (choice) => choice.id === missionProfile.retrieval.correctId,
          )!.label.en,
          "i",
        ),
      }),
    );
    await waitFor(() => {
      expect(screen.getByText("Not due yet · passed once")).toBeInTheDocument();
      const missionRaw = getOwnedLocalLearningItem(
        `loehrning:lesson-mission:v1:codex:${encodeURIComponent(second.lessonId)}`,
      );
      expect(missionRaw).toContain('"retrievalSuccessLevel":1');
    });
    fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(
          missionProfile.transfer.choices.find(
            (choice) => choice.id === missionProfile.transfer.correctId,
          )!.label.en,
          "i",
        ),
      }),
    );
    await waitFor(() => {
      const stored = getOwnedLocalLearningItem(draftKey);
      expect(stored).toContain(`\"${first.lessonId}\"`);
      expect(stored).toContain(`\"${second.lessonId}\"`);
    });

    view.unmount();
    render(
      <CourseProjectStudio
        courseSlug="codex"
        lessonId={second.lessonId}
        locale="en"
      />,
    );
    await screen.findByRole("button", { name: "Open studio" });
    const reloaded = getOwnedLocalLearningItem(draftKey);
    expect(reloaded).toContain(`\"${first.lessonId}\"`);
    expect(reloaded).toContain(`\"${second.lessonId}\"`);
  });

  it("does not restore a draft receipt after its durable mission was removed and draft revocation was denied", async () => {
    const mission = getCourseLessonMissions("codex")[0]!;
    const draftKey = getCourseProjectDraftStorageKey("codex");
    seedDraftWithCompletedMissions(
      "codex",
      [mission.id],
      verifiedCourseProjectArtifact("codex"),
    );
    const view = render(
      <CourseProjectStudio
        courseSlug="codex"
        lessonId={mission.lessonId}
        locale="en"
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Open studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Update artifact" }));
    await waitFor(() => {
      const stored = parseCourseProjectDraft(
        getOwnedLocalLearningItem(draftKey),
        "codex",
        "repo",
        null,
      );
      expect(stored?.completedMissionIds).toEqual([mission.id]);
    });
    const priorDraft = getOwnedLocalLearningItem(draftKey);
    const originalSetItem = window.localStorage.setItem.bind(
      window.localStorage,
    );
    const setItem = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation((key, value) => {
        if (key === draftKey) throw new Error("draft write denied");
        originalSetItem(key, value);
      });

    fireEvent.click(
      screen.getByRole("button", { name: "Reset lesson mission" }),
    );
    expect(getOwnedLocalLearningItem(draftKey)).toBe(priorDraft);
    setItem.mockRestore();
    view.unmount();

    render(
      <CourseProjectStudio
        courseSlug="codex"
        lessonId={mission.lessonId}
        locale="en"
      />,
    );
    await screen.findByRole("button", { name: "Open studio" });
    await waitFor(() => {
      const restored = parseCourseProjectDraft(
        getOwnedLocalLearningItem(draftKey),
        "codex",
        "repo",
        null,
      );
      expect(restored?.completedMissionIds).toEqual([]);
    });
  });

  it("retains historical stage credit after a durable wrong due review", async () => {
    const mission = getCourseLessonMissions("codex")[0]!;
    const profile = getLessonMissionProfile("codex");
    const incorrect = profile.retrieval.choices.find(
      (choice) => choice.id !== profile.retrieval.correctId,
    )!.id;
    seedDraftWithCompletedMissions("codex", [mission.id], null);
    const missionKey = getLessonMissionStorageKey("codex", mission.lessonId);
    const completed = parseLessonMissionState(
      getOwnedLocalLearningItem(missionKey),
      profile,
      null,
    )!;
    expect(
      setOwnedLocalLearningItem(
        missionKey,
        serializeLessonMissionState(
          {
            ...completed,
            retrievalId: incorrect,
            retrievalAttemptCount: completed.retrievalAttemptCount + 1,
            retrievalSuccessLevel: 0,
            retrievalLastAttemptAt: "2026-08-13T12:00:00.000Z",
            retrievalNextDueAt: "2026-08-13T12:00:00.000Z",
            retrievalMisconceptionId: incorrect,
          },
          null,
        ),
      ),
    ).toBe(true);

    render(
      <CourseProjectStudio
        courseSlug="codex"
        lessonId={mission.lessonId}
        locale="en"
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Open studio" }));
    await waitFor(() => {
      const restored = parseCourseProjectDraft(
        getOwnedLocalLearningItem(getCourseProjectDraftStorageKey("codex")),
        "codex",
        "repo",
        null,
      );
      expect(restored?.completedMissionIds).toEqual([mission.id]);
    });
  });
});
