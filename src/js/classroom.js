/**
 * ============================================================================
 * CLASSROOM PANELS (Presentation, Rhythm Workshop, Melodic Workshop,
 * Example, Interval Detective)
 * ============================================================================
 * Owns rendering/wiring for classroom.html's five level-driven sections.
 * Kept out of core.js (already large, and scoped to Practice Room's view
 * layer) and wired to the level dropdown via the classroom-level-changed
 * CustomEvent core.js dispatches, rather than a direct import back into
 * it — matches the app's existing convention of CustomEvents for
 * cross-module signalling (audio-pulse-beat, action-select-motif).
 * ============================================================================
 */

import { MAX_LEVEL, MOTIF_LIBRARY } from "./data.js";
import { renderRhythmSVG } from "./rhythm-notation.js";
import { resolveSolfegeColor } from "./core.js";

const DOM = {
  presentationContent: document.getElementById("presentation-content"),
  rhythmWorkshopContent: document.getElementById("rhythm-workshop-content"),
  melodicWorkshopContent: document.getElementById("melodic-workshop-content"),
  exampleContent: document.getElementById("example-content"),
  intervalDetectiveContent: document.getElementById(
    "interval-detective-content",
  ),
};

/**
 * A level whose generation algorithm doesn't exist yet (Levels 5-9) — shown
 * instead of hiding the section outright, so a student can see what's
 * coming rather than finding a gap in the page.
 */
export function renderUnavailableState(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="panel-unavailable">
      <span class="badge">Not yet available</span>
      <p>This level's generation algorithm hasn't been built yet — check back once it has.</p>
    </div>
  `;
}

/**
 * Read-only rhythm motif card — visually similar to the practice reel's
 * .motif-pad, but with no click-to-insert semantics (this is "look/listen",
 * not "answer"), so it's built directly here rather than reusing core.js's
 * private renderReelInto.
 */
export function buildMotifDisplayPad(motifId) {
  const motifData = MOTIF_LIBRARY[motifId];
  const pad = document.createElement("div");
  pad.className = "motif-pad";
  pad.setAttribute("role", "img");
  pad.setAttribute("aria-label", motifData.label);
  pad.dataset.motifId = motifId;
  pad.innerHTML = `<div class="motif-pad__svg">${renderRhythmSVG(motifId)}</div><span class="motif-pad__label">${motifData.label}</span>`;
  return pad;
}

/**
 * Read-only solfège circle — same colour lookup as the practice reel's
 * .solfege-pad, no click-to-insert semantics.
 */
export function buildSolfegeDisplayPad(syllable) {
  const pad = document.createElement("div");
  pad.className = "solfege-pad";
  pad.setAttribute("role", "img");
  pad.setAttribute("aria-label", syllable);
  pad.dataset.syllable = syllable;
  pad.style.setProperty("--pad-color", resolveSolfegeColor(syllable));
  pad.innerHTML = `<span class="solfege-pad__label">${syllable}</span>`;
  return pad;
}

function renderAllPanels(levelId) {
  const isAvailable = levelId <= MAX_LEVEL;

  if (!isAvailable) {
    renderUnavailableState(DOM.presentationContent);
    renderUnavailableState(DOM.rhythmWorkshopContent);
    renderUnavailableState(DOM.melodicWorkshopContent);
    renderUnavailableState(DOM.exampleContent);
    renderUnavailableState(DOM.intervalDetectiveContent);
    return;
  }

  // Individual section render functions are wired in as they're built —
  // each guards on its own container's presence like the rest of this
  // module, so this stays a no-op list until then.
}

export function initialiseClassroomPanels() {
  if (!document.getElementById("classroom-panels-root")) return;

  document.addEventListener("classroom-level-changed", (e) => {
    renderAllPanels(e.detail.levelId);
  });

  // Render immediately off whichever level is active by default, rather
  // than waiting for the first classroom-level-changed event — core.js's
  // own dropdown setup may have already dispatched it before this
  // listener above was registered, since both run inside the same
  // DOMContentLoaded handler.
  const initialItem = document.querySelector(
    ".level-select__item.is-active",
  );
  if (initialItem) {
    renderAllPanels(Number(initialItem.getAttribute("data-value")));
  }
}
