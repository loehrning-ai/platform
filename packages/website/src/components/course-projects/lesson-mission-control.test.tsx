import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getCourseProjectConfig } from "@/lib/course-projects/configs";
import {
  getLessonMissionStorageKey,
  serializeLessonMissionState,
} from "@/lib/course-projects/lesson-mission-persistence";
import { getLessonMissionProfile } from "@/lib/course-projects/lesson-missions";
import { bindLessonMission } from "@/lib/course-projects/lesson-mission-binding";
import { getCourseProjectExecutionReceipt } from "@/lib/course-projects/types";
import {
  activateAccountLearningOwner,
  activateAnonymousLearningOwner,
  getOwnedLocalLearningItem,
  prepareAccountLearningStorage,
  setOwnedLocalLearningItem,
  setUnknownLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { LessonMissionControl } from "./lesson-mission-control";

function installLocalStoragePolyfill(): void {
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: polyfill,
    configurable: true,
  });
}

beforeAll(() => {
  if (
    typeof window.localStorage === "undefined" ||
    typeof window.localStorage.setItem !== "function"
  ) {
    installLocalStoragePolyfill();
  }
});

beforeEach(() => {
  window.localStorage.clear();
  activateAnonymousLearningOwner();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const courseSlug = "data-science" as const;
const lessonId = "feature";
const config = getCourseProjectConfig(courseSlug);
const stage = config.stages[1];
const profile = getLessonMissionProfile(courseSlug);
const expectedExecutionReceipt = getCourseProjectExecutionReceipt(courseSlug);

function missionProps(overrides?: {
  workspaceActive?: boolean;
  instrumentRevision?: number;
  executionReceipt?: typeof expectedExecutionReceipt | null;
  executionRevision?: number;
  locale?: "de" | "en";
  projectStageUnlocked?: boolean;
  resetAt?: string | null;
}) {
  const locale = overrides?.locale ?? ("en" as const);
  return {
    courseSlug,
    lessonId,
    locale,
    mission: bindLessonMission(courseSlug, lessonId, locale, {
      title: locale === "de" ? "Merkmale" : "Feature engineering",
      objective:
        locale === "de"
          ? "Merkmale erzeugen, ohne Zielinformationen durchsickern zu lassen."
          : "Build features without leaking target information.",
      keyConcepts:
        locale === "de" ? ["Merkmale", "Datenleck"] : ["Features", "Leakage"],
    }),
    projectStage: stage,
    projectStageIndex: 1,
    workspaceId: "course-project-studio",
    workspaceActive: overrides?.workspaceActive ?? false,
    instrumentRevision: overrides?.instrumentRevision ?? 0,
    executionReceipt: overrides?.executionReceipt ?? null,
    executionRevision: overrides?.executionRevision ?? 0,
    projectStageUnlocked: overrides?.projectStageUnlocked ?? true,
    resetAt: overrides?.resetAt ?? null,
    onOpenWorkspace: vi.fn(),
    onMissionComplete: vi.fn(),
    onMissionReset: vi.fn(),
    onRetrievalScheduleChange: vi.fn(),
  };
}

async function renderAtRetrieval() {
  const props = missionProps({ workspaceActive: true });
  const view = render(<LessonMissionControl {...props} />);
  await screen.findByRole("button", { name: /Commit prediction/ });

  fireEvent.click(screen.getByRole("radio", { name: /Target leakage/ }));
  fireEvent.click(screen.getByRole("button", { name: /Commit prediction/ }));
  fireEvent.click(screen.getByRole("button", { name: /Manipulate/ }));
  view.rerender(
    <LessonMissionControl {...props} workspaceActive instrumentRevision={1} />,
  );
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Run/ })).toHaveAttribute(
      "aria-disabled",
      "false",
    );
  });
  expect(screen.getByRole("button", { name: /Inspect/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /Run/ }));
  view.rerender(
    <LessonMissionControl
      {...props}
      workspaceActive
      instrumentRevision={1}
      executionReceipt={expectedExecutionReceipt}
      executionRevision={1}
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /Inspect/ })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /Inspect/ }));
  fireEvent.click(
    screen.getByRole("button", { name: /feature-availability audit/i }),
  );
  fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));

  const privateScratch = "private-scratch-value-must-not-persist";
  fireEvent.change(
    screen.getByRole("textbox", { name: "Temporary revision note" }),
    { target: { value: privateScratch } },
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: /remove the leaking feature, re-split by time/i,
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));

  return { props, view, privateScratch };
}

describe("LessonMissionControl", () => {
  it("rejects a mission saved before the current course reset boundary", async () => {
    const key = getLessonMissionStorageKey(courseSlug, lessonId);
    window.localStorage.setItem(
      key,
      serializeLessonMissionState(
        {
          version: 1,
          predictionId: profile.predictionChoices[0]!.id,
          revealed: true,
          workspaceOpened: true,
          manipulated: true,
          executionReceipt: expectedExecutionReceipt,
          evidenceId: profile.evidence.correctId,
          retrievalId: profile.retrieval.correctId,
          retrievalMastered: true,
          retrievalFirstChoiceId: profile.retrieval.correctId,
          retrievalAttemptCount: 1,
          retrievalSuccessLevel: 1,
          retrievalLastAttemptAt: null,
          retrievalNextDueAt: null,
          retrievalMisconceptionId: null,
          revisionId: profile.revision.correctId,
          transferId: profile.transfer.correctId,
          collapsed: false,
        },
        null,
      ),
    );
    const props = missionProps({
      resetAt: "2026-08-13T12:30:00.000Z",
    });

    render(<LessonMissionControl {...props} />);

    await screen.findByRole("button", {
      name: "Commit prediction and reveal signal",
    });
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
    expect(props.onMissionComplete).not.toHaveBeenCalled();
    await waitFor(() => expect(window.localStorage.getItem(key)).toBeNull());
  });

  it("blocks interaction until the learning-data owner is resolved", async () => {
    setUnknownLearningOwner();
    const props = missionProps();
    render(<LessonMissionControl {...props} />);

    const prediction = await screen.findByRole("radio", {
      name: /Target leakage/,
    });
    expect(prediction).toBeDisabled();
    fireEvent.click(prediction);
    expect(prediction).not.toBeChecked();
    expect(props.onOpenWorkspace).not.toHaveBeenCalled();
    expect(
      window.localStorage.getItem(
        getLessonMissionStorageKey(courseSlug, lessonId),
      ),
    ).toBeNull();

    act(() => {
      activateAnonymousLearningOwner();
    });
    await waitFor(() =>
      expect(
        screen.getByRole("radio", { name: /Target leakage/ }),
      ).toBeEnabled(),
    );
  });

  it("requires a keyboard-native prediction commitment before revealing the signal", async () => {
    render(<LessonMissionControl {...missionProps()} />);

    const reveal = await screen.findByRole("button", {
      name: "Commit prediction and reveal signal",
    });
    const signal = document.getElementById(
      reveal.getAttribute("aria-controls") ?? "missing",
    );
    expect(signal).not.toBeNull();
    expect(signal).toHaveAttribute("hidden");
    expect(reveal).toBeDisabled();
    expect(screen.queryByText(/resolved_at/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Manipulate/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: /Manipulate/ })).toBeDisabled();
    expect(
      screen.getByText(/Complete the previous signal first/),
    ).toBeVisible();

    const prediction = screen.getByRole("radio", { name: /Target leakage/ });
    prediction.focus();
    expect(prediction).toHaveFocus();
    fireEvent.click(prediction);
    expect(reveal).toBeEnabled();
    fireEvent.click(reveal);

    expect(await screen.findByText(/resolved_at/)).toBeInTheDocument();
    expect(signal).toHaveFocus();
    expect(prediction).toBeDisabled();
    expect(screen.getByRole("button", { name: /Manipulate/ })).toHaveAttribute(
      "aria-disabled",
      "false",
    );
  });

  it("separates authored manipulation from a fresh successful run receipt", async () => {
    const props = missionProps();
    const view = render(<LessonMissionControl {...props} />);
    await screen.findByRole("button", { name: /Commit prediction/ });

    fireEvent.click(screen.getByRole("radio", { name: /Target leakage/ }));
    fireEvent.click(screen.getByRole("button", { name: /Commit prediction/ }));
    fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));
    fireEvent.click(screen.getByRole("button", { name: /Open instrument/ }));

    expect(props.onOpenWorkspace).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Inspect/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    view.rerender(
      <LessonMissionControl
        {...props}
        workspaceActive
        instrumentRevision={0}
      />,
    );
    expect(screen.getByRole("button", { name: /Inspect/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    view.rerender(
      <LessonMissionControl
        {...props}
        workspaceActive
        instrumentRevision={1}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Run/ })).toHaveAttribute(
        "aria-disabled",
        "false",
      );
    });
    expect(screen.getByRole("button", { name: /Inspect/ })).toBeDisabled();
    expect(
      screen.getByText(/instrument change was detected/i),
    ).toBeInTheDocument();

    view.rerender(
      <LessonMissionControl
        {...props}
        workspaceActive
        instrumentRevision={1}
        executionReceipt={expectedExecutionReceipt}
        executionRevision={0}
      />,
    );
    expect(screen.getByRole("button", { name: /Inspect/ })).toBeDisabled();

    view.rerender(
      <LessonMissionControl
        {...props}
        workspaceActive
        instrumentRevision={1}
        executionReceipt={expectedExecutionReceipt}
        executionRevision={1}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Inspect/ })).toBeEnabled(),
    );
  });

  it("captures the revision epoch at reveal so pre-prediction edits cannot satisfy manipulation", async () => {
    const props = missionProps({
      workspaceActive: true,
      instrumentRevision: 2,
    });
    const view = render(<LessonMissionControl {...props} />);
    await screen.findByRole("button", { name: /Commit prediction/ });

    fireEvent.click(screen.getByRole("radio", { name: /Target leakage/ }));
    fireEvent.click(screen.getByRole("button", { name: /Commit prediction/ }));
    fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));

    expect(
      screen.getByRole("heading", { name: profile.manipulation.en }),
    ).toHaveFocus();
    expect(screen.getByRole("button", { name: /Inspect/ })).toBeDisabled();

    view.rerender(
      <LessonMissionControl
        {...props}
        workspaceActive
        instrumentRevision={2}
      />,
    );
    expect(screen.getByRole("button", { name: /Inspect/ })).toBeDisabled();

    view.rerender(
      <LessonMissionControl
        {...props}
        workspaceActive
        instrumentRevision={3}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Run/ })).toBeEnabled();
    });
    expect(screen.getByRole("button", { name: /Inspect/ })).toBeDisabled();
  });

  it("uses scored evidence, retrieval, revision, and transfer rather than self-report checkboxes", async () => {
    const { props, privateScratch } = await renderAtRetrieval();
    expect(
      screen.queryByRole("button", { name: /final holdout/i }),
    ).not.toBeInTheDocument();
    const writtenRecall = screen.getByRole("textbox", {
      name: "Rule from memory",
    });
    const privateRecall =
      "The final holdout stays untouched until the final evaluation.";
    fireEvent.change(writtenRecall, { target: { value: privateRecall } });
    fireEvent.click(
      screen.getByRole("button", { name: "Commit recall and open options" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /final holdout/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));

    fireEvent.click(
      screen.getByRole("button", {
        name: /feature timeline relative to prediction time/i,
      }),
    );
    expect(await screen.findByText("Lesson loop closed")).toBeInTheDocument();
    await waitFor(() =>
      expect(props.onMissionComplete).toHaveBeenCalledTimes(1),
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    await waitFor(() => {
      const stored = window.localStorage.getItem(
        getLessonMissionStorageKey(courseSlug, lessonId),
      );
      expect(stored).toContain(profile.transfer.correctId);
      expect(stored).not.toContain(privateScratch);
      expect(stored).not.toContain(privateRecall);
    });
  });

  it("locks the first retrieval choice, records its misconception, and requires written repair", async () => {
    const { props } = await renderAtRetrieval();
    const key = getLessonMissionStorageKey(courseSlug, lessonId);
    const wrongChoice = profile.retrieval.choices.find(
      (entry) => entry.id !== profile.retrieval.correctId,
    )!;
    const correctChoice = profile.retrieval.choices.find(
      (entry) => entry.id === profile.retrieval.correctId,
    )!;
    const firstRecall =
      "Validation guides iteration while the final set remains untouched.";
    const recallCommit = screen.getByRole("button", {
      name: "Commit recall and open options",
    });

    expect(
      screen.queryByRole("button", {
        name: new RegExp(correctChoice.label.en, "i"),
      }),
    ).not.toBeInTheDocument();
    expect(recallCommit).toBeDisabled();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Rule from memory" }),
      { target: { value: "Too short" } },
    );
    expect(recallCommit).toBeDisabled();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Rule from memory" }),
      { target: { value: firstRecall } },
    );
    expect(recallCommit).toBeEnabled();
    fireEvent.click(recallCommit);
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(wrongChoice.label.en, "i"),
      }),
    );
    expect(props.onRetrievalScheduleChange).toHaveBeenCalledTimes(1);

    for (const choice of profile.retrieval.choices) {
      expect(
        screen.getByRole("button", {
          name: new RegExp(choice.label.en, "i"),
        }),
      ).toBeDisabled();
    }
    expect(screen.getByText("Misconception detected")).toBeInTheDocument();
    const expectedRepair = profile.retrieval.repairByChoiceId?.[wrongChoice.id];
    if (!expectedRepair)
      throw new Error("Expected authored misconception repair");
    expect(screen.getByText(expectedRepair.en)).toBeInTheDocument();

    await waitFor(() => {
      const stored = window.localStorage.getItem(key) ?? "{}";
      const record = JSON.parse(stored) as Record<string, unknown>;
      expect(record.retrievalFirstChoiceId).toBe(wrongChoice.id);
      expect(record.retrievalId).toBe(wrongChoice.id);
      expect(record.retrievalMisconceptionId).toBe(wrongChoice.id);
      expect(record.retrievalAttemptCount).toBe(1);
      expect(record.retrievalSuccessLevel).toBe(0);
      expect(record.retrievalNextDueAt).toBe(record.retrievalLastAttemptAt);
      expect(stored).not.toContain(firstRecall);
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(correctChoice.label.en, "i"),
      }),
    );
    expect(props.onRetrievalScheduleChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Transfer/ })).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Begin repair retrieval" }),
    );
    expect(
      screen.queryByRole("button", {
        name: new RegExp(correctChoice.label.en, "i"),
      }),
    ).not.toBeInTheDocument();

    const repairedRecall =
      "The final holdout is used once after all model choices are fixed.";
    fireEvent.change(
      screen.getByRole("textbox", { name: "Rule from memory" }),
      { target: { value: repairedRecall } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Commit recall and open options" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(correctChoice.label.en, "i"),
      }),
    );
    expect(props.onRetrievalScheduleChange).toHaveBeenCalledTimes(2);

    expect(
      screen.getByText(`First retrieval choice: ${wrongChoice.label.en}`),
    ).toBeInTheDocument();
    expect(screen.getByText(/Next retrieval interval: 1 day/)).toBeVisible();
    expect(screen.getByRole("button", { name: /Transfer/ })).toBeEnabled();

    await waitFor(() => {
      const stored = window.localStorage.getItem(key) ?? "{}";
      const record = JSON.parse(stored) as Record<string, unknown>;
      expect(record.retrievalFirstChoiceId).toBe(wrongChoice.id);
      expect(record.retrievalId).toBe(correctChoice.id);
      expect(record.retrievalAttemptCount).toBe(2);
      expect(record.retrievalSuccessLevel).toBe(1);
      expect(
        Date.parse(record.retrievalNextDueAt as string) -
          Date.parse(record.retrievalLastAttemptAt as string),
      ).toBe(24 * 60 * 60 * 1_000);
      expect(stored).not.toContain(repairedRecall);
    });
  });

  it("keeps the written-recall gate and privacy boundary explicit in German", async () => {
    const key = getLessonMissionStorageKey(courseSlug, lessonId);
    setOwnedLocalLearningItem(
      key,
      serializeLessonMissionState(
        {
          version: 1,
          predictionId: profile.predictionChoices[0]!.id,
          revealed: true,
          workspaceOpened: true,
          manipulated: true,
          executionReceipt: expectedExecutionReceipt,
          evidenceId: profile.evidence.correctId,
          retrievalId: null,
          retrievalMastered: false,
          retrievalFirstChoiceId: null,
          retrievalAttemptCount: 0,
          retrievalSuccessLevel: 0,
          retrievalLastAttemptAt: null,
          retrievalNextDueAt: null,
          retrievalMisconceptionId: null,
          revisionId: profile.revision.correctId,
          transferId: null,
          collapsed: false,
        },
        null,
      ),
    );

    render(
      <LessonMissionControl
        {...missionProps({
          locale: "de",
          workspaceActive: true,
          executionReceipt: expectedExecutionReceipt,
        })}
      />,
    );

    const recall = await screen.findByRole("textbox", {
      name: "Regel aus dem Gedächtnis",
    });
    expect(recall).toHaveAttribute("minlength", "12");
    expect(recall).toHaveAttribute("maxlength", "280");
    expect(
      screen.getByRole("button", {
        name: "Abruf festlegen und Optionen öffnen",
      }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        /Geschriebene Abrufe und Notizen werden weder gespeichert noch gesendet/,
      ),
    ).toBeVisible();
    for (const choice of profile.retrieval.choices) {
      expect(
        screen.queryByRole("button", {
          name: new RegExp(choice.label.de, "i"),
        }),
      ).not.toBeInTheDocument();
    }
  });

  it("keeps a later project stage inert until the ordered prefix exists", async () => {
    const props = missionProps({ projectStageUnlocked: false });
    render(<LessonMissionControl {...props} />);

    expect(
      await screen.findByText(/project phase is locked/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Target leakage/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /Manipulate/ })).toBeDisabled();
    expect(props.onOpenWorkspace).not.toHaveBeenCalled();
    expect(props.onMissionComplete).not.toHaveBeenCalled();
  });

  it("explains the unresolved local owner without claiming the stage is locked", async () => {
    setUnknownLearningOwner();
    render(<LessonMissionControl {...missionProps()} />);

    expect(
      await screen.findByText(/activate local learning before/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/project phase is locked/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Target leakage/ }),
    ).toBeDisabled();
  });

  it("localizes the course-specific instrument and exposes a collapsible region", async () => {
    render(<LessonMissionControl {...missionProps({ locale: "de" })} />);

    expect(await screen.findByText(/Experiment-Prüffeld/)).toBeInTheDocument();
    const collapse = screen.getByRole("button", {
      name: "Signalstrecke einklappen",
    });
    const controlledBody = document.getElementById(
      collapse.getAttribute("aria-controls") ?? "missing",
    );
    expect(controlledBody).not.toBeNull();
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(collapse);
    expect(
      screen.getByRole("button", { name: "Signalstrecke ausklappen" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(controlledBody).toBeInTheDocument();
    expect(controlledBody).toHaveAttribute("hidden");
  });

  it("does not create a visit key and reset leaves no durable key", async () => {
    const props = missionProps();
    render(<LessonMissionControl {...props} />);
    const key = getLessonMissionStorageKey(courseSlug, lessonId);

    await screen.findByRole("button", { name: /Commit prediction/ });
    expect(window.localStorage.getItem(key)).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: /Target leakage/ }));
    await waitFor(() =>
      expect(window.localStorage.getItem(key)).not.toBeNull(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Reset lesson mission" }),
    );
    await waitFor(() => expect(window.localStorage.getItem(key)).toBeNull());
    expect(props.onMissionReset).toHaveBeenCalledTimes(1);
    expect(props.onRetrievalScheduleChange).toHaveBeenCalledTimes(1);
  });

  it("preserves the mission and receipt when durable reset removal is denied", async () => {
    const { props, view } = await renderAtRetrieval();
    const key = getLessonMissionStorageKey(courseSlug, lessonId);
    const retrieval = profile.retrieval.choices.find(
      (choice) => choice.id === profile.retrieval.correctId,
    )!;
    fireEvent.change(
      screen.getByRole("textbox", { name: "Rule from memory" }),
      {
        target: {
          value: "The final holdout stays untouched until final evaluation.",
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
        name: new RegExp(retrieval.label.en, "i"),
      }),
    );
    await waitFor(() => expect(getOwnedLocalLearningItem(key)).not.toBeNull());
    const prior = getOwnedLocalLearningItem(key);
    const priorScheduleChanges =
      props.onRetrievalScheduleChange.mock.calls.length;
    const removeItem = vi
      .spyOn(window.localStorage, "removeItem")
      .mockImplementation(() => {
        throw new Error("storage denied");
      });

    fireEvent.click(
      screen.getByRole("button", { name: "Reset lesson mission" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/Reset failed/i);
    expect(getOwnedLocalLearningItem(key)).toBe(prior);
    expect(props.onMissionReset).not.toHaveBeenCalled();
    expect(props.onRetrievalScheduleChange).toHaveBeenCalledTimes(
      priorScheduleChanges,
    );
    expect(
      screen.getByRole("button", { name: /Retrieve: complete/i }),
    ).toBeEnabled();
    removeItem.mockRestore();

    view.unmount();
    render(
      <LessonMissionControl
        {...props}
        workspaceActive
        executionReceipt={expectedExecutionReceipt}
        executionRevision={1}
      />,
    );
    expect(
      await screen.findByRole("button", { name: /Retrieve: complete/i }),
    ).toBeEnabled();
  });

  it("does not report completion when the completed mission write is denied", async () => {
    const { props } = await renderAtRetrieval();
    const retrieval = profile.retrieval.choices.find(
      (choice) => choice.id === profile.retrieval.correctId,
    )!;
    fireEvent.change(
      screen.getByRole("textbox", { name: "Rule from memory" }),
      {
        target: {
          value: "The final holdout stays untouched until final evaluation.",
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
        name: new RegExp(retrieval.label.en, "i"),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));
    const setItem = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("storage denied");
      });

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(
          profile.transfer.choices.find(
            (choice) => choice.id === profile.transfer.correctId,
          )!.label.en,
          "i",
        ),
      }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Transfer: complete/i }),
      ).toBeEnabled(),
    );
    expect(props.onMissionComplete).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("reports completion again after an explicit reset and a fresh run", async () => {
    const { props, view } = await renderAtRetrieval();
    const completeRetrievalAndTransfer = () => {
      fireEvent.change(
        screen.getByRole("textbox", { name: "Rule from memory" }),
        {
          target: {
            value:
              "The final holdout remains untouched until final evaluation.",
          },
        },
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: "Commit recall and open options",
        }),
      );
      const retrieval = profile.retrieval.choices.find(
        (choice) => choice.id === profile.retrieval.correctId,
      )!;
      fireEvent.click(
        screen.getByRole("button", {
          name: new RegExp(retrieval.label.en, "i"),
        }),
      );
      fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));
      const transfer = profile.transfer.choices.find(
        (choice) => choice.id === profile.transfer.correctId,
      )!;
      fireEvent.click(
        screen.getByRole("button", {
          name: new RegExp(transfer.label.en, "i"),
        }),
      );
    };

    completeRetrievalAndTransfer();
    await waitFor(() =>
      expect(props.onMissionComplete).toHaveBeenCalledTimes(1),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Reset lesson mission" }),
    );

    fireEvent.click(screen.getByRole("radio", { name: /Target leakage/ }));
    fireEvent.click(screen.getByRole("button", { name: /Commit prediction/ }));
    fireEvent.click(screen.getByRole("button", { name: /Manipulate/ }));
    view.rerender(
      <LessonMissionControl
        {...props}
        workspaceActive
        instrumentRevision={2}
        executionReceipt={expectedExecutionReceipt}
        executionRevision={1}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Run/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Run/ }));
    view.rerender(
      <LessonMissionControl
        {...props}
        workspaceActive
        instrumentRevision={2}
        executionReceipt={expectedExecutionReceipt}
        executionRevision={2}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Inspect/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Inspect/ }));
    const evidence = profile.evidence.choices.find(
      (choice) => choice.id === profile.evidence.correctId,
    )!;
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(evidence.label.en, "i"),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));
    const revision = profile.revision.choices.find(
      (choice) => choice.id === profile.revision.correctId,
    )!;
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(revision.label.en, "i"),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Next signal/ }));
    completeRetrievalAndTransfer();

    await waitFor(() =>
      expect(props.onMissionComplete).toHaveBeenCalledTimes(2),
    );
  });

  it("drops mission and scratch state on an in-place account transition", async () => {
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
    const key = getLessonMissionStorageKey(courseSlug, lessonId);
    setOwnedLocalLearningItem(
      key,
      serializeLessonMissionState(
        {
          version: 1,
          predictionId: profile.predictionChoices[0]!.id,
          revealed: true,
          workspaceOpened: true,
          manipulated: true,
          executionReceipt: expectedExecutionReceipt,
          evidenceId: profile.evidence.correctId,
          retrievalId: null,
          retrievalMastered: false,
          retrievalFirstChoiceId: null,
          retrievalAttemptCount: 0,
          retrievalSuccessLevel: 0,
          retrievalLastAttemptAt: null,
          retrievalNextDueAt: null,
          retrievalMisconceptionId: null,
          revisionId: null,
          transferId: null,
          collapsed: false,
        },
        null,
      ),
    );

    render(
      <LessonMissionControl
        {...missionProps({
          workspaceActive: true,
          executionReceipt: expectedExecutionReceipt,
        })}
      />,
    );
    const scratch = await screen.findByRole("textbox", {
      name: "Temporary revision note",
    });
    fireEvent.change(scratch, {
      target: { value: "account-a-private-scratch" },
    });
    expect(screen.getByDisplayValue("account-a-private-scratch")).toBeVisible();

    act(() => {
      expect(activateAccountLearningOwner("account-b").kind).toBe("account");
    });
    await waitFor(() =>
      expect(
        screen.queryByDisplayValue("account-a-private-scratch"),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Manipulate/ })).toBeDisabled();
    expect(getOwnedLocalLearningItem(key)).toBeNull();
  });

  it("keeps all seven step targets in a bounded responsive grid", async () => {
    render(<LessonMissionControl {...missionProps({ locale: "de" })} />);

    const circuit = await screen.findByRole("list", { name: "Signalstrecke" });
    expect(circuit).toHaveClass("grid", "grid-cols-4", "lg:grid-cols-7");
    expect(circuit).not.toHaveClass("overflow-x-auto");
    expect(circuit).not.toHaveAttribute("tabindex");
    expect(circuit).not.toHaveAttribute("style");
    const targets = within(circuit).getAllByRole("button");
    expect(targets).toHaveLength(7);
    for (const target of targets) {
      expect(target).toHaveClass(
        "min-h-16",
        "flex-col",
        "lg:min-h-11",
        "lg:flex-row",
        "motion-reduce:transition-none",
      );
      expect(target.closest("li")).toHaveClass("min-w-0");
      expect(target.querySelector("span:last-child")).toHaveClass(
        "max-w-full",
        "[overflow-wrap:anywhere]",
      );
    }
  });
});
