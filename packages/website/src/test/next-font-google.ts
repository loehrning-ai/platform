// next/font/google relies on a Next.js-specific build transform that Vitest
// (@vitejs/plugin-react) doesn't apply, so the real import isn't callable
// here. Stub matches the shape consumers read (.className/.style/.variable).
export function Inter() {
  return { className: "", style: { fontFamily: "Inter" }, variable: "" };
}
