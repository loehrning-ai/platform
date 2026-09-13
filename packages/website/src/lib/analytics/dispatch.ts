/**
 * The only module permitted to import the Vercel Web Analytics event API
 * (enforced by no-restricted-imports in eslint.config.mjs and by the source
 * scan in contract.test.ts).
 *
 * An event is sent only when its name is declared in the registry, and it
 * carries only `subject` / `facet` values that are declared members of that
 * event's vocabulary. Everything else is dropped here, so a caller that casts
 * around the typed helpers still cannot put an identifier on the wire. The
 * helpers that are not in the registry therefore never dispatch.
 *
 * The whole body is wrapped in try/catch: call sites run inside click handlers
 * and effects without their own error handling, and a throw there would become
 * an uncaught page error.
 */
import { track as sendVercelEvent } from "@vercel/analytics";
import {
  ANALYTICS_EVENTS,
  ANALYTICS_PROP_KEYS,
  SAFE_VALUE,
  isAnalyticsEventName,
  type AnalyticsPropKey,
} from "./registry";

const UUID_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_PROPERTIES = 2;

export type DispatchProps = Readonly<Record<string, unknown>>;

type CleanProps = Readonly<Partial<Record<AnalyticsPropKey, string>>>;

function reportDropped(event: string, key: string): void {
  if (process.env.NODE_ENV !== "development") return;
  // Key names only: a rejected value may be exactly what must not be logged.
  console.warn("[analytics] dropped property", event, key);
}

function isDeclaredValue(
  value: unknown,
  vocabulary: readonly string[] | undefined,
): value is string {
  return (
    typeof value === "string" &&
    SAFE_VALUE.test(value) &&
    !UUID_SHAPE.test(value) &&
    vocabulary !== undefined &&
    vocabulary.includes(value)
  );
}

function sanitizeProps(
  event: keyof typeof ANALYTICS_EVENTS,
  props: DispatchProps | undefined,
): CleanProps {
  if (!props) return {};
  const vocabulary: {
    readonly subject: readonly string[];
    readonly facet?: readonly string[];
  } = ANALYTICS_EVENTS[event];

  for (const key of Object.keys(props)) {
    if (!(ANALYTICS_PROP_KEYS as readonly string[]).includes(key)) {
      reportDropped(event, key);
    }
  }

  const accepted = ANALYTICS_PROP_KEYS.flatMap(
    (key): readonly (readonly [AnalyticsPropKey, string])[] => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) return [];
      const value = props[key];
      if (isDeclaredValue(value, vocabulary[key])) return [[key, value]];
      reportDropped(event, key);
      return [];
    },
  );

  return Object.fromEntries(accepted.slice(0, MAX_PROPERTIES)) as CleanProps;
}

export function dispatchTrackedEvent(
  event: string,
  props?: DispatchProps,
): void {
  try {
    if (!isAnalyticsEventName(event)) return;
    sendVercelEvent(event, { ...sanitizeProps(event, props) });
  } catch {
    // Measurement must never break the page it measures.
  }
}
