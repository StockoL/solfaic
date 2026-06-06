/**
 * SOLFAIC! - Rhythm Dictation MVP
 * Core Architecture: Data Model, State Machine, and UI Controller (Foundational)
 */

// ==========================================
// 1. DATA MODEL (Configuration & Rules)
// ==========================================

/**
 * British Kodaly Academy Curriculum
 * Motifs are tagged with 'type' to prevent mathematically breaking the timeline.
 * 'ticks' represent the beat footprint (1 tick = 1 crotchet in simple, 1 dotted-crotchet in compound).
 * 'duration' is formatted for future Tone.js compatibility.
 */
const MOTIF_LIBRARY = {
  // --- SIMPLE TIME ---
  ta: { type: "simple", duration: "4n", ticks: 1, label: "ta", symbol: "𝅘𝅥" },
  titi: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-ti",
    symbol: "♫",
  },
  taRest: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ta rest",
    symbol: "𝄽",
  },
  tikatika: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "tika-tika",
    symbol: "𝅘𝅥𝅯𝅘𝅥𝅯𝅘𝅥𝅯𝅘𝅥𝅯",
  },
  tikati: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "tika-ti",
    symbol: "𝅘𝅥𝅯𝅘𝅥𝅯𝅘𝅥𝅮",
  },
  titika: {
    type: "simple",
    duration: "4n",
    ticks: 1,
    label: "ti-tika",
    symbol: "𝅘𝅥𝅮𝅘𝅥𝅯𝅘𝅥𝅯",
  },
  taa: {
    type: "simple",
    duration: "2n",
    ticks: 2,
    label: "ta-a",
    symbol: "𝅗𝅥",
  },

  // --- COMPOUND TIME ---
  tai: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tai",
    symbol: "𝅘𝅥.",
  },
  tititi: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "ti-ti-ti",
    symbol: "𝅘𝅥𝅮𝅘𝅥𝅮𝅘𝅥𝅮",
  },
  tati: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "ta ti",
    symbol: "𝅘𝅥 𝅘𝅥𝅮",
  },
  taiRest: {
    type: "compound",
    duration: "4n.",
    ticks: 1,
    label: "tai rest",
    symbol: "𝄽.",
  },
};

/**
 * Decoupled Pedagogical Levels
 * Simple and Compound motifs are strictly isolated to prevent metric cross-contamination.
 */
const levelRules = {
  1: {
    allowedMetres: ["2/4", "3/4", "4/4"],
    barOptions: [2, 4],
    simpleMotifs: ["ta", "titi", "taRest"],
    compoundMotifs: [], // Level 1 does not use compound time
  },
  2: {
    allowedMetres: ["2/4", "3/4", "4/4", "6/8"],
    barOptions: [2, 4],
    simpleMotifs: ["ta", "titi", "taRest"],
    compoundMotifs: ["tai", "tititi", "tati", "taiRest"], // 6/8 introduced
  },
  3: {
    allowedMetres: ["2/4", "3/4", "4/4", "6/8"],
    barOptions: [2, 4],
    simpleMotifs: [
      "ta",
      "titi",
      "taRest",
      "tikatika",
      "tikati",
      "titika",
      "taa",
    ],
    compoundMotifs: ["tai", "tititi", "tati", "taiRest"],
  },
};

// ==========================================
// 2. STATE MACHINE (Active Session Tracking)
// ==========================================
const sessionState = {
  currentLevel: 1,
  playCount: 0,
  streak: 0,
  maxPlays: 2,

  // Dynamically populated by the generator for the current round
  activeConfig: null,

  // Sequence tracking
  targetTimeline: [], // The generated "source of truth"
  userSubmission: [], // What the user builds in the workspace

  // Application flow state
  currentState: "IDLE", // Possible: 'IDLE', 'PLAYING', 'AWAITING_INPUT'
};

// ==========================================
// 3. UI DOM CACHE (View Connections)
// ==========================================
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
};

// ==========================================
// 4. RHYTHM GENERATOR (The Core Logic)
// ==========================================

/**
 * Generates a randomised rhythm sequence based on level constraints and metric isolation.
 *
 * @param {number} levelId - The ID of the level to generate for.
 * @returns {Array} An array of Event Objects for the timeline.
 */
function generateRhythmTimeline(levelId) {
  const rules = levelRules[levelId];
  if (!rules) {
    console.error(`Level ${levelId} not found.`);
    return [];
  }

  // 1. Pick a random metre and bar length for this round
  const chosenMetre =
    rules.allowedMetres[Math.floor(Math.random() * rules.allowedMetres.length)];
  const barCount =
    rules.barOptions[Math.floor(Math.random() * rules.barOptions.length)];

  // 2. Parse the mathematical constraints of the chosen metre
  let metreType = "simple";
  let ticksPerBar = 4;

  if (chosenMetre === "4/4") ticksPerBar = 4;
  if (chosenMetre === "3/4") ticksPerBar = 3;
  if (chosenMetre === "2/4") ticksPerBar = 2;
  if (chosenMetre === "6/8") {
    metreType = "compound";
    ticksPerBar = 2; // In 6/8, there are 2 main dotted-crotchet beats per bar
  }

  const totalTicks = barCount * ticksPerBar;

  // 3. SECURE ROUTING: Grab the exact array for this specific metre type
  const validMotifsForRound =
    metreType === "simple" ? rules.simpleMotifs : rules.compoundMotifs;

  // 4. Save this specific assembly to the active config so the UI can render it
  sessionState.activeConfig = {
    metre: chosenMetre,
    bars: barCount,
    totalTicks: totalTicks,
    ticksPerBar: ticksPerBar,
    allowedMotifs: validMotifsForRound,
  };

  // 5. Generate the timeline
  const timeline = [];
  let currentTicks = 0;

  while (currentTicks < totalTicks) {
    const remainingTicks = totalTicks - currentTicks;

    // Only pick motifs that fit in the remaining space of the sequence
    const viableIds = validMotifsForRound.filter(
      (id) => MOTIF_LIBRARY[id].ticks <= remainingTicks,
    );
    if (viableIds.length === 0) break;

    const chosenId = viableIds[Math.floor(Math.random() * viableIds.length)];
    const motifData = MOTIF_LIBRARY[chosenId];

    const bar = Math.floor(currentTicks / ticksPerBar);
    const beat = currentTicks % ticksPerBar;
    const timeString = `${bar}:${beat}:0`;

    timeline.push({
      time: timeString,
      duration: motifData.duration,
      motifId: chosenId,
      pitch: null,
    });

    currentTicks += motifData.ticks;
  }

  return timeline;
}

// ==========================================
// 5. UI RENDERING (The View Controller)
// ==========================================
function startLevel(levelId) {
  // 1. Reset State
  sessionState.currentLevel = levelId;
  sessionState.playCount = 0;
  sessionState.userSubmission = [];

  // This calculates the timeline AND populates sessionState.activeConfig
  sessionState.targetTimeline = generateRhythmTimeline(levelId);
  sessionState.currentState = "IDLE";

  // 2. Fetch the dynamically generated rules for this specific round
  const config = sessionState.activeConfig;

  // 3. Update Header & Blueprint Anchor Text
  DOM.levelBadge.innerText = `Level ${levelId}`;
  DOM.metreDisplay.innerText = `Metre: ${config.metre}`;
  DOM.barsDisplay.innerText = `Bars: ${config.bars}`;
  DOM.playsRemaining.innerText = `Plays remaining: ${sessionState.maxPlays} / ${sessionState.maxPlays}`;

  // 4. Clear the workspace
  DOM.workspace.innerHTML = "";
  DOM.motifSelector.innerHTML = "";

  // 5. Dynamically generate the clickable buttons for the allowed motifs
  config.allowedMotifs.forEach((motifId) => {
    const motifData = MOTIF_LIBRARY[motifId];

    const btn = document.createElement("button");
    btn.className = "motif-pad";
    btn.innerHTML = `<span class="music-font">${motifData.symbol}</span> ${motifData.label}`;

    btn.addEventListener("click", () => handleMotifClick(motifId));

    DOM.motifSelector.appendChild(btn);
  });

  console.log(
    `[Engine] Level ${levelId} Initialised. Metre: ${config.metre}. Target array generated.`,
  );
}

// ==========================================
// 6. INTERACTION LOGIC (Clicking Buttons)
// ==========================================
/**
 * Handles user clicks on motif buttons, adding the chosen motif to the workspace and internal submission array.
 * @param {string} motifId - The ID of the motif that was clicked.
 */
function handleMotifClick(motifId) {
  if (sessionState.currentState === "PLAYING") return; // Block clicks if audio is playing

  const motifData = MOTIF_LIBRARY[motifId];

  // Add to internal memory tracking
  sessionState.userSubmission.push(motifId);

  // Add visual card to the screen
  const card = document.createElement("div");
  card.className = "workspace-card";
  card.innerText = motifData.label;

  DOM.workspace.appendChild(card);
}

// ==========================================
// BOOT UP THE APP
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  startLevel(1);
});

// ==========================================
// INITIALISATION / DEBUG
// ==========================================
console.log("Solfaic! App Initialised.");
console.log("Sample Generation (Level 1):", generateRhythmTimeline(1));
