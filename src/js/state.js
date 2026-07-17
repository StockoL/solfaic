// ============================================================================
// STATE MACHINE & DOM CACHE
// ============================================================================

/**
 * Single Source of Truth
 * The UI is merely a reflection of these variables. Changing a variable here
 * and calling renderWorkspace() guarantees UI consistency.
 */
export const sessionState = {
  currentLevel: 1,
  playCount: 0,
  streak: 0,
  maxPlays: 3,
  activeConfig: null, // Stores current metre, bars, and tick allocations
  targetTimeline: [], // The algorithmic 'correct' answer (rhythm)
  userSubmission: [], // What the user has placed on the board (rhythm)
  slotStates: [], // Rhythm validation feedback memory ('idle', 'success', 'error')
  selectedSlotIndex: null, // Tracks mobile tap-to-target logic
  currentState: "IDLE", // 'IDLE' or 'PLAYING' (locks UI during audio)
  allowedMotifs: [], // Current level's reel contents, cached for the vignette's mirrored reel

  // --- Melodic engine additions ---
  // An exercise is dictated in two passes: rhythm first, then solfège over
  // the already-confirmed rhythm. exercisePhase tracks which reel/workspace
  // pass is currently active; the two-phase evaluation flow that reads/sets
  // it is UI wiring for a later pass, not part of this schema addition.
  exercisePhase: "RHYTHM", // 'RHYTHM' or 'PITCH'
  targetPitchLine: null, // generatePitchLine()'s output for the current exercise
  pitchSubmission: [], // What the user has placed on the solfège reel, one slot per sounding note
  pitchSlotStates: [], // Solfège validation feedback memory ('idle', 'success', 'error')

  // How many times the student has SUBMITTED a wrong answer in the current
  // exercise/phase. Deliberately not playCount: that counts listens, this
  // counts submissions, and they reset at different points — playCount also
  // resets per phase, but a listen and a wrong guess are different events and
  // conflating them is what the old "streak dies the instant you're wrong"
  // behaviour did. Resets in startLevel() and enterPitchPhase().
  wrongAttemptCount: 0,
};
