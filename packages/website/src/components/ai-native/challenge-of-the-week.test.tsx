/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react";

/**
 * challenge-of-the-week.test.tsx (regression coverage)
 *
 * Drives the REAL exported <AiNativeChallengeOfTheWeek />. The pure ISO-week
 * resolver lives in `@/lib/ai-native/challenges`; here we feed the component a
 * fixed challenge (7-item rubric, weekOffset 3) and a fixed week label so the
 * assertions target the COMPONENT's own logic: the reveal state machine, the
 * `solved.filter(Boolean).length` rubric score with its `>= 5 -> PASS` gate, the
 * padded rubric indices, the char counter, the analytics event payloads, and
 * the sessionStorage draft round-trip keyed on `challenge.weekOffset`.
 *
 * framer-motion is mocked to plain elements (AnimatePresence renders children
 * eagerly) and the analytics transport is a spy so we can assert the exact
 * emitted event shape without any real I/O.
 */

const CHALLENGE = {
  weekOffset: 3,
  role: "Vertriebsleiter Maschinenbau",
  scenario:
    "Du priorisierst zwölf offene Angebote für einen Großkunden vor dem Quartalsende.",
  stack: ["Claude", "Excel", "n8n"],
  timeBudget: "45 min",
  modelSolution:
    "Schritt 1: Kontext bündeln.\nSchritt 2: Prompt mit Kriterien bauen.",
  rubric: [
    "Kriterium Alpha",
    "Kriterium Beta",
    "Kriterium Gamma",
    "Kriterium Delta",
    "Kriterium Epsilon",
    "Kriterium Zeta",
    "Kriterium Eta",
  ],
};
const WEEK_ISO = "2026-W29";
const STORAGE_KEY = `ai-native-challenge-draft-${CHALLENGE.weekOffset}`;

vi.mock("@/lib/ai-native/challenges", () => ({
  getChallengeForDate: () => CHALLENGE,
  formatWeekIso: () => WEEK_ISO,
}));

vi.mock("@/lib/ai-native/analytics", () => ({
  trackEvent: vi.fn(),
  recordForDebug: vi.fn(),
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const cache = new Map<string, React.ElementType>();
  const make = (tag: any): React.ElementType => {
    const cacheable = typeof tag === "string";
    if (cacheable && cache.has(tag)) return cache.get(tag)!;
    const Comp = React.forwardRef(function MotionMock(props: any, ref: any) {
      const {
        initial,
        animate,
        exit,
        transition,
        variants,
        whileHover,
        whileTap,
        whileFocus,
        whileInView,
        whileDrag,
        drag,
        dragConstraints,
        dragElastic,
        dragMomentum,
        layout,
        layoutId,
        custom,
        viewport,
        onAnimationStart,
        onAnimationComplete,
        onUpdate,
        children,
        ...rest
      } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
    if (cacheable) cache.set(tag, Comp);
    return Comp;
  };
  const m: any = new Proxy(
    { create: (tag: any) => make(tag) },
    {
      get(target, prop) {
        if (prop === "create") return (target as any).create;
        if (typeof prop === "symbol") return undefined;
        return make(prop as string);
      },
    },
  );
  return {
    __esModule: true,
    m,
    motion: m,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    MotionConfig: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    LazyMotion: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    domAnimation: {},
    useReducedMotion: () => true,
    useInView: () => false,
    useMotionValue: (v: any) => ({ set: () => {}, get: () => v, on: () => () => {} }),
    useSpring: (v: any) => ({ set: () => {}, get: () => v, on: () => () => {} }),
    useTransform: () => ({ set: () => {}, get: () => 0, on: () => () => {} }),
  };
});

import { AiNativeChallengeOfTheWeek } from "./challenge-of-the-week";
import { trackEvent, recordForDebug } from "@/lib/ai-native/analytics";

function revealModel(): HTMLElement {
  const btn = screen.getByRole("button", { name: "Modell-Lösung enthüllen" });
  fireEvent.click(btn);
  return btn;
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("<AiNativeChallengeOfTheWeek> mounted challenge card", () => {
  it("renders the resolved week label and the challenge scenario", () => {
    render(<AiNativeChallengeOfTheWeek />);
    expect(screen.getByText(`AI Challenge · ${WEEK_ISO}`)).toBeInTheDocument();
    expect(screen.getByText(`Diese Woche · ${WEEK_ISO}`)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3 }),
    ).toHaveTextContent(CHALLENGE.role);
    expect(screen.getByText(CHALLENGE.scenario)).toBeInTheDocument();
    expect(screen.getByText(CHALLENGE.timeBudget)).toBeInTheDocument();
  });

  it("renders every tool in the challenge stack", () => {
    render(<AiNativeChallengeOfTheWeek />);
    CHALLENGE.stack.forEach((tool) => {
      expect(screen.getByText(tool)).toBeInTheDocument();
    });
  });

  it("keeps the model solution and rubric hidden until a reveal", () => {
    render(<AiNativeChallengeOfTheWeek />);
    expect(screen.queryByText(/Schritt 1: Kontext bündeln/)).toBeNull();
    expect(screen.queryByLabelText("Kriterium 1")).toBeNull();
  });
});

describe("<AiNativeChallengeOfTheWeek> composer", () => {
  it("reflects the draft length in the live counter", () => {
    render(<AiNativeChallengeOfTheWeek />);
    const textarea = screen.getByLabelText("Dein Vorgehen");
    expect(textarea).toHaveValue("");
    expect(screen.getByText("0 / 4000")).toBeInTheDocument();
    expect(textarea).toHaveAttribute("maxlength", "4000");

    fireEvent.change(textarea, { target: { value: "abc" } });

    expect(textarea).toHaveValue("abc");
    expect(screen.getByText("3 / 4000")).toBeInTheDocument();
  });

  it("hydrates the draft from sessionStorage on mount", () => {
    sessionStorage.setItem(STORAGE_KEY, "vorbefuellter Entwurf");
    render(<AiNativeChallengeOfTheWeek />);
    expect(screen.getByLabelText("Dein Vorgehen")).toHaveValue(
      "vorbefuellter Entwurf",
    );
  });

  it("persists the draft to the weekOffset-keyed slot on blur", () => {
    render(<AiNativeChallengeOfTheWeek />);
    const textarea = screen.getByLabelText("Dein Vorgehen");

    fireEvent.change(textarea, { target: { value: "mein Vorgehen" } });
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull(); // not saved yet

    fireEvent.blur(textarea);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("mein Vorgehen");
  });
});

describe("<AiNativeChallengeOfTheWeek> reveal state machine", () => {
  it("reveals the model solution, disables its trigger and emits analytics", () => {
    render(<AiNativeChallengeOfTheWeek />);
    const btn = revealModel();

    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Modell-Lösung enthüllt");
    expect(screen.getByText(/Schritt 1: Kontext bündeln/)).toBeInTheDocument();

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith({
      name: "ai_native_challenge_reveal",
      props: { weekIso: WEEK_ISO, revealType: "model_solution" },
    });
    expect(recordForDebug).toHaveBeenCalledWith({
      name: "ai_native_challenge_reveal",
      props: { weekIso: WEEK_ISO, revealType: "model_solution" },
    });
  });

  it("does not re-emit when the disabled model trigger is clicked again", () => {
    render(<AiNativeChallengeOfTheWeek />);
    const btn = revealModel();
    fireEvent.click(btn); // now disabled -> no-op

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("opens the rubric via its own trigger with a 'rubric' event and leaves the model trigger active", () => {
    render(<AiNativeChallengeOfTheWeek />);

    fireEvent.click(screen.getByRole("button", { name: "7-Punkte-Rubrik öffnen" }));

    // Same panel is shown, but the model trigger stays enabled/idle.
    const modelBtn = screen.getByRole("button", {
      name: "Modell-Lösung enthüllen",
    });
    expect(modelBtn).not.toBeDisabled();
    expect(screen.getByLabelText("Kriterium 1")).toBeInTheDocument();

    expect(trackEvent).toHaveBeenCalledWith({
      name: "ai_native_challenge_reveal",
      props: { weekIso: WEEK_ISO, revealType: "rubric" },
    });
  });
});

describe("<AiNativeChallengeOfTheWeek> rubric scoring", () => {
  it("starts at 0/7 in the REVIEW band with padded criterion numbers", () => {
    render(<AiNativeChallengeOfTheWeek />);
    revealModel();

    expect(screen.getByText("Selbst-Bewertung · 0/7")).toBeInTheDocument();
    expect(screen.getByText("REVIEW")).toBeInTheDocument();
    expect(screen.queryByText("PASS")).toBeNull();
    // Criterion indices are zero-padded 01..07.
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("07")).toBeInTheDocument();
  });

  it("crosses into PASS once five of seven criteria are checked", () => {
    render(<AiNativeChallengeOfTheWeek />);
    revealModel();

    for (let i = 1; i <= 5; i++) {
      fireEvent.click(screen.getByLabelText(`Kriterium ${i}`));
    }

    expect(screen.getByText("Selbst-Bewertung · 5/7")).toBeInTheDocument();
    expect(screen.getByText("PASS")).toBeInTheDocument();
  });

  it("drops back to REVIEW when a checked criterion is toggled off", () => {
    render(<AiNativeChallengeOfTheWeek />);
    revealModel();

    for (let i = 1; i <= 5; i++) {
      fireEvent.click(screen.getByLabelText(`Kriterium ${i}`));
    }
    // Untick one -> 4/7 -> back below the PASS threshold.
    fireEvent.click(screen.getByLabelText("Kriterium 5"));

    expect(screen.getByText("Selbst-Bewertung · 4/7")).toBeInTheDocument();
    expect(screen.getByText("REVIEW")).toBeInTheDocument();
    expect(screen.queryByText("PASS")).toBeNull();
  });
});
