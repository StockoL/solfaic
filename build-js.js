/**
 * ============================================================================
 * JS BUNDLER (build-js.js)
 * ============================================================================
 * Bundles + minifies each page's ES module entry point into a single
 * deployment-only file under dist/js/ — sibling of build-css.js, which does
 * the same job for CSS. Unlike the CSS bundler, this one leans on esbuild
 * rather than hand-rolled concatenation, since JS bundling needs real
 * module-graph resolution (import specifiers, no @layer-style ordering
 * concern to preserve).
 *
 * src/js/*.js stays exactly as-is and is still what local dev and the
 * Playwright suite load directly as unbundled native ES modules — this
 * script's output is only ever consumed by dist/*.html, assembled by
 * build-dist.js.
 *
 *   npm run build:js
 * ============================================================================
 */

const path = require("path");
const esbuild = require("esbuild");

const JS_ROOT = path.join(__dirname, "src", "js");
const OUT_DIR = path.join(__dirname, "dist", "js");

// One entry -> output pair per page, matching build-css.js's *-bundle.css
// naming convention.
const BUILDS = [
  { entry: "home-entry.js", output: "home-bundle.min.js" },
  { entry: "classroom-entry.js", output: "classroom-bundle.min.js" },
  { entry: "app.js", output: "practice-bundle.min.js" },
];

async function build() {
  for (const { entry, output } of BUILDS) {
    const entryPoint = path.join(JS_ROOT, entry);
    const outfile = path.join(OUT_DIR, output);

    await esbuild.build({
      entryPoints: [entryPoint],
      outfile,
      bundle: true,
      minify: true,
      format: "iife",
      target: "es2019",
    });

    console.log(`[build-js] wrote ${path.relative(__dirname, outfile)}`);
  }
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
