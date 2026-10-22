import {
  goalReached,
  initialState,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/core";
import type {
  DialState,
  FridayNumber,
  Light,
  SceneId,
  SceneResult,
  Vote,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";

/** What the store needs of a scene; the localized scenes of W05Text fit. */
export type StoreScene = Parameters<typeof goalReached>[0];

/*
 * The island's state: which scene is open, what the learner committed per
 * scene, where the dials stand, and the Friday votes. Pure and immutable, so
 * the reducer is tested on its own. Field values live elsewhere: "Von vorn"
 * resets this state, never what the learner typed.
 */

export interface SceneRun {
  readonly picked: Light | null;
  readonly dial: DialState;
  /** The goal was reached at least once ("Ausprobiert: ja"). */
  readonly tried: boolean;
}

export interface DemoState {
  readonly current: SceneId;
  readonly runs: Readonly<Record<SceneId, SceneRun>>;
  readonly votes: Readonly<Partial<Record<FridayNumber, Vote>>>;
}

export type DemoAction =
  | { readonly type: "select"; readonly id: SceneId }
  | { readonly type: "commit"; readonly id: SceneId; readonly light: Light }
  | { readonly type: "dial"; readonly id: SceneId; readonly dial: DialState }
  | { readonly type: "vote"; readonly n: FridayNumber; readonly vote: Vote }
  | { readonly type: "reset" };

export function initialDemoState(scenes: readonly StoreScene[]): DemoState {
  const runs = Object.fromEntries(
    scenes.map((scene) => [scene.id, { picked: null, dial: initialState(scene), tried: false }]),
  ) as Record<SceneId, SceneRun>;
  return { current: "ana", runs, votes: {} };
}

function withRun(state: DemoState, id: SceneId, run: SceneRun): DemoState {
  return { ...state, runs: { ...state.runs, [id]: run } };
}

function sceneOf(scenes: readonly StoreScene[], id: SceneId): StoreScene {
  const scene = scenes.find((entry) => entry.id === id);
  if (!scene) throw new Error(`Unknown scene ${id}`);
  return scene;
}

/** The reducer for one set of scenes (kit order). */
export function createDemoReducer(scenes: readonly StoreScene[]) {
  return function demoReducer(state: DemoState, action: DemoAction): DemoState {
    switch (action.type) {
      case "select":
        return state.current === action.id ? state : { ...state, current: action.id };
      case "commit": {
        const run = state.runs[action.id];
        if (run.picked !== null) return state;
        return withRun(state, action.id, { ...run, picked: action.light });
      }
      case "dial": {
        const run = state.runs[action.id];
        if (run.picked === null) return state;
        const reached = goalReached(sceneOf(scenes, action.id), action.dial);
        return withRun(state, action.id, { ...run, dial: action.dial, tried: run.tried || reached });
      }
      case "vote":
        if (state.votes[action.n]) return state;
        return { ...state, votes: { ...state.votes, [action.n]: action.vote } };
      case "reset":
        return initialDemoState(scenes);
    }
  };
}

/** The committed scenes, in kit order. */
export function resultsOf(state: DemoState, scenes: readonly StoreScene[]): SceneResult[] {
  return scenes.flatMap((scene) => {
    const run = state.runs[scene.id];
    return run.picked === null ? [] : [{ id: scene.id, picked: run.picked, tried: run.tried }];
  });
}

export function nextSceneId(scenes: readonly StoreScene[], id: SceneId): SceneId | null {
  const index = scenes.findIndex((scene) => scene.id === id);
  return scenes[index + 1]?.id ?? null;
}

export function isSceneId(scenes: readonly StoreScene[], value: string): value is SceneId {
  return scenes.some((scene) => scene.id === value);
}
