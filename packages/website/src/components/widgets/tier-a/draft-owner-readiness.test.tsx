import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetCacheForTests,
  activateUnknownProgress,
  continueWithAnonymousProgress,
  isCheckpointDone,
} from "@/lib/progress/store";
import { MatrixGridWidget } from "./matrix-grid";
import { PlaysWidget } from "./plays";
import { SelfRateWidget } from "./self-rate";
import { SlotFillWidget } from "./slot-fill";

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
  activateUnknownProgress();
});

afterEach(() => {
  cleanup();
});

describe("owner-aware draft widget affordances", () => {
  it("disables every direct draft control until an owner is resolved", async () => {
    render(
      <>
        <MatrixGridWidget
          lessonId="matrix-owner"
          cpId="exercise"
          rows={["Matrix row"]}
          cols={["Matrix choice"]}
        />
        <PlaysWidget
          lessonId="plays-owner"
          cpId="exercise"
          options={["Play choice"]}
        />
        <SelfRateWidget
          lessonId="rate-owner"
          cpId="exercise"
          axes={[
            {
              id: "axis",
              label: "Rate axis",
              anchors: ["Rate choice"],
            },
          ]}
        />
        <SlotFillWidget
          lessonId="slots-owner"
          cpId="exercise"
          placeholders={["Slot choice"]}
        />
      </>,
    );

    const matrix = screen.getByRole("radio", {
      name: "Matrix row, Matrix choice",
    });
    const play = screen.getByRole("button", { name: /Play choice/ });
    const rating = screen.getByRole("radio", { name: "Rate choice" });
    const slot = screen.getByRole("textbox", { name: "Slot choice" });

    for (const control of [matrix, play, rating, slot]) {
      expect(control).toBeDisabled();
    }

    fireEvent.click(matrix);
    fireEvent.click(play);
    fireEvent.click(rating);
    fireEvent.change(slot, { target: { value: "Unowned value" } });
    for (const lessonId of [
      "matrix-owner",
      "plays-owner",
      "rate-owner",
      "slots-owner",
    ]) {
      expect(isCheckpointDone(lessonId, "exercise")).toBe(false);
    }

    act(() => {
      continueWithAnonymousProgress();
    });
    await waitFor(() => {
      for (const control of [matrix, play, rating, slot]) {
        expect(control).not.toBeDisabled();
      }
    });

    fireEvent.click(matrix);
    fireEvent.click(play);
    fireEvent.click(rating);
    fireEvent.change(slot, { target: { value: "Owned value" } });
    await waitFor(() => {
      for (const lessonId of [
        "matrix-owner",
        "plays-owner",
        "rate-owner",
        "slots-owner",
      ]) {
        expect(isCheckpointDone(lessonId, "exercise")).toBe(true);
      }
    });
  });
});
