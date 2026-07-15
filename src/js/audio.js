// src/js/audio.js

import { MOTIF_LIBRARY } from "./data.js";

/**
 * ============================================================================
 * TONE.JS AUDIO ENGINE (The Organist)
 * ============================================================================
 * Pure synthesis and timing. This module accepts musical data as arguments,
 * schedules playback, and broadcasts CustomEvents for the View (core.js)
 * to synchronise visual feedback. It contains absolutely no DOM manipulation.
 * ============================================================================
 */

export const AudioEngine = {
  synth: null,
  chime: null,
  isInitialized: false,

  async init() {
    if (this.isInitialized) return;
    await Tone.start();

    this.synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.1 },
    }).toDestination();

    this.chime = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.5 },
    }).toDestination();

    Tone.Transport.bpm.value = 85;
    this.isInitialized = true;
  },

  /**
   * Schedules and plays the rhythm sequence.
   * Returns a Promise that resolves when playback completes.
   */
  async playSequence(targetTimeline, activeConfig) {
    await this.init();

    Tone.Transport.cancel();
    Tone.Transport.stop();

    const [num, den] = activeConfig.metre.split("/");
    Tone.Transport.timeSignature = [parseInt(num, 10), parseInt(den, 10)];

    const playableEvents = [];
    let currentTime = Tone.Time("1m").toSeconds();

    targetTimeline.forEach((event) => {
      const motifData = MOTIF_LIBRARY[event.motifId];
      let subTime = currentTime;

      motifData.playback.forEach((subDuration) => {
        playableEvents.push({
          time: subTime,
          duration: subDuration,
          pitch: event.pitch || "G3",
        });
        subTime += Tone.Time(subDuration).toSeconds();
      });
      currentTime += Tone.Time(motifData.duration).toSeconds();
    });

    const part = new Tone.Part((time, event) => {
      const soundingDuration = Tone.Time(event.duration).toSeconds() * 0.82;
      this.synth.triggerAttackRelease(event.pitch, soundingDuration, time);
    }, playableEvents);
    part.start(0);

    const ticks = activeConfig.ticksPerBar;
    const beatSpacing = activeConfig.metre.includes("8")
      ? Tone.Time("4n.").toSeconds()
      : Tone.Time("4n").toSeconds();

    // 1. Broadcast Metronome Countdown Events
    for (let i = 0; i < ticks; i++) {
      Tone.Transport.schedule((time) => {
        this.chime.triggerAttackRelease("C6", "16n", time);
        Tone.Draw.schedule(() => {
          document.dispatchEvent(
            new CustomEvent("audio-countdown-beat", {
              detail: { beat: i + 1 },
            }),
          );
        }, time);
      }, i * beatSpacing);
    }

    // 2. Broadcast Countdown Completion Event
    Tone.Transport.schedule((time) => {
      Tone.Draw.schedule(() => {
        document.dispatchEvent(new CustomEvent("audio-countdown-finish"));
      }, time);
    }, Tone.Time("1m").toSeconds());

    // 3. Broadcast Heartbeat Pulses for Workspace Bars
    const totalBars = activeConfig.bars;
    for (let bar = 0; bar < totalBars; bar++) {
      for (let beat = 0; beat < ticks; beat++) {
        const absoluteTick = bar * ticks + beat;
        const timeOffset =
          Tone.Time("1m").toSeconds() + absoluteTick * beatSpacing;

        Tone.Transport.schedule((time) => {
          Tone.Draw.schedule(() => {
            document.dispatchEvent(
              new CustomEvent("audio-pulse-bar", {
                detail: { barIndex: bar },
              }),
            );
          }, time);
        }, timeOffset);
      }
    }

    Tone.Transport.start();

    // Return a promise to the Conductor so it knows when the performance ends
    const stopTimeInSeconds = Tone.Time(`${totalBars + 1}m`).toSeconds();
    return new Promise((resolve) => {
      setTimeout(
        () => {
          Tone.Transport.stop();
          resolve(); // Resolve the promise smoothly
        },
        stopTimeInSeconds * 1000 + 500,
      );
    });
  },
};
