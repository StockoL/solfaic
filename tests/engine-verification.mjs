// tests/engine-verification.mjs
//
// Lightweight Node harness for the rhythm + melodic engine (data.js /
// engine.js / audio.js's pure helpers). There's no UI to check this
// against yet (the melodic engine sprint is engine-layer only), so this
// runs the generators directly, asserts the invariants that actually
// matter, and prints a handful of generated phrases per level for a
// sanity check.
//
// Run: node tests/engine-verification.mjs

import {
  MOTIF_LIBRARY,
  MOTIF_POOLS,
  levelRules,
  CADENCE_MOTIFS,
  IRREGULAR_METRE_GROUPINGS,
  PITCH_LEVEL_RULES,
  SOLFEGE_DEGREES,
  allowedTonics,
} from "../src/js/data.js";
import {
  generateRhythmTimeline,
  generateBarSequence,
  generateIrregularBar,
  countSoundingNotes,
  generatePitchLine,
  evaluatePitchSubmission,
} from "../src/js/engine.js";
import { resolveSolfegeToNote } from "../src/js/audio.js";

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    passCount++;
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

// ============================================================================
// 1. MOTIF_LIBRARY internal consistency
// ============================================================================
// "Every motif's total duration is a whole number of beats, even with
// internal dotted/triplet subdivisions" — checked here by converting each
// playback entry to quarter-note-equivalent beats and confirming the sum
// matches `ticks` (1 compound tick = a dotted-quarter = 1.5 quarter-beats;
// 1 simple tick = a quarter = 1 quarter-beat).
section("MOTIF_LIBRARY internal consistency");

const QUARTER_BEATS = {
  "16n": 0.25,
  "8t": 1 / 3,
  "8n": 0.5,
  "8n.": 0.75,
  "4n": 1,
  "4n.": 1.5,
  "2n": 2,
  "2n.": 3,
};

Object.entries(MOTIF_LIBRARY).forEach(([id, motif]) => {
  const expectedQuarterBeats =
    motif.ticks * (motif.type === "compound" ? 1.5 : 1);

  if (motif.playback.length === 0) {
    // Whole-motif rests carry no playback — nothing to sum.
    return;
  }

  const actualQuarterBeats = motif.playback.reduce(
    (sum, d) => sum + (QUARTER_BEATS[d] ?? NaN),
    0,
  );

  assert(
    Object.values(QUARTER_BEATS).length > 0 &&
      motif.playback.every((d) => d in QUARTER_BEATS),
    `${id}: every playback duration string is a known unit`,
  );
  assert(
    Math.abs(actualQuarterBeats - expectedQuarterBeats) < 1e-9,
    `${id}: playback sums to ${actualQuarterBeats} quarter-beats, expected ${expectedQuarterBeats} (ticks=${motif.ticks}, type=${motif.type})`,
  );

  if (motif.restMask) {
    assert(
      motif.restMask.length === motif.playback.length,
      `${id}: restMask length matches playback length`,
    );
  }
});

console.log(`  Checked ${Object.keys(MOTIF_LIBRARY).length} motifs.`);

// ============================================================================
// 2. Rhythm generation — per level, N trials
// ============================================================================
section("Rhythm generation (generateRhythmTimeline)");

const RHYTHM_TRIALS = 200;

Object.keys(levelRules).forEach((levelKey) => {
  const levelId = parseInt(levelKey, 10);
  const rules = levelRules[levelId];
  let anacrusisSeen = 0;

  for (let trial = 0; trial < RHYTHM_TRIALS; trial++) {
    const { timeline, config } = generateRhythmTimeline(levelId);

    assert(timeline.length > 0, `L${levelId}: non-empty timeline generated`);
    assert(
      levelRules[levelId].allowedMetres.includes(config.metre),
      `L${levelId}: chosen metre ${config.metre} is allowed`,
    );

    // Toneset adherence: every motif used must come from this level's pool.
    const metreType = config.metre === "6/8" ? "compound" : "simple";
    const pool =
      metreType === "compound" ? rules.compoundMotifs : rules.simpleMotifs;
    const nonAnacrusisEvents = config.hasAnacrusis
      ? timeline.slice(1)
      : timeline;
    nonAnacrusisEvents.forEach((event) => {
      assert(
        pool.includes(event.motifId),
        `L${levelId}: motif "${event.motifId}" is in the level's allowed pool`,
      );
    });

    // Tick accounting: totalTicks = bars*ticksPerBar (+1 iff anacrusis).
    const expectedBase = config.bars * config.ticksPerBar;
    assert(
      config.totalTicks === expectedBase + (config.hasAnacrusis ? 1 : 0),
      `L${levelId}: totalTicks (${config.totalTicks}) accounts for anacrusis correctly`,
    );
    if (config.hasAnacrusis) {
      anacrusisSeen++;
      assert(
        timeline[0].motifId === "restTi" || timeline[0].motifId === "restTika",
        `L${levelId}: anacrusis event uses a rest-initial motif`,
      );
      assert(
        rules.anacrusisMotifs.includes(timeline[0].motifId),
        `L${levelId}: anacrusis motif is level-gated correctly`,
      );
    }

    // Cadence behavior: enforced levels must end (last real bar, ignoring
    // the anacrusis pickup) on a CADENCE_MOTIFS member.
    if (rules.enforceCadence) {
      const lastEvent = timeline[timeline.length - 1];
      assert(
        CADENCE_MOTIFS.includes(lastEvent.motifId),
        `L${levelId}: cadence-enforced phrase ends on a cadence motif (got "${lastEvent.motifId}")`,
      );
    }
  }

  if (rules.anacrusisMotifs.length > 0) {
    assert(
      anacrusisSeen > 0 && anacrusisSeen < RHYTHM_TRIALS,
      `L${levelId}: anacrusis is probabilistic, not always-on/always-off (saw ${anacrusisSeen}/${RHYTHM_TRIALS})`,
    );
  } else {
    assert(
      anacrusisSeen === 0,
      `L${levelId}: anacrusis never triggers when anacrusisMotifs is empty`,
    );
  }

  console.log(
    `  L${levelId}: ${RHYTHM_TRIALS} trials, anacrusis in ${anacrusisSeen}.`,
  );
});

// ============================================================================
// 3. Irregular metre grouping (5/8, 7/8) — standalone, not yet level-wired
// ============================================================================
section("Irregular metre grouping (generateIrregularBar)");

const simplePool = levelRules[4].simpleMotifs;
const compoundPool = levelRules[4].compoundMotifs;

Object.entries(IRREGULAR_METRE_GROUPINGS).forEach(([metre, groupingConfig]) => {
  [false, true].forEach((isContrastingBar) => {
    for (let trial = 0; trial < 50; trial++) {
      const barMotifs = generateIrregularBar(
        metre,
        isContrastingBar,
        simplePool,
        compoundPool,
      );
      const grouping = isContrastingBar
        ? null // variant is chosen internally, length may differ per pick
        : groupingConfig.default;

      const totalTicks = barMotifs.reduce(
        (sum, id) => sum + MOTIF_LIBRARY[id].ticks,
        0,
      );

      if (!isContrastingBar) {
        assert(
          totalTicks === grouping.length,
          `${metre} default grouping: bar sums to ${grouping.length} ticks (one per group)`,
        );
      } else {
        const possibleLengths = groupingConfig.variants.map((v) => v.length);
        assert(
          possibleLengths.includes(totalTicks),
          `${metre} variant grouping: bar sums to a valid variant length (got ${totalTicks})`,
        );
      }
    }
  });
  console.log(`  ${metre}: default + variant groupings check out.`);
});

// ============================================================================
// 4. Pitch generation — per level, N trials
// ============================================================================
section("Pitch generation (generatePitchLine)");

const PITCH_TRIALS = 200;
const SAMPLE_NOTE_COUNT = 6;

function tonesetFor(levelId, result) {
  if (levelId === 1) return result.toneset;
  return PITCH_LEVEL_RULES[levelId].toneset;
}

Object.keys(PITCH_LEVEL_RULES).forEach((levelKey) => {
  const levelId = parseInt(levelKey, 10);
  const rules = PITCH_LEVEL_RULES[levelId];
  const finalNotesSeen = new Set();

  for (let trial = 0; trial < PITCH_TRIALS; trial++) {
    const result = generatePitchLine(levelId, SAMPLE_NOTE_COUNT);

    assert(
      result.pitches.length === SAMPLE_NOTE_COUNT,
      `L${levelId}: pitch line length (${result.pitches.length}) matches requested note count`,
    );
    assert(
      allowedTonics.includes(result.tonic),
      `L${levelId}: tonic "${result.tonic}" drawn from allowedTonics`,
    );

    const toneset = tonesetFor(levelId, result);
    result.pitches.forEach((p) => {
      assert(
        toneset.includes(p),
        `L${levelId}: pitch "${p}" is inside the active toneset [${toneset.join(",")}]`,
      );
    });

    finalNotesSeen.add(result.pitches[result.pitches.length - 1]);

    // Cadence forcing.
    if (levelId === 1) {
      // cadenceRequired: false — genuinely unforced, never checked against
      // a fixed target here (there isn't one).
    } else if (levelId === 2) {
      assert(
        result.pitches[SAMPLE_NOTE_COUNT - 1] === rules.cadenceTarget,
        `L2: final pitch forced to cadenceTarget "${rules.cadenceTarget}"`,
      );
    } else {
      assert(
        result.pitches[SAMPLE_NOTE_COUNT - 1] === result.cadenceTarget,
        `L${levelId}: final pitch forced to the chosen mode's cadence target "${result.cadenceTarget}"`,
      );
      assert(
        rules.cadenceTargets.includes(result.cadenceTarget),
        `L${levelId}: cadence target "${result.cadenceTarget}" is one of this level's declared targets`,
      );
    }
  }

  if (levelId === 1) {
    assert(
      finalNotesSeen.size > 1,
      `L1: final note varies across trials (${finalNotesSeen.size} distinct) — confirms cadence is genuinely unforced, not just low-weight`,
    );
  }

  console.log(
    `  L${levelId}: ${PITCH_TRIALS} trials, ${finalNotesSeen.size} distinct final notes seen.`,
  );
});

// Pitch line length must track a real rhythm timeline's sounding-note count
// (restMask-aware), across levels/metres that can actually produce one.
section("countSoundingNotes ↔ generatePitchLine pairing");
for (let trial = 0; trial < 100; trial++) {
  const levelId = 1 + (trial % 4);
  const { timeline } = generateRhythmTimeline(levelId);
  const noteCount = countSoundingNotes(timeline);
  const { pitches } = generatePitchLine(levelId, noteCount);
  assert(
    pitches.length === noteCount,
    `L${levelId}: generated pitch line length (${pitches.length}) matches countSoundingNotes (${noteCount})`,
  );
}
console.log("  100 paired trials across L1-4 check out.");

// evaluatePitchSubmission sanity.
section("evaluatePitchSubmission");
{
  const target = ["do", "re", "mi", "do"];
  const correct = evaluatePitchSubmission(["do", "re", "mi", "do"], target);
  const wrong = evaluatePitchSubmission(["do", "re", "fa", "do"], target);
  assert(
    correct.isCorrect === true,
    "identical submission evaluates as correct",
  );
  assert(
    wrong.isCorrect === false,
    "divergent submission evaluates as incorrect",
  );
  assert(
    wrong.newPitchSlotStates.join(",") === "success,success,error,success",
    "per-slot states pinpoint the wrong syllable",
  );
}

// ============================================================================
// 5. Movable-do resolution (audio.js's pure resolver)
// ============================================================================
section("resolveSolfegeToNote");
{
  const cases = [
    ["do", "C4", "C4"],
    ["so", "C4", "G4"],
    ["do'", "C4", "C5"],
    ["ti", "C4", "B4"],
    ["so", "Eb4", "A#4"], // Eb + P5 = Bb, spelled A# here (sharp-only scale)
    ["la", "G4", "E5"],
  ];
  cases.forEach(([token, tonic, expected]) => {
    const actual = resolveSolfegeToNote(token, tonic);
    assert(
      actual === expected,
      `resolveSolfegeToNote("${token}", "${tonic}") === "${expected}" (got "${actual}")`,
    );
  });
  assert(
    Object.keys(SOLFEGE_DEGREES).length === 14,
    "SOLFEGE_DEGREES has all 14 confirmed syllables (7 diatonic + do' + 6 chromatic, si/le sharing a semitone)",
  );
}

// ============================================================================
// 6. Human sanity check — sample phrases
// ============================================================================
section("Sample phrases (human sanity check)");

Object.keys(levelRules).forEach((levelKey) => {
  const levelId = parseInt(levelKey, 10);
  console.log(`\n  --- Level ${levelId} ---`);
  for (let i = 0; i < 5; i++) {
    const { timeline, config } = generateRhythmTimeline(levelId);
    const noteCount = countSoundingNotes(timeline);
    const pitchResult = generatePitchLine(levelId, noteCount);

    const rhythmTokens = timeline.map((e) => MOTIF_LIBRARY[e.motifId].label);
    const anacrusisTag = config.hasAnacrusis ? " [anacrusis]" : "";

    console.log(
      `  ${config.metre}${anacrusisTag} (${config.bars} bars, form ${config.form.join("")}): ${rhythmTokens.join(" | ")}`,
    );
    console.log(
      `    solfège (${pitchResult.tonic}${pitchResult.mode ? `, ${pitchResult.mode}` : ""}${pitchResult.group ? `, ${pitchResult.group}` : ""}): ${pitchResult.pitches.join(" ")}`,
    );
  }
});

// ============================================================================
// 7. MOTIF_LIBRARY introducedAtLevel tagging
// ============================================================================
// Every motif's introducedAtLevel must match whichever MOTIF_POOLS.simpleLN/
// compoundLN array actually contains it — the pools are the authoritative
// source (see the doc comment above MOTIF_LIBRARY), so this just confirms
// the two stay in sync rather than drifting apart as motifs are added later.
section("MOTIF_LIBRARY introducedAtLevel tagging");
{
  const poolLevelFor = {};
  Object.entries(MOTIF_POOLS).forEach(([poolName, ids]) => {
    const level = parseInt(poolName.match(/\d+$/)[0], 10);
    ids.forEach((id) => {
      poolLevelFor[id] = level;
    });
  });

  const motifIds = Object.keys(MOTIF_LIBRARY);
  assert(
    motifIds.length === Object.keys(poolLevelFor).length,
    `every MOTIF_LIBRARY entry (${motifIds.length}) appears in exactly one MOTIF_POOLS array (${Object.keys(poolLevelFor).length})`,
  );
  motifIds.forEach((id) => {
    assert(
      poolLevelFor[id] !== undefined,
      `${id}: appears in some MOTIF_POOLS array`,
    );
    assert(
      MOTIF_LIBRARY[id].introducedAtLevel === poolLevelFor[id],
      `${id}: introducedAtLevel (${MOTIF_LIBRARY[id].introducedAtLevel}) matches its MOTIF_POOLS level (${poolLevelFor[id]})`,
    );
  });
  console.log(`  Checked ${motifIds.length} motifs against their pool of origin.`);
}

// ============================================================================
// Summary
// ============================================================================
section("Summary");
console.log(`  ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exitCode = 1;
}
