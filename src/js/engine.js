import {
  MOTIF_LIBRARY,
  SYNTAX_DICTIONARY,
  levelRules,
  CADENCE_MOTIFS,
  IRREGULAR_METRE_GROUPINGS,
  PITCH_LEVEL_RULES,
  PITCH_SYNTAX_DICTIONARY,
  SOLFEGE_DEGREES,
  INTERVAL_NAMES,
  allowedTonics,
} from "./data.js";

/**
 * ============================================================================
 * ENGINE LOGIC (Pure Functions)
 * ============================================================================
 * This module is entirely blind to the browser. It computes the musical
 * mathematics and progression rules, returning data objects to the Conductor.
 */

export function generateBarSequence(
  allowedMotifs,
  ticksPerBar,
  forceCadence = false,
) {
  const barMotifs = [];
  let currentTicks = 0;
  let previousMotif = null;

  while (currentTicks < ticksPerBar) {
    const remainingTicks = ticksPerBar - currentTicks;

    let viableIds = allowedMotifs.filter(
      (id) => MOTIF_LIBRARY[id].ticks <= remainingTicks,
    );

    if (forceCadence) {
      const exactFitCadence = viableIds.filter(
        (id) =>
          CADENCE_MOTIFS.includes(id) &&
          MOTIF_LIBRARY[id].ticks === remainingTicks,
      );
      if (exactFitCadence.length > 0) {
        viableIds = exactFitCadence;
      } else {
        // No cadence motif exactly fits the remaining ticks yet -- still
        // exclude any candidate that would complete the bar right here
        // without being a genuine cadence motif (e.g. a whole-bar motif
        // like `tooo` filling a 4/4 bar in one step, before the loop ever
        // reaches a tick count a cadence motif matches). Every other
        // motif in the vocabulary is 1-2 ticks, well under a full bar, so
        // this never empties viableIds in practice.
        viableIds = viableIds.filter(
          (id) => MOTIF_LIBRARY[id].ticks !== remainingTicks,
        );
      }
    }

    if (viableIds.length === 0) break;

    let chosenId;

    if (previousMotif && SYNTAX_DICTIONARY[previousMotif]) {
      const transitionWeights = SYNTAX_DICTIONARY[previousMotif];
      const validWeights = {};
      let totalWeight = 0;

      viableIds.forEach((id) => {
        if (transitionWeights[id]) {
          validWeights[id] = transitionWeights[id];
          totalWeight += transitionWeights[id];
        }
      });

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

    if (!chosenId) {
      chosenId = viableIds[Math.floor(Math.random() * viableIds.length)];
    }

    barMotifs.push(chosenId);
    currentTicks += MOTIF_LIBRARY[chosenId].ticks;
    previousMotif = chosenId;
  }

  return barMotifs;
}

/**
 * Irregular-metre (5/8, 7/8) bar generation. Not a parallel generator — each
 * group in the metre's grouping pattern is just one more call to
 * generateBarSequence with ticksPerBar: 1, drawing from the simple pool for
 * a "2" group or the compound pool for a "3" group (see design doc: each
 * "2"/"3" is exactly one simple/compound beat's worth of existing content).
 * `isContrastingBar` selects the variant grouping instead of the level's
 * default — callers tie this to the phrase's form letter (e.g. the "B" in
 * an AABA phrase), not an independent dice roll.
 *
 * Standalone and testable on its own; not yet wired into
 * generateRhythmTimeline's dispatch because no level currently activates
 * 5/8 or 7/8 (Level 6, the level the design doc assigns 5/8 to, is a
 * melodic-sequence pass that's explicitly deferred).
 */
export function generateIrregularBar(
  metre,
  isContrastingBar,
  simplePool,
  compoundPool,
) {
  const groupingConfig = IRREGULAR_METRE_GROUPINGS[metre];
  if (!groupingConfig) return [];

  const grouping =
    isContrastingBar && groupingConfig.variants.length > 0
      ? groupingConfig.variants[
          Math.floor(Math.random() * groupingConfig.variants.length)
        ]
      : groupingConfig.default;

  const barMotifs = [];
  grouping.forEach((groupSize) => {
    const pool = groupSize === 3 ? compoundPool : simplePool;
    barMotifs.push(...generateBarSequence(pool, 1, false));
  });
  return barMotifs;
}

const ANACRUSIS_PROBABILITY = 0.35;

/**
 * Level-gated, probabilistic anacrusis check. rest-ti/rest-tika are
 * simple-time-only motifs (no compound rest-initial card exists in the
 * vocabulary), so a compound-metre phrase never gets a pickup. Returns the
 * chosen motif id, or null if no anacrusis was rolled this phrase.
 */
function maybeChooseAnacrusisMotif(rules, metreType) {
  if (metreType !== "simple") return null;
  const pool = rules.anacrusisMotifs || [];
  if (pool.length === 0) return null;
  if (Math.random() >= ANACRUSIS_PROBABILITY) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateRhythmTimeline(levelId) {
  const rules = levelRules[levelId];
  if (!rules) return { timeline: [], config: null };

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

  const anacrusisMotifId = maybeChooseAnacrusisMotif(rules, metreType);

  const activeConfig = {
    metre: chosenMetre,
    bars: barCount,
    form: chosenForm,
    // +1 when a pickup is present — an anacrusis adds exactly one beat, not
    // one bar, so FORM_TEMPLATES' bar count is unaffected. (No hard cap on
    // this total is enforced here — the workspace pager already handles
    // phrases longer than one page, which is the "16-box ceiling" concern
    // this used to require a tick-budget for.)
    totalTicks: barCount * ticksPerBar + (anacrusisMotifId ? 1 : 0),
    ticksPerBar: ticksPerBar,
    hasAnacrusis: !!anacrusisMotifId,
    allowedMotifs:
      metreType === "simple" ? rules.simpleMotifs : rules.compoundMotifs,
  };

  const rawBarArrays = [];
  const phraseCache = {};

  chosenForm.forEach((formLetter, index) => {
    const isFinalBar = index === chosenForm.length - 1;
    const needsCadence = rules.enforceCadence && isFinalBar;
    const cacheKey = needsCadence ? `${formLetter}_cadence` : formLetter;

    if (!phraseCache[cacheKey]) {
      phraseCache[cacheKey] = generateBarSequence(
        activeConfig.allowedMotifs,
        ticksPerBar,
        needsCadence,
      );
    }
    rawBarArrays.push([...phraseCache[cacheKey]]);
  });

  const timeline = [];

  if (anacrusisMotifId) {
    const motifData = MOTIF_LIBRARY[anacrusisMotifId];
    timeline.push({
      // Bar -1 marks "before bar 0" (Tone.js BarsBeatsSixteenths pickup
      // convention) — informational only, nothing currently reads .time.
      time: "-1:0:0",
      duration: motifData.duration,
      motifId: anacrusisMotifId,
      pitch: null,
    });
  }

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

  // Return the data instead of mutating global state directly
  return { timeline, config: activeConfig };
}

// A bar-internal 2-tick silence is the same musical rest to a real
// musician whether it's notated as one long rest or two short rests of
// the same time-feel (simple/compound) — so either should mark correct.
// A long rest can never legally span a barline the way two short rests
// naturally can (you can't write one rest symbol starting in one bar and
// ending in the next), which is why the equivalence below is bar-internal
// only, not a blanket "any two adjacent short rests" rule.
const REST_EQUIVALENCE_PAIRS = {
  taRest: "tooRest",
  tumRest: "toomRest",
};

/**
 * True when tickIndex is the last tick of its own bar — an anacrusis
 * (see generateRhythmTimeline) sits at index 0 as its own complete 1-tick
 * pickup bar, shifting bar 0 proper to start at index 1, so every
 * subsequent bar boundary needs that one-tick offset accounted for too.
 */
function isLastTickOfBar(tickIndex, ticksPerBar, hasAnacrusis) {
  if (hasAnacrusis) {
    if (tickIndex === 0) return true;
    return (tickIndex - 1) % ticksPerBar === ticksPerBar - 1;
  }
  return tickIndex % ticksPerBar === ticksPerBar - 1;
}

/**
 * Normalizes every bar-internal pair of adjacent identical short rests
 * (ta-rest+ta-rest, tum-rest+tum-rest) to their long-rest token shape
 * (tooRest/tooRest_ext, toomRest/toomRest_ext) — comparing two normalized
 * arrays then accepts either valid notation for the same silence. A pair
 * that actually crosses a barline (this bar's last tick into the next
 * bar's first) is deliberately left unmerged, since only two short rests
 * are ever legal there.
 */
function normalizeRestEquivalence(flatTokens, ticksPerBar, hasAnacrusis) {
  const normalized = [...flatTokens];
  for (let i = 0; i < normalized.length - 1; i++) {
    const shortId = normalized[i];
    const longId = REST_EQUIVALENCE_PAIRS[shortId];
    if (!longId || normalized[i + 1] !== shortId) continue;
    if (isLastTickOfBar(i, ticksPerBar, hasAnacrusis)) continue; // crosses a barline
    normalized[i] = longId;
    normalized[i + 1] = `${longId}_ext`;
    i++; // this pair is spoken for; don't let the next iteration re-pair it
  }
  return normalized;
}

export function evaluateSubmission(
  userSubmission,
  targetTimeline,
  ticksPerBar,
  hasAnacrusis = false,
) {
  // 1. Flatten the algorithm's answer
  const flatTarget = [];
  targetTimeline.forEach((event) => {
    const duration = MOTIF_LIBRARY[event.motifId].ticks || 1;
    flatTarget.push(event.motifId);
    for (let i = 1; i < duration; i++) {
      flatTarget.push(`${event.motifId}_ext`);
    }
  });

  // 2. Compare normalized forms, not the literal tokens — see
  // normalizeRestEquivalence. flatTarget itself stays the literal
  // generated answer below, since that's what's shown when the answer is
  // revealed; only the correctness check treats equivalent rests as equal.
  const normalizedTarget = normalizeRestEquivalence(
    flatTarget,
    ticksPerBar,
    hasAnacrusis,
  );
  const normalizedSubmission = normalizeRestEquivalence(
    userSubmission,
    ticksPerBar,
    hasAnacrusis,
  );

  let isCorrect = true;

  // 3. Map success/error states
  const newSlotStates = normalizedSubmission.map((token, index) => {
    if (token === normalizedTarget[index]) {
      return "success";
    } else {
      isCorrect = false;
      return "error";
    }
  });

  // 4. Return the payload for the Conductor to handle
  return {
    isCorrect,
    newSlotStates,
    flatTarget,
  };
}

/**
 * Array Manipulation Utilities
 * These compute the new state arrays for inserting or removing motifs.
 */
export function insertMotif(currentSubmission, currentStates, index, motifId) {
  const duration = MOTIF_LIBRARY[motifId].ticks || 1;
  const newSubmission = [...currentSubmission];
  const newStates = [...currentStates];

  if (index + duration <= newSubmission.length) {
    newSubmission[index] = motifId;
    newStates[index] = "idle";

    for (let i = 1; i < duration; i++) {
      newSubmission[index + i] = `${motifId}_ext`;
      newStates[index + i] = "idle";
    }
  }
  return { newSubmission, newStates };
}

export function clearMotif(currentSubmission, currentStates, index, motifId) {
  const duration = MOTIF_LIBRARY[motifId].ticks || 1;
  const newSubmission = [...currentSubmission];
  const newStates = [...currentStates];
  let startIndex = index;

  if (newSubmission[index] === `${motifId}_ext`) {
    while (startIndex > 0 && newSubmission[startIndex] === `${motifId}_ext`) {
      startIndex--;
    }
  }

  newSubmission[startIndex] = null;
  newStates[startIndex] = "idle";

  for (let i = 1; i < duration; i++) {
    if (newSubmission[startIndex + i] === `${motifId}_ext`) {
      newSubmission[startIndex + i] = null;
      newStates[startIndex + i] = "idle";
    }
  }

  return { newSubmission, newStates };
}

// ============================================================================
// PITCH (SOLFÈGE) GENERATION
// ============================================================================

/**
 * Counts the sounding (non-rest) notes across a rhythm timeline — this is
 * the pitch line's required length, since the melodic engine assigns one
 * solfège syllable per sounding note (one per stem/column), not one per
 * rhythm motif. A restMask-true playback slot, or a whole-motif rest
 * (empty playback), contributes zero.
 */
export function countSoundingNotes(rhythmTimeline) {
  let count = 0;
  rhythmTimeline.forEach((event) => {
    const motif = MOTIF_LIBRARY[event.motifId];
    const playback = motif.playback;
    if (!playback || playback.length === 0) return;
    playback.forEach((_, i) => {
      if (!motif.restMask?.[i]) count++;
    });
  });
  return count;
}

function weightedChoice(weights) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total <= 0) return null;

  let draw = Math.random() * total;
  for (const key in weights) {
    draw -= weights[key];
    if (draw <= 0) return key;
  }
  return null;
}

/**
 * Filters a Markov transition row down to only the syllables in the active
 * toneset/subset, same "viableIds" filter+renormalize pattern
 * generateBarSequence already uses for rhythm, applied to pitch — this is
 * both how Level 1's random subsets work and how Level 4 reuses Level 3's
 * doMode/laMode tables after fa drops out of the toneset.
 */
function filterTransitionRow(row, toneset) {
  const filtered = {};
  toneset.forEach((syllable) => {
    if (row[syllable] !== undefined) filtered[syllable] = row[syllable];
  });
  return filtered;
}

/**
 * Walks the Markov table for `length` steps within `toneset`, falling back
 * to uniform-random among the toneset whenever the weighted draw has
 * nothing viable left (mirrors generateBarSequence's fallback). When
 * `cadenceTarget` is given, only the final syllable is overridden — every
 * other position is genuinely unforced.
 */
function generateSolfegeSequence(table, toneset, length, cadenceTarget) {
  const sequence = [];
  let previous = null;

  for (let i = 0; i < length; i++) {
    let chosen = null;

    if (previous && table[previous]) {
      const candidateWeights = filterTransitionRow(table[previous], toneset);
      if (Object.keys(candidateWeights).length > 0) {
        chosen = weightedChoice(candidateWeights);
      }
    }

    if (!chosen) {
      chosen = toneset[Math.floor(Math.random() * toneset.length)];
    }

    sequence.push(chosen);
    previous = chosen;
  }

  if (cadenceTarget && length > 0) {
    sequence[length - 1] = cadenceTarget;
  }

  return sequence;
}

/**
 * Generates the pitch line for one exercise. `noteCount` is the number of
 * solfège syllables needed (see countSoundingNotes) — the caller pairs this
 * with whatever rhythm timeline it's being sung against.
 *
 * cadenceRequired: false (Level 1) means no forcing at all, not weak/
 * low-weight forcing — sparse 2-note tonesets genuinely have no "correct"
 * ending, so the Markov chain's natural landing spot stands.
 */
export function generatePitchLine(levelId, noteCount) {
  const rules = PITCH_LEVEL_RULES[levelId];
  const tonic = allowedTonics[Math.floor(Math.random() * allowedTonics.length)];

  if (!rules) return { pitches: [], tonic };

  if (levelId === 1) {
    const groupKeys = Object.keys(rules.melodicGroups);
    const chosenGroupKey =
      groupKeys[Math.floor(Math.random() * groupKeys.length)];
    const group = rules.melodicGroups[chosenGroupKey];

    // Random non-empty subset of the group's toneset — real early
    // repertoire progressively adds notes rather than always using all 3.
    let subset = [];
    while (subset.length === 0) {
      subset = group.toneset.filter(() => Math.random() < 0.7);
    }

    const table = PITCH_SYNTAX_DICTIONARY[1][chosenGroupKey];
    const pitches = generateSolfegeSequence(table, subset, noteCount, null);

    return { pitches, tonic, group: chosenGroupKey, toneset: subset };
  }

  if (levelId === 2) {
    const table = PITCH_SYNTAX_DICTIONARY[2].unified;
    const cadenceTarget = rules.cadenceRequired ? rules.cadenceTarget : null;
    const pitches = generateSolfegeSequence(
      table,
      rules.toneset,
      noteCount,
      cadenceTarget,
    );

    return { pitches, tonic, toneset: rules.toneset };
  }

  // Level 3+: pick a cadence target, which selects the mode/table. Most
  // levels' single shared toneset matches every mode's table exactly, but
  // where a mode's table covers fewer syllables than the full toneset
  // (Level 8's doMode has no si/fi), `tonesets` narrows generation to what
  // that specific mode actually supports -- otherwise the uniform-random
  // fallback in generateSolfegeSequence (used whenever there's no
  // weighted transition to draw from, including every phrase's first
  // note) could draw a syllable the chosen mode doesn't recognise at all.
  const targets = Object.keys(rules.modes);
  const chosenTarget = targets[Math.floor(Math.random() * targets.length)];
  const modeInfo = rules.modes[chosenTarget];
  const table = PITCH_SYNTAX_DICTIONARY[modeInfo.level][modeInfo.mode];
  const activeToneset = rules.tonesets?.[chosenTarget] ?? rules.toneset;
  const pitches = generateSolfegeSequence(
    table,
    activeToneset,
    noteCount,
    chosenTarget,
  );

  return {
    pitches,
    tonic,
    toneset: activeToneset,
    mode: modeInfo.mode,
    cadenceTarget: chosenTarget,
  };
}

/**
 * Mirrors evaluateSubmission's shape for the pitch line — a flat
 * per-syllable comparison, no ticks/extension accounting needed since
 * pitch positions map 1:1 onto sounding notes rather than workspace ticks.
 */
export function evaluatePitchSubmission(userPitchSubmission, targetPitches) {
  let isCorrect = true;

  const newPitchSlotStates = userPitchSubmission.map((token, index) => {
    if (token === targetPitches[index]) {
      return "success";
    } else {
      isCorrect = false;
      return "error";
    }
  });

  return { isCorrect, newPitchSlotStates };
}

/**
 * Pitch placement — much simpler than insertMotif/clearMotif since
 * pitchSubmission has no ticks/duration/extension concept at all, just a
 * direct 1:1 index per sounding note. A single assignment each.
 */
export function insertPitch(currentPitchSubmission, currentPitchSlotStates, index, syllable) {
  const newPitchSubmission = [...currentPitchSubmission];
  const newPitchSlotStates = [...currentPitchSlotStates];
  newPitchSubmission[index] = syllable;
  newPitchSlotStates[index] = "idle";
  return { newPitchSubmission, newPitchSlotStates };
}

export function clearPitch(currentPitchSubmission, currentPitchSlotStates, index) {
  const newPitchSubmission = [...currentPitchSubmission];
  const newPitchSlotStates = [...currentPitchSlotStates];
  newPitchSubmission[index] = null;
  newPitchSlotStates[index] = "idle";
  return { newPitchSubmission, newPitchSlotStates };
}

/**
 * A level's full allowed toneset, cumulative through that level. Levels 2+
 * store this directly as `toneset`; Level 1 has no single top-level toneset
 * (it's split into two named `melodicGroups`, each a genuinely separate
 * early-repertoire starting point), so its cumulative set is the union of
 * both groups' tonesets instead.
 */
export function getCumulativeToneset(levelId) {
  const rules = PITCH_LEVEL_RULES[levelId];
  if (!rules) return [];

  if (levelId === 1) {
    const seen = [];
    Object.values(rules.melodicGroups).forEach((group) => {
      group.toneset.forEach((syllable) => {
        if (!seen.includes(syllable)) seen.push(syllable);
      });
    });
    return seen;
  }

  return [...rules.toneset];
}

/**
 * Which syllable(s) are genuinely new at this level, vs. carried over from
 * the level before it — the melodic-side counterpart to MOTIF_LIBRARY's
 * introducedAtLevel tagging. Derived from getCumulativeToneset rather than
 * hardcoded, so it can't silently drift if PITCH_LEVEL_RULES ever changes.
 * Can be empty (Level 4 adds no new syllable — its real advance is new
 * cadence targets/modes, not new syllable names).
 */
export function getNewlyIntroducedSyllables(levelId) {
  const current = getCumulativeToneset(levelId);
  const previous = getCumulativeToneset(levelId - 1);
  return current.filter((syllable) => !previous.includes(syllable));
}

/**
 * Interval Detective — engine logic. Picks two distinct syllables from a
 * level's cumulative toneset, orders them into an ascending-or-descending
 * pair, and names the interval between them.
 */
export function getSemitoneDistance(syllableA, syllableB) {
  return Math.abs(SOLFEGE_DEGREES[syllableA] - SOLFEGE_DEGREES[syllableB]);
}

export function resolveIntervalName(semitones) {
  return INTERVAL_NAMES[semitones] ?? null;
}

export function pickIntervalPair(levelId) {
  const toneset = getCumulativeToneset(levelId);

  const indexA = Math.floor(Math.random() * toneset.length);
  let indexB = Math.floor(Math.random() * (toneset.length - 1));
  if (indexB >= indexA) indexB++;

  const [lower, higher] =
    SOLFEGE_DEGREES[toneset[indexA]] <= SOLFEGE_DEGREES[toneset[indexB]]
      ? [toneset[indexA], toneset[indexB]]
      : [toneset[indexB], toneset[indexA]];

  const ascending = Math.random() < 0.5;
  const [syllableA, syllableB] = ascending ? [lower, higher] : [higher, lower];
  const semitones = getSemitoneDistance(syllableA, syllableB);

  return {
    syllableA,
    syllableB,
    ascending,
    semitones,
    intervalName: resolveIntervalName(semitones),
  };
}

/**
 * Order-independent: the student names the two syllables they heard, not
 * which one came first — direction is confirmed separately by ear, not by
 * the answer grid (the existing colored solfège circles have no inherent
 * ascending/descending affordance).
 */
export function evaluateIntervalGuess(guessedPair, targetPair) {
  if (guessedPair.length !== 2) return false;
  const guessed = new Set(guessedPair);
  return (
    guessed.size === 2 &&
    guessed.has(targetPair.syllableA) &&
    guessed.has(targetPair.syllableB)
  );
}

/**
 * Presentation's data: what's genuinely new at this level, rhythm and
 * melody tracked independently (one can be non-empty while the other is
 * empty -- Level 4 has new motifs but no new syllable). `videoAnchor` is
 * pre-wired and currently unused, same pattern as V1's speculative
 * `pitch: null` before the melodic engine existed -- nothing reads it yet.
 */
export function getPresentationContent(levelId) {
  const newMotifIds = Object.keys(MOTIF_LIBRARY).filter(
    (id) => MOTIF_LIBRARY[id].introducedAtLevel === levelId,
  );

  return {
    levelId,
    newMotifIds,
    newSyllables: getNewlyIntroducedSyllables(levelId),
    videoAnchor: null,
  };
}
