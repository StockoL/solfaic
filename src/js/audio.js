// src/js/audio.js

import { MOTIF_LIBRARY, SOLFEGE_DEGREES } from "./data.js";

/**
 * ============================================================================
 * TONE.JS AUDIO ENGINE (The Organist)
 * ============================================================================
 * Pure synthesis and timing. This module accepts musical data as arguments,
 * schedules playback, and broadcasts CustomEvents for the View (core.js)
 * to synchronise visual feedback. It contains absolutely no DOM manipulation.
 * ============================================================================
 */

// Sharp spelling only — enharmonic spelling doesn't matter here (out of
// scope per the design doc header), only the correct pitch does.
const CHROMATIC_SCALE = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const PITCH_CLASS_INDEX = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

/**
 * Movable-do resolution: a solfège token ("so", "do'", "fi"...) plus a
 * chosen tonic ("C4", "Eb4"...) becomes a real Tone.js note name, via
 * SOLFEGE_DEGREES' semitone-from-tonic table. Falls back to returning the
 * tonic unchanged if either input can't be resolved.
 */
export function resolveSolfegeToNote(token, tonic) {
  const semitoneOffset = SOLFEGE_DEGREES[token];
  if (semitoneOffset === undefined) return tonic;

  // AI-Attribution: Regex pattern generated to extract pitch class and octave
  const match = /^([A-G][#b]?)(\d+)$/.exec(tonic);
  if (!match) return tonic;

  const [, pitchClass, octaveStr] = match;
  const tonicIndex = PITCH_CLASS_INDEX[pitchClass];
  if (tonicIndex === undefined) return tonic;

  const octave = parseInt(octaveStr, 10);
  const totalSemitones = tonicIndex + semitoneOffset;
  const noteIndex = ((totalSemitones % 12) + 12) % 12;
  const octaveShift = Math.floor(totalSemitones / 12);

  return `${CHROMATIC_SCALE[noteIndex]}${octave + octaveShift}`;
}

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
   * Plays the exercise's first solfège pitch as a single sustained tone —
   * used by the "Starting Note" modal at the rhythm->pitch transition, so
   * the student has time to actually internalise the pitch before
   * dictation starts. "2n" matches too's length, not a quick blip.
   * Immediate playback (no Transport scheduling needed for a single note).
   */
  async playStartingNote(pitch, tonic) {
    await this.init();
    const note = resolveSolfegeToNote(pitch, tonic);
    this.synth.triggerAttackRelease(note, "2n");
  },

  /**
   * Schedules and plays the rhythm sequence, singing `pitches` over it when
   * given — one solfège syllable per SOUNDING SUB-NOTE in timeline order
   * (restMask-aware), not one per rhythm event. A motif like "titi" is a
   * single timeline event but two sounding notes needing two different
   * syllables, so pitchCursor walks in lockstep with the same rule
   * engine.js's countSoundingNotes uses, advancing once per non-restMask
   * playback slot regardless of which event it's inside.
   * Returns a Promise that resolves when playback completes.
   */
  async playSequence(
    targetTimeline,
    activeConfig,
    tonic = null,
    pitches = null,
  ) {
    await this.init();

    Tone.Transport.cancel();
    Tone.Transport.stop();

    const [num, den] = activeConfig.metre.split("/");
    Tone.Transport.timeSignature = [parseInt(num, 10), parseInt(den, 10)];

    const playableEvents = [];
    let currentTime = Tone.Time("1m").toSeconds();
    let pitchCursor = 0;

    targetTimeline.forEach((event) => {
      const motifData = MOTIF_LIBRARY[event.motifId];
      let subTime = currentTime;

      motifData.playback.forEach((subDuration, i) => {
        // restMask slots still consume their share of the beat but never
        // trigger a note — advance the cursor and skip scheduling.
        if (!motifData.restMask?.[i]) {
          const syllable = pitches?.[pitchCursor];
          const resolvedPitch =
            tonic && syllable && SOLFEGE_DEGREES[syllable] !== undefined
              ? resolveSolfegeToNote(syllable, tonic)
              : "G3";

          playableEvents.push({
            time: subTime,
            duration: subDuration,
            pitch: resolvedPitch,
          });
          pitchCursor++;
        }
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

    // 3. Broadcast Heartbeat Pulses for Workspace Boxes (one per beat, not
    // per bar - tickIndex maps 1:1 onto each box's data-tick-index).
    const totalBars = activeConfig.bars;
    for (let bar = 0; bar < totalBars; bar++) {
      for (let beat = 0; beat < ticks; beat++) {
        const absoluteTick = bar * ticks + beat;
        const timeOffset =
          Tone.Time("1m").toSeconds() + absoluteTick * beatSpacing;

        Tone.Transport.schedule((time) => {
          Tone.Draw.schedule(() => {
            document.dispatchEvent(
              new CustomEvent("audio-pulse-beat", {
                detail: { barIndex: bar, tickIndex: absoluteTick },
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
