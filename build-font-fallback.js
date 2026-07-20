/**
 * ============================================================================
 * FONT FALLBACK METRIC GENERATOR (build-font-fallback.js)
 * ============================================================================
 * Self-hosted Galindo/Poppins swap in after first paint (font-display:
 * swap), and a Lighthouse audit confirmed that swap was the entire source
 * of classroom.html's layout-shift score - the fallback font's line box
 * doesn't match the real font's, so text reflows the moment the real font
 * arrives. This computes CSS's font-metric-override values (size-adjust,
 * ascent-override, descent-override, line-gap-override) for a synthetic
 * "* Fallback" @font-face per family, so the FALLBACK renders at the same
 * line-box dimensions as the real font - the swap becomes visually
 * invisible instead of a reflow.
 *
 * Reference fallback is Arial: not a perfect stand-in for every platform's
 * real system-ui font (Segoe UI on Windows, San Francisco on macOS,
 * Roboto on Android all differ slightly), but it's the standard baseline
 * this technique is computed against elsewhere (e.g. next/font's local
 * metric generator) - an approximation, not a per-platform exact match.
 *
 * Formula (per-family, using each family's most representative weight):
 *   sizeAdjust = (font.xAvgCharWidth / font.unitsPerEm)
 *              / (fallback.xAvgCharWidth / fallback.unitsPerEm)
 *   ascentOverride  = (font.ascent  / font.unitsPerEm) / sizeAdjust
 *   descentOverride = abs(font.descent / font.unitsPerEm) / sizeAdjust
 *   lineGapOverride = (font.lineGap / font.unitsPerEm) / sizeAdjust
 *
 * DO NOT hand-edit the generated output — re-run this script instead:
 *
 *   npm run build:fonts
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");

const FONT_DIR = path.join(__dirname, "assets", "fonts");
const OUTPUT_PATH = path.join(__dirname, "src", "css", "global", "font-faces.css");

// Windows ships Arial at this path; used purely as a one-time metrics
// reference at build time, never shipped or referenced at runtime.
const FALLBACK_REFERENCE_PATH = "C:/Windows/Fonts/arial.ttf";

function readMetrics(filePath) {
  const font = fontkit.openSync(filePath);
  const os2 = font["OS/2"];
  if (!os2) {
    throw new Error(`[build-font-fallback] ${filePath} has no OS/2 table — can't read xAvgCharWidth`);
  }
  return {
    unitsPerEm: font.unitsPerEm,
    ascent: font.ascent,
    descent: font.descent,
    lineGap: font.lineGap,
    xAvgCharWidth: os2.xAvgCharWidth,
  };
}

function computeOverrides(fontMetrics, fallbackMetrics) {
  const fontRatio = fontMetrics.xAvgCharWidth / fontMetrics.unitsPerEm;
  const fallbackRatio = fallbackMetrics.xAvgCharWidth / fallbackMetrics.unitsPerEm;
  const sizeAdjust = fontRatio / fallbackRatio;

  const ascentOverride = (fontMetrics.ascent / fontMetrics.unitsPerEm) / sizeAdjust;
  const descentOverride = Math.abs(fontMetrics.descent / fontMetrics.unitsPerEm) / sizeAdjust;
  const lineGapOverride = (fontMetrics.lineGap / fontMetrics.unitsPerEm) / sizeAdjust;

  return { sizeAdjust, ascentOverride, descentOverride, lineGapOverride };
}

function pct(n) {
  return `${(n * 100).toFixed(2)}%`;
}

function build() {
  const fallbackMetrics = readMetrics(FALLBACK_REFERENCE_PATH);

  const families = [
    {
      name: "Galindo",
      fallbackName: "Galindo Fallback",
      weights: [{ weight: 400, file: "galindo-400.woff2" }],
      // Single weight — its own metrics represent the family.
      metricsFile: "galindo-400.woff2",
    },
    {
      name: "Poppins",
      fallbackName: "Poppins Fallback",
      weights: [
        { weight: 400, file: "poppins-400.woff2" },
        { weight: 500, file: "poppins-500.woff2" },
        { weight: 600, file: "poppins-600.woff2" },
        { weight: 700, file: "poppins-700.woff2" },
      ],
      // Vertical metrics are identical across weights (confirmed by
      // inspecting all 4) — 400 stands in for the family.
      metricsFile: "poppins-400.woff2",
    },
  ];

  const sections = [];

  for (const family of families) {
    for (const { weight, file } of family.weights) {
      sections.push(
        `@font-face {\n` +
          `  font-family: '${family.name}';\n` +
          `  font-style: normal;\n` +
          `  font-weight: ${weight};\n` +
          `  font-display: swap;\n` +
          `  src: url("../../../assets/fonts/${file}") format("woff2");\n` +
          `}`,
      );
    }

    const fontMetrics = readMetrics(path.join(FONT_DIR, family.metricsFile));
    const overrides = computeOverrides(fontMetrics, fallbackMetrics);

    sections.push(
      `/* Metric-matched stand-in for '${family.name}' while it loads — sized so the swap doesn't shift layout. Computed against Arial (see file header). */\n` +
        `@font-face {\n` +
        `  font-family: '${family.fallbackName}';\n` +
        `  src: local("Arial");\n` +
        `  size-adjust: ${pct(overrides.sizeAdjust)};\n` +
        `  ascent-override: ${pct(overrides.ascentOverride)};\n` +
        `  descent-override: ${pct(overrides.descentOverride)};\n` +
        `  line-gap-override: ${pct(overrides.lineGapOverride)};\n` +
        `}`,
    );
  }

  const output =
    `/**\n` +
    ` * AUTO-GENERATED by build-font-fallback.js.\n` +
    ` * Do not edit this file directly — your changes will be overwritten.\n` +
    ` * Re-run: npm run build:fonts\n` +
    ` */\n\n` +
    sections.join("\n\n") +
    "\n";

  fs.writeFileSync(OUTPUT_PATH, output, "utf8");
  console.log(`[build-font-fallback] wrote ${path.relative(__dirname, OUTPUT_PATH)}`);
}

build();
