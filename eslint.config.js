/**
 * ============================================================================
 * ESLINT FLAT CONFIG
 * ============================================================================
 * `npm run lint`. Split by directory since the repo genuinely mixes module
 * systems: src/js/* is browser ES modules (loaded via <script type="module">),
 * build-tokens.js is a plain Node CommonJS script, tests/engine-verification.mjs
 * is Node ESM, and the Playwright spec is Node CommonJS whose callbacks run
 * inside a browser context (so it needs both sets of globals).
 * ============================================================================
 */
const js = require("@eslint/js");

const browserGlobals = {
  document: "readonly",
  window: "readonly",
  console: "readonly",
  navigator: "readonly",
  CustomEvent: "readonly",
  Event: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  fetch: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  getComputedStyle: "readonly",
  alert: "readonly",
  Node: "readonly",
  IntersectionObserver: "readonly",
  MutationObserver: "readonly",
  Tone: "readonly",
};

const nodeGlobals = {
  require: "readonly",
  module: "readonly",
  exports: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  process: "readonly",
  console: "readonly",
};

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "src/css/global/variables.css",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: browserGlobals,
    },
  },
  {
    files: ["build-tokens.js", "build-css.js", "build-font-fallback.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals,
    },
  },
  {
    files: ["tests/engine-verification.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: nodeGlobals,
    },
  },
  {
    files: ["tests/solfaic.spec.js", "playwright.config.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...nodeGlobals, ...browserGlobals },
    },
  },
];
