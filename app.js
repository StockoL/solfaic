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
 * 'duration' is formatted for future Tone.js compatibility.
 */
const MOTIF_LIBRARY = {
  // 4/4 motifs
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
  // The anchor line elements
  metreDisplay: document.getElementById("ui-metre-display"),
  barsDisplay: document.getElementById("ui-bars-display"),
};

// ==========================================
// 4. RHYTHM GENERATOR (The Core Logic)
// ==========================================

// ==========================================
// 5. UI RENDERING (The View Controller)
// ==========================================

// ==========================================
// 6. INTERACTION LOGIC (Clicking Buttons)
// ==========================================

// ==========================================
// BOOT UP THE APP
// ==========================================
