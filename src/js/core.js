/**
 * ============================================================================
 * SOLFAIC - The View & Stage Manager (core.js)
 * ============================================================================
 * This module handles absolutely all DOM manipulation, rendering, and UI
 * state changes. It does not calculate game logic. It reads state to paint
 * the screen, and it dispatches CustomEvents when the user interacts, allowing
 * the Conductor (app.js) to handle the logic.
 * ============================================================================
 */

import { MOTIF_LIBRARY, MAX_LEVEL } from "./data.js";
import { sessionState } from "./state.js";
import {
  renderRhythmSVG,
  getColumnTemplate,
  getRestColumns,
  getExtensionColumnTemplate,
  getExtensionRestColumns,
  renderTieArcSVG,
} from "./rhythm-notation.js";

// ============================================================================
// 1. DOM CACHE
// ============================================================================

export const DOM = {
  levelBadge: document.getElementById("ui-level-badge"),
  streakTracker: document.getElementById("ui-streak-tracker"),
  replayBtn: document.getElementById("btn-replay"),
  countdownIndicator: document.getElementById("ui-countdown-indicator"),
  playsRemaining: document.getElementById("ui-plays-remaining"),
  workspace: document.getElementById("ui-workspace"),
  workspaceDots: document.getElementById("ui-workspace-dots"),
  motifReel: document.getElementById("ui-motif-reel"),
  submitBtn: document.getElementById("btn-submit"),
  metreDisplay: document.getElementById("ui-metre-display"),
  barsDisplay: document.getElementById("ui-bars-display"),
  levelSelect: document.getElementById("control-level-select"),
  levelBtn: document.getElementById("btn-level-dropdown"),
  levelMenu: document.getElementById("menu-level-dropdown"),
  levelItems: document.querySelectorAll(".level-select__item"),
  vignette: document.getElementById("ui-card-vignette"),
  vignetteFocusedCard: document.getElementById("vignette-focused-card"),
  vignetteReel: document.getElementById("vignette-reel"),
};

const TICKS_PER_PAGE = 16;

// A single-bar row for a low-ticksPerBar metre (e.g. 2/4) reads much
// narrower than a 4/4 row, even though both are "one complete bar" — so
// rows pack as many whole bars as fit within a ~4-box-wide reference
// without splitting a bar across rows. 2/4 (ticksPerBar 2) packs 2 bars
// per row (4 boxes, matching 4/4); 3/4 (ticksPerBar 3) doesn't divide
// evenly into 4, so it stays at 1 bar per row (3 boxes) rather than
// jumping to 2 bars (6 boxes, noticeably wider than every other metre).
const WORKSPACE_ROW_REFERENCE_COLUMNS = 4;

function barsPerRow(ticksPerBar) {
  return Math.max(1, Math.floor(WORKSPACE_ROW_REFERENCE_COLUMNS / ticksPerBar));
}

// ============================================================================
// LONG-PRESS HELPER
// ============================================================================

/**
 * Tap-and-hold detection. Pointer-based (not a native event) so it works
 * uniformly for mouse and touch. A press that moves more than a few pixels
 * before the hold threshold is treated as a scroll/drag, not a long-press.
 */
function attachLongPress(el, onLongPress, { threshold = 500 } = {}) {
  let timer = null;
  let startX = 0;
  let startY = 0;
  let firedLongPress = false;

  const cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  el.addEventListener("pointerdown", (e) => {
    firedLongPress = false;
    startX = e.clientX;
    startY = e.clientY;
    timer = setTimeout(() => {
      firedLongPress = true;
      onLongPress();
    }, threshold);
  });

  el.addEventListener("pointermove", (e) => {
    if (!timer) return;
    if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
      cancel();
    }
  });

  el.addEventListener("pointerup", cancel);
  el.addEventListener("pointerleave", cancel);
  el.addEventListener("pointercancel", cancel);

  // Suppress the click that follows a long-press so it doesn't also fire
  // the tap-to-focus handler.
  el.addEventListener(
    "click",
    (e) => {
      if (firedLongPress) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true,
  );
}

// ============================================================================
// 2. UI LOCKERS
// ============================================================================

export function lockUI() {
  if (DOM.submitBtn) DOM.submitBtn.classList.add("is-locked");
  if (DOM.replayBtn) DOM.replayBtn.classList.add("is-locked");
}

export function unlockUI() {
  if (DOM.submitBtn) DOM.submitBtn.classList.remove("is-locked");
  if (DOM.replayBtn) DOM.replayBtn.classList.remove("is-locked");
}

// ============================================================================
// 3. CORE RENDERERS
// ============================================================================

/**
 * NEW: Paints the "thin header" style metadata strip: level badge, metre,
 * bar count, and remaining plays. None of this was previously wired up.
 */
export function renderMeta(state) {
  const config = state.activeConfig;
  if (!config) return;

  if (DOM.levelBadge) {
    DOM.levelBadge.textContent = `Level ${state.currentLevel}`;
  }
  if (DOM.metreDisplay) {
    DOM.metreDisplay.textContent = `Metre: ${config.metre}`;
  }
  if (DOM.barsDisplay) {
    DOM.barsDisplay.textContent = `Bars: ${config.bars}`;
  }
  if (DOM.playsRemaining) {
    const remaining = Math.max(0, state.maxPlays - state.playCount);
    DOM.playsRemaining.textContent = `${remaining}/${state.maxPlays}`;
  }
}

/**
 * Count-in indicator (overlays the replay button, which is locked/
 * unclickable during count-in anyway). audio.js has always dispatched
 * "audio-countdown-beat"/"audio-countdown-finish" for exactly this, but
 * nothing ever listened for them — the count-in itself was correctly
 * timed, there was just no way to *see* it, only try to count raw chime
 * sounds by ear. Wired up in initialiseCoreUI().
 */
function renderCountdownBeat(beat) {
  if (!DOM.countdownIndicator) return;
  DOM.countdownIndicator.textContent = beat;
  DOM.countdownIndicator.setAttribute("data-state", "counting");

  // Retrigger the pulse animation even if the same beat number repeats
  // (won't happen in practice, but keeps this robust either way).
  DOM.countdownIndicator.classList.remove("is-pulsing");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      DOM.countdownIndicator.classList.add("is-pulsing");
    });
  });
}

/*
 * Countdown finishes exactly when real playback starts (both scheduled at
 * the same Transport time in audio.js), so hiding immediately here is what
 * keeps the count-in to exactly ticksPerBar beats. An earlier version held
 * a "GO" state on screen for another 500ms after this — visually reading
 * as a 5th beat tacked onto e.g. a 4-beat count-in, which made it
 * impossible to tell whether the exercise's own beat 1 was silent (a rest)
 * or just hadn't happened yet.
 */
function hideCountdownIndicator() {
  if (!DOM.countdownIndicator) return;
  DOM.countdownIndicator.setAttribute("data-state", "hidden");
}

/**
 * V1's beat-pulse: a gentle scale pulse on whichever box is currently
 * sounding during playback, so the user can visually track which beat
 * they're on (especially useful for an ambiguous rest, which is silent
 * either way). audio.js has always dispatched a per-beat event during
 * playback, but its payload never included which tick it was for, so
 * nothing could target a specific box — wired up in initialiseCoreUI().
 */
function renderBeatPulse(tickIndex) {
  const box = DOM.workspace?.querySelector(
    `.workspace-box[data-tick-index="${tickIndex}"]`,
  );
  if (!box) return;

  // Retrigger cleanly even if the box pulsed very recently (double rAF
  // avoids a forced synchronous reflow, same pattern as the countdown).
  box.classList.remove("is-pulsing");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      box.classList.add("is-pulsing");
    });
  });
}

/**
 * NEW: Restores the V1 "incomplete board" feedback pass — a horizontal
 * frustration shake on every bar, plus a crimson halo pulse on every
 * still-empty slot. This existed in the monolith's evaluateSubmission()
 * but was dropped when that function was split into a pure engine.js
 * function (which can't touch the DOM) and a caller in app.js (which
 * never picked up this half of the logic).
 */
export function triggerIncompleteBoardFeedback() {
  if (!DOM.workspace) return;
  const boxes = DOM.workspace.querySelectorAll(".workspace-box:not([data-state='disabled'])");
  boxes.forEach((box) => {
    box.classList.remove("is-shaking");
    // Double rAF avoids a forced synchronous reflow when re-triggering the animation.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        box.classList.add("is-shaking");
      });
    });
  });

  // Which cells count as "missing" depends on which submission is
  // currently active — rhythm's still-empty placeholder cards during
  // RHYTHM phase, or genuinely-unfilled (not a rest, which is never
  // fillable) solfège cells during PITCH phase.
  const missingSlots =
    sessionState.exercisePhase === "PITCH"
      ? DOM.workspace.querySelectorAll(
          ".solfege-card__cell:not(.is-filled):not(.is-rest)",
        )
      : DOM.workspace.querySelectorAll(".workspace-card--rhythm.is-placeholder");
  missingSlots.forEach((card) => card.classList.add("is-empty-panic"));

  setTimeout(() => {
    boxes.forEach((box) => box.classList.remove("is-shaking"));
    missingSlots.forEach((card) => card.classList.remove("is-empty-panic"));
  }, 500);
}

/**
 * NEW: Keeps the custom level dropdown's active item + button label in sync
 * with sessionState.currentLevel, regardless of *how* the level changed
 * (manual dropdown click, celebration modal auto-advance, or tour).
 */
export function syncLevelDropdown(levelId) {
  if (!DOM.levelBtn || !DOM.levelItems) return;

  DOM.levelItems.forEach((item) => {
    const isActive = parseInt(item.getAttribute("data-value"), 10) === levelId;
    item.classList.toggle("is-active", isActive);
  });

  // Only touch the text node so we don't clobber the dropdown's SVG icon.
  const labelNode = Array.from(DOM.levelBtn.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE,
  );
  if (labelNode) labelNode.textContent = `Level ${levelId} `;
}

export function renderStreakTracker(streakCount) {
  if (!DOM.streakTracker) return;
  DOM.streakTracker.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "streak-dot";
    if (i < streakCount) dot.classList.add("is-success");
    DOM.streakTracker.appendChild(dot);
  }
}

/**
 * Clears a reel track element and appends one pad per item, built by
 * `buildPad`. Shared by the rhythm and solfège reels so the DOM setup
 * (clearing, appending, nothing else) lives in exactly one place even
 * though the two pad shapes (SVG+label vs. plain syllable text) don't.
 */
function renderReelTrack(trackEl, items, buildPad) {
  if (!trackEl) return;
  trackEl.innerHTML = "";
  items.forEach((item) => trackEl.appendChild(buildPad(item)));
}

/**
 * Renders one .motif-pad button per allowed motif into a given reel track
 * element. Used for both the main practice reel and the vignette's mirrored
 * reel, so both stay visually and behaviourally identical.
 */
function renderReelInto(trackEl, allowedMotifs) {
  renderReelTrack(trackEl, allowedMotifs, (motifId) => {
    const motifData = MOTIF_LIBRARY[motifId];
    const btn = document.createElement("button");
    btn.className = "motif-pad";
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-label", motifData.label);
    btn.innerHTML = `<div class="motif-pad__svg">${renderRhythmSVG(motifId)}</div><span class="motif-pad__label">${motifData.label}</span>`;

    // No PLAYING guard — selecting from the reel during playback is allowed.
    btn.addEventListener("click", () => {
      btn.dispatchEvent(
        new CustomEvent("action-select-motif", {
          bubbles: true,
          detail: { motifId },
        }),
      );
    });

    return btn;
  });
}

export function renderMotifReel(allowedMotifs) {
  renderReelInto(DOM.motifReel, allowedMotifs);
  sessionState.allowedMotifs = allowedMotifs;
}

/**
 * Renders one .solfege-pad button per syllable in the exercise's active
 * toneset into a given reel track element — the solfège-phase counterpart
 * to renderReelInto, sharing its DOM setup via renderReelTrack but with no
 * SVG (a solfège pad is just its syllable, rendered as text).
 */
function renderSolfegeReelInto(trackEl, toneset) {
  renderReelTrack(trackEl, toneset, (syllable) => {
    const btn = document.createElement("button");
    btn.className = "solfege-pad";
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-label", syllable);
    btn.innerHTML = `<span class="solfege-pad__label">${syllable}</span>`;

    btn.addEventListener("click", () => {
      btn.dispatchEvent(
        new CustomEvent("action-select-pitch", {
          bubbles: true,
          detail: { syllable },
        }),
      );
    });

    return btn;
  });
}

export function renderSolfegeReel(toneset) {
  renderSolfegeReelInto(DOM.motifReel, toneset);
}

/**
 * Populates a solfege card with one cell per column, filling in whatever
 * syllable pitchSubmission already has at that column's index (or leaving
 * it empty, same convention as rhythm's placeholder state). columnTemplate/
 * restColumns come from rhythm-notation.js — box A uses getColumnTemplate/
 * getRestColumns, a tieContinuation extension box uses their
 * getExtension*() counterparts — so this function itself doesn't need to
 * know which box it's rendering.
 */
function renderSolfegeCard(
  solfegeCard,
  columnTemplate,
  restColumns,
  pitchSubmission,
  startIndex,
) {
  solfegeCard.innerHTML = "";
  if (restColumns.length === 0) return;
  solfegeCard.style.gridTemplateColumns = columnTemplate;

  let pitchCursor = startIndex;
  restColumns.forEach((isRest) => {
    const cell = document.createElement("div");
    cell.className = "solfege-card__cell";

    if (isRest) {
      // Distinguishes "empty because this column is never fillable" from
      // "empty because the student hasn't placed a syllable here yet" —
      // triggerIncompleteBoardFeedback needs that distinction so it doesn't
      // flag a rest column as a missing answer.
      cell.classList.add("is-rest");
    } else {
      const cellIndex = pitchCursor;
      const syllable = pitchSubmission?.[cellIndex];
      if (syllable) {
        cell.textContent = syllable;
        cell.classList.add("is-filled");
        // Placement itself is reel-pad-click auto-advance-to-first-empty-
        // slot (see the action-select-pitch handler in app.js) — clicking
        // a filled cell here is only ever a clear, mirroring rhythm's
        // clear-on-click-a-filled-card gesture.
        cell.addEventListener("click", () => {
          cell.dispatchEvent(
            new CustomEvent("action-clear-pitch", {
              bubbles: true,
              detail: { index: cellIndex },
            }),
          );
        });
      }
      pitchCursor++;
    }

    solfegeCard.appendChild(cell);
  });
}

function countMotifSoundingNotes(motifId) {
  const motif = MOTIF_LIBRARY[motifId];
  let count = 0;
  (motif.playback || []).forEach((_, i) => {
    if (!motif.restMask?.[i]) count++;
  });
  return count;
}

/**
 * The pitchSubmission cursor at the start of a given onset tick's own
 * (box A) content — walks userSubmission from the top, advancing by each
 * prior motif's FULL sounding-note count (restMask-aware, same rule
 * engine.js's countSoundingNotes uses) every time an onset tick is passed.
 * Ticks holding an "_ext" token don't themselves advance anything here —
 * their motif already did, at its own onset tick.
 */
function pitchOnsetStartIndex(userSubmission, tickIndex) {
  let cursor = 0;
  for (let i = 0; i < tickIndex; i++) {
    const token = userSubmission[i];
    if (!token || token.endsWith("_ext")) continue;
    cursor += countMotifSoundingNotes(token);
  }
  return cursor;
}

/**
 * The pitchSubmission cursor at the start of an extension tick's OWN
 * (post-box-A) content — right after however many syllables box A itself
 * displayed. No motif in the current vocabulary spans more than 2 boxes,
 * so the extension tick's own onset is always the immediately preceding
 * tick.
 */
function pitchExtensionStartIndex(userSubmission, tickIndex) {
  const onsetTickIndex = tickIndex - 1;
  const onsetToken = userSubmission[onsetTickIndex];
  const boxADisplayedCount = getRestColumns(onsetToken).filter(
    (isRest) => !isRest,
  ).length;
  return (
    pitchOnsetStartIndex(userSubmission, onsetTickIndex) + boxADisplayedCount
  );
}

/**
 * Builds one workspace box (rhythm card + solfege placeholder card) for a
 * given tick index. tickIndex maps 1:1 onto state.userSubmission — each box
 * is one beat, not one bar, so a 4/4 exercise needs 4 boxes per bar.
 */
function buildWorkspaceBox(state, tickIndex) {
  const box = document.createElement("div");
  box.className = "workspace-box";
  box.setAttribute("data-tick-index", tickIndex);

  const isActive = tickIndex < state.activeConfig.totalTicks;
  const token = isActive ? state.userSubmission[tickIndex] : null;
  const isExtension = typeof token === "string" && token.endsWith("_ext");
  // Rhythm is confirmed correct by the time PITCH phase starts (that's the
  // only way to get here) — its cards stay visible but stop being
  // targetable/editable, so the student can still see their confirmed
  // answer while working on solfège.
  const isReadOnly = state.exercisePhase === "PITCH";

  if (!isActive) {
    box.setAttribute("data-state", "disabled");
  } else if (isExtension) {
    box.setAttribute("data-state", "extension");
  } else if (isReadOnly) {
    box.setAttribute("data-state", "readonly");
  }

  if (isActive && state.slotStates[tickIndex] === "success") {
    box.setAttribute("data-feedback", "success");
  } else if (isActive && state.slotStates[tickIndex] === "error") {
    box.setAttribute("data-feedback", "error");
  }

  if (isActive && tickIndex === state.selectedSlotIndex) {
    box.classList.add("is-focused");
  }

  const container = document.createElement("div");
  container.className = "workspace-box__container";

  const rhythmCard = document.createElement("div");
  rhythmCard.className = "workspace-card workspace-card--rhythm";
  rhythmCard.setAttribute("aria-label", `Beat ${tickIndex + 1} rhythm slot`);

  const solfegeCard = document.createElement("div");
  solfegeCard.className = "workspace-card workspace-card--solfege";
  solfegeCard.setAttribute("aria-label", `Beat ${tickIndex + 1} solfege slot`);

  if (isActive && isExtension) {
    rhythmCard.classList.add("is-tied");
    // A motif's sustained note can still be ringing into this extension
    // box (syncopa v2's box B, first half) rather than the box being fully
    // silent — that gets a tie-arc mark instead of the default flat dash.
    const baseMotifId = token.slice(0, -"_ext".length);
    if (MOTIF_LIBRARY[baseMotifId]?.tieContinuation) {
      rhythmCard.classList.add("is-tie-arc");
      rhythmCard.innerHTML = renderTieArcSVG();
      // The trailing note past box A's cutoff (e.g. syncopa v2's final
      // quaver) still needs its own syllable slot - it's a real sounding
      // note the student has to place, it just doesn't fit in box A.
      renderSolfegeCard(
        solfegeCard,
        getExtensionColumnTemplate(baseMotifId),
        getExtensionRestColumns(baseMotifId),
        state.pitchSubmission,
        pitchExtensionStartIndex(state.userSubmission, tickIndex),
      );
    }
  } else if (isActive && token) {
    rhythmCard.innerHTML = renderRhythmSVG(token);
    rhythmCard.classList.add("is-filled");
    renderSolfegeCard(
      solfegeCard,
      getColumnTemplate(token),
      getRestColumns(token),
      state.pitchSubmission,
      pitchOnsetStartIndex(state.userSubmission, tickIndex),
    );
  } else if (isActive) {
    rhythmCard.classList.add("is-placeholder");
  }

  container.appendChild(rhythmCard);
  container.appendChild(solfegeCard);
  box.appendChild(container);

  if (isActive && !isExtension && !isReadOnly) {
    box.addEventListener("click", () => {
      box.dispatchEvent(
        new CustomEvent("action-target-slot", {
          bubbles: true,
          detail: { index: tickIndex },
        }),
      );
    });
    attachLongPress(box, () => openVignette(tickIndex));
  }

  return box;
}

function renderWorkspacePagerDots(pageCount) {
  const navEl = document.getElementById("ui-workspace-pager-nav");
  if (!DOM.workspaceDots || !navEl) return;

  DOM.workspaceDots.innerHTML = "";
  // data-state, not the hidden attribute — workspace.css's .workspace-pager__nav
  // sets display:flex, which (like Accordion's grid trick) always beats the UA
  // stylesheet's [hidden] { display: none }, so hidden alone silently no-ops.
  navEl.setAttribute("data-state", pageCount <= 1 ? "hidden" : "visible");
  if (pageCount <= 1) return;

  for (let i = 0; i < pageCount; i++) {
    const dot = document.createElement("span");
    dot.className = "workspace-pager__dot";
    if (i === 0) dot.setAttribute("data-state", "active");
    DOM.workspaceDots.appendChild(dot);
  }
}

/**
 * Scrolls the workspace pager by one page and keeps the dots in sync.
 * IntersectionObserver (rather than a scroll listener) tracks which page is
 * actually centred, so swipe gestures update the dots too, not just the
 * prev/next buttons.
 */
function initialiseWorkspacePager() {
  const prevBtn = document.getElementById("btn-workspace-page-prev");
  const nextBtn = document.getElementById("btn-workspace-page-next");
  if (!DOM.workspace || !prevBtn || !nextBtn) return;

  const scrollByPage = (direction) => {
    DOM.workspace.scrollBy({
      left: direction * DOM.workspace.clientWidth,
      behavior: "smooth",
    });
  };

  prevBtn.addEventListener("click", () => scrollByPage(-1));
  nextBtn.addEventListener("click", () => scrollByPage(1));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const pages = Array.from(DOM.workspace.querySelectorAll(".workspace-page"));
        const activeIndex = pages.indexOf(entry.target);
        DOM.workspaceDots
          ?.querySelectorAll(".workspace-pager__dot")
          .forEach((dot, i) => {
            if (i === activeIndex) dot.setAttribute("data-state", "active");
            else dot.removeAttribute("data-state");
          });
      });
    },
    { root: DOM.workspace, threshold: 0.6 },
  );

  // Re-observe on every render since renderWorkspace() replaces the pages.
  const mutationObserver = new MutationObserver(() => {
    observer.disconnect();
    DOM.workspace
      .querySelectorAll(".workspace-page")
      .forEach((page) => observer.observe(page));
  });
  mutationObserver.observe(DOM.workspace, { childList: true });
}

/**
 * Reel prev/next buttons — scroll by roughly one card's width (the first
 * card plus the reel's own gap) rather than a fixed page width, since
 * unlike the workspace pager this reel isn't split into discrete pages.
 * Each button disables itself at its scroll extreme instead of staying
 * clickable past the end; a MutationObserver re-checks after every render
 * since the reel's contents (and therefore its scrollWidth) are replaced
 * per exercise. Only #ui-motif-reel has nav buttons — the vignette's
 * mirrored reel (#vignette-reel) doesn't, so it needs no wiring here.
 */
function initialiseReelNav(trackEl, prevBtn, nextBtn) {
  if (!trackEl || !prevBtn || !nextBtn) return;

  const cardScrollDistance = () => {
    const firstCard = trackEl.firstElementChild;
    if (!firstCard) return trackEl.clientWidth;
    const gap = parseFloat(getComputedStyle(trackEl).columnGap) || 0;
    return firstCard.getBoundingClientRect().width + gap;
  };

  const updateDisabledState = () => {
    const maxScroll = trackEl.scrollWidth - trackEl.clientWidth;
    prevBtn.disabled = trackEl.scrollLeft <= 1;
    nextBtn.disabled = trackEl.scrollLeft >= maxScroll - 1;
  };

  prevBtn.addEventListener("click", () => {
    trackEl.scrollBy({ left: -cardScrollDistance(), behavior: "smooth" });
  });
  nextBtn.addEventListener("click", () => {
    trackEl.scrollBy({ left: cardScrollDistance(), behavior: "smooth" });
  });

  trackEl.addEventListener("scroll", updateDisabledState);
  new MutationObserver(updateDisabledState).observe(trackEl, {
    childList: true,
  });

  updateDisabledState();
}

export function renderWorkspace(state) {
  if (!DOM.workspace) return;
  const config = state.activeConfig;
  if (!config) return;

  DOM.workspace.innerHTML = "";

  const pageCount = Math.max(1, Math.ceil(config.totalTicks / TICKS_PER_PAGE));

  for (let page = 0; page < pageCount; page++) {
    const pageEl = document.createElement("div");
    pageEl.className = "workspace-page";

    const gridEl = document.createElement("div");
    gridEl.className = "workspace-grid grid";
    gridEl.style.setProperty(
      "--grid-placement",
      barsPerRow(config.ticksPerBar) * config.ticksPerBar,
    );

    for (let i = 0; i < TICKS_PER_PAGE; i++) {
      const tickIndex = page * TICKS_PER_PAGE + i;
      gridEl.appendChild(buildWorkspaceBox(state, tickIndex));
    }

    pageEl.appendChild(gridEl);
    DOM.workspace.appendChild(pageEl);
  }

  renderWorkspacePagerDots(pageCount);
}

// ============================================================================
// FOCUS VIGNETTE (tap-and-hold a workspace box to edit it full-width)
// ============================================================================

export function openVignette(tickIndex) {
  if (!DOM.vignette) return;

  sessionState.selectedSlotIndex = tickIndex;

  const token = sessionState.userSubmission[tickIndex];
  DOM.vignetteFocusedCard.innerHTML = "";

  const rhythmCard = document.createElement("div");
  rhythmCard.className = "workspace-card workspace-card--rhythm";
  const solfegeCard = document.createElement("div");
  solfegeCard.className = "workspace-card workspace-card--solfege";

  if (token) {
    rhythmCard.innerHTML = renderRhythmSVG(token);
    rhythmCard.classList.add("is-filled");
    renderSolfegeCard(
      solfegeCard,
      getColumnTemplate(token),
      getRestColumns(token),
      sessionState.pitchSubmission,
      pitchOnsetStartIndex(sessionState.userSubmission, tickIndex),
    );

    // Clicking the focused card in the vignette clears it, mirroring how
    // the base workspace used to let a tap clear a filled card — that
    // gesture now lives here since a bare tap is "focus", not "clear".
    rhythmCard.addEventListener("click", () => {
      rhythmCard.dispatchEvent(
        new CustomEvent("action-clear-note", {
          bubbles: true,
          detail: { index: tickIndex, motifId: token },
        }),
      );
      closeVignette();
    });
  } else {
    rhythmCard.classList.add("is-placeholder");
  }

  DOM.vignetteFocusedCard.appendChild(rhythmCard);
  DOM.vignetteFocusedCard.appendChild(solfegeCard);

  renderReelInto(DOM.vignetteReel, sessionState.allowedMotifs || []);

  DOM.vignette.setAttribute("data-state", "open");
  document.body.classList.add("has-open-vignette");
}

export function closeVignette() {
  if (!DOM.vignette) return;
  DOM.vignette.setAttribute("data-state", "closed");
  document.body.classList.remove("has-open-vignette");
}

// ============================================================================
// 4. ANIMATIONS & MODALS (Flair Pass)
// ============================================================================

export function triggerCelebrationModal(targetLevelId, startLevelCallback) {
  const overlay = document.createElement("div");
  overlay.className = "celebration-overlay";

  const modal = document.createElement("div");
  modal.className = "celebration-modal";

  let titleText = `Level ${targetLevelId - 1} Mastered! 🚀`;
  let subText = `Sensational ear tracking.<br>Ready to unlock Level ${targetLevelId}?`;
  let actionText = "Onwards! →";

  if (targetLevelId > MAX_LEVEL) {
    titleText = "Grand Masterpiece! 🏆";
    subText =
      "Incredible! You have officially conquered all levels of the rhythmic matrix.";
    actionText = "Play Again 🔄";
  }

  modal.innerHTML = `
    <div class="celebration-title">${titleText}</div>
    <div class="celebration-subtext">${subText}</div>
  `;

  const btn = document.createElement("button");
  btn.className = "button celebration-btn";
  btn.setAttribute("data-variant", "primary");
  btn.innerText = actionText;

  btn.addEventListener("click", () => {
    overlay.classList.remove("is-active");
    setTimeout(() => {
      overlay.remove();
      startLevelCallback(targetLevelId <= MAX_LEVEL ? targetLevelId : 1);
    }, 300);
  });

  modal.appendChild(btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add("is-active");
    });
  });

  fireMasteryConfetti();
}

function fireMasteryConfetti() {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#8b5cf6",
  ];
  const particleCount = 160;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "confetti-particle";
    particle.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = "50vw";
    particle.style.top = "50vh";

    const size = Math.floor(Math.random() * 10) + 6;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.animationDelay = `${Math.random() * 1.5}s`;

    const xDrift = (Math.random() - 0.5) * 1000;
    const yDrop = Math.random() * 500 + 250;
    const rotation = Math.random() * 1080 - 540;

    particle.style.setProperty("--x-drift", `${xDrift}px`);
    particle.style.setProperty("--y-drop", `${yDrop}px`);
    particle.style.setProperty("--rotation", `${rotation}deg`);

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 5500);
  }
}

// ============================================================================
// 5. ONBOARDING TOUR WIZARD
// ============================================================================

let tourCurrentStepIndex = 0;
let activeTourSteps = [];

function compileTourSequence() {
  const isMobileViewport = window.innerWidth < 1024;
  return [
    {
      elementId: isMobileViewport ? "btn-toggle-sidebar" : "ui-sidebar",
      text: isMobileViewport
        ? "Welcome! Tap this hamburger menu button at any time to open up your Kodály reference table."
        : "Welcome to Solfaic! This is your reference guide. Check your rhythmic solfege and notation rules here.",
      mobilePosition: "bottom",
    },
    {
      elementId: "btn-replay",
      text: "Step 1: Hit this 'play' button to listen to your next phrase. Be sure to listen carefully, you only get 3 attempts!",
      mobilePosition: "bottom",
    },
    {
      elementId: "ui-workspace",
      text: "Step 2: This is your workspace. Your chosen rhythm cards will assemble here. Tap a card to remove it, or tap an empty slot to prepare it for a new card.",
      mobilePosition: "bottom",
    },
    {
      elementId: "ui-motif-selector",
      text: "Step 3: Choose your rhythm cards from this menu. Drag 'em, click 'em, or tap a highlighted slot to place 'em. Remember, some cards are more than one beat long!",
      mobilePosition: "top",
    },
    {
      elementId: "btn-submit",
      text: "Step 4: Once you're done, smash this button here to see if you got it right. Three successive correct answers will take you to the next level. Good luck!",
      mobilePosition: "top",
    },
  ];
}

export function startGuidedTour() {
  const promptEl = document.getElementById("ui-tour-prompt");
  const tooltipEl = document.getElementById("ui-tour-tooltip");
  if (promptEl) promptEl.classList.add("is-hidden");
  if (tooltipEl) tooltipEl.classList.remove("is-hidden");

  activeTourSteps = compileTourSequence();
  tourCurrentStepIndex = 0;

  window.addEventListener("click", handleGlobalTourProgression);
  window.addEventListener("keydown", handleGlobalTourKeydown);

  executeTourStepPass();
}

function executeTourStepPass() {
  const tourOverlayElement = document.getElementById("ui-tour");
  const tooltipBox = document.getElementById("ui-tour-tooltip");
  const textBox = document.getElementById("ui-tour-text");

  if (tooltipBox) tooltipBox.style.opacity = "0";

  document.querySelectorAll(".tour-highlight-active").forEach((el) => {
    el.classList.remove("tour-highlight-active");
  });

  if (tourCurrentStepIndex >= activeTourSteps.length) {
    setTimeout(() => {
      if (tooltipBox) tooltipBox.classList.add("is-hidden");
      if (tourOverlayElement) tourOverlayElement.classList.add("is-hidden");
    }, 200);

    window.removeEventListener("click", handleGlobalTourProgression);
    window.removeEventListener("keydown", handleGlobalTourKeydown);
    localStorage.setItem("solfaic_onboarded_matrix", "true");
    triggerTourCompletionModal();
    return;
  }

  const currentStep = activeTourSteps[tourCurrentStepIndex];
  const targetElement = document.getElementById(currentStep.elementId);

  if (targetElement) {
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      targetElement.classList.add("tour-highlight-active");
      if (textBox) textBox.innerHTML = currentStep.text;

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipWidth = window.innerWidth < 1024 ? 280 : 320;

      if (tooltipBox) {
        tooltipBox.classList.remove("is-mobile-top", "is-mobile-bottom");
        tooltipBox.style.display = "block";
        const tooltipHeight = tooltipBox.offsetHeight;

        let computedLeft;
        let computedTop;

        if (window.innerWidth < 1024) {
          if (currentStep.mobilePosition === "top")
            tooltipBox.classList.add("is-mobile-top");
          else tooltipBox.classList.add("is-mobile-bottom");

          tooltipBox.style.left = "50%";
          tooltipBox.style.top = "auto";
        } else {
          if (currentStep.elementId === "ui-sidebar") {
            computedLeft = targetRect.right + 24;
            computedTop = targetRect.top + window.scrollY + 120;
          } else {
            computedLeft =
              targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
            computedLeft = Math.max(
              10,
              Math.min(computedLeft, window.innerWidth - tooltipWidth - 10),
            );
            computedTop =
              targetRect.top + window.scrollY + targetRect.height + 16;

            if (targetRect.bottom + tooltipHeight + 30 > window.innerHeight) {
              computedTop =
                targetRect.top + window.scrollY - tooltipHeight - 16;
            }
          }
          tooltipBox.style.left = `${computedLeft}px`;
          tooltipBox.style.top = `${computedTop}px`;
        }
      }

      if (tourOverlayElement) {
        tourOverlayElement.style.alignItems = "flex-start";
        tourOverlayElement.style.justifyContent = "flex-start";
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (tooltipBox) tooltipBox.style.opacity = "1";
        });
      });
    }, 320);
  } else {
    setTimeout(() => {
      if (textBox) textBox.innerHTML = currentStep.text;
      if (tourOverlayElement) {
        tourOverlayElement.style.alignItems = "center";
        tourOverlayElement.style.justifyContent = "center";
      }
      if (tooltipBox) {
        tooltipBox.style.position = "static";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            tooltipBox.style.opacity = "1";
          });
        });
      }
    }, 200);
  }
}

function handleGlobalTourProgression() {
  tourCurrentStepIndex++;
  executeTourStepPass();
}

function handleGlobalTourKeydown(e) {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    tourCurrentStepIndex++;
    executeTourStepPass();
  }
}

export function terminateTourImmediately() {
  const tourOverlay = document.getElementById("ui-tour");
  const tooltipBox = document.getElementById("ui-tour-tooltip");
  if (tourOverlay) tourOverlay.classList.add("is-hidden");
  if (tooltipBox) tooltipBox.classList.add("is-hidden");
  localStorage.setItem("solfaic_onboarded_matrix", "true");
}

function triggerTourCompletionModal() {
  const overlay = document.createElement("div");
  overlay.className = "celebration-overlay";

  const modal = document.createElement("div");
  modal.className = "celebration-modal";

  modal.innerHTML = `
    <div class="celebration-title">You're Ready!</div>
    <div class="celebration-subtext">Your interactive dictation workspace is fully unlocked and ready for practice.<br><br>Good luck, Maestro! 🎻</div>
  `;

  const btn = document.createElement("button");
  btn.className = "button celebration-btn";
  btn.setAttribute("data-variant", "primary");
  btn.innerText = "Let's Begin! 🚀";

  btn.addEventListener("click", () => {
    overlay.classList.remove("is-active");
    setTimeout(() => overlay.remove(), 300);
  });

  modal.appendChild(btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add("is-active");
    });
  });
}

// ============================================================================
// 6. GLOBAL UI INITIALISATION (Sidebar & Overlays)
// ============================================================================

export function initialiseCoreUI() {
  initialiseWorkspacePager();
  initialiseReelNav(
    DOM.motifReel,
    document.querySelector(".practice-reel__nav--prev"),
    document.querySelector(".practice-reel__nav--next"),
  );

  // Count-in indicator — purely reactive to audio.js's own events, no
  // state/business logic involved, so it's self-contained here rather
  // than routed through app.js.
  document.addEventListener("audio-countdown-beat", (e) => {
    renderCountdownBeat(e.detail.beat);
  });
  document.addEventListener("audio-countdown-finish", () => {
    hideCountdownIndicator();
  });
  document.addEventListener("audio-pulse-beat", (e) => {
    renderBeatPulse(e.detail.tickIndex);
  });

  // Primary Nav (mobile collapse toggle)
  const navToggle = document.getElementById("btn-toggle-nav");
  const navMenu = document.getElementById("site-nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.getAttribute("data-state") === "open";
      navMenu.setAttribute("data-state", isOpen ? "closed" : "open");
      navToggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
  }

  // Level Select (Classroom's Level Guides dropdown) — selecting a level
  // shows that level's guide content and doubles as a filter for the
  // Kodály Reference Matrix table below it, so there's exactly one control
  // doing both jobs instead of two separate, easy-to-desync pickers.
  const levelSelectTrigger = document.getElementById("btn-level-dropdown");
  const levelSelectMenu = document.getElementById("menu-level-dropdown");
  const matrixTable = document.querySelector(".curriculum-table");
  const matrixEmptyState = document.getElementById("matrix-empty-state");
  const matrixStatus = document.getElementById("matrix-filter-status");

  const filterMatrixByLevel = (levelId) => {
    if (!matrixTable) return;
    const rows = matrixTable.querySelectorAll("tbody tr");
    let visibleCount = 0;

    rows.forEach((row) => {
      const matches = row.getAttribute("data-level") === levelId;
      row.hidden = !matches;
      if (matches) visibleCount++;
    });

    if (matrixStatus) {
      matrixStatus.textContent = `Showing Level ${levelId} only.`;
      matrixStatus.setAttribute("data-filtered", "true");
    }

    if (matrixEmptyState) matrixEmptyState.hidden = visibleCount > 0;
    matrixTable.hidden = visibleCount === 0;
  };

  if (levelSelectTrigger && levelSelectMenu) {
    const levelSelectItems = levelSelectMenu.querySelectorAll(
      ".level-select__item",
    );

    const closeLevelSelect = () => {
      levelSelectMenu.setAttribute("data-state", "closed");
      levelSelectTrigger.setAttribute("aria-expanded", "false");
    };

    levelSelectTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = levelSelectMenu.getAttribute("data-state") === "open";
      levelSelectMenu.setAttribute("data-state", isOpen ? "closed" : "open");
      levelSelectTrigger.setAttribute(
        "aria-expanded",
        isOpen ? "false" : "true",
      );
    });

    levelSelectItems.forEach((item) => {
      item.addEventListener("click", () => {
        const levelId = item.getAttribute("data-value");

        levelSelectItems.forEach((i) => i.classList.remove("is-active"));
        item.classList.add("is-active");

        const labelNode = Array.from(levelSelectTrigger.childNodes).find(
          (node) => node.nodeType === Node.TEXT_NODE,
        );
        if (labelNode) {
          labelNode.textContent = `Level ${levelId} `;
        }

        document.querySelectorAll(".level-guide").forEach((guide) => {
          guide.hidden = guide.id !== `level-guide-${levelId}`;
        });

        filterMatrixByLevel(levelId);
        closeLevelSelect();
      });
    });

    document.addEventListener("click", closeLevelSelect);

    // Sync the table to whichever level is active by default (Level 1)
    // instead of only filtering after the first selection.
    const initialItem = levelSelectMenu.querySelector(".level-select__item.is-active");
    if (initialItem) filterMatrixByLevel(initialItem.getAttribute("data-value"));
  }

  // Focus Vignette (tap-and-hold a workspace box)
  const vignetteCloseBtn = document.querySelector(".vignette-overlay__close");
  if (vignetteCloseBtn) {
    vignetteCloseBtn.addEventListener("click", closeVignette);
  }
  if (DOM.vignette) {
    DOM.vignette.addEventListener("click", (e) => {
      if (e.target === DOM.vignette) closeVignette();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.code === "Escape" && DOM.vignette?.getAttribute("data-state") === "open") {
      closeVignette();
    }
  });

  // Compliance Modals (native <dialog> — migrated from manual div show/hide)
  const openTriggers = document.querySelectorAll("[data-open-target]");
  openTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const modalId = trigger.getAttribute("data-open-target");
      const dialog = document.getElementById(modalId);
      if (dialog && typeof dialog.showModal === "function") {
        dialog.showModal();
      }
    });
  });

  const closeButtons = document.querySelectorAll(".compliance-close-btn");
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close-target");
      const dialog = document.getElementById(modalId);
      if (dialog && typeof dialog.close === "function") {
        dialog.close();
      }
    });
  });

  // Click-outside-to-close: a click that lands on the <dialog> element
  // itself (rather than bubbling up from a child) means it landed on the
  // ::backdrop, since the dialog's own box is exactly its rendered content.
  document.querySelectorAll("dialog.modal").forEach((dialog) => {
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  });

  // Global Keydown Router for Accessibility
  document.addEventListener("keydown", (e) => {
    // Stage Manager catches keyboard shortcuts and translates them to UI clicks
    if (document.querySelector(".celebration-overlay.is-active")) return;
    if (sessionState.currentState === "PLAYING") return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        if (
          DOM.replayBtn &&
          !DOM.replayBtn.disabled &&
          !DOM.replayBtn.classList.contains("is-locked")
        ) {
          DOM.replayBtn.click();
        }
        break;
      case "Enter":
        e.preventDefault();
        if (DOM.submitBtn && !DOM.submitBtn.classList.contains("is-locked"))
          DOM.submitBtn.click();
        break;
      case "Backspace": {
        e.preventDefault();
        // Clears the last filled box directly (Backspace means "undo the
        // last placement", not "focus it") — active boxes carry no
        // data-state at all, only disabled/extension ones do.
        const boxes = document.querySelectorAll(
          "#ui-workspace .workspace-box:not([data-state])",
        );
        for (let i = boxes.length - 1; i >= 0; i--) {
          const tickIndex = parseInt(boxes[i].getAttribute("data-tick-index"), 10);
          const token = sessionState.userSubmission[tickIndex];
          if (token) {
            boxes[i].dispatchEvent(
              new CustomEvent("action-clear-note", {
                bubbles: true,
                detail: { index: tickIndex, motifId: token },
              }),
            );
            break;
          }
        }
        break;
      }
    }

    if (e.key >= "1" && e.key <= "9") {
      const motifIndex = parseInt(e.key) - 1;
      const motifPads = document.querySelectorAll(
        "#ui-motif-reel .motif-pad",
      );
      if (motifPads[motifIndex]) {
        motifPads[motifIndex].click();
        motifPads[motifIndex].classList.add("is-active");
        setTimeout(
          () => motifPads[motifIndex].classList.remove("is-active"),
          150,
        );
      }
    }
  });
}
