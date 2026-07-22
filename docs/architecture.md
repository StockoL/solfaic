<a name="top"></a>

_This is a split-out detail doc — for the project overview, see the [root README](../README.md)._

## <a name="architecture"></a> System Architecture & Logic Maps

Solfaic V2 separates cleanly into two architectural halves: a **JavaScript engine layer** (rhythm generation, extended to melodic generation) and a **CUBE CSS presentation layer**, neither of which existed in this form in V1.

### The Dual-Engine State Machine

V1's single rhythm-only engine is now two parallel generative systems sharing one architecture:

The Rhythm Engine generates a bar-by-bar timeline via weighted Markov transitions over a curated motif library, exactly as in V1, now extended with anacrusis (pickup-beat) support and irregular-metre grouping. The Melodic Engine is built directly onto the same architectural pattern rather than as a separate system, and generates a parallel solfège line: its own curriculum-grounded, independently-namespaced Markov tables per level and tonal mode, with cadence-forcing genuinely disabled (not just weighted low) wherever a toneset is too sparse to have a real "correct" ending.

Both engines are deliberately key-agnostic at generation time, so output is relative solfège tokens and rhythmic values, never absolute pitches. This keeps the movable-do principle architectural rather than incidental.

### The CUBE CSS Architecture (New in V2)

Where V1 shipped a single `style.css`, V2's presentation layer is structured in four native CSS cascade layers, later layers always winning regardless of selector specificity:

```text
Reset  →  Global  →  Compositions  →  Blocks  →  Utilities
```

- **Global:** a JSON-driven design token pipeline (`design-tokens.json` → a Node compiler → generated `variables.css`), defining colour, type, space, and motion values once and consuming them everywhere, never hardcoded in component files.
- **Compositions:** ten intrinsic layout primitives (Cluster, Spread, Switcher, Grid, Reel, Container, Wrapper, Center, Sidebar, Flow) governing structure only; no colour, border, or typography ever lives here.
- **Blocks:** self-contained visual components (Button, Nav, Accordion, Modal, Badge, Level-Select), each composing freely with Compositions on the same element rather than duplicating layout logic.
- **Utilities:** single-purpose overrides (visually-hidden, text alignment, ambient animation helpers) sitting at the top of the cascade for deliberate, isolated exceptions.

### The Generative Pipeline (extended from V1's Movable-Do Bridge)

V1 speculatively pre-wired a `pitch: null` field into every timeline event without a resolution mechanism behind it. V2 completes that bridge:

1. **Generation** produces a rhythm timeline and a parallel pitch line independently, each honouring its own level-gated toneset/motif constraints.
2. **Resolution** happens only at playback: a randomly-chosen tonic (from a curated, comfortably-singable set) combines with each solfège token via a semitone-offset lookup table to produce real Tone.js note names, so the exact same generated exercise sounds in a different key nearly every time it's played.
3. **Rendering** derives every rhythm card's stick-notation SVG _and_ its paired solfège card's entry-column layout from the same source data (a motif's note-by-note duration weights), which guarantees the two cards' columns always align for any motif, without hand-tuning two separate assets in sync.

### Asynchronous Timeline Synchronisation & Two-Phase Evaluation

Each exercise is dictated once and answered in two passes against the same audio: rhythm, then solfège layered over the confirmed rhythm, each with independent play budgets and independent evaluation per phase. Evaluation itself is graduated rather than binary. A first incorrect submission shakes only the wrong elements and prompts a retry without affecting the streak, while a second still-wrong submission on the same answer triggers phase-specific remediation: the correct rhythm shown directly, or for pitch, the actual interval (both notes, not just the wrong one) that needs practice.

```text
[ Curriculum Data ]                     [ Design Tokens (JSON) ]
        │                                        │
        ▼                                        ▼
┌────────────────────┐                  ┌─────────────────────────┐
│   RHYTHM ENGINE      │                 │    Token Compiler          │
│   (Markov, motifs,    │                │    → variables.css          │
│   anacrusis, metre)   │                └────────────┬────────────────┘
└──────────┬───────────┘                               │
           │                                           ▼
           ▼                                  ┌─────────────────────────┐
┌────────────────────┐                        │   CUBE Cascade Layers     │
│   MELODIC ENGINE      │                      │   Reset→Global→Comp→     │
│   (Markov, tonesets,   │                     │   Block→Utility            │
│   cadence logic)       │                     └────────────┬────────────────┘
└──────────┬───────────┘                                    │
           ▼                                                │
┌─────────────────────────────┐                             │
│   Movable-Do Resolution        │                           │
│   (tonic + semitone lookup)    │                           │
└──────────┬────────────────────┘                            │
           ▼                                                 │
┌─────────────────────────────┐                              │
│   Audio Engine (Tone.js)       │                            │
│   count-in → playback →         │                           │
│   beat-pulse events               │                         │
└──────────┬────────────────────┘                             │
           │                                                  │
           ▼                                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│         Workspace Render (rhythm-notation.js + CUBE Blocks)          │
│    one weight table → SVG stick notation + solfège grid,             │
│    every element styled entirely through the Block layer above       │
└──────────────────────────────┬──────────────────────────────────────┘
                                ▼
                  ┌──────────────────────────────┐
                  │      User Interaction Loop      │
                  │   (reel selection → workspace     │
                  │   submission, rhythm then pitch)   │
                  └───────────────┬───────────────────┘
                                  ▼
                  ┌──────────────────────────────┐
                  │     Two-Phase Evaluation         │
                  │   graduated feedback per attempt   │
                  └───────────────┬───────────────────┘
                                  │
                ┌─────────────────┴──────────────────┐
                ▼                                      ▼
     [ Correct → next phase,               [ Wrong → targeted shake,
       or streak++ on full                    retry, then phase-specific
       completion ]                            remediation modal ]
```

---

<p align="right">(<a href="#top">Back to top</a>)</p>
