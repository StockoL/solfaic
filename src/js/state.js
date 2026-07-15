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
  targetTimeline: [], // The algorithmic 'correct' answer
  userSubmission: [], // What the user has placed on the board
  slotStates: [], // Validation feedback memory ('idle', 'success', 'error')
  selectedSlotIndex: null, // Tracks mobile tap-to-target logic
  currentState: "IDLE", // 'IDLE' or 'PLAYING' (locks UI during audio)
};
