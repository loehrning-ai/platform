// Augment vitest 4's `@vitest/expect` Matchers interface with
// @testing-library/jest-dom matchers.
//
// jest-dom v6 only ships an augmentation for the `vitest` module, but vitest 4
// moved the Matchers/Assertion interfaces into `@vitest/expect`, so the bundled
// types no longer take effect. The empty `import type` makes this file a module,
// so `declare module` merges with the upstream types instead of replacing them.

import type {} from "@vitest/expect";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "@vitest/expect" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Matchers<T = any> extends TestingLibraryMatchers<unknown, T> {}
}
