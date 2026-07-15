import {
  MOTIF_LIBRARY,
  SYNTAX_DICTIONARY,
  levelRules,
  CADENCE_MOTIFS,
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

  const activeConfig = {
    metre: chosenMetre,
    bars: barCount,
    form: chosenForm,
    totalTicks: barCount * ticksPerBar,
    ticksPerBar: ticksPerBar,
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
