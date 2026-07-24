<a name="top"></a>

_This is a split-out detail doc — for the project overview, see the [root README](../README.md)._

## <a name="ux-strategy"></a> UX Design Strategy (The 5 Planes)

### Initial V2 Planning Document

Before the five planes below were worked out in detail, a short planning document ([`docs/v2-initial-planning.pdf`](./v2-initial-planning.pdf)) sketched V2's revised sitemap, workspace card geometry, and starting design-system decisions. Much of what follows in this section is the elaboration of that document rather than a from-scratch redesign, since most of its concrete calls (the palette, the type/space scale, the CUBE reorganisation) survived into the shipped app essentially unchanged.

<details>
<summary><b>Expand Initial V2 Planning Notes & Wireframes</b></summary>

The revised sitemap held three pages, replacing V1's single view:

- **Home:** a traditional nav (hamburger on mobile) for Home/Classroom/Practice Room, a hero with a "Practice Now"/"Start" CTA, a footer, and a logo animation "drawn on" navigating the 8 colours used for the solfège buttons. This is the earliest record of both the colour-coded solfège idea and an animated brand moment, each committed to writing well before either was actually built.

  ![Initial V2 home page wireframe](./wireframes/v2-wireframe-home.png)

- **Classroom:** a new home for the existing Kodály reference matrix, plus "introductory learning content for each level (togglable) including video explanations." The Classroom page shipped in V2 as planned; so did the reference matrix at first, though it's since been deleted, since Presentation now covers the same ground with real generated notation and made the static table fully redundant. Video explanations never shipped and remain deferred pending real recorded material, not because the idea came later. Presentation, Rhythm/Melodic Workshop, Example, and Interval Detective (now organised under Preparation/Presentation/Practice tabs) are this same "introductory learning content" intention, fulfilled through generated audio and notation rather than video.

  ![Initial V2 Classroom page wireframe](./wireframes/v2-wireframe-classroom.png)

- **Practice Room:** a stripped-back "focus mode": workspace grid, back/replay/submit buttons, a very thin header, and a new horizontally-scrolling **reel** for browsing input cards, explicitly specified to animate cards on and off "like a rolodex."

  ![Initial V2 Practice Room wireframe](./wireframes/v2-wireframe-practice.png)

The plan's workspace card geometry hand-enumerated column layouts case by case (`ta`: one centred column; `ta-ti`: three unequal columns, the first two merged; `ti-tika`: four unequal columns, first two merged, then two smaller ones; and so on), with the constraint that a rhythm card's stick positions must vertically align with its solfège card's letters beneath it.

![Initial box-design sketch enumerating column layouts for the ta/ti-tika family of motifs](./wireframes/v2-box-design.png)

That case-by-case enumeration is exactly what `rhythm-notation.js` later replaced with a single weight-proportional formula, deriving any motif's column layout from one shared duration-weight table instead of hand-tuning each case individually; see [One Source of Truth for Notation](features.md).

Several interaction rules for card behaviours (UX) were specified up front, including that "users can select from the reel during playback." That rule did carry through: only the Replay and Submit buttons themselves lock against re-entry while audio is sounding (`sessionState.currentState === "PLAYING"`); reel and workspace selection are deliberately left unguarded, exactly as planned.

Three candidate directions for the colour palette were considered ([option 1](https://coolors.co/202020-63768d-e01a4f-f15946-f9c22e), [option 2](https://coolors.co/4c5454-ff715b-ffffff-1ea896-523f38), [option 3](https://coolors.co/202020-f9c22e-1be7ff-6eeb83-ff5714)) before settling on a bespoke palette, worked out in the same document:

| Token                | Name             | Hex       | Purpose                                    |
| :------------------- | :--------------- | :-------- | :----------------------------------------- |
| Surface (background) | Alabaster Grey   | `#DDDDDD` | Soft, warm off-white to reduce glare       |
| Surface (card/UI)    | White            | `#FFFFFF` | Crisp "sheet music" container effect       |
| Primary (Brand)      | Atomic Tangerine | `#FF6B35` | Hero colour for primary actions/buttons    |
| Secondary (Accent)   | Golden Pollen    | `#FFC857` | Active states, highlights, secondary tools |
| Success              | Muted Teal       | `#82B895` | Legible success state on light backgrounds |
| Text (Primary)       | Graphite         | `#2D2D2D` | High legibility, softer than harsh black   |
| Text (Muted)         | Charcoal         | `#545454` | Secondary text, labels, helper info        |

This table's names and hex values are the exact `atomic-tangerine`/`golden-pollen`/`muted-teal`/`graphite`/`charcoal`/`alabaster-grey` primitives in the shipped `design-tokens.json`, so the palette shipped essentially as planned. What the plan didn't yet anticipate: the later accessibility audit (Development Log, phase 3) found several of these values too light for text at AA contrast, and added separately-derived "deep" variants for anything text-bearing, keeping these original values as decoration-only `accent-vivid-*` tokens rather than replacing them outright.

Five display/body pairing ideas for typography were sketched against the brand wordmark, one of them "Solfaic and Poppins." The paired display face changed (Galindo, not this document's own hand-lettered "Solfaic," was the eventual heading typeface), but Poppins carried straight through as the shipped body copy face. The fluid type and space scales specified alongside (generated via [utopia.fyi](https://utopia.fyi) at a 1.2 ratio between 320px and 1240px) were carried into `design-tokens.json` unchanged, custom `space-s-l` pair included.

The plan's file directory and CUBE CSS notes open by citing V1's own file sizes as the reason for the rewrite: 1,630 lines of CSS and 1,619 lines of JavaScript, both in single monolithic files. Adopting Andy Bell's CUBE CSS methodology and splitting into a proper `src/` tree (see [System Architecture & Logic Maps](architecture.md) and the repository layout in [Credits & Acknowledgements](../README.md#credits)) was the proposed fix, and is what actually shipped.

The hero particle-field concept's background animation credit (see "An Ambient, Branded Hero Animation" below) was sourced in this same document, crediting Louis Hoebregts' CodePen sketch as the starting reference (full credit in [Credits & Acknowledgements](../README.md#credits)).

</details>

### I. Strategy

- **User Goals:** To master both rhythmic and melodic (movable-do) dictation through an interactive, step-by-step training workspace, spanning a full pedagogical curriculum grounded in a real Kodály syllabus rather than an invented difficulty curve.
- **Target Audience:** Practical music candidates, choral applicants, and contemporary musicians formalising their aural perception; this is unchanged from V1's original framing, which held up.
- **The Future Runway:** V1 pre-wired a `pitch: null` field into its data model speculatively, betting the architecture could absorb a future melodic layer without a rewrite. That bet paid off: V2's melodic engine was built directly onto the existing rhythm engine's Markov-chain architecture rather than requiring a parallel system. Levels 1-9 now all generate real, functional rhythm and pitch content (Levels 5-9 landed in a later sprint, directly onto that same architecture — see [Development Log](development-log.md)); the runway's current frontier is the handful of deliberately-simplified pieces documented in [Future Roadmap](#future-roadmap) below.

### II. Scope

- **Dual-Engine Algorithmic Synthesis:** Rhythm and pitch are generated independently, each from its own curriculum-grounded, weighted Markov transition system, then combined into one coherent sung-and-tapped exercise.
- **Movable-Do Resolution Layer:** Generation itself stays key-agnostic: exercises are produced as relative solfège tokens, with a randomly-chosen tonic resolving them to real, audible pitches only at playback time, training relative rather than absolute pitch recognition.
- **Escalating Diagnostic Evaluation:** Feedback isn't binary correct/incorrect. A graduated sequence runs from a targeted shake on just the wrong elements, to a "listen and try again" prompt with the streak left intact, to phase-specific remediation that names exactly what needs practice.
- **Session-Only Memory Profile:** Progression, scores, and streaks remain entirely client-side, with no backend or database dependency, unchanged from V1.

### III. Structure

- **Multi-Page Information Architecture:** V1's single-page application is now three purpose-built pages: Home (orientation), Classroom (learning the curriculum before testing), and Practice Room (the dictation engine itself), replacing a single overloaded view with a deliberate learn-then-test flow. Classroom's level selector filters _which curriculum content is being browsed_ (the level guide, the Preparation/Presentation/Practice panels); it has no connection to the active practice session, since Practice Room's level is never manually selected.
- **Two-Phase Exercise Resolution:** Each exercise is dictated once and answered twice: rhythm first, then solfège layered over the same confirmed rhythm, rather than treated as two separate listening events.
- **The Audio Signal Chain, extended:** V1's count-in-then-playback sequence now includes a movable-do resolution step between generation and sound, plus a dedicated starting-note cue at the rhythm-to-pitch transition, giving the student a stable reference pitch before the second phase begins.

### IV. Skeleton

- **CUBE Compositions as the Layout Vocabulary:** V1's informal borrowing from Every Layout is now a full, named Composition library (Cluster, Spread, Switcher, Grid, Reel, Container, Wrapper, Center, Sidebar, and Flow), each with a specific, non-overlapping structural job, composed together on the same elements rather than reached for ad hoc.
- **The Practice Room Workspace:** A metre-aware grid (column count follows the exercise's actual time signature rather than a fixed layout), paginated for longer phrases, where each box holds a rhythm card paired with its own solfège entry card beneath it.
- **Navigation Skeleton:** Consistent nav and footer chrome across Home and Classroom; the Practice Room deliberately strips this away entirely in favour of a thin, focus-mode header, protecting concentration during an actual exercise.

### V. Surface

- **New Typeface Pairing:** Galindo for display and heading type, Poppins for body copy, a deliberate rebrand from V1's unspecified system font stack.
- **A Two-Tier, Verified-Accessible Colour System:** Where V1 asserted an "AAA-accessible high-contrast schema," V2's palette is built on an explicit two-tier structure: bright, decorative-only tokens for illustration, and separately-derived, WCAG-verified "deep" variants for anything carrying text, with every text-bearing colour's contrast ratio computed and documented, not chosen by eye.
- **Colour-Coded Solfège:** Each syllable is rendered in its own distinct, consistent colour, following the traditional convention of colour-coded solfège teaching, and deliberately, several of those colours are the same tokens already used for the app's primary buttons and badges, so the palette reinforces brand identity rather than introducing a disconnected second system.

### Pedagogical Whimsy & Interaction Philosophy

V1's specific examples (confetti, frustration-shake) mostly carried forward conceptually but are joined by new V2-specific whimsy:

- **Colour-Coded Solfège Circles** turn an abstract pitch relationship into an immediate visual one.

![The solfège reel, each syllable rendered as its own distinctly-coloured circle](./screenshots/v2_colour_coded_solfege.png)

- **A Tactile, Physical Primary CTA** - a Comeau-style 3D "pushable" button, reserved deliberately for once-per-page hero moments rather than applied everywhere, so the effect stays a moment of delight rather than becoming visual noise on frequently-clicked buttons like Submit.

![The homepage's pushable CTA mid-press, its 3D front compressed toward the shadow beneath it](./screenshots/v2_pushable_cta_pressed.png)

- **An Ambient, Branded Hero Animation**: a particle field on the homepage, coloured from the same solfège palette used in the Practice Room, seeding the app's visual language before a student ever reaches an exercise.

![The homepage hero, its ambient particle field seeding the solfège colour palette before any exercise begins](./screenshots/v2_home_hero.png)

- **Cinematic Confetti**, carried over from V1, now correctly layered so the celebration modal reads as sitting in front of the burst rather than beneath it.

![The celebration modal reading as sitting in front of a dense, colourful confetti burst](./screenshots/v2_confetti_celebration.png)

- **Tactile Frustration Microgestures (Error Handling):** Attempting to submit an incomplete exercise causes the entire canvas row to execute an aggressive **horizontal frustration shake** (`is-shaking`), while empty slots flash with a **crimson halo pulse** (`is-empty-panic`).

![Empty workspace slots mid-panic, each glowing with the crimson halo pulse](./screenshots/v2_frustration_shake.png)

- **Touch-First Sensation Mapping:** Hover definitions are suppressed entirely on mobile to eliminate sticky layout scaling freezes. Touch inputs focus exclusively on the high-fidelity `:active` state, delivering a crisp, immediate touch-down spring compression feel (`scale(0.96)`) the precise millisecond a finger makes contact.

![A reel pad held mid-touch, scaled down to its :active state: subtle by design, a compression feel rather than a dramatic visual](./screenshots/v2_touch_active_pad.png)

---

## <a name="future-roadmap"></a>Future Roadmap

Everything below is a deliberate, already-discussed deferral rather than an aspiration invented after the fact — each item names exactly what's already in place and what's still missing, so the gap is honest rather than hand-waved.

- **Irregular metres (5/8, 7/8):** the grouping data and generator already exist and are unit-tested standalone — `IRREGULAR_METRE_GROUPINGS` (`data.js`) and `generateIrregularBar()` (`engine.js`) split a bar into its 2s-and-3s beat groups (5/8's default `[2,3]` plus a `[3,2]` variant; 7/8's default `[2,2,3]` plus two variants), each group drawing from the existing simple/compound motif pools rather than needing new rhythm vocabulary. What's missing is purely the wiring: no level's `allowedMetres`/dispatch in `generateRhythmTimeline` currently activates either metre. Cyrilla's document assigns 5/8 to Level 6 (Balkan folk tune repertoire, already named in `REPERTOIRE[6]`) and 7/8 (alongside 5/4, which isn't modelled at all yet) to Level 7 (Take Five/Unsquare Dance, `REPERTOIRE[7]`) — the natural next step is wiring the existing generator into those two levels' dispatch rather than building anything new.
- **Real modulation (Levels 8-9):** currently Level 9 generates within the exact same rich chromatic key as Level 8 (`PITCH_LEVEL_RULES[9] = {...PITCH_LEVEL_RULES[8]}`) rather than an actual mid-phrase key change — an honestly-flagged simplification, not a hidden gap. Genuine modulation needs new engine logic: a defined pivot point partway through a phrase, a second tonic, and a rule for how the Markov walk hands off from one key's table to the other's without the join sounding arbitrary.
- **Level 6's melodic-sequence algorithm:** Cyrilla's document specifies "sequences in diatonic major, including pattern of 3rds, 4ths, 5ths" — a real, distinct generative technique (transposing a short melodic cell up or down by a fixed interval and repeating it), not just an extension of the existing per-note Markov walk. Level 6 currently just reuses Level 5's tables verbatim as a consolidation level; the sequence generator itself hasn't been started.
- **A sampled human voice, replacing the synthesized tone:** every voice in `audio.js` today (`synth`, `chime`, `keyboardSynth`) is a plain `Tone.Synth` triangle oscillator — functional, but obviously not a real singing voice. The plan is `Tone.Sampler`: record a single reference syllable ("noo") at a handful of real pitches rather than every semitone, and let Sampler's own playback-rate pitch-shifting cover everything in between — the same technique real sample libraries use to keep asset size down. The reference points need to be close enough together that the pitch-shifted extremes don't audibly distort (a common rule of thumb is a new sample every minor third to perfect fourth), which for this app's `allowedTonics` range and up-to-two-octave toneset span likely means somewhere around 5-8 recorded notes, not one per semitone.
- **Interactive Preparation-stage resources:** Preparation's `REPERTOIRE` list is text-only right now (`title`/`toneset`/`feature`) — a student has to leave the app entirely to actually go find and learn a suggested song. `data.js`'s own comment on `REPERTOIRE` already names the intended next step (a `youtubeId`/timestamp per song), but that's a documented intention only — no such fields exist in the data yet, so this is still real, unstarted design work: choosing real clips per song, adding those fields to the shape, and building the embed/playback UI in the Preparation tab so "prepare through familiar repertoire" happens inside Classroom itself instead of sending the student elsewhere.
- **Level 1's fuller toneset redesign:** tonight's fix added a third, additive `fullPentatonic` melodic group alongside the two original ones (see Development Log) — a deliberately low-risk fix, not the fuller redesign Cyrilla's document actually implies (a single continuous progression, `s-m` → `m-r-d` → `s-m-r-d` → `l-s-m-r-d`, rather than three discrete starting groups a generator picks between). That real redesign — reworking `generatePitchLine`'s Level 1 branch around one progressive toneset instead of parallel groups — remains a distinct, larger piece of future work.

<p align="right">(<a href="#top">Back to top</a>)</p>
