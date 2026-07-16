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
 */
export const MOTIF_LIBRARY = {
  ta: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ta",
    playback: ["4n"],
  },
  titi: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-ti",
    playback: ["8n", "8n"],
  },
  taRest: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ta-rest",
    playback: [],
  },
  tikatika: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-ka-ti-ka",
    playback: ["16n", "16n", "16n", "16n"],
  },
  tikati: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-ka-ti",
    playback: ["16n", "16n", "8n"],
  },
  titika: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-ti-ka",
    playback: ["8n", "16n", "16n"],
  },
  too: {
    type: "simple",
    duration: "2n",
    ticks: 2,
    label: "too",
    playback: ["2n"],
  },
  tooRest: {
    type: "simple",
    duration: "2n",
    ticks: 2,
    label: "too-rest",
    playback: [],
  },
  timKa: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "tim-ka",
    playback: ["8n.", "16n"],
  },
  tumTi: {
    type: "simple",
    duration: "2n",
    ticks: 2,
    label: "tum-ti",
    playback: ["4n.", "8n"],
  },
  syncopaV2: {
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
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "tri-o-la",
    playback: ["8t", "8t", "8t"],
  },
  restTi: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "rest-ti",
    playback: ["8n", "8n"],
    restMask: [true, false],
  },
  syncopaV1: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "syncopa",
    playback: ["16n", "8n", "16n"],
  },
  restTika: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "rest-tika",
    playback: ["8n", "16n", "16n"],
    restMask: [true, false, false],
  },
  tum: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tum",
    playback: ["4n."],
  },
  tititi: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "ti-ti-ti",
    playback: ["8n", "8n", "8n"],
  },
  tati: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "ta-ti",
    playback: ["4n", "8n"],
  },
  tumRest: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tum-rest",
    playback: [],
  },
  tikaTikaTi: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tika-tika-ti",
    playback: ["16n", "16n", "16n", "16n", "8n"],
  },
  toom: {
    type: "compound",
    duration: "2n.",
    ticks: 2,
    label: "toom",
    playback: ["2n."],
  },
  toomRest: {
    type: "compound",
    duration: "2n.",
    ticks: 2,
    label: "toom-rest",
    playback: [],
  },
  tiTikaTi: {
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
