/**
 * ============================================================================
 * TOKEN COMPILER (build-tokens.js)
 * ============================================================================
 * Reads design-tokens.json (the single source of truth for colour, type,
 * and space decisions) and generates src/css/global/variables.css.
 *
 * DO NOT hand-edit variables.css — it is regenerated every time this runs.
 * Edit design-tokens.json instead, then:
 *
 *   npm run build:tokens
 *
 * Resolution rules:
 *  - colors:     hex values become CSS custom properties directly.
 *                 A "{other-key}" value is a SEMANTIC alias — it compiles to
 *                 var(--color-other-key) rather than duplicating the hex, so
 *                 swapping a primitive updates every alias automatically.
 *  - solfege:    same alias handling as colors, output under the same
 *                 --color- namespace with a "solfege-" prefix
 *                 (--color-solfege-do etc.) — a separate top-level section
 *                 purely for discoverability in the JSON, not a separate
 *                 CSS namespace. A "{ref}" here resolves against ref's KEY
 *                 name, not against colors' own data, so it works exactly
 *                 the same whether ref lives in colors or solfege itself.
 *  - typography: "font-family-*" keys pass straight through.
 *                 "step-N" / "step--N" keys compile to --size-step-N.
 *  - space:      keys compile to --space-{key} as-is.
 *  - layout:     keys compile to --{key} as-is (no namespace prefix).
 *  - Any key starting with "_" (at any depth) is documentation and is
 *    skipped entirely — it exists for humans reading the JSON, not for
 *    the compiler.
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");

const TOKENS_PATH = path.join(__dirname, "design-tokens.json");
const OUTPUT_PATH = path.join(
  __dirname,
  "src",
  "css",
  "global",
  "variables.css",
);

function isDocKey(key) {
  return key.startsWith("_");
}

function compileColors(colors) {
  const lines = [];

  // Pass 1: primitives (plain hex/rgb/etc values) so aliases in pass 2 can
  // safely reference them via var().
  Object.entries(colors).forEach(([key, value]) => {
    if (isDocKey(key)) return;
    if (typeof value === "string" && !value.startsWith("{")) {
      lines.push(`  --color-${key}: ${value};`);
    }
  });

  lines.push("");

  // Pass 2: semantic aliases ("{primitive-key}" -> var(--color-primitive-key))
  Object.entries(colors).forEach(([key, value]) => {
    if (isDocKey(key)) return;
    if (typeof value === "string" && value.startsWith("{")) {
      const referencedKey = value.slice(1, -1);
      lines.push(`  --color-${key}: var(--color-${referencedKey});`);
    }
  });

  return lines;
}

/**
 * Solfège colours compile into the exact same --color- namespace as
 * compileColors' own aliases (just "solfege-" prefixed), so component CSS
 * reaches for var(--color-solfege-do) the same way it reaches for
 * var(--color-action-primary) — no separate namespace or lookup convention
 * to remember for a category that only exists as its own JSON section for
 * discoverability.
 */
function compileSolfege(solfege) {
  const lines = [];
  Object.entries(solfege).forEach(([key, value]) => {
    if (isDocKey(key)) return;
    if (typeof value === "string" && value.startsWith("{")) {
      const referencedKey = value.slice(1, -1);
      lines.push(`  --color-solfege-${key}: var(--color-${referencedKey});`);
    } else {
      lines.push(`  --color-solfege-${key}: ${value};`);
    }
  });
  return lines;
}

function compileTypography(typography) {
  const lines = [];

  Object.entries(typography).forEach(([key, value]) => {
    if (isDocKey(key)) return;

    if (key.startsWith("font-family-")) {
      lines.push(`  --${key}: ${value};`);
      return;
    }

    if (key.startsWith("step-")) {
      // "step-0" -> "--size-step-0", "step--2" -> "--size-step--2"
      const suffix = key.slice("step-".length);
      lines.push(`  --size-step-${suffix}: ${value};`);
      return;
    }

    lines.push(`  --${key}: ${value};`);
  });

  return lines;
}

function compileSpace(space) {
  const lines = [];
  Object.entries(space).forEach(([key, value]) => {
    if (isDocKey(key)) return;
    lines.push(`  --space-${key}: ${value};`);
  });
  return lines;
}

function compileLayout(layout) {
  const lines = [];
  Object.entries(layout).forEach(([key, value]) => {
    if (isDocKey(key)) return;
    lines.push(`  --${key}: ${value};`);
  });
  return lines;
}

function compileMotion(motion) {
  const lines = [];
  Object.entries(motion).forEach(([key, value]) => {
    if (isDocKey(key)) return;
    lines.push(`  --${key}: ${value};`);
  });
  return lines;
}

function build() {
  const raw = fs.readFileSync(TOKENS_PATH, "utf8");
  const tokens = JSON.parse(raw);

  const sections = [
    { title: "COLOUR", lines: compileColors(tokens.colors || {}) },
    { title: "SOLFEGE", lines: compileSolfege(tokens.solfege || {}) },
    { title: "TYPOGRAPHY", lines: compileTypography(tokens.typography || {}) },
    { title: "SPACE", lines: compileSpace(tokens.space || {}) },
    { title: "MOTION", lines: compileMotion(tokens.motion || {}) },
    { title: "LAYOUT", lines: compileLayout(tokens.layout || {}) },
  ];

  const body = sections
    .map(
      (section) =>
        `  /* -- ${section.title} ${"-".repeat(Math.max(0, 68 - section.title.length))} */\n` +
        section.lines.join("\n"),
    )
    .join("\n\n");

  const output =
    `/**\n` +
    ` * AUTO-GENERATED by build-tokens.js from design-tokens.json.\n` +
    ` * Do not edit this file directly — your changes will be overwritten.\n` +
    ` */\n\n` +
    `:root {\n${body}\n}\n`;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, output, "utf8");

  console.log(`[build-tokens] wrote ${path.relative(__dirname, OUTPUT_PATH)}`);
}

build();
