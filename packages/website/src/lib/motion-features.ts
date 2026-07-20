// ─── Scoped domMax feature bundle (performance hardening) ──
//
// The root MotionProvider loads only `domAnimation` (no drag/layout/pan), which
// keeps the projection engine out of the shared First Load JS. The few spots
// that genuinely need layout animations load this bundle through their own
// nested <LazyMotion features={loadDomMax}> instead — it arrives as a small
// async chunk after hydration and never blocks first paint.
//
// Default export so consumers can `import("@/lib/motion-features").then((mod) => mod.default)`,
// the exact pattern recommended by the framer-motion LazyMotion docs.

import { domMax } from "framer-motion";

export default domMax;
