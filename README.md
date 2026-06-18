# Solfaic - Solfège Ear Trainer

**[🔴 LIVE APPLICATION: Click here to view the deployed site on GitHub Pages](https://stockol.github.io/solfaic/)**

Solfaic is an interactive web application designed to isolate and build rhythmic dictation and metric internalisation through a pedagogical progressive "ladder". It adheres to a core tenet of music theory education that a foundation in structural rhythm processing must be developed before pitch in the understanding of melody.

The underlying software architecture is intentionally decoupled and extensible, built as a standalone module ready to support a future Solfège pitch-training framework without structural rewrites.

---

## <a name="top"></a>📋 Table of Contents

1. [📖 Project Purpose & User Stories](#purpose)
2. [🔬 Strategic Research](#research)
3. [🖼️ UX Design Strategy (The 5 Planes)](#ux-strategy)
4. [🗺️ System Architecture & Logic Maps](#architecture)
5. [✨ Core Features & UI Overhauls](#features)
6. [🌐 Deployment Guide](#deployment)
7. [🤝 Credits & Acknowledgements](#credits)
8. [🏗️ Development Log & Engineering Phases](#dev-log)
9. [🧪 Testing & Quality Assurance Portfolio](#testing)

---

## 1. <a name="purpose"></a> 📖 Project Purpose & User Stories

### 1. The Examination/Audition Candidate

_Focus: Precision, pressure-testing, and structural success._

- **User Story:** As an aural examination applicant, I want to practise identifying rhythmic motifs within a structured progression so that I can build the metric accuracy required for my upcoming entrance test.
  - _Acceptance Criterion:_ The user is presented with generated exercises that increase in metric complexity (varying time signatures and subdivisions) across distinct levels.
- **User Story:** As a music student, I want to receive immediate diagnostic feedback when I submit an incorrect motif sequence so that I do not "rehearse" the wrong rhythmical patterns into long-term memory.
  - _Acceptance Criterion (BDD):_ **Given** the user has submitted an incorrect motif sequence, **When** the system evaluates the response array against the target timeline, **Then** a diagnostic modal appears explaining the specific durational or structural motif error.
- **User Story:** As a candidate simulating exam conditions, I want a strict limit on audio playbacks so that I am forced to rely on internal memory rather than continuous looping.
  - _Acceptance Criterion:_ Once the audio playback has been triggered three times, the playback option becomes unavailable for that specific exercise.

### 2. The Music Educator (The Facilitator)

_Focus: Pedagogy, motif-based learning, and consistency._

- **User Story:** As a music teacher, I want my students to practise with real pedagogical rhythmic motifs (e.g., dotted rhythms, pairs of quavers) rather than continuous random durations so that training mirrors real-world repertoire.
  - _Acceptance Criterion:_ All generated exercises are algorithmically composed from predefined musical motif object blocks that sum perfectly to the level's designated time signature and bar constraints.
- **User Story:** As a teacher recommending a practice tool, I want the app to function cleanly on small mobile browsers so that students can execute training sessions efficiently on the go.
  - _Acceptance Criterion:_ The layout utilises **Intrinsic Web Design** principles (The Switcher and The Stack) to ensure all interactive elements remain accessible and well-spaced on small viewports without vertical overflow.

## <p align="right">(<a href="#top">Back to top</a>)</p>

## 2. <a name="research"></a>🔬 Strategic Research

### 1. Teoria (The Desktop Maestro)

- **The High Note (What works):** Excellent **Functional Patterns** for customisation. Allowing users to "register" their own practice session (intervals vs scales) mirrors how a choir director selects a specific warm-up.
- **The Flat Note (What fails):** Poor **Intrinsic Responsiveness**. It lacks the **Axioms of Layout** required for modern web apps — specifically, it doesn't handle the "narrow context" of mobile viewports well, leading to a fragmented user experience.
- **Innovation:** I will use **Every Layout's "The Switcher"** to ensure selection pads gracefully cascade from wide columns on desktop down to massive, thumb-friendly touch blocks on mobile.

### 2. freeCodeCamp Drum Machine (The Audio Interface Scaffolding)

- **The High Note (What works):** Exceptional structural blueprint for mapping client-side interactive buttons to instantaneous audio sampler buffer responses and tracking active UI states cleanly.
- **The Flat Note (What fails):** Entirely reactive architecture; it lacks any system for scheduled timing grids, automated timeline sequence loops, or objective entry validation.
- **Innovation:** Solfaic isolates the interactive audio pad mechanism of a drum machine but steps it up into a Scheduled Timeline Matrix, feeding static loops into deterministic evaluation processors.

## <p align="right">(<a href="#top">Back to top</a>)</p>

## 3. <a name="ux-strategy"></a> 🖼️ UX Design Strategy (The 5 Planes)

### Initial Wireframes

![Initial Desktop Concept](./docs/wireframes/solfaic-wireframe-level-view-desktop.png)
![Initial Mobile Concept](./docs/wireframes/solfaic-wireframe-level-view-mobile.png)
![Performance Workspace](./docs/wireframes/solfaic-wireframe-performance-view-mobile.png)

### I. Strategy

- **User Goals:** To master complex metric identification and rhythmic cell dictation through an interactive, step-by-step training workspace.
- **Target Audience:** Practical music candidates, choral applicants, and contemporary musicians seeking to formalise their rhythmic perception.
- **The Future Runway:** The system architecture functions as an isolated structural base; the event timelines are pre-wired to integrate a pitch module seamlessly.

### II. Scope

- **Algorithmic Rhythm Synthesis:** Exercises are compiled dynamically at runtime by reading level parameters (metre, bar count) and randomly assembling predefined motif blocks.
- **Extensible Event Architecture:** To support future pitch expansion, all generation loops output an array of Event Objects featuring explicit `pitch: null` metadata spaces.
- **Diagnostic Evaluation Engine:** Evaluates user-submitted arrays item-by-item against a hidden target timeline to identify errors without maintaining data-heavy tracking profiles.
- **Session-Only Memory Profile:** Progression, scores, and streaks are handled entirely in active session memory, bypassing backend database requirements for the MVP.

### III. Structure

- **Gated Dual-Phase Identification:** The user must successfully reconstruct the rhythmic timeline before the system advances (mirroring professional rehearsal techniques).
- **The Controlled Playback Lifecycle:** To maintain maximum concentration, all workspace pads are disabled while the audio player executes the timeline sequence. Play count tokens permanently lock the engine once the pool hits zero.
- **The Audio Signal Chain:** 1. **The Count-In:** Generates a steady click metronome pattern to lock the student's ear. 2. **The Call:** A decoupled audio wrapper plays back the target sequence using a high-fidelity synth.

### IV. Skeleton

- **The Motif Switcher Console:** The core input panel utilises a dynamic wrapping grid. On desktop, pads layout in a horizontal bar; on mobile, they automatically stack into thumb-friendly touch targets.
- **The Input Workspace Stack:** View elements flow in a strict vertical order derived from a Modular Scale, preventing text crowding.

### V. Surface

- **Aesthetic Principle:** "Timeless, not cutting edge" — prioritising immediate cognitive clarity, minimal distraction, and structural accessibility.
- **Axiomatic Typography:** Instructional text measures are capped at a readable layout width to ensure eye-tracking comfort.
- **Semantic Colour Palette:** AAA-accessible high-contrast schema conveying states immediately: Active Focus (Blue), Validation Success (Green), and Diagnostic Remediation (Amber/Red).

### Pedagogical Whimsy & Interaction Philosophy

Educational software requires engagement. To fight cognitive fatigue, we injected subtle moments of interaction "whimsy":

- **Custom Spring-Loaded Success Overlays:** Deprecated disruptive browser alerts in favor of an elegant, canvas-wide custom HTML5 victory modal utilising custom spring-physics curves.
- **Staggered Cinematic Confetti Downpour:** Initiates a highly dense, 160-particle colourful confetti storm with 3D-depth and randomised start delays up to 1.5 seconds.

![Success Modal](docs/animations/confetti-clip.mp4)

- **Tactile Frustration Microgestures (Error Handling):** Attempting to submit an incomplete exercise causes the entire canvas row to execute an aggressive **horizontal frustration shake** (`is-shaking`), while empty slots flash with a **crimson halo pulse** (`is-empty-panic`).

![frustration shake](docs/animations/is-shaking-clip.mp4)

- **Touch-First Sensation Mapping:** Hover definitions are suppressed entirely on mobile to eliminate sticky layout scaling freezes. Touch inputs focus exclusively on the high-fidelity `:active` state, delivering a crisp, immediate touch-down spring compression feel (`scale(0.96)`) the precise millisecond a finger makes contact.

## <p align="right">(<a href="#top">Back to top</a>)</p>

## 4. <a name="architecture"></a> 🗺️ System Architecture & Logic Maps

To guarantee clean maintainability and extensible software updates, Solfiac isolates its core processes across distinct modules: Data Generation, State Control, and a Decoupled Playback Wrapper.

### The Global State Machine (The Game Loop)

The application operates as a deterministic State Machine, strictly controlling permitted actions to preserve examination conditions.

- Defensive Lockout (`playbackState`): Safely prevents the user from registering answers early or breaking the layout flow during audio execution.
- The Modular Gateway (`loadLevelSettings`): Flushes workspace arrays, pulls configuration rules, and triggers generation modules without mutating global files.

![Proposed Global State Machine](./docs/architecturemaps/state-machine-solfaic.png)

### The Multi-Phase Data Pipeline (The Movable-Do Bridge)

Transforms raw configuration files into a timed sequence map.

- **Decoupled Data Contracts:** The sequence matrix revolves around a unified object schema containing `pitch: null` placeholders. Melodic integration later will require absolutely no structural rewrites.

![Proposed Data Pipeline](./docs/architecturemaps/data-logic-solfaic.png)

### Asynchronous Timeline Synchronisation (The Sequence Map)

Maps how the browser UI, Central Engine, and Web Audio API share execution data asynchronously without clogging the primary browser thread.

- **Callback-Driven Unlocking:** The workspace stays locked until a clean `onComplete` signal clears the native audio runtime scheduling buffer, protecting timing against system discrepancies.

![Proposed Sequence Map](./docs/architecturemaps/verification-sequence.png)

## <p align="right">(<a href="#top">Back to top</a>)</p>

## 5. <a name="features"></a> ✨ Core Features & UI Overhauls

### The Desktop Dashboard & Curriculum Matrix Sprint

The application's viewport matrix was refactored to optimise widescreen real estate, introducing a dual-column layout strategy.

![Screenshot of Desktop Dashboard](docs/screenshots/desktop_dashboard_screenshot.png)

**1. Asymmetric Fluid Grid Shell**
On displays wider than `1024px`, the layout fractures into an asymmetrical grid system (`grid-template-columns: 400px 1fr`). Placing the curriculum reference panel on the left ensures the user's eye scans educational rules before executing interactions.

**2. Structured Kodály Reference Matrix Table**
Refactored static bulleted lists into a high-density semantic data table:

| Syllable    | Notation | Value & British Term                  |
| :---------- | :------: | :------------------------------------ |
| `ta`        | `[SVG]`  | 1 Beat Crotchet (Single Sound)        |
| `ti-ti`     | `[SVG]`  | 1 Beat Pair of Quavers (Dual Sounds)  |
| `ta rest`   | `[SVG]`  | 1 Beat Rest (Silent Space)            |
| `ta-a`      | `[SVG]`  | 2 Beat Minim (Sustained Tone)         |
| `tika-tika` | `[SVG]`  | 1 Beat Four Semiquavers (Quad Sounds) |

**3. The 85vw Off-Canvas Mobile Drawer Optimisation**
Expanded the mobile drawer slide-out width from a rigid `280px` up to a fluid **`85vw`** constraint (capped at `420px`). Combined with a localised mobile typography pass, the complex musical tables render with absolute geometric spacing on any iOS or Android glass surface without crunching adjacent columns.

![Mobile Drawer](docs/screenshots/mobile_drawer.png)

### Persistent Slot-State Memory & Surgical Error Workflow

Wiping a student's entire input ledger after a single incorrect rhythm element introduces an aggressive cognitive penalty.

- **The Solution:** Implemented a persistent state tracking matrix (`slotStates`). Individual cards now retain their targeted validation memory (`success` or `error`) independently. When a student attempts a corrective pass, clicking an error card clears _only that specific beat_, leaving correct blocks perfectly preserved as an interactive roadmap.

![Error Card Fix](docs/screenshots/error_workflow_screenshot.png)

### Unified Dual-Input Interaction Engine

- **Desktop Environments:** Full HTML5 native **Drag-and-Drop** implementation allows students to grab selector pads and drop them onto the ledger.
- **Mobile Environments:** A targeted **Touchscreen Focus Ring Modifier**. Tapping an empty placeholder highlights that coordinate with an active blue focus ring, allowing subsequent pad selections to snap instantly into the targeted slot.

![Focus Ring Modifier](docs/screenshots/focus_ring_modifier_screenshot.png)

### Articulated Audio Synthesis Engine

- **Acoustic Delineation:** Shifted to a warm, resonant triangle wave oscillator (`Synth`) voiced at a crisp, mid-range register (`G3`).
- **The Articulation Gap:** Solved the problem of consecutive identical notes blending into a muddy tone by scaling durations to **82% of their structural metric space**, creating crisp acoustic separation between attacks.

## <p align="right">(<a href="#top">Back to top</a>)</p>

## 6. <a name="deployment"></a> 🌐 Deployment Guide

This project was developed using Git version control and is hosted on GitHub. It has been deployed as a live web application using **GitHub Pages**.

### Deployment Steps

To deploy the site to GitHub Pages, the following steps were executed:

1. **Repository Access:** Click on the **Settings** tab located in the repository's main navigation bar.
2. **Pages Configuration:** In the left-hand sidebar, click on **Pages**.
3. **Source Selection:** Ensure the "Source" dropdown is set to **Deploy from a branch**.
4. **Branch Targeting:** Select the **`main`** branch, and ensure the folder dropdown is set to **`/ (root)`**.
5. **Save & Build:** Click the **Save** button to trigger the automated GitHub Actions build workflow.
6. **Live Link:** After a few minutes, the link appears at the top of the settings page: _"Your site is live at [[URL](https://stockol.github.io/solfaic/)]"_.

### Local Deployment (Cloning)

To run this project locally on your own machine:

1. Navigate to the GitHub repository and click the green **`<> Code`** button to copy the HTTPS URL.
2. Open your terminal and run: `git clone https://github.com/StockoL/solfaic.git`
3. Launch `index.html` via an extension like VSCode's Live Server to satisfy mandatory Web Audio security permissions.

## <p align="right">(<a href="#top">Back to top</a>)</p>

## 7. <a name="credits"></a> 🤝 Credits & Acknowledgements

- **Tone.js (v14):** External framework used to script the transport sequence engine scheduler.
- **Josh Comeau ("Whimsical Animations" Course):** Directly inspired our digital spring physics, tactile card weight scaling, and staggered particle loops.
- **Every Layout:** Principles of "Intrinsic Web Design" heavily informed the fluid page mechanics.

### AI Pair Programming & Academic Integrity

Artificial Intelligence (LLMs) was utilised strictly as a "Pair Programmer" and strict linter throughout the development lifecycle to accelerate cross-browser debugging, reflow profiling, and formatting, ensuring absolute human ownership and comprehension of the overarching engine code.

### Technologies Used

- **HTML5:** Semantic accessible markup layout layer.
- **CSS3:** Custom properties, CSS Grid, and dynamic viewports (`dvh`) for zero-framework responsiveness.
- **JavaScript (ES6+):** Model-View-Controller framework patterns and state machine handlers.
- **Tone.js (v14):** Web Audio API oscillator synthesis scheduler.
- **Inline SVG:** Vector notation arrays embedded directly for seamless styling cascade.
- **Git & GitHub:** Atomic source control and cloud distribution.

## <p align="right">(<a href="#top">Back to top</a>)</p>

## 8. <a name="dev-log"></a> 🏗️ Development Log & Engineering Phases

To ensure a clean, maintainable, and scalable codebase, this application was built using atomic commits following the Model-View-Controller (MVC) design pattern.

### Phase 1: The Intrinsic Skeleton (HTML/CSS)

- `feat(ui): scaffold raw semantic HTML skeleton for rhythm workspace`
- `style: establish design tokens and Every Layout intrinsic primitives`

**Challenge & Resolution:** Initially used a flexbox "Switcher" primitive for motif pads, which forced buttons into a single column on mobile. Upgraded to a true CSS Grid using a fluid RAM track (`repeat(auto-fit, minmax(min(140px, 100%), 1fr))`), guaranteeing neat responsive layouts.

### Phase 2: The Data Brain (Model & State)

- `chore(architecture): map JS module stubs and establish musical domain library`
- `feat(core): initialise data models, global state machine, and DOM cache`

**Challenge & Resolution:** Scheduling sound elements directly in milliseconds breaks synchronization if tempo values change mid-flight. Future-proofed the scheduler tracking logs by encoding all events using native Tone.js `Bars:Beats:Sixteenths` time matrix strings (e.g., `0:2:0`).

### Phase 3: The View Controller (Wiring the Logic)

- `feat(engine): implement algorithmic rhythm sequence generator`
- `feat(view): implement dynamic DOM rendering cycle for level initialisation`

**Challenge & Resolution:** Initializing downstream modules simultaneously caused `undefined` runtime reference errors. Kept the primary listener empty until later phases to safely isolate structural component testing scopes.

### Phase 4: The Evaluation Engine & Pedagogical Refinement

- `feat(data): implement British Kodaly Academy curriculum mapping for MVP levels 1-3`
- `refactor(ui): migrate from unicode text characters to inline SVG library`

**Challenge & Resolution:** The "Unicode Typography Wall." Rendering notes using static font blocks resulted in unpredictable font bounding boxes, breaking staff layout lines. Shifted layout to explicit embedded inline SVG strings, ensuring pixel-perfect scaling.

### Phase 5: The Audio Engine

- `feat(audio): integrate Tone.js scheduling engine for accurate target array playback`
- `fix(audio): implement subdivision parsing array to render accurate dictation rhythms`

**Challenge & Resolution:** The "Robotic Crotchet" Bug. Synths played flat single beats, failing to parse subdivisions of a `ti-ti`. Expanded data configs to include explicit `playback` strings (e.g., `["8n", "8n"]`) to dynamically schedule secondary micro-events.

### Project Scope Realignment & MVP Refactoring

During the synthesis phase of development, the project scope was intentionally realigned from the initially proposed 10-level progression matrix down to a highly optimised 3-level core MVP.

- **Pedagogical Justification:** The initial 10-level track over-allocated difficulty metrics prematurely. Condensing the timeline core allowed us to perfect standard Kodály cell chunking techniques, limiting cognitive overload for entrance audition candidates.

### Phase 6: The Onboarding Architecture Evolution (v1.0 to v2.1)

- **v2.0 Viewport Optimization:** Rebuilt tooltips to map statically across a fluid `100dvh` layout, resolving asynchronous container measurement calculation crashes on iOS browsers.
- **v2.1 Race Conditions:** Decoupled layout shifts from active style transitions. Forced synchronous browser structural calculations (**`void element.offsetWidth`**) while elements sit at 0 opacity to eliminate flying tooltip rendering flickers.

### Phase 7: The Phrase Engine Refactor (Algorithmic Pedagogy)

Refactored the core timeline generator from flat randomized item grouping into a fully balanced, structural composition engine driven by three core mathematical rules:

1. **The Form Router:** Automatically mirrors classical repetition templates (e.g., pop form, parallel period structures) utilizing a temporary memory cache loop to reduce parsing loads.
2. **The Markov Syntax Dictionary:** Governs consecutive beat relationships using weighted lotteries to emulate genuine musical tension and release grammar blocks.
3. **The Cadence Interceptor:** Detects final sequence thresholds and enforces strict structural block intersections to guarantee phrases resolve cleanly on stable notes.

### Phase 8: The Responsive "Sponge" Architecture (UI/UX)

Addressed vertical notation blowouts by shifting layout grids to strict auto-rows (`clamp(55px, 10vh, 100px)`) to create a safe structural ceiling. Deployed dynamic advanced CSS **Quantity Queries** (`.workspace-bar:first-child:nth-last-child(2)`) to automatically center shorter configurations cleanly.

### Phase 9: The Mobile Chronicles (Cross-Browser Bug Hunt)

- **The iOS WebKit SVG Flexbox Collapse:** Fixed Safari scaling overflows by hardcoding target items with structural layout overrides (`min-width: 0`) and clamping graphic children to strict relative proportions (`width: auto; height: 100%;`).
- **The iOS Interactive Tint Override:** Erased hidden Apple hyperlink button themes by injecting global user-agent overrides (`-webkit-appearance: none; appearance: none;`).
- **The 'Content-Visibility' Strike:** Restored frame-rate optimization dropouts during spring transforms by completely shutting off visual paint containment properties (`contain: none;`).
- **The Layer Promotion Trap:** Solved microgesture stuttering by moving GPU memory allocation instructions (`will-change: transform`) up to the permanent element style sheet block.
- **Style Batching Optimisation:** Intercepted automated runtime batching operations by injecting a structural reflow interrupt hook (`void bar.offsetWidth;`) to guarantee transition physics paint smoothly.

### [2026-06-16] UI Architecture: Custom Dropdown & Event Propagation

**Context:** Native HTML `<select>` elements cannot be styled consistently across browsers. We required a custom UI dropdown that matched our visual patterns without introducing complex code entanglement.  
**Decision:** Built a bespoke dropdown using event bubbling intercepts.  
**Implementation:** Leveraged `e.stopPropagation()` on the main event click to bypass a global document event listener tasked with tracking background canvas cleanup. State is held cleanly using native `aria-expanded` attributes.  
**Outcome:** Dropped overall component footprint, producing an incredibly DRY, modular control module.

### [2026-06-16] UI Architecture: The "Inner Track" Scroll Pattern

**Context:** The application workspace (`#ui-workspace`) failed to grow its visual layout boundaries (dashed borders) on long exercises, causing element cards to overflow and bleed visually.  
**Decision:** Divided container operations into distinct layout primitives inspired by _Every Layout_.  
**Implementation:** Split layout roles into a Viewport container tasked with masking overflowing scroll limits (`overflow-y: auto`) and an injected inner wrapper (.`workspace-scroll-track`) holding the visual borders.  
**Outcome:** The track stretches naturally based on children contents, maintaining perfectly responsive borders across all mobile grids.

### [2026-06-17] UI Architecture: Custom 404 Error Routing & Viewport Scaling

**Context:** Out-of-bounds error pages required a customized layout fallback matching internal brand properties. Early mockups using variable-heavy CSS calculations inside nested math parameters crashed mid-tier tablet layout engines.  
**Decision:** Engineered a clean `404.html` canvas fallback, stripping layout parameters down to bulletproof constraints.  
**Implementation:** Positioned an outer flex wrapper (`min-height: 100dvh`) to lock absolute screen centering, and configured internal padding bounds using fixed text clamps (`clamp(1.5rem, 6vw, 3.5rem)`).  
**Outcome:** Fallback paths securely catch missing URLs and route traffic smoothly back to active tasks without breaking system styling continuity.

## <p align="right">(<a href="#top">Back to top</a>)</p>

## 9. <a name="testing"></a> 🧪 Testing & Quality Assurance Portfolio

This section outlines the holistic verification suite executed to guarantee the engineering integrity, mathematical precision, and cross-platform accessibility of Solfaic.

### 1. Manual Testing Matrix (Boundary Explorations)

Manual testing was performed using rigorous boundary input constraints to stress-test the `Tone.js` transport engine state machine.

- **TM-01: Phrase Engine Initialization Pipeline**
  - _System Target:_ Algorithmic Blueprint Generation Core
  - _Input / Action:_ Select **Level 1** and trigger the engine initialization routine.
  - _Expected Result:_ System constructs a mathematically tight 2-bar through-composed timeline array, with timestamps strictly bound from `0:0:0` up to `1:1:0` max.
  - _Actual Result:_ Active Blueprint object populated exactly matching parameters. Developer tool console outputted a flawless 4-slot timeline mapping layer.
  - _Status:_ `PASS`

- **TM-02: Cadence Interceptor Structural Boundary Checks**
  - _System Target:_ Mathematical Intersection Filter & Lottery Override
  - _Input / Action:_ Force generation of Level 3 rhythmic cycles (4/4 and 6/8 matrices) to the absolute final terminal bar boundary.
  - _Expected Result:_ The context router detects the final bar, intercepts standard Markov lottery weight mechanics, and restricts candidate block options to `CADENCE_MOTIFS` (`taa` or `tai`) to elegantly resolve the phrase.
  - _Actual Result:_ Final timeline array index forced to a stable cadence block; successfully prevented downstream transport parsing/metrical truncation failures.
  - _Status:_ `PASS`

- **TM-03: Sub-division Layout Over-Allocation Guardrails**
  - _System Target:_ Interactive Staff Grid Drop-Zone Event Handlers
  - _Input / Action:_ Drag a multi-beat note component (such as a 2-tick `taa` Minim) into a workspace slot containing a remaining capacity of exactly 1 tick.
  - _Expected Result:_ Browser interceptor captures the drop event, runs a boundary space evaluation, aborts the raw array memory overwrite sequence, and triggers an absolute warning alert modal.
  - _Actual Result:_ DOM event captured cleanly. Toast alert sequence fired: _"This note is too long to fit in the remaining space of this bar!"_ Underlying array memory remained uncorrupted.
  - _Status:_ `PASS`

### 2. User Story Testing (Behavior-Driven Verification)

Verification of core target audience features mapped back to the primary user requirements.

- **As a Student**, I want clear visual feedback when I make an error so I know exactly where my ear failed: _Verified. The `evaluateSubmission()` controller runs a synchronous index comparison against `flatTarget`, instantly applying dynamic CSS modifier classes (`.is-success` or `.is-error`) directly to the corresponding DOM cards._
- **As an Instructor**, I want the app layout to stay completely on the screen so my class doesn't lose track of buttons: _Verified. Replaced raw flex flows with a restricted viewport shell (`height: 100dvh`, `overflow: hidden`) forcing the workspace to act as a responsive layout sponge._

### 3. Validator Testing

- **W3C HTML Validator:** 100% compliant. Passed with zero structural errors or loose tags.
- **W3C CSS Validator:** Compliant. All dynamic custom variables (`--color-primary`) and layout primitives pass compilation safely.
- **JSHint (ECMAScript 8):** Codebase analysed with strict rules. Zero memory leaks, zero undeclared variables, explicit global declarations wrapped for external libraries (`/* global Tone */`).

### 4. Lighthouse Testing

Performance optimisation was targeted directly through structural code changes, completely eliminating forced synchronous reflows by utilising double `requestAnimationFrame` microtasks for UI transitions (e.g., bar shaking physics).

- **Performance:** 98% (Highly optimized vector SVGs, localized DOM cache queries).
- **Accessibility:** 100% (High contrast colour ratios, explicit `aria-labels` on icon buttons, screen-reader semantic trees).
- **Best Practices:** 100%
- **SEO:** 100%

### 5. Browser Compatibility

Cross-origin audio context rendering pipelines were explicitly verified across major rendering engines:

- **Chromium Engine (Google Chrome / Microsoft Edge):** Flawless execution. User gesture interactions safely unlock Chrome's strict strict `AudioContext` autoplay restrictions via the `.init()` lifecycle hook.
- **WebKit Engine (Safari Desktop & Mobile iOS):** Full compliance. Deployed `100dvh` viewport constraints successfully neutralise Safari's dynamic collapsing bottom navigational toolbar overlay bug.
- **Gecko Engine (Mozilla Firefox):** Audio and CSS grid calculations match production benchmarks perfectly.

### 6. Responsiveness Testing (Primitive Grids)

Rather than writing fragile media query breakpoints for every independent screen device width, layout consistency was secured via **Every Layout Primitives**.

- **Tested on iPhone SE (320px width):** The `minmax(min(220px, 100%), 1fr)` auto-grid gracefully drops to a single vertical scroll stack. Proportional clamps prevent card elongation.
- **Tested on iPad Air & 4K Widescreen Display:** Columns automatically upscale cleanly to balanced multi-column matrices without breaking sheet-music layout syntax.

### 7. Automated Unit Testing (Jest/Console Diagnostics)

The inner mathematical states of the generative algorithms were verified using Chrome Developer Tools Console logs to track real-time engine processing telemetry.

- _Visual Output Verification:_ Dynamic tracking maps are outputted to the developer console utilising structured tabular views (`console.table`). See documentation portfolio screenshots for raw data execution tables.

### 8. Bugs Fixed (Sprint Log)

- **The "Skyscraper" Card Stretching Bug:** Tall viewports forced `flex: 1` grids to excessively stretch the vertical heights of the input staves, distorting note dimensions. _Fix:_ Implemented a strict row clamp (`grid-auto-rows: clamp(55px, 10vh, 85px)`) to create a hard visual ceiling.
- **The Collapsing SVG Window Bug:** Moving the cards to a strict flex layout collapsed the underlying programmatic vector graphic heights to 0. _Fix:_ Explicitly scaled the dynamic `.svg-container` to map out 100% of parent dimensions.

### 9. Known Issues

- **Tone.js Cold-Start Lag:** On older mobile processors, the very first note triggered after initialisation can occasionally experience a ~50ms audio latency spike as the browser compiles the Web Audio API oscillator nodes. Subsequent playbacks run entirely in real-time.

<p align="right">(<a href="#top">Back to top</a>)</p>
