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
import { resolveSolfegeColor, sortSyllablesAscending } from "./core.js";
import { getPresentationContent } from "./engine.js";

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

/**
 * Shared by Presentation's melody block and Melodic Workshop — Level 4 is
 * fully live but genuinely introduces no new syllable (its real advance is
 * new cadence targets/modes), so both sections need to say that plainly
 * rather than either rendering an empty circle row or falling back to the
 * "not yet available" state, which would misrepresent a live level as an
 * unbuilt one.
 */
function renderNoNewMelodyMessage(container) {
  const message = document.createElement("p");
  message.className = "text-muted";
  message.textContent = "No new solfège this level.";
  container.appendChild(message);
}

function renderPresentationPanel(levelId) {
  const container = DOM.presentationContent;
  if (!container) return;
  container.innerHTML = "";

  const content = getPresentationContent(levelId);

  const rhythmSection = document.createElement("div");
  rhythmSection.className = "flow";
  rhythmSection.innerHTML = "<h3>New this level: Rhythm</h3>";
  const rhythmCluster = document.createElement("div");
  rhythmCluster.className = "cluster";
  content.newMotifIds.forEach((motifId) => {
    rhythmCluster.appendChild(buildMotifDisplayPad(motifId));
  });
  rhythmSection.appendChild(rhythmCluster);
  container.appendChild(rhythmSection);

  const melodySection = document.createElement("div");
  melodySection.className = "flow";
  melodySection.innerHTML = "<h3>New this level: Melody</h3>";
  if (content.newSyllables.length === 0) {
    renderNoNewMelodyMessage(melodySection);
  } else {
    const melodyCluster = document.createElement("div");
    melodyCluster.className = "cluster";
    sortSyllablesAscending(content.newSyllables).forEach((syllable) => {
      melodyCluster.appendChild(buildSolfegeDisplayPad(syllable));
    });
    melodySection.appendChild(melodyCluster);
  }
  container.appendChild(melodySection);
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

  renderPresentationPanel(levelId);

  // Remaining section render functions are wired in as they're built —
  // each guards on its own container's presence like the rest of this
  // module.
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
