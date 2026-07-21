// next/font/google relies on a Next.js-specific build transform that Vitest
// (@vitejs/plugin-react) doesn't apply, so the real import isn't callable
// here. Stub matches the shape consumers read (.className/.style/.variable),
// plus echoes the raw options object back under `__mockOptions` so tests can
// assert the real weight/style matrix a course requested (e.g.
// lib/data-science/fonts.test.ts) without needing a real Next.js build.

interface MockFontOptions {
  readonly weight?: string | readonly string[];
  readonly style?: string | readonly string[];
  readonly [key: string]: unknown;
}

interface MockFont {
  readonly className: string;
  readonly style: { readonly fontFamily: string };
  readonly variable: string;
  readonly __mockOptions: MockFontOptions;
}

function mockFont(slug: string, family: string) {
  return function (options: MockFontOptions = {}): MockFont {
    return {
      className: `mock-font-${slug}`,
      style: { fontFamily: family },
      variable: `--mock-font-${slug}`,
      __mockOptions: options,
    };
  };
}

export const Inter = mockFont("inter", "Inter");
export const Instrument_Serif = mockFont("instrument-serif", "Instrument Serif");
export const JetBrains_Mono = mockFont("jetbrains-mono", "JetBrains Mono");
