/* jshint esversion: 8 */
/* global Tone */

/**
 * ============================================================================
 * SOLFAIC! - Rhythm Dictation Core Application Engine
 * ============================================================================
 * Architecture: Model-View-Controller (MVC) Hybrid
 * - MODEL: `sessionState`, `MOTIF_LIBRARY`, `levelRules` (The raw data)
 * - VIEW: `renderWorkspace()`, `renderStreakTracker()` (The DOM updates)
 * - CONTROLLER: `startLevel()`, `evaluateSubmission()`, `insertMotifAt()` (The logic)
 * ============================================================================
 */

// ============================================================================
// 1. DATA DICTIONARIES (The Application "Database")
// ============================================================================

/**
 * SVG Vector Graphics Library
 * Storing SVGs as strings allows us to inject them dynamically into the DOM.
 * Using 'currentColor' allows the CSS to control the stroke/fill colors natively.
 */
const SVG_ICONS = {
  ta: `<svg viewBox="0 0 40 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/></svg>`,
  titi: `<svg viewBox="0 0 80 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="64" cy="85" rx="12" ry="8" transform="rotate(-20 64 85)"/><rect x="72" y="15" width="3" height="70"/><rect x="22" y="15" width="53" height="8"/></svg>`,
  taRest: `<svg viewBox="0 0 40 100" width="100%" height="100%" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 25 20 L 15 40 L 30 55 L 15 80" fill="none"/></svg>`,
  taa: `<svg viewBox="0 0 40 100" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="3"><ellipse cx="14" cy="85" rx="10" ry="7" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70" fill="currentColor" stroke="none"/></svg>`,
  tikatika: `<svg viewBox="0 0 160 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><ellipse cx="134" cy="85" rx="12" ry="8" transform="rotate(-20 134 85)"/><rect x="142" y="15" width="3" height="70"/><rect x="22" y="15" width="123" height="8"/><rect x="22" y="27" width="123" height="8"/></svg>`,
  tikati: `<svg viewBox="0 0 120 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><rect x="22" y="15" width="83" height="8"/><rect x="22" y="27" width="43" height="8"/></svg>`,
  titika: `<svg viewBox="0 0 120 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><rect x="22" y="15" width="83" height="8"/><rect x="62" y="27" width="43" height="8"/></svg>`,
  tai: `<svg viewBox="0 0 50 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><circle cx="40" cy="80" r="4"/></svg>`,
  tititi: `<svg viewBox="0 0 120 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><rect x="22" y="15" width="83" height="8"/></svg>`,
  tati: `<svg viewBox="0 0 90 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="64" cy="85" rx="12" ry="8" transform="rotate(-20 64 85)"/><rect x="72" y="15" width="3" height="70"/><path d="M 72 15 C 85 15 85 40 72 45 C 80 40 80 25 72 25 Z"/></svg>`,
  taiRest: `<svg viewBox="0 0 50 100" width="100%" height="100%" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 20 20 L 10 40 L 25 55 L 10 80" fill="none"/><circle cx="40" cy="55" r="3" stroke="none" fill="currentColor"/></svg>`,
};

/**
 * Master Motif Engine Configuration
 * Maps visual tokens to mathematical time representations required by Tone.js.
 * 'ticks' represent spatial cost (e.g., taa requires 2 empty layout slots).
 */
const MOTIF_LIBRARY = {
  ta: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ta",
    svg: SVG_ICONS.ta,
    playback: ["4n"],
  },
  titi: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-ti",
    svg: SVG_ICONS.titi,
    playback: ["8n", "8n"],
  },
  taRest: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ta rest",
    svg: SVG_ICONS.taRest,
    playback: [],
  },
  tikatika: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "tika-tika",
    svg: SVG_ICONS.tikatika,
    playback: ["16n", "16n", "16n", "16n"],
  },
  tikati: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "tika-ti",
    svg: SVG_ICONS.tikati,
    playback: ["16n", "16n", "8n"],
  },
  titika: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-tika",
    svg: SVG_ICONS.titika,
    playback: ["8n", "16n", "16n"],
  },
  taa: {
    type: "simple",
    duration: "2n",
    ticks: 2,
    label: "ta-a",
    svg: SVG_ICONS.taa,
    playback: ["2n"],
  },
  tai: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tai",
    svg: SVG_ICONS.tai,
    playback: ["4n."],
  },
  tititi: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "ti-ti-ti",
    svg: SVG_ICONS.tititi,
    playback: ["8n", "8n", "8n"],
  },
  tati: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "ta ti",
    svg: SVG_ICONS.tati,
    playback: ["4n", "8n"],
  },
  taiRest: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tai rest",
    svg: SVG_ICONS.taiRest,
    playback: [],
  },
};

/**
 * ----------------------------------------------------------------------------
 * DATA DICTIONARIES: POOLS & TEMPLATES
 * Defining these externally keeps the main progression matrix DRY and scalable.
 * ----------------------------------------------------------------------------
 */

const MOTIF_POOLS = {
  coreSimple: ["ta", "titi", "taRest"],
  advSimple: ["tikatika", "tikati", "titika", "taa"],
  coreCompound: ["tai", "tititi", "tati", "taiRest"],
};

const FORM_TEMPLATES = {
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
const SYNTAX_DICTIONARY = {
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
const levelRules = {
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

// ============================================================================
// 2. STATE MACHINE & DOM CACHE
// ============================================================================

/**
 * Single Source of Truth
 * The UI is merely a reflection of these variables. Changing a variable here
 * and calling renderWorkspace() guarantees UI consistency.
 */
const sessionState = {
  currentLevel: 1,
  playCount: 0,
  streak: 0,
  maxPlays: 3,
  activeConfig: null, // Stores current metre, bars, and tick allocations
  targetTimeline: [], // The algorithmic 'correct' answer
  userSubmission: [], // What the user has placed on the board
  slotStates: [], // Validation feedback memory ('idle', 'success', 'error')
  selectedSlotIndex: null, // Tracks mobile tap-to-target logic
  currentState: "IDLE", // 'IDLE' or 'PLAYING' (locks UI during audio)
};

/**
 * Cached DOM Node References
 * Looking up elements via document.getElementById is slow.
 * We do it once here and store the references to boost runtime performance.
 */
const DOM = {
  levelBadge: document.getElementById("ui-level-badge"),
  streakTracker: document.getElementById("ui-streak-tracker"),
  replayBtn: document.getElementById("btn-replay"),
  playsRemaining: document.getElementById("ui-plays-remaining"),
  workspace: document.getElementById("ui-workspace"),
  motifSelector: document.getElementById("ui-motif-selector"),
  submitBtn: document.getElementById("btn-submit"),
  metreDisplay: document.getElementById("ui-metre-display"),
  barsDisplay: document.getElementById("ui-bars-display"),
  // REMOVED: skipBtn handle
  // INJECTED: Interactive Change Interceptor Node
  levelSelect: document.getElementById("control-level-select"),
  // DROPDOWN LEVEL SELECTOR: Allows the user to jump to any level
  levelBtn: document.getElementById("btn-level-dropdown"),
  levelMenu: document.getElementById("menu-level-dropdown"),
  levelItems: document.querySelectorAll(".dropdown-item"),
};

// ============================================================================
// 3. CORE LOGIC & EVALUATION
// ============================================================================

/**
 * Pedagogical Cadence Pool
 * These are the structurally stable blocks used to musically resolve phrases.
 */
const CADENCE_MOTIFS = ["ta", "taa", "taRest", "tai", "taiRest"];

/**
 * Helper: Generates a single mathematically perfect bar of motifs.
 * @param {Array} allowedMotifs - Pool of valid motifs for the level.
 * @param {number} ticksPerBar - Total spatial cost of the bar.
 * @param {boolean} forceCadence - Interceptor flag to force a stable resolution.
 */

function generateBarSequence(allowedMotifs, ticksPerBar, forceCadence = false) {
  const barMotifs = [];
  let currentTicks = 0;
  let previousMotif = null; // Memory to track what we just placed

  while (currentTicks < ticksPerBar) {
    const remainingTicks = ticksPerBar - currentTicks;

    let viableIds = allowedMotifs.filter(
      (id) => MOTIF_LIBRARY[id].ticks <= remainingTicks,
    );

    // 1. THE CADENCE INTERCEPTOR
    if (forceCadence) {
      const exactFitCadence = viableIds.filter(
        (id) =>
          CADENCE_MOTIFS.includes(id) &&
          MOTIF_LIBRARY[id].ticks === remainingTicks,
      );
      if (exactFitCadence.length > 0) {
        viableIds = exactFitCadence;
      }
    }

    if (viableIds.length === 0) break; // Defensive fallback

    let chosenId;

    // 2. THE MARKOV SYNTAX ENGINE
    // If we have a previous motif, check the dictionary for grammar rules
    if (previousMotif && SYNTAX_DICTIONARY[previousMotif]) {
      const transitionWeights = SYNTAX_DICTIONARY[previousMotif];
      const validWeights = {};
      let totalWeight = 0;

      // Only consider weights for motifs that mathematically fit in the remaining space
      viableIds.forEach((id) => {
        if (transitionWeights[id]) {
          validWeights[id] = transitionWeights[id];
          totalWeight += transitionWeights[id];
        }
      });

      // If we found valid grammar rules, run the Weighted Lottery
      if (totalWeight > 0) {
        let randomDraw = Math.random() * totalWeight;
        for (const id in validWeights) {
          randomDraw -= validWeights[id];
          if (randomDraw <= 0) {
            chosenId = id;
            break;
          }
        }
      }
    }

    // 3. THE FALLBACK
    // If it's the first beat of the bar, or no grammar rules applied, pick randomly
    if (!chosenId) {
      chosenId = viableIds[Math.floor(Math.random() * viableIds.length)];
    }

    barMotifs.push(chosenId);
    currentTicks += MOTIF_LIBRARY[chosenId].ticks;

    // Save this choice to influence the next loop!
    previousMotif = chosenId;
  }

  return barMotifs;
}

/**
 * Algorithmic Rhythm Generator (Refactored Bar-by-Bar Assembly)
 */
function generateRhythmTimeline(levelId) {
  const rules = levelRules[levelId];
  if (!rules) return [];

  const chosenMetre =
    rules.allowedMetres[Math.floor(Math.random() * rules.allowedMetres.length)];
  const chosenForm =
    rules.allowedForms[Math.floor(Math.random() * rules.allowedForms.length)];
  const barCount = chosenForm.length;

  let metreType = "simple";
  let ticksPerBar = 4;

  if (chosenMetre === "4/4") ticksPerBar = 4;
  if (chosenMetre === "3/4") ticksPerBar = 3;
  if (chosenMetre === "2/4") ticksPerBar = 2;
  if (chosenMetre === "6/8") {
    metreType = "compound";
    ticksPerBar = 2;
  }

  sessionState.activeConfig = {
    metre: chosenMetre,
    bars: barCount,
    form: chosenForm,
    totalTicks: barCount * ticksPerBar,
    ticksPerBar: ticksPerBar,
    allowedMotifs:
      metreType === "simple" ? rules.simpleMotifs : rules.compoundMotifs,
  };

  // 2. Generation Phase (The Form Router & Cache Memory)
  const rawBarArrays = [];
  const phraseCache = {};

  chosenForm.forEach((formLetter, index) => {
    // Check if this is the absolute final bar of the sequence
    const isFinalBar = index === chosenForm.length - 1;
    const needsCadence = rules.enforceCadence && isFinalBar;

    // Create a unique memory key (e.g., 'A_cadence') so we don't accidentally
    // overwrite the original 'A' bar with our modified ending.
    const cacheKey = needsCadence ? `${formLetter}_cadence` : formLetter;

    if (!phraseCache[cacheKey]) {
      phraseCache[cacheKey] = generateBarSequence(
        sessionState.activeConfig.allowedMotifs,
        ticksPerBar,
        needsCadence,
      );
    }

    rawBarArrays.push([...phraseCache[cacheKey]]);
  });

  // 3. Assembly Phase (Map to Tone.js Time)
  const timeline = [];
  rawBarArrays.forEach((barMotifs, barIndex) => {
    let beatInBar = 0;
    barMotifs.forEach((motifId) => {
      const motifData = MOTIF_LIBRARY[motifId];
      timeline.push({
        time: `${barIndex}:${beatInBar}:0`,
        duration: motifData.duration,
        motifId: motifId,
        pitch: null,
      });
      beatInBar += motifData.ticks;
    });
  });

  // Testing
  console.log("Active Blueprint:", sessionState.activeConfig);
  console.table(timeline);

  return timeline;
}

/**
 * Placement Logic: Inserts an active block into the workspace array.
 * * @param {number} index - The target slot index.
 * @param {string} motifId - The identifier of the chosen motif.
 */
function insertMotifAt(index, motifId) {
  const duration = MOTIF_LIBRARY[motifId].ticks || 1;

  if (index + duration <= sessionState.userSubmission.length) {
    // 1. Clear out any existing notes in the incoming sequence path
    for (let i = 0; i < duration; i++) {
      const existingToken = sessionState.userSubmission[index + i];
      if (existingToken) {
        const rootId = existingToken.replace("_ext", "");
        clearMultiBeatNote(index + i, rootId);
      }
    }

    // 2. Drop the parent root item in the target slot
    sessionState.userSubmission[index] = motifId;
    sessionState.slotStates[index] = "idle";

    // 3. If the item takes up multiple spaces (e.g., Minim), write spacer strings into array
    for (let i = 1; i < duration; i++) {
      sessionState.userSubmission[index + i] = `${motifId}_ext`;
      sessionState.slotStates[index + i] = "idle";
    }

    sessionState.selectedSlotIndex = null;
    renderWorkspace();
  } else {
    alert("This note is too long to fit in the remaining space of this bar!");
  }
}

/**
 * Removal Logic: Finds the root of a placed object and sweeps it from the array cleanly.
 */
function clearMultiBeatNote(index, motifId) {
  const duration = MOTIF_LIBRARY[motifId].ticks || 1;
  let startIndex = index;

  // Walk backwards to find the root node if the user tapped on an extension spacer
  if (sessionState.userSubmission[index] === `${motifId}_ext`) {
    while (
      startIndex > 0 &&
      sessionState.userSubmission[startIndex] === `${motifId}_ext`
    ) {
      startIndex--;
    }
  }

  sessionState.userSubmission[startIndex] = null;
  sessionState.slotStates[startIndex] = "idle";

  for (let i = 1; i < duration; i++) {
    if (sessionState.userSubmission[startIndex + i] === `${motifId}_ext`) {
      sessionState.userSubmission[startIndex + i] = null;
      sessionState.slotStates[startIndex + i] = "idle";
    }
  }
  sessionState.selectedSlotIndex = null;
  renderWorkspace();
}

/**
 * Verification Engine
 * Compares user sequence against the algorithmic sequence, triggers CSS feedback,
 * and manages the progression/remedial loops.
 */
function evaluateSubmission() {
  if (sessionState.currentState === "PLAYING") return;

  // Lock UI immediately to prevent double-clicks
  sessionState.currentState = "PLAYING";
  if (DOM.submitBtn) DOM.submitBtn.classList.add("is-locked");
  if (DOM.skipBtn) DOM.skipBtn.classList.add("is-locked");
  if (DOM.replayBtn) DOM.replayBtn.classList.add("is-locked");

  // Early Return: Block submission if there are empty holes in the board
  if (sessionState.userSubmission.includes(null)) {
    const bars = DOM.workspace.querySelectorAll(".workspace-bar");
    bars.forEach((bar) => {
      bar.classList.remove("is-shaking");
      // LIGHTHOUSE FIX: Replaced offsetWidth with double requestAnimationFrame to prevent forced reflows
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.classList.add("is-shaking");
        });
      });
    });

    const missingSlots = DOM.workspace.querySelectorAll(
      ".workspace-card.is-placeholder",
    );
    missingSlots.forEach((card) => card.classList.add("is-empty-panic"));

    setTimeout(() => {
      bars.forEach((bar) => bar.classList.remove("is-shaking"));
      missingSlots.forEach((card) => card.classList.remove("is-empty-panic"));
    }, 500);

    // Release locks early since verification was aborted
    sessionState.currentState = "IDLE";
    if (DOM.submitBtn) DOM.submitBtn.classList.remove("is-locked");
    if (DOM.skipBtn) DOM.skipBtn.classList.remove("is-locked");
    if (DOM.replayBtn) DOM.replayBtn.classList.remove("is-locked");
    return;
  }

  // Flatten the algorithm's answer into an array layout identical to the user's board
  const flatTarget = [];
  sessionState.targetTimeline.forEach((event) => {
    const duration = MOTIF_LIBRARY[event.motifId].ticks || 1;
    flatTarget.push(event.motifId);
    for (let i = 1; i < duration; i++) {
      flatTarget.push(`${event.motifId}_ext`);
    }
  });

  let isCorrect = true;

  // Map success/error states based on array index comparison
  sessionState.userSubmission.forEach((token, index) => {
    if (token === flatTarget[index]) {
      sessionState.slotStates[index] = "success";
    } else {
      sessionState.slotStates[index] = "error";
      isCorrect = false;
    }
  });

  renderWorkspace();

  if (isCorrect) {
    sessionState.streak++;
    renderStreakTracker();

    setTimeout(() => {
      if (sessionState.streak >= 3) {
        sessionState.streak = 0;
        triggerCelebrationModal(sessionState.currentLevel + 1);
      } else {
        startLevel(sessionState.currentLevel); // Load next round
      }
    }, 1000);
  } else {
    sessionState.streak = 0; // Wipe streak
    renderStreakTracker();

    if (sessionState.playCount >= sessionState.maxPlays) {
      // Out of plays: Show the correction sequence automatically
      setTimeout(() => {
        sessionState.userSubmission = [...flatTarget];
        sessionState.slotStates = Array(flatTarget.length).fill("idle");
        renderWorkspace();

        const correctedCards =
          DOM.workspace.querySelectorAll(".workspace-card");
        correctedCards.forEach((card) => {
          card.style.borderColor = "#3b82f6"; // Remedial Blue override
          card.style.backgroundColor = "#eff6ff";
        });

        setTimeout(() => startLevel(sessionState.currentLevel), 4000);
      }, 1500);
    } else {
      // Plays remaining: Unlock UI for correction
      setTimeout(() => {
        sessionState.currentState = "IDLE";
        if (DOM.submitBtn) DOM.submitBtn.classList.remove("is-locked");
        if (DOM.skipBtn) DOM.skipBtn.classList.remove("is-locked");
        if (sessionState.playCount < sessionState.maxPlays) {
          if (DOM.replayBtn) DOM.replayBtn.classList.remove("is-locked");
        }
      }, 2000);
    }
  }
}

// ============================================================================
// 4. UI RENDERERS (The View Updates)
// ============================================================================

/**
 * Bootstraps a new round. Generates data, clears previous UI elements, and renders the board.
 * * @param {number} levelId - Target level integer.
 */
function startLevel(levelId) {
  sessionState.currentLevel = levelId;
  sessionState.playCount = 0;
  sessionState.currentState = "IDLE";
  sessionState.selectedSlotIndex = null;

  // Defensive safety un-locks
  if (DOM.submitBtn) DOM.submitBtn.classList.remove("is-locked");
  if (DOM.skipBtn) DOM.skipBtn.classList.remove("is-locked");
  if (DOM.replayBtn) DOM.replayBtn.classList.remove("is-locked");

  sessionState.targetTimeline = generateRhythmTimeline(levelId);
  const config = sessionState.activeConfig;

  // Reset arrays to empty nulls matching the level's total ticks
  sessionState.userSubmission = Array(config.bars * config.ticksPerBar).fill(
    null,
  );
  sessionState.slotStates = Array(config.bars * config.ticksPerBar).fill(
    "idle",
  );

  if (DOM.levelBadge) DOM.levelBadge.innerText = `Level ${levelId}`;
  if (DOM.metreDisplay) DOM.metreDisplay.innerText = `Metre: ${config.metre}`;
  if (DOM.barsDisplay) DOM.barsDisplay.innerText = `Bars: ${config.bars}`;
  if (DOM.playsRemaining)
    DOM.playsRemaining.innerText = `Plays remaining: ${sessionState.maxPlays} / ${sessionState.maxPlays}`;
  // STATE MANAGEMENT ADJUSTMENT: Sync Custom Dropdown Text
  if (DOM.levelBtn && DOM.levelItems) {
    // Update Button Text with the SVG arrow attached
    DOM.levelBtn.innerHTML = `Level ${levelId} <svg class="dropdown-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" fill="none"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>`;

    // Update the blue highlight in the menu list
    DOM.levelItems.forEach((item) => {
      item.classList.remove("is-active");
      if (parseInt(item.getAttribute("data-value"), 10) === levelId) {
        item.classList.add("is-active");
      }
    });
  }

  renderStreakTracker();

  if (DOM.workspace) DOM.workspace.innerHTML = "";
  if (DOM.motifSelector) DOM.motifSelector.innerHTML = "";

  // Paint the interactive motif selection buttons at the bottom of the screen
  config.allowedMotifs.forEach((motifId) => {
    const motifData = MOTIF_LIBRARY[motifId];
    const btn = document.createElement("button");
    btn.className = "motif-pad";

    btn.innerHTML = motifData.svg
      ? `<div class="svg-container">${motifData.svg}</div> ${motifData.label}`
      : `<span class="music-font">${motifData.symbol}</span> ${motifData.label}`;

    // Desktop Drag Engine hooks
    btn.setAttribute("draggable", "true");
    btn.addEventListener("dragstart", (e) => {
      if (sessionState.currentState === "PLAYING") return e.preventDefault();
      e.dataTransfer.setData("text/plain", motifId);
    });

    // Mobile / Click Engine hooks
    btn.addEventListener("click", () => {
      if (sessionState.currentState === "PLAYING") return;
      let targetIndex = sessionState.selectedSlotIndex;
      // Fallback: If user hasn't explicitly highlighted a slot ring, find the first empty spot
      if (
        targetIndex === null ||
        sessionState.userSubmission[targetIndex] !== null
      ) {
        targetIndex = sessionState.userSubmission.indexOf(null);
      }
      if (targetIndex !== -1) insertMotifAt(targetIndex, motifId);
    });

    if (DOM.motifSelector) DOM.motifSelector.appendChild(btn);
  });

  renderWorkspace();
  console.log(
    `[Engine] Level ${levelId} Initialised. Streak: ${sessionState.streak}/3`,
  );
}

/**
 * Reconstructs the visual staves and inputs based purely on the active arrays.
 */
function renderWorkspace() {
  if (!DOM.workspace) return;
  DOM.workspace.innerHTML = "";
  const config = sessionState.activeConfig;

  // NEW: Create the inner scrolling track to hold the dashed border
  const scrollTrack = document.createElement("div");
  scrollTrack.className = "workspace-scroll-track";

  // 1. Build Physical Bar wrappers
  const bars = [];
  for (let i = 0; i < config.bars; i++) {
    const barDiv = document.createElement("div");
    barDiv.className = "workspace-bar";
    bars.push(barDiv);

    // CHANGED: Append the bar to the scroll track, NOT the workspace
    scrollTrack.appendChild(barDiv);
  }

  // NEW: Append the fully loaded track into the workspace window
  DOM.workspace.appendChild(scrollTrack);

  // 2. Iterate through data and append structural DOM cards to bars
  sessionState.userSubmission.forEach((token, index) => {
    const currentBarIndex = Math.floor(index / config.ticksPerBar);

    if (currentBarIndex < bars.length) {
      const card = document.createElement("div");

      // Apply validation feedback styles safely
      if (sessionState.slotStates[index] === "success")
        card.classList.add("is-success");
      else if (sessionState.slotStates[index] === "error")
        card.classList.add("is-error");

      // Drag/Drop Listeners
      card.addEventListener("dragover", (e) => {
        if (sessionState.currentState === "PLAYING") return;
        e.preventDefault();
      });

      card.addEventListener("drop", (e) => {
        if (sessionState.currentState === "PLAYING") return;
        e.preventDefault();
        const motifId = e.dataTransfer.getData("text/plain");
        insertMotifAt(index, motifId);
      });

      // Layout Condition A: Empty Hole
      if (token === null) {
        card.className += " workspace-card is-placeholder";
        card.innerHTML = `<div class="svg-container">•</div>`;
        card.title = "Tap to highlight target, or drag note here";

        if (index === sessionState.selectedSlotIndex)
          card.classList.add("is-targeted");

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          sessionState.selectedSlotIndex = index;
          renderWorkspace();
        });
      }
      // Layout Condition B: Extension Spacer (e.g. half of a 2-beat note)
      else if (token.endsWith("_ext")) {
        const rootId = token.replace("_ext", "");
        card.className += " workspace-card is-extension";
        card.innerHTML = `<div class="svg-container" style="font-size: 1.5rem; color: var(--color-text-muted); font-weight:800;">—</div>`;

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          clearMultiBeatNote(index, rootId);
        });
      }
      // Layout Condition C: Placed Musical Note
      else {
        const motifData = MOTIF_LIBRARY[token];
        card.className += " workspace-card";
        card.innerHTML =
          motifData && motifData.svg
            ? `<div class="svg-container">${motifData.svg}</div>`
            : `<div class="svg-container">${token}</div>`;

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          clearMultiBeatNote(index, token);
        });
      }

      bars[currentBarIndex].appendChild(card);
    }
  });
}

function renderStreakTracker() {
  if (!DOM.streakTracker) return;
  DOM.streakTracker.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "streak-dot";
    if (i < sessionState.streak) dot.classList.add("is-success");
    DOM.streakTracker.appendChild(dot);
  }
}

// ============================================================================
// 5. SUCCESS CELEBRATION MODALS
// ============================================================================

// Animation Attribution:
// Keyframe physics and spring-based transition logic adapted from
// Josh Comeau's 'Whimsical Animations' documentation.

function triggerCelebrationModal(targetLevelId) {
  const overlay = document.createElement("div");
  overlay.className = "celebration-overlay";

  const modal = document.createElement("div");
  modal.className = "celebration-modal";

  let titleText = `Level ${sessionState.currentLevel} Mastered! 🚀`;
  let subText = `Sensational ear tracking.<br>Ready to unlock Level ${targetLevelId}?`;
  let actionText = "Onwards! →";

  if (targetLevelId > 3) {
    titleText = "Grand Masterpiece! 🏆";
    subText =
      "Incredible! You have officially conquered all levels of the rhythmic matrix.";
    actionText = "Play Again 🔄";
  }

  modal.innerHTML = `
    <div class="celebration-title">${titleText}</div>
    <div class="celebration-subtext">${subText}</div>
  `;

  const btn = document.createElement("button");
  btn.className = "celebration-btn";
  btn.innerText = actionText;

  btn.addEventListener("click", () => {
    overlay.classList.remove("is-active");
    setTimeout(() => {
      overlay.remove();
      startLevel(targetLevelId <= 3 ? targetLevelId : 1);
    }, 300);
  });

  modal.appendChild(btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // LIGHTHOUSE FIX: Use requestAnimationFrame instead of forced layout recalculation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add("is-active");
    });
  });

  fireMasteryConfetti();
}

function fireMasteryConfetti() {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#8b5cf6",
  ];
  const particleCount = 160;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "confetti-particle";
    particle.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = "50vw";
    particle.style.top = "50vh";

    const size = Math.floor(Math.random() * 10) + 6;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.animationDelay = `${Math.random() * 1.5}s`;

    const xDrift = (Math.random() - 0.5) * 1000;
    const yDrop = Math.random() * 500 + 250;
    const rotation = Math.random() * 1080 - 540;

    particle.style.setProperty("--x-drift", `${xDrift}px`);
    particle.style.setProperty("--y-drop", `${yDrop}px`);
    particle.style.setProperty("--rotation", `${rotation}deg`);

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 5500); // Cleanup memory
  }
}

// ============================================================================
// 6. ONBOARDING TOUR WIZARD (The Fluid Mobile Anchor Logic)
// ============================================================================

let tourCurrentStepIndex = 0;
let activeTourSteps = [];

function compileTourSequence() {
  const isMobileViewport = window.innerWidth < 1024;
  return [
    {
      elementId: isMobileViewport ? "btn-toggle-sidebar" : "ui-sidebar",
      text: isMobileViewport
        ? "Welcome! Tap this hamburger menu button at any time to open up your Kodály reference table."
        : "Welcome to Solfaic! This is your reference guide. Check your rhythmic solfege and notation rules here.",
      mobilePosition: "bottom", // Dictates CSS safe-area override intents
    },
    {
      elementId: "btn-replay",
      text: "Step 1: Hit this 'play' button to listen to your next phrase. Be sure to listen carefully, you only get 3 attempts!",
      mobilePosition: "bottom",
    },
    {
      elementId: "ui-workspace",
      text: "Step 2: This is your workspace. Your chosen rhythm cards will assemble here. Tap a card to remove it, or tap an empty slot to prepare it for a new card.",
      mobilePosition: "bottom",
    },
    {
      elementId: "ui-motif-selector",
      text: "Step 3: Choose your rhythm cards from this menu. Drag 'em, click 'em, or tap a highlighted slot to place 'em. Remember, some cards are more than one beat long!",
      mobilePosition: "top",
    },
    {
      elementId: "btn-submit",
      text: "Step 4: Once you're done, smash this button here to see if you got it right. Three successive correct answers will take you to the next level. Good luck!",
      mobilePosition: "top",
    },
  ];
}

function startGuidedTour() {
  document.getElementById("ui-tour-prompt").classList.add("is-hidden");
  document.getElementById("ui-tour-tooltip").classList.remove("is-hidden");

  activeTourSteps = compileTourSequence();
  tourCurrentStepIndex = 0;

  // Add global progression interceptors
  window.addEventListener("click", handleGlobalTourProgression);
  window.addEventListener("keydown", handleGlobalTourKeydown);

  executeTourStepPass();
}

function executeTourStepPass() {
  const tourOverlayElement = document.getElementById("ui-tour");
  const tooltipBox = document.getElementById("ui-tour-tooltip");
  const textBox = document.getElementById("ui-tour-text");

  // 1. Immediately drop opacity to 0 so it fades out BEFORE moving
  if (tooltipBox) tooltipBox.style.opacity = "0";

  // Clear previous highlight rings
  document.querySelectorAll(".tour-highlight-active").forEach((el) => {
    el.classList.remove("tour-highlight-active");
  });

  // Escape condition: Tour is complete
  if (tourCurrentStepIndex >= activeTourSteps.length) {
    setTimeout(() => {
      tooltipBox.classList.add("is-hidden");
      tourOverlayElement.classList.add("is-hidden");
    }, 200);

    window.removeEventListener("click", handleGlobalTourProgression);
    window.removeEventListener("keydown", handleGlobalTourKeydown);
    localStorage.setItem("solfaic_onboarded_matrix", "true");
    triggerTourCompletionModal();
    return;
  }

  const currentStep = activeTourSteps[tourCurrentStepIndex];
  const targetElement = document.getElementById(currentStep.elementId);

  if (targetElement) {
    // Scroll element into view safely while tooltip is invisible
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

    // Wait for the scrolling physics to settle AND the fade-out to finish
    setTimeout(() => {
      targetElement.classList.add("tour-highlight-active");

      // FIX: Inject the new text NOW, while the box is invisible!
      textBox.innerHTML = currentStep.text;

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipWidth = window.innerWidth < 1024 ? 280 : 320;

      tooltipBox.classList.remove("is-mobile-top", "is-mobile-bottom");
      tooltipBox.style.display = "block";
      const tooltipHeight = tooltipBox.offsetHeight;

      let computedLeft = 0;
      let computedTop = 0;

      if (window.innerWidth < 1024) {
        // MOBILE OVERRIDES
        if (currentStep.mobilePosition === "top")
          tooltipBox.classList.add("is-mobile-top");
        else tooltipBox.classList.add("is-mobile-bottom");

        tooltipBox.style.left = "50%";
        tooltipBox.style.top = "auto";
      } else {
        // DESKTOP OVERRIDES
        if (currentStep.elementId === "ui-sidebar") {
          computedLeft = targetRect.right + 24;
          computedTop = targetRect.top + window.scrollY + 120;
        } else {
          computedLeft =
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
          computedLeft = Math.max(
            10,
            Math.min(computedLeft, window.innerWidth - tooltipWidth - 10),
          );
          computedTop =
            targetRect.top + window.scrollY + targetRect.height + 16;

          if (targetRect.bottom + tooltipHeight + 30 > window.innerHeight) {
            computedTop = targetRect.top + window.scrollY - tooltipHeight - 16;
          }
        }

        // Teleport to precise coordinates
        tooltipBox.style.left = `${computedLeft}px`;
        tooltipBox.style.top = `${computedTop}px`;
      }

      tourOverlayElement.style.alignItems = "flex-start";
      tourOverlayElement.style.justifyContent = "flex-start";

      // LIGHTHOUSE FIX: Safely trigger animation without forcing reflow
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tooltipBox.style.opacity = "1";
        });
      });
    }, 320);
  } else {
    // Fallback if target element doesn't exist
    setTimeout(() => {
      textBox.innerHTML = currentStep.text; // Safe fallback injection
      tourOverlayElement.style.alignItems = "center";
      tourOverlayElement.style.justifyContent = "center";
      tooltipBox.style.position = "static";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tooltipBox.style.opacity = "1";
        });
      });
    }, 200);
  }
}

function handleGlobalTourProgression() {
  tourCurrentStepIndex++;
  executeTourStepPass();
}

function handleGlobalTourKeydown(e) {
  // Intercepting Space/Enter allows quick, game-like traversal of the UI instruction cards
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    tourCurrentStepIndex++;
    executeTourStepPass();
  }
}

function terminateTourImmediately() {
  document.getElementById("ui-tour").classList.add("is-hidden");
  if (document.getElementById("ui-tour-tooltip"))
    document.getElementById("ui-tour-tooltip").classList.add("is-hidden");
  localStorage.setItem("solfaic_onboarded_matrix", "true");
}

function triggerTourCompletionModal() {
  const overlay = document.createElement("div");
  overlay.className = "celebration-overlay";

  const modal = document.createElement("div");
  modal.className = "celebration-modal";

  modal.innerHTML = `
    <div class="celebration-title">You're Ready!</div>
    <div class="celebration-subtext">Your interactive dictation workspace is fully unlocked and ready for practice.<br><br>Good luck, Maestro! 🎻</div>
  `;

  const btn = document.createElement("button");
  btn.className = "celebration-btn";
  btn.innerText = "Let's Begin! 🚀";

  btn.addEventListener("click", () => {
    overlay.classList.remove("is-active");
    setTimeout(() => overlay.remove(), 300);
  });

  modal.appendChild(btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // LIGHTHOUSE FIX: Replaced offsetHeight reflow hack
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add("is-active");
    });
  });
}

// ============================================================================
// 7. TONE.JS AUDIO ENGINE
// ============================================================================

/* * Audio Engine Attribution:
 * Web Audio API synthesis, scheduling, and transport management
 * implemented using Tone.js (v14.x) library.
 */

const AudioEngine = {
  synth: null,
  chime: null,
  isInitialized: false,

  /**
   * Wakes up underlying oscillators on user gesture interactions to satisfy
   * strict browser AudioContext security specifications.
   */
  async init() {
    if (this.isInitialized) return;
    await Tone.start();

    // The primary polyphonic synthesizer for musical notes
    this.synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.1 },
    }).toDestination();

    // The high-frequency countdown/metronome marker
    this.chime = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.5 },
    }).toDestination();

    Tone.Transport.bpm.value = 85;
    this.isInitialized = true;
  },

  async playSequence() {
    if (sessionState.currentState === "PLAYING") return;
    if (sessionState.playCount >= sessionState.maxPlays) {
      alert("You are out of plays! Give it your best guess.");
      return;
    }

    // 1. Lock UI and update states IMMEDIATELY upon click to prevent double-firing
    sessionState.currentState = "PLAYING";
    sessionState.playCount++;

    if (DOM.replayBtn) DOM.replayBtn.classList.add("is-locked");
    if (DOM.playsRemaining)
      DOM.playsRemaining.innerText = `Plays remaining: ${sessionState.maxPlays - sessionState.playCount} / ${sessionState.maxPlays}`;

    // 2. Await Tone.js hardware initialization AFTER the UI is safely locked
    await this.init();

    Tone.Transport.cancel();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.stop();

    const [num, den] = sessionState.activeConfig.metre.split("/");
    Tone.Transport.timeSignature = [parseInt(num), parseInt(den)];

    const playableEvents = [];
    let currentTime = Tone.Time("1m").toSeconds(); // Offset sequence playback to allow 1 bar of count-in space

    sessionState.targetTimeline.forEach((event) => {
      const motifData = MOTIF_LIBRARY[event.motifId];
      let subTime = currentTime;

      motifData.playback.forEach((subDuration) => {
        playableEvents.push({
          time: subTime,
          duration: subDuration,
          pitch: event.pitch,
        });
        subTime += Tone.Time(subDuration).toSeconds();
      });
      currentTime += Tone.Time(motifData.duration).toSeconds();
    });

    const part = new Tone.Part((time, event) => {
      const noteToPlay = event.pitch ? event.pitch : "G3";
      // Shrink sounding duration slightly (0.82) to emulate articulation gaps between notes
      const soundingDuration = Tone.Time(event.duration).toSeconds() * 0.82;
      this.synth.triggerAttackRelease(noteToPlay, soundingDuration, time);
    }, playableEvents);
    part.start(0);

    // Visual Countdown Mask Generation
    const modal = document.createElement("div");
    modal.style.cssText =
      "position:absolute; inset:0; background:rgba(255,255,255,0.85); backdrop-filter: blur(4px); z-index:100; display:flex; justify-content:center; align-items:center; font-size:6rem; font-weight:900; border-radius: 12px;";
    if (DOM.workspace) {
      DOM.workspace.style.position = "relative";
      DOM.workspace.appendChild(modal);
    }

    const ticks = sessionState.activeConfig.ticksPerBar;
    const beatSpacing = sessionState.activeConfig.metre.includes("8")
      ? Tone.Time("4n.").toSeconds()
      : Tone.Time("4n").toSeconds();

    // Schedule Metronome audio counts & visual numeral syncs
    for (let i = 0; i < ticks; i++) {
      Tone.Transport.schedule((time) => {
        this.chime.triggerAttackRelease("C6", "16n", time);
        Tone.Draw.schedule(() => {
          modal.innerText = i + 1;
        }, time);
      }, i * beatSpacing);
    }

    // Erase masking modal exactly when bar 1 is complete
    Tone.Transport.schedule((time) => {
      Tone.Draw.schedule(() => modal.remove(), time);
    }, Tone.Time("1m").toSeconds());

    // Schedule Heartbeat Animations for active staves
    const totalBars = sessionState.activeConfig.bars;
    for (let bar = 0; bar < totalBars; bar++) {
      for (let beat = 0; beat < ticks; beat++) {
        const absoluteTick = bar * ticks + beat;
        const timeOffset =
          Tone.Time("1m").toSeconds() + absoluteTick * beatSpacing;

        Tone.Transport.schedule((time) => {
          Tone.Draw.schedule(() => {
            const barElements = document.querySelectorAll(".workspace-bar");
            if (barElements[bar]) {
              barElements[bar].classList.add("is-metronome-pulse");
              setTimeout(
                () => barElements[bar].classList.remove("is-metronome-pulse"),
                300,
              );
            }
          }, time);
        }, timeOffset);
      }
    }

    Tone.Transport.start();

    // Auto-teardown routine safely un-locks UI states following transport duration limits
    const stopTimeInSeconds = Tone.Time(`${totalBars + 1}m`).toSeconds();
    setTimeout(
      () => {
        Tone.Transport.stop();
        sessionState.currentState = "IDLE";
        if (sessionState.playCount < sessionState.maxPlays && DOM.replayBtn) {
          DOM.replayBtn.classList.remove("is-locked");
        }
      },
      stopTimeInSeconds * 1000 + 500,
    );
  },
};

// ============================================================================
// 8. BOOTSTRAP/INITIALISATION PIPELINE (DOM Content Loaded)
// ============================================================================

window.addEventListener("DOMContentLoaded", () => {
  // --- MOBILE SIDEBAR CONTROLS ---
  const sidebarElement = document.getElementById("ui-sidebar");
  const toggleBtn = document.getElementById("btn-toggle-sidebar");
  const closeBtn = document.getElementById("btn-close-sidebar");

  function openMobileSidebar() {
    if (sidebarElement) sidebarElement.classList.add("is-open");
  }

  function closeMobileSidebar() {
    if (sidebarElement) sidebarElement.classList.remove("is-open");
  }

  if (toggleBtn) toggleBtn.addEventListener("click", openMobileSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeMobileSidebar);

  // --- ACCESSIBLE TOUR TRIGGER ---
  const helpTourBtn = document.getElementById("btn-trigger-onboarding");
  const tourOverlay = document.getElementById("ui-tour");
  const tourBtnYes = document.getElementById("btn-tour-yes");
  const tourBtnNo = document.getElementById("btn-tour-no");

  if (helpTourBtn) {
    helpTourBtn.addEventListener("click", () => {
      if (tourOverlay) {
        tourOverlay.classList.remove("is-hidden");
        if (document.getElementById("ui-tour-prompt"))
          document
            .getElementById("ui-tour-prompt")
            .classList.remove("is-hidden");
        if (document.getElementById("ui-tour-tooltip"))
          document.getElementById("ui-tour-tooltip").classList.add("is-hidden");
      }
    });
  }

  if (tourBtnYes) {
    tourBtnYes.addEventListener("click", (e) => {
      e.stopPropagation(); // Required to prevent bubbled window clicks from instantly skipping Step 1
      startGuidedTour();
    });
  }

  if (tourBtnNo) {
    tourBtnNo.addEventListener("click", (e) => {
      e.stopPropagation();
      terminateTourImmediately();
    });
  }

  // NEW CONTROLLER ROUTING: Custom Dropdown UI
  if (DOM.levelBtn && DOM.levelMenu) {
    // 1. Toggle Menu Open/Close
    DOM.levelBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevents the click from bubbling to the document
      const isOpen = DOM.levelMenu.classList.contains("is-open");
      DOM.levelMenu.classList.toggle("is-open");
      DOM.levelBtn.setAttribute("aria-expanded", !isOpen);
    });

    // 2. Close Menu if clicking anywhere else on the screen
    document.addEventListener("click", (e) => {
      if (
        !DOM.levelBtn.contains(e.target) &&
        !DOM.levelMenu.contains(e.target)
      ) {
        DOM.levelMenu.classList.remove("is-open");
        DOM.levelBtn.setAttribute("aria-expanded", "false");
      }
    });

    // 3. Handle a Level Selection
    DOM.levelItems.forEach((item) => {
      item.addEventListener("click", () => {
        const selectedLevel = parseInt(item.getAttribute("data-value"), 10);

        // Close the menu
        DOM.levelMenu.classList.remove("is-open");
        DOM.levelBtn.setAttribute("aria-expanded", "false");

        // Engine Safeties
        if (typeof Tone !== "undefined" && Tone.Transport) {
          Tone.Transport.cancel();
          Tone.Transport.stop();
        }
        sessionState.streak = 0;
        startLevel(selectedLevel);
      });
    });
  }
  // RESTORED: Core Application Event Listeners
  if (DOM.submitBtn) {
    DOM.submitBtn.addEventListener("click", evaluateSubmission);
  }
  if (DOM.replayBtn) {
    DOM.replayBtn.addEventListener("click", () => AudioEngine.playSequence());
  }

  // --- COMPLIANCE OVERLAY MODAL MANAGER ---
  const privacyModal = document.getElementById("modal-privacy");
  const termsModal = document.getElementById("modal-terms");
  const footerLinks = document.querySelectorAll(".footer-links a");
  const closeButtons = document.querySelectorAll(".compliance-close-btn");

  function displayComplianceOverlay(targetModal) {
    if (!targetModal) {
      return;
    }
    // De-couple transport loops if music is actively executing
    if (typeof Tone !== "undefined" && Tone.Transport) {
      Tone.Transport.stop();
    }

    targetModal.classList.remove("is-hidden");

    // Smooth fade configuration using hardware frames
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        targetModal.classList.add("is-visible");
      });
    });
  }

  function hideComplianceOverlay(targetModal) {
    if (!targetModal) {
      return;
    }
    targetModal.classList.remove("is-visible");
    setTimeout(function () {
      targetModal.classList.add("is-hidden");
    }, 250);
  }

  // Intercept footer link routing natively
  footerLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      const anchorValue = link.getAttribute("href");
      if (anchorValue === "#privacy") {
        e.preventDefault();
        displayComplianceOverlay(privacyModal);
      } else if (anchorValue === "#terms") {
        e.preventDefault();
        displayComplianceOverlay(termsModal);
      }
    });
  });

  // Wire close actions explicitly using element data attribute arrays
  closeButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const modalId = btn.getAttribute("data-close-target");
      const activeOverlay = document.getElementById(modalId);
      hideComplianceOverlay(activeOverlay);
    });
  });

  // Allow users to close the modal by clicking the darkened background overlay
  const overlays = document.querySelectorAll(".compliance-overlay");

  overlays.forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      // e.target is what was actually clicked. overlay is the background container.
      // If they match exactly, the user clicked outside the white modal box.
      if (e.target === overlay) {
        hideComplianceOverlay(overlay);
      }
    });
  });

  // Initiate active gameplay seamlessly
  startLevel(1);

  console.log("Solfaic! App Initialised. 🚀");
});

// ==========================================================================
// ACCESSIBILITY: GLOBAL HOTKEY ROUTING
// ==========================================================================
document.addEventListener("keydown", (e) => {
  // 1. Prevent hotkeys from firing if the user has a modal open or game is locked
  if (sessionState.playbackState === "LOCKED") return;

  switch (e.code) {
    case "Space":
      // Prevent the spacebar from scrolling the page downwards
      e.preventDefault();
      const playBtn = document.getElementById("btn-replay");
      // Only click if it's not disabled (out of tokens)
      if (playBtn && !playBtn.disabled) playBtn.click();
      break;

    case "Enter":
      e.preventDefault();
      const submitBtn = document.getElementById("btn-submit");
      if (submitBtn) submitBtn.click();
      break;

    case "Backspace":
      e.preventDefault();

      // 1. Grab the individual clickable CARDS, not the measure bars!
      const workspaceCards = document.querySelectorAll(
        "#ui-workspace .workspace-card",
      );

      // 2. Loop backwards to find the last placed note or extension
      for (let i = workspaceCards.length - 1; i >= 0; i--) {
        // If the card does NOT have 'is-placeholder', it is holding a note (or an error)
        if (!workspaceCards[i].classList.contains("is-placeholder")) {
          workspaceCards[i].click(); // Safely trigger your exact removal logic
          break; // Stop immediately so we only delete one beat per keystroke
        }
      }
      break;
  }

  // 2. Map Number Keys (1-9) to the Motif Selection Pads
  if (e.key >= "1" && e.key <= "9") {
    const motifIndex = parseInt(e.key) - 1; // '1' becomes index 0

    // Find all currently rendered motif buttons in the switcher
    const motifPads = document.querySelectorAll(
      "#ui-motif-selector .motif-pad",
    );

    if (motifPads[motifIndex]) {
      // Trigger the exact same click event as if the user tapped it
      motifPads[motifIndex].click();

      // Add a quick flash effect so the user knows it registered
      motifPads[motifIndex].classList.add("is-active");
      setTimeout(
        () => motifPads[motifIndex].classList.remove("is-active"),
        150,
      );
    }
  }
});
