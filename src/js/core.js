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

import { MOTIF_LIBRARY } from "./data.js";
import { sessionState } from "./state.js";

// ============================================================================
// 1. DOM CACHE
// ============================================================================

export const DOM = {
  levelBadge: document.getElementById("ui-level-badge"),
  streakTracker: document.getElementById("ui-streak-tracker"),
  replayBtn: document.getElementById("btn-replay"),
  playsRemaining: document.getElementById("ui-plays-remaining"),
  workspace: document.getElementById("ui-workspace"),
  motifSelector: document.getElementById("ui-motif-selector"),
  submitBtn: document.getElementById("btn-submit"),
  metreDisplay: document.getElementById("ui-metre-display"),
  barsDisplay: document.getElementById("ui-bars-display"),
  levelSelect: document.getElementById("control-level-select"),
  levelBtn: document.getElementById("btn-level-dropdown"),
  levelMenu: document.getElementById("menu-level-dropdown"),
  levelItems: document.querySelectorAll(".dropdown-item"),
};

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
    DOM.playsRemaining.textContent = `Plays remaining: ${remaining} / ${state.maxPlays}`;
  }
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
  const bars = DOM.workspace.querySelectorAll(".workspace-bar");
  bars.forEach((bar) => {
    bar.classList.remove("is-shaking");
    // Double rAF avoids a forced synchronous reflow when re-triggering the animation.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.classList.add("is-shaking");
      });
    });
  });

  const missingSlots = DOM.workspace.querySelectorAll(
    ".workspace-card.is-placeholder",
  );
  missingSlots.forEach((card) => card.classList.add("is-empty-panic"));

  setTimeout(() => {
    bars.forEach((bar) => bar.classList.remove("is-shaking"));
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

export function renderMotifSelector(allowedMotifs) {
  if (!DOM.motifSelector) return;
  DOM.motifSelector.innerHTML = "";

  allowedMotifs.forEach((motifId) => {
    const motifData = MOTIF_LIBRARY[motifId];
    const btn = document.createElement("button");
    btn.className = "motif-pad";

    btn.innerHTML = motifData.svg
      ? `<div class="svg-container">${motifData.svg}</div> ${motifData.label}`
      : `<span class="music-font">${motifData.symbol}</span> ${motifData.label}`;

    // Desktop Drag Engine hooks
    btn.setAttribute("draggable", "true");
    btn.addEventListener("dragstart", (e) => {
      if (sessionState.currentState === "PLAYING") return e.preventDefault();
      e.dataTransfer.setData("text/plain", motifId);
    });

    // Mobile / Click Engine hooks
    btn.addEventListener("click", () => {
      if (sessionState.currentState === "PLAYING") return;
      btn.dispatchEvent(
        new CustomEvent("action-select-motif", {
          bubbles: true,
          detail: { motifId },
        }),
      );
    });

    DOM.motifSelector.appendChild(btn);
  });
}

export function renderWorkspace(state) {
  if (!DOM.workspace) return;
  DOM.workspace.innerHTML = "";
  const config = state.activeConfig;

  // Render the inner scrolling track to hold the dashed border
  const scrollTrack = document.createElement("div");
  scrollTrack.className = "workspace-scroll-track";

  const bars = [];
  for (let i = 0; i < config.bars; i++) {
    const barDiv = document.createElement("div");
    barDiv.className = "workspace-bar";
    bars.push(barDiv);
    scrollTrack.appendChild(barDiv);
  }

  DOM.workspace.appendChild(scrollTrack);

  // Iterate through state data and append structural DOM cards to bars
  state.userSubmission.forEach((token, index) => {
    const currentBarIndex = Math.floor(index / config.ticksPerBar);

    if (currentBarIndex < bars.length) {
      const card = document.createElement("div");

      if (state.slotStates[index] === "success")
        card.classList.add("is-success");
      else if (state.slotStates[index] === "error")
        card.classList.add("is-error");

      card.addEventListener("dragover", (e) => {
        if (sessionState.currentState === "PLAYING") return;
        e.preventDefault();
      });
      card.addEventListener("drop", (e) => {
        if (sessionState.currentState === "PLAYING") return;
        e.preventDefault();
        const motifId = e.dataTransfer.getData("text/plain");
        card.dispatchEvent(
          new CustomEvent("action-insert-motif", {
            bubbles: true,
            detail: { index, motifId },
          }),
        );
      });

      // Condition A: Empty Hole
      if (token === null) {
        card.className += " workspace-card is-placeholder";
        card.innerHTML = `<div class="svg-container">•</div>`;
        card.title = "Tap to highlight target, or drag note here";

        if (index === state.selectedSlotIndex)
          card.classList.add("is-targeted");

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          card.dispatchEvent(
            new CustomEvent("action-target-slot", {
              bubbles: true,
              detail: { index },
            }),
          );
        });
      }
      // Condition B: Extension Spacer
      else if (token.endsWith("_ext")) {
        const rootId = token.replace("_ext", "");
        card.className += " workspace-card is-extension";
        card.innerHTML = `<div class="svg-container" style="font-size: 1.5rem; color: var(--color-text-muted); font-weight:800;">—</div>`;

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          card.dispatchEvent(
            new CustomEvent("action-clear-note", {
              bubbles: true,
              detail: { index, motifId: rootId },
            }),
          );
        });
      }
      // Condition C: Placed Musical Note
      else {
        const motifData = MOTIF_LIBRARY[token];
        card.className += " workspace-card";
        card.innerHTML =
          motifData && motifData.svg
            ? `<div class="svg-container">${motifData.svg}</div>`
            : `<div class="svg-container">${token}</div>`;

        card.addEventListener("click", () => {
          if (sessionState.currentState === "PLAYING") return;
          card.dispatchEvent(
            new CustomEvent("action-clear-note", {
              bubbles: true,
              detail: { index, motifId: token },
            }),
          );
        });
      }

      bars[currentBarIndex].appendChild(card);
    }
  });
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

  if (targetLevelId > 3) {
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
  btn.className = "celebration-btn";
  btn.innerText = actionText;

  btn.addEventListener("click", () => {
    overlay.classList.remove("is-active");
    setTimeout(() => {
      overlay.remove();
      startLevelCallback(targetLevelId <= 3 ? targetLevelId : 1);
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
  btn.className = "celebration-btn";
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
  // Mobile Sidebar Controls
  const sidebarElement = document.getElementById("ui-sidebar");
  const toggleBtn = document.getElementById("btn-toggle-sidebar");
  const closeBtn = document.getElementById("btn-close-sidebar");

  if (toggleBtn)
    toggleBtn.addEventListener("click", () =>
      sidebarElement?.classList.add("is-open"),
    );
  if (closeBtn)
    closeBtn.addEventListener("click", () =>
      sidebarElement?.classList.remove("is-open"),
    );

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
        const workspaceCards = document.querySelectorAll(
          "#ui-workspace .workspace-card",
        );
        for (let i = workspaceCards.length - 1; i >= 0; i--) {
          if (!workspaceCards[i].classList.contains("is-placeholder")) {
            workspaceCards[i].click();
            break;
          }
        }
        break;
      }
    }

    if (e.key >= "1" && e.key <= "9") {
      const motifIndex = parseInt(e.key) - 1;
      const motifPads = document.querySelectorAll(
        "#ui-motif-selector .motif-pad",
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
