// ============================================================================
// DATA DICTIONARIES (The Application "Database")
// ============================================================================

/**
 * Master Motif Engine Configuration
 * Maps visual tokens to mathematical time representations required by Tone.js.
 * 'ticks' represent spatial cost (e.g., too requires 2 empty layout slots).
 *
 * Rhythm-card SVGs are no longer stored here — rhythm-notation.js generates
 * them (and the matching solfege-card column layout) directly from each
 * motif's `playback` array, so the two stay in sync by construction instead
 * of being two hand-authored assets that can drift apart.
 *
 * `restMask` is an optional parallel array to `playback` — when present,
 * `restMask[i] === true` means that playback slot is silent (still consumes
 * its share of the beat, but audio.js must not trigger a note for it).
 * Undefined for every motif that has no silent subdivisions.
 *
 * `introducedAtLevel` is the level this specific motif first becomes
 * available at — sourced from MOTIF_POOLS' own naming convention
 * (simpleL1, simpleL2, ...) below, which is the authoritative source for
 * this mapping (no separate curriculum-vocabulary doc exists in this repo).
 */
export const MOTIF_LIBRARY = {
  // ---- Simple time ----
  ta: {
    introducedAtLevel: 1,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ta",
    playback: ["4n"],
  },
  titi: {
    introducedAtLevel: 1,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-ti",
    playback: ["8n", "8n"],
  },
  taRest: {
    introducedAtLevel: 1,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ta-rest",
    playback: [],
  },
  tikatika: {
    introducedAtLevel: 2,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-ka-ti-ka",
    playback: ["16n", "16n", "16n", "16n"],
  },
  tikati: {
    introducedAtLevel: 2,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-ka-ti",
    playback: ["16n", "16n", "8n"],
  },
  titika: {
    introducedAtLevel: 2,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-ti-ka",
    playback: ["8n", "16n", "16n"],
  },
  too: {
    introducedAtLevel: 2,
    type: "simple",
    duration: "2n",
    ticks: 2,
    label: "too",
    playback: ["2n"],
  },
  tooRest: {
    introducedAtLevel: 2,
    type: "simple",
    duration: "2n",
    ticks: 2,
    label: "too-rest",
    playback: [],
  },
  timKa: {
    introducedAtLevel: 2,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "tim-ka",
    playback: ["8n.", "16n"],
  },
  tumTi: {
    introducedAtLevel: 2,
    type: "simple",
    duration: "2n",
    ticks: 2,
    label: "tum-ti",
    playback: ["4n.", "8n"],
    // Same box-spanning shape as syncopa v2: the dotted crotchet's second
    // half rings into box B before the trailing quaver attacks — box B
    // needs the tie-arc mark rather than the default flat dash.
    tieContinuation: true,
  },
  syncopaV2: {
    introducedAtLevel: 2,
    type: "simple",
    duration: "2n",
    ticks: 2,
    label: "syncopa",
    playback: ["8n", "4n", "8n"],
    // The middle note is tied across the box A / box B boundary — box B's
    // extension slot needs a tie-arc mark rather than the default flat
    // dash (see rhythm-notation.js's renderTieArcSVG). Only one extension
    // slot exists for a 2-tick motif, so a boolean is unambiguous here.
    tieContinuation: true,
  },
  trioLa: {
    introducedAtLevel: 3,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "tri-o-la",
    playback: ["8t", "8t", "8t"],
  },
  restTi: {
    introducedAtLevel: 3,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "rest-ti",
    playback: ["8n", "8n"],
    restMask: [true, false],
  },
  syncopaV1: {
    introducedAtLevel: 4,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "syncopa",
    playback: ["16n", "8n", "16n"],
  },
  restTika: {
    introducedAtLevel: 4,
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "rest-tika",
    playback: ["8n", "16n", "16n"],
    restMask: [true, false, false],
  },
  tooo: {
    introducedAtLevel: 7,
    type: "simple",
    duration: "1n",
    ticks: 4,
    label: "too-oo-oo-oo",
    playback: ["1n"],
  },

  // ---- Compound time ----
  tum: {
    introducedAtLevel: 2,
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tum",
    playback: ["4n."],
  },
  tititi: {
    introducedAtLevel: 2,
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "ti-ti-ti",
    playback: ["8n", "8n", "8n"],
  },
  tati: {
    introducedAtLevel: 2,
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "ta-ti",
    playback: ["4n", "8n"],
  },
  tumRest: {
    introducedAtLevel: 2,
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tum-rest",
    playback: [],
  },
  tikaTikaTi: {
    introducedAtLevel: 3,
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tika-tika-ti",
    playback: ["16n", "16n", "16n", "16n", "8n"],
  },
  toom: {
    introducedAtLevel: 3,
    type: "compound",
    duration: "2n.",
    ticks: 2,
    label: "toom",
    playback: ["2n."],
  },
  toomRest: {
    introducedAtLevel: 3,
    type: "compound",
    duration: "2n.",
    ticks: 2,
    label: "toom-rest",
    playback: [],
  },
  tiTikaTi: {
    introducedAtLevel: 4,
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "ti-tika-ti",
    playback: ["8n", "16n", "16n", "8n"],
  },
};

/**
 * ----------------------------------------------------------------------------
 * DATA DICTIONARIES: POOLS & TEMPLATES
 * Defining these externally keeps the main progression matrix DRY and scalable.
 * Pools are named by the level a motif is *introduced* at; levelRules below
 * composes them cumulatively so e.g. Level 3 still has access to Level 1/2
 * content.
 * ----------------------------------------------------------------------------
 */

export const MOTIF_POOLS = {
  simpleL1: ["ta", "titi", "taRest"],
  simpleL2: [
    "tikatika",
    "tikati",
    "titika",
    "too",
    "tooRest",
    "timKa",
    "tumTi",
    "syncopaV2",
  ],
  simpleL3: ["trioLa", "restTi"],
  simpleL4: ["syncopaV1", "restTika"],
  // Compound time doesn't start until Level 2 (see metre table).
  compoundL2: ["tum", "tititi", "tati", "tumRest"],
  compoundL3: ["tikaTikaTi", "toom", "toomRest"],
  compoundL4: ["tiTikaTi"],
  // Levels 5-9's only new rhythm vocabulary -- see levelRules[7] below.
  simpleL7: ["tooo"],
};

export const FORM_TEMPLATES = {
  bars2: [
    ["A", "B"], // 2-bar through-composed snippet
    ["A", "A"], // 2-bar repeated snippet
  ],
  bars4: [
    ["A", "B", "A", "C"], // Classic 4-bar Period
    ["A", "A", "B", "A"], // Pop form
    ["A", "B", "A", "B"], // 4-bar AB form
    ["A", "B", "C", "D"], // 4-bar through-composed form
    ["A", "B", "C", "C"], // 4-bar rounded form
    ["A", "B", "B", "A"], // 4-bar palindrome form
  ],
  bars8: [
    // 1. Parallel Period: The most standard classical form.
    // The second half is an exact copy of the first, except for the final resolving cadence.
    ["A", "B", "C", "D", "A", "B", "C", "E"],

    // 2. Double Period (Rondo-lite): High repetition, incredibly friendly for dictation students.
    ["A", "B", "A", "C", "A", "B", "A", "D"],

    // 3. Sentence Form: "Presentation" (A-B repeated), followed by a developmental "Continuation".
    ["A", "B", "A", "B", "C", "D", "E", "F"],

    // 4. AABA "Pop/Jazz" Form: 2 bars per section. Builds great expectation for the return of A.
    ["A", "B", "A", "B", "C", "D", "A", "B"],

    // 5. Contrasting Period: The second half introduces new material but has internal repetition.
    ["A", "B", "C", "D", "E", "F", "E", "G"],

    // 6. Rounded Form: A developmental middle section that safely returns to the opening idea.
    ["A", "A", "B", "C", "D", "E", "A", "A"],
  ],
};

/**
 * ----------------------------------------------------------------------------
 * MARKOV SYNTAX DICTIONARY (Grammar & Phrasing)
 * Defines the probability of which motif should follow the current motif.
 * Higher numbers represent a stronger musical pull (idiomatic resolution).
 * A first draft, same as the pitch tables below — tune against real
 * repertoire once this is generating audible phrases. generateBarSequence
 * falls back to uniform-random among viable options whenever the previous
 * motif has no weighted entry for any of them, so gaps here are safe, just
 * less idiomatic.
 * ----------------------------------------------------------------------------
 */
export const SYNTAX_DICTIONARY = {
  // ==========================================
  // SIMPLE METRE MOTIFS (2/4, 3/4, 4/4)
  // ==========================================

  ta: {
    ta: 30, // Crotchets comfortably repeat
    titi: 25, // Smooth transition into quavers
    tikatika: 10, // Sudden burst of energy
    too: 15, // Settle into a minim
    taRest: 5, // Take a quick breath
    timKa: 10, // Lean into a dotted-quaver pickup
    tumTi: 5,
  },

  titi: {
    ta: 40, // Quavers heavily want to land on a solid downbeat
    titi: 25, // Continuous running quavers
    tikati: 10, // Move into a syncopated feel
    titika: 10, // Move into a forward-leaning syncopation
    too: 10,
    syncopaV1: 5,
  },

  taRest: {
    ta: 55, // Always step out of a rest with a strong, confident attack
    titi: 30, // Or a running attack
    tikatika: 10, // Surprise burst out of the silence
    too: 5,
  },

  too: {
    ta: 35, // Minims are a full reset. Step out cleanly.
    titi: 30, // Regain lost momentum immediately
    tikatika: 10,
    taRest: 10,
    too: 10, // Sustained notes can also comfortably repeat
    trioLa: 5,
  },

  tooRest: {
    ta: 50,
    titi: 30,
    too: 20,
  },

  // --- Advanced Simple Subdivisions (High Tension) ---

  tikatika: {
    ta: 55, // 4 semiquavers ALMOST ALWAYS resolve to a stable crotchet
    titi: 20, // Rarely, they resolve to running quavers
    too: 15, // Huge release into a minim
    tikati: 5,
    titika: 5,
  },

  tikati: {
    ta: 55, // The trailing quaver lands nicely onto a crotchet
    titi: 25,
    tikatika: 10,
    too: 10,
  },

  titika: {
    ta: 60, // The two trailing semiquavers act as a pickup, pushing heavily into the next beat
    titi: 20,
    too: 10,
    tikatika: 10,
  },

  timKa: {
    ta: 45, // The dotted-quaver-semiquaver snap wants a clean landing
    titi: 25,
    timKa: 15, // Comfortably repeats as a rhythmic figure
    too: 15,
  },

  tumTi: {
    ta: 40,
    titi: 30,
    too: 20,
    taRest: 10,
  },

  syncopaV2: {
    ta: 50, // Syncopation craves a strong resolution
    too: 25,
    titi: 15,
    syncopaV2: 10,
  },

  trioLa: {
    ta: 45,
    titi: 25,
    trioLa: 20, // Triplet runs comfortably chain together
    too: 10,
  },

  restTi: {
    ta: 55, // The pickup's sounding half wants a confident landing
    titi: 30,
    tikatika: 15,
  },

  syncopaV1: {
    ta: 50,
    titi: 25,
    too: 15,
    syncopaV1: 10,
  },

  restTika: {
    ta: 55,
    titi: 30,
    tikati: 15,
  },

  // ==========================================
  // COMPOUND METRE MOTIFS (6/8)
  // ==========================================

  tum: {
    tum: 30, // Dotted crotchets comfortably repeat
    tititi: 35, // Flow naturally into running quavers
    tati: 15, // Move into a lilting long-short
    tumRest: 5,
    toom: 10,
    tikaTikaTi: 5,
  },

  tititi: {
    tum: 45, // Running quavers want to land on a solid beat
    tati: 25, // Shift into a lilt
    tititi: 15, // Continuous running
    toom: 10,
    tikaTikaTi: 5,
  },

  tati: {
    tititi: 40, // The short quaver acts as a springboard into running notes
    tum: 35, // Or resolves safely
    tati: 10, // Skipping/galloping feel
    tiTikaTi: 15,
  },

  tumRest: {
    tum: 55, // Step out of the rest with a solid beat
    tititi: 35, // Or a running beat
    toom: 10,
  },

  tikaTikaTi: {
    tum: 55, // The trailing quaver wants a clean landing
    tititi: 25,
    toom: 10,
    tikaTikaTi: 10,
  },

  toom: {
    tum: 40, // Full reset from the sustained dotted minim
    tititi: 35,
    tumRest: 15,
    toom: 10,
  },

  toomRest: {
    tum: 55,
    tititi: 30,
    toom: 15,
  },

  tiTikaTi: {
    tum: 50,
    tititi: 30,
    tati: 10,
    tiTikaTi: 10,
  },
};

/**
 * ----------------------------------------------------------------------------
 * PROGRESSION MATRIX (levelRules)
 * Uses ES6 Spread Operators (...) to cumulatively inherit arrays from previous levels.
 *
 * New metres only enter at the levels the metre table specifies (Level 2 adds
 * 6/8; nothing new for rhythm at Level 3/4 — those levels add motif
 * vocabulary and pitch content on the existing metre/form set instead).
 * `anacrusisMotifs` is the level-gated pool the anacrusis prepend step in
 * engine.js draws from — empty/absent below Level 3 per the design doc's
 * "Confirmed: rest-ti at Level 3, rest-tika at Level 4."
 * ----------------------------------------------------------------------------
 */
export const levelRules = {
  1: {
    allowedMetres: ["2/4", "3/4", "4/4"],
    barOptions: [2],
    simpleMotifs: [...MOTIF_POOLS.simpleL1],
    compoundMotifs: [],
    allowedForms: [...FORM_TEMPLATES.bars2],
    enforceCadence: false,
    anacrusisMotifs: [],
  },
  2: {
    allowedMetres: ["2/4", "3/4", "4/4", "6/8"],
    barOptions: [4],
    simpleMotifs: [...MOTIF_POOLS.simpleL1, ...MOTIF_POOLS.simpleL2],
    compoundMotifs: [...MOTIF_POOLS.compoundL2],
    allowedForms: [...FORM_TEMPLATES.bars4],
    enforceCadence: true,
    anacrusisMotifs: [],
  },
  3: {
    allowedMetres: ["2/4", "3/4", "4/4", "6/8"],
    barOptions: [4, 8],
    simpleMotifs: [
      ...MOTIF_POOLS.simpleL1,
      ...MOTIF_POOLS.simpleL2,
      ...MOTIF_POOLS.simpleL3,
    ],
    compoundMotifs: [...MOTIF_POOLS.compoundL2, ...MOTIF_POOLS.compoundL3],
    allowedForms: [...FORM_TEMPLATES.bars4, ...FORM_TEMPLATES.bars8],
    enforceCadence: true,
    anacrusisMotifs: ["restTi"],
  },
  4: {
    allowedMetres: ["2/4", "3/4", "4/4", "6/8"],
    barOptions: [4, 8],
    simpleMotifs: [
      ...MOTIF_POOLS.simpleL1,
      ...MOTIF_POOLS.simpleL2,
      ...MOTIF_POOLS.simpleL3,
      ...MOTIF_POOLS.simpleL4,
    ],
    compoundMotifs: [
      ...MOTIF_POOLS.compoundL2,
      ...MOTIF_POOLS.compoundL3,
      ...MOTIF_POOLS.compoundL4,
    ],
    allowedForms: [...FORM_TEMPLATES.bars4, ...FORM_TEMPLATES.bars8],
    enforceCadence: true,
    anacrusisMotifs: ["restTi", "restTika"],
  },
};

/**
 * Levels 5-9: rhythm needs no new vocabulary beyond Level 7's `tooo`
 * (whole note) -- these levels' real advances are all on the pitch side
 * (new tonesets/modes), reusing Level 4's cumulative motif pool within the
 * same already-supported metres (no irregular metres tonight).
 */
levelRules[5] = { ...levelRules[4] };
levelRules[6] = { ...levelRules[5] };
levelRules[7] = {
  ...levelRules[6],
  simpleMotifs: [...levelRules[6].simpleMotifs, "tooo"],
};
levelRules[8] = { ...levelRules[7] };
levelRules[9] = { ...levelRules[8] };

/**
 * The highest level with real content — derived from levelRules itself
 * rather than hardcoded, so a UI ceiling (e.g. "you've mastered
 * everything") never drifts out of sync with the data the way the
 * Classroom reference table did.
 */
export const MAX_LEVEL = Math.max(...Object.keys(levelRules).map(Number));

/**
 * Pedagogical Cadence Pool
 * These are the structurally stable blocks used to musically resolve phrases
 * — sustained notes/rests in both simple and compound time, at both 1- and
 * 2-tick lengths, so forceCadence always has an exact-fit option regardless
 * of how many ticks remain in the final bar.
 */
export const CADENCE_MOTIFS = [
  "ta",
  "too",
  "taRest",
  "tooRest",
  "tum",
  "tumRest",
  "toom",
  "toomRest",
];

/**
 * ----------------------------------------------------------------------------
 * IRREGULAR METRE GROUPING (5/8, 7/8)
 * A "2" group is one simple-time beat's worth of content; a "3" group is one
 * compound-time beat's worth. generateBarSequence is called once per group
 * with ticksPerBar: 1 and the matching motif pool — no parallel irregular-
 * metre generator needed. `default` is used for bars whose form letter
 * matches the phrase's first letter ("A"); `variants` is drawn from for the
 * first contrasting letter, tying the metre shift to the same place the
 * melody/rhythm is already changing.
 * ----------------------------------------------------------------------------
 */
export const IRREGULAR_METRE_GROUPINGS = {
  "5/8": {
    default: [2, 3],
    variants: [[3, 2]],
  },
  "7/8": {
    default: [2, 2, 3],
    variants: [
      [3, 2, 2],
      [2, 3, 2],
    ],
  },
};

/**
 * ----------------------------------------------------------------------------
 * PITCH DATA LAYER (Movable-Do Solfège)
 * ----------------------------------------------------------------------------
 */

/**
 * Semitone offset from the movable tonic ("do" = 0). Used to resolve a
 * solfège token + a chosen tonic into a real pitch. Enharmonic spelling is
 * deliberately not modelled (out of scope per the design doc header) — `si`
 * and `le` share a semitone value (#5/b6 are the same key), which is correct
 * for audio purposes even though they're different taught scale degrees.
 */
export const SOLFEGE_DEGREES = {
  so_low: -5,
  la_low: -3,
  do: 0,
  ra: 1,
  re: 2,
  ma: 3,
  mi: 4,
  fa: 5,
  fi: 6,
  so: 7,
  si: 8,
  le: 8,
  la: 9,
  ta: 10,
  ti: 11,
  "do'": 12,
};

/**
 * Standard interval name by semitone distance — index IS the distance, so
 * a lookup is just `INTERVAL_NAMES[semitones]`. Reuses SOLFEGE_DEGREES'
 * existing offsets rather than needing separate interval curriculum data;
 * Interval Detective is the sole consumer.
 *
 * Extends past the octave (13-17, compound intervals) because Level 2's
 * toneset spans so_low up to do' — a full 17 semitones once the low so/la
 * pair is in the mix, not just the single octave 1-4's tonesets stay
 * within. Compound names follow standard theory (an octave plus the
 * simple interval — a 9th is an octave+2nd, a 10th an octave+3rd, etc.).
 */
export const INTERVAL_NAMES = [
  "Unison",
  "Minor 2nd",
  "Major 2nd",
  "Minor 3rd",
  "Major 3rd",
  "Perfect 4th",
  "Tritone",
  "Perfect 5th",
  "Minor 6th",
  "Major 6th",
  "Minor 7th",
  "Major 7th",
  "Octave",
  "Minor 9th",
  "Major 9th",
  "Minor 10th",
  "Major 10th",
  "Perfect 11th",
];

/**
 * Tonic pool an exercise's movable "do" is randomly chosen from — a modest
 * mid-range band (not specified numerically in the design doc) so Level 1-4
 * material, which ranges as low as "so" below the tonic and as high as
 * "do'" an octave above it, stays in a comfortable singing range.
 */
export const allowedTonics = ["C4", "D4", "Eb4", "F4", "G4"];

export const PITCH_LEVEL_RULES = {
  1: {
    melodicGroups: {
      soMiLa: { toneset: ["so", "mi", "la"], cadenceRequired: false },
      doReMi: { toneset: ["do", "re", "mi"], cadenceRequired: false },
      // Later-in-level full merged pentatonic, alongside the two original
      // groups rather than replacing them — the source's actual
      // progression is s-m -> m-r-d -> s-m-r-d -> l-s-m-r-d, and this
      // third option is that final stage.
      fullPentatonic: {
        toneset: ["do", "re", "mi", "so", "la"],
        cadenceRequired: false,
      },
    },
    // Level 1 exercises should also draw from random NON-EMPTY subsets
    // of a group's toneset (sometimes just {so,mi}, sometimes the full
    // {so,mi,la}) rather than always using all 3 notes — this matches
    // how real early repertoire progressively adds notes, and it's the
    // direct reason cadence-forcing has to be optional in the first
    // place (a 2-note subset has no meaningful "tonic").
  },
  2: {
    // so_low/la_low are genuinely below the tonic (Charlie Over the
    // Ocean needs them) -- resolveSolfegeToNote's octave arithmetic
    // already handles negative offsets generically, so this is additive.
    toneset: ["so_low", "la_low", "do", "re", "mi", "so", "la", "do'"],
    cadenceRequired: true,
    cadenceTarget: "do",
  },
  3: {
    toneset: ["do", "re", "mi", "fa", "so", "la"],
    cadenceRequired: true,
    cadenceTargets: ["do", "la"],
    modes: {
      do: { level: 3, mode: "doMode" },
      la: { level: 3, mode: "laMode" },
    },
  },
  4: {
    // Plain 5-note pentatonic (no fa) — do/la modes are Level 3's tables,
    // reused here and filtered down to this level's fa-less toneset.
    toneset: ["do", "re", "mi", "so", "la"],
    cadenceRequired: true,
    cadenceTargets: ["do", "la", "re", "mi", "so"],
    modes: {
      do: { level: 3, mode: "doMode" },
      la: { level: 3, mode: "laMode" },
      re: { level: 4, mode: "reMode" },
      mi: { level: 4, mode: "miMode" },
      so: { level: 4, mode: "soMode" },
    },
  },
};

/**
 * Levels 5-9: adds `ti` (completing the diatonic scale) at Level 5, `fi`/
 * `si` (harmonic/melodic minor) at Level 7, and `ra`/`ma`/`le` (completing
 * the chromatic set) at Level 8 -- extending the existing do-mode/la-mode
 * tables rather than building new bespoke systems. `modes` mirrors Levels
 * 3/4's exact pattern (cadence-target syllable -> {level, mode} pointing
 * into PITCH_SYNTAX_DICTIONARY) -- generatePitchLine's fallback branch
 * (anything past levelId 1/2) requires this map to exist, it's not
 * optional bookkeeping.
 */
PITCH_LEVEL_RULES[5] = {
  toneset: ["do", "re", "mi", "fa", "so", "la", "ti"],
  cadenceRequired: true,
  cadenceTargets: ["do", "la"],
  modes: {
    do: { level: 5, mode: "doMode" },
    la: { level: 5, mode: "laMode" },
  },
};

// Level 6 is a consolidation level -- same toneset/tables as Level 5,
// no melodic-sequence algorithm tonight (deferred pending a real design pass).
PITCH_LEVEL_RULES[6] = { ...PITCH_LEVEL_RULES[5] };

PITCH_LEVEL_RULES[7] = {
  // fi/si extend la-mode only (harmonic/melodic minor are inherently
  // la-based constructs) -- do-mode's cadence isn't offered at this level.
  toneset: ["do", "re", "mi", "fa", "so", "la", "ti", "si", "fi"],
  cadenceRequired: true,
  cadenceTargets: ["la"],
  modes: {
    la: { level: 7, mode: "laMode" },
  },
};

PITCH_LEVEL_RULES[8] = {
  toneset: [
    "do",
    "re",
    "mi",
    "fa",
    "so",
    "la",
    "ti",
    "si",
    "fi",
    "ra",
    "ma",
    "le",
  ],
  cadenceRequired: true,
  cadenceTargets: ["do", "la"],
  modes: {
    do: { level: 8, mode: "doMode" },
    la: { level: 8, mode: "laMode" },
  },
};

// No real modulation tonight -- Level 9 generates within the same rich,
// chromatic key as Level 8 rather than an actual mid-phrase key change.
PITCH_LEVEL_RULES[9] = { ...PITCH_LEVEL_RULES[8] };

/**
 * Preparation tab content: real Kodály "prepare through familiar repertoire"
 * — songs chosen to sit inside each level's actual PITCH_LEVEL_RULES
 * toneset above, not arbitrary picks. Only levels with a real toneset get a
 * list; Levels 5-9 keep the existing "not yet available" state.
 */
export const PREPARATION_SONGS = {
  1: [
    {
      title: "Rain, Rain, Go Away",
      note: "Built on so-mi-la — the falling so-mi call is the first interval most children sing.",
    },
    {
      title: "Pease Pudding Hot",
      note: "Stepwise do-re-mi — the other half of Level 1's toneset, moving by step rather than leap.",
    },
  ],
  2: [
    {
      title: "Auld Lang Syne",
      note: "A full do-re-mi-so-la melody resolving home to do — Level 2's whole toneset, cadence included.",
    },
    {
      title: "Amazing Grace",
      note: "Another genuinely pentatonic tune (no fa, no ti) that lands squarely in Level 2's five notes.",
    },
  ],
  3: [
    {
      title: "Frère Jacques",
      note: "Introduces fa naturally inside a do-re-mi-fa-so line — Level 3's do-mode toneset.",
    },
    {
      title: "Scarborough Fair",
      note: "A modal folk melody centred away from do — good preparation for Level 3's la-mode.",
    },
  ],
  4: [
    {
      title: "Sakura",
      note: "A pentatonic melody without fa, useful for hearing the same five notes centred differently.",
    },
    {
      title: "Land of the Silver Birch",
      note: "Another well-known pentatonic tune — Level 4 is about the modes these five notes can form, not new notes.",
    },
  ],
};

/**
 * Fully namespaced Markov weights for pitch generation — each melodic
 * group/mode is its own object so e.g. "mi" inside soMiLa and "mi" inside
 * doReMi never collide. A genuine first draft (see design doc); every row
 * sums to 100, matching SYNTAX_DICTIONARY's convention.
 */
export const PITCH_SYNTAX_DICTIONARY = {
  1: {
    soMiLa: {
      so: { mi: 50, so: 20, la: 30 },
      mi: { so: 45, mi: 20, la: 35 },
      la: { so: 50, mi: 20, la: 30 },
    },
    doReMi: {
      do: { do: 30, re: 30, mi: 40 },
      re: { do: 55, mi: 30, re: 15 },
      mi: { do: 45, re: 20, mi: 35 },
    },
    // Later-in-level full merged pentatonic (l-s-m-r-d) -- the source's
    // real progression adds this as a final stage past the two starting
    // groups above, not a replacement for either.
    fullPentatonic: {
      do: { do: 20, re: 30, mi: 30, so: 10, la: 10 },
      re: { do: 40, mi: 30, re: 10, so: 10, la: 10 },
      mi: { do: 25, re: 25, mi: 15, so: 25, la: 10 },
      so: { mi: 30, do: 20, so: 15, la: 25, re: 10 },
      la: { so: 40, mi: 20, la: 15, do: 15, re: 10 },
    },
  },

  2: {
    // so_low/la_low are genuinely below the tonic (Charlie Over the
    // Ocean needs them) -- rare passing tones dipping below the tonic
    // before resolving back up, so existing rows get a modest weight
    // toward them (heaviest from so/la/do, minimal from mi/do') and their
    // own rows resolve mostly upward rather than lingering low.
    unified: {
      do: {
        do: 15,
        re: 20,
        mi: 20,
        so: 10,
        la: 10,
        "do'": 10,
        so_low: 8,
        la_low: 7,
      },
      re: { do: 40, mi: 25, re: 15, so: 15, so_low: 3, la_low: 2 },
      mi: { do: 33, re: 15, mi: 15, so: 23, la: 10, so_low: 2, la_low: 2 },
      so: {
        mi: 27,
        so: 13,
        la: 18,
        do: 14,
        re: 9,
        "do'": 9,
        so_low: 7,
        la_low: 3,
      },
      la: { so: 36, mi: 13, la: 13, do: 18, "do'": 9, so_low: 3, la_low: 8 },
      "do'": {
        la: 28,
        so: 24,
        "do'": 14,
        mi: 14,
        do: 14,
        so_low: 3,
        la_low: 3,
      },
      so_low: { do: 40, la: 20, so_low: 15, la_low: 15, mi: 5, re: 5 },
      la_low: { do: 35, so_low: 25, la_low: 15, la: 15, mi: 5, re: 5 },
    },
  },

  3: {
    doMode: {
      do: { do: 20, re: 20, mi: 25, fa: 5, so: 15, la: 10, "do'": 5 },
      re: { do: 45, mi: 25, fa: 10, re: 10, so: 10 },
      mi: { do: 30, re: 15, mi: 15, fa: 15, so: 20, la: 5 },
      fa: { mi: 60, so: 20, fa: 10, re: 10 },
      so: { mi: 25, fa: 10, so: 15, la: 20, do: 20, re: 10 },
      la: { so: 40, mi: 15, la: 15, do: 20, fa: 10 },
    },
    laMode: {
      do: { la: 40, do: 15, mi: 20, re: 15, so: 10 },
      re: { do: 30, mi: 20, re: 15, la: 25, fa: 10 },
      mi: { re: 15, fa: 15, mi: 15, so: 15, la: 30, do: 10 },
      fa: { mi: 55, so: 15, fa: 10, la: 20 },
      so: { la: 35, mi: 20, fa: 10, so: 15, do: 20 },
      la: { la: 25, so: 25, mi: 20, do: 20, fa: 10 },
    },
  },

  4: {
    reMode: {
      do: { re: 35, do: 15, mi: 25, la: 15, so: 10 },
      re: { re: 20, do: 25, mi: 25, so: 15, la: 15 },
      mi: { re: 30, do: 20, mi: 15, so: 20, la: 15 },
      so: { mi: 25, re: 30, so: 15, la: 15, do: 15 },
      la: { so: 25, re: 30, la: 15, mi: 20, do: 10 },
    },
    miMode: {
      do: { mi: 30, re: 20, do: 15, la: 20, so: 15 },
      re: { mi: 35, do: 20, re: 15, la: 15, so: 15 },
      mi: { mi: 20, re: 20, do: 15, so: 25, la: 20 },
      so: { mi: 35, la: 20, so: 15, re: 15, do: 15 },
      la: { mi: 30, so: 20, la: 15, re: 20, do: 15 },
    },
    soMode: {
      do: { so: 25, mi: 25, re: 15, do: 15, la: 20 },
      re: { so: 30, mi: 20, do: 20, re: 15, la: 15 },
      mi: { so: 35, do: 20, re: 15, mi: 15, la: 15 },
      so: { so: 20, mi: 25, la: 20, do: 20, re: 15 },
      la: { so: 35, mi: 20, la: 15, do: 15, re: 15 },
    },
  },
};

/**
 * Level 5 adds `ti`, completing the diatonic scale. Level 6 is a
 * consolidation level (no melodic-sequence algorithm tonight) and reuses
 * these tables exactly rather than getting its own. Level 7 extends
 * la-mode only with `fi`/`si` (harmonic/melodic minor are inherently
 * la-based) -- do-mode is untouched. Level 8 completes the chromatic set
 * (`ra`/`ma`/`le`) in both modes, each new row weighted toward its nearest
 * diatonic neighbor (same chromatic-passing-tone logic as fi->so above),
 * with modest inbound weight from the 1-2 closest existing rows. Level 9
 * reuses Level 8's tables -- no real modulation tonight.
 */
PITCH_SYNTAX_DICTIONARY[5] = {
  doMode: {
    do: { do: 15, re: 20, mi: 20, fa: 5, so: 15, la: 10, ti: 15 },
    re: { do: 40, mi: 20, fa: 10, re: 10, so: 10, ti: 10 },
    mi: { do: 25, re: 15, mi: 10, fa: 15, so: 20, la: 10, ti: 5 },
    fa: { mi: 55, so: 20, fa: 10, re: 10, ti: 5 },
    so: { mi: 20, fa: 10, so: 10, la: 20, do: 20, re: 10, ti: 10 },
    la: { so: 35, mi: 10, la: 10, do: 15, fa: 5, ti: 25 },
    ti: { do: 60, la: 20, ti: 10, so: 10 },
  },
  laMode: {
    do: { la: 30, do: 10, mi: 15, re: 15, so: 10, ti: 10, fa: 10 },
    re: { do: 25, mi: 15, re: 10, la: 25, fa: 10, ti: 15 },
    mi: { re: 10, fa: 10, mi: 10, so: 10, la: 30, do: 10, ti: 20 },
    fa: { mi: 50, so: 15, fa: 10, la: 20, ti: 5 },
    so: { la: 30, mi: 15, fa: 10, so: 10, do: 15, ti: 20 },
    ti: { la: 60, so: 15, do: 10, ti: 15 },
    la: { la: 20, so: 20, mi: 15, do: 15, fa: 5, ti: 25 },
  },
};

PITCH_SYNTAX_DICTIONARY[6] = PITCH_SYNTAX_DICTIONARY[5];

PITCH_SYNTAX_DICTIONARY[7] = {
  doMode: PITCH_SYNTAX_DICTIONARY[5].doMode,
  laMode: {
    do: {
      la: 25,
      do: 10,
      mi: 15,
      re: 10,
      so: 10,
      ti: 10,
      fa: 5,
      si: 10,
      fi: 5,
    },
    re: { do: 20, mi: 15, re: 10, la: 20, fa: 10, ti: 10, si: 10, fi: 5 },
    mi: {
      re: 10,
      fa: 10,
      mi: 10,
      so: 10,
      la: 25,
      do: 10,
      ti: 10,
      si: 10,
      fi: 5,
    },
    fa: { mi: 40, so: 15, fa: 10, la: 15, ti: 5, si: 5, fi: 10 },
    so: { la: 25, mi: 15, fa: 10, so: 10, do: 10, ti: 15, si: 5, fi: 10 },
    ti: { la: 50, so: 15, do: 10, ti: 10, si: 15 },
    si: { la: 75, ti: 10, si: 15 },
    fi: { so: 60, la: 15, fi: 15, mi: 10 },
    la: { la: 15, so: 20, mi: 15, do: 10, fa: 5, ti: 15, si: 15, fi: 5 },
  },
};

PITCH_SYNTAX_DICTIONARY[8] = {
  doMode: {
    do: { do: 15, re: 20, mi: 16, fa: 5, so: 15, la: 10, ti: 15, ra: 4 },
    re: { do: 32, mi: 20, fa: 10, re: 10, so: 10, ti: 10, ra: 4, ma: 4 },
    mi: { do: 21, re: 15, mi: 10, fa: 15, so: 20, la: 10, ti: 5, ma: 4 },
    fa: { mi: 55, so: 20, fa: 10, re: 10, ti: 5 },
    so: { mi: 20, fa: 10, so: 10, la: 20, do: 16, re: 10, ti: 10, le: 4 },
    la: { so: 35, mi: 10, la: 10, do: 15, fa: 5, ti: 21, le: 4 },
    ti: { do: 60, la: 20, ti: 10, so: 10 },
    ra: { do: 65, re: 15, ra: 10, mi: 10 },
    ma: { mi: 60, re: 20, ma: 10, fa: 10 },
    le: { la: 60, so: 20, le: 10, ti: 10 },
  },
  laMode: {
    do: {
      la: 25,
      do: 10,
      mi: 11,
      re: 10,
      so: 10,
      ti: 10,
      fa: 5,
      si: 10,
      fi: 5,
      ra: 4,
    },
    re: {
      do: 14,
      mi: 15,
      re: 10,
      la: 20,
      fa: 10,
      ti: 10,
      si: 10,
      fi: 5,
      ra: 3,
      ma: 3,
    },
    mi: {
      re: 10,
      fa: 10,
      mi: 10,
      so: 10,
      la: 21,
      do: 10,
      ti: 10,
      si: 10,
      fi: 5,
      ma: 4,
    },
    fa: { mi: 40, so: 15, fa: 10, la: 15, ti: 5, si: 5, fi: 10 },
    so: {
      la: 21,
      mi: 15,
      fa: 10,
      so: 10,
      do: 10,
      ti: 15,
      si: 5,
      fi: 10,
      le: 4,
    },
    ti: { la: 50, so: 15, do: 10, ti: 10, si: 15 },
    si: { la: 75, ti: 10, si: 15 },
    fi: { so: 60, la: 15, fi: 15, mi: 10 },
    la: {
      la: 15,
      so: 16,
      mi: 15,
      do: 10,
      fa: 5,
      ti: 15,
      si: 15,
      fi: 5,
      le: 4,
    },
    ra: { do: 65, re: 15, ra: 10, mi: 10 },
    ma: { mi: 60, re: 20, ma: 10, fa: 10 },
    le: { la: 60, so: 20, le: 10, ti: 10 },
  },
};

// No real modulation tonight -- Level 9 generates within the same rich,
// chromatic key as Level 8 rather than an actual mid-phrase key change.
// PITCH_LEVEL_RULES[9].modes already points at level:8 tables, so no
// separate PITCH_SYNTAX_DICTIONARY[9] entry is needed.
