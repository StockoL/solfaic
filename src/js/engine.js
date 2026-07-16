import {
  MOTIF_LIBRARY,
  SYNTAX_DICTIONARY,
  levelRules,
  CADENCE_MOTIFS,
  IRREGULAR_METRE_GROUPINGS,
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

export function evaluateSubmission(userSubmission, targetTimeline) {
  // 1. Flatten the algorithm's answer
  const flatTarget = [];
  targetTimeline.forEach((event) => {
    const duration = MOTIF_LIBRARY[event.motifId].ticks || 1;
    flatTarget.push(event.motifId);
    for (let i = 1; i < duration; i++) {
      flatTarget.push(`${event.motifId}_ext`);
    }
  });

  let isCorrect = true;

  // 2. Map success/error states
  const newSlotStates = userSubmission.map((token, index) => {
    if (token === flatTarget[index]) {
      return "success";
    } else {
      isCorrect = false;
      return "error";
    }
  });

  // 3. Return the payload for the Conductor to handle
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
