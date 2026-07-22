# Solfaic - Solfège Ear Trainer

[![GitHub license](https://img.shields.io/github/license/StockoL/solfaic?color=blue)](https://github.com/StockoL/solfaic/blob/main/LICENSE)
[![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/StockoL/solfaic?color=success)](https://github.com/StockoL/solfaic)
[![Lighthouse Performance](https://img.shields.io/badge/Lighthouse_Performance-98%25-brightgreen)](https://github.com/StockoL/solfaic)
[![Lighthouse Accessibility](https://img.shields.io/badge/Lighthouse_Accessibility-100%25-brightgreen)](https://github.com/StockoL/solfaic)
[![Lighthouse Best Practices](https://img.shields.io/badge/Lighthouse_Performance-100%25-brightgreen)](https://github.com/StockoL/solfaic)
[![Lighthouse SEO](https://img.shields.io/badge/Lighthouse_Performance-100%25-brightgreen)](https://github.com/StockoL/solfaic)

**<a href="https://stockol.github.io/solfaic/" target="_blank" rel="noopener noreferrer">Live application: click here to view the deployed site on GitHub Pages</a>**

Solfaic is an interactive web application designed to isolate and build rhythmic dictation and metric internalisation through a pedagogical progressive "ladder". It adheres to a core tenet of music theory education: a foundation in structural rhythm processing must be developed before pitch in the understanding of melody.

The underlying software architecture is intentionally decoupled and extensible. It's built as a standalone module ready to support a future Solfège pitch-training framework without structural rewrites.

### Repository Structure

This project separates three kinds of file, each in its own top-level folder.

`src/` holds authored source code (CSS and JavaScript). This is the actual project; everything here is hand-written, reviewed, and version-controlled as the primary artifact. The convention follows Andy Bell's own CUBE CSS methodology, the architecture this project's CSS is built on, which uses `src/` for exactly this purpose.

`dist/` holds generated build output (bundled, minified CSS/JS), assembled by `npm run build`. It is never edited directly and never committed. It's regenerated from `src/` on every deploy and is what actually gets deployed.

`assets/` holds static, unprocessed media: the favicon, self-hosted font files, and similar. Nothing here is authored logic; everything here is a binary or static resource referenced by the built site.

If you're used to a convention where stylesheets and scripts live directly in `assets/`, note that this project draws a firm distinction between _authored source_ (`src/`) and _static media_ (`assets/`) instead, following the same CUBE CSS convention the rest of this codebase is built on.

---

## <a name="top"></a>Table of Contents

1. [Project Purpose & User Stories](#purpose)
   - [The Examination/Audition Candidate](#purpose-examination-candidate)
   - [The Music Educator (The Facilitator)](#purpose-music-educator)
   - [The Kodály Practitioner (Movable-Do Focus)](#purpose-kodaly-practitioner)
   - [The Accessibility-Conscious User](#purpose-accessibility-user)
2. [Strategic Research](#research)
   - [Teoria (The Desktop Maestro)](#research-teoria)
   - [freeCodeCamp Drum Machine](#research-freecodecamp)
   - [LooseLeaf-ui (Prior Personal Design System)](#research-looseleaf-ui)
   - [Andy Bell's CUBE CSS Methodology](#research-cube-css)
   - [Phoenix Collective / British Kodály Academy](#research-phoenix-collective)
3. [UX Design Strategy (The 5 Planes)](#ux-strategy). Full doc: [`docs/ux-design-strategy.md`](./docs/ux-design-strategy.md)
4. [System Architecture & Logic Maps](#architecture). Full doc: [`docs/architecture.md`](./docs/architecture.md)
5. [Core Features & UI Overhauls](#features). Full doc: [`docs/features.md`](./docs/features.md)
6. [Deployment Guide](#deployment)
   - [Build Step](#deployment-build-step)
   - [Deployment Steps](#deployment-steps)
   - [Local Deployment (Cloning)](#deployment-local)
   - [Quick Local Spin-Up Alternatives](#deployment-quick-spinup)
   - [Quick Start](#deployment-quick-start)
   - [Deployment Verification](#deployment-verification)
   - [Release Checklist](#deployment-release-checklist)
7. [Credits & Acknowledgements](#credits)
   - [AI Pair Programming & Academic Integrity](#credits-ai-pair-programming)
   - [Technologies Used](#credits-technologies-used)
   - [Repository Structural Layout](#credits-repository-layout)
8. [Development Log & Engineering Phases](#dev-log). Full doc: [`docs/development-log.md`](./docs/development-log.md)
9. [Testing & Quality Assurance Portfolio](#testing). Full doc: [`docs/testing.md`](./docs/testing.md)
10. [Legacy: Version 1](#legacy)

---

## 1. <a name="purpose"></a>Project Purpose & User Stories

### 1. <a name="purpose-examination-candidate"></a>The Examination/Audition Candidate

_Focus: precision, pressure-testing, and structural success._

- **User Story:** As an aural examination applicant, I want to practise identifying rhythmic motifs and melodic solfège patterns within a structured progression so that I can build the metric accuracy required for my upcoming entrance test.
  - _Acceptance Criterion:_ The user is presented with generated exercises combining rhythm and pitch (movable-do), increasing in complexity across Levels 1 to 4, with the underlying curriculum data modelled through Level 9 for future implementation.

- **User Story:** As a music student, I want to receive immediate, specific diagnostic feedback when I submit an incorrect answer, so that I don't rehearse the wrong pattern into long-term memory.
  - _Acceptance Criterion (BDD):_ **Given** the user has submitted an incorrect rhythm or pitch sequence, **When** the system evaluates the response against the target, **Then** only the incorrect elements shake (not the whole board), and a diagnostic modal names the specific mistake: the rhythm to practise, or, for pitch errors, the actual interval that needs work, shown as the two notes involved.

- **User Story:** As a candidate simulating exam conditions, I want a strict, fresh limit on audio playbacks for each phase of an exercise, so that I rely on internal memory rather than continuous looping.
  - _Acceptance Criterion:_ Each exercise is dictated in two passes: rhythm, then solfège over the same confirmed rhythm. Each phase carries its own independent 3-play budget rather than a shared one.

### 2. <a name="purpose-music-educator"></a>The Music Educator (The Facilitator)

_Focus: pedagogy, motif-based learning, and consistency._

- **User Story:** As a music teacher, I want my students to practise with real pedagogical motifs, both rhythmic and melodic, rather than arbitrary generated content, so that training mirrors real repertoire and follows an authentic Kodály sequence.
  - _Acceptance Criterion:_ Rhythm and pitch content are drawn from curated motif/toneset libraries and combined using weighted Markov transition logic modelled on real melodic and rhythmic tendencies, not uniform randomness.

- **User Story:** As a teacher recommending a practice tool, I want the app to function cleanly across device sizes, so that students can train efficiently anywhere.
  - _Acceptance Criterion:_ The layout follows the CUBE CSS methodology (Composition, Utility, Block, Exception). Intrinsic layout primitives (Cluster, Switcher, Grid, Reel, Spread, and others) govern responsive behaviour without device-specific breakpoint hacks.

### 3. <a name="purpose-kodaly-practitioner"></a>The Kodály Practitioner (Movable-Do Focus)

_Focus: developing genuine relative pitch through movable-do practice, independent of any single fixed key._

- **User Story:** As a self-directed learner without a teacher present, I want the app to teach me the Kodály solfège syllables and their relationships before testing me, so that I can build foundational knowledge independently.
  - _Acceptance Criterion:_ The Classroom page provides per-level guides, real generated notation (Presentation), and hands-on drills (Practice) covering tonesets, intervals, and rhythm content, browsable independently of the Practice Room's testing environment.

- **User Story:** As a student developing relative pitch, I want each exercise generated in a randomly-chosen key, so that I learn to recognise pitch relationships rather than memorising fixed absolute pitches.
  - _Acceptance Criterion:_ No two consecutive exercises are guaranteed to share the same key. Each resolves independently to one of a curated set of comfortable, singable starting pitches.

- **User Story:** As a learner distinguishing similar-sounding intervals, I want visual reinforcement of pitch relationships, so that colour becomes a secondary memory aid alongside my ear.
  - _Acceptance Criterion:_ Each solfège syllable is represented by its own distinct, consistent colour throughout the app, following the traditional convention of colour-coded solfège teaching.

### 4. <a name="purpose-accessibility-user"></a>The Accessibility-Conscious User

_Focus: legibility, keyboard operability, and assistive-technology compatibility as first-class requirements, not an afterthought._

- **User Story:** As a user relying on sufficient colour contrast, I want every text-bearing coloured surface (buttons, badges, links, solfège cards) to remain legible regardless of my vision.
  - _Acceptance Criterion:_ Every interactive colour meets WCAG AA's 4.5:1 minimum contrast standard against its paired text. Purely decorative elements, such as the homepage's background animation, are exempt by design, since no text is ever placed on top of them.

- **User Story:** As a keyboard-only user, I want every interactive element (modals, dropdowns, the level selector, the workspace) fully operable without a mouse.
  - _Acceptance Criterion:_ Every modal is fully dismissible and focus-trapped without a mouse, and every interactive element carries a consistent, visible focus state throughout the app.

- **User Story:** As a screen-reader user, I want page structure conveyed through real semantics, not purely visual cues, so that assistive technology can navigate the app accurately.
  - _Acceptance Criterion:_ Semantic HTML and ARIA labelling are used consistently across all interactive components.

<p align="right">(<a href="#top">Back to top</a>)</p>

## 2. <a name="research"></a>Strategic Research

### 1. <a name="research-teoria"></a>Teoria (The Desktop Maestro)

- **The High Note (what works):** Excellent functional patterns for customisation. Allowing users to "register" their own practice session (intervals vs scales) mirrors how a choir director selects a specific warm-up.
- **The Flat Note (what fails):** Poor intrinsic responsiveness. It lacks the layout axioms required for modern web apps, and specifically doesn't handle the "narrow context" of mobile viewports well, leading to a fragmented user experience.
- **Innovation:** The Switcher pattern this inspired is now one of ten intrinsic layout primitives in Solfaic's full CUBE Compositions library, rather than a single borrowed technique. Selection pads still cascade from wide desktop columns to thumb-friendly mobile blocks with zero device-specific breakpoints.

### 2. <a name="research-freecodecamp"></a>freeCodeCamp Drum Machine (The Audio Interface Scaffolding)

- **The High Note (what works):** An exceptional structural blueprint for mapping client-side interactive buttons to instantaneous audio sampler buffer responses and tracking active UI states cleanly.
- **The Flat Note (what fails):** An entirely reactive architecture, lacking any system for scheduled timing grids, automated timeline sequence loops, or objective entry validation.
- **Innovation:** Solfaic isolates the interactive audio pad mechanism of a drum machine but steps it up into a scheduled timeline matrix, now extended beyond rhythm alone to resolve real pitches via movable-do, feeding a dual rhythm-and-pitch timeline into deterministic evaluation processors.

### 3. <a name="research-looseleaf-ui"></a>LooseLeaf-ui (Prior Personal Design System)

- **The High Note (what works):** A pre-existing, dependency-free CUBE CSS starter system, already built with a working JSON-to-CSS token pipeline and a reusable library of layout compositions and visual blocks.
- **The Flat Note (what fails):** Generic component naming and default token semantics didn't transfer directly. `surface-base`, for instance, meant "a component's own background" in the source system but needed to mean "the page background" in Solfaic's specific token structure, and several default values (a placeholder blue/purple palette) needed replacing with Solfaic's actual brand.
- **Innovation:** Adapted rather than adopted wholesale: the same architecture and pipeline, with every token and component selector reconciled against Solfaic's specific palette, semantics, and DOM structure before use.

### 4. <a name="research-cube-css"></a>Andy Bell's CUBE CSS Methodology

- **The High Note (what works):** Resolves the "utility-first vs. semantic CSS" debate by cleanly separating macro-layout (Composition) from visual identity (Block), keeping cascade specificity flat via native CSS layers rather than specificity wars.
- **The Flat Note (what fails):** Doesn't prescribe what to do when no existing layout primitive genuinely fits a project-specific need.
- **Innovation:** Where a real gap existed (a header needing space-between behaviour no existing primitive provided, a workspace grid needing fixed-size rather than stretching columns), a new primitive or dedicated component was added rather than forcing an ill-fitting one to stretch to cover it.

### 5. <a name="research-phoenix-collective"></a>Phoenix Collective / British Kodály Academy Musicianship Syllabus (Cyrilla Rowsell)

- **The High Note (what works):** A real, professionally-authored progression across 10 levels, giving the melodic engine genuine pedagogical grounding instead of an invented difficulty curve.
- **The Flat Note (what fails):** Written for live teaching (staff notation, ensemble singing, improvisation, work with a piano partner), most of which has no equivalent in an automated, solo dictation engine.
- **Innovation:** Only the generative content (tonesets, cadence targets, rhythm vocabulary, metres) was extracted from the syllabus and modelled as structured data (weighted tonesets and Markov transition tables), deliberately excluding everything that isn't reducible to "generate it, then have the student identify it."

<p align="right">(<a href="#top">Back to top</a>)</p>

## 3. <a name="ux-strategy"></a>UX Design Strategy (The 5 Planes)

Solfaic's UX rests on five deliberately re-examined planes: Strategy, Scope, Structure, Skeleton, and Surface, each building on the last, plus a documented planning-to-shipped-app trail and a catalogue of the app's specific pedagogical whimsy (colour-coded solfège, the pushable CTA, the ambient hero animation, and more).

**Full breakdown:** [`docs/ux-design-strategy.md`](./docs/ux-design-strategy.md)

<p align="right">(<a href="#top">Back to top</a>)</p>

## 4. <a name="architecture"></a>System Architecture & Logic Maps

Solfaic V2 separates cleanly into a JavaScript engine layer (the dual rhythm/melodic Markov-based generators, extended with a movable-do resolution bridge) and a CUBE CSS presentation layer (four native cascade layers: Reset, Global, Compositions, Blocks, Utilities). The two-phase evaluation flow and the full generative pipeline, from curriculum data through to rendered workspace, are diagrammed in detail in the full doc.

**Full breakdown:** [`docs/architecture.md`](./docs/architecture.md)

<p align="right">(<a href="#top">Back to top</a>)</p>

## 5. <a name="features"></a>Core Features & UI Overhauls

Twenty features and UI overhauls new in V2, each illustrated with a screenshot. Headline items include the Melodic Engine's two-phase rhythm-then-pitch dictation, the metre-aware self-aligning workspace, movable-do playback, escalating diagnostic feedback, and the Classroom's Preparation/Presentation/Practice tab restructure (Presentation, Rhythm Workshop, Melodic Workshop, Example, and Interval Detective).

**Full breakdown:** [`docs/features.md`](./docs/features.md)

<p align="right">(<a href="#top">Back to top</a>)</p>

## 6. <a name="deployment"></a>Deployment Guide

This project was developed using Git version control and is hosted on GitHub. It has been deployed as a live web application using GitHub Pages, built and published automatically by GitHub Actions on every push to `main`.

### <a name="deployment-build-step"></a>Build Step

`npm run build` runs the full pipeline in order and is the only command that needs to be remembered.

1. `build:tokens` reads `design-tokens.json` and generates `src/css/global/variables.css`.
2. `build:fonts` reads the self-hosted `.woff2` files in `assets/fonts/` and generates `src/css/global/font-faces.css` (see the font self-hosting recipe in [Testing & QA](./docs/testing.md#4-lighthouse-scores)).
3. `build:css` runs `build-css.js`, which concatenates each page's `@import` chain (`index.css` and `src/css/entries/*.css`) into `src/css/*-bundle.css`, preserving `@layer` order exactly.
4. `build:js` runs `build-js.js`, which bundles and minifies each page's JS entry point (`home-entry.js`, `classroom-entry.js`, `app.js`) via esbuild into `dist/js/*.min.js`.
5. `build:dist` runs `build-dist.js`, which assembles the actual deployable folder: copies `assets/` into `dist/assets/`, minifies the already-bundled CSS into `dist/css/*.min.css`, and copies each HTML page into `dist/` with its `<link>`/`<script>` tags rewritten to the minified `dist/` paths.

Only `dist/` is ever deployed. It's git-ignored, never committed, and always rebuilt fresh. Local development and the test suite never need `dist/` at all: `src/js/*.js` stays genuinely unbundled (loaded directly as native ES modules), which is what the Playwright suite's `page.evaluate(() => import("/src/js/..."))` calls rely on to intercept the app's real, live module instances. Running `npm run build:tokens && npm run build:fonts && npm run build:css` is enough for local serving/testing; `build:js`/`build:dist` only matter for a deploy build.

### <a name="deployment-steps"></a>Deployment Steps

Deployment is automatic once configured. `.github/workflows/deploy.yml` runs `npm run build` and publishes `dist/` via `actions/deploy-pages` on every push to `main`. Two more workflows gate that push before deploy.yml ever runs: `playwright.yml` runs the full 210-test suite, and `ci.yml` runs `npm run lint` followed by `npm run build` — added after a build that passed clean locally on Windows still failed on the Ubuntu runner (see [Development Log](./docs/development-log.md#notable-bugs-caught--fixed)), so a broken build now fails loudly in its own gate rather than silently inside deploy.yml. There is one manual, one-time step:

1. **Repository Access:** Click on the Settings tab located in the repository's main navigation bar.
2. **Pages Configuration:** In the left-hand sidebar, click on Pages.
3. **Source Selection:** Set the "Source" dropdown to GitHub Actions (not "Deploy from a branch").
4. **Live Link:** Appears at the top of the settings page after the first workflow run completes.

From this point on, pushing to `main` alone triggers a build-and-deploy. Nothing needs to be built or committed locally for a release.

### <a name="deployment-local"></a>Local Deployment (Cloning)

1. Navigate to the GitHub repository and click the green `<> Code` button to copy the HTTPS URL.
2. Open your terminal and run: git clone `https://github.com/StockoL/solfaic.git`
3. Run `npm install`, then `npm run build:tokens && npm run build:fonts && npm run build:css` before doing anything else.
4. Serve the project through a real local server. This is no longer optional for a second, more fundamental reason than V1's Web Audio permissions requirement: V2's JavaScript is loaded via ES modules (`<script type="module">`), which fail outright over the `file://` protocol regardless of audio permissions. Opening `index.html` by double-clicking it will not work at all.

### <a name="deployment-quick-spinup"></a>Quick Local Spin-Up Alternatives

From the cloned root directory, after completing the Build Step above:

- **Node.js (via npx):** `npx static-server` or `npx http-server`
- **Python 3.x:** `python -m http.server 8000`
- **VS Code:** the Live Server extension remains the simplest option for active development

### <a name="deployment-quick-start"></a>Quick Start

The fastest path from a fresh clone to a running, linted, tested build:

```bash
npm install
npm run build:tokens && npm run build:fonts && npm run build:css
npx http-server -p 8080          # or any static server, see above
npm run lint
npm test                          # see "Running the Suite Locally" below for details
```

To produce and inspect an actual deploy build locally:

```bash
npm run build                     # full pipeline, writes dist/
npx http-server dist -p 8081      # serve the deploy build itself
```

### <a name="deployment-verification"></a>Deployment Verification

| Item                                | Status                | Notes                                                                                                                                        |
| ------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Live URL reachable                   | Verified 2026-07-21 | `https://stockol.github.io/solfaic/` returns `200 OK`, `Content-Encoding: gzip`, matching the compression note in the Lighthouse section above. |
| Deploy workflow succeeded            | Checked each release — last green run 2026-07-22 | Check the Actions tab for a green run of `deploy.yml` after pushing to `main`. No local build/commit step needed first. The first-ever run of this workflow actually failed; see [Development Log](./docs/development-log.md#notable-bugs-caught--fixed) for the investigation and fix. |
| Cross-browser spot check (desktop)   | Pending              | Load the deployed URL itself (not just localhost) in Chrome, Firefox, and Safari.                                                              |
| Cross-device spot check (mobile)     | Pending              | At least one real iOS and one real Android device against the deployed URL. This is also where the iPhone grid bug ([Known Issues](./docs/testing.md#known-issues)) would need chasing directly. |

### <a name="deployment-release-checklist"></a>Release Checklist

Before shipping a new version:

1. `npm run lint` must exit clean.
2. `npm run verify:engine` must report 0 failures.
3. `npm test` must pass in full, all 5 browser/device projects.
4. `npm run build` must complete cleanly end-to-end. There's no need to commit `dist/`; it's rebuilt by CI on push.
5. Push to `main` and confirm the `deploy.yml` workflow run succeeds (see Deployment Verification above).
6. Update the Development Log with anything notable from this release.

<p align="right">(<a href="#top">Back to top</a>)</p>

## 7. <a name="credits"></a>Credits & Acknowledgements

- **Tone.js (v14):** External framework used to script the transport sequence engine scheduler, now driving both rhythm playback and movable-do pitch resolution.
- **Louis Hoebregts ([CodePen: Mamboleoo](https://codepen.io/Mamboleoo/pen/BxMQYQ)):** Source reference for the homepage's ambient hero particle-field animation concept, cited from V2's earliest planning stage.
- **Josh Comeau ("Whimsical Animations" Course):** Directly inspired the confetti celebration and pushable CTA button's spring physics, deliberately reserved for once-per-page hero moments in V2 rather than applied throughout.
- **Andy Bell (CUBE CSS Methodology):** The architectural foundation for the entire V2 presentation layer: Composition, Utility, Block, Exception, and native CSS cascade layers replacing V1's single stylesheet.
- **LooseLeaf-ui (Prior Personal Design System):** The source library for V2's Compositions and several Blocks, adapted to Solfaic's specific tokens, semantics, and DOM structure rather than used verbatim.
- **Every Layout (Heydon Pickering):** Principles of intrinsic web design that originally informed V1's layout thinking, and which LooseLeaf-ui's own Compositions are themselves built on. A lineage carried forward into V2 rather than a direct source this time.
- **Utopia.fyi:** Generated the fluid type and space scales driving V2's entire typography and spacing system.
- **Phoenix Collective (Cyrilla Rowsell) / British Kodály Academy:** Source curriculum for the melodic engine's tonesets, cadence logic, and rhythm vocabulary across all 9 modelled levels. The pedagogical backbone of the entire melodic system.
- **Google Fonts (Galindo, Poppins):** V2's typeface pairing, replacing V1's unspecified system font stack. Both distributed under the SIL Open Font License 1.1, full attribution and licensing detail in the [Lighthouse Scores](./docs/testing.md#4-lighthouse-scores) section, alongside the self-hosting process itself. The license text itself ships alongside the font files in `assets/fonts/` (`OFL-Galindo.txt`, `OFL-Poppins.txt`).

Custom vs. external code, stated plainly: every line under `src/js/` and `src/css/`, the rhythm and melodic engines, the state/view logic, the CUBE CSS architecture and design tokens, is original to this project. The one external runtime dependency is Tone.js, loaded via CDN in `classroom.html`/`practice.html` with an inline comment crediting it at the point of inclusion. Everything else listed above is a design, methodology, or pedagogical source that _informed_ the build rather than code pulled in directly.

Licensed under the [MIT License](./LICENSE).

### <a name="credits-ai-pair-programming"></a>AI Pair Programming & Academic Integrity

Artificial Intelligence (LLMs) was utilised strictly as a "Pair Programmer" and strict linter throughout the development lifecycle, to accelerate cross-browser debugging, reflow profiling, and formatting, while ensuring absolute human ownership and comprehension of the overarching engine code.

Two specific blocks in the codebase are marked `AI-Attribution` inline rather than left unmarked like the rest. As a learner, these are cases where I genuinely wouldn't have arrived at the solution unaided, and I'd rather credit that honestly than claim it as unaided work I later happened to also understand.

- **`src/js/audio.js`, inside `resolveSolfegeToNote()`:** the regex `/^([A-G][#b]?)(\d+)$/` splits a Tone.js note string like `"Eb4"` into its pitch-class letter (with optional accidental) and octave digits, in one pattern with the capture groups destructured directly. The rest of the function, converting that pitch class to a 0 to 11 chromatic index, adding the solfège syllable's semitone offset, then using `Math.floor`/modulo on the total to work out both the resulting note *and* whether it crossed an octave boundary, is the actual movable-do resolution logic. It only works because this regex hands it a clean pitch-class/octave split to begin with.
- **`src/js/core.js`, inside `resolveSolfegeColor()`:** the `color-mix(in srgb, var(--color-solfege-${above.token}) ${towardAbovePercent}%, var(--color-solfege-${below.token}) ${100 - towardAbovePercent}%)` template literal blends two solfège anchor colours. Each of the 7 diatonic syllables has a fixed colour; a chromatic syllable not among them gets its colour computed on the fly: nearest anchor below and above by semitone degree, how far between them it sits as a percentage, then handed straight to CSS's native `color-mix()` so the actual RGB blending happens in the browser's CSS engine rather than being precomputed in JS. No chromatic syllable's colour is ever hand-picked or stored; the blend is entirely degree-driven.

This is an ongoing thing, not a closed list. These are the two I've identified so far while learning to recognise this class of solution myself; more may get the same honest attribution as I find them.

### <a name="credits-technologies-used"></a>Technologies Used

- **HTML5:** Semantic, accessible markup across three purpose-built pages.
- **CSS3:** Custom properties, CSS Grid, native cascade layers (`@layer`), and `color-mix()` for the accessible palette derivation.
- **JavaScript (ES6+ Modules):** A dual-engine (rhythm + melodic) generative architecture with a fully separated state/view/engine structure.
- **Tone.js (v14):** Web Audio API synthesis and scheduling, extended for movable-do pitch resolution.
- **Node.js:** Powers the design-token compiler (`design-tokens.json` → `variables.css`).
- **Inline SVG:** Rhythm notation and solfège entry columns generated programmatically from shared duration data, rather than hand-authored per motif.
- **Git & GitHub:** Atomic commit history and cloud distribution.

### <a name="credits-repository-layout"></a>Repository Structural Layout

```text
├── .github/workflows/
│   ├── playwright.yml           # CI — runs the Playwright suite on push/PR
│   ├── ci.yml                    # CI — lint + full build on push/PR (catches a broken build before deploy.yml ever runs it)
│   └── deploy.yml                # Builds + deploys dist/ to GitHub Pages on push to main
├── LICENSE                       # MIT
├── design-tokens.json            # Single Source of Truth — colour, type, space, motion tokens
├── build-tokens.js               # Token compiler (Vanilla Node.js)
├── build-font-fallback.js        # Reads assets/fonts/*.woff2 metrics, generates font-faces.css
├── build-css.js                  # CSS bundler — concatenates each page's @import chain (Vanilla Node.js)
├── build-js.js                   # JS bundler — esbuild, one entry per page → dist/js/*.min.js
├── build-dist.js                 # Assembles dist/ — asset copy, CSS minify, HTML path rewrite
├── eslint.config.js              # ESLint flat config
├── package.json                  # Build & test commands (npm run build, verify:engine, lint, test)
│
├── index.html                    # Home
├── classroom.html                # Classroom — curriculum reference & level guides
├── practice.html                 # Practice Room — the dictation engine itself
├── 404.html                      # GitHub Pages fallback
│
├── assets/                       # Static, unprocessed media — never authored logic
│   ├── fonts/                    # Self-hosted .woff2 files + their OFL licenses
│   └── media/                    # Favicon and similar
│
├── dist/                         # Generated deploy build (git-ignored) — assembled by npm run build
│
├── docs/
│   ├── ux-design-strategy.md     # Full UX Design Strategy (5 Planes) writeup
│   ├── architecture.md           # Full System Architecture & Logic Maps writeup
│   ├── features.md               # Full Core Features & UI Overhauls writeup
│   ├── development-log.md        # Full Development Log & Engineering Phases writeup
│   ├── testing.md                # Full Testing & QA Portfolio writeup
│   ├── wireframes/                # Initial UI concepts
│   ├── architecturemaps/          # Early Mermaid flowcharts from initial project conception
│   ├── screenshots/                # UI captures referenced throughout the docs
│   └── animations/                 # Confetti / frustration-shake source clips
│
├── tests/
│   ├── engine-verification.mjs   # Node harness — pure-function engine checks (npm run verify:engine)
│   └── solfaic.spec.js            # Playwright E2E suite
├── playwright.config.js          # 5 browser/device projects (Chromium, WebKit, Firefox, Mobile Chrome, Mobile Safari)
│
└── src/
    ├── css/
    │   ├── index.css            # Orchestrator — declares the cascade layer order, dev-time source of truth
    │   ├── entries/               # Page-specific @import chains (home, classroom, practice)
    │   ├── *-bundle.css            # Auto-generated by build-css.js — what the HTML actually links to
    │   ├── global/                 # Reset, base typography, auto-generated variables.css + font-faces.css
    │   ├── compositions/           # 10 layout primitives (Cluster, Spread, Grid, Reel...)
    │   ├── blocks/                  # Visual components (Button, Nav, Accordion, Modal...)
    │   └── utilities/                # Single-purpose overrides
    │
    └── js/
        ├── app.js                # Practice Room event wiring & bootstrap
        ├── home-entry.js          # Home page's own lightweight entry
        ├── classroom-entry.js     # Classroom page's own lightweight entry
        ├── core.js                # DOM rendering (view layer)
        ├── engine.js              # Rhythm + melodic generation (pure functions)
        ├── data.js                # Motif library, curriculum data, design tokens' JS counterpart
        ├── audio.js               # Tone.js playback, movable-do resolution
        ├── state.js               # Single source of truth for session state
        └── rhythm-notation.js     # Generates rhythm SVG + solfège columns from shared data
```

<p align="right">(<a href="#top">Back to top</a>)</p>

## 8. <a name="dev-log"></a>Development Log & Engineering Phases

V2's build ran across seven phases: rhythm engine extension, the melodic engine and movable-do bridge, the CUBE CSS rebuild and accessible-palette rollout, two-phase workspace rendering, test harness build-out, the Classroom content sprint, and Classroom refinement. That's followed by a full catalogue of notable bugs caught and fixed along the way, several of them the same underlying class of asynchronous shared-state timing problem surfacing in different places.

**Full breakdown:** [`docs/development-log.md`](./docs/development-log.md)

<p align="right">(<a href="#top">Back to top</a>)</p>

## 9. <a name="testing"></a>Testing & Quality Assurance Portfolio

The full verification portfolio: why Playwright over Jest, the Node engine harness, the 5-browser/device Playwright suite (160/160 passing), the outstanding manual testing matrix, four measured Lighthouse passes (each investigated from a real finding, not guessed at), browser-compatibility and validator results, and a running list of known issues.

**Full breakdown:** [`docs/testing.md`](./docs/testing.md)

<p align="right">(<a href="#top">Back to top</a>)</p>

## 10. <a name="legacy"></a>Legacy: Version 1

Everything above describes V2. V1, in its own words, was "an interactive web application designed to isolate and build rhythmic dictation and metric internalisation through a pedagogical progressive 'ladder'": a single-page, rhythm-only dictation tool, built as a deliberately decoupled module so a future pitch-training layer (V2's melodic engine) could be added without a structural rewrite.

The complete V1 README is preserved (lightly reformatted for consistency with the rest of this documentation; content unchanged): **[docs/README-v1-archive.md](./docs/README-v1-archive.md)**.

A few of its original design and QA artefacts:

![Initial desktop wireframe for V1's single-page level view](./docs/wireframes/solfaic-wireframe-level-view-desktop.png)
_The earliest desktop concept for V1's level-select and dictation view, before the three-page V2 restructure._

![Initial mobile wireframe for V1's performance/workspace view](./docs/wireframes/solfaic-wireframe-performance-view-mobile.png)
_The earliest sketch of the rhythm workspace itself, stacked for mobile._

![V1's shipped desktop dashboard, showing the dual-column curriculum reference and rhythm workspace](./docs/screenshots/desktop_dashboard_screenshot.png)
_What that concept looked like once built: V1's final single-page layout, since replaced by V2's Home/Classroom/Practice Room split._

<p align="right">(<a href="#top">Back to top</a>)</p>
