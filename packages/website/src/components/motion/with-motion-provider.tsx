"use client";

import type { ComponentType, ReactElement } from "react";
import { MotionProvider } from "@/components/motion-provider";

/** Scope Framer's lazy feature bundle to one concrete client component tree. */
export function withMotionProvider<Props extends object>(
  Component: ComponentType<Props>,
): (props: Props) => ReactElement {
  function ScopedMotionComponent(props: Props): ReactElement {
    return (
      <MotionProvider>
        <Component {...props} />
      </MotionProvider>
    );
  }

  ScopedMotionComponent.displayName = `withMotionProvider(${Component.displayName ?? Component.name ?? "Component"})`;
  return ScopedMotionComponent;
}
