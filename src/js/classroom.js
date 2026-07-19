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
import { renderRhythmSVG, renderTieArcSVG } from "./rhythm-notation.js";
import { resolveSolfegeColor, sortSyllablesAscending } from "./core.js";
import {
  getPresentationContent,
  generateRhythmTimeline,
  countSoundingNotes,
  generatePitchLine,
  getCumulativeToneset,
  pickIntervalPair,
  evaluateIntervalGuess,
} from "./engine.js";
import { AudioEngine } from "./audio.js";

const DOM = {
  preparationContent: document.getElementById("preparation-content"),
  presentationContent: document.getElementById("presentation-content"),
  rhythmWorkshopContent: document.getElementById("rhythm-workshop-content"),
  melodicWorkshopContent: document.getElementById("melodic-workshop-content"),
  exampleContent: document.getElementById("example-content"),
  intervalDetectiveContent: document.getElementById(
    "interval-detective-content",
  ),
};

const DEFAULT_UNAVAILABLE_MESSAGE =
  "This level's generation algorithm hasn't been built yet — check back once it has.";

/**
 * A level whose generation algorithm doesn't exist yet (Levels 5-9) — shown
 * instead of hiding the section outright, so a student can see what's
 * coming rather than finding a gap in the page. Also reused, with an
 * overridden message, for the Preparation tab: unlike Presentation/Practice,
 * Preparation has no content for ANY level yet, so its "not yet available"
 * reason isn't about a missing generation algorithm at all — reusing the
 * default copy there would state the wrong reason.
 */
export function renderUnavailableState(
  container,
  message = DEFAULT_UNAVAILABLE_MESSAGE,
) {
  if (!container) return;
  container.innerHTML = `
    <div class="panel-unavailable">
      <span class="badge">Not yet available</span>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Real <button> elements, not <div>s — a div with tabindex="0" gets
 * keyboard focus but never native Enter/Space-activates its click handler
 * the way a button does, so anything meant to be clickable needs to
 * actually be one. Built disabled by default (Presentation's read-only
 * use: inert, excluded from the tab order, but still exposes its
 * aria-label to assistive tech); interactive call sites (the Workshops,
 * Interval Detective) explicitly re-enable it.
 */
export function buildMotifDisplayPad(motifId) {
  const motifData = MOTIF_LIBRARY[motifId];
  const pad = document.createElement("button");
  pad.type = "button";
  pad.disabled = true;
  pad.className = "motif-pad";
  pad.setAttribute("aria-label", motifData.label);
  pad.dataset.motifId = motifId;
  pad.innerHTML = `<div class="motif-pad__svg">${renderRhythmSVG(motifId)}</div><span class="motif-pad__label">${motifData.label}</span>`;
  return pad;
}

/**
 * Box B for a motif tied across two boxes (tum-ti, syncopa v2) — purely
 * decorative continuation, not independently selectable (the main Practice
 * Room workspace doesn't wire clicks on its own extension boxes either), so
 * this is a plain <div>, aria-hidden, not a second button.
 */
function buildMotifExtensionPad() {
  const pad = document.createElement("div");
  pad.className = "motif-pad-extension";
  pad.setAttribute("aria-hidden", "true");
  pad.innerHTML = `<div class="motif-pad__svg is-tie-arc">${renderTieArcSVG()}</div><span class="motif-pad__label">&nbsp;</span>`;
  return pad;
}

/**
 * Wraps buildMotifDisplayPad with box B when the motif needs one, so every
 * call site (Presentation's rhythm cluster, Rhythm Workshop's reel) shows a
 * tied motif's real second box instead of a single-box assumption that
 * silently drops it — the bug this was written to fix. Returns the element
 * to append (a pair-wrapper for tied motifs, or just the pad itself
 * otherwise) alongside the actual interactive pad, since selection logic
 * only ever targets box A.
 */
function buildMotifCard(motifId) {
  const pad = buildMotifDisplayPad(motifId);
  const motif = MOTIF_LIBRARY[motifId];

  if (motif.ticks > 1 && motif.tieContinuation) {
    const pair = document.createElement("div");
    pair.className = "motif-pad-pair";
    pair.appendChild(pad);
    pair.appendChild(buildMotifExtensionPad());
    return { element: pair, interactivePad: pad };
  }

  return { element: pad, interactivePad: pad };
}

/**
 * Same real-<button> reasoning as buildMotifDisplayPad, same colour
 * lookup as the practice reel's .solfege-pad.
 */
export function buildSolfegeDisplayPad(syllable) {
  const pad = document.createElement("button");
  pad.type = "button";
  pad.disabled = true;
  pad.className = "solfege-pad";
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
    rhythmCluster.appendChild(buildMotifCard(motifId).element);
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

/**
 * Double-rAF remove/re-add of .is-pulsing, shared by the ostinato-driven
 * beat highlight below and the Melodic Workshop keyboard's own per-click
 * pulse (which has no audio-ostinato-beat event to listen for — a single
 * immediate note has nothing to schedule against, so it just pulses itself
 * directly in its own click handler instead).
 */
function pulseElement(target) {
  if (!target) return;
  target.classList.remove("is-pulsing");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.classList.add("is-pulsing");
    });
  });
}

function pulseOstinatoTarget(subIndex) {
  if (activeOstinatoTargets.length === 0) return;
  pulseElement(activeOstinatoTargets[subIndex % activeOstinatoTargets.length]);
}

async function playOstinatoWithPulse(content, repeatCount, tonic, targets) {
  activeOstinatoTargets = targets;
  try {
    await AudioEngine.playOstinato(content, repeatCount, tonic);
  } finally {
    activeOstinatoTargets = [];
  }
}

/**
 * Wires a read-only display pad into a "pick one from this group" control
 * — re-enables it, marks it a toggle button (aria-pressed rather than a
 * hand-rolled listbox/role="option" pattern, since this is genuinely just
 * "which one is currently pressed" among siblings sharing groupClass), and
 * swaps the pressed state to whichever was just clicked.
 */
function makeSelectablePad(pad, container, groupClass, onSelect) {
  pad.disabled = false;
  pad.setAttribute("aria-pressed", "false");
  pad.addEventListener("click", () => {
    container.querySelectorAll(`.${groupClass}`).forEach((p) => {
      p.classList.remove("is-selected");
      p.setAttribute("aria-pressed", "false");
    });
    pad.classList.add("is-selected");
    pad.setAttribute("aria-pressed", "true");
    onSelect();
  });
}

function buildPlayButton(label, onClick) {
  const btn = document.createElement("button");
  btn.className = "button";
  btn.setAttribute("data-variant", "primary");
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

/**
 * Simple/compound grouping, in that order — MOTIF_LIBRARY[id].type already
 * stores this per motif, so this is purely a render-time partition, no new
 * data modeling. A level whose new motifs are all one metre family (neither
 * is guaranteed) just renders the one group that actually has content.
 */
const RHYTHM_METRE_GROUPS = [
  { type: "simple", label: "Simple Time" },
  { type: "compound", label: "Compound Time" },
];

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
  let isFirstPad = true;

  RHYTHM_METRE_GROUPS.forEach(({ type, label }) => {
    const motifIds = newMotifIds.filter(
      (motifId) => MOTIF_LIBRARY[motifId].type === type,
    );
    if (motifIds.length === 0) return;

    const section = document.createElement("div");
    section.className = "flow";
    section.innerHTML = `<h3>${label}</h3>`;

    const cluster = document.createElement("div");
    cluster.className = "cluster";
    motifIds.forEach((motifId) => {
      const { element, interactivePad } = buildMotifCard(motifId);
      makeSelectablePad(interactivePad, container, "motif-pad", () => {
        selectedMotifId = motifId;
      });
      if (isFirstPad) {
        interactivePad.classList.add("is-selected");
        interactivePad.setAttribute("aria-pressed", "true");
        isFirstPad = false;
      }
      cluster.appendChild(element);
    });
    section.appendChild(cluster);
    container.appendChild(section);
  });

  container.appendChild(
    buildPlayButton("Play Ostinato", () => {
      const selectedPad = container.querySelector(".motif-pad.is-selected");
      playOstinatoWithPulse(selectedMotifId, 4, null, [selectedPad]);
    }),
  );
}

/**
 * A "keyboard": every syllable in the level's CUMULATIVE toneset (not just
 * what's new) renders as an always-enabled, independently click-to-play
 * pad, free experimentation with no selection state or repeat-count
 * mechanism at all — a lone new-to-level syllable had no melodic context on
 * its own (Level 3's fa specifically is close to useless in isolation), so
 * this replaces that ostinato-loop entirely rather than patching it.
 */
function renderMelodicWorkshopPanel(levelId) {
  const container = DOM.melodicWorkshopContent;
  if (!container) return;
  container.innerHTML = "";

  const invitation = document.createElement("p");
  invitation.className = "text-muted";
  invitation.textContent =
    "Try playing a tune you already know using these notes!";
  container.appendChild(invitation);

  const keyboard = document.createElement("div");
  keyboard.className = "cluster";
  sortSyllablesAscending(getCumulativeToneset(levelId)).forEach(
    (syllable) => {
      const pad = buildSolfegeDisplayPad(syllable);
      pad.disabled = false;
      pad.addEventListener("click", () => {
        AudioEngine.playNote(syllable, currentLevelTonic);
        pulseElement(pad);
      });
      keyboard.appendChild(pad);
    },
  );
  container.appendChild(keyboard);
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
 * Interval Detective: Play draws two syllables from the level's cumulative
 * toneset (ascending or descending) and sounds them via playOstinato; the
 * student picks the matching pair from the same colour circles used
 * throughout the app rather than a text answer. Auto-evaluates on the 2nd
 * distinct pick — no separate submit button, since this is a much lighter
 * single-question drill than Practice Room's multi-slot dictation flow.
 * Feedback names the interval either way.
 */
function renderIntervalDetectivePanel(levelId) {
  const container = DOM.intervalDetectiveContent;
  if (!container) return;
  container.innerHTML = "";

  const toneset = sortSyllablesAscending(getCumulativeToneset(levelId));
  let currentTarget = null;
  let guessedSyllables = [];

  const feedback = document.createElement("p");
  feedback.className = "text-muted";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  feedback.textContent = "Press play, then pick the two syllables you heard.";

  const grid = document.createElement("div");
  grid.className = "cluster";

  function resetGuess() {
    guessedSyllables = [];
    grid.querySelectorAll(".solfege-pad").forEach((pad) => {
      pad.classList.remove("is-selected", "is-correct", "is-incorrect");
      pad.setAttribute("aria-pressed", "false");
    });
  }

  function evaluateGuess() {
    const isCorrect = evaluateIntervalGuess(guessedSyllables, currentTarget);
    grid.querySelectorAll(".solfege-pad").forEach((pad) => {
      if (guessedSyllables.includes(pad.dataset.syllable)) {
        pad.classList.add(isCorrect ? "is-correct" : "is-incorrect");
      }
    });
    const directionWord = currentTarget.ascending ? "ascending" : "descending";
    feedback.textContent = `${isCorrect ? "Correct!" : "Not quite."} That was ${currentTarget.syllableA} → ${currentTarget.syllableB} (${directionWord}): ${currentTarget.intervalName}.`;
  }

  toneset.forEach((syllable) => {
    const pad = buildSolfegeDisplayPad(syllable);
    pad.disabled = false;
    pad.setAttribute("aria-pressed", "false");
    pad.addEventListener("click", () => {
      if (!currentTarget) return; // nothing to guess until Play has run
      if (guessedSyllables.length >= 2) resetGuess(); // start a fresh guess
      if (guessedSyllables.includes(syllable)) return; // no double-counting one pad

      guessedSyllables.push(syllable);
      pad.classList.add("is-selected");
      pad.setAttribute("aria-pressed", "true");

      if (guessedSyllables.length === 2) evaluateGuess();
    });
    grid.appendChild(pad);
  });

  container.appendChild(feedback);
  container.appendChild(grid);
  container.appendChild(
    buildPlayButton("Play Interval", () => {
      currentTarget = pickIntervalPair(levelId);
      resetGuess();
      feedback.textContent = "Listen, then pick the two syllables you heard.";

      const padA = grid.querySelector(
        `.solfege-pad[data-syllable="${currentTarget.syllableA}"]`,
      );
      // Only the reference (first) syllable highlights in sync with
      // playback — the second plays with no highlight at all, so the
      // student identifies it relative to the now-known first note rather
      // than being asked for two unknowns cold. `null` here relies on
      // pulseOstinatoTarget's existing guard against a falsy target.
      playOstinatoWithPulse(
        [currentTarget.syllableA, currentTarget.syllableB],
        1,
        currentLevelTonic,
        [padA, null],
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
  renderIntervalDetectivePanel(levelId);
}

/**
 * Preparation/Presentation/Practice tab strip. Level-independent — unlike
 * the panels above, switching tabs never re-renders anything, it just
 * shows/hides whichever tabpanel matches, the same hidden-attribute
 * pattern core.js already uses for .level-guide switching.
 */
function initialiseClassroomTabs() {
  const tabs = document.querySelectorAll(".classroom-tab");
  if (tabs.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        const isSelected = t === tab;
        t.setAttribute("aria-selected", String(isSelected));
        t.tabIndex = isSelected ? 0 : -1;
        const panel = document.getElementById(
          t.getAttribute("aria-controls"),
        );
        if (panel) panel.hidden = !isSelected;
      });
    });
  });
}

export function initialiseClassroomPanels() {
  if (!document.getElementById("classroom-panels-root")) return;

  initialiseClassroomTabs();

  // Preparation has no content for any level yet, so unlike Presentation/
  // Practice it's rendered exactly once here rather than per-level inside
  // renderAllPanels.
  renderUnavailableState(
    DOM.preparationContent,
    "Preparation content hasn't been built yet for any level — check back once it has.",
  );

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
  const initialItem = document.querySelector(".level-select__item.is-active");
  if (initialItem) {
    renderAllPanels(Number(initialItem.getAttribute("data-value")));
  }
}
