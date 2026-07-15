// ============================================================================
// TONE.JS AUDIO ENGINE
// ============================================================================

/* * Audio Engine Attribution:
 * Web Audio API synthesis, scheduling, and transport management
 * implemented using Tone.js (v14.x) library.
 */

import { MOTIF_LIBRARY } from "./data.js";

export const AudioEngine = {
  synth: null,
  chime: null,
  isInitialized: false,

  /**
   * Wakes up underlying oscillators on user gesture interactions to satisfy
   * strict browser AudioContext security specifications.
   */
  async init() {
    if (this.isInitialized) return;
    await Tone.start();

    // The primary polyphonic synthesizer for musical notes
    this.synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.1 },
    }).toDestination();

    // The high-frequency countdown/metronome marker
    this.chime = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.5 },
    }).toDestination();

    Tone.Transport.bpm.value = 85;
    this.isInitialized = true;
  },

  async playSequence() {
    if (sessionState.currentState === "PLAYING") return;
    if (sessionState.playCount >= sessionState.maxPlays) {
      alert("You are out of plays! Give it your best guess.");
      return;
    }

    // 1. Lock UI and update states IMMEDIATELY upon click to prevent double-firing
    sessionState.currentState = "PLAYING";
    sessionState.playCount++;

    if (DOM.replayBtn) DOM.replayBtn.classList.add("is-locked");
    if (DOM.playsRemaining)
      DOM.playsRemaining.innerText = `Plays remaining: ${sessionState.maxPlays - sessionState.playCount} / ${sessionState.maxPlays}`;

    // 2. Await Tone.js hardware initialization AFTER the UI is safely locked
    await this.init();

    Tone.Transport.cancel();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.stop();

    const [num, den] = sessionState.activeConfig.metre.split("/");
    Tone.Transport.timeSignature = [parseInt(num), parseInt(den)];

    const playableEvents = [];
    let currentTime = Tone.Time("1m").toSeconds(); // Offset sequence playback to allow 1 bar of count-in space

    sessionState.targetTimeline.forEach((event) => {
      const motifData = MOTIF_LIBRARY[event.motifId];
      let subTime = currentTime;

      motifData.playback.forEach((subDuration) => {
        playableEvents.push({
          time: subTime,
          duration: subDuration,
          pitch: event.pitch,
        });
        subTime += Tone.Time(subDuration).toSeconds();
      });
      currentTime += Tone.Time(motifData.duration).toSeconds();
    });

    const part = new Tone.Part((time, event) => {
      const noteToPlay = event.pitch ? event.pitch : "G3";
      // Shrink sounding duration slightly (0.82) to emulate articulation gaps between notes
      const soundingDuration = Tone.Time(event.duration).toSeconds() * 0.82;
      this.synth.triggerAttackRelease(noteToPlay, soundingDuration, time);
    }, playableEvents);
    part.start(0);

    // Visual Countdown Mask Generation
    const modal = document.createElement("div");
    modal.style.cssText =
      "position:absolute; inset:0; background:rgba(255,255,255,0.85); backdrop-filter: blur(4px); z-index:100; display:flex; justify-content:center; align-items:center; font-size:6rem; font-weight:900; border-radius: 12px;";
    if (DOM.workspace) {
      DOM.workspace.style.position = "relative";
      DOM.workspace.appendChild(modal);
    }

    const ticks = sessionState.activeConfig.ticksPerBar;
    const beatSpacing = sessionState.activeConfig.metre.includes("8")
      ? Tone.Time("4n.").toSeconds()
      : Tone.Time("4n").toSeconds();

    // Schedule Metronome audio counts & visual numeral syncs
    for (let i = 0; i < ticks; i++) {
      Tone.Transport.schedule((time) => {
        this.chime.triggerAttackRelease("C6", "16n", time);
        Tone.Draw.schedule(() => {
          modal.innerText = i + 1;
        }, time);
      }, i * beatSpacing);
    }

    // Erase masking modal exactly when bar 1 is complete
    Tone.Transport.schedule((time) => {
      Tone.Draw.schedule(() => modal.remove(), time);
    }, Tone.Time("1m").toSeconds());

    // Schedule Heartbeat Animations for active staves
    const totalBars = sessionState.activeConfig.bars;
    for (let bar = 0; bar < totalBars; bar++) {
      for (let beat = 0; beat < ticks; beat++) {
        const absoluteTick = bar * ticks + beat;
        const timeOffset =
          Tone.Time("1m").toSeconds() + absoluteTick * beatSpacing;

        Tone.Transport.schedule((time) => {
          Tone.Draw.schedule(() => {
            const barElements = document.querySelectorAll(".workspace-bar");
            if (barElements[bar]) {
              barElements[bar].classList.add("is-metronome-pulse");
              setTimeout(
                () => barElements[bar].classList.remove("is-metronome-pulse"),
                300,
              );
            }
          }, time);
        }, timeOffset);
      }
    }

    Tone.Transport.start();

    // Auto-teardown routine safely un-locks UI states following transport duration limits
    const stopTimeInSeconds = Tone.Time(`${totalBars + 1}m`).toSeconds();
    setTimeout(
      () => {
        Tone.Transport.stop();
        sessionState.currentState = "IDLE";
        if (sessionState.playCount < sessionState.maxPlays && DOM.replayBtn) {
          DOM.replayBtn.classList.remove("is-locked");
        }
      },
      stopTimeInSeconds * 1000 + 500,
    );
  },
};
