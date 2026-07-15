import {
  SVG_ICONS,
  MOTIF_LIBRARY,
  MOTIF_POOLS,
  FORM_TEMPLATES,
  SYNTAX_DICTIONARY,
  levelRules,
  CADENCE_MOTIFS,
} from "./data.js";

// ============================================================================
// CORE LOGIC & EVALUATION
// ============================================================================

/**
 * Helper: Generates a single mathematically perfect bar of motifs.
 * @param {Array} allowedMotifs - Pool of valid motifs for the level.
 * @param {number} ticksPerBar - Total spatial cost of the bar.
 * @param {boolean} forceCadence - Interceptor flag to force a stable resolution.
 */

// The core processing loop executing Markov state selections
export function generateBarSequence(
  allowedMotifs,
  ticksPerBar,
  forceCadence = false,
) {
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
 * The Form router compiling phrases into timeline staves for Tone.js playback.
 */
export function generateRhythmTimeline(levelId) {
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

// The algorithmic index placement and retroactive data-sweeping validation logic
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
export function evaluateSubmission() {
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
// UI RENDERERS (The View Updates)
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

// ============================================================================
// BOOTSTRAP/INITIALISATION PIPELINE (DOM Content Loaded)
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
