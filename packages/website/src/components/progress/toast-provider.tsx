"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { type JSX, useEffect, useState } from "react";
import { isProgressUiRoute } from "@/lib/progress/learning-route-policy";

const ProgressToastRuntime = dynamic(
  () =>
    import("@/components/progress/toast-provider-runtime").then(
      (mod) => mod.ProgressToastRuntime,
    ),
  { ssr: false },
);

/**
 * The root layout keeps this cheap route gate mounted globally. The store,
 * badge catalog, icons, and projection animation load only on learning routes.
 */
export function ProgressToastProvider(): JSX.Element | null {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && isProgressUiRoute(pathname) ? (
    <ProgressToastRuntime />
  ) : null;
}
