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
  generatePitchLine,
  countSoundingNotes,
  evaluateSubmission,
  evaluatePitchSubmission,
  insertMotif,
  clearMotif,
  insertPitch,
  clearPitch,
} from "./engine.js";
import {
  DOM,
  renderWorkspace,
  renderMotifReel,
  renderSolfegeReel,
  renderStreakTracker,
  renderMeta,
  syncLevelDropdown,
  lockUI,
  unlockUI,
  triggerCelebrationModal,
  triggerIncompleteBoardFeedback,
  triggerWrongAnswerShake,
  showStartingNoteModal,
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
  sessionState.exercisePhase = "RHYTHM";

  // 1. The Conductor asks the Engine to calculate the new musical timeline
  const { timeline, config } = generateRhythmTimeline(levelId);
  sessionState.targetTimeline = timeline;
  sessionState.activeConfig = config;

  // 1b. ...and the matching solfège line, sung over that same timeline.
  const noteCount = countSoundingNotes(timeline);
  sessionState.targetPitchLine = generatePitchLine(levelId, noteCount);

  // 2. Reset submission arrays to empty nulls matching the level's total ticks
  const totalSlots = config.bars * config.ticksPerBar;
  sessionState.userSubmission = Array(totalSlots).fill(null);
  sessionState.slotStates = Array(totalSlots).fill("idle");

  // 2b. Same reset for the solfège submission, sized to the pitch line
  // instead of ticks — one slot per sounding note, not per beat.
  sessionState.pitchSubmission = Array(noteCount).fill(null);
  sessionState.pitchSlotStates = Array(noteCount).fill("idle");

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
 * Transitions a confirmed-correct rhythm exercise into its solfège pass —
 * the same targetTimeline/targetPitchLine, dictated again for a different
 * task. Deliberately does NOT call generateRhythmTimeline/generatePitchLine
 * again; that would silently swap the exercise out from under the student.
 */
export async function enterPitchPhase() {
  sessionState.exercisePhase = "PITCH";
  sessionState.playCount = 0;
  sessionState.currentState = "IDLE";
  sessionState.selectedSlotIndex = null;

  unlockUI();
  renderWorkspace(sessionState);
  renderSolfegeReel(sessionState.targetPitchLine.toneset);
  renderMeta(sessionState);

  // Starting Note modal — showModal() blocks interaction with the rest of
  // the page natively, so this happens before any count-in can start; the
  // "Continue" button (wired in core.js) is what actually kicks off the
  // first pitch-phase listen, via the action-starting-note-continue
  // listener below. Awaited (rather than fire-and-forget) so a first-ever
  // AudioContext resume can't race the caller's next step — the note
  // itself schedules and returns immediately either way, this is only
  // waiting on Tone's one-time init.
  const firstPitch = sessionState.targetPitchLine.pitches[0];
  showStartingNoteModal(firstPitch);
  await AudioEngine.playStartingNote(firstPitch, sessionState.targetPitchLine.tonic);

  console.log(
    `[Conductor] Entered PITCH phase. Streak: ${sessionState.streak}/3`,
  );
}

/**
 * The positions a validation pass marked wrong. Both phases' slot-state
 * arrays use the same "error" marker and are both positional, so one
 * helper covers rhythm ticks and pitch syllables alike — only the meaning
 * of the index differs (see triggerWrongAnswerShake in core.js).
 */
function findErrorIndices(slotStates) {
  const indices = [];
  slotStates.forEach((state, index) => {
    if (state === "error") indices.push(index);
  });
  return indices;
}

/**
 * Shared failure tail for both phases' submit handling — wipes the streak,
 * then either shows the correct answer once plays run out (applying it via
 * `applyCorrectAnswer`, phase-specific) before restarting the level, or
 * unlocks the UI for another attempt. Identical timing/DOM-marking either
 * way, only which submission array gets corrected differs.
 */
function handleFailedAttempt(applyCorrectAnswer, errorIndices) {
  triggerWrongAnswerShake(errorIndices);
  sessionState.streak = 0;
  renderStreakTracker(sessionState.streak);

  if (sessionState.playCount >= sessionState.maxPlays) {
    // Out of plays: Show the correction sequence automatically
    setTimeout(() => {
      applyCorrectAnswer();
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

/**
 * The actual "listen" action — locks state/UI, plays the full sequence via
 * AudioEngine, then unlocks. Shared by the Play button's own click handler
 * and the Starting Note modal's "Continue" button, which effectively
 * triggers the first pitch-phase listen once the student is ready rather
 * than requiring a separate first click on Play too.
 */
async function triggerReplay() {
  if (sessionState.currentState === "PLAYING") return;
  if (sessionState.playCount >= sessionState.maxPlays) {
    alert("You are out of plays! Give it your best guess.");
    return;
  }

  // Lock immediately on click, BEFORE awaiting Tone's async init — this
  // is the exact fix from the V1 "Audio-Lock Race Condition" bug log.
  sessionState.currentState = "PLAYING";
  sessionState.playCount++;
  DOM.replayBtn?.classList.add("is-locked");
  renderMeta(sessionState);

  // AudioEngine remains decoupled from the DOM/state; we pass it what it
  // needs and use the Promise it returns to know when playback finished.
  await AudioEngine.playSequence(
    sessionState.targetTimeline,
    sessionState.activeConfig,
    sessionState.targetPitchLine?.tonic,
    sessionState.targetPitchLine?.pitches,
  );

  sessionState.currentState = "IDLE";
  if (sessionState.playCount < sessionState.maxPlays) {
    DOM.replayBtn?.classList.remove("is-locked");
  }
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
      // Checks whichever submission is actually the active one for this
      // phase: userSubmission is already guaranteed full by the time
      // PITCH phase starts, so this has to look at pitchSubmission there
      // instead or it'd never catch an incomplete solfège board.
      const activeSubmission =
        sessionState.exercisePhase === "PITCH"
          ? sessionState.pitchSubmission
          : sessionState.userSubmission;

      if (activeSubmission.includes(null)) {
        triggerIncompleteBoardFeedback();
        sessionState.currentState = "IDLE";
        unlockUI();
        return;
      }

      if (sessionState.exercisePhase === "RHYTHM") {
        const result = evaluateSubmission(
          sessionState.userSubmission,
          sessionState.targetTimeline,
        );
        sessionState.slotStates = result.newSlotStates;
        renderWorkspace(sessionState);

        if (result.isCorrect) {
          // Rhythm confirmed — move to the solfège pass over the SAME
          // exercise rather than advancing the streak. The streak reflects
          // completing both phases, not rhythm alone.
          setTimeout(() => enterPitchPhase(), 1000);
        } else {
          handleFailedAttempt(() => {
            sessionState.userSubmission = [...result.flatTarget];
            sessionState.slotStates = Array(result.flatTarget.length).fill(
              "idle",
            );
          }, findErrorIndices(result.newSlotStates));
        }
      } else {
        // PITCH phase
        const result = evaluatePitchSubmission(
          sessionState.pitchSubmission,
          sessionState.targetPitchLine.pitches,
        );
        sessionState.pitchSlotStates = result.newPitchSlotStates;
        renderWorkspace(sessionState);

        if (result.isCorrect) {
          sessionState.streak++;
          renderStreakTracker(sessionState.streak);

          setTimeout(() => {
            if (sessionState.streak >= 3) {
              sessionState.streak = 0;
              // Pass startLevel as a callback to prevent circular imports in core.js
              triggerCelebrationModal(sessionState.currentLevel + 1, startLevel);
            } else {
              startLevel(sessionState.currentLevel); // Load next round (fresh rhythm + pitch)
            }
          }, 1000);
        } else {
          handleFailedAttempt(() => {
            const target = sessionState.targetPitchLine.pitches;
            sessionState.pitchSubmission = [...target];
            sessionState.pitchSlotStates = Array(target.length).fill("idle");
          }, findErrorIndices(result.newPitchSlotStates));
        }
      }
    });
  }

  // --- REPLAY BUTTON: Triggers the Audio Engine ---
  if (DOM.replayBtn) {
    DOM.replayBtn.addEventListener("click", () => triggerReplay());
  }

  // Starting Note modal's Continue button (core.js closes the dialog and
  // dispatches this) — starts the first pitch-phase listen immediately,
  // same action as clicking Play.
  document.addEventListener("action-starting-note-continue", () => {
    triggerReplay();
  });

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

  // --- SOLFÈGE PLACEMENT: reel-pad click auto-advances to the first empty
  // pitchSubmission slot; clicking an already-filled cell clears it. No
  // click-to-target-a-specific-cell here (unlike rhythm) - pitchSubmission
  // has no per-tick concept for a "selected slot" to even mean.

  document.addEventListener("action-select-pitch", (e) => {
    const { syllable } = e.detail;
    const targetIndex = sessionState.pitchSubmission.findIndex(
      (slot) => slot === null,
    );
    if (targetIndex === -1) return;

    const { newPitchSubmission, newPitchSlotStates } = insertPitch(
      sessionState.pitchSubmission,
      sessionState.pitchSlotStates,
      targetIndex,
      syllable,
    );
    sessionState.pitchSubmission = newPitchSubmission;
    sessionState.pitchSlotStates = newPitchSlotStates;
    renderWorkspace(sessionState);
  });

  document.addEventListener("action-clear-pitch", (e) => {
    const { index } = e.detail;
    const { newPitchSubmission, newPitchSlotStates } = clearPitch(
      sessionState.pitchSubmission,
      sessionState.pitchSlotStates,
      index,
    );
    sessionState.pitchSubmission = newPitchSubmission;
    sessionState.pitchSlotStates = newPitchSlotStates;
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
