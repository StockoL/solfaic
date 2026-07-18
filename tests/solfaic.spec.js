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

  test.describe("9. Classroom Level Panels", () => {
    test("Presentation shows Level 1's 3 new motifs and 5 new syllables as real notation/colour circles", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await expect(
        page.locator("#presentation-content .motif-pad"),
      ).toHaveCount(3);
      await expect(
        page.locator("#presentation-content .solfege-pad"),
      ).toHaveCount(5);
      // Real notation, not placeholder boxes — each motif card renders an
      // actual inline SVG via renderRhythmSVG.
      const svgCount = await page
        .locator("#presentation-content .motif-pad svg")
        .count();
      expect(svgCount).toBe(3);
    });

    test("Presentation shows the 'no new solfège' message at Level 4, not empty circles or the unavailable badge", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 4" })
        .click();

      // Rhythm still has real new content at Level 4.
      expect(
        await page.locator("#presentation-content .motif-pad").count(),
      ).toBeGreaterThan(0);
      await expect(
        page.locator("#presentation-content .solfege-pad"),
      ).toHaveCount(0);
      await expect(
        page.locator("#presentation-content .text-muted"),
      ).toContainText("No new solfège this level");
      await expect(
        page.locator("#panel-presentation .panel-unavailable"),
      ).toHaveCount(0);
    });

    test("Level 5 shows the shared 'not yet available' state across all five panels", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 5" })
        .click();

      await expect(page.locator(".panel-unavailable")).toHaveCount(5);
      const badges = page.locator(".panel-unavailable .badge");
      for (const badge of await badges.all()) {
        await expect(badge).toContainText("Not yet available");
      }
    });

    test("Rhythm Workshop plays the selected motif, not just any motif", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await expect(
        page.locator("#rhythm-workshop-content .motif-pad"),
      ).toHaveCount(3);

      // Select the 2nd pad instead of leaving the default 1st selected, so
      // this can't pass by coincidence if the click handler is wired to a
      // stale/wrong element.
      await page.locator("#rhythm-workshop-content .motif-pad").nth(1).click();
      const selectedId = await page
        .locator("#rhythm-workshop-content .motif-pad.is-selected")
        .getAttribute("aria-label");

      // Intercept the live singleton's playOstinato rather than checking
      // "some call happened" — confirms the exact content/repeatCount
      // classroom.js actually passed, not just that a click fired.
      await page.evaluate(async () => {
        // @ts-ignore -- absolute-path dynamic import resolved by the browser at runtime, not by tsc
        const audio = await import("/src/js/audio.js");
        // @ts-ignore -- test-only global bridging the page's callback back to the Node/Playwright side
        window.__ostinatoCalls = [];
        audio.AudioEngine.playOstinato = (
          /** @type {any} */ content,
          /** @type {any} */ repeatCount,
          /** @type {any} */ tonic,
        ) => {
          // @ts-ignore
          window.__ostinatoCalls.push({ content, repeatCount, tonic });
          return Promise.resolve();
        };
      });

      await page
        .locator("#rhythm-workshop-content")
        .getByRole("button", { name: "Play Ostinato" })
        .click();

      // @ts-ignore -- __ostinatoCalls is a test-only global set above
      const calls = await page.evaluate(() => window.__ostinatoCalls);
      expect(calls).toHaveLength(1);
      expect(calls[0].repeatCount).toBe(4);
      // The played content is a motif ID string whose label matches the
      // selected pad — not the first pad, confirming selection state (not
      // a hardcoded default) drives what actually plays.
      const { MOTIF_LIBRARY } = await page.evaluate(async () => {
        // @ts-ignore -- absolute-path dynamic import resolved by the browser at runtime, not by tsc
        const data = await import("/src/js/data.js");
        return { MOTIF_LIBRARY: data.MOTIF_LIBRARY };
      });
      expect(MOTIF_LIBRARY[calls[0].content].label).toBe(selectedId);
    });

    test("Melodic Workshop shows Level 3's one new syllable and plays the selected one", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 3" })
        .click();

      // Level 3 introduces exactly one new syllable (fa) -- see the engine
      // harness's own getNewlyIntroducedSyllables coverage for this level.
      await expect(
        page.locator("#melodic-workshop-content .solfege-pad"),
      ).toHaveCount(1);
      await expect(
        page.locator("#melodic-workshop-content .solfege-pad"),
      ).toHaveAttribute("aria-label", "fa");

      await page.evaluate(async () => {
        // @ts-ignore -- absolute-path dynamic import resolved by the browser at runtime, not by tsc
        const audio = await import("/src/js/audio.js");
        // @ts-ignore -- test-only global bridging the page's callback back to the Node/Playwright side
        window.__ostinatoCalls = [];
        audio.AudioEngine.playOstinato = (
          /** @type {any} */ content,
          /** @type {any} */ repeatCount,
          /** @type {any} */ tonic,
        ) => {
          // @ts-ignore
          window.__ostinatoCalls.push({ content, repeatCount, tonic });
          return Promise.resolve();
        };
      });
      await page
        .locator("#melodic-workshop-content")
        .getByRole("button", { name: "Play Ostinato" })
        .click();

      // @ts-ignore -- __ostinatoCalls is a test-only global set above
      const calls = await page.evaluate(() => window.__ostinatoCalls);
      expect(calls).toHaveLength(1);
      expect(calls[0].content).toEqual(["fa"]);
      expect(calls[0].repeatCount).toBe(4);
      expect(typeof calls[0].tonic).toBe("string");
    });

    test("Melodic Workshop shows the 'no new solfège' message at Level 4, not empty content", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 4" })
        .click();

      await expect(
        page.locator("#melodic-workshop-content .solfege-pad"),
      ).toHaveCount(0);
      await expect(
        page.locator("#melodic-workshop-content .text-muted"),
      ).toContainText("No new solfège this level");
    });

    test("Example plays a freshly generated phrase and reports its metre/bars, across every playable level", async ({
      page,
    }) => {
      await page.goto("/classroom.html");

      for (const level of [1, 2, 3, 4]) {
        if (level > 1) {
          await page.locator("#btn-level-dropdown").click();
          await page
            .locator(".level-select__item")
            .filter({ hasText: `Level ${level}` })
            .click();
        }
        await expect(page.locator("#example-content .text-muted")).toHaveText(
          "Press play to hear a generated phrase.",
        );
        await page.locator("#example-content button").click();
        await expect(
          page.locator("#example-content .text-muted"),
        ).toContainText(/\d\/\d time, \d+ bars?/);
      }
    });

    test("Level 5's Example shows the unavailable state, no Play button", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 5" })
        .click();

      await expect(
        page.locator("#example-content .panel-unavailable"),
      ).toBeVisible();
      await expect(page.locator("#example-content button")).toHaveCount(0);
    });

    test("Workshop pads are keyboard-selectable with Space, not just clickable", async ({
      page,
    }) => {
      // core.js's global keydown router (Practice Room's Space=replay/
      // Enter=submit shortcuts) used to call e.preventDefault() on every
      // Space/Enter press page-wide, which silently broke native
      // button activation for any focused button anywhere, including
      // these pads. Only caught via a real keyboard press -- a
      // Playwright .click() bypasses the native keyboard path entirely
      // and would pass even with the bug present.
      await page.goto("/classroom.html");
      const secondPad = page.locator("#rhythm-workshop-content .motif-pad").nth(1);
      await secondPad.focus();
      await page.keyboard.press("Space");
      await expect(secondPad).toHaveAttribute("aria-pressed", "true");
      await expect(secondPad).toHaveClass(/is-selected/);
    });

    test("Interval Detective plays the actual target pair and names the interval on a correct guess", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await expect(
        page.locator("#interval-detective-content .solfege-pad"),
      ).toHaveCount(5); // Level 1's cumulative toneset: so, mi, la, do, re

      await page.evaluate(async () => {
        // @ts-ignore -- absolute-path dynamic import resolved by the browser at runtime, not by tsc
        const audio = await import("/src/js/audio.js");
        // @ts-ignore -- test-only global bridging the page's callback back to the Node/Playwright side
        window.__ostinatoCalls = [];
        audio.AudioEngine.playOstinato = (
          /** @type {any} */ content,
          /** @type {any} */ repeatCount,
          /** @type {any} */ tonic,
        ) => {
          // @ts-ignore
          window.__ostinatoCalls.push({ content, repeatCount, tonic });
          return Promise.resolve();
        };
      });

      await page
        .locator("#interval-detective-content")
        .getByRole("button", { name: "Play Interval" })
        .click();

      // @ts-ignore -- __ostinatoCalls is a test-only global set above
      const calls = await page.evaluate(() => window.__ostinatoCalls);
      expect(calls).toHaveLength(1);
      expect(calls[0].repeatCount).toBe(1);
      const [syllableA, syllableB] = calls[0].content;
      expect(syllableA).not.toBe(syllableB);

      // Click exactly the played pair -- confirms both that a correct
      // guess is recognised AND that the interval name in the feedback
      // corresponds to the ACTUAL pair that played, not a hardcoded string.
      await page
        .locator(`#interval-detective-content .solfege-pad[data-syllable="${syllableA}"]`)
        .click();
      await page
        .locator(`#interval-detective-content .solfege-pad[data-syllable="${syllableB}"]`)
        .click();

      const feedback = page.locator("#interval-detective-content .text-muted");
      await expect(feedback).toContainText("Correct!");
      await expect(feedback).toContainText(syllableA);
      await expect(feedback).toContainText(syllableB);
      await expect(
        page.locator(
          `#interval-detective-content .solfege-pad[data-syllable="${syllableA}"]`,
        ),
      ).toHaveClass(/is-correct/);
    });

    test("Interval Detective names what to practise on a wrong guess, without crashing the flow", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page
        .locator("#interval-detective-content")
        .getByRole("button", { name: "Play Interval" })
        .click();

      // Click two syllables guaranteed distinct from each other -- whether
      // or not they happen to be the real target, this exercises the
      // "not correct" or "correct" path without needing to intercept
      // playOstinato first; either way the flow must not crash and must
      // always reveal an interval name.
      const pads = page.locator("#interval-detective-content .solfege-pad");
      await pads.nth(0).click();
      await pads.nth(1).click();

      const feedback = page.locator("#interval-detective-content .text-muted");
      await expect(feedback).toContainText(/Correct!|Not quite\./);
      await expect(feedback).toContainText(
        /Unison|Minor 2nd|Major 2nd|Minor 3rd|Major 3rd|Perfect 4th|Tritone|Perfect 5th|Minor 6th|Major 6th|Minor 7th|Major 7th|Octave/,
      );
    });

    test("Level 5's Interval Detective shows the unavailable state", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 5" })
        .click();

      await expect(
        page.locator("#interval-detective-content .panel-unavailable"),
      ).toBeVisible();
      await expect(
        page.locator("#interval-detective-content .solfege-pad"),
      ).toHaveCount(0);
    });
  });
});
