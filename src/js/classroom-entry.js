// src/js/classroom-entry.js

/**
 * ============================================================================
 * CLASSROOM.HTML ENTRY POINT
 * ============================================================================
 * A dedicated, lighter entry point so classroom.html doesn't have to load
 * app.js's Practice Room Conductor (startLevel/triggerReplay/handleFailedAttempt
 * and friends) — none of it has any DOM to attach to here, but as a static
 * import it would still be downloaded and parsed regardless of the runtime
 * `if (DOM.workspace)` guard that used to gate it.
 * ============================================================================
 */

import { initialiseCoreUI } from "./core.js";
import { initialiseClassroomPanels } from "./classroom.js";

window.addEventListener("DOMContentLoaded", () => {
  initialiseCoreUI();
  initialiseClassroomPanels();
});
