// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * SOLFAIC - Playwright End-to-End Test Suite
 */

/**
 * Rhythm/pitch generation draws from Math.random() at every step (metre,
 * form, and each motif/syllable choice), so the exercise a test needs to
 * solve correctly is normally unknowable from outside the page. Forcing
 * Math.random to a stateless constant makes every draw in engine.js
 * reproducible: re-invoking the same generator function (even via a fresh
 * dynamic import, in a separate call from the one the app itself made on
 * load) always replays the identical sequence of "random" choices, so it
 * reveals the exact target the live page is already holding in
 * sessionState. Must be registered before the page navigates, so callers
 * re-navigate after installing it.
 * @param {import('@playwright/test').Page} page
 */
async function goToPracticeWithDeterministicRandom(page) {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/practice.html");
  await page.waitForSelector(".motif-pad");
}

/**
 * The onset-motif labels (reel aria-labels) for the live page's actual rhythm target, Level 1.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
async function getTargetRhythmLabels(page) {
  return page.evaluate(async () => {
    // @ts-ignore -- absolute-path dynamic import resolved by the browser at runtime, not by tsc
    const engine = await import("/src/js/engine.js");
    // @ts-ignore
    const data = await import("/src/js/data.js");
    const { timeline } = engine.generateRhythmTimeline(1);
    return timeline.map(
      (/** @type {{motifId: string}} */ event) =>
        data.MOTIF_LIBRARY[event.motifId].label,
    );
  });
}

/**
 * Fills and submits the rhythm board with the actual correct answer, then waits out the scheduled phase transition.
 * @param {import('@playwright/test').Page} page
 */
async function completeRhythmPhaseCorrectly(page) {
  const labels = await getTargetRhythmLabels(page);
  for (const label of labels) {
    await page.locator(`.motif-pad[aria-label="${label}"]`).click();
  }
  await page.locator("#btn-submit").click();
  // Evaluation render (~instant) + the 1s scheduled enterPitchPhase() call in app.js.
  await page.waitForTimeout(1500);
}

test.describe("Solfaic Interactive Application Suite", () => {
  test.beforeEach(async ({ page }) => {
    // The interactive trainer lives on practice.html; "/" is now a marketing landing page.
    await page.goto("/practice.html");
  });

  test.describe("1. Initialization & UI Routing", () => {
    test("App initializes with Level 1 defaults", async ({ page }) => {
      await expect(page).toHaveTitle(/Solfaic/);
      await expect(page.locator("#ui-level-badge")).toContainText("Level 1");
      await expect(page.locator("#ui-plays-remaining")).toContainText("3/3");

      // Ensure the motif selector is populated
      const motifPads = page.locator(".motif-pad");
      // FIXED: Count the elements first, then assert on the number
      expect(await motifPads.count()).toBeGreaterThan(0);
    });

    // The level dropdown no longer lives on practice.html or drives
    // startLevel() — it moved to classroom.html, where it filters the
    // curriculum guide/reference table instead of switching the active
    // practice exercise (see core.js's Level Select wiring). Practice Room
    // itself has no in-page level switcher; it always boots at Level 1
    // (see app.js's hardcoded startLevel(1)) and only ever advances via the
    // 3-streak celebration modal.
    test("Classroom's level dropdown filters the curriculum guide and reference table", async ({
      page,
    }) => {
      await page.goto("/classroom.html");

      // Level 2, not 3 — Level 3 has a guide but no reference-matrix rows
      // documented yet, which would make "at least one visible row" a
      // false failure unrelated to the filter itself.
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 2" })
        .click();

      // The matching level guide is shown, others hidden.
      await expect(page.locator("#level-guide-2")).toBeVisible();
      await expect(page.locator("#level-guide-1")).toBeHidden();

      // The reference matrix table is filtered down to Level 2's rows only.
      await expect(page.locator("#matrix-filter-status")).toContainText(
        "Showing Level 2 only.",
      );
      const visibleRows = page.locator(
        ".curriculum-table tbody tr:not([hidden])",
      );
      expect(await visibleRows.count()).toBeGreaterThan(0);
      for (const row of await visibleRows.all()) {
        await expect(row).toHaveAttribute("data-level", "2");
      }

      // Verify dropdown closed
      await expect(page.locator("#menu-level-dropdown")).toHaveAttribute(
        "data-state",
        "closed",
      );
    });

    test("Level 4's guide is reachable, and Level 5 shows the guide's empty state", async ({
      page,
    }) => {
      await page.goto("/classroom.html");

      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 4" })
        .click();
      await expect(page.locator("#level-guide-4")).toBeVisible();
      await expect(page.locator("#level-guide-empty-state")).toBeHidden();

      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 5" })
        .click();
      expect(await page.locator(".level-guide:visible").count()).toBe(0);
      await expect(page.locator("#level-guide-empty-state")).toBeVisible();
      await expect(page.locator("#matrix-empty-state")).toBeVisible();
    });
  });

  test.describe("2. Input & Interaction Mechanics", () => {
    test("Mouse/Touch: Clicking a motif pad fills an empty workspace slot", async ({
      page,
    }) => {
      const firstPad = page.locator(".motif-pad").first();
      const firstSlot = page.locator(".workspace-card").first();

      // Verify slot is initially empty
      await expect(firstSlot).toHaveClass(/is-placeholder/);

      // Click pad
      await firstPad.click();

      // Verify slot is now filled
      await expect(firstSlot).not.toHaveClass(/is-placeholder/);
    });

    test("Keyboard Accessibility: Number keys inject motifs and Backspace clears them", async ({
      page,
    }) => {
      const firstSlot = page.locator(".workspace-card").first();

      // Press '1' to inject the first motif
      await page.keyboard.press("Digit1");
      await expect(firstSlot).not.toHaveClass(/is-placeholder/);

      // Press 'Backspace' to clear it via your surgical removal logic
      await page.keyboard.press("Backspace");
      await expect(firstSlot).toHaveClass(/is-placeholder/);
    });
  });

  test.describe("3. Validation & Error Workflows", () => {
    test("Submitting an incomplete board triggers empty-panic animations", async ({
      page,
    }) => {
      // Immediately submit without filling the board
      await page.locator("#btn-submit").click();

      // Check if the panic class was applied to the placeholders
      const firstEmptySlot = page
        .locator(".workspace-card.is-placeholder")
        .first();
      await expect(firstEmptySlot).toHaveClass(/is-empty-panic/);
    });

    test("Submitting a fully filled board processes validation", async ({
      page,
    }) => {
      const placeholders = page.locator(".workspace-card.is-placeholder");

      // 1. Guarantee the board has at least started rendering
      await expect(placeholders.first()).toBeVisible();

      // 2. Keep clicking the first motif UNTIL the placeholders run out
      const firstMotif = page.locator(".motif-pad").first();
      while ((await placeholders.count()) > 0) {
        await firstMotif.click();
      }

      // 3. Ensure no placeholders remain
      await expect(placeholders).toHaveCount(0);

      // 4. Submit the sequence
      await page.locator("#btn-submit").click();

      // 5. Verify the validation engine ran — feedback lands as a
      // data-feedback attribute on the parent .workspace-box, not a class
      // on .workspace-card (that changed with the two-phase rhythm/pitch
      // rework; see buildWorkspaceBox in core.js).
      const firstEvaluatedBox = page.locator(".workspace-box").first();
      await expect(firstEvaluatedBox).toHaveAttribute(
        "data-feedback",
        /(success|error)/,
      );
    });
  });

  test.describe("4. Audio Context & Thread Locking", () => {
    test("Triggering audio locks the replay button temporarily", async ({
      page,
    }) => {
      const replayBtn = page.locator("#btn-replay");

      // Click replay
      await replayBtn.click();

      // Verify the UI locks down to prevent double-firing
      await expect(replayBtn).toHaveClass(/is-locked/);
    });
  });

  test.describe("5. Two-Phase Rhythm -> Pitch Flow", () => {
    test("A correct rhythm submission transitions the board into the solfège pitch phase", async ({
      page,
    }) => {
      await goToPracticeWithDeterministicRandom(page);
      await completeRhythmPhaseCorrectly(page);

      // The Starting Note modal blocks interaction while the student
      // previews the exercise's first pitch — the clearest signal the
      // Conductor actually entered PITCH phase (see enterPitchPhase in app.js).
      await expect(page.locator("#modal-starting-note")).toBeVisible();

      // The reel swaps from rhythm motifs to solfège syllables.
      await expect(page.locator(".motif-pad")).toHaveCount(0);
      expect(await page.locator(".solfege-pad").count()).toBeGreaterThan(0);

      // Confirmed rhythm boxes stay visible but become read-only — the
      // student can still see their confirmed rhythm while working the
      // solfège pass over the same exercise.
      const readOnlyBoxes = page.locator('.workspace-box[data-state="readonly"]');
      expect(await readOnlyBoxes.count()).toBeGreaterThan(0);
    });
  });

  test.describe("6. Escalating Feedback & Remediation Modals", () => {
    test("First wrong attempt shows Try Again; second names what to practise and reveals the answer", async ({
      page,
    }) => {
      await goToPracticeWithDeterministicRandom(page);

      // Under the forced seed the correct rhythm target is always the
      // reel's first pad, repeated — so filling the board from the SECOND
      // pad instead is a guaranteed, reproducible wrong answer.
      const wrongPad = page.locator(".motif-pad").nth(1);
      const placeholders = page.locator(".workspace-card.is-placeholder");
      while ((await placeholders.count()) > 0) {
        await wrongPad.click();
      }

      // --- First wrong submission: "Try Again", streak untouched ---
      await page.locator("#btn-submit").click();
      await expect(page.locator("#modal-try-again")).toBeVisible();
      const errorBoxes = page.locator('.workspace-box[data-feedback="error"]');
      expect(await errorBoxes.count()).toBeGreaterThan(0);

      await page.locator("#btn-try-again-continue").click();
      await expect(page.locator("#modal-try-again")).toBeHidden();

      // --- Second wrong submission (same still-wrong board): Practice modal ---
      await page.locator("#btn-submit").click();
      await expect(page.locator("#modal-practice")).toBeVisible();
      await expect(page.locator("#practice-title")).toContainText("practise");
      expect(
        await page.locator(".feedback-modal__card").count(),
      ).toBeGreaterThan(0);

      // Dismissing it paints the correct answer on the board before the
      // exercise resets (showAnswerThenRestart in app.js). That correction
      // runs off the dialog's `close` EVENT (see core.js's announceOnClose),
      // which — unlike the `open` attribute's removal — the HTML spec fires
      // as a separate queued task, not synchronously with close(). So the
      // dialog can already report hidden before the correction has actually
      // landed; wait for the correction marker itself instead.
      await page.locator("#btn-practice-continue").click();
      const correctedBoxes = page.locator(
        '.workspace-box[data-feedback="corrected"]',
      );
      await expect(correctedBoxes.first()).toBeAttached();
      expect(await correctedBoxes.count()).toBeGreaterThan(0);
    });
  });

  test.describe("7. Solfège Card Colours", () => {
    test("Each reachable syllable gets its own distinct reel-pad colour", async ({
      page,
    }) => {
      await goToPracticeWithDeterministicRandom(page);
      await completeRhythmPhaseCorrectly(page);

      const pads = page.locator(".solfege-pad");
      const count = await pads.count();
      expect(count).toBeGreaterThan(0);

      const colors = await pads.evaluateAll((els) =>
        els.map((el) => el.style.getPropertyValue("--pad-color")),
      );

      // Every pad actually resolved to a colour...
      for (const color of colors) {
        expect(color).toBeTruthy();
      }
      // ...and no two syllables in the same toneset share one, so the reel
      // reads as genuinely distinguishable rather than several shades of
      // the same brownish tone.
      expect(new Set(colors).size).toBe(colors.length);
    });
  });

  test.describe("8. Metre-Aware Workspace Grid", () => {
    test("The grid's bars-per-row packing matches the exercise's actual ticksPerBar", async ({
      page,
    }) => {
      // No determinism needed here — the assertion re-derives the expected
      // value from the SAME live config the page itself generated, so it
      // holds for whichever metre this particular load happened to draw.
      const gridPlacement = await page
        .locator(".workspace-grid")
        .first()
        .evaluate((el) => getComputedStyle(el).getPropertyValue("--grid-placement"));

      const ticksPerBar = await page.evaluate(async () => {
        // @ts-ignore -- absolute-path dynamic import resolved by the browser at runtime, not by tsc
        const state = await import("/src/js/state.js");
        return state.sessionState.activeConfig.ticksPerBar;
      });

      // Mirrors barsPerRow()'s own formula in core.js: as many whole bars
      // as fit within a ~4-box-wide reference, never fewer than one.
      const expectedBarsPerRow = Math.max(1, Math.floor(4 / ticksPerBar));
      const expectedPlacement = expectedBarsPerRow * ticksPerBar;

      expect(Number(gridPlacement)).toBe(expectedPlacement);
    });
  });
});
