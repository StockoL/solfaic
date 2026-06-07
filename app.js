/**
 * SOLFAIC! - Rhythm Dictation MVP
 * Core Architecture: Data Model, State Machine, and UI Controller (Foundational)
 */

// ==========================================
// 1. DATA MODEL (Configuration & Rules)
// ==========================================

/**
 * SVG Library for pixel-perfect notation rendering.
 * Keys have been strictly refactored to use Kodaly terminology.
 */
const SVG_ICONS = {
  // Simple Time Basics
  ta: `<svg viewBox="0 0 40 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/></svg>`,
  titi: `<svg viewBox="0 0 80 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="64" cy="85" rx="12" ry="8" transform="rotate(-20 64 85)"/><rect x="72" y="15" width="3" height="70"/><rect x="22" y="15" width="53" height="8"/></svg>`,
  taRest: `<svg viewBox="0 0 40 100" width="100%" height="100%" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 25 20 L 15 40 L 30 55 L 15 80" fill="none"/></svg>`,
  taa: `<svg viewBox="0 0 40 100" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="3"><ellipse cx="14" cy="85" rx="10" ry="7" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70" fill="currentColor" stroke="none"/></svg>`,

  // Simple Time Semiquavers (Level 3)
  tikatika: `<svg viewBox="0 0 160 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><ellipse cx="134" cy="85" rx="12" ry="8" transform="rotate(-20 134 85)"/><rect x="142" y="15" width="3" height="70"/><rect x="22" y="15" width="123" height="8"/><rect x="22" y="27" width="123" height="8"/></svg>`,
  tikati: `<svg viewBox="0 0 120 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><rect x="22" y="15" width="83" height="8"/><rect x="22" y="27" width="43" height="8"/></svg>`,
  titika: `<svg viewBox="0 0 120 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><rect x="22" y="15" width="83" height="8"/><rect x="62" y="27" width="43" height="8"/></svg>`,

  // Compound Time (Level 2/3)
  tai: `<svg viewBox="0 0 50 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><circle cx="40" cy="80" r="4"/></svg>`,
  tititi: `<svg viewBox="0 0 120 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="54" cy="85" rx="12" ry="8" transform="rotate(-20 54 85)"/><rect x="62" y="15" width="3" height="70"/><ellipse cx="94" cy="85" rx="12" ry="8" transform="rotate(-20 94 85)"/><rect x="102" y="15" width="3" height="70"/><rect x="22" y="15" width="83" height="8"/></svg>`,
  tati: `<svg viewBox="0 0 90 100" width="100%" height="100%" fill="currentColor"><ellipse cx="14" cy="85" rx="12" ry="8" transform="rotate(-20 14 85)"/><rect x="22" y="15" width="3" height="70"/><ellipse cx="64" cy="85" rx="12" ry="8" transform="rotate(-20 64 85)"/><rect x="72" y="15" width="3" height="70"/><path d="M 72 15 C 85 15 85 40 72 45 C 80 40 80 25 72 25 Z"/></svg>`,
  taiRest: `<svg viewBox="0 0 50 100" width="100%" height="100%" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 20 20 L 10 40 L 25 55 L 10 80" fill="none"/><circle cx="40" cy="55" r="3" stroke="none" fill="currentColor"/></svg>`,
};

const MOTIF_LIBRARY = {
  // --- SIMPLE TIME ---
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

  // --- COMPOUND TIME ---
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
 * Decoupled Pedagogical Levels
 * Simple and Compound motifs are strictly isolated to prevent metric cross-contamination.
 */
const levelRules = {
  1: {
    allowedMetres: ["2/4", "3/4", "4/4"],
    barOptions: [2],
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

  DOM.replayBtn.classList.remove("is-locked");

  // 4. Clear the workspace
  DOM.workspace.innerHTML = "";
  DOM.motifSelector.innerHTML = "";

  // 5. Dynamically generate the clickable buttons for the allowed motifs
  config.allowedMotifs.forEach((motifId) => {
    const motifData = MOTIF_LIBRARY[motifId];

    const btn = document.createElement("button");
    btn.className = "motif-pad";

    // Safely fallback to symbol if SVG isn't built yet
    if (motifData.svg) {
      btn.innerHTML = `<div class="svg-container">${motifData.svg}</div> ${motifData.label}`;
    } else {
      btn.innerHTML = `<span class="music-font">${motifData.symbol}</span> ${motifData.label}`;
    }

    btn.addEventListener("click", () => handleMotifClick(motifId));

    DOM.motifSelector.appendChild(btn);
  });

  console.log(
    `[Engine] Level ${levelId} Initialised. Metre: ${config.metre}. Target array generated.`,
  );
}

// ==========================================
// 5.5 UI RENDERING: WORKSPACE
// ==========================================
/**
 * Renders the workspace array to the DOM.
 * This ensures the UI is always perfectly synced with sessionState.userSubmission.
 */

function renderWorkspace() {
  DOM.workspace.innerHTML = ""; // Clear existing UI

  sessionState.userSubmission.forEach((motifId, index) => {
    const motifData = MOTIF_LIBRARY[motifId];
    const card = document.createElement("div");
    card.className = "workspace-card";

    card.innerHTML = `<div class="svg-container">${motifData.svg}</div>`;

    // UX Touch: Make it clear the card is interactive
    card.style.cursor = "pointer";
    card.title = "Click to remove";

    // --- The Click-to-Remove Listener ---
    card.addEventListener("click", () => {
      if (sessionState.currentState === "PLAYING") return;

      // Remove this exact item from the state array
      sessionState.userSubmission.splice(index, 1);

      // Re-render the visual workspace to reflect the change
      renderWorkspace();
    });

    DOM.workspace.appendChild(card);
  });
}

// ==========================================
// 6. INTERACTION LOGIC (Clicking Buttons)
// ==========================================
/**
 * Handles user clicks on motif buttons.
 * State-driven: Updates the memory array, then triggers a UI redraw.
 * @param {string} motifId - The ID of the motif that was clicked.
 */
function handleMotifClick(motifId) {
  // 1. Guard clause: don't allow clicks if audio is playing
  if (sessionState.currentState === "PLAYING") return;

  // 2. Update the internal memory (The Source of Truth)
  sessionState.userSubmission.push(motifId);

  // 3. Tell the View Controller to redraw the screen based on the new memory!
  renderWorkspace();
}

// ==========================================
// 7. EVALUATION ENGINE (Grading the User)
// ==========================================

function evaluateSubmission() {
  // Prevent evaluation if the app is busy playing audio
  if (sessionState.currentState === "PLAYING") return;

  const user = sessionState.userSubmission;
  const target = sessionState.targetTimeline;
  const workspaceCards = DOM.workspace.querySelectorAll(".workspace-card");

  // 1. Guard Clause: Did they submit enough beats?
  if (user.length !== target.length) {
    alert(
      `Sequence incomplete! The target has ${target.length} motifs, but you submitted ${user.length}.`,
    );
    return;
  }

  let isPerfect = true;

  // 2. Granular Checking: Compare item-by-item
  for (let i = 0; i < target.length; i++) {
    const card = workspaceCards[i];

    // Wipe previous visual states just in case
    card.classList.remove("is-success", "is-error");

    if (user[i] === target[i].motifId) {
      card.classList.add("is-success"); // Correct! Turn it green.
    } else {
      card.classList.add("is-error"); // Incorrect! Turn it red.
      isPerfect = false;
    }
  }

  // 3. State Routing: What happens next?
  if (isPerfect) {
    sessionState.streak++;
    DOM.streakTracker.innerText = `Streak: ${sessionState.streak} 🔥`;

    // Pause briefly so they can enjoy seeing the green, then advance
    setTimeout(() => {
      // Re-run the current level to generate a brand new sequence!
      startLevel(sessionState.currentLevel);
    }, 1500);
  } else {
    sessionState.streak = 0;
    DOM.streakTracker.innerText = `Streak: 0`;

    // Pause so they can read their mistakes, then clear the board to try again
    setTimeout(() => {
      DOM.workspace.innerHTML = "";
      sessionState.userSubmission = [];
    }, 2500);
  }
}

// ==========================================
// 8. AUDIO ENGINE (Tone.js Integration)
// ==========================================
const AudioEngine = {
  synth: null,
  isInitialized: false,

  /**
   * Browsers strictly block audio until a user interaction.
   * This initialises the Web Audio API on the first click.
   */
  async init() {
    if (this.isInitialized) return;
    await Tone.start();

    // We can use a MembraneSynth for rhythmic dictation (sounds like a drum/woodblock)
    this.synth = new Tone.MembraneSynth().toDestination();
    Tone.Transport.bpm.value = 85; // A solid pedagogical tempo for dictation

    this.isInitialized = true;
    console.log("[Audio] Tone.js Initialized");
  },

  /**
   * Reads the targetTimeline and schedules it into the audio context.
   */
  async playSequence() {
    // 1. Guard Clauses
    if (sessionState.currentState === "PLAYING") return;
    if (sessionState.playCount >= sessionState.maxPlays) {
      alert(
        "You are out of plays! Give it your best guess, or submit to see the answer.",
      );
      return;
    }

    // 2. Initialise Audio & Update State
    await this.init();
    sessionState.currentState = "PLAYING";
    sessionState.playCount++;

    DOM.replayBtn.classList.add("is-locked");
    DOM.playsRemaining.innerText = `Plays remaining: ${sessionState.maxPlays - sessionState.playCount} / ${sessionState.maxPlays}`;

    // 3. Clear the Transport (Wipe any old sequences)
    Tone.Transport.cancel();
    Tone.Transport.stop();

    // 4. Update the internal metronome to match the current level's metre
    const [num, den] = sessionState.activeConfig.metre.split("/");
    Tone.Transport.timeSignature = [parseInt(num), parseInt(den)];

    // 5. Map the target timeline, but START 1 BAR LATER to leave room for the count-in!
    const playableEvents = [];
    let currentTime = Tone.Time("1m").toSeconds(); // Shift cursor forward by 1 full measure

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
      const noteToPlay = event.pitch ? event.pitch : "C2"; // Low woodblock for dictation
      this.synth.triggerAttackRelease(noteToPlay, event.duration, time);
    }, playableEvents);

    part.start(0);

    // --- 5.5 NEW: THE VISUAL COUNT-IN MODAL ---
    const modal = document.createElement("div");
    // Styling the modal as a frosted-glass overlay
    modal.style.cssText =
      "position:absolute; inset:0; background:rgba(255,255,255,0.85); backdrop-filter: blur(4px); z-index:100; display:flex; justify-content:center; align-items:center; font-size:6rem; font-weight:900; color:var(--text-color); border-radius: 12px;";
    DOM.workspace.style.position = "relative";
    DOM.workspace.appendChild(modal);

    const ticks = sessionState.activeConfig.ticksPerBar;

    // Schedule the metronome clicks and visual numbers
    for (let i = 0; i < ticks; i++) {
      // Compound time beats are dotted, simple time beats are straight
      const beatSpacing = sessionState.activeConfig.metre.includes("8")
        ? Tone.Time("4n.").toSeconds()
        : Tone.Time("4n").toSeconds();
      const tickTime = i * beatSpacing;

      Tone.Transport.schedule((time) => {
        // Play a higher-pitched click for the metronome
        this.synth.triggerAttackRelease("G3", "16n", time);

        // Sync the DOM visual perfectly with the audio
        Tone.Draw.schedule(() => {
          modal.innerText = i + 1;
          // Slight CSS animation for a "pulse" effect
          modal.animate(
            [{ transform: "scale(1.2)" }, { transform: "scale(1)" }],
            { duration: 200 },
          );
        }, time);
      }, tickTime);
    }

    // Remove the modal right as the actual dictation begins (at 1 measure)
    Tone.Transport.schedule((time) => {
      Tone.Draw.schedule(() => {
        modal.remove();
      }, time);
    }, Tone.Time("1m").toSeconds());

    // 6. Calculate total duration (Original Bars + 1 Bar for the Count-In)
    const totalBars = sessionState.activeConfig.bars + 1;
    const stopTimeInSeconds = Tone.Time(`${totalBars}m`).toSeconds();

    // 7. Hit Play
    Tone.Transport.start();

    // 8. Cleanup and unlock UI when the sequence is over
    setTimeout(
      () => {
        Tone.Transport.stop();
        sessionState.currentState = "IDLE";

        if (sessionState.playCount < sessionState.maxPlays) {
          DOM.replayBtn.classList.remove("is-locked");
        }
      },
      stopTimeInSeconds * 1000 + 500,
    ); // Added 500ms buffer for the final note's decay tail
  },
};

// ==========================================
// BOOT UP THE APP
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  // Wire up the logic controllers
  DOM.submitBtn.addEventListener("click", evaluateSubmission);

  // Wire up the Audio Engine
  DOM.replayBtn.addEventListener("click", () => AudioEngine.playSequence());

  startLevel(1);
});

// ==========================================
// INITIALISATION / DEBUG
// ==========================================
console.log("Solfaic! App Initialised.");
console.log("Sample Generation (Level 1):", generateRhythmTimeline(1));
