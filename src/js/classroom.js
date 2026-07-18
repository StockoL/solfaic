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

import { MAX_LEVEL, MOTIF_LIBRARY, allowedTonics } from "./data.js";
import { renderRhythmSVG } from "./rhythm-notation.js";
import { resolveSolfegeColor, sortSyllablesAscending } from "./core.js";
import {
  getPresentationContent,
  generateRhythmTimeline,
  countSoundingNotes,
  generatePitchLine,
} from "./engine.js";
import { AudioEngine } from "./audio.js";

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
 * Shared by Presentation and both Workshops — Level 4 is fully live but
 * genuinely introduces no new syllable (its real advance is new cadence
 * targets/modes), so melody sections need to say that plainly rather than
 * either rendering an empty circle row or falling back to the "not yet
 * available" state, which would misrepresent a live level as an unbuilt
 * one. Rhythm's equivalent branch is currently unreachable (every live
 * level introduces at least one new motif) but handled the same way for
 * consistency if that ever changes.
 */
function renderNoNewContentMessage(container, trackLabel) {
  const message = document.createElement("p");
  message.className = "text-muted";
  message.textContent = `No new ${trackLabel} this level.`;
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
    renderNoNewContentMessage(melodySection, "solfège");
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

/**
 * Beat-highlight sync for AudioEngine.playOstinato, shared by every drill
 * in this module (Rhythm/Melodic Workshop, later Interval Detective) —
 * mirrors core.js's renderBeatPulse/audio-pulse-beat idiom (double-rAF
 * remove/re-add of .is-pulsing to avoid a forced-reflow flicker), but
 * keyed off audio-ostinato-beat's subIndex against a small target array
 * instead of a fixed .workspace-box[data-tick-index] grid. `targets[i %
 * targets.length]` lets a single-pad drill (Workshops) point every
 * subIndex at the same element, while a future multi-pad drill (Interval
 * Detective's two-syllable sequence) can point each subIndex at its own.
 */
let activeOstinatoTargets = [];

function pulseOstinatoTarget(subIndex) {
  if (activeOstinatoTargets.length === 0) return;
  const target = activeOstinatoTargets[subIndex % activeOstinatoTargets.length];
  if (!target) return;
  target.classList.remove("is-pulsing");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.classList.add("is-pulsing");
    });
  });
}

async function playOstinatoWithPulse(content, repeatCount, tonic, targets) {
  activeOstinatoTargets = targets;
  try {
    await AudioEngine.playOstinato(content, repeatCount, tonic);
  } finally {
    activeOstinatoTargets = [];
  }
}

function buildPlayButton(label, onClick) {
  const btn = document.createElement("button");
  btn.className = "button";
  btn.setAttribute("data-variant", "primary");
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function renderRhythmWorkshopPanel(levelId) {
  const container = DOM.rhythmWorkshopContent;
  if (!container) return;
  container.innerHTML = "";

  const { newMotifIds } = getPresentationContent(levelId);
  if (newMotifIds.length === 0) {
    renderNoNewContentMessage(container, "rhythm motifs");
    return;
  }

  let selectedMotifId = newMotifIds[0];

  const reel = document.createElement("div");
  reel.className = "cluster";
  newMotifIds.forEach((motifId, i) => {
    const pad = buildMotifDisplayPad(motifId);
    pad.setAttribute("role", "option");
    pad.setAttribute("tabindex", "0");
    pad.setAttribute("aria-selected", i === 0 ? "true" : "false");
    if (i === 0) pad.classList.add("is-selected");
    pad.addEventListener("click", () => {
      reel.querySelectorAll(".motif-pad").forEach((p) => {
        p.classList.remove("is-selected");
        p.setAttribute("aria-selected", "false");
      });
      pad.classList.add("is-selected");
      pad.setAttribute("aria-selected", "true");
      selectedMotifId = motifId;
    });
    reel.appendChild(pad);
  });
  container.appendChild(reel);

  container.appendChild(
    buildPlayButton("Play Ostinato", () => {
      const selectedPad = reel.querySelector(".motif-pad.is-selected");
      playOstinatoWithPulse(selectedMotifId, 4, null, [selectedPad]);
    }),
  );
}

function renderMelodicWorkshopPanel(levelId) {
  const container = DOM.melodicWorkshopContent;
  if (!container) return;
  container.innerHTML = "";

  const newSyllables = sortSyllablesAscending(
    getPresentationContent(levelId).newSyllables,
  );
  if (newSyllables.length === 0) {
    renderNoNewContentMessage(container, "solfège");
    return;
  }

  let selectedSyllable = newSyllables[0];

  const reel = document.createElement("div");
  reel.className = "cluster";
  newSyllables.forEach((syllable, i) => {
    const pad = buildSolfegeDisplayPad(syllable);
    pad.setAttribute("role", "option");
    pad.setAttribute("tabindex", "0");
    pad.setAttribute("aria-selected", i === 0 ? "true" : "false");
    if (i === 0) pad.classList.add("is-selected");
    pad.addEventListener("click", () => {
      reel.querySelectorAll(".solfege-pad").forEach((p) => {
        p.classList.remove("is-selected");
        p.setAttribute("aria-selected", "false");
      });
      pad.classList.add("is-selected");
      pad.setAttribute("aria-selected", "true");
      selectedSyllable = syllable;
    });
    reel.appendChild(pad);
  });
  container.appendChild(reel);

  container.appendChild(
    buildPlayButton("Play Ostinato", () => {
      const selectedPad = reel.querySelector(".solfege-pad.is-selected");
      playOstinatoWithPulse(
        [selectedSyllable],
        4,
        currentLevelTonic,
        [selectedPad],
      );
    }),
  );
}

/**
 * Listen-only: generate, play, done — no workspace, no submission, no
 * evaluation. Regenerates a fresh phrase on every click rather than
 * replaying one fixed target, since there's nothing here that needs to
 * stay in sync with a target across repeated presses — "another example"
 * reads better than "the same one again". Reuses generateRhythmTimeline/
 * generatePitchLine/AudioEngine.playSequence directly, exactly as built
 * for Practice Room, rather than a new generator or playback path.
 */
function renderExamplePanel(levelId) {
  const container = DOM.exampleContent;
  if (!container) return;
  container.innerHTML = "";

  const metaText = document.createElement("p");
  metaText.className = "text-muted";
  metaText.textContent = "Press play to hear a generated phrase.";
  container.appendChild(metaText);

  container.appendChild(
    buildPlayButton("Play Example", async () => {
      const { timeline, config } = generateRhythmTimeline(levelId);
      const noteCount = countSoundingNotes(timeline);
      const pitchResult = generatePitchLine(levelId, noteCount);

      metaText.textContent = `${config.metre} time, ${config.bars} bar${config.bars === 1 ? "" : "s"}`;

      await AudioEngine.playSequence(
        timeline,
        config,
        pitchResult.tonic,
        pitchResult.pitches,
      );
    }),
  );
}

/**
 * Drawn once per level render, not once per Play click — a tonic is the
 * exercise's singing register, and resampling it on every button press
 * inside the same level-select would be a jarring, pointless key change
 * mid-browse. Shared between Melodic Workshop and Example so both speak
 * in the same key for a given level view.
 */
let currentLevelTonic = null;

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

  currentLevelTonic =
    allowedTonics[Math.floor(Math.random() * allowedTonics.length)];

  renderPresentationPanel(levelId);
  renderRhythmWorkshopPanel(levelId);
  renderMelodicWorkshopPanel(levelId);
  renderExamplePanel(levelId);

  // Remaining section render functions are wired in as they're built —
  // each guards on its own container's presence like the rest of this
  // module.
}

export function initialiseClassroomPanels() {
  if (!document.getElementById("classroom-panels-root")) return;

  document.addEventListener("classroom-level-changed", (e) => {
    renderAllPanels(e.detail.levelId);
  });

  document.addEventListener("audio-ostinato-beat", (e) => {
    pulseOstinatoTarget(e.detail.subIndex);
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
