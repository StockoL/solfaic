<a name="top"></a>

_This is a split-out detail doc — for the project overview, see the [root README](../README.md)._

## <a name="features"></a> Core Features & UI Overhauls

### The Melodic Engine & Two-Phase Dictation

The headline addition in V2. Where V1 tested rhythm alone, every exercise is now dictated once and answered twice: the student identifies the rhythm first, and only once that's confirmed correct does the practice reel switch to solfège syllables, layered over the same audio the rhythm was drawn from, not a second, different exercise. Each phase carries its own independent play budget, and a dedicated "Starting Note" cue sounds at the transition, giving the student a stable reference pitch before pitch identification begins.

![The Starting Note modal appearing at the rhythm-to-pitch transition, naming the resolved tonic before the solfège phase begins](./screenshots/v2_two_phase_starting_note.png)

### Colour-Coded Solfège

Each solfège syllable renders as its own distinctly-coloured circular card, a real convention in colour-coded solfège teaching, not a decorative choice. Several of the seven colours deliberately reuse the same tokens already driving the app's primary buttons and badges, so the palette reinforces the app's existing visual identity rather than introducing a second, disconnected one.

![The solfège reel during the pitch phase, showing mi, so, and la each rendered in their own distinct, verified-accessible colour](./screenshots/v2_colour_coded_solfege.png)

### Escalating Diagnostic Feedback

V1 offered a single tier of feedback: correct or incorrect. V2 escalates: a first wrong submission shakes only the specific incorrect elements (not the whole board) and prompts a retry without touching the streak. A second wrong submission on the same answer triggers targeted remediation: the correct rhythm shown directly for a rhythm mistake, or, for a pitch mistake, both notes of the actual interval that needs practice, not just the wrong note in isolation.

![The first-tier "Not quite!" modal shown after an incorrect submission, prompting a retry without affecting the streak](./screenshots/v2_escalating_feedback.png)

### Metre-Aware, Self-Aligning Workspace

The workspace grid's column count now follows the exercise's actual time signature, so a 3/4 exercise renders in genuine 3-column rows rather than being forced into a 4-column layout that split bars awkwardly across row boundaries. Every rhythm card's stick-notation SVG and its paired solfège entry card are generated from the same underlying duration data, guaranteeing their columns align for any motif without hand-tuning two separate assets to match.

![The Level 1 practice workspace grid, columns packed to the exercise's actual metre with rhythm cards paired above their solfège entry rows](./screenshots/v2_workspace_metre_grid.png)

### Movable-Do Playback

Generation itself never touches an absolute pitch. Every exercise is produced as relative solfège tokens, only resolved to a real, audible key at the moment of playback, via a randomly-selected tonic from a curated, comfortably-singable set. The same generated exercise structure will very rarely sound in the same key twice, training genuine relative pitch rather than memorised absolute recognition.

![The Starting Note modal resolving the exercise's relative "so" degree to its randomly-chosen tonic for this playback](./screenshots/v2_movable_do_resolution.png)

### A Rebuilt, Accessible Visual System

V1 claimed an "AAA-accessible high-contrast schema" without a documented basis for it. V2's palette is built on a verified two-tier structure instead: bright tokens reserved strictly for decoration (no text ever sits on them), and separately-derived "deep" variants for anything text-bearing, each individually checked against WCAG AA's 4.5:1 contrast minimum rather than chosen by eye. Full architectural detail is in the [System Architecture & Logic Maps](architecture.md) doc; this is the user-facing result of that work.

![The homepage hero, showing the pushable CTA and hero particle field against the verified-accessible "deep" and decorative "vivid" palette tiers](./screenshots/v2_home_hero.png)

### Three-Page Restructure

V1's single-page application is now three purpose-built pages (Home, Classroom, and Practice Room), replacing one overloaded view with a deliberate learn-then-test information architecture. The Practice Room specifically strips away all navigation chrome in favour of a thin, focus-mode header, protecting concentration during an actual exercise.

![The Classroom page, with standard nav chrome and its Level Guide above the Preparation/Presentation/Practice tabs](./screenshots/v2_classroom_page.png)

### Dual-Purpose Rest Cards & the Anacrusis Mechanism

Rather than building a separate mechanism for pickup notes, the anacrusis reuses the exact same rest-initial motif cards (`rest-ti`, `rest-tika`) that already exist as ordinary mid-phrase rhythm content. Mid-phrase, they're just a card like any other: silence for the first half of the beat, a note for the second. At the very start of a phrase, that identical shape _is_ a pickup note: the rest counts the student in, and the sounding note lands right on the threshold into bar one, which is exactly what a musical anacrusis is. No second feature was built; an existing card was simply given a second job. An anacrusis adds precisely one beat to the exercise, never a full bar; the underlying phrase form is untouched, only a single pickup beat is prepended ahead of it.

![A Level 3 exercise opening on the rest-ti anacrusis card, the same card that's ordinary mid-phrase content everywhere else](./screenshots/v2_anacrusis_pickup.png)

### One Source of Truth for Notation

Every rhythm card's stick-notation SVG and its paired solfège entry card are computed from the same input: a single per-motif table of relative note-duration weights. Column boundaries, stem positions, and beam groupings are all derived proportionally from that one table, meaning the rhythm card's third stem and the solfège card's third entry column are guaranteed to land in the same place, for _any_ motif, without two separately-authored assets ever needing to be hand-tuned into agreement. This was the fix for a real bug during development: tied motifs spanning two grid boxes (a dotted note whose sound continues into the next box) initially left the solfège card with no entry column at all in the continuation box, because nothing tracked which portion of a motif's duration belonged to which box. The fix generalised the whole rendering system rather than patching the one motif that exposed the problem.

![tum-ti's two boxes: the dotted-crotchet stem paired with "so", and the tie-arc continuation correctly leaving its first cell blank before "mi"'s real column](./screenshots/v2_notation_alignment.png)

### Workspace Pagination for Longer Phrases

An 8-bar exercise in a busy metre can generate more individual rhythm cards than comfortably fit on one screen. Rather than shrinking cards to force a fit, or truncating longer phrases, the workspace paginates horizontally: dot navigation moves between pages of the same exercise, keeping every card at a consistent, legible size regardless of how long the underlying phrase is.

![A longer exercise's workspace, with dot navigation at the bottom moving between pages of the same phrase](./screenshots/v2_workspace_pagination.png)

### Tap-and-Hold Focus Editing

Selecting the correct card from a scrolling reel on a small touchscreen is a fundamentally different interaction problem than doing it with a mouse. Tap-and-hold on any workspace card opens a focused "vignette" view (the single card enlarged, with its own mirrored reel for making a selection up close) before returning to the full board. A deliberate second interaction mode for a problem that a single, one-size-fits-all interface handles poorly.

![The vignette view: a single workspace card enlarged and spotlit, with its own mirrored reel below for selecting up close](./screenshots/v2_tap_hold_vignette.png)

### Irregular Metres Without a Second Generator

5/8 and 7/8 don't divide into equal beats, so they're conventionally grouped (2+3, or 2+2+3) rather than treated as a flat tick count. Rather than building a dedicated irregular-metre generator, each group in the pattern is simply one more call to the existing bar generator: a "2" group is exactly one simple-time beat's worth of content, a "3" group is exactly one compound-time beat's worth, and both pools of content already existed. Architectural economy over building a parallel system for what turned out to be the same underlying problem at a smaller scale.

### Deliberately Unforced Cadence Logic

V1's own stated pedagogical principle, real motifs from curated pools rather than arbitrary randomness, extends into a specific, deliberate constraint on the melodic engine: sparse early tonesets (a two-note so-mi exercise, for instance) are _not_ forced to resolve onto a "correct" final note. Real early-repertoire songs built from just two or three notes don't reliably end the same way, because there isn't yet a strong enough tonal centre established to make one ending more "correct" than another, and forcing a resolution rule onto content that thin would have been mathematically tidy and musically dishonest. Cadence-forcing only activates once a level's toneset is rich enough to genuinely support the concept of a tonic.

### Mastery-Gated Progression

Practice Room has no level switcher of its own. A session always begins at Level 1, and advancing to the next level happens only by completing three exercises correctly in a row, surfaced through the celebration modal. This is a deliberate constraint, not a missing feature: it prevents a student from skipping ahead to content they haven't actually demonstrated mastery of. Classroom's level dropdown is a separate, unrelated control: it filters which level's curriculum guide and per-level panels are currently being viewed, with no effect on the active practice session at all.

![The celebration modal marking a 3-streak mastery gate cleared, the only way Practice Room ever advances a level](./screenshots/v2_confetti_celebration.png)

### Preparation, Presentation, and Practice Tabs

Classroom's level content originally stacked five panels (Presentation, Rhythm Workshop, Melodic Workshop, Example, Interval Detective) as one continuous scroll beneath the Level Guide, alongside a static Kodály reference matrix. Nothing distinguished "the bit that names what's new" from "the bit you actually drill," so returning to a specific level meant scrolling and re-reading headings to relocate whichever panel was actually relevant.

That flat list is now a three-tab folder strip (Preparation, Presentation, Practice), mirroring how these ideas are actually taught: experienced first, named second, and practised for as long as you like afterward. Presentation keeps its existing content unchanged; Practice bundles the four hands-on drills (Rhythm Workshop, Melodic Workshop, Example, Interval Detective) behind a single tab, so switching between "here's what's new" and "go practise it" is one click rather than scrolling past unrelated content to find it. Preparation shows a plain "not yet available" state at every level, a genuine placeholder, not a hidden bug, since no pre-exposure content has been built for any level yet. Each tab is coloured from the existing accessible palette (deep gold/tangerine/teal, no new tokens), and an active tab's fill merges directly into its panel below with no seam, reading as one continuous surface rather than two boxes touching. The now-redundant reference matrix, fully superseded by Presentation's real generated notation, was deleted entirely rather than kept in sync as a second source of truth.

![The Classroom page's Preparation/Presentation/Practice tab strip, Presentation active by default](./screenshots/v2_classroom_page.png)

### Presentation

Behind its own tab, Presentation is the explicit "here's what's new" moment for whichever level is selected, isolating only the motif(s)/syllable(s) genuinely introduced at that level rather than its full cumulative pool. Rhythm content renders as real stick notation (the same `renderRhythmSVG` the practice reel itself uses, not a separate illustration), and melody as the same colour-coded solfège circles used throughout the app, sorted low-to-high by pitch rather than left in their pedagogically-ordered (not pitch-ordered) source data. The two tracks are independent: Level 4 has new rhythm motifs but no new syllable, and Presentation says so plainly instead of rendering an empty circle row. Levels 5-9 show a clear "not yet available" state rather than a broken or hidden section, since those levels' generation algorithms don't exist yet.

![Presentation panel showing Level 1's new motif cards and ascending solfège circles](./screenshots/v2_presentation_panel.png)

### Rhythm Workshop

Behind the Practice tab, a select-to-drill reel of that level's new rhythm motifs, with a "Play Ostinato" button that loops the selected motif a fixed number of times via `AudioEngine.playOstinato`, deliberately simpler than the Practice Room's `playSequence` since there's no bar/form/cadence structure or count-in to schedule, just "this one thing, repeated." Motifs are grouped under Simple Time / Compound Time headings (`MOTIF_LIBRARY[id].type`, already stored per motif) rather than one undifferentiated row, so metre membership reads at a glance. A motif tied across two grid boxes (`tum-ti`, `syncopa`) renders both, using the same tie-arc continuation the main Practice Room workspace already draws correctly, rather than silently showing only the first box, a rendering-only gap fixed at its shared root so Presentation's copy of the same motifs is correct too.

![Rhythm Workshop at Level 2, showing the Simple/Compound grouping and tum-ti/syncopa's tied second box](./screenshots/v2_rhythm_workshop.png)

### Melodic Workshop

A keyboard, not a drill reel: every syllable in the level's **cumulative** toneset (not just what's new) renders as its own always-playable pad, click one and hear it immediately via a new, deliberately Transport-free `AudioEngine.playNote`, with no selection state and no repeat count. A lone new-to-level syllable had no melodic context on its own in the original select-then-loop design (Level 3's `fa` specifically is close to useless in isolation); showing the full toneset a student already knows, free to explore, replaces that entirely rather than patching it.

![Melodic Workshop at Level 3, showing every cumulative syllable as an independently clickable key](./screenshots/v2_melodic_workshop.png)

### Example

A fourth Classroom panel, listen-only: Play generates a fresh phrase from that level's real generator (`generateRhythmTimeline`, `countSoundingNotes`, and `generatePitchLine`, the exact same functions Practice Room's dictation engine runs) and plays it straight through with `AudioEngine.playSequence`, no workspace, no submission, no evaluation. Each click regenerates rather than replaying the same phrase, since there's no fixed target here to stay in sync with; the resolved metre and bar count render as a plain confirmation that something new actually played.

![Example panel after a click, showing the resolved metre/bar count and the Play button](./screenshots/v2_example_panel.png)

### Interval Detective

The fifth and final Classroom panel: Play draws two syllables from the level's full cumulative toneset (not just what's new that level), sounds them in a random ascending or descending order, and the student picks the matching pair from the same colour-coded solfège circles used throughout the app, with no text-based answer, staying in the app's existing visual vocabulary. Guessing auto-evaluates on the second distinct pick rather than needing a separate submit button, a deliberately lighter interaction than Practice Room's multi-slot dictation flow. A new semitone-distance-to-interval-name lookup (0–12 semitones, reusing the same offsets `SOLFEGE_DEGREES` already stores for movable-do resolution) names the interval in the feedback either way — "so → mi... Minor 3rd" — turning a right/wrong signal into an actual piece of ear-training vocabulary.

![Interval Detective after a guess, showing the incorrect-answer ring and the revealed interval name](./screenshots/v2_interval_detective.png)

---

<p align="right">(<a href="#top">Back to top</a>)</p>
