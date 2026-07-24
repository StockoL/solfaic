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
  PITCH_SYNTAX_DICTIONARY,
  SOLFEGE_DEGREES,
  INTERVAL_NAMES,
  allowedTonics,
} from "../src/js/data.js";
import {
  generateRhythmTimeline,
  generateIrregularBar,
  countSoundingNotes,
  generatePitchLine,
  evaluateSubmission,
  evaluatePitchSubmission,
  getCumulativeToneset,
  getNewlyIntroducedSyllables,
  getSemitoneDistance,
  resolveIntervalName,
  pickIntervalPair,
  evaluateIntervalGuess,
  getPresentationContent,
} from "../src/js/engine.js";
import { resolveSolfegeToNote } from "../src/js/audio.js";
import { renderRhythmSVG } from "../src/js/rhythm-notation.js";

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
  "1n": 4,
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

// Every Markov weight row across every level/mode/group must sum to
// exactly 100 -- a plain data-entry check, generic over however many
// levels/groups exist, so it catches mistakes in future hand-authored
// tables too, not just tonight's Levels 5-9/8 additions.
section("PITCH_SYNTAX_DICTIONARY row sums");
{
  let rowsChecked = 0;
  Object.entries(PITCH_SYNTAX_DICTIONARY).forEach(([levelKey, groups]) => {
    Object.entries(groups).forEach(([groupName, table]) => {
      Object.entries(table).forEach(([row, weights]) => {
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        assert(
          sum === 100,
          `L${levelKey}.${groupName}.${row}: weights sum to ${sum} (expected 100)`,
        );
        rowsChecked++;
      });
    });
  });
  console.log(`  ${rowsChecked} Markov rows checked, all sum to 100.`);
}

// Pitch line length must track a real rhythm timeline's sounding-note count
// (restMask-aware), across levels/metres that can actually produce one.
section("countSoundingNotes ↔ generatePitchLine pairing");
for (let trial = 0; trial < 100; trial++) {
  const levelId = 1 + (trial % 9);
  const { timeline } = generateRhythmTimeline(levelId);
  const noteCount = countSoundingNotes(timeline);
  const { pitches } = generatePitchLine(levelId, noteCount);
  assert(
    pitches.length === noteCount,
    `L${levelId}: generated pitch line length (${pitches.length}) matches countSoundingNotes (${noteCount})`,
  );
}
console.log("  100 paired trials across L1-9 check out.");

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
    // Below-tonic pitches (Level 2's so_low/la_low) -- confirms the
    // resolver's existing octave arithmetic (Math.floor of a negative
    // totalSemitones, double-modulo on noteIndex) is already correct for
    // negative offsets, not just do'-style positive ones.
    ["so_low", "C4", "G3"],
    ["la_low", "C4", "A3"],
    ["so_low", "G4", "D4"],
    ["la_low", "G4", "E4"],
  ];
  cases.forEach(([token, tonic, expected]) => {
    const actual = resolveSolfegeToNote(token, tonic);
    assert(
      actual === expected,
      `resolveSolfegeToNote("${token}", "${tonic}") === "${expected}" (got "${actual}")`,
    );
  });
  assert(
    Object.keys(SOLFEGE_DEGREES).length === 16,
    "SOLFEGE_DEGREES has all 16 confirmed syllables (7 diatonic + do' + 6 chromatic, si/le sharing a semitone, + so_low/la_low)",
  );
}

// ============================================================================
// 5a. evaluateSubmission — too-rest / ta-rest (and toom-rest / tum-rest)
// notational equivalence
// ============================================================================
// A bar-internal 2-tick silence is the same musical rest whether notated
// as one long rest or two short ones -- both should mark correct. A long
// rest can never legally span a barline the way two short rests can, so
// that specific case should accept ONLY the two-short-rests form.
section("evaluateSubmission — rest notational equivalence");
{
  // targetTimeline only needs {motifId} per event — evaluateSubmission
  // reads MOTIF_LIBRARY[motifId].ticks itself to flatten it.
  const timeline = (motifIds) => motifIds.map((motifId) => ({ motifId }));

  // --- Bar-internal: too-rest and two ta-rests both mark correct, either
  // direction of substitution --- (single 4-tick bar)
  {
    const target = timeline(["ta", "tooRest", "ta"]); // ta | too-rest(2) | ta
    const asToo = ["ta", "tooRest", "tooRest_ext", "ta"];
    const asTwoTa = ["ta", "taRest", "taRest", "ta"];

    assert(
      evaluateSubmission(asToo, target, 4).isCorrect,
      "literal too-rest submission against a too-rest target is correct",
    );
    assert(
      evaluateSubmission(asTwoTa, target, 4).isCorrect,
      "two ta-rests against a too-rest target is correct (same bar-internal silence)",
    );

    const targetAsTwoTa = timeline(["ta", "taRest", "taRest", "ta"]);
    assert(
      evaluateSubmission(asToo, targetAsTwoTa, 4).isCorrect,
      "too-rest against a two-ta-rest target is correct (the reverse substitution)",
    );
  }

  // --- Crosses a barline: only two ta-rests is ever correct, a too-rest
  // spanning the barline must fail --- (two 3-tick bars, 3/4)
  {
    const target = timeline(["ta", "ta", "taRest", "taRest", "ta", "ta"]);
    const literal = ["ta", "ta", "taRest", "taRest", "ta", "ta"];
    const wrongToo = ["ta", "ta", "tooRest", "tooRest_ext", "ta", "ta"];

    assert(
      evaluateSubmission(literal, target, 3).isCorrect,
      "two ta-rests spanning a barline (bar 1's last tick, bar 2's first) is correct",
    );
    assert(
      !evaluateSubmission(wrongToo, target, 3).isCorrect,
      "a too-rest spanning a barline is rejected -- only two ta-rests are legal there",
    );
  }

  // --- Compound time: toom-rest / tum-rest, same rules ---
  {
    const target = timeline(["toomRest"]); // one 2-tick bar, 6/8
    const asTwoTum = ["tumRest", "tumRest"];
    assert(
      evaluateSubmission(asTwoTum, target, 2).isCorrect,
      "two tum-rests against a toom-rest target is correct (compound-time equivalent)",
    );
  }

  // --- Anacrusis shifts every bar boundary by one tick: the pickup tick
  // is its own 1-tick bar, so it must never merge with bar 0's first tick,
  // even though a naive tickIndex % ticksPerBar would miss that shift. ---
  {
    const ticksPerBar = 4;
    // Synthetic (not necessarily a real anacrusis pool motif) purely to
    // isolate the boundary arithmetic: index 0 is the pickup, indices 1-4
    // are bar 0.
    const target = [
      "taRest", // index 0: the anacrusis, its own bar
      "taRest", // index 1: bar 0's first tick
      "ta", // index 2
      "taRest", // index 3
      "taRest", // index 4: bar 0's last tick
    ];
    const targetEvents = target.map((motifId) => ({ motifId }));

    const literalMatch = evaluateSubmission(
      target,
      targetEvents,
      ticksPerBar,
      true,
    );
    assert(
      literalMatch.isCorrect,
      "anacrusis: the literal target still evaluates correct against itself",
    );
    assert(
      literalMatch.newSlotStates[0] === "success" &&
        literalMatch.newSlotStates[1] === "success",
      "anacrusis: the pickup tick and bar 0's first tick both mark success individually, without being merged into one too-rest",
    );

    // Indices 3-4 (both inside bar 0, neither is the anacrusis boundary)
    // should still accept a too-rest substitution.
    const withTooInBar0 = [
      "taRest",
      "taRest",
      "ta",
      "tooRest",
      "tooRest_ext",
    ];
    assert(
      evaluateSubmission(withTooInBar0, targetEvents, ticksPerBar, true)
        .isCorrect,
      "anacrusis: a too-rest substitution still works for a bar-internal pair once the pickup offset is accounted for",
    );
  }

  // --- Unrelated regression safety net: a genuinely wrong submission
  // still fails, rest-equivalence normalization hasn't loosened anything
  // else. ---
  {
    const target = timeline(["ta", "titi"]);
    const wrong = ["ta", "ta"];
    assert(
      !evaluateSubmission(wrong, target, 4).isCorrect,
      "an unrelated wrong submission still fails correctly",
    );
  }
}

// ============================================================================
// 5b. renderRhythmSVG — secondary (semiquaver) beam presence
// ============================================================================
// A semiquaver's secondary beam used to only draw when 2+ consecutive
// semiquavers sat next to each other in the same beamed run — an isolated
// semiquaver (tim-ka's dotted quaver + semiquaver; syncopa v1's two lone
// semiquavers either side of a quaver) silently got no secondary beam at
// all, rendering indistinguishable from a plain quaver. Counting y="27"
// rects (the secondary-beam layer, see rhythm-notation.js) rather than
// parsing full SVG geometry — enough to confirm one exists per semiquaver
// group, without over-specifying exact pixel placement here.
section("renderRhythmSVG — secondary beam presence");
{
  const secondaryBeamCount = (svg) => (svg.match(/y="27"/g) || []).length;

  assert(
    secondaryBeamCount(renderRhythmSVG("timKa")) === 1,
    "tim-ka (dotted quaver + isolated semiquaver) draws one secondary-beam hook",
  );
  assert(
    secondaryBeamCount(renderRhythmSVG("syncopaV1")) === 2,
    "syncopa v1 (semiquaver-quaver-semiquaver) draws two secondary-beam hooks, one per isolated semiquaver",
  );
  assert(
    secondaryBeamCount(renderRhythmSVG("tikatika")) === 1,
    "ti-ka-ti-ka (four consecutive semiquavers) draws one continuous secondary beam, not per-note hooks",
  );
  assert(
    secondaryBeamCount(renderRhythmSVG("tikati")) === 1,
    "ti-ka-ti (two consecutive semiquavers + a quaver) still draws its one secondary beam correctly",
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
// 8. Melodic level-of-introduction (getCumulativeToneset / getNewlyIntroducedSyllables)
// ============================================================================
section("Melodic level-of-introduction");
{
  const l1 = getCumulativeToneset(1);
  assert(
    l1.length === 5 &&
      ["so", "mi", "la", "do", "re"].every((s) => l1.includes(s)),
    `L1 cumulative toneset is the union of both melodicGroups (got [${l1.join(",")}])`,
  );

  const expectedNew = {
    1: ["so", "mi", "la", "do", "re"],
    2: ["so_low", "la_low", "do'"],
    3: ["fa"],
    4: [],
    // Level 4 drops "fa" (plain 5-note pentatonic); Level 5 restores it
    // alongside the genuinely new "ti" -- both come back as "new" here
    // since getNewlyIntroducedSyllables diffs against Level 4's toneset,
    // not Level 3's.
    5: ["fa", "ti"],
    6: [],
    7: ["si", "fi"],
    8: ["ra", "ma", "le"],
    9: [],
  };
  Object.entries(expectedNew).forEach(([levelKey, expected]) => {
    const levelId = parseInt(levelKey, 10);
    const actual = getNewlyIntroducedSyllables(levelId);
    assert(
      actual.length === expected.length &&
        expected.every((s) => actual.includes(s)),
      `L${levelId}: newly-introduced syllables are [${expected.join(",")}] (got [${actual.join(",")}])`,
    );
  });
  console.log("  L1-9 newly-introduced syllable sets check out.");
}

// ============================================================================
// 9. Interval Detective engine logic
// ============================================================================
section("Interval Detective engine logic");
{
  assert(
    INTERVAL_NAMES.length === 18,
    "INTERVAL_NAMES covers 0-17 semitones (18 entries) -- Level 2's so_low/la_low push the widest pairs past a single octave",
  );
  const knownDistances = [
    [0, "Unison"],
    [4, "Major 3rd"],
    [7, "Perfect 5th"],
    [12, "Octave"],
    [14, "Major 9th"],
    [17, "Perfect 11th"],
  ];
  knownDistances.forEach(([semitones, expected]) => {
    assert(
      resolveIntervalName(semitones) === expected,
      `resolveIntervalName(${semitones}) === "${expected}"`,
    );
  });
  assert(
    getSemitoneDistance("do", "so") === 7 &&
      getSemitoneDistance("so", "do") === 7,
    "getSemitoneDistance is order-independent (do/so === so/do === 7)",
  );

  const INTERVAL_TRIALS = 200;
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((levelId) => {
    const toneset = getCumulativeToneset(levelId);
    let sawAscending = false;
    let sawDescending = false;

    for (let trial = 0; trial < INTERVAL_TRIALS; trial++) {
      const pair = pickIntervalPair(levelId);
      assert(
        toneset.includes(pair.syllableA) && toneset.includes(pair.syllableB),
        `L${levelId}: both syllables ("${pair.syllableA}", "${pair.syllableB}") are in the cumulative toneset`,
      );
      assert(
        pair.syllableA !== pair.syllableB,
        `L${levelId}: pair is two distinct syllables`,
      );
      assert(
        pair.semitones >= 0 &&
          pair.semitones < INTERVAL_NAMES.length &&
          pair.intervalName === resolveIntervalName(pair.semitones),
        `L${levelId}: semitones (${pair.semitones}) resolves to a valid interval name ("${pair.intervalName}")`,
      );
      assert(
        evaluateIntervalGuess([pair.syllableA, pair.syllableB], pair) &&
          evaluateIntervalGuess([pair.syllableB, pair.syllableA], pair),
        `L${levelId}: evaluateIntervalGuess accepts the correct pair in either click order`,
      );
      if (pair.ascending) sawAscending = true;
      else sawDescending = true;
    }

    assert(
      sawAscending && sawDescending,
      `L${levelId}: both ascending and descending pairs occur across ${INTERVAL_TRIALS} trials`,
    );
    console.log(`  L${levelId}: ${INTERVAL_TRIALS} trials, both directions seen.`);
  });

  const target = { syllableA: "do", syllableB: "mi" };
  assert(
    evaluateIntervalGuess(["do", "fa"], target) === false,
    "evaluateIntervalGuess rejects a wrong syllable",
  );
  assert(
    evaluateIntervalGuess(["do"], target) === false,
    "evaluateIntervalGuess rejects a single-syllable guess",
  );
}

// ============================================================================
// 10. Presentation content assembly (getPresentationContent)
// ============================================================================
section("Presentation content assembly");
{
  const l1 = getPresentationContent(1);
  assert(
    l1.newMotifIds.length === 3 &&
      ["ta", "titi", "taRest"].every((id) => l1.newMotifIds.includes(id)),
    `L1: newMotifIds is exactly [ta, titi, taRest] (got [${l1.newMotifIds.join(",")}])`,
  );
  assert(
    l1.videoAnchor === null,
    "videoAnchor is pre-wired but unused (null)",
  );

  // Level 4 is the key case: real new rhythm content, but nothing new
  // melodically -- the two tracks must be independent, not coupled.
  const l4 = getPresentationContent(4);
  assert(
    l4.newMotifIds.length > 0,
    `L4: newMotifIds is non-empty (got [${l4.newMotifIds.join(",")}])`,
  );
  assert(
    l4.newSyllables.length === 0,
    `L4: newSyllables is empty despite newMotifIds being non-empty (got [${l4.newSyllables.join(",")}])`,
  );
  console.log("  L1 and L4 presentation content check out (rhythm/melody tracked independently).");
}

// ============================================================================
// Summary
// ============================================================================
section("Summary");
console.log(`  ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exitCode = 1;
}
