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
const sessionState = {
  currentLevel: 1,
  playCount: 0,
  streak: 0,
  maxPlays: 3,
  activeConfig: null,
  targetTimeline: [],
  userSubmission: [],
  slotStates: [],
  selectedSlotIndex: null,
  currentState: "IDLE",
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
  skipBtn: document.getElementById("btn-skip"),
};

// ==========================================
// 4. RHYTHM GENERATOR (The Core Logic)
// ==========================================
function generateRhythmTimeline(levelId) {
  const rules = levelRules[levelId];
  if (!rules) return [];

  const chosenMetre =
    rules.allowedMetres[Math.floor(Math.random() * rules.allowedMetres.length)];
  const barCount =
    rules.barOptions[Math.floor(Math.random() * rules.barOptions.length)];

  let metreType = "simple";
  let ticksPerBar = 4;

  if (chosenMetre === "4/4") ticksPerBar = 4;
  if (chosenMetre === "3/4") ticksPerBar = 3;
  if (chosenMetre === "2/4") ticksPerBar = 2;
  if (chosenMetre === "6/8") {
    metreType = "compound";
    ticksPerBar = 2;
  }

  const totalTicks = barCount * ticksPerBar;
  const validMotifsForRound =
    metreType === "simple" ? rules.simpleMotifs : rules.compoundMotifs;

  sessionState.activeConfig = {
    metre: chosenMetre,
    bars: barCount,
    totalTicks: totalTicks,
    ticksPerBar: ticksPerBar,
    allowedMotifs: validMotifsForRound,
  };

  const timeline = [];
  let currentTicks = 0;

  while (currentTicks < totalTicks) {
    const remainingTicks = totalTicks - currentTicks;
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

function startLevel(levelId) {
  sessionState.currentLevel = levelId;
  sessionState.playCount = 0;
  sessionState.currentState = "IDLE";
  sessionState.selectedSlotIndex = null;

  sessionState.targetTimeline = generateRhythmTimeline(levelId);
  const config = sessionState.activeConfig;

  sessionState.userSubmission = Array(config.bars * config.ticksPerBar).fill(
    null,
  );
  sessionState.slotStates = Array(config.bars * config.ticksPerBar).fill(
    "idle",
  );

  DOM.submitBtn.classList.remove("is-locked");
  DOM.skipBtn.classList.remove("is-locked");
  DOM.replayBtn.classList.remove("is-locked");

  DOM.levelBadge.innerText = `Level ${levelId}`;
  DOM.metreDisplay.innerText = `Metre: ${config.metre}`;
  DOM.barsDisplay.innerText = `Bars: ${config.bars}`;
  DOM.playsRemaining.innerText = `Plays remaining: ${sessionState.maxPlays} / ${sessionState.maxPlays}`;

  renderStreakTracker();

  DOM.workspace.innerHTML = "";
  DOM.motifSelector.innerHTML = "";

  config.allowedMotifs.forEach((motifId) => {
    const motifData = MOTIF_LIBRARY[motifId];
    const btn = document.createElement("button");
    btn.className = "motif-pad";

    if (motifData.svg) {
      btn.innerHTML = `<div class="svg-container">${motifData.svg}</div> ${motifData.label}`;
    } else {
      btn.innerHTML = `<span class="music-font">${motifData.symbol}</span> ${motifData.label}`;
    }

    btn.setAttribute("draggable", "true");
    btn.addEventListener("dragstart", (e) => {
      if (sessionState.currentState === "PLAYING") {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData("text/plain", motifId);
    });

    btn.addEventListener("click", () => {
      if (sessionState.currentState === "PLAYING") return;

      let targetIndex = sessionState.selectedSlotIndex;
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

function renderWorkspace() {
  DOM.workspace.innerHTML = "";
  const config = sessionState.activeConfig;

  const bars = [];
  for (let i = 0; i < config.bars; i++) {
    const barDiv = document.createElement("div");
    barDiv.className = "workspace-bar";
    bars.push(barDiv);
    DOM.workspace.appendChild(barDiv);
  }

  sessionState.userSubmission.forEach((token, index) => {
    const currentBarIndex = Math.floor(index / config.ticksPerBar);

    if (currentBarIndex < bars.length) {
      const card = document.createElement("div");

      if (sessionState.slotStates[index] === "success") {
        card.classList.add("is-success");
      } else if (sessionState.slotStates[index] === "error") {
        card.classList.add("is-error");
      }

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

      if (token === null) {
        card.className += " workspace-card is-placeholder";
        card.innerHTML = `<div class="svg-container">•</div>`;
        card.title = "Tap to highlight target, or drag note here";

        if (index === sessionState.selectedSlotIndex) {
          card.classList.add("is-targeted");
        }

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          sessionState.selectedSlotIndex = index;
          renderWorkspace();
        });
      } else if (token.endsWith("_ext")) {
        const rootId = token.replace("_ext", "");
        card.className += " workspace-card is-extension";
        card.innerHTML = `<div class="svg-container" style="font-size: 1.5rem; color: var(--color-text-muted); font-weight:800;">—</div>`;
        card.title = "Click to clear this structural note";

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          clearMultiBeatNote(index, rootId);
        });
      } else {
        const motifData = MOTIF_LIBRARY[token];
        card.className += " workspace-card";
        if (motifData && motifData.svg) {
          card.innerHTML = `<div class="svg-container">${motifData.svg}</div>`;
        } else {
          card.innerHTML = `<div class="svg-container">${token}</div>`;
        }
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

function insertMotifAt(index, motifId) {
  const duration = MOTIF_LIBRARY[motifId].ticks || 1;

  if (index + duration <= sessionState.userSubmission.length) {
    for (let i = 0; i < duration; i++) {
      const existingToken = sessionState.userSubmission[index + i];
      if (existingToken) {
        const rootId = existingToken.replace("_ext", "");
        clearMultiBeatNote(index + i, rootId);
      }
    }

    sessionState.userSubmission[index] = motifId;
    sessionState.slotStates[index] = "idle";

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

function clearMultiBeatNote(index, motifId) {
  const duration = MOTIF_LIBRARY[motifId].ticks || 1;
  let startIndex = index;

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

function handleMotifClick(motifId) {
  if (sessionState.currentState === "PLAYING") return;
}

// ==========================================
// 7. EVALUATION LOGIC & POP-UP INJECTOR
// ==========================================
function evaluateSubmission() {
  if (sessionState.currentState === "PLAYING") return;

  const config = sessionState.activeConfig;

  // FIX: Deprecated native alert banner for a physical horizontal microgesture
  if (sessionState.userSubmission.includes(null)) {
    // 1. Inject the horizontal shake curve into the main slate
    DOM.workspace.classList.add("is-shaking");

    // 2. Query and highlight all structural empty placeholders instantly
    const missingSlots = DOM.workspace.querySelectorAll(
      ".workspace-card.is-placeholder",
    );
    missingSlots.forEach((card) => card.classList.add("is-empty-panic"));

    // 3. Clear modifiers cleanly after the animation finishes so it can be re-triggered
    setTimeout(() => {
      DOM.workspace.classList.remove("is-shaking");
      missingSlots.forEach((card) => card.classList.remove("is-empty-panic"));
    }, 450);

    return;
  }

  sessionState.currentState = "PLAYING";

  DOM.submitBtn.classList.add("is-locked");
  DOM.skipBtn.classList.add("is-locked");
  DOM.replayBtn.classList.add("is-locked");

  const flatTarget = [];
  sessionState.targetTimeline.forEach((event) => {
    const duration = MOTIF_LIBRARY[event.motifId].ticks || 1;
    flatTarget.push(event.motifId);
    for (let i = 1; i < duration; i++) {
      flatTarget.push(`${event.motifId}_ext`);
    }
  });

  let isCorrect = true;

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

  if (isCorrect) {
    sessionState.streak++;
    renderStreakTracker();

    setTimeout(() => {
      if (sessionState.streak >= 3) {
        sessionState.streak = 0;
        const nextLevel = sessionState.currentLevel + 1;
        triggerCelebrationModal(nextLevel);
      } else {
        startLevel(sessionState.currentLevel);
      }
    }, 1000);
  } else {
    sessionState.streak = 0;
    renderStreakTracker();

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
    } else {
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
      if (targetLevelId <= 3) {
        startLevel(targetLevelId);
      } else {
        startLevel(1);
      }
    }, 300);
  });

  modal.appendChild(btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add("is-active");
    fireMasteryConfetti();
  }, 50);
}

// ==========================================
// 8. AUDIO ENGINE (Tone.js Integration)
// ==========================================
const AudioEngine = {
  synth: null,
  chime: null,
  isInitialized: false,

  async init() {
    if (this.isInitialized) return;
    await Tone.start();

    this.synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.1 },
    }).toDestination();

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

    await this.init();
    sessionState.currentState = "PLAYING";
    sessionState.playCount++;

    DOM.replayBtn.classList.add("is-locked");
    DOM.playsRemaining.innerText = `Plays remaining: ${sessionState.maxPlays - sessionState.playCount} / ${sessionState.maxPlays}`;

    Tone.Transport.cancel();
    Tone.Transport.stop();

    const [num, den] = sessionState.activeConfig.metre.split("/");
    Tone.Transport.timeSignature = [parseInt(num), parseInt(den)];

    const playableEvents = [];
    let currentTime = Tone.Time("1m").toSeconds();

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

      // CRITICAL: Convert string musical notation to seconds and trim to 82%
      // This injects a standard articulation gap for crisp metric delineation.
      const soundingDuration = Tone.Time(event.duration).toSeconds() * 0.82;

      this.synth.triggerAttackRelease(noteToPlay, soundingDuration, time);
    }, playableEvents);

    part.start(0);

    const modal = document.createElement("div");
    modal.style.cssText =
      "position:absolute; inset:0; background:rgba(255,255,255,0.85); backdrop-filter: blur(4px); z-index:100; display:flex; justify-content:center; align-items:center; font-size:6rem; font-weight:900; border-radius: 12px;";
    DOM.workspace.style.position = "relative";
    DOM.workspace.appendChild(modal);

    const ticks = sessionState.activeConfig.ticksPerBar;
    const beatSpacing = sessionState.activeConfig.metre.includes("8")
      ? Tone.Time("4n.").toSeconds()
      : Tone.Time("4n").toSeconds();

    for (let i = 0; i < ticks; i++) {
      Tone.Transport.schedule((time) => {
        this.chime.triggerAttackRelease("C6", "16n", time);
        Tone.Draw.schedule(() => {
          modal.innerText = i + 1;
        }, time);
      }, i * beatSpacing);
    }

    Tone.Transport.schedule((time) => {
      Tone.Draw.schedule(() => modal.remove(), time);
    }, Tone.Time("1m").toSeconds());

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

    const stopTimeInSeconds = Tone.Time(`${totalBars + 1}m`).toSeconds();
    Tone.Transport.start();

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

// Whimsical Reward System: Cinematic, Long-Lasting Confetti Downpour
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

    // NEW: Staggers the release of the particles (up to 1.5 seconds delay)
    // This creates a sustained, tumbling rain effect instead of a single sudden pop
    const delay = Math.random() * 1.5;
    particle.style.animationDelay = `${delay}s`;

    const xDrift = (Math.random() - 0.5) * 1000;
    const yDrop = Math.random() * 500 + 250; // Increased fall distance slightly
    const rotation = Math.random() * 1080 - 540;

    particle.style.setProperty("--x-drift", `${xDrift}px`);
    particle.style.setProperty("--y-drop", `${yDrop}px`);
    particle.style.setProperty("--rotation", `${rotation}deg`);

    document.body.appendChild(particle);

    // UPGRADED: Extended lifecycle boundary to match the new 4-second flight + delay runway
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

  startLevel(1);
});

console.log("Solfaic! App Initialised.");
