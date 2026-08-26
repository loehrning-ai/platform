import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetLearningOwnerForTests,
  activateAnonymousLearningOwner,
  setUnknownLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import {
  persistForActiveLearningOwner,
  useOwnerAwareProgressReadiness,
} from "./owner-aware-progress";

function ReadinessProbe({
  loadedGeneration,
}: {
  readonly loadedGeneration: number | null;
}) {
  const readiness = useOwnerAwareProgressReadiness(
    "course:lesson",
    "course:lesson",
    loadedGeneration,
  );
  return (
    <output
      data-hydrated={readiness.hydrated}
      data-owner-ready={readiness.ownerReady}
      data-interaction-ready={readiness.interactionReady}
      data-checkpoint-key={readiness.checkpointKey}
    />
  );
}

beforeEach(() => {
  __resetLearningOwnerForTests("unknown");
});

describe("owner-aware progress fence", () => {
  it("keeps an unresolved owner non-interactive even after a snapshot loads", () => {
    render(<ReadinessProbe loadedGeneration={0} />);
    const probe = screen.getByRole("status");

    expect(probe).toHaveAttribute("data-hydrated", "true");
    expect(probe).toHaveAttribute("data-owner-ready", "false");
    expect(probe).toHaveAttribute("data-interaction-ready", "false");
  });

  it("invalidates stale progress immediately when the owner generation changes", () => {
    const { rerender } = render(<ReadinessProbe loadedGeneration={0} />);
    const probe = screen.getByRole("status");

    act(() => {
      activateAnonymousLearningOwner();
    });
    expect(probe).toHaveAttribute("data-hydrated", "false");
    expect(probe).toHaveAttribute("data-interaction-ready", "false");
    expect(probe).toHaveAttribute("data-checkpoint-key", "course:lesson:1");

    rerender(<ReadinessProbe loadedGeneration={1} />);
    expect(probe).toHaveAttribute("data-hydrated", "true");
    expect(probe).toHaveAttribute("data-interaction-ready", "true");
  });

  it("rejects unresolved and cross-generation mutation results", () => {
    expect(
      persistForActiveLearningOwner(
        () => undefined,
        () => true,
      ),
    ).toBe(false);

    activateAnonymousLearningOwner();
    expect(
      persistForActiveLearningOwner(
        () => setUnknownLearningOwner(),
        () => true,
      ),
    ).toBe(false);
  });
});
