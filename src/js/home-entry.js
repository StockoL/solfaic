// src/js/home-entry.js

/**
 * ============================================================================
 * INDEX.HTML ENTRY POINT
 * ============================================================================
 * index.html is a marketing/landing page — no exercises, no audio, no
 * Classroom panels. It only needs the shared chrome (nav toggle, compliance
 * modals) that initialiseCoreUI() wires up, not the Practice Room engine or
 * Classroom panels app.js/classroom.js would otherwise pull in as static
 * imports (and, transitively, engine.js/audio.js/rhythm-notation.js).
 * ============================================================================
 */

import { initialiseCoreUI } from "./core.js";

window.addEventListener("DOMContentLoaded", initialiseCoreUI);
