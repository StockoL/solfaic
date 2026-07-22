/**
 * ============================================================================
 * DIST ASSEMBLER (build-dist.js)
 * ============================================================================
 * Assembles the folder GitHub Pages actually deploys: minifies the already-
 * bundled CSS (build-css.js's output), copies assets/ verbatim, and copies
 * each HTML page into dist/ with its <link>/<script> tags rewritten to point
 * at the minified output instead of src/.
 *
 * Run `npm run build:js` before this — it expects dist/js/*.min.js to
 * already exist (this script only assembles around it, it doesn't invoke
 * esbuild for JS itself).
 *
 * src/ and the four root *.html files are never modified by this script —
 * local dev and the Playwright suite keep loading them directly, unbundled.
 *
 *   npm run build:dist
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

// Every CSS bundle build-css.js produces, minified 1:1 into dist/css.
const CSS_BUNDLES = [
  "bundle.css",
  "home-bundle.css",
  "classroom-bundle.css",
  "practice-bundle.css",
];

// Page -> its JS entry's compiled output (already built by build-js.js) and
// original module source, so the <script> tag can be rewritten. 404.html
// carries no JS entry point, so it's omitted here.
const PAGE_JS = {
  "index.html": { source: "src/js/home-entry.js", output: "js/home-bundle.min.js" },
  "classroom.html": { source: "src/js/classroom-entry.js", output: "js/classroom-bundle.min.js" },
  "practice.html": { source: "src/js/app.js", output: "js/practice-bundle.min.js" },
};

const HTML_PAGES = ["index.html", "classroom.html", "practice.html", "404.html"];

function emptyDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function minifyCssBundles() {
  const outDir = path.join(DIST, "css");
  emptyDir(outDir);

  for (const bundle of CSS_BUNDLES) {
    const entryPoint = path.join(ROOT, "src", "css", bundle);
    const outfile = path.join(outDir, bundle.replace(/\.css$/, ".min.css"));

    await esbuild.build({
      entryPoints: [entryPoint],
      outfile,
      bundle: false,
      minify: true,
    });

    console.log(`[build-dist] wrote ${path.relative(ROOT, outfile)}`);
  }
}

function rewriteHtml(pageName) {
  let html = fs.readFileSync(path.join(ROOT, pageName), "utf8");

  for (const bundle of CSS_BUNDLES) {
    const minified = bundle.replace(/\.css$/, ".min.css");
    html = html.split(`src/css/${bundle}`).join(`css/${minified}`);
  }

  // Bundled JS carries its whole module graph in one file — the
  // modulepreload hints that fan out to each unbundled src/js/*.js module
  // no longer apply once deployed.
  html = html.replace(/[ \t]*<link rel="modulepreload"[^>]*\/>\n/g, "");

  const jsEntry = PAGE_JS[pageName];
  if (jsEntry) {
    html = html.replace(
      `<script type="module" src="${jsEntry.source}"></script>`,
      `<script src="${jsEntry.output}"></script>`,
    );
  }

  fs.writeFileSync(path.join(DIST, pageName), html, "utf8");
  console.log(`[build-dist] wrote ${path.join("dist", pageName)}`);
}

async function build() {
  fs.mkdirSync(DIST, { recursive: true });

  copyDir(path.join(ROOT, "assets"), path.join(DIST, "assets"));
  console.log("[build-dist] copied assets/ -> dist/assets/");

  await minifyCssBundles();

  for (const page of HTML_PAGES) {
    rewriteHtml(page);
  }
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
