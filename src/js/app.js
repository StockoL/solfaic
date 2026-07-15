/**
 * ============================================================================
 * SOLFAIC - The Conductor (Application Entry Point)
 * ============================================================================
 * This module acts as the master orchestrator. It imports the part-books
 * (modules), listens to the user (via the DOM), and cues the engine and view.
 * It strictly adheres to the Separation of Concerns: it contains no business
 * logic or direct DOM manipulation itself.
 * ============================================================================
 */

import { sessionState } from "./state.js";
import { generateRhythmTimeline, evaluateSubmission } from "./engine.js";
import {
  DOM,
  renderWorkspace,
  renderStreakTracker,
  lockUI,
  unlockUI,
  triggerCelebrationModal,
} from "./core.js";
import { AudioEngine } from "./audio.js";

/**
 * Bootstraps a new round. Generates data, clears previous UI elements, and requests a render.
 * @param {number} levelId - Target level integer.
 */
export function startLevel(levelId) {
  sessionState.currentLevel = levelId;
  sessionState.playCount = 0;
  sessionState.currentState = "IDLE";
  sessionState.selectedSlotIndex = null;

  // 1. The Conductor asks the Engine to calculate the new musical timeline
  const { timeline, config } = generateRhythmTimeline(levelId);
  sessionState.targetTimeline = timeline;
  sessionState.activeConfig = config;

  // 2. Reset submission arrays to empty nulls matching the level's total ticks
  const totalSlots = config.bars * config.ticksPerBar;
  sessionState.userSubmission = Array(totalSlots).fill(null);
  sessionState.slotStates = Array(totalSlots).fill("idle");

  // 3. The Conductor tells the View to paint the stage
  unlockUI();
  renderWorkspace(sessionState);
  renderStreakTracker(sessionState.streak);

  console.log(
    `[Conductor] Level ${levelId} Initialised. Streak: ${sessionState.streak}/3`,
  );
}

/**
 * Global Event Routing
 * We attach application-critical listeners to the cached DOM elements exported by core.js.
 */
function initialiseEventListeners() {
  // --- SUBMIT BUTTON: Evaluates the user's answer ---
  if (DOM.submitBtn) {
    DOM.submitBtn.addEventListener("click", () => {
      // Prevent rapid double-clicks
      if (sessionState.currentState === "PLAYING") return;

      // Lock the stage to prevent interference during verification
      sessionState.currentState = "PLAYING";
      lockUI();

      // Ask the Engine for the mathematical truth (Pure Function)
      const result = evaluateSubmission(
        sessionState.userSubmission,
        sessionState.targetTimeline,
      );

      // Update the Master Score (State)
      sessionState.slotStates = result.newSlotStates;

      // Paint the initial validation feedback
      renderWorkspace(sessionState);

      // Handle pedagogical progression routing
      if (result.isCorrect) {
        sessionState.streak++;
        renderStreakTracker(sessionState.streak);

        setTimeout(() => {
          if (sessionState.streak >= 3) {
            sessionState.streak = 0;
            // Pass startLevel as a callback to prevent circular imports in core.js
            triggerCelebrationModal(sessionState.currentLevel + 1, startLevel);
          } else {
            startLevel(sessionState.currentLevel); // Load next round
          }
        }, 1000);
      } else {
        sessionState.streak = 0; // Wipe streak on error
        renderStreakTracker(sessionState.streak);

        if (sessionState.playCount >= sessionState.maxPlays) {
          // Out of plays: Show the correction sequence automatically
          setTimeout(() => {
            sessionState.userSubmission = [...result.flatTarget];
            sessionState.slotStates = Array(result.flatTarget.length).fill(
              "idle",
            );
            renderWorkspace(sessionState);

            // Remedial visual override
            const correctedCards = document.querySelectorAll(".workspace-card");
            correctedCards.forEach((card) => {
              card.style.borderColor = "#3b82f6";
              card.style.backgroundColor = "#eff6ff";
            });

            setTimeout(() => startLevel(sessionState.currentLevel), 4000);
          }, 1500);
        } else {
          // Plays remaining: Unlock UI for another attempt
          setTimeout(() => {
            sessionState.currentState = "IDLE";
            unlockUI();
          }, 2000);
        }
      }
    });
  }

  // --- REPLAY BUTTON: Triggers the Audio Engine ---
  if (DOM.replayBtn) {
    DOM.replayBtn.addEventListener("click", () => {
      // AudioEngine remains decoupled from the DOM. We pass it the state it needs.
      AudioEngine.playSequence(
        sessionState.targetTimeline,
        sessionState.activeConfig,
        sessionState,
      );
    });
  }
}

document.addEventListener("action-clear-note", (e) => {
  // e.detail.index contains the array index!
  clearMultiBeatNote(e.detail.index, e.detail.motifId);
});

// ============================================================================
// BOOTSTRAP PIPELINE
// ============================================================================

window.addEventListener("DOMContentLoaded", () => {
  initialiseEventListeners();
  startLevel(1);
  console.log("Solfaic! Conductor Active. 🚀");
});
