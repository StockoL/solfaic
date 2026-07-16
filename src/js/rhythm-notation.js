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
 * like ta-a would letterbox to a shorter apparent note height than a short
 * one like ti-ti when both are scaled into equally-sized cards.
 * ============================================================================
 */

const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 100;

// Relative duration weight, in sixteenth-note units — derived once here so
// both the SVG generator and the column-template generator read the same
// scale for every motif, simple or compound.
const NOTE_WEIGHTS = {
  "16n": 1,
  "8n": 2,
  "4n": 4,
  "4n.": 6,
  "2n": 8,
};

// Notes at or below this weight (an eighth note or shorter) are eligible to
// beam/flag. Anything longer (quarter, dotted quarter, half) is always a
// plain stem — matching real notation, where undivided beats aren't beamed.
const BEAMABLE_WEIGHT = 2;
const SEMIQUAVER_WEIGHT = 1;

function getSegments(motifId) {
  const motif = MOTIF_LIBRARY[motifId];
  const playback = motif.playback;

  if (!playback || playback.length === 0) {
    // Rests carry no playback events — treat as a single full-width segment.
    return [{ duration: null, weight: 4, isRest: true }];
  }

  return playback.map((duration) => ({
    duration,
    weight: NOTE_WEIGHTS[duration] || 4,
    isRest: false,
  }));
}

/**
 * CSS grid-template-columns value for this motif's solfege input card —
 * one column per note, width proportional to that note's duration, so a
 * column's boundaries land exactly under its paired rhythm-card stick.
 */
export function getColumnTemplate(motifId) {
  const segments = getSegments(motifId);
  return segments.map((seg) => `${seg.weight}fr`).join(" ");
}

function noteGlyph(stemCenterX, { isDotted = false, isHollow = false } = {}) {
  const stemX = stemCenterX - 1.5;
  const ellipseCx = stemCenterX - 9;
  const ellipseAttrs = isHollow
    ? `fill="none" stroke="currentColor" stroke-width="3"`
    : `fill="currentColor"`;
  const stemFill = isHollow ? `fill="currentColor"` : "";

  let markup = `<ellipse cx="${ellipseCx}" cy="85" rx="12" ry="8" transform="rotate(-20 ${ellipseCx} 85)" ${ellipseAttrs}/><rect x="${stemX}" y="15" width="3" height="70" ${stemFill}/>`;

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

  if (notes[0].isRest) {
    body = restGlyph(notes[0].centerX);
  } else {
    // Group consecutive beamable notes (8th-or-shorter) into runs — a run of
    // one gets a flag instead, a longer note is always a plain stem and
    // breaks any run it would otherwise join.
    let i = 0;
    while (i < notes.length) {
      const note = notes[i];

      if (note.weight > BEAMABLE_WEIGHT) {
        body += noteGlyph(note.centerX, {
          isDotted: note.duration === "4n.",
          isHollow: note.duration === "2n",
        }).markup;
        i++;
        continue;
      }

      // Collect the run of consecutive beamable notes starting here.
      let j = i;
      while (j < notes.length && notes[j].weight <= BEAMABLE_WEIGHT) j++;
      const run = notes.slice(i, j);

      run.forEach((n) => {
        body += noteGlyph(n.centerX).markup;
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
  }

  return `<svg viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" width="100%" height="100%" fill="currentColor" aria-hidden="true">${body}</svg>`;
}
