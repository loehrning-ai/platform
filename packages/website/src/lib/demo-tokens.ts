/**
 * Shared design tokens for all demo dashboard components.
 * Werkzeichnung: Kalkweiß ground, ink lines, one Mennige accent, square
 * geometry. Accent fills are gone (selection is ink fill or an outline), and
 * labels are sentence case in the sans face; mono is kept for data only.
 */
export const DEMO = {
  // Text colors (dark on light)
  text: {
    primary: "rgba(11,9,8,0.85)",
    secondary: "rgba(11,9,8,0.5)",
    muted: "rgba(11,9,8,0.35)",
    accent: "var(--color-brand-orange)",
    accentSoft: "var(--color-brand-sand)",
  },
  stroke: {
    active: "rgba(11,9,8,0.15)",
    faint: "rgba(11,9,8,0.06)",
    highlight: "var(--color-brand-orange)",
    highlightSoft: "var(--color-brand-sand)",
  },
  fill: {
    node: "rgba(11,9,8,0.03)",
    nodeHover: "rgba(11,9,8,0.06)",
    // Retired tints: a selection is an outline or an ink fill, not a wash.
    accent: "transparent",
    accentStrong: "transparent",
    danger: "rgba(239,68,68,0.08)",
  },
  timing: {
    fast: 0.2,
    standard: 0.4,
    slow: 0.8,
    stagger: 0.08,
  },
  font: {
    sans: "var(--font-loehrning-sans)",
    mono: "var(--font-geist-mono)",
    label: 11,
    sublabel: 10,
    tick: 10,
    score: 20,
  },

  /**
   * Sentence-case label (design direction 5.2 `label`): replaces the
   * mono-uppercase, 0.1-0.16em tracked kickers inside the engines. Spread it
   * last so it overrides a style object's own font settings; the colour
   * stays the caller's.
   */
  label: {
    fontFamily: "var(--font-loehrning-sans)",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "none",
  },

  // Status colors
  statusGreen: "#22c55e",
  statusAmber: "#eab308",
  statusGray: "#9c8f85",
  statusRed: "#ef4444",
  statusRedOnDark: "#ff8a8a",

  // Auxiliary tones (map prototype's kupferLight/kupferMist/birke/leinen/schiefer/ink
  // onto the existing warm-stone palette, keeping the Berliner Werkzeug vocabulary)
  ink: "#0B0908",
  kalk: "#F3F0E9",
  birke: "#F7F4ED",
  leinen: "#E3DFD6",
  // 0.55 alpha was only ~4.3:1 on the preview surfaces (Kalkweiß/Birke/white),
  // sub-AA for label text. 0.62 reaches >=5.4:1 on all of them.
  schiefer: "rgba(11,9,8,0.62)",
  // Mennige, scope-aware: #b73a15 on paper, #e07050 inside .dark-section.
  kupferLight: "var(--color-brand-orange)",
  kupferMist: "transparent",

  // Dashboard layout tokens (Tailwind class strings)
  container:
    "space-y-0 overflow-hidden rounded-none border border-border/40 bg-white/60",
  header:
    "flex items-center justify-between border-b border-border/30 px-4 py-3",
  headerTitle: "text-sm font-bold tracking-tight text-foreground",
  body: "p-4",
  badge: "rounded-none px-2 py-0.5 font-mono text-xs font-semibold",
  card: "rounded-none border border-border/30 bg-card/20 p-3",
  tabBar: "flex gap-1 border-b border-border/30 px-4 pt-3",
  tab: "rounded-none px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
  tabActive:
    "rounded-none border-b-2 border-brand-orange px-3 py-2 text-xs font-semibold text-brand-orange",
  metric: "font-mono text-lg font-bold text-brand-orange",
  metricLabel: "text-xs text-muted-foreground",

  // Table tokens
  table: {
    header:
      "text-xs font-medium uppercase tracking-wider text-muted-foreground",
    row: "border-b border-border/20",
    cell: "py-2.5 text-sm",
  },

  // Risk badge styles
  risk: {
    high: "bg-destructive/10 text-destructive",
    limited: "bg-brand-amber/10 text-brand-amber",
    minimal: "bg-risk-green/10 text-risk-green",
  },

  // Status badge styles
  status: {
    gaps: "bg-destructive/10 text-destructive",
    inProgress: "bg-brand-amber/10 text-brand-amber",
    compliant: "bg-risk-green/10 text-risk-green",
  },
  // Alert styles
  alert: {
    critical: "border-l-2 border-destructive/40 bg-destructive/5",
    warning: "border-l-2 border-brand-amber/40 bg-brand-amber/5",
  },
} as const;
