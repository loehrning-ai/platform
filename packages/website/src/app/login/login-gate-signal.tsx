"use client";

import { useEffect, useRef } from "react";
import {
  loginGateReasonFromParam,
  trackLoginGate,
} from "@/lib/analytics/events";
import type { AnalyticsLoginAvailability } from "@/lib/analytics/registry";

/**
 * Reports once that the login page explained why sign-in is needed, and what
 * it could offer at that moment. Renders nothing.
 *
 * The `reason` query parameter is attacker-controllable input. It is mapped
 * onto the closed reason vocabulary (unknown values become `fallback`) before
 * anything is reported; the raw value is never forwarded.
 */
export function LoginGateSignal({
  reason,
  loginAvailability,
}: {
  readonly reason: string;
  readonly loginAvailability: AnalyticsLoginAvailability;
}) {
  const gateReason = loginGateReasonFromParam(reason);
  const reported = useRef<string | null>(null);

  useEffect(() => {
    const key = `${gateReason}:${loginAvailability}`;
    if (reported.current === key) return;
    reported.current = key;
    trackLoginGate(gateReason, loginAvailability);
  }, [gateReason, loginAvailability]);

  return null;
}
