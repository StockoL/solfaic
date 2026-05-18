# Solfaic - Solfege Ear Trainer: Technical Specification

1. ## Project Idea and User Stories

**Solfaic** is an interactive web application designed to bridge the gap between relative pitch recognition and absolute musical notation through a pedagogical 10-level "ladder". It adheres to the **Kodály philosophy** of "sound before symbol," ensuring users internalise the function of an interval before mapping it to a stave.

### User Groups & Stories

#### 1. The Examination/Audition Candidate

_Focus: Precision, pressure-testing, and structural success._

- **User Story:** As a Choral Scholar applicant, I want to practise identifying intervals within a 10-level progression so that I can build the systematic accuracy required for my upcoming entrance audition.
  - **Acceptance Criterion:** The user is presented with a structured sequence of exercises that increase in melodic complexity across ten distinct levels.
- **User Story:** As a music student, I want to receive immediate diagnostic feedback when I miss a pitch so that I don't "rehearse" the wrong sound into my long-term memory.
  - **Acceptance Criterion (BDD):**
    - **Given** the user has submitted an incorrect pitch.
    - **When** the system evaluates the response.
    - **Then** a diagnostic modal appears explaining the specific interval error with a remedial audio-visual demonstration.
- **User Story:** As a candidate for an aural exam, I want to use the "Play Twice" limit on exercises so that I can simulate the real-world constraints of an examination room.
  - **Acceptance Criterion:** Once the audio playback has been triggered twice, the playback option becomes unavailable for that specific exercise.

#### 2. The Aspiring Improviser

_Focus: Mapping sound to the instrument and "internalising" the keyboard._

- **User Story:** As a piano student, I want to see the virtual piano keys light up as I select Solfege buttons so that I can create a visual-spatial map between the sound I hear and the keys I need to press.
  - **Acceptance Criterion:** When a Solfege button is interacted with, the corresponding key on the virtual keyboard provides a clear visual highlight.
- **User Story:** As an aspiring improviser, I want to complete a "Mastery Bridge" using absolute pitch names with each level so that I can translate my relative ear training into the specific keys I use on my instrument.
  - **Acceptance Criterion:** After three successful relative pitch rounds, the UI dynamically swaps Solfege syllables for absolute pitch letter names for a final verification round.
- **User Story:** As a learner, I want to hear a reference "Tonic" before every sequence so that I can establish a firm "Home" key in my head before attempting to find other intervals.
  - **Acceptance Criterion:** The system automatically plays the tonic pitch of the current key signature prior to initiating the melodic "Call".

#### 3. The Music Educator (The Facilitator)

_Focus: Pedagogy, motif-based learning, and consistency._

- **User Story:** As a piano teacher, I want my students to practise with rhythmic motifs rather than random notes so that their ear training feels like real music and reinforces common patterns found in their repertoire.
  - **Acceptance Criterion:** All generated exercises are composed of predefined musical motifs that fit logically within the designated time signature.
- **User Story:** As a Kodály-based educator, I want the UI to prioritise Solfege syllables over absolute letter names initially so that my students master "sound before symbol" as a core tenet of their training.
  - **Acceptance Criterion:** The default interface presents relative Solfege buttons as the primary method of identification, withholding absolute letter names until the "Mastery Bridge".
- **User Story:** As a teacher recommending a tool for homework, I want the app to work flawlessly on mobile browsers so that my students can "tune up" their ears during small gaps in their daily schedule.
  - **Acceptance Criterion:** The layout utilises **Intrinsic Web Design** principles (The Switcher and The Stack) to ensure all interactive elements remain accessible and well-spaced on small viewports without vertical overflow.

2. ## Strategic Research

### 1. Teoria (The Desktop Maestro)

- **The High Note (What works):** Excellent **Functional Patterns** for customisation. Allowing users to "register" their own practice session (intervals vs scales) mirrors how a choir director selects a specific warm-up.
- **The Flat Note (What fails):** Poor **Intrinsic Responsiveness**. It lacks the **Axioms of Layout** required for modern web apps—specifically, it doesn't handle the "narrow context" of mobile viewports well, leading to a fragmented user experience.
- **Innovation:** I will use **Every Layout's "The Switcher"** to ensure the Virtual Keyboard and Solfege Console reconfigure themselves perfectly on a mobile screen, bridging the desktop-mobile gap that Teoria misses.

### 2. IMACS Solfa (The Visual Synchroniser)

- **The High Note (What works):** Superior **Visual Anchoring**. Using a grid to show the physical distance between intervals helps students "internalise" the height of a Perfect 5th versus a Major 3rd.
- **The Flat Note (What fails):** Static pedagogy. Because every level uses the same sequence, the student eventually learns the "piece" by rote rather than responding to the "language" of music.
- **Innovation:** A **Dual-Phase Assessment Engine**. I am introducing **Rhythmic Mastery** (the time-signature) alongside pitch, ensuring a student can't just find the note; they must find it "in time".

---

3. ## UX Design

### I. Strategy

This plane defines the "Why" and "Who" of the application.

- **User Goals**: To master relative pitch recognition (Movable-Do) and map those sounds to absolute instrumental locations.
- **Target Audience**: Choral scholar applicants, improvising instrumentalists, and music educators requiring a "sound-first" pedagogical tool.
- **The Mastery Bridge**: Bridges the gap between relative ear training and absolute note reading, graduating students from Solfege symbols to absolute letter names once milestone consistency is achieved.

### II. Scope

This plane defines the strict functional requirements and limitations of the MVP.

- **Algorithmic Melody Synthesis**: Exercises are built dynamically using a Step-Wise Bias and a Leap Restriction Guard Rule (forcing vocal leaps to immediately resolve by step in the opposite direction, along with other similar voice-leading conventions) to mirror singable repertoire rather than random noise.
- **Diagnostic Evaluation Engine**: The system parses submission payloads at run-time, calculating specific interval distance errors or motif mismatches to trigger targeted remedial video vignettes.
- **Session-Only Memory Profile**: To maintain a lightweight footprint, progression tracking and streak milestones are handled entirely within active runtime memory, intentionally omitting persistent backend database storage for the initial release.
- **Intrinsic Responsiveness**: The interface must support mobile web browsers natively, allowing target users to execute quick training rounds within short gaps in their daily schedules.

### III. Structure

This plane defines the interactive design patterns and logical framework of the game loop.

- **Gated Dual-Phase Identification**: Interaction is structurally separated into two chronological steps to mirror professional rehearsal techniques: the user must successfully reconstruct the rhythmic timeline before the system unlocks the movable-Do pitch entry interface.
- **The Controlled Playback Lifecycle (The Conductor's Rule)**: Interactive inputs are completely disabled while Tone.js fires audio vectors. The system tracks consumption via a strict 2-play limit per exercise; once reached, the playback engine locks entirely to simulate strict examination conditions.
- **The Signal Chain Lifecycle**:
  1. **Tonic Anchor**: The system initialises by playing an absolute reference pitch to root the user's ear in the selected key context.
  2. **The Call**: A neutral vowel sampler ("Noo") is used to test pure aural recognition and disguise the correct sequence of solfa syllables.
  3. **The Response**: Upon a successful evaluation, a dedicated Syllabic Sampler sings back the correct names ("Do-Re-Mi") to provide an immediate confirmative aural reward.

### IV. Skeleton

This plane defines the visual arrangement of components using layout primitives.

- **The Switcher**: The structural layout algorithm dynamically re-stacks the Solfege identification consoles and the Virtual Keyboard for mobile viewports cleanly without relying on fragile media queries.
- **The Stack**: Component relationships (Header trackers, Main Input Consoles, Piano Keyboard, and Diagnostic Modals) utilise a unified vertical scale derived from a Modular Scale to guarantee optimal touch-target accuracy.
- **Real-Time Visual Coupling**: Tapping an active input button instantly dispatches parallel updates—simultaneously triggering the Tone.js sampler while adding a `.key-active` utility class to highlight the corresponding key on the piano layout, reinforcing spatial mapping.

### V. Surface

This plane establishes the sensory presentation and styling principles.

- **Aesthetic Principle**: "Timeless, not cutting edge" — prioritising immediate cognitive clarity and structural accessibility over complex web animations.
- **Axiomatic Typography**: Instructional text measures are strictly capped at a highly readable layout width (e.g. 60ch) to ensure eye tracking comfort during dense training blocks.
- **Semantic Colour Palette**: Utilises a strict, AAA-accessible high-contrast colour schema to convey operational system states immediately: Active Focus (Blue), Validation Success (Green), and Diagnostic Remediation (Amber).

4. ## System Architecture and Logic Maps

To ensure a strict separation of concerns and guarantee a highly-performant user experience, _Solfiac_ is engineered across three distinct architectural planes: State Management, Data Flow, and Asynchronous Component Communication.

Below is the technical blueprint of the application's engine.

### The Global State Machine (The Game Loop)

The application operates as a deterministic State Machine. This architectural choice strictly controls what actions are permitted at any given moment to preserve the integrity of examination conditions and prevent cognitive overload.

![Global State Machine](./docs/architecturemaps/state-machine-solfaic.png)

**Architectural Breakdown**

- Defensive Lockout (playbackState): While Tone.js is broadcasting audio frequencies, the system transitions to a locked playback state. This safely prevents the user from registering answers early or breaking the layout flow during audio execution.
- The Play Limit Guard (evaluatePlayLimit): Tracks a user's playback consumption. Once `playCount === 2`, the engine permanently locks the replay track for that exercise, perfectly fulfilling the target 'examination candidate' user story.
- The Modular Gateway (loadLevelSettings): Acts as a central, reusable junction point. Four separate architectural loops (normal resetting, moving to a new level, exiting a diagnostic window, or initiating from the landing page) all route through this single node to clean input memories and reset local step counters safely.

### The Multi-Phase Data Pipeline (The Movable-Do Bridge)

This flowchart traces how data enters the application, transforms from a relative conceptual system (movable-do solfege) into absolute parameters (MIDI strings), and processes user payloads through a parallel feedback system.

![Data Pipeline](./docs/architecturemaps/data-logic-solfaic.png)

**Architectural Breakdown**

- Algorithmic Melody Synthesis (Phase 1): To provide real-world vocal training, melodies are generated using strict contrapuntal constraints rather than pure randomness. The system enforces a Step-Wise Bias and implements a Leap Restriction Guard Rule (ensuring any vocal leap is immediately resolved by step in the opposite direction, and other similar voice-leading conventions).
- The Visual-Spatial Mapping Engine (Phase 2): When a user triggers an interaction in Stage B, the event splits into parallel visual and audio threads synchronously. It calculates the absolute pitch from an pre-compiled lookup dictionary, updates the viewport class list to illuminate the virtual piano keyboard, and triggers the audio sampler on the exact same loop tick, removing latency for the improviser (user story).
- Gated Evaluation Framework (Phase 3): To fulfill the "sound before symbol" paradigm, input arrays are verified sequentially. If a user inputs an incorrect rhythm sequence, the system skips the pitch interface entirely and routes them straight to the remediation engine, keeping memory buffers clean.

### Asynchronous Timeline Synchronisation (The Sequence Map)

This sequence diagram charts the timeline and communication channels running across the application's Model-View-Controller (MVC) boundary layers, tracking how the UI, Game Engine, and Tone.js audio engine swap data asynchronously without stalling the main browser thread.

![Sequence Map](./docs/architecturemaps/verification-sequence.png)

**Architectural Breakdown**

- Event-Driven UI Unlocking (Steps 8–11): Instead of using unstable, hardcoded JavaScript intervals (setInterval) to guess when a song ends, the Game Engine hooks directly into Tone.js's native scheduling buffer. The UI remains completely locked down until Tone.js broadcasts its precise audio completion callback thread, protecting the app against browser-tab processing discrepancies.
- The Remedial Intercept Loop (Steps 16–18 & 27–29): If an evaluation fails, the engine flags a clear failure code alongside structured metadata indicating the specific error (e.g., a "descending perfect 4th mismatch"). This immediately suspends standard progression pathways and isolates system focus onto rendering the targeted remedial modal window.
- The Confirmative Aural Reward (Steps 31–33): When a user clears the final pitch evaluation hurdle, the system initializes a dedicated confirmative playback sequence. Rather than presenting a silent text confirmation, the audio engine plays back the resolved sequence using a localised Syllabic Vocal Sampler to aurally reinforce the student’s correct selection.
