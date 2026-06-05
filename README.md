# Solfaic - Solfege Ear Trainer: Technical Specification

1. ## Project Idea and User Stories

Solfaic is an interactive web application designed to isolate and build rhythmic dictation and metric internalisation through a pedagogical progressive "ladder". It adheres to a core tenet of music theory education that a foundation in structural rhythm processing must be developed before pitch in the understanding of melody. The underlying software architecture is intentionally decoupled and extensible, built as a standalone module ready to support a future Solfege pitch-training framework without structural rewrites.

### User Groups & Stories

#### 1. The Examination/Audition Candidate

_Focus: Precision, pressure-testing, and structural success._

- **User Story:** As an aural examination applicant, I want to practice identifying rhythmic motifs within a structured progression so that I can build the metric accuracy required for my upcoming entrance test.
  - **Acceptance Criterion:** The user is presented with generated exercises that increase in metric complexity (varying time signatures and subdivisions) across distinct levels.
- **User Story:** As a music student, I want to receive immediate diagnostic feedback when I submit an incorrect motif sequence so that I do not "rehearse" the wrong rhythmical patterns into long-term memory.
  - **Acceptance Criterion (BDD):**
    - **Given** the user has submitted an incorrect motif sequence.
    - **When** the system evaluates the response array against the target timeline.
    - **Then** a diagnostic modal appears explaining the specific durational or structural motif error.
- **User Story:** As a candidate simulating exam conditions, I want a strict limit on audio playbacks so that I am forced to rely on internal memory rather than continuous looping.
  - **Acceptance Criterion:** Once the audio playback has been triggered twice, the playback option becomes unavailable for that specific exercise.

#### 2. The Music Educator (The Facilitator)

_Focus: Pedagogy, motif-based learning, and consistency._

- **User Story:** As a music teacher, I want my students to practice with real pedagogical rhythmic motifs (e.g., dotted rhythms, pairs of quavers) rather than continuous random durations so that training mirrors real-world repertoire.
  - **Acceptance Criterion:** All generated exercises are algorithmically composed from predefined musical motif object blocks that sum perfectly to the level's designated time signature and bar constraints.
- **User Story:** As a teacher recommending a practice tool, I want the app to function cleanly on small mobile browsers so that students can execute training sessions efficiently on the go.
  - **Acceptance Criterion:** The layout utilises **Intrinsic Web Design** principles (The Switcher and The Stack) to ensure all interactive elements remain accessible and well-spaced on small viewports without vertical overflow.

2. ## Strategic Research

### 1. Teoria (The Desktop Maestro)

- **The High Note (What works):** Excellent **Functional Patterns** for customisation. Allowing users to "register" their own practice session (intervals vs scales) mirrors how a choir director selects a specific warm-up.
- **The Flat Note (What fails):** Poor **Intrinsic Responsiveness**. It lacks the **Axioms of Layout** required for modern web apps — specifically, it doesn't handle the "narrow context" of mobile viewports well, leading to a fragmented user experience.
- **Innovation:** I will use **Every Layout's "The Switcher"** to ensure selection pads gracefully cascade from wide columns on desktop down to massive, thumb-friendly touch blocks on mobile.

### 2. freeCodeCamp Drum Machine (The Audio Interface Scaffolding)

- **The High Note (What works):** Exceptional structural blueprint for mapping client-side interactive buttons to instantaneous audio sampler buffer responses and tracking active UI states cleanly.
- **The Flat Note (What fails):** Entirely reactive architecture; it lacks any system for scheduled timing grids, automated timeline sequence loops, or objective entry validation.
- **Innovation:** Solfaic isolates the interactive audio pad mechanism of a drum machine but steps it up into a Scheduled Timeline Matrix, feeding static loops into deterministic evaluation processors.

---

3. ## UX Design

### I. Strategy

This plane defines the "Why" and "Who" of the application.

- **User Goals**: To master complex metric identification and rhythmic cell dictation through an interactive, step-by-step training workspace.
- **Target Audience**: Practical music candidates, choral applicants, and contemporary musicians seeking to formalise their rhythmic perception.
- **The Future Runway**: The system architecture functions as an isolated structural base; the event timelines are pre-wired to integrate a pitch module seamlessly.

### II. Scope

This plane defines the strict functional requirements and limitations of the MVP.

- **Algorithmic Rhythm Synthesis**: Exercises are compiled dynamically at runtime by reading level parameters (metre, bar count) and randomly assembling predefined motif blocks until the necessary beat boundaries are completely met.
- **Extensible Event Architecture**: To support future pitch expansion, all generation loops output an array of Event Objects featuring explicit `pitch: null` metadata spaces. The application's playback pipeline is designed to process these properties automatically once enabled.
- **Diagnostic Evaluation Engine**: The system evaluates user-submitted response arrays item-by-item against the hidden target timeline array to identify errors without maintaining data-heavy tracking profiles.
- **Session-Only Memory Profile**: To maintain a rapid, performant runtime footprint, progression, scores, and streak data are handled entirely in active session memory, completely bypassing backend database requirements for the MVP.

### III. Structure

This plane defines the interactive design patterns and logical framework of the game loop.

- **Gated Dual-Phase Identification**: Interaction is structurally separated into two chronological steps to mirror professional rehearsal techniques: the user must successfully reconstruct the rhythmic timeline before the system unlocks the movable-Do pitch entry interface.
- **The Controlled Playback Lifecycle (The Conductor's Rule)**: To maintain maximum concentration, all workspace pads are disabled while the audio player executes the timeline sequence. Play count tokens are spent on playback initialisation, permanently locking the engine once the token pool hits zero.
- **The Audio Signal Chain**:

1. **The Count-In**: The engine generates a steady click metronome pattern to lock the student's ear into the target tempo and time signature.
2. **The Call**: A decoupled audio wrapper plays back the target motif sequence timeline utilising a high-fidelity woodblock audio sample.

### IV. Skeleton

This plane defines the visual arrangement of components using layout primitives.

- **The Motif Switcher Console**: The core input panel utilises a dynamic wrapping grid mechanism. On desktop views, the motif choice pads layout in a streamlined horizontal bar; on compact mobile screens, they automatically stack into stacked, touch-target accessible blocks.
- **The Input Workspace Stack**: View elements flow in a strict vertical order derived from a Modular Scale, preventing text crowding and ensuring clear spatial context between the active workspace display, control blocks, and primary CTAs.
- **Workspace State Highlighting**: Adding inputs updates internal state arrays while attaching utility classes (.is-active, .is-locked) to DOM nodes, giving instant visual validation of user selections.

### V. Surface

This plane establishes the sensory presentation and styling principles.

- **Aesthetic Principle**: "Timeless, not cutting edge" — prioritising immediate cognitive clarity, minimal distraction, and structural accessibility over stylistic animations.
- **Axiomatic Typography**: Instructional text measures are strictly capped at a highly readable layout width (e.g. 60ch) to ensure eye tracking comfort during dense training blocks.
- **Semantic Colour Palette**: Utilises a strict, AAA-accessible high-contrast colour schema to convey operational system states immediately: Active Focus (Blue), Validation Success (Green), and Diagnostic Remediation (Amber).

4. ## System Architecture and Logic Maps

To guarantee clean maintainability and extensible software updates, Solfiac isolates its core processes across distinct modules: Data Generation, State Control, and a Decoupled Playback Wrapper.

Below is the technical blueprint of the application's engine.

### The Global State Machine (The Game Loop)

The application operates as a deterministic State Machine. This architectural choice strictly controls what actions are permitted at any given moment to preserve the integrity of examination conditions and prevent cognitive overload.

![Global State Machine](./docs/architecturemaps/state-machine-solfaic.png)

**Architectural Breakdown**

- Defensive Lockout (playbackState): While the audio controller handles transport scheduling, the system transitions to a locked playback state. This safely prevents the user from registering answers early or breaking the layout flow during audio execution.
- The Play Limit Guard (evaluatePlayLimit): Monitors consumer asset access. Once the threshold is breached, it assigns a `.is-locked` selector state to the player DOM elements, preserving testing conditions.
- The Modular Gateway (loadLevelSettings): Centralises setup commands. When a round loads, this node flushes workspace tracking arrays, pulls configuration rules, and triggers the generation modules without mutating global files.

### The Multi-Phase Data Pipeline (The Movable-Do Bridge)

This flowchart shows how data is modeled as modular arrays of objects, transforming raw configuration files into a timed sequence map that is fully prepared for future pitch characteristics.

![Data Pipeline]()

**Architectural Breakdown**

- **Deterministic Composition Assembly**: The configuration engine treats inputs as exact mathematical blocks. It compiles patterns until the total beats match the metric requirements, establishing a foundation for sequence checking.
- **Decoupled Data Contracts**: By designing the core sequence matrix around a unified object schema containing explicit `pitch: null` placeholders, the evaluation engine can run its array comparison pipeline cleanly. Integrating melodic elements down the line requires absolutely no structural rewrites to this pipeline.
- **Gated Validation Array Mapping**: User entries map straight into linear payload indexes. The processing routine checks values in order, flagging index mismatch locations and routing the system state directly to the corrective remediation views.

### Asynchronous Timeline Synchronisation (The Sequence Map)

This mapping details how the browser interface UI, the Central Engine Controller, and the Web Audio API wrappers share execution data asynchronously without clogging the primary browser thread.

![Sequence Map]()

**Architectural Breakdown**

- **Callback-Driven Interface Unlocking**: Instead of utilising inaccurate JavaScript intervals to guess completion metrics, the layout links directly into native audio runtime scheduling buffers. The workspace stays locked until a clean `onComplete` signal clears the thread, protecting timing against system discrepancies.
- **Isomorphic Error Isolation**: When validation failures occur, the checker isolates the precise faulty sequence metadata index. It blocks level advancement and immediately assigns rendering parameters to initialise the remediation modal window.
