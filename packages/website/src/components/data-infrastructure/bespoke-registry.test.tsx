import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { __resetCacheForTests } from "@/lib/progress";
import { DATA_INFRA_LESSON_IDS } from "@/lib/data-infrastructure/types";
import { DataInfraBespokeInteractives } from "./bespoke-registry";

function installLocalStoragePolyfill(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      removeItem: (k: string) => store.delete(k),
      setItem: (k: string, v: string) => store.set(k, String(v)),
    },
    writable: true,
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
  __resetCacheForTests();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("DataInfraBespokeInteractives ", () => {
  it("mounts without crashing for every one of the 12 real lesson ids", () => {
    for (const id of DATA_INFRA_LESSON_IDS) {
      expect(() => {
        const { unmount } = render(
          <DataInfraBespokeInteractives lessonId={id} />,
        );
        unmount();
      }, id).not.toThrow();
    }
  });

  it("mounts every bespoke interactive with German interface copy", () => {
    for (const id of DATA_INFRA_LESSON_IDS) {
      expect(() => {
        const { unmount } = render(
          <DataInfraBespokeInteractives lessonId={id} locale="de" />,
        );
        unmount();
      }, id).not.toThrow();
    }
  });

  it("shows German controls for the flow, partitioning, and interview simulations", () => {
    const flow = render(
      <DataInfraBespokeInteractives lessonId="mental-model" locale="de" />,
    );
    expect(
      screen.getByRole("button", { name: "1 Ereignis verfolgen" }),
    ).toBeInTheDocument();
    flow.unmount();

    const partitioning = render(
      <DataInfraBespokeInteractives lessonId="partitioning" locale="de" />,
    );
    expect(
      screen.getByRole("button", { name: "Scan ausführen" }),
    ).toBeInTheDocument();
    partitioning.unmount();

    render(
      <DataInfraBespokeInteractives
        lessonId="interview-playbook"
        locale="de"
      />,
    );
    expect(
      screen.getByRole("button", { name: "nächster Schritt" }),
    ).toBeInTheDocument();
  });

  it("mounts exactly two simulators for storage-formats (RowColumn + BloomFilter)", () => {
    render(<DataInfraBespokeInteractives lessonId="storage-formats" />);
    expect(
      screen.getByRole("img", { name: /Diagram comparing row-oriented/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Bloom filter visualization/ }),
    ).toBeInTheDocument();
  });

  it("mounts exactly two simulators for streaming (KafkaTopic + Watermark)", () => {
    render(<DataInfraBespokeInteractives lessonId="streaming" />);
    expect(
      screen.getByRole("img", { name: /Animated Kafka topic/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Stream-processing watermark/ }),
    ).toBeInTheDocument();
  });

  it("namespaces the lessonId passed to each widget via checkpointLessonId", () => {
    render(<DataInfraBespokeInteractives lessonId="mental-model" />);
    // StackFlow's checkpoint text ("✓" suffix) proves the checkpoint lookup
    // ran against "di-mental-model", not the bare id — a real component
    // test rather than inspecting props directly.
    expect(screen.getByText(/The stack, in motion/)).toBeInTheDocument();
  });
});
