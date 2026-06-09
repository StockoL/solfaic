/**
 * ============================================================================
 * SOLFAIC! - Rhythm Dictation Core Application Engine
 * ============================================================================
 * Architecture: Model-View-Controller (MVC) Hybrid Strategy
 * * This file serves as the singular brain of the application. It governs the
 * underlying musical data structures, coordinates state changes, drives the Web
 * Audio API synthesis pipeline, and updates the DOM in response to interactions.
 * ============================================================================
 */

// ==========================================
// 1. DATA MODEL (Configuration & Rules)
// ==========================================

/**
 * SVG Vector Graphics Library
 * These inline vector strings render musical notation cleanly at any device resolution.
 * All dictionary object keys are strictly mapped using Kodály pedagogical terminologies.
 * * Fill/Stroke settings use 'currentColor' to gracefully absorb parent CSS theme palettes.
 */
const SVG_ICONS = {
  // Simple time values (Single-unit structures)
  ta: `<svg viewBox="0 0 40 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/></svg>`,
  titi: `<svg viewBox="0 0 80 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="64" cy="85" rx="12" ry="8" transform="rotate(-20 64 85)"/><rect x="72" y="15" width="3" height="70"/><rect x="22" y="15" width="53" height="8"/></svg>`,
  taRest: `<svg viewBox="0 0 40 100" width="100%" height="100%" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 25 20 L 15 40 L 30 55 L 15 80" fill="none"/></svg>`,
  taa: `<svg viewBox="0 0 40 100" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="3"><ellipse cx="14" cy="85" rx="10" ry="7" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70" fill="currentColor" stroke="none"/></svg>`,

  // Simple Time Semiquavers (Level 3 subdivisions)
  tikatika: `<svg viewBox="0 0 160 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><ellipse cx="134" cy="85" rx="12" ry="8" transform="rotate(-20 134 85)"/><rect x="142" y="15" width="3" height="70"/><rect x="22" y="15" width="123" height="8"/><rect x="22" y="27" width="123" height="8"/></svg>`,
  tikati: `<svg viewBox="0 0 120 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><rect x="22" y="15" width="83" height="8"/><rect x="22" y="27" width="43" height="8"/></svg>`,
  titika: `<svg viewBox="0 0 120 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><rect x="22" y="15" width="83" height="8"/><rect x="62" y="27" width="43" height="8"/></svg>`,

  // Compound Time Values (Level 2/3 triple-meter elements)
  tai: `<svg viewBox="0 0 50 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><circle cx="40" cy="80" r="4"/></svg>`,
  tititi: `<svg viewBox="0 0 120 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><rect x="22" y="15" width="83" height="8"/></svg>`,
  tati: `<svg viewBox="0 0 90 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="64" cy="85" rx="12" ry="8" transform="rotate(-20 64 85)"/><rect x="72" y="15" width="3" height="70"/><path d="M 72 15 C 85 15 85 40 72 45 C 80 40 80 25 72 25 Z"/></svg>`,
  taiRest: `<svg viewBox="0 0 50 100" width="100%" height="100%" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 20 20 L 10 40 L 25 55 L 10 80" fill="none"/><circle cx="40" cy="55" r="3" stroke="none" fill="currentColor"/></svg>`,
};

/**
 * Master Metric Motif Library
 * Defines the parameters for each note value.
 * 'ticks' mapped to spatial layout cost (1 tick = 1 standard quarter-note grid spot).
 * 'playback' maps string instructions to Tone.js time parameters.
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
 * Progression Level Rules Matrix
 * Curates structural generation limits and valid token dictionaries for each level.
 */
const levelRules = {
  1: {
    allowedMetres: ["2/4", "3/4", "4/4"],
    barOptions: [2],
    simpleMotifs: ["ta", "titi", "taRest"],
    compoundMotifs: [],
  },
  2: {
    allowedMetres: ["2/4", "3/4", "4/4", "6/8"],
    barOptions: [2, 4],
    simpleMotifs: ["ta", "titi", "taRest"],
    compoundMotifs: ["tai", "tititi", "tati", "taiRest"],
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

/**
 * Singular Source of Truth State Object
 * Holds session memory. Interacting elements mutate these values,
 * then trigger a clean rendering pipeline pass to match the view to the state.
 */
const sessionState = {
  currentLevel: 1,
  playCount: 0,
  streak: 0,
  maxPlays: 3, // Capital allowance limit before corrections run
  activeConfig: null, // Holds dynamic level metadata (bars, ticks, meter type)
  targetTimeline: [], // The correct sequence generated by the algorithm
  userSubmission: [], // The student's current construction lane state array
  slotStates: [], // State mirrors tracking verification history ('idle', 'success', 'error')
  selectedSlotIndex: null, // Touch focus variable tracking mobile input ring placement
  currentState: "IDLE", // Engine flags: 'IDLE' or 'PLAYING' (locks system interactions)
};

// ==========================================
// 2b. GUIDED TOUR ARCHITECTURE CONFIGURATION
// ==========================================
let tourCurrentStepIndex = 0;
let activeTourSteps = [];

/**
 * Dynamic Tour Mapping Dictionary Builder
 * Configures exact tracking identifiers and intent coordinates for mobile steps.
 */
function compileTourSequence() {
  const isMobileViewport = window.innerWidth < 1024;

  return [
    {
      elementId: isMobileViewport ? "btn-toggle-sidebar" : "ui-sidebar",
      text: isMobileViewport
        ? "Welcome! Tap this hamburger menu button at any time to open up your Kodály reference table."
        : "Welcome to Solfaic! This is your permanent curriculum matrix guide. Reference your syllables and notation rules here.",
      mobilePosition: "bottom",
    },
    {
      elementId: "btn-replay",
      text: "Step 1: Hit this primary action button to listen to your target sound wave. Listen carefully—you have 3 plays maximum!",
      mobilePosition: "bottom",
    },
    {
      elementId: "ui-workspace",
      text: "Step 2: This is your dictation staff. Your rhythm cards will assemble across these active, segmented measure beat boxes.",
      mobilePosition: "bottom",
    },
    {
      elementId: "ui-motif-selector",
      text: "Step 3: Choose your musical building block components here. Tap or drag them up onto the staves to arrange your dictation answer.",
      mobilePosition: "top",
    },
    {
      elementId: "btn-submit",
      text: "Step 4: Once every empty measure placeholder slot is completely populated, smash this button to evaluate your rhythmic precision. Good luck!",
      mobilePosition: "top",
    },
  ];
}

// ==========================================
// 3. UI DOM CACHE (View Connections)
// ==========================================

/**
 * Document Object Model Pointer Cache
 * Eliminates repetitive layout lookups, boosting interaction performance.
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
  skipBtn: document.getElementById("btn-skip"),
};

// ==========================================
// 4. RHYTHM GENERATOR (The Core Logic)
// ==========================================

/**
 * Algorithmic Rhythm Sequence Generator
 * Creates mathematically valid rhythmic equations based on level constraints.
 * * @param {number} levelId - The active level target index.
 * @returns {Array} An array of event timelines ready for Tone.js scheduling.
 */
function generateRhythmTimeline(levelId) {
  const rules = levelRules[levelId];
  if (!rules) return [];

  // Randomize structural choices from authorized parameters
  const chosenMetre =
    rules.allowedMetres[Math.floor(Math.random() * rules.allowedMetres.length)];
  const barCount =
    rules.barOptions[Math.floor(Math.random() * rules.barOptions.length)];

  let metreType = "simple";
  let ticksPerBar = 4;

  // Process time signature constraints
  if (chosenMetre === "4/4") ticksPerBar = 4;
  if (chosenMetre === "3/4") ticksPerBar = 3;
  if (chosenMetre === "2/4") ticksPerBar = 2;
  if (chosenMetre === "6/8") {
    metreType = "compound";
    ticksPerBar = 2; // Handled as 2 dotted quarter note beats per bar
  }

  const totalTicks = barCount * ticksPerBar;
  const validMotifsForRound =
    metreType === "simple" ? rules.simpleMotifs : rules.compoundMotifs;

  // Commit dynamic blueprint metadata configuration to state
  sessionState.activeConfig = {
    metre: chosenMetre,
    bars: barCount,
    totalTicks: totalTicks,
    ticksPerBar: ticksPerBar,
    allowedMotifs: validMotifsForRound,
  };

  const timeline = [];
  let currentTicks = 0;

  // Generate sequence within metric boundaries
  while (currentTicks < totalTicks) {
    const remainingTicks = totalTicks - currentTicks;

    // Filter available cards to avoid structural bars overflow
    const viableIds = validMotifsForRound.filter(
      (id) => MOTIF_LIBRARY[id].ticks <= remainingTicks,
    );
    if (viableIds.length === 0) break;

    const chosenId = viableIds[Math.floor(Math.random() * viableIds.length)];
    const motifData = MOTIF_LIBRARY[chosenId];

    // Compute standard transport timeline values (bar:beat:sixteenths)
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

/**
 * Streak Marker UI Updater
 * Refreshes progress display boxes based on the current validation state history.
 */
function renderStreakTracker() {
  DOM.streakTracker.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "streak-dot";
    if (i < sessionState.streak) {
      dot.classList.add("is-success");
    }
    DOM.streakTracker.appendChild(dot);
  }
}

/**
 * Level Initialization Controller
 * Resets memory, clears templates, sets layouts, and starts a fresh gameplay loop.
 * * @param {number} levelId - The level selection index target.
 */
function startLevel(levelId) {
  sessionState.currentLevel = levelId;
  sessionState.playCount = 0;
  sessionState.currentState = "IDLE";
  sessionState.selectedSlotIndex = null;

  // Generate targets and configure structural constraints
  sessionState.targetTimeline = generateRhythmTimeline(levelId);
  const config = sessionState.activeConfig;

  // Build clean tracking state arrays matching computed structural widths
  sessionState.userSubmission = Array(config.bars * config.ticksPerBar).fill(
    null,
  );
  sessionState.slotStates = Array(config.bars * config.ticksPerBar).fill(
    "idle",
  );

  // Re-enable interactive elements
  DOM.submitBtn.classList.remove("is-locked");
  DOM.skipBtn.classList.remove("is-locked");
  DOM.replayBtn.classList.remove("is-locked");

  // Synchronize layout information fields
  DOM.levelBadge.innerText = `Level ${levelId}`;
  DOM.metreDisplay.innerText = `Metre: ${config.metre}`;
  DOM.barsDisplay.innerText = `Bars: ${config.bars}`;
  DOM.playsRemaining.innerText = `Plays remaining: ${sessionState.maxPlays} / ${sessionState.maxPlays}`;

  renderStreakTracker();

  DOM.workspace.innerHTML = "";
  DOM.motifSelector.innerHTML = "";

  // Render valid entry card choices into the selection lane tray
  config.allowedMotifs.forEach((motifId) => {
    const motifData = MOTIF_LIBRARY[motifId];
    const btn = document.createElement("button");
    btn.className = "motif-pad";

    btn.innerHTML = motifData.svg
      ? `<div class="svg-container">${motifData.svg}</div> ${motifData.label}`
      : `<span class="music-font">${motifData.symbol}</span> ${motifData.label}`;

    // Desktop Input Handlers (HTML5 Drag-and-Drop)
    btn.setAttribute("draggable", "true");
    btn.addEventListener("dragstart", (e) => {
      if (sessionState.currentState === "PLAYING") {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData("text/plain", motifId);
    });

    // Mobile/Fallback Click Handler
    btn.addEventListener("click", () => {
      if (sessionState.currentState === "PLAYING") return;

      let targetIndex = sessionState.selectedSlotIndex;
      // Fallback: If no target focus ring is selected, find the first open spot
      if (
        targetIndex === null ||
        sessionState.userSubmission[targetIndex] !== null
      ) {
        targetIndex = sessionState.userSubmission.indexOf(null);
      }

      if (targetIndex !== -1) {
        insertMotifAt(targetIndex, motifId);
      }
    });

    DOM.motifSelector.appendChild(btn);
  });

  renderWorkspace();
  console.log(
    `[Engine] Level ${levelId} Initialised. Streak: ${sessionState.streak}/3`,
  );
}

/**
 * Workspace Display Synchronization Engine
 * Rebuilds the musical bars, staves, placeholders, and entries to match the tracking states.
 */
function renderWorkspace() {
  DOM.workspace.innerHTML = "";
  const config = sessionState.activeConfig;

  // Build structural measures/bars matching calculated level parameters
  const bars = [];
  for (let i = 0; i < config.bars; i++) {
    const barDiv = document.createElement("div");
    barDiv.className = "workspace-bar";
    bars.push(barDiv);
    DOM.workspace.appendChild(barDiv);
  }

  // Iterate over state positions and place cards in their structural bars
  sessionState.userSubmission.forEach((token, index) => {
    const currentBarIndex = Math.floor(index / config.ticksPerBar);

    if (currentBarIndex < bars.length) {
      const card = document.createElement("div");

      // Inject past validation feedback memory colors
      if (sessionState.slotStates[index] === "success") {
        card.classList.add("is-success");
      } else if (sessionState.slotStates[index] === "error") {
        card.classList.add("is-error");
      }

      // Drag-and-Drop Layout Track Hooks
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

      // Template Pattern A: Spot is an empty slot placeholder
      if (token === null) {
        card.className += " workspace-card is-placeholder";
        card.innerHTML = `<div class="svg-container">•</div>`;
        card.title = "Tap to highlight target, or drag note here";

        if (index === sessionState.selectedSlotIndex) {
          card.classList.add("is-targeted"); // Highlight focus ring
        }

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          sessionState.selectedSlotIndex = index;
          renderWorkspace(); // Redraw view to activate focus ring highlights
        });
      }
      // Template Pattern B: Spot is an extension spacer tied to a multi-beat value (e.g., ta-a)
      else if (token.endsWith("_ext")) {
        const rootId = token.replace("_ext", "");
        card.className += " workspace-card is-extension";
        card.innerHTML = `<div class="svg-container" style="font-size: 1.5rem; color: var(--color-text-muted); font-weight:800;">—</div>`;
        card.title = "Click to clear this structural note";

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          clearMultiBeatNote(index, rootId);
        });
      }
      // Template Pattern C: Spot holds a standard root card element
      else {
        const motifData = MOTIF_LIBRARY[token];
        card.className += " workspace-card";
        card.innerHTML =
          motifData && motifData.svg
            ? `<div class="svg-container">${motifData.svg}</div>`
            : `<div class="svg-container">${token}</div>`;
        card.title = "Click to clear this note";

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          clearMultiBeatNote(index, token);
        });
      }

      bars[currentBarIndex].appendChild(card);
    }
  });
}

/**
 * Structural Token Placement Intermediary
 * Resolves space boundaries and maps tokens and extensions into the data state array.
 * * @param {number} index - The target placement position array index.
 * @param {string} motifId - The selected asset token dictionary key.
 */
function insertMotifAt(index, motifId) {
  const duration = MOTIF_LIBRARY[motifId].ticks || 1;

  // Verify placement fits within the remaining space of the current bar
  if (index + duration <= sessionState.userSubmission.length) {
    // Clear out any existing notes in the targeted slot range
    for (let i = 0; i < duration; i++) {
      const existingToken = sessionState.userSubmission[index + i];
      if (existingToken) {
        const rootId = existingToken.replace("_ext", "");
        clearMultiBeatNote(index + i, rootId);
      }
    }

    // Insert new parent card and reset past validation tracking
    sessionState.userSubmission[index] = motifId;
    sessionState.slotStates[index] = "idle";

    // Populate remaining slots with structural extension tags if card spans multiple beats
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
 * Structural Note Removal Engine
 * Identifies root nodes from extension offsets, clearing card arrays cleanly.
 * * @param {number} index - The click event position target index.
 * @param {string} motifId - The targeted node type to erase.
 */
function clearMultiBeatNote(index, motifId) {
  const duration = MOTIF_LIBRARY[motifId].ticks || 1;
  let startIndex = index;

  // If user clicked an extension track spot, walk backward to find the root node index
  if (sessionState.userSubmission[index] === `${motifId}_ext`) {
    while (
      startIndex > 0 &&
      sessionState.userSubmission[startIndex] === `${motifId}_ext`
    ) {
      startIndex--;
    }
  }

  // Clear root position
  sessionState.userSubmission[startIndex] = null;
  sessionState.slotStates[startIndex] = "idle";

  // Clear matching extensions
  for (let i = 1; i < duration; i++) {
    if (sessionState.userSubmission[startIndex + i] === `${motifId}_ext`) {
      sessionState.userSubmission[startIndex + i] = null;
      sessionState.slotStates[startIndex + i] = "idle";
    }
  }
  sessionState.selectedSlotIndex = null;
  renderWorkspace();
}

// ==========================================
// 7. EVALUATION LOGIC & POP-UP INJECTOR
// ==========================================

/**
 * Input Sequence Validation Controller
 * Audits answers against the target timeline, handles feedback animations,
 * manages streaks, and checks available remaining attempts.
 */
function evaluateSubmission() {
  if (sessionState.currentState === "PLAYING") return;

  const config = sessionState.activeConfig;

  // Validation Check: Reject submissions with empty layout spots
  if (sessionState.userSubmission.includes(null)) {
    const bars = DOM.workspace.querySelectorAll(".workspace-bar");

    bars.forEach((bar) => {
      // Clear previous instances to allow animation re-triggers
      bar.classList.remove("is-shaking");

      // FORCED REFLOW TRICK: Forces layout pipeline calculation immediately.
      // Breaks browser style batching optimizations so the shake animation runs reliably on every click.
      void bar.offsetWidth;

      bar.classList.add("is-shaking");
    });

    // Flash empty slots with a warning color scheme
    const missingSlots = DOM.workspace.querySelectorAll(
      ".workspace-card.is-placeholder",
    );
    missingSlots.forEach((card) => card.classList.add("is-empty-panic"));

    // Safe 500ms cleaning buffer prevents tearing down styles mid-animation pass
    setTimeout(() => {
      bars.forEach((bar) => bar.classList.remove("is-shaking"));
      missingSlots.forEach((card) => card.classList.remove("is-empty-panic"));
    }, 500);

    return;
  }

  // Lock user inputs during the verification phase
  sessionState.currentState = "PLAYING";
  DOM.submitBtn.classList.add("is-locked");
  DOM.skipBtn.classList.add("is-locked");
  DOM.replayBtn.classList.add("is-locked");

  // Flatten target timeline entries to enable direct index comparisons
  const flatTarget = [];
  sessionState.targetTimeline.forEach((event) => {
    const duration = MOTIF_LIBRARY[event.motifId].ticks || 1;
    flatTarget.push(event.motifId);
    for (let i = 1; i < duration; i++) {
      flatTarget.push(`${event.motifId}_ext`);
    }
  });

  let isCorrect = true;

  // Compare arrays and map validation outcomes to each position slot
  sessionState.userSubmission.forEach((token, index) => {
    const targetToken = flatTarget[index];

    if (token === targetToken) {
      sessionState.slotStates[index] = "success";
    } else {
      sessionState.slotStates[index] = "error";
      isCorrect = false;
    }
  });

  renderWorkspace();

  // Branch A: Sequence matches perfectly
  if (isCorrect) {
    sessionState.streak++;
    renderStreakTracker();

    setTimeout(() => {
      if (sessionState.streak >= 3) {
        // Milestone reached: Reset streak and open the promotion modal
        sessionState.streak = 0;
        const nextLevel = sessionState.currentLevel + 1;
        triggerCelebrationModal(nextLevel);
      } else {
        startLevel(sessionState.currentLevel);
      }
    }, 1000);
  }
  // Branch B: Sequence has an error
  else {
    sessionState.streak = 0; // Reset progress streak
    renderStreakTracker();

    // Out of plays: Run the automatic blue correction sequence
    if (sessionState.playCount >= sessionState.maxPlays) {
      setTimeout(() => {
        sessionState.userSubmission = [...flatTarget];
        sessionState.slotStates = Array(flatTarget.length).fill("idle");
        renderWorkspace();

        const correctedCards =
          DOM.workspace.querySelectorAll(".workspace-card");
        correctedCards.forEach((card) => {
          card.style.borderColor = "#3b82f6";
          card.style.backgroundColor = "#eff6ff";
        });

        setTimeout(() => {
          startLevel(sessionState.currentLevel);
        }, 4000);
      }, 1500);
    }
    // Attempts remaining: Unlock interface controls for adjustments
    else {
      setTimeout(() => {
        sessionState.currentState = "IDLE";
        DOM.submitBtn.classList.remove("is-locked");
        DOM.skipBtn.classList.remove("is-locked");

        if (sessionState.playCount < sessionState.maxPlays) {
          DOM.replayBtn.classList.remove("is-locked");
        }
      }, 2000);
    }
  }
}

/**
 * Victory Promotion Screen Modal Injector
 * Builds, animates, and handles level transition prompts.
 * * @param {number} targetLevelId - Next progression target level index.
 */
function triggerCelebrationModal(targetLevelId) {
  const overlay = document.createElement("div");
  overlay.className = "celebration-overlay";

  const modal = document.createElement("div");
  modal.className = "celebration-modal";

  let titleText = `Level ${sessionState.currentLevel} Mastered! 🚀`;
  let subText = `Sensational ear tracking.<br>Ready to unlock Level ${targetLevelId}?`;
  let actionText = "Onwards! →";

  // Game completion configuration check
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

  // NATIVE WORKAROUND: Force an immediate layout height reflow check.
  // Forces mobile engines to register scale(0.7) before running the scale(1) transition.
  void overlay.offsetHeight;

  overlay.classList.add("is-active");
  fireMasteryConfetti();
}

// ==========================================
// 7b. ONBOARDING TOUR PROCEDURAL CONTROLLERS
// ==========================================
function startGuidedTour() {
  document.getElementById("ui-tour-prompt").classList.add("is-hidden");

  const tooltipContainer = document.getElementById("ui-tour-tooltip");
  tooltipContainer.classList.remove("is-hidden");

  activeTourSteps = compileTourSequence();
  tourCurrentStepIndex = 0;

  window.addEventListener("click", handleGlobalTourProgression);
  window.addEventListener("keydown", handleGlobalTourKeydown);

  executeTourStepPass();
}

function executeTourStepPass() {
  document.querySelectorAll(".tour-highlight-active").forEach((el) => {
    el.classList.remove("tour-highlight-active");
  });

  const tourOverlayElement = document.getElementById("ui-tour");
  const tooltipBox = document.getElementById("ui-tour-tooltip");
  const textBox = document.getElementById("ui-tour-text");

  if (tourCurrentStepIndex >= activeTourSteps.length) {
    tooltipBox.classList.add("is-hidden");
    tourOverlayElement.classList.add("is-hidden");

    window.removeEventListener("click", handleGlobalTourProgression);
    window.removeEventListener("keydown", handleGlobalTourKeydown);

    localStorage.setItem("solfaic_onboarded_matrix", "true");
    triggerTourCompletionModal();
    return;
  }

  // Drop opacity to 0 instantly to hide position-swapping jumps from view
  tooltipBox.removeAttribute("style");
  tooltipBox.style.opacity = "0";

  const currentStep = activeTourSteps[tourCurrentStepIndex];
  const targetElement = document.getElementById(currentStep.elementId);

  textBox.innerHTML = currentStep.text;

  if (targetElement) {
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      targetElement.classList.add("tour-highlight-active");

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipWidth = 320;

      tooltipBox.classList.remove("is-mobile-top", "is-mobile-bottom");

      tooltipBox.style.display = "block";
      const tooltipHeight = tooltipBox.offsetHeight;

      const isMobile = window.innerWidth < 1024;

      if (isMobile) {
        if (currentStep.mobilePosition === "top") {
          tooltipBox.classList.add("is-mobile-top");
        } else {
          tooltipBox.classList.add("is-mobile-bottom");
        }
      } else {
        let computedLeft = 0;
        let computedTop = 0;

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
          computedTop = targetRect.bottom + window.scrollY + 16;

          if (targetRect.bottom + tooltipHeight + 40 > window.innerHeight) {
            computedTop = targetRect.top + window.scrollY - tooltipHeight - 16;
          }
        }

        tooltipBox.style.left = `${computedLeft}px`;
        tooltipBox.style.top = `${computedTop}px`;
      }

      tourOverlayElement.style.alignItems = "flex-start";
      tourOverlayElement.style.justifyContent = "flex-start";

      // Hardware-accelerated fade-in once alignment coordinates match perfectly
      tooltipBox.style.opacity = "1";
    }, 320);
  } else {
    tourOverlayElement.style.alignItems = "center";
    tourOverlayElement.style.justifyContent = "center";
    tooltipBox.style.position = "static";
    tooltipBox.style.opacity = "1";
  }
}

function terminateTourImmediately() {
  document.getElementById("ui-tour").classList.add("is-hidden");
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
    setTimeout(() => {
      overlay.remove();
    }, 300);
  });

  modal.appendChild(btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  void overlay.offsetHeight;
  overlay.classList.add("is-active");
}

function handleGlobalTourProgression() {
  tourCurrentStepIndex++;
  executeTourStepPass();
}

function handleGlobalTourKeydown(e) {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    tourCurrentStepIndex++;
    executeTourStepPass();
  }
}

// ==========================================
// 8. AUDIO ENGINE (Tone.js Integration)
// ==========================================

/**
 * Audio Synthesis Tracking Object
 * Manages Tone.js polyphonic synthesis structures and metronome timeline scheduling.
 */
const AudioEngine = {
  synth: null,
  chime: null,
  isInitialized: false,

  /**
   * Sound Architecture Initializer
   * Wakes up underlying oscillators on user gesture interactions to satisfy browser security specs.
   */
  async init() {
    if (this.isInitialized) return;
    await Tone.start();

    // Configure main sequence rhythm generator synth wave outputs
    this.synth = new Tone.Synth({
      oscillator: { type: "triangle" }, // Warm triangle wave focus profile
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.1 },
    }).toDestination();

    // Configure structural high-register metronome counting sound wave outputs
    this.chime = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.5 },
    }).toDestination();

    Tone.Transport.bpm.value = 85;
    this.isInitialized = true;
  },

  /**
   * Sequence Timeline Playback Engine
   * Schedules audio execution arrays, handles count-in indicators, and coordinates pulses.
   */
  async playSequence() {
    if (sessionState.currentState === "PLAYING") return;
    if (sessionState.playCount >= sessionState.maxPlays) {
      alert("You are out of plays! Give it your best guess.");
      return;
    }

    await this.init();
    sessionState.currentState = "PLAYING";
    sessionState.playCount++;

    DOM.replayBtn.classList.add("is-locked");
    DOM.playsRemaining.innerText = `Plays remaining: ${sessionState.maxPlays - sessionState.playCount} / ${sessionState.maxPlays}`;

    // Clear transport engines to ensure clean playback starts
    Tone.Transport.cancel();
    Tone.Transport.stop();

    const [num, den] = sessionState.activeConfig.metre.split("/");
    Tone.Transport.timeSignature = [parseInt(num), parseInt(den)];

    const playableEvents = [];
    let currentTime = Tone.Time("1m").toSeconds(); // Allocate exactly 1 bar space buffer for count-ins

    // Parse timelines and build flat audio event scheduling tracks
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

    // Build the Tone.Part array scheduling track mapper
    const part = new Tone.Part((time, event) => {
      const noteToPlay = event.pitch ? event.pitch : "G3";

      // CRITICAL LOGIC: Convert duration mappings to seconds and trim bounds to 82%.
      // Injects a standard articulation separation gap so notes don't bleed together.
      const soundingDuration = Tone.Time(event.duration).toSeconds() * 0.82;
      this.synth.triggerAttackRelease(noteToPlay, soundingDuration, time);
    }, playableEvents);

    part.start(0);

    // Build visual counting backdrop overlay panel elements
    const modal = document.createElement("div");
    modal.style.cssText =
      "position:absolute; inset:0; background:rgba(255,255,255,0.85); backdrop-filter: blur(4px); z-index:100; display:flex; justify-content:center; align-items:center; font-size:6rem; font-weight:900; border-radius: 12px;";
    DOM.workspace.style.position = "relative";
    DOM.workspace.appendChild(modal);

    const ticks = sessionState.activeConfig.ticksPerBar;
    const beatSpacing = sessionState.activeConfig.metre.includes("8")
      ? Tone.Time("4n.").toSeconds()
      : Tone.Time("4n").toSeconds();

    // Schedule 1-bar count-in audio signals and text updates
    for (let i = 0; i < ticks; i++) {
      Tone.Transport.schedule((time) => {
        this.chime.triggerAttackRelease("C6", "16n", time);
        Tone.Draw.schedule(() => {
          modal.innerText = i + 1;
        }, time);
      }, i * beatSpacing);
    }

    // Clear counting backdrop modal panel when sequence starts playing
    Tone.Transport.schedule((time) => {
      Tone.Draw.schedule(() => modal.remove(), time);
    }, Tone.Time("1m").toSeconds());

    // Schedule real-time rhythmic heartbeat pulses for the workspace bars
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
              setTimeout(() => {
                barElements[bar].classList.remove("is-metronome-pulse");
              }, 300);
            }
          }, time);
        }, timeOffset);
      }
    }

    // Initialize playback loops
    const stopTimeInSeconds = Tone.Time(`${totalBars + 1}m`).toSeconds();
    Tone.Transport.start();

    // Schedule auto-stop boundaries to clear locks safely
    setTimeout(
      () => {
        Tone.Transport.stop();
        sessionState.currentState = "IDLE";
        if (sessionState.playCount < sessionState.maxPlays)
          DOM.replayBtn.classList.remove("is-locked");
      },
      stopTimeInSeconds * 1000 + 500,
    );
  },
};

/**
 * Mastery Confetti Generation Controller
 * Creates a staggered particle storm across the viewport using CSS transition properties.
 */
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

    // Randomize structural depth scale factors
    const size = Math.floor(Math.random() * 10) + 6;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Stagger particle release delays up to 1.5s for a sustained tumbling effect
    const delay = Math.random() * 1.5;
    particle.style.animationDelay = `${delay}s`;

    // Compute individualized vector drift distances and flight metrics
    const xDrift = (Math.random() - 0.5) * 1000;
    const yDrop = Math.random() * 500 + 250;
    const rotation = Math.random() * 1080 - 540;

    // Map metrics to token variables accessible by CSS transition sheets
    particle.style.setProperty("--x-drift", `${xDrift}px`);
    particle.style.setProperty("--y-drop", `${yDrop}px`);
    particle.style.setProperty("--rotation", `${rotation}deg`);

    document.body.appendChild(particle);

    // Clear elements safely after they exit visual view borders
    setTimeout(() => particle.remove(), 5500);
  }
}

// ==========================================
// BOOT UP THE APP
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  DOM.submitBtn.addEventListener("click", evaluateSubmission);
  DOM.skipBtn.addEventListener("click", () =>
    startLevel(sessionState.currentLevel),
  );
  DOM.replayBtn.addEventListener("click", () => AudioEngine.playSequence());

  const sidebarElement = document.getElementById("ui-sidebar");
  const toggleBtn = document.getElementById("btn-toggle-sidebar");
  const closeBtn = document.getElementById("btn-close-sidebar");

  if (toggleBtn && sidebarElement) {
    toggleBtn.addEventListener("click", () =>
      sidebarElement.classList.add("is-open"),
    );
  }
  if (closeBtn && sidebarElement) {
    closeBtn.addEventListener("click", () =>
      sidebarElement.classList.remove("is-open"),
    );
  }

  // --- NEW: ONBOARDING TOUR WIZARD ROUTINE LISTENERS ---
  const tourOverlay = document.getElementById("ui-tour");
  const tourBtnYes = document.getElementById("btn-tour-yes");
  const tourBtnNo = document.getElementById("btn-tour-no");

  if (tourBtnYes) {
    tourBtnYes.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevents choice-click from bubbling up to the window instantly and skipping step 1
      startGuidedTour();
    });
  }

  if (tourBtnNo) {
    tourBtnNo.addEventListener("click", (e) => {
      e.stopPropagation();
      terminateTourImmediately();
    });
  }

  // Verification Check: Wake overlay matrix up if storage key string is missing
  const isAlreadyOnboarded = localStorage.getItem("solfaic_onboarded_matrix");
  if (!isAlreadyOnboarded && tourOverlay) {
    tourOverlay.classList.remove("is-hidden");
  }

  // Launch Level 1 entry point on boot
  startLevel(1);
});

console.log("Solfaic! App Initialised.");
