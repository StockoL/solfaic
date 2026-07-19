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

    // Its own voice, deliberately separate from `synth`/`chime` above —
    // both of those are monophonic and get triggered at Transport-scheduled
    // times by playSequence/playOstinato, which requires each successive
    // trigger's start time to strictly increase. playNote's immediate,
    // unscheduled triggerAttackRelease calls (Tone.now()-based) would
    // otherwise clash with that ordering the moment a scheduled sequence
    // runs after a keyboard click, throwing "Start time must be strictly
    // greater than previous start time." A dedicated voice sidesteps the
    // conflict entirely rather than trying to keep one shared voice's timing
    // consistent across two different playback models.
    this.keyboardSynth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 },
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
   * Melodic Workshop's "keyboard" — one syllable, played once, immediately.
   * Deliberately NOT built on playOstinato: there's no repeat count or loop
   * here, so none of Transport's cancel/schedule/Promise-timeout machinery
   * is needed, just an immediate triggerAttackRelease. Runs on its own
   * dedicated `keyboardSynth` rather than the shared `synth` playSequence/
   * playOstinato schedule notes on via Transport — mixing an immediate,
   * Tone.now()-based trigger with that voice's Transport-scheduled ones
   * throws "Start time must be strictly greater than previous start time"
   * the moment a scheduled sequence runs shortly after a keyboard click,
   * since the two playback models don't share a timeline. A short "8n"
   * suits a rapid click-around-the-keyboard interaction.
   */
  async playNote(syllable, tonic) {
    await this.init();
    const note = resolveSolfegeToNote(syllable, tonic);
    this.keyboardSynth.triggerAttackRelease(note, "8n");
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

  /**
   * Loops a single motif or a short solfège pattern a fixed number of
   * times — the Classroom drill counterpart to playSequence, deliberately
   * simpler since there's no bar/form/cadence structure or count-in to
   * schedule, just "this one thing, repeated". `content` is either a
   * MOTIF_LIBRARY id (rhythm drill) or an array of solfège syllables
   * (melody drill, one quarter-note per syllable) — `tonic` is only
   * consulted in the syllable-array case. Dispatches one
   * "audio-ostinato-beat" CustomEvent per sounding note (mirroring
   * playSequence's audio-pulse-beat) so a consumer can sync a beat-pulse
   * highlight to each repetition. Returns a Promise that resolves when
   * playback completes.
   */
  async playOstinato(content, repeatCount = 4, tonic = null) {
    await this.init();

    Tone.Transport.cancel();
    Tone.Transport.stop();

    const isRhythmMotif = typeof content === "string";
    const motifData = isRhythmMotif ? MOTIF_LIBRARY[content] : null;

    // One "sub-note" entry per sounding/silent slot in a single repetition.
    const subNotes = isRhythmMotif
      ? motifData.playback.map((subDuration, i) => ({
          subDuration,
          isRest: !!motifData.restMask?.[i],
          syllable: null,
        }))
      : content.map((syllable) => ({
          subDuration: "4n",
          isRest: false,
          syllable,
        }));

    const loopDuration = subNotes.reduce(
      (sum, note) => sum + Tone.Time(note.subDuration).toSeconds(),
      0,
    );

    const playableEvents = [];
    for (let repetitionIndex = 0; repetitionIndex < repeatCount; repetitionIndex++) {
      let subTime = repetitionIndex * loopDuration;

      subNotes.forEach((note, subIndex) => {
        if (!note.isRest) {
          const resolvedPitch =
            tonic && note.syllable && SOLFEGE_DEGREES[note.syllable] !== undefined
              ? resolveSolfegeToNote(note.syllable, tonic)
              : "G3";

          playableEvents.push({
            time: subTime,
            duration: note.subDuration,
            pitch: resolvedPitch,
            repetitionIndex,
            subIndex,
          });
        }
        subTime += Tone.Time(note.subDuration).toSeconds();
      });
    }

    const part = new Tone.Part((time, event) => {
      const soundingDuration = Tone.Time(event.duration).toSeconds() * 0.82;
      this.synth.triggerAttackRelease(event.pitch, soundingDuration, time);
      Tone.Draw.schedule(() => {
        document.dispatchEvent(
          new CustomEvent("audio-ostinato-beat", {
            detail: {
              repetitionIndex: event.repetitionIndex,
              subIndex: event.subIndex,
              totalRepeats: repeatCount,
            },
          }),
        );
      }, time);
    }, playableEvents);
    part.start(0);

    Tone.Transport.start();

    const stopTimeInSeconds = loopDuration * repeatCount;
    return new Promise((resolve) => {
      setTimeout(
        () => {
          Tone.Transport.stop();
          resolve();
        },
        stopTimeInSeconds * 1000 + 500,
      );
    });
  },
};
