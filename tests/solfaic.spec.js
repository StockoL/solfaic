// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * SOLFAIC - Playwright End-to-End Test Suite
 */

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
});
