// ============================================================================
// DATA DICTIONARIES (The Application "Database")
// ============================================================================

/**
 * Master Motif Engine Configuration
 * Maps visual tokens to mathematical time representations required by Tone.js.
 * 'ticks' represent spatial cost (e.g., taa requires 2 empty layout slots).
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
    label: "ta rest",
    playback: [],
  },
  tikatika: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "tika-tika",
    playback: ["16n", "16n", "16n", "16n"],
  },
  tikati: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "tika-ti",
    playback: ["16n", "16n", "8n"],
  },
  titika: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-tika",
    playback: ["8n", "16n", "16n"],
  },
  taa: {
    type: "simple",
    duration: "2n",
    ticks: 2,
    label: "ta-a",
    playback: ["2n"],
  },
  tai: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tai",
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
    label: "ta ti",
    playback: ["4n", "8n"],
  },
  taiRest: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tai rest",
    playback: [],
  },
};

/**
 * ----------------------------------------------------------------------------
 * DATA DICTIONARIES: POOLS & TEMPLATES
 * Defining these externally keeps the main progression matrix DRY and scalable.
 * ----------------------------------------------------------------------------
 */

export const MOTIF_POOLS = {
  coreSimple: ["ta", "titi", "taRest"],
  advSimple: ["tikatika", "tikati", "titika", "taa"],
  coreCompound: ["tai", "tititi", "tati", "taiRest"],
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
 * ----------------------------------------------------------------------------
 */
export const SYNTAX_DICTIONARY = {
  // ==========================================
  // SIMPLE METRE MOTIFS (2/4, 3/4, 4/4)
  // ==========================================

  ta: {
    ta: 40, // Crotchets comfortably repeat
    titi: 30, // Smooth transition into quavers
    tikatika: 15, // Sudden burst of energy
    taa: 10, // Settle into a minim
    taRest: 5, // Take a quick breath
  },

  titi: {
    ta: 50, // Quavers heavily want to land on a solid downbeat
    titi: 30, // Continuous running quavers
    tikati: 10, // Move into a syncopated feel
    titika: 10, // Move into a forward-leaning syncopation
  },

  taRest: {
    ta: 60, // Always step out of a rest with a strong, confident attack
    titi: 30, // Or a running attack
    tikatika: 10, // Surprise burst out of the silence
  },

  taa: {
    ta: 40, // Minims are a full reset. Step out cleanly.
    titi: 40, // Regain lost momentum immediately
    tikatika: 10,
    taRest: 10,
  },

  // --- Advanced Simple Subdivisions (High Tension) ---

  tikatika: {
    ta: 70, // 4 semiquavers ALMOST ALWAYS resolve to a stable crotchet
    titi: 20, // Rarely, they resolve to running quavers
    taa: 10, // Huge release into a minim
  },

  tikati: {
    ta: 60, // The trailing quaver lands nicely onto a crotchet
    titi: 30,
    tikatika: 10,
  },

  titika: {
    ta: 70, // The two trailing semiquavers act as a pickup, pushing heavily into the next beat
    titi: 20,
    taa: 10,
  },

  // ==========================================
  // COMPOUND METRE MOTIFS (6/8)
  // ==========================================

  tai: {
    tai: 40, // Dotted crotchets comfortably repeat
    tititi: 40, // Flow naturally into running quavers
    tati: 15, // Move into a lilting long-short
    taiRest: 5,
  },

  tititi: {
    tai: 50, // Running quavers want to land on a solid beat
    tati: 30, // Shift into a lilt
    tititi: 20, // Continuous running
  },

  tati: {
    tititi: 50, // The short quaver acts as a springboard into running notes
    tai: 40, // Or resolves safely
    tati: 10, // Skipping/galloping feel
  },

  taiRest: {
    tai: 60, // Step out of the rest with a solid beat
    tititi: 40, // Or a running beat
  },
};

/**
 * ----------------------------------------------------------------------------
 * PROGRESSION MATRIX (levelRules)
 * Uses ES6 Spread Operators (...) to cumulatively inherit arrays from previous levels.
 * ----------------------------------------------------------------------------
 */
export const levelRules = {
  1: {
    allowedMetres: ["2/4", "3/4", "4/4"],
    barOptions: [2],
    simpleMotifs: [...MOTIF_POOLS.coreSimple],
    compoundMotifs: [],
    allowedForms: [...FORM_TEMPLATES.bars2],
    enforceCadence: false,
  },
  2: {
    allowedMetres: ["2/4", "3/4", "4/4", "6/8"],
    barOptions: [4],
    simpleMotifs: [...MOTIF_POOLS.coreSimple],
    compoundMotifs: [...MOTIF_POOLS.coreCompound],
    allowedForms: [...FORM_TEMPLATES.bars4],
    enforceCadence: true,
  },
  3: {
    allowedMetres: ["2/4", "3/4", "4/4", "6/8"],
    barOptions: [4, 8],
    // Level 3 inherits core simple motifs AND adds advanced ones:
    simpleMotifs: [...MOTIF_POOLS.coreSimple, ...MOTIF_POOLS.advSimple],
    compoundMotifs: [...MOTIF_POOLS.coreCompound],
    // Level 3 inherits 4-bar forms AND adds 8-bar forms:
    allowedForms: [...FORM_TEMPLATES.bars4, ...FORM_TEMPLATES.bars8],
    enforceCadence: true,
  },
};

/**
 * Pedagogical Cadence Pool
 * These are the structurally stable blocks used to musically resolve phrases.
 */
export const CADENCE_MOTIFS = ["ta", "taa", "taRest", "tai", "taiRest"];
