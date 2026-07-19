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
    // curriculum guide instead of switching the active practice exercise
    // (see core.js's Level Select wiring). Practice Room itself has no
    // in-page level switcher; it always boots at Level 1 (see app.js's
    // hardcoded startLevel(1)) and only ever advances via the 3-streak
    // celebration modal.
    test("Classroom's level dropdown filters the curriculum guide", async ({
      page,
    }) => {
      await page.goto("/classroom.html");

      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 2" })
        .click();

      // The matching level guide is shown, others hidden.
      await expect(page.locator("#level-guide-2")).toBeVisible();
      await expect(page.locator("#level-guide-1")).toBeHidden();

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

    // Safety net for the iPhone-only "workspace boxes render inconsistent
    // sizes, varying per row" bug — NOT a substitute for the on-device
    // Safari Web Inspector session that bug actually needs. Chromium (what
    // this project runs) doesn't reproduce WebKit's own subpixel-rounding
    // behaviour, and Practice Room always boots at Level 1 (2 bars, never
    // enough boxes to paginate), so this only ever exercises single-page,
    // single-row consistency here. Still worth having: it locks in that
    // every box shares one column-track sizing formula, so a future change
    // that reintroduced per-row/per-page size drift in ANY engine would
    // be caught, even though it can't catch the specific WebKit bug itself.
    test("Every rendered workspace box shares the same computed width", async ({
      page,
    }) => {
      await page.goto("/practice.html");
      await page.waitForSelector(".workspace-box");

      const widths = await page
        .locator(".workspace-box")
        .evaluateAll((boxes) =>
          boxes
            .filter((box) => getComputedStyle(box).display !== "none")
            .map((box) => box.getBoundingClientRect().width),
        );

      expect(widths.length).toBeGreaterThan(0);
      const [first, ...rest] = widths;
      for (const width of rest) {
        expect(Math.abs(width - first)).toBeLessThanOrEqual(1);
      }
    });
  });

  test.describe("9. Classroom Level Panels", () => {
    test("Preparation/Presentation/Practice tabs show the correct content, and Preparation is unavailable at every level", async ({
      page,
    }) => {
      await page.goto("/classroom.html");

      // Presentation is the default active tab.
      await expect(page.locator("#tab-presentation")).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(page.locator("#tabpanel-presentation")).toBeVisible();
      await expect(page.locator("#tabpanel-preparation")).toBeHidden();
      await expect(page.locator("#tabpanel-practice")).toBeHidden();

      // Preparation: no content exists for any level yet, so it shows the
      // unavailable state even at Level 1, unlike Presentation/Practice.
      await page.locator("#tab-preparation").click();
      await expect(page.locator("#tab-preparation")).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(page.locator("#tab-presentation")).toHaveAttribute(
        "aria-selected",
        "false",
      );
      await expect(page.locator("#tabpanel-preparation")).toBeVisible();
      await expect(page.locator("#tabpanel-presentation")).toBeHidden();
      await expect(
        page.locator("#tabpanel-preparation .panel-unavailable"),
      ).toBeVisible();

      // Practice bundles the four drill panels behind its own tab.
      await page.locator("#tab-practice").click();
      await expect(page.locator("#tabpanel-practice")).toBeVisible();
      await expect(page.locator("#tabpanel-preparation")).toBeHidden();
      await expect(page.locator("#panel-rhythm-workshop")).toBeVisible();
      await expect(page.locator("#panel-interval-detective")).toBeVisible();
    });

    // The tab strip is too wide to sit on one line on a narrow viewport
    // (Preparation + Presentation + Practice overflow it), and previously
    // ran off-screen instead of wrapping. .classroom-tabs now carries the
    // .cluster composition class (the same flex-wrap layout primitive used
    // for every other reel/group in this app), rather than a bespoke fix,
    // so Practice should drop to a second row instead of overflowing.
    test("The tab strip wraps to a second row on a narrow viewport instead of overflowing", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto("/classroom.html");

      const preparationBox = await page.locator("#tab-preparation").boundingBox();
      const presentationBox = await page.locator("#tab-presentation").boundingBox();
      const practiceBox = await page.locator("#tab-practice").boundingBox();
      expect(preparationBox).not.toBeNull();
      expect(presentationBox).not.toBeNull();
      expect(practiceBox).not.toBeNull();

      // Preparation and Presentation still share the first row...
      expect(
        Math.abs(
          /** @type {any} */ (preparationBox).y - /** @type {any} */ (presentationBox).y,
        ),
      ).toBeLessThan(5);
      // ...while Practice wraps below them, not off the right edge of the
      // viewport (which would leave its x + width beyond 320).
      expect(/** @type {any} */ (practiceBox).y).toBeGreaterThan(
        /** @type {any} */ (preparationBox).y + 5,
      );
      expect(
        /** @type {any} */ (practiceBox).x + /** @type {any} */ (practiceBox).width,
      ).toBeLessThanOrEqual(320);
    });

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

    // Regression test for the tum-ti rendering bug: playback was already
    // correct, but the shared display-pad builder only ever rendered a
    // tied motif's first box, silently dropping its tie-arc continuation.
    // Locks in the specific distinction that matters -- only motifs with
    // MOTIF_LIBRARY[id].tieContinuation (tum-ti, syncopa v2) get a second
    // box, not every 2-tick motif (too/too-rest span 2 ticks too, but their
    // single held notehead already conveys the full duration on its own).
    test("tum-ti and syncopa render both boxes in Presentation and Rhythm Workshop; too stays a single box", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 2" })
        .click();

      for (const containerId of [
        "presentation-content",
        "rhythm-workshop-content",
      ]) {
        const container = page.locator(`#${containerId}`);
        for (const label of ["tum-ti", "syncopa"]) {
          const pair = container.locator(
            `.motif-pad-pair:has(.motif-pad[aria-label="${label}"])`,
          );
          await expect(pair).toHaveCount(1);
          await expect(pair.locator("svg")).toHaveCount(2);
          await expect(pair.locator(".motif-pad-extension")).toHaveCount(1);
        }

        // too spans 2 ticks like tum-ti/syncopa but has no tieContinuation
        // — single box, no pair wrapper, exactly one SVG.
        const tooPad = container.locator('.motif-pad[aria-label="too"]');
        await expect(tooPad).toHaveCount(1);
        await expect(
          container.locator('.motif-pad-pair:has(.motif-pad[aria-label="too"])'),
        ).toHaveCount(0);
        await expect(tooPad.locator("svg")).toHaveCount(1);
      }
    });

    test("Rhythm Workshop groups Level 2's new motifs into Simple Time and Compound Time", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#tab-practice").click();
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 2" })
        .click();

      const container = page.locator("#rhythm-workshop-content");
      await expect(container.getByRole("heading", { name: "Simple Time" })).toBeVisible();
      await expect(container.getByRole("heading", { name: "Compound Time" })).toBeVisible();

      const { MOTIF_LIBRARY } = await page.evaluate(async () => {
        // @ts-ignore -- absolute-path dynamic import resolved by the browser at runtime, not by tsc
        const data = await import("/src/js/data.js");
        return { MOTIF_LIBRARY: data.MOTIF_LIBRARY };
      });

      // Every pad rendered under each heading actually matches that
      // group's type — not just that two headings happen to exist.
      for (const [headingText, expectedType] of [
        ["Simple Time", "simple"],
        ["Compound Time", "compound"],
      ]) {
        const heading = container.getByRole("heading", { name: headingText });
        const section = heading.locator("xpath=..");
        const labels = await section
          .locator(".motif-pad[aria-label]")
          .evaluateAll((pads) => pads.map((p) => p.getAttribute("aria-label")));
        expect(labels.length).toBeGreaterThan(0);
        for (const label of labels) {
          const motif = Object.values(MOTIF_LIBRARY).find(
            (m) => /** @type {any} */ (m).label === label,
          );
          expect(/** @type {any} */ (motif).type).toBe(expectedType);
        }
      }
    });

    // .classroom-panel's separator border lives on the NEXT panel's top
    // edge, not this one's own bottom edge -- without a matching
    // padding-block-end, a panel's own last content (Melodic Workshop's
    // solfege circles, Example's Play button) sat flush against the
    // following panel's border line with no gap at all.
    test("Practice tab panels don't touch the separator rule of the panel after them", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#tab-practice").click();

      const melodicLastPad = page
        .locator("#melodic-workshop-content .solfege-pad")
        .last();
      const examplePanelBox = await page.locator("#panel-example").boundingBox();
      const melodicPadBox = await melodicLastPad.boundingBox();
      expect(examplePanelBox).not.toBeNull();
      expect(melodicPadBox).not.toBeNull();
      const melodicGap =
        /** @type {any} */ (examplePanelBox).y -
        (/** @type {any} */ (melodicPadBox).y + /** @type {any} */ (melodicPadBox).height);
      expect(melodicGap).toBeGreaterThan(15);

      const exampleButtonBox = await page
        .locator("#example-content button")
        .boundingBox();
      const intervalPanelBox = await page
        .locator("#panel-interval-detective")
        .boundingBox();
      expect(exampleButtonBox).not.toBeNull();
      expect(intervalPanelBox).not.toBeNull();
      const exampleGap =
        /** @type {any} */ (intervalPanelBox).y -
        (/** @type {any} */ (exampleButtonBox).y + /** @type {any} */ (exampleButtonBox).height);
      expect(exampleGap).toBeGreaterThan(15);
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

    test("Level 5 shows the shared 'not yet available' state across all level-driven panels, plus Preparation", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 5" })
        .click();

      // 5 level-driven panels (Presentation, both Workshops, Example,
      // Interval Detective) plus Preparation, which renders this same
      // state unconditionally regardless of level -- toHaveCount counts
      // DOM presence, not tab visibility, so Preparation's copy counts
      // here even while its tabpanel sits hidden.
      await expect(page.locator(".panel-unavailable")).toHaveCount(6);
      const badges = page.locator(".panel-unavailable .badge");
      for (const badge of await badges.all()) {
        await expect(badge).toContainText("Not yet available");
      }
    });

    test("Rhythm Workshop plays the selected motif, not just any motif", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#tab-practice").click();
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

    test("Melodic Workshop is a keyboard: every cumulative syllable is playable, not just what's new", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#tab-practice").click();
      await page.locator("#btn-level-dropdown").click();
      await page
        .locator(".level-select__item")
        .filter({ hasText: "Level 3" })
        .click();

      // Level 3's cumulative toneset is do/re/mi/fa/so/la (6 syllables),
      // not just the one syllable (fa) newly introduced there -- the whole
      // point of the keyboard redesign is showing the full toneset a lone
      // new syllable has no melodic context on its own.
      const keys = page.locator("#melodic-workshop-content .solfege-pad");
      await expect(keys).toHaveCount(6);
      await expect(
        page.locator('#melodic-workshop-content .solfege-pad[aria-label="fa"]'),
      ).toBeVisible();

      // No selection state and no Play button any more -- every pad is
      // independently, immediately clickable.
      await expect(
        page.locator("#melodic-workshop-content").getByRole("button", {
          name: "Play Ostinato",
        }),
      ).toHaveCount(0);
      await expect(keys.first()).toBeEnabled();

      await page.evaluate(async () => {
        // @ts-ignore -- absolute-path dynamic import resolved by the browser at runtime, not by tsc
        const audio = await import("/src/js/audio.js");
        // @ts-ignore -- test-only global bridging the page's callback back to the Node/Playwright side
        window.__playNoteCalls = [];
        audio.AudioEngine.playNote = (
          /** @type {any} */ syllable,
          /** @type {any} */ tonic,
        ) => {
          // @ts-ignore
          window.__playNoteCalls.push({ syllable, tonic });
          return Promise.resolve();
        };
      });

      const faKey = page.locator(
        '#melodic-workshop-content .solfege-pad[aria-label="fa"]',
      );
      await faKey.click();

      // @ts-ignore -- __playNoteCalls is a test-only global set above
      const calls = await page.evaluate(() => window.__playNoteCalls);
      expect(calls).toHaveLength(1);
      expect(calls[0].syllable).toBe("fa");
      expect(typeof calls[0].tonic).toBe("string");

      // Clicking pulses the clicked pad directly (no shared ostinato-beat
      // event round-trip needed for a single immediate note).
      await expect(faKey).toHaveClass(/is-pulsing/);
    });

    test("Example plays a freshly generated phrase and reports its metre/bars, across every playable level", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#tab-practice").click();

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
      await page.locator("#tab-practice").click();
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
      await page.locator("#tab-practice").click();
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
      await page.locator("#tab-practice").click();
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

    // Only the reference (first) syllable should highlight -- the second
    // plays with no highlight, matching how interval training is actually
    // taught (one known reference, one unknown to identify). The
    // highlight is applied directly in the "Play Interval" click handler
    // (highlightReferencePad) rather than through the shared, brief
    // is-pulsing beat-flash Rhythm Workshop uses, specifically so it can
    // hold for a full 2s instead of blinking past in the same instant.
    // playOstinato is mocked to a never-resolving promise (matching the
    // interception pattern other tests in this file already use) purely
    // to avoid a real, pre-existing WebKit/Tone.js scheduling error
    // unrelated to the highlight this test actually checks.
    test("Interval Detective highlights only the reference syllable, held for a full 2s", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#tab-practice").click();
      const container = page.locator("#interval-detective-content");

      await page.evaluate(async () => {
        // @ts-ignore -- absolute-path dynamic import resolved by the browser at runtime, not by tsc
        const audio = await import("/src/js/audio.js");
        audio.AudioEngine.playOstinato = () => new Promise(() => {});
      });

      await container.getByRole("button", { name: "Play Interval" }).click();

      const highlighted = container.locator(".solfege-pad.is-highlighted");
      // Exactly one pad highlights, immediately -- the second syllable
      // never gets one at all.
      await expect(highlighted).toHaveCount(1);
      const rawSyllable = await highlighted.getAttribute("data-syllable");
      expect(rawSyllable).not.toBeNull();
      const referenceSyllable = /** @type {string} */ (rawSyllable);

      // Still highlighted well short of 2s -- this is the whole point of
      // the fix: the old shared is-pulsing flash faded in ~250ms and would
      // already be long gone by this point.
      await page.waitForTimeout(1700);
      await expect(highlighted).toHaveCount(1);
      await expect(highlighted).toHaveAttribute("data-syllable", referenceSyllable);

      // Gone comfortably after the 2s mark.
      await page.waitForTimeout(600);
      await expect(container.locator(".solfege-pad.is-highlighted")).toHaveCount(0);
    });

    test("Interval Detective names what to practise on a wrong guess, without crashing the flow", async ({
      page,
    }) => {
      await page.goto("/classroom.html");
      await page.locator("#tab-practice").click();
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
      await page.locator("#tab-practice").click();
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
