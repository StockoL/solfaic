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
import {
  generateRhythmTimeline,
  evaluateSubmission,
  insertMotif,
  clearMotif,
} from "./engine.js";
import {
  DOM,
  renderWorkspace,
  renderMotifReel,
  renderStreakTracker,
  renderMeta,
  syncLevelDropdown,
  lockUI,
  unlockUI,
  triggerCelebrationModal,
  triggerIncompleteBoardFeedback,
  initialiseCoreUI,
  closeVignette,
  startGuidedTour,
  terminateTourImmediately,
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
  renderMotifReel(config.allowedMotifs);
  renderStreakTracker(sessionState.streak);
  renderMeta(sessionState);
  syncLevelDropdown(levelId);

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

      // Block submission early if the board still has empty holes —
      // shake the bars and halo-pulse the empty slots instead of evaluating.
      if (sessionState.userSubmission.includes(null)) {
        triggerIncompleteBoardFeedback();
        sessionState.currentState = "IDLE";
        unlockUI();
        return;
      }

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

            // Remedial highlight — data-state driven so workspace.css can
            // style it with real tokens instead of hardcoded inline colours.
            document
              .querySelectorAll(".workspace-box:not([data-state='disabled'])")
              .forEach((box) => box.setAttribute("data-feedback", "corrected"));

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
    DOM.replayBtn.addEventListener("click", async () => {
      if (sessionState.currentState === "PLAYING") return;
      if (sessionState.playCount >= sessionState.maxPlays) {
        alert("You are out of plays! Give it your best guess.");
        return;
      }

      // Lock immediately on click, BEFORE awaiting Tone's async init — this
      // is the exact fix from the V1 "Audio-Lock Race Condition" bug log.
      sessionState.currentState = "PLAYING";
      sessionState.playCount++;
      DOM.replayBtn.classList.add("is-locked");
      renderMeta(sessionState);

      // AudioEngine remains decoupled from the DOM/state; we pass it what it
      // needs and use the Promise it returns to know when playback finished.
      await AudioEngine.playSequence(
        sessionState.targetTimeline,
        sessionState.activeConfig,
        sessionState,
      );

      sessionState.currentState = "IDLE";
      if (sessionState.playCount < sessionState.maxPlays) {
        DOM.replayBtn.classList.remove("is-locked");
      }
    });
  }

  // --- WORKSPACE INTERACTIONS: Placing, targeting, and clearing notes ---
  // (Dispatched as bubbling CustomEvents from core.js, so we catch them here
  // rather than attaching per-card listeners from the Conductor.)

  document.addEventListener("action-target-slot", (e) => {
    const { index } = e.detail;
    // Tapping the already-targeted slot again de-selects it
    sessionState.selectedSlotIndex =
      sessionState.selectedSlotIndex === index ? null : index;
    renderWorkspace(sessionState);
  });

  document.addEventListener("action-select-motif", (e) => {
    const { motifId } = e.detail;

    // Tap-to-place: use the focused slot if one is selected (base workspace
    // tap, or editing via the vignette), otherwise fall back to the first
    // open slot so reel selection auto-populates left to right.
    let targetIndex = sessionState.selectedSlotIndex;
    if (targetIndex === null) {
      targetIndex = sessionState.userSubmission.findIndex(
        (slot) => slot === null,
      );
    }
    if (targetIndex === null || targetIndex === -1) return;

    let submission = sessionState.userSubmission;
    let states = sessionState.slotStates;

    // Replacing an already-filled slot: clear its old extension tokens
    // first, so a shorter motif (e.g. ta replacing ta-a) doesn't leave a
    // stale tied box behind.
    if (submission[targetIndex] !== null) {
      const cleared = clearMotif(
        submission,
        states,
        targetIndex,
        submission[targetIndex],
      );
      submission = cleared.newSubmission;
      states = cleared.newStates;
    }

    const { newSubmission, newStates } = insertMotif(
      submission,
      states,
      targetIndex,
      motifId,
    );
    sessionState.userSubmission = newSubmission;
    sessionState.slotStates = newStates;
    sessionState.selectedSlotIndex = null;
    renderWorkspace(sessionState);
    closeVignette();
  });

  document.addEventListener("action-clear-note", (e) => {
    const { index, motifId } = e.detail;
    const { newSubmission, newStates } = clearMotif(
      sessionState.userSubmission,
      sessionState.slotStates,
      index,
      motifId,
    );
    sessionState.userSubmission = newSubmission;
    sessionState.slotStates = newStates;
    sessionState.selectedSlotIndex = null;
    renderWorkspace(sessionState);
  });

  // --- ONBOARDING TOUR ---
  const tourTriggerBtn = document.getElementById("btn-trigger-onboarding");
  const tourYesBtn = document.getElementById("btn-tour-yes");
  const tourNoBtn = document.getElementById("btn-tour-no");
  const tourOverlay = document.getElementById("ui-tour");
  const tourPromptCard = document.getElementById("ui-tour-prompt");

  if (tourTriggerBtn) {
    tourTriggerBtn.addEventListener("click", () => {
      tourOverlay?.classList.remove("is-hidden");
      tourPromptCard?.classList.remove("is-hidden");
    });
  }
  if (tourYesBtn) tourYesBtn.addEventListener("click", startGuidedTour);
  if (tourNoBtn) {
    tourNoBtn.addEventListener("click", () => terminateTourImmediately());
  }
}

// ============================================================================
// BOOTSTRAP PIPELINE
// ============================================================================

window.addEventListener("DOMContentLoaded", () => {
  // initialiseCoreUI() wires up chrome shared by every page (nav, accordion,
  // level-select, compliance modals). Everything below it is the Practice
  // Room engine itself, which only has DOM to attach to on practice.html.
  initialiseCoreUI();

  if (DOM.workspace) {
    initialiseEventListeners();
    startLevel(1);
    console.log("Solfaic! Conductor Active. 🚀");
  }
});
