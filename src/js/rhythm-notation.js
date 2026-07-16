import { MOTIF_LIBRARY } from "./data.js";

/**
 * ============================================================================
 * RHYTHM NOTATION GENERATOR
 * ============================================================================
 * Generates each motif's stick-notation SVG and its matching CSS column
 * template from the SAME source data (MOTIF_LIBRARY[id].playback), rather
 * than hand-authoring SVG coordinates and a column layout separately. That
 * guarantees the rhythm card's stick positions and the paired solfege card's
 * input columns always land on the same boundaries, for any motif, without
 * having to keep two hand-tuned assets in sync.
 *
 * A fixed viewBox width (independent of a motif's total duration) is used
 * for every motif so aspect ratio stays constant — otherwise a long motif
 * like too would letterbox to a shorter apparent note height than a short
 * one like ti-ti when both are scaled into equally-sized cards.
 *
 * Notehead convention (Kodály stick notation): a "stick" is just a stick —
 * only too/toom (the sustained, held-note motifs) get an outlined notehead.
 * Every other motif, however many notes it beams together, is stems and
 * beams only, so students read duration from the beam pattern rather than
 * notehead shape.
 * ============================================================================
 */

const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 100;

// Relative duration weight, in sixteenth-note units — derived once here so
// both the SVG generator and the column-template generator read the same
// scale for every motif, simple or compound. Triplet eighths are fractional
// (3 of them fill one quarter-note beat) — fine here, these weights only
// drive proportional SVG/column widths, never real Tone.js timing.
const NOTE_WEIGHTS = {
  "16n": 1,
  "8t": 4 / 3,
  "8n": 2,
  "8n.": 3,
  "4n": 4,
  "4n.": 6,
  "2n": 8,
  "2n.": 12,
};

// Notes at or below this weight (an eighth note or shorter, including a
// dotted eighth) are eligible to beam/flag. Anything longer (quarter,
// dotted quarter, half, dotted half) is always a plain stem — matching real
// notation, where undivided beats aren't beamed.
const BEAMABLE_WEIGHT = 3;
const SEMIQUAVER_WEIGHT = 1;

// The only two motifs whose sustained note keeps its (outlined) notehead —
// see the module doc comment above.
const SUSTAINED_DURATIONS = new Set(["2n", "2n."]);
const DOTTED_DURATIONS = new Set(["8n.", "4n.", "2n."]);

function getAllRawSegments(motifId) {
  const motif = MOTIF_LIBRARY[motifId];
  const playback = motif.playback;

  if (!playback || playback.length === 0) {
    // Whole-motif rests carry no playback events — treat as a single
    // full-width rest segment.
    return [{ duration: null, weight: 4, isRest: true }];
  }

  return playback.map((duration, i) => ({
    duration,
    weight: NOTE_WEIGHTS[duration] || 4,
    // restMask (rest-ti, rest-tika) marks specific slots silent without the
    // whole motif being a rest — a slot's rest-ness always comes from here,
    // never inferred from duration.
    isRest: motif.restMask?.[i] === true,
  }));
}

function getSegments(motifId) {
  const motif = MOTIF_LIBRARY[motifId];
  const segments = getAllRawSegments(motifId);

  if (motif.ticks <= 1) return segments;

  // A motif spanning more than one box (too/toom/tum-ti/syncopa v2) is
  // still rendered as a single card for its first box — but only the
  // segments that *start* within that first box's own beat-width belong
  // there. A note that starts later (because an earlier note in this same
  // motif is still sounding) belongs entirely to the extension box's own
  // rendering instead (see renderTieArcSVG/getExtensionSegments), not
  // crammed in here too.
  const oneBoxWeight = motif.type === "compound" ? 6 : 4;
  const truncated = [];
  let cursor = 0;
  for (const seg of segments) {
    if (cursor >= oneBoxWeight) break;
    truncated.push(seg);
    cursor += seg.weight;
  }
  return truncated;
}

/**
 * The remainder of a multi-box motif's segments that box A's card doesn't
 * show (see getSegments) — empty for a single-box motif, and also empty
 * for a multi-box motif whose one segment already fully covers box A (too,
 * toom: nothing left over). Non-empty only for tum-ti/syncopa v2, whose
 * trailing note belongs entirely to the extension box.
 */
function getExtensionSegments(motifId) {
  const motif = MOTIF_LIBRARY[motifId];
  if (motif.ticks <= 1) return [];
  return getAllRawSegments(motifId).slice(getSegments(motifId).length);
}

/**
 * CSS grid-template-columns value for this motif's solfege input card —
 * one column per note, width proportional to that note's duration, so a
 * column's boundaries land exactly under its paired rhythm-card stick.
 * Column count matches playback's full length even for rest-ti/rest-tika —
 * the solfege card is expected to render an empty cell (no letter) under
 * any index where MOTIF_LIBRARY[motifId].restMask[i] is true.
 */
export function getColumnTemplate(motifId) {
  const segments = getSegments(motifId);
  return segments.map((seg) => `${seg.weight}fr`).join(" ");
}

/**
 * Per-column rest flags for this motif's box-A solfege card, in the same
 * order/count as getColumnTemplate() — true where that column has no
 * sounding note (a restMask-true slot, or a whole-motif rest) and should
 * stay an empty cell rather than receiving a syllable.
 */
export function getRestColumns(motifId) {
  return getSegments(motifId).map((seg) => seg.isRest);
}

/**
 * getColumnTemplate()'s counterpart for a tieContinuation extension box's
 * OWN solfege card — the trailing note(s) that box A's card didn't have
 * room for (see getExtensionSegments). Empty string for a motif with
 * nothing left over there (everything that isn't tum-ti/syncopa v2).
 */
export function getExtensionColumnTemplate(motifId) {
  return getExtensionSegments(motifId)
    .map((seg) => `${seg.weight}fr`)
    .join(" ");
}

export function getExtensionRestColumns(motifId) {
  return getExtensionSegments(motifId).map((seg) => seg.isRest);
}

function noteGlyph(
  stemCenterX,
  { isDotted = false, isHollow = false, showNotehead = true } = {},
) {
  const stemWidth = showNotehead ? 3 : 4;
  const stemX = stemCenterX - stemWidth / 2;
  let markup = "";

  if (showNotehead) {
    const ellipseCx = stemCenterX - 9;
    const ellipseAttrs = isHollow
      ? `fill="none" stroke="currentColor" stroke-width="3"`
      : `fill="currentColor"`;
    markup += `<ellipse cx="${ellipseCx}" cy="85" rx="12" ry="8" transform="rotate(-20 ${ellipseCx} 85)" ${ellipseAttrs}/>`;
  }

  const stemFill = isHollow ? `fill="currentColor"` : "";
  markup += `<rect x="${stemX}" y="15" width="${stemWidth}" height="70" ${stemFill}/>`;

  if (isDotted) {
    markup += `<circle cx="${stemCenterX + 10}" cy="78" r="4" fill="currentColor"/>`;
  }

  return { markup, stemCenterX };
}

function flagGlyph(stemCenterX, flagCount) {
  let markup = "";
  for (let i = 0; i < flagCount; i++) {
    const y = 15 + i * 13;
    markup += `<path d="M ${stemCenterX} ${y} C ${stemCenterX + 13} ${y} ${stemCenterX + 13} ${y + 25} ${stemCenterX} ${y + 30} C ${stemCenterX + 8} ${y + 25} ${stemCenterX + 8} ${y + 10} ${stemCenterX} ${y + 10} Z" fill="currentColor"/>`;
  }
  return markup;
}

function restGlyph(centerX) {
  const x = centerX - 10;
  return `<path d="M ${x + 15} 20 L ${x + 5} 40 L ${x + 20} 55 L ${x + 5} 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/**
 * Renders this motif's proportional stick-notation SVG. Same fixed
 * viewBox for every motif — only the internal column boundaries change,
 * computed from the same weights getColumnTemplate() uses.
 */
export function renderRhythmSVG(motifId) {
  const segments = getSegments(motifId);
  const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0);

  let cursor = 0;
  const notes = segments.map((seg) => {
    const start = (cursor / totalWeight) * VIEWBOX_WIDTH;
    cursor += seg.weight;
    const end = (cursor / totalWeight) * VIEWBOX_WIDTH;
    return { ...seg, centerX: (start + end) / 2 };
  });

  let body = "";

  // Group consecutive beamable, non-rest notes (8th-or-shorter, including
  // dotted eighths) into runs — a run of one gets a flag instead, a rest or
  // a longer note is always its own glyph and breaks any run it would
  // otherwise join.
  let i = 0;
  while (i < notes.length) {
    const note = notes[i];

    if (note.isRest) {
      body += restGlyph(note.centerX);
      i++;
      continue;
    }

    if (note.weight > BEAMABLE_WEIGHT) {
      const isSustained = SUSTAINED_DURATIONS.has(note.duration);
      body += noteGlyph(note.centerX, {
        isDotted: DOTTED_DURATIONS.has(note.duration),
        isHollow: isSustained,
        showNotehead: isSustained,
      }).markup;
      i++;
      continue;
    }

    // Collect the run of consecutive beamable, non-rest notes starting here.
    let j = i;
    while (j < notes.length && !notes[j].isRest && notes[j].weight <= BEAMABLE_WEIGHT) {
      j++;
    }
    const run = notes.slice(i, j);

    run.forEach((n) => {
      body += noteGlyph(n.centerX, {
        isDotted: DOTTED_DURATIONS.has(n.duration),
        showNotehead: false,
      }).markup;
    });

    if (run.length >= 2) {
      const beamStart = run[0].centerX - 1.5;
      const beamEnd = run[run.length - 1].centerX + 1.5;
      body += `<rect x="${beamStart}" y="15" width="${beamEnd - beamStart}" height="8"/>`;

      // Secondary (semiquaver) beam under consecutive weight-1 notes
      // within this run.
      let k = 0;
      while (k < run.length) {
        if (run[k].weight === SEMIQUAVER_WEIGHT) {
          let m = k;
          while (m < run.length && run[m].weight === SEMIQUAVER_WEIGHT) m++;
          if (m - k >= 2) {
            const subStart = run[k].centerX - 1.5;
            const subEnd = run[m - 1].centerX + 1.5;
            body += `<rect x="${subStart}" y="27" width="${subEnd - subStart}" height="8"/>`;
          }
          k = m;
        } else {
          k++;
        }
      }
    } else {
      const flagCount = run[0].weight === SEMIQUAVER_WEIGHT ? 2 : 1;
      body += flagGlyph(run[0].centerX - 1.5, flagCount);
    }

    i = j;
  }

  return `<svg viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" width="100%" height="100%" fill="currentColor" aria-hidden="true">${body}</svg>`;
}

/**
 * The tie-continuation mark for an extension box whose sounding note is
 * still ringing from the previous box, rather than that box being fully
 * silent — needed by syncopa v2 and tum-ti's box B (see their
 * `tieContinuation` field). A curved arc across the first half in place of
 * the default flat dash, followed by the trailing note's own quaver stem
 * (both motifs' trailing note is an "8n") in the second half of the same
 * card, reusing the extension mechanism rather than inventing a parallel
 * one. Wired into the live extension-box rendering in core.js's
 * buildWorkspaceBox.
 */
export function renderTieArcSVG() {
  const arc = `<path d="M 20 55 Q 100 20 180 55" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;
  const trailingStem = noteGlyph(300, { showNotehead: false }).markup;
  const trailingFlag = flagGlyph(298, 1);
  return `<svg viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" width="100%" height="100%" fill="currentColor" aria-hidden="true">${arc}${trailingStem}${trailingFlag}</svg>`;
}
