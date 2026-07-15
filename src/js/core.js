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
      e.dataTransfer.setData("text/plain", motifId);
    });

    // Mobile / Click Engine hooks
    btn.addEventListener("click", () => {
      // Stage Manager calls out the cue: "A motif was selected!"
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

  // Render the inner scrolling track to hold the dashed border (The Reel primitive)
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

      card.addEventListener("dragover", (e) => e.preventDefault());
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        const motifId = e.dataTransfer.getData("text/plain");
        // Dispatch Custom Event for Drops
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
  let subText = `Sensational!<br>Ready to unlock Level ${targetLevelId}?`;
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
      // The Conductor passed this callback, allowing core.js to trigger the next level
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
// 5. GLOBAL UI INITIALISATION (Sidebar, Tour, Overlays)
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

  // Compliance Overlays
  const closeButtons = document.querySelectorAll(".compliance-close-btn");
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const modalId = btn.getAttribute("data-close-target");
      const activeOverlay = document.getElementById(modalId);
      if (activeOverlay) {
        activeOverlay.classList.remove("is-visible");
        setTimeout(() => activeOverlay.classList.add("is-hidden"), 250);
      }
    });
  });

  // Global Keydown Router for Accessibility
  document.addEventListener("keydown", (e) => {
    // Stage Manager catches keyboard shortcuts and translates them to UI clicks
    if (document.querySelector(".celebration-overlay.is-active")) return;

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
      case "Backspace":
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
