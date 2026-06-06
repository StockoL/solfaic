/**
 * SOLFAIC! - Rhythm Dictation MVP
 * Core Architecture: Data Model, State Machine, and UI Controller (Foundational)
 */

// ==========================================
// 1. DATA MODEL (Configuration & Rules)
// ==========================================

/**
 * Motif definitions mapping IDs to their rhythmic properties.
 * 'ticks' represent the smallest unit of measurement for that level (beat or pulse).
 * 'duration' is formatted for future Tone.js compatibility, which uses a "bars:beats:sixteenths" time format for scheduling events rather than absolute seconds. This allows for easy expansion into melodic elements later on without restructuring the core timeline logic.
 */
const MOTIF_LIBRARY = {
  // 4/4 motifs (1 tick = 1 beat)
  crotchet: { duration: "4n", ticks: 1, label: "Crotchet", symbol: "♩" },
  minim: { duration: "2n", ticks: 2, label: "Minim", symbol: "𝅗𝅥" },
  quaverPair: { duration: "4n", ticks: 1, label: "Quaver Pair", symbol: "♫" },

  // 6/8 motifs
  quaver: { duration: "8n", ticks: 1, label: "Quaver", symbol: "♪" },
  crotchet68: { duration: "4n", ticks: 2, label: "Crotchet", symbol: "♩" },
  dottedCrotchet: {
    duration: "4n.",
    ticks: 3,
    label: "Dotted Crot.",
    symbol: "♩.",
  },
};

/**
 * Level settings defining the constraints for the rhythm generator.
 */
const levelSettings = {
  1: {
    metre: "4/4",
    totalTicks: 4, // 4 beats total
    allowedMotifs: ["crotchet", "minim"],
    ticksPerBar: 4,
  },
  2: {
    metre: "4/4",
    totalTicks: 8, // 8 beats total
    allowedMotifs: ["crotchet", "quaverPair", "minim"],
    ticksPerBar: 4,
  },
  3: {
    metre: "6/8",
    totalTicks: 6, // 6 pulses total
    allowedMotifs: ["crotchet68", "quaver", "dottedCrotchet"],
    ticksPerBar: 6,
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

  // Sequence tracking
  targetTimeline: [], // The generated "source of truth" for the rhythm sequence to be replicated
  userSubmission: [], // What the user builds in the workspace before submitting for evaluation

  // Application flow state - helps manage UI states and button availability
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
  // The anchor line elements
  metreDisplay: document.getElementById("ui-metre-display"),
  barsDisplay: document.getElementById("ui-bars-display"),
};

// ==========================================
// 4. RHYTHM GENERATOR (The Core Logic)
// ==========================================

/**
 * Generates a randomised rhythm sequence based on level constraints.
 *
 * @param {number} levelId - The ID of the level to generate for.
 * @returns {Array} An array of Event Objects for the timeline.
 */
function generateRhythmTimeline(levelId) {
  const config = levelSettings[levelId];
  if (!config) {
    console.error(`Level ${levelId} not found.`);
    return [];
  }

  const timeline = [];
  let currentTicks = 0;

  while (currentTicks < config.totalTicks) {
    // 1. Filter motifs that fit in the remaining space of the timeline
    const remainingTicks = config.totalTicks - currentTicks;
    const viableMotifs = config.allowedMotifs.filter(
      (id) => MOTIF_LIBRARY[id].ticks <= remainingTicks,
    );

    if (viableMotifs.length === 0) break;

    // 2. Randomly pick a motif from the viable options
    const chosenId =
      viableMotifs[Math.floor(Math.random() * viableMotifs.length)];
    const motifData = MOTIF_LIBRARY[chosenId];

    // 3. Calculate time signature aware "Bars:Beats:rhythmic subdivisions"
    const bar = Math.floor(currentTicks / config.ticksPerBar);
    const beat = currentTicks % config.ticksPerBar;
    const timeString = `${bar}:${beat}:0`;

    // 4. Push event object (future-proofed for pitch/melody)
    timeline.push({
      time: timeString,
      duration: motifData.duration,
      motifId: chosenId,
      pitch: null, // Rhythm only for initial MVP, but structured for future melodic expansion
    });

    // 5. Advance cursor
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
  sessionState.targetTimeline = generateRhythmTimeline(levelId);
  sessionState.currentState = "IDLE";

  const config = levelSettings[levelId];

  // 2. Update Header & Blueprint Anchor Text
  DOM.levelBadge.innerText = `Level ${levelId}`;
  DOM.metreDisplay.innerText = `Metre: ${config.metre}`;

  // Calculate bars by dividing total ticks by ticks per bar
  DOM.barsDisplay.innerText = `Bars: ${config.totalTicks / config.ticksPerBar}`;
  DOM.playsRemaining.innerText = `Plays remaining: ${sessionState.maxPlays} / ${sessionState.maxPlays}`;

  // 3. Clear the workspace (Crucial for resetting between levels)
  DOM.workspace.innerHTML = "";
  DOM.motifSelector.innerHTML = "";

  // 4. Dynamically generate the clickable buttons for the allowed motifs in this level
  config.allowedMotifs.forEach((motifId) => {
    const motifData = MOTIF_LIBRARY[motifId];

    const btn = document.createElement("button");
    btn.className = "motif-pad";
    btn.innerHTML = `<span class="music-font">${motifData.symbol}</span> ${motifData.label}`;

    // Listen for clicks
    btn.addEventListener("click", () => handleMotifClick(motifId));

    DOM.motifSelector.appendChild(btn);
  });

  console.log(`[Engine] Level ${levelId} Initialised. Target array generated.`);
}

// ==========================================
// 6. INTERACTION LOGIC (Clicking Buttons)
// ==========================================
/**
 * Handles user clicks on motif buttons, adding the chosen motif to the workspace and internal submission array.
 * @param {string} motifId - The ID of the motif that was clicked, used to retrieve its properties from the MOTIF_LIBRARY.
 * This function also checks the current state of the session to prevent interactions that could conflict with audio playback or other state-dependent logic. It updates both the visual representation in the workspace and the internal data model that tracks the user's current submission sequence.
 */
function handleMotifClick(motifId) {
  if (sessionState.currentState === "PLAYING") return; // Block clicks if audio is playing to prevent state conflicts

  const motifData = MOTIF_LIBRARY[motifId];

  // Add to internal memory - this is what will be evaluated against the targetTimeline when the user submits their answer. It tracks the sequence of motif IDs chosen by the user.
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
  startLevel(1); // Start at Level 1 by default. In the future, add a level select screen.
});

// ==========================================
// INITIALISATION / DEBUG
// ==========================================

console.log("Solfaic! App Initialised.");
console.log("Sample Generation (Level 1):", generateRhythmTimeline(1));
