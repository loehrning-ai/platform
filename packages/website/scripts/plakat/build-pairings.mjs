#!/usr/bin/env node
/**
 * build-pairings.mjs
 *
 * Writes docs/plakat-pairings.md, the pairing registry of the poster layer:
 * every colour pairing the four Plakat scenes allow, and the ones they
 * forbid, each with its WCAG 2.x contrast ratio. Values are read from
 * src/app/globals.css (the scopes and tokens the browser gets) and
 * src/lib/plakat/palettes.ts (the TypeScript twin used by SVG, OG and static
 * generators), so the registry cannot drift from either.
 *
 * `--check` is non-mutating: it exits 1 when the committed file is stale, and
 * both modes exit 1 when a required pairing misses its floor or the two
 * sources disagree. palettes.test.ts runs `--check`. Regenerate with:
 *   node scripts/plakat/build-pairings.mjs
 *
 * Runs under plain Node (>= 22.18 for the type-stripped palettes.ts import).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const CSS_PATH = join(ROOT, "src", "app", "globals.css");
const OUTPUT_PATH = join(ROOT, "docs", "plakat-pairings.md");
const OUTPUT_LABEL = "docs/plakat-pairings.md";

const { PLAKAT, PLAKAT_KEYS } = await import("../../src/lib/plakat/palettes.ts");

const checkOnly = process.argv.includes("--check");
const unexpectedArgs = process.argv.slice(2).filter((arg) => arg !== "--check");
if (unexpectedArgs.length > 0) {
  console.error(`Unknown argument(s): ${unexpectedArgs.join(", ")}`);
  process.exit(2);
}

// ─── Colour maths (WCAG 2.x luminance, OKLab, Machado 2009 CVD at 1.0) ────

function parseHex(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) throw new Error(`Expected a six-digit hex colour, received ${value}`);
  return [0, 2, 4].map((index) => Number.parseInt(match[1].slice(index, index + 2), 16));
}

function toHex(rgb) {
  return `#${rgb
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function toLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function fromLinear(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return 255 * (clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055);
}

function luminance(hex) {
  const [r, g, b] = parseHex(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Alpha-composites `foreground` at `alpha` over `background` (sRGB, like a browser). */
function blend(foreground, background, alpha) {
  const f = parseHex(foreground);
  const b = parseHex(background);
  return toHex(f.map((channel, index) => channel * alpha + b[index] * (1 - alpha)));
}

function oklab(hex) {
  const [r, g, b] = parseHex(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function deltaE(a, b) {
  const [x, y] = [oklab(a), oklab(b)];
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

const CVD = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

function simulate(hex, kind) {
  const linear = parseHex(hex).map(toLinear);
  const matrix = CVD[kind];
  return toHex(matrix.map((row) => fromLinear(row.reduce((sum, weight, index) => sum + weight * linear[index], 0))));
}

// ─── Reading globals.css ──────────────────────────────────────────────────

const root = postcss.parse(readFileSync(CSS_PATH, "utf8"));

const theme = new Map();
root.walkAtRules("theme", (rule) => {
  rule.walkDecls((declaration) => theme.set(declaration.prop, declaration.value.trim()));
});

/** Declarations of every rule whose selector list contains `selector`. */
function rule(selector) {
  const declarations = new Map();
  let found = false;
  root.walkRules((candidate) => {
    if (!candidate.selectors.includes(selector)) return;
    found = true;
    candidate.walkDecls((declaration) => declarations.set(declaration.prop, declaration.value.trim()));
  });
  if (!found) throw new Error(`globals.css has no rule for ${selector}`);
  return declarations;
}

function themeHex(token) {
  const value = theme.get(token);
  if (!value) throw new Error(`globals.css @theme has no ${token}`);
  parseHex(value);
  return value.toLowerCase();
}

/** Resolves `rgba(r, g, b, a)` over a ground to the composited hex. */
function resolveColour(value, ground) {
  const rgba = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i.exec(value);
  if (rgba) {
    const [, r, g, b, a] = rgba;
    return blend(toHex([Number(r), Number(g), Number(b)]), ground, Number(a));
  }
  parseHex(value);
  return value.toLowerCase();
}

const PAPER = {
  kalkweiss: themeHex("--color-background"),
  bogen: themeHex("--color-card"),
  beton: themeHex("--color-inset"),
};
// The light grounds that replaced the retired graphit band (the site has no
// black grounds): the footer's Pfirsich-Wash, the Himmel-Wash band and the
// pastel Himmel-Blatt sheet.
const LIGHT = {
  peach: themeHex("--color-peach-wash"),
  wash: themeHex("--color-sky-wash"),
  sheet: themeHex("--color-sky-sheet"),
};

const RAW_TOKENS = [
  ["--color-ultramarin", "Ultramarin"],
  ["--color-butter", "Butter"],
  ["--color-kreide", "Kreide"],
  ["--color-kobalt", "Kobalt"],
  ["--color-himbeere", "Himbeere"],
  ["--color-himbeere-tief", "Himbeere tief"],
  ["--color-sand", "Sand"],
  ["--color-aubergine", "Aubergine"],
  ["--color-terrakotta", "Terrakotta"],
  ["--color-terrakotta-tief", "Terrakotta tief"],
  ["--color-rost", "Rost"],
  ["--color-creme", "Creme"],
  ["--color-ocker", "Ocker"],
  ["--color-ocker-hell", "Ocker hell"],
  ["--color-ocker-tief", "Ocker tief"],
];

const NAMES = new Map([
  [PAPER.kalkweiss, "Kalkweiß"],
  [PAPER.bogen, "Bogen"],
  [PAPER.beton, "Beton"],
  [themeHex("--color-foreground"), "Druckschwarz"],
  [themeHex("--color-mennige"), "Mennige"],
  [themeHex("--color-kupfer-dark"), "Mennige tief"],
  [LIGHT.peach, "Pfirsich-Wash"],
  [LIGHT.wash, "Himmel-Wash"],
  [LIGHT.sheet, "Himmel-Blatt"],
  ...RAW_TOKENS.map(([token, name]) => [themeHex(token), name]),
]);

const SCENE_NAMES = { lemons: "Lemons", idea: "IDEA", bloom: "Bloom", autumn: "Autumn" };

const failures = [];

function fail(message) {
  failures.push(message);
}

// ─── Formatting ───────────────────────────────────────────────────────────

const ratio = (value) => value.toFixed(2);

function swatch(hex) {
  const name = NAMES.get(hex);
  return name ? `${name} \`${hex}\`` : `\`${hex}\``;
}

function table(header, rows) {
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

/** Checks a floor (at least) or a ceiling (below); returns the result cell. */
function judge(value, { floor, ceiling }, context) {
  if (floor !== undefined) {
    if (value >= floor) return "pass";
    fail(`${context}: ${ratio(value)} is below ${floor}`);
    return "**fail**";
  }
  if (ceiling !== undefined) {
    if (value < ceiling) return "pass (decor)";
    fail(`${context}: ${ratio(value)} is not below ${ceiling}`);
    return "**fail**";
  }
  return "decor";
}

// ─── Sections ─────────────────────────────────────────────────────────────

const STATUS_TOKENS = [
  ["--color-pass", "Pass state"],
  ["--color-destructive", "Destructive"],
  ["--color-risk-red", "Risk red"],
  ["--color-risk-yellow", "Risk yellow"],
  ["--color-risk-green", "Risk green"],
  ["--color-brand-sand", "Brand sand"],
  ["--color-brand-amber", "Brand amber"],
];

function rawPaletteSection() {
  const rows = RAW_TOKENS.map(([token, name]) => {
    const hex = themeHex(token);
    const ratios = Object.values(PAPER).map((ground) => contrast(hex, ground));
    const grounds = ["Kalkweiß", "Bogen", "Beton"];
    const text = grounds.filter((_, index) => ratios[index] >= 4.5);
    const large = grounds.filter((_, index) => ratios[index] >= 3 && ratios[index] < 4.5);
    return [
      `\`${token}\``,
      name,
      `\`${hex}\``,
      ...ratios.map(ratio),
      text.length ? text.join(", ") : "none",
      large.length ? large.join(", ") : "none",
    ];
  });
  return [
    "## Raw palette on paper",
    "",
    "The fifteen `@theme static` tokens against the three paper grounds. \"Text on\" lists the grounds where the colour reaches 4.5:1, \"Large or non-text only on\" the grounds where it reaches 3:1 but not 4.5:1. A colour with neither is a scene colour and never sits on paper as text.",
    "",
    table(
      ["Token", "Name", "Hex", "Kalkweiß", "Bogen", "Beton", "Text on", "Large or non-text only on"],
      rows,
    ),
  ].join("\n");
}

function sceneSection(key) {
  const palette = PLAKAT[key];
  const scope = rule(`.plakat-${key}`);
  const band = rule(`[data-plakat-page="${key}"] [data-plakat-band]`);
  const context = `.plakat-${key}`;

  // The class and the page-band selector must be one rule with one value set.
  for (const [prop, value] of scope) {
    if (band.get(prop) !== value) fail(`${context}: ${prop} differs between the class and the band selector`);
  }

  const value = (token) => {
    const own = scope.get(token);
    return own ? { hex: resolveColour(own, palette.ground), note: "" } : { hex: themeHex(token), note: " (paper value)" };
  };

  const ground = value("--color-background").hex;
  const ink = value("--color-foreground").hex;
  const expected = {
    "--color-background": palette.ground,
    "--color-scene-ground": palette.ground,
    "--color-foreground": ink,
    "--color-scene-ink": palette.ink,
    "--color-brand-orange": palette.ink,
    "--color-scene-mid": palette.mid,
    "--color-scene-mark": palette.mark,
    "--color-scene-accent-text": palette.accentText,
    "--color-scene-line": palette.ink,
    "--color-scene-button": palette.button,
    "--color-scene-button-text": palette.buttonText,
  };
  for (const [token, hex] of Object.entries(expected)) {
    if (value(token).hex !== hex) fail(`${context}: ${token} is ${value(token).hex}, palettes.ts says ${hex}`);
  }
  for (const token of ["--color-paper", "--color-mennige"]) {
    if (scope.has(token)) fail(`${context}: redefines ${token}`);
  }

  const rows = [];
  const add = (label, foreground, background, use, limits) => {
    const measured = contrast(foreground.hex, background);
    const cell = limits.floor !== undefined ? `${limits.floor}` : limits.ceiling !== undefined ? `below ${limits.ceiling}` : "none";
    rows.push([label, `${swatch(foreground.hex)}${foreground.note}`, use, cell, ratio(measured), judge(measured, limits, `${context} ${label}`)]);
  };

  add("`--color-foreground`", value("--color-foreground"), ground, "Text, caps line, links", { floor: 4.5 });
  add("`--color-muted-foreground`", value("--color-muted-foreground"), ground, "Secondary text (no muted tier: the ink)", { floor: 4.5 });
  add("`--color-muted`", value("--color-muted"), ground, "Captions (no muted tier: the ink)", { floor: 4.5 });
  add("`--color-border`", value("--color-border"), ground, "Control edge", { floor: 3 });
  add("`--color-brand-orange`", value("--color-brand-orange"), ground, "Focus ring and accent text", { floor: 4.5 });
  add("`--color-kupfer`", value("--color-kupfer"), ground, "Accent text", { floor: 4.5 });
  add("`--color-kupfer-dark`", value("--color-kupfer-dark"), ground, "Accent text, pressed", { floor: 4.5 });
  const button = value("--color-scene-button").hex;
  add("button label on the fill", value("--color-scene-button-text"), button, "Primary button label (never an ink fill when the ink is dark)", { floor: 4.5 });
  add("`--color-scene-button`", value("--color-scene-button"), ground, "Filled button against the ground", { floor: 3 });
  for (const token of ["--color-card-hover", "--color-inset"]) {
    const tint = value(token).hex;
    if (tint === ground) {
      rows.push([`\`${token}\``, `${swatch(tint)}`, "Equals the ground: no tint", "n/a", "n/a", "pass"]);
    } else {
      const measured = contrast(ink, tint);
      rows.push([
        `ink on \`${token}\``,
        `${swatch(ink)} on \`${tint}\``,
        token === "--color-inset" ? "Recessed well" : "Hover tint",
        "4.5",
        ratio(measured),
        judge(measured, { floor: 4.5 }, `${context} ink on ${token}`),
      ]);
    }
  }
  add("`--color-hairline`", value("--color-hairline"), ground, "Hairline between rows", { ceiling: 2 });
  add("`--color-track`", value("--color-track"), ground, "Passive track", { ceiling: 2 });
  for (const [token, label] of STATUS_TOKENS) {
    add(`\`${token}\``, value(token), ground, `${label} text`, { floor: 4.5 });
  }
  add("`--color-scene-mid`", value("--color-scene-mid"), ground, "Decorative shapes, never text", {});
  add("`--color-scene-mark`", value("--color-scene-mark"), ground, "A shape that carries meaning", { floor: 3 });
  add("`--color-scene-accent-text`", value("--color-scene-accent-text"), ground, "Text in the mid hue", { floor: 4.5 });
  add("`--color-scene-line`", value("--color-scene-line"), ground, "Kopflinie inside the band", { floor: 4.5 });

  // Poster art: the numeral and type over shapes.
  const numeral = palette.numRole === "mid" ? palette.mid : palette.ink;
  add(
    "poster numeral",
    { hex: numeral, note: "" },
    ground,
    `Numeral at ${palette.numWeight}, display size only`,
    { floor: 3 },
  );
  const inkOverMid = contrast(palette.ink, palette.mid);
  rows.push([
    "ink over mid",
    `${swatch(palette.ink)} on ${swatch(palette.mid)}`,
    "Numeral or type crossing a mid shape",
    "3",
    ratio(inkOverMid),
    inkOverMid >= 3 ? "pass (display)" : "keyline and 0.12em clearance",
  ]);

  return [
    `### ${SCENE_NAMES[key]} (\`.plakat-${key}\`)`,
    "",
    `Ground ${swatch(palette.ground)}, ink ${swatch(palette.ink)}, mid ${swatch(palette.mid)}. Numeral weight ${palette.numWeight}${palette.cornerDots ? ", corner dots" : ""}.`,
    "",
    table(["Pairing", "Colour", "Use", "Floor", "Ratio", "Result"], rows),
  ].join("\n");
}

function sceneLineSection() {
  const rows = PLAKAT_KEYS.map((key) => {
    const declarations = rule(`:root:has([data-plakat-page="${key}"])`);
    const line = resolveColour(declarations.get("--color-scene-line") ?? "", PAPER.kalkweiss);
    if (line !== PLAKAT[key].line) fail(`:root:has(${key}) scene line ${line} differs from palettes.ts ${PLAKAT[key].line}`);
    const ratios = Object.values(PAPER).map((ground) => contrast(line, ground));
    const result = ratios.every((value) => value >= 4.5) ? "pass" : "**fail**";
    if (result !== "pass") fail(`scene line ${key}: below 4.5 on a paper ground`);
    return [`\`${key}\``, swatch(line), ...ratios.map(ratio), result];
  });
  const defaultLine = themeHex("--color-scene-line");
  rows.unshift([
    "none",
    swatch(defaultLine),
    ...Object.values(PAPER).map((ground) => ratio(contrast(defaultLine, ground))),
    "pass",
  ]);
  return [
    "## Paper below a band: the page scene line",
    "",
    "`:root:has([data-plakat-page])` sets `--color-scene-line` for the whole document: the Kopflinie, `SectionHead`, the StatRow values, the lesson H1 and the active tab-bar marker. Floor 4.5 on every paper ground, because StatRow values and the lesson H1 are text.",
    "",
    table(["`data-plakat-page`", "Scene line", "Kalkweiß", "Bogen", "Beton", "Result"], rows),
  ].join("\n");
}

function lightGroundsSection() {
  const rows = [];
  const add = (label, hex, use, limits) => {
    for (const [ground, groundName] of [[LIGHT.peach, "Pfirsich-Wash"], [LIGHT.wash, "Himmel-Wash"], [LIGHT.sheet, "Himmel-Blatt"]]) {
      const measured = contrast(hex, ground);
      const cell = limits.floor !== undefined ? `${limits.floor}` : `below ${limits.ceiling}`;
      rows.push([groundName, label, swatch(hex), use, cell, ratio(measured), judge(measured, limits, `${groundName} ${label}`)]);
    }
  };
  add("`--color-foreground`", themeHex("--color-foreground"), "Text, wordmark", { floor: 4.5 });
  add("`--color-muted-foreground`", themeHex("--color-muted-foreground"), "Links and secondary text", { floor: 4.5 });
  add("`--color-muted`", themeHex("--color-muted"), "Captions", { floor: 4.5 });
  add("`--color-kupfer-dark`", themeHex("--color-kupfer-dark"), "Kicker and column heads", { floor: 4.5 });
  add("`--color-brand-orange`", themeHex("--color-brand-orange"), "Wordmark `.ai`, focus ring", { floor: 4.5 });
  add("`--color-border`", themeHex("--color-border"), "Control edge", { floor: 3 });
  const actionRows = [];
  for (const [label, fill] of [["IDEA Kobalt", themeHex("--color-kobalt")], ["Kobalt (old site)", themeHex("--color-brand-cobalt")]]) {
    const measured = contrast(themeHex("--color-paper"), fill);
    actionRows.push([label, swatch(fill), "Filled action or selection, paper text", "4.5", ratio(measured), judge(measured, { floor: 4.5 }, `${label} action`)]);
  }
  return [
    "## Light grounds (no graphit)",
    "",
    "The site has no black grounds. The graphit band (`.dark-section`, `--color-dark-*`) is retired: the footer is the Pfirsich-Wash (`--color-peach-wash`, brand-peach over Bogen), a tinted band or panel is the Himmel-Wash (`--color-sky-wash`), and a pastel sheet, a selected state or a former console head is the Himmel-Blatt (`--color-sky-sheet`). Code, logs and consoles are Beton. A filled action that is not the page's Mennige primary is Kobalt with paper text, never an ink fill; a filled scene button uses `--color-scene-button`, which is never a near-black ink (Bloom fills with Terrakotta tief, not Aubergine). The one documented exception is the owner-requested `/login` scene, scoped to `.login-scene` with its own AA ratios (see `experience-system.md`).",
    "",
    table(["Ground", "Pairing", "Colour", "Use", "Floor", "Ratio", "Result"], rows),
    "",
    table(["Fill", "Colour", "Use", "Floor", "Ratio", "Result"], actionRows),
  ].join("\n");
}

function chartSection() {
  const rows = PLAKAT_KEYS.map((key) => {
    const { line, chartAccent } = PLAKAT[key];
    const kinds = ["normal", "protan", "deutan", "tritan"];
    const pairs = kinds.map((kind) =>
      kind === "normal" ? [line, chartAccent] : [simulate(line, kind), simulate(chartAccent, kind)],
    );
    const separations = pairs.map(([a, b]) => ({ dE: deltaE(a, b), ratio: contrast(a, b) }));
    const minimum = Math.min(...separations.map((entry) => entry.dE));
    const bars = [line, chartAccent].map((hex) => contrast(hex, PAPER.kalkweiss));
    for (const [index, value] of bars.entries()) {
      if (value < 3) fail(`chart ${key}: series ${index + 1} is ${ratio(value)} on Kalkweiß`);
    }
    return [
      SCENE_NAMES[key],
      `${swatch(line)} ${ratio(bars[0])}`,
      `${swatch(chartAccent)} ${ratio(bars[1])}`,
      ...separations.map((entry) => `${entry.dE.toFixed(1)} / ${ratio(entry.ratio)}`),
      minimum < 10 ? "hatch plus direct labels" : "direct labels",
    ];
  });
  return [
    "## Charts on Kalkweiß",
    "",
    "A result chart sits on Kalkweiß, never Beton. Series 1 is the scene line, series 2 the chart accent from `palettes.ts`; both are shown with their ratio on Kalkweiß (bars need 3, a text note in the accent needs 4.5). Separation is ΔE OK / contrast between the two series, for normal vision and simulated protanopia, deuteranopia and tritanopia (Machado 2009, severity 1.0). When any ΔE OK falls below 10 the series are told apart by a hatch and direct labels, never by hue.",
    "",
    table(["Scene", "Series 1", "Series 2", "Normal", "Protan", "Deutan", "Tritan", "Required cue"], rows),
  ].join("\n");
}

function rejectedSection() {
  const autumn = PLAKAT.autumn;
  const rows = [];
  const add = (pairing, measured, floor, rule) => rows.push([pairing, ratio(measured), `${floor}`, rule]);
  add(
    `${swatch(autumn.ink)} on Rost plus a 10% Creme tint \`${blend(autumn.ink, autumn.ground, 0.1)}\``,
    contrast(autumn.ink, blend(autumn.ink, autumn.ground, 0.1)),
    4.5,
    "No hover tint in autumn: a hover underlines or inverts the pair",
  );
  add(
    `${swatch(autumn.ink)} on Rost plus a 6% Creme tint \`${blend(autumn.ink, autumn.ground, 0.06)}\``,
    contrast(autumn.ink, blend(autumn.ink, autumn.ground, 0.06)),
    4.5,
    "No inset tint in autumn",
  );
  const statusTones = STATUS_TOKENS.map(([token]) => themeHex(token));
  const statusRatios = statusTones.map((hex) => contrast(hex, autumn.ground));
  rows.push([
    "Paper status tones on Rost",
    `${ratio(Math.min(...statusRatios))} to ${ratio(Math.max(...statusRatios))}`,
    "4.5",
    "No status UI, chip, badge or form in autumn; the scope maps every status token to the ink",
  ]);
  for (const token of ["--color-himbeere-tief", "--color-ocker-tief"]) {
    add(`${swatch(themeHex(token))} on Beton`, contrast(themeHex(token), PAPER.beton), 4.5, "No tief variant on Beton (`bg-inset`)");
  }
  add(`${swatch(themeHex("--color-ocker-tief"))} on Creme`, contrast(themeHex("--color-ocker-tief"), autumn.ink), 4.5, "Ocker tief is for Kalkweiß and Bogen only");
  add(`${swatch(themeHex("--color-ocker-tief"))} on Sand`, contrast(themeHex("--color-ocker-tief"), PLAKAT.bloom.ground), 4.5, "Ocker tief is for Kalkweiß and Bogen only");
  add(`${swatch(PLAKAT.idea.mid)} as text on Kreide`, contrast(PLAKAT.idea.mid, PLAKAT.idea.ground), 4.5, "Himbeere is display only (24px, or 18.66px at 700); text uses Himbeere tief");
  add(`${swatch(PLAKAT.bloom.mid)} as text on Sand`, contrast(PLAKAT.bloom.mid, PLAKAT.bloom.ground), 4.5, "Terrakotta is never text; text uses Terrakotta tief");
  add(`${swatch(autumn.mid)} as text on Rost`, contrast(autumn.mid, autumn.ground), 4.5, "Ocker is decoration only; a meaningful mark uses Ocker hell");
  for (const hex of [PLAKAT.lemons.ink, PLAKAT.idea.ground, PLAKAT.bloom.ground, autumn.ink]) {
    add(`${swatch(hex)} as a card on Kalkweiß`, contrast(hex, PAPER.kalkweiss), 3, "Never a card fill or row tint on paper");
  }
  for (const hex of [PLAKAT.lemons.ink, autumn.ink]) {
    add(`${swatch(hex)} focus ring landing on Kalkweiß`, contrast(hex, PAPER.kalkweiss), 3, "A control at a band edge uses an inset ring");
  }
  const mennige = themeHex("--color-mennige");
  for (const key of ["lemons", "autumn"]) {
    add(`${swatch(mennige)} fill edge on ${SCENE_NAMES[key]}`, contrast(mennige, PLAKAT[key].ground), 3, `No Mennige fill inside the ${SCENE_NAMES[key]} scope`);
  }
  // Every rejected pairing must stay below its floor, or its rule is moot.
  for (const row of rows) {
    const measured = Number.parseFloat(row[1]);
    const floor = Number.parseFloat(row[2]);
    if (row[1].includes(" to ")) {
      const high = Number.parseFloat(row[1].split(" to ")[1]);
      if (high >= floor) fail(`rejected pairing now passes: ${row[0]}`);
    } else if (measured >= floor) {
      fail(`rejected pairing now passes, review its rule: ${row[0]}`);
    }
  }
  return [
    "## Rejected pairings",
    "",
    "Each of these misses its floor, which is why the rule beside it exists. The generator fails if one of them starts to pass, so a rule never outlives its reason unnoticed.",
    "",
    table(["Pairing", "Ratio", "Floor", "Rule"], rows),
  ].join("\n");
}

const markdown = [
  "# Plakat pairings",
  "",
  "<!-- Generated by scripts/plakat/build-pairings.mjs. Do not edit by hand. -->",
  "",
  "The pairing registry of the poster layer (see `experience-system.md`, Identity). Every value comes from `src/app/globals.css` and `src/lib/plakat/palettes.ts`. Regenerate with `node scripts/plakat/build-pairings.mjs`; `palettes.test.ts` runs the same script with `--check` and fails when this file is stale or a required pairing misses its floor.",
  "",
  "Ratios use the WCAG 2.x relative-luminance formula. Floors: 4.5 for text; 3 for large text (24px, or 18.66px at 700) and for meaningful non-text such as control edges, focus rings and marks; decoration may sit below 3 and is never text; hairlines stay below 2.",
  "",
  rawPaletteSection(),
  "",
  "## Scenes",
  "",
  "Each scope redefines the semantic tokens, so every component built on `text-foreground`, `border-border`, `bg-card` or the focus ring inherits these pairs. \"(paper value)\" marks a token the scope leaves at its `@theme` value.",
  "",
  PLAKAT_KEYS.map(sceneSection).join("\n\n"),
  "",
  "Autumn carries the Rost rules: text 17px or larger at weight 400 or more, no muted tier, no reduced opacity, no hover tint, and no question card, status chip, badge, form field, progress bar, `text-caption`, `text-label` or `text-xs` inside the scope.",
  "",
  sceneLineSection(),
  "",
  lightGroundsSection(),
  "",
  chartSection(),
  "",
  rejectedSection(),
  "",
].join("\n");

if (failures.length > 0) {
  console.error(`${OUTPUT_LABEL}: ${failures.length} pairing problem(s):`);
  for (const message of failures) console.error(`  - ${message}`);
}

if (checkOnly) {
  const current = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf8") : null;
  if (current !== markdown) {
    console.error(`${OUTPUT_LABEL} is stale. Run \`node scripts/plakat/build-pairings.mjs\` and review the diff.`);
    process.exit(1);
  }
  if (failures.length > 0) process.exit(1);
  console.log(`${OUTPUT_LABEL}: ${PLAKAT_KEYS.length} scenes (up to date)`);
  process.exit(0);
}

writeFileSync(OUTPUT_PATH, markdown, "utf8");
console.log(`Wrote ${OUTPUT_LABEL}: ${PLAKAT_KEYS.length} scenes`);
if (failures.length > 0) process.exit(1);
