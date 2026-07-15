/**
 * Cached DOM Node References
 * Looking up elements via document.getElementById is slow.
 * We do it once here and store the references to boost runtime performance.
 */
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
  // REMOVED: skipBtn handle
  // INJECTED: Interactive Change Interceptor Node
  levelSelect: document.getElementById("control-level-select"),
  // DROPDOWN LEVEL SELECTOR: Allows the user to jump to any level
  levelBtn: document.getElementById("btn-level-dropdown"),
  levelMenu: document.getElementById("menu-level-dropdown"),
  levelItems: document.querySelectorAll(".dropdown-item"),
};

// ============================================================================
// 5. SUCCESS CELEBRATION MODALS
// ============================================================================

// Animation Attribution:
// Keyframe physics and spring-based transition logic adapted from
// Josh Comeau's 'Whimsical Animations' documentation.

function triggerCelebrationModal(targetLevelId) {
  const overlay = document.createElement("div");
  overlay.className = "celebration-overlay";

  const modal = document.createElement("div");
  modal.className = "celebration-modal";

  let titleText = `Level ${sessionState.currentLevel} Mastered! 🚀`;
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
      startLevel(targetLevelId <= 3 ? targetLevelId : 1);
    }, 300);
  });

  modal.appendChild(btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // LIGHTHOUSE FIX: Use requestAnimationFrame instead of forced layout recalculation
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
    setTimeout(() => particle.remove(), 5500); // Cleanup memory
  }
}

// ============================================================================
// 6. ONBOARDING TOUR WIZARD (The Fluid Mobile Anchor Logic)
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
      mobilePosition: "bottom", // Dictates CSS safe-area override intents
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

function startGuidedTour() {
  document.getElementById("ui-tour-prompt").classList.add("is-hidden");
  document.getElementById("ui-tour-tooltip").classList.remove("is-hidden");

  activeTourSteps = compileTourSequence();
  tourCurrentStepIndex = 0;

  // Add global progression interceptors
  window.addEventListener("click", handleGlobalTourProgression);
  window.addEventListener("keydown", handleGlobalTourKeydown);

  executeTourStepPass();
}

function executeTourStepPass() {
  const tourOverlayElement = document.getElementById("ui-tour");
  const tooltipBox = document.getElementById("ui-tour-tooltip");
  const textBox = document.getElementById("ui-tour-text");

  // 1. Immediately drop opacity to 0 so it fades out BEFORE moving
  if (tooltipBox) tooltipBox.style.opacity = "0";

  // Clear previous highlight rings
  document.querySelectorAll(".tour-highlight-active").forEach((el) => {
    el.classList.remove("tour-highlight-active");
  });

  // Escape condition: Tour is complete
  if (tourCurrentStepIndex >= activeTourSteps.length) {
    setTimeout(() => {
      tooltipBox.classList.add("is-hidden");
      tourOverlayElement.classList.add("is-hidden");
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
    // Scroll element into view safely while tooltip is invisible
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

    // Wait for the scrolling physics to settle AND the fade-out to finish
    setTimeout(() => {
      targetElement.classList.add("tour-highlight-active");

      // FIX: Inject the new text NOW, while the box is invisible!
      textBox.innerHTML = currentStep.text;

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipWidth = window.innerWidth < 1024 ? 280 : 320;

      tooltipBox.classList.remove("is-mobile-top", "is-mobile-bottom");
      tooltipBox.style.display = "block";
      const tooltipHeight = tooltipBox.offsetHeight;

      let computedLeft;
      let computedTop;

      if (window.innerWidth < 1024) {
        // MOBILE OVERRIDES
        if (currentStep.mobilePosition === "top")
          tooltipBox.classList.add("is-mobile-top");
        else tooltipBox.classList.add("is-mobile-bottom");

        tooltipBox.style.left = "50%";
        tooltipBox.style.top = "auto";
      } else {
        // DESKTOP OVERRIDES
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
            computedTop = targetRect.top + window.scrollY - tooltipHeight - 16;
          }
        }

        // Teleport to precise coordinates
        tooltipBox.style.left = `${computedLeft}px`;
        tooltipBox.style.top = `${computedTop}px`;
      }

      tourOverlayElement.style.alignItems = "flex-start";
      tourOverlayElement.style.justifyContent = "flex-start";

      // LIGHTHOUSE FIX: Safely trigger animation without forcing reflow
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tooltipBox.style.opacity = "1";
        });
      });
    }, 320);
  } else {
    // Fallback if target element doesn't exist
    setTimeout(() => {
      textBox.innerHTML = currentStep.text; // Safe fallback injection
      tourOverlayElement.style.alignItems = "center";
      tourOverlayElement.style.justifyContent = "center";
      tooltipBox.style.position = "static";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tooltipBox.style.opacity = "1";
        });
      });
    }, 200);
  }
}

function handleGlobalTourProgression() {
  tourCurrentStepIndex++;
  executeTourStepPass();
}

function handleGlobalTourKeydown(e) {
  // Intercepting Space/Enter allows quick, game-like traversal of the UI instruction cards
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    tourCurrentStepIndex++;
    executeTourStepPass();
  }
}

function terminateTourImmediately() {
  document.getElementById("ui-tour").classList.add("is-hidden");
  if (document.getElementById("ui-tour-tooltip"))
    document.getElementById("ui-tour-tooltip").classList.add("is-hidden");
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

  // LIGHTHOUSE FIX: Replaced offsetHeight reflow hack
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add("is-active");
    });
  });
}

// ==========================================================================
// ACCESSIBILITY: GLOBAL HOTKEY ROUTING
// ==========================================================================
document.addEventListener("keydown", (e) => {
  // 1. Prevent hotkeys from firing if the user has a modal open or game is locked
  if (sessionState.playbackState === "LOCKED") return;

  switch (e.code) {
    case "Space": {
      // Prevent the spacebar from scrolling the page downwards
      e.preventDefault();
      const playBtn = document.getElementById("btn-replay");
      // Only click if it's not disabled (out of tokens)
      if (playBtn && !playBtn.disabled) playBtn.click();
      break;
    }
    case "Enter": {
      e.preventDefault();
      const submitBtn = document.getElementById("btn-submit");
      if (submitBtn) submitBtn.click();
      break;
    }
    case "Backspace": {
      e.preventDefault();

      // 1. Grab the individual clickable CARDS, not the measure bars!
      const workspaceCards = document.querySelectorAll(
        "#ui-workspace .workspace-card",
      );

      // 2. Loop backwards to find the last placed note or extension
      for (let i = workspaceCards.length - 1; i >= 0; i--) {
        // If the card does NOT have 'is-placeholder', it is holding a note (or an error)
        if (!workspaceCards[i].classList.contains("is-placeholder")) {
          workspaceCards[i].click(); // Safely trigger your exact removal logic
          break; // Stop immediately so we only delete one beat per keystroke
        }
      }
      break;
    }
  }

  // 2. Map Number Keys (1-9) to the Motif Selection Pads
  if (e.key >= "1" && e.key <= "9") {
    const motifIndex = parseInt(e.key) - 1; // '1' becomes index 0

    // Find all currently rendered motif buttons in the switcher
    const motifPads = document.querySelectorAll(
      "#ui-motif-selector .motif-pad",
    );

    if (motifPads[motifIndex]) {
      // Trigger the exact same click event as if the user tapped it
      motifPads[motifIndex].click();

      // Add a quick flash effect so the user knows it registered
      motifPads[motifIndex].classList.add("is-active");
      setTimeout(
        () => motifPads[motifIndex].classList.remove("is-active"),
        150,
      );
    }
  }
});
