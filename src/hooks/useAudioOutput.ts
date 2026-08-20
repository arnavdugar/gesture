import { useEffect, useRef } from "preact/hooks";

import type { MusicalPerformance } from "./useGesturePerformance";

const chordAttackSeconds = 0.08;
const chordReleaseSeconds = 0.2;
const defaultFilterFrequency = 1200;
const defaultFilterResonance = 0.7;
const maximumChordGain = 0.09;
const silentGain = 0.0001;

type BuiltInWaveform = "sawtooth" | "sine" | "square" | "triangle";

export type Waveform = BuiltInWaveform | "none";

type ActiveChord = {
  filter: BiquadFilterNode;
  gain: GainNode;
  notes: readonly number[];
  oscillators: OscillatorNode[];
  triggerId: number;
};

function setOscillatorsWaveform(
  oscillators: OscillatorNode[],
  waveform: BuiltInWaveform,
) {
  for (const oscillator of oscillators) {
    oscillator.type = waveform;
  }
}

function getNoteFrequency(midiNote: number) {
  return 440 * 2 ** ((midiNote - 69) / 12);
}

function areNotesEqual(first: readonly number[], second: readonly number[]) {
  return (
    first.length === second.length &&
    first.every((note, index) => note === second[index])
  );
}

function updateChordNotes(
  audioContext: AudioContext,
  chord: ActiveChord,
  notes: readonly number[],
  waveform: BuiltInWaveform,
) {
  const frequencies = notes.map(getNoteFrequency);

  while (chord.oscillators.length < frequencies.length) {
    const oscillator = audioContext.createOscillator();
    const frequency = frequencies[chord.oscillators.length];

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(chord.filter);
    setOscillatorsWaveform([oscillator], waveform);
    oscillator.start(audioContext.currentTime);
    chord.oscillators.push(oscillator);
  }

  const removedOscillators = chord.oscillators.splice(frequencies.length);

  for (const oscillator of removedOscillators) {
    oscillator.addEventListener("ended", () => oscillator.disconnect(), {
      once: true,
    });
    oscillator.stop(audioContext.currentTime);
  }

  chord.notes = notes;
  chord.oscillators.forEach((oscillator, index) => {
    oscillator.frequency.setTargetAtTime(
      frequencies[index],
      audioContext.currentTime,
      0.01,
    );
  });
}

function getFilterSettings(secondarySlider: number | null) {
  if (secondarySlider === null) {
    return {
      frequency: defaultFilterFrequency,
      resonance: defaultFilterResonance,
    };
  }

  const tilt = secondarySlider * 2 - 1;
  const intensity = Math.abs(tilt);

  if (tilt < 0) {
    return {
      frequency: defaultFilterFrequency - intensity * 950,
      resonance: defaultFilterResonance + intensity * 1.5,
    };
  }

  return {
    frequency: defaultFilterFrequency + intensity * 3800,
    resonance: defaultFilterResonance + intensity * 4.5,
  };
}

function getChordGain(dominantSlider: number | null) {
  if (dominantSlider === null) {
    return maximumChordGain;
  }

  return Math.max(silentGain, (1 - dominantSlider) * maximumChordGain);
}

function updateChordControls(
  audioContext: AudioContext,
  chord: ActiveChord,
  performance: MusicalPerformance,
) {
  const { frequency, resonance } = getFilterSettings(
    performance.secondarySlider,
  );

  chord.filter.frequency.setTargetAtTime(
    frequency,
    audioContext.currentTime,
    0.04,
  );
  chord.filter.Q.setTargetAtTime(resonance, audioContext.currentTime, 0.04);
  chord.gain.gain.setTargetAtTime(
    getChordGain(performance.dominantSlider),
    audioContext.currentTime,
    0.04,
  );
}

function startChord(
  audioContext: AudioContext,
  performance: MusicalPerformance,
  waveform: BuiltInWaveform,
): ActiveChord {
  const startTime = audioContext.currentTime;
  const { frequency, resonance } = getFilterSettings(
    performance.secondarySlider,
  );
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(frequency, startTime);
  filter.Q.setValueAtTime(resonance, startTime);
  filter.connect(gain);

  gain.gain.setValueAtTime(silentGain, startTime);
  gain.gain.exponentialRampToValueAtTime(
    getChordGain(performance.dominantSlider),
    startTime + chordAttackSeconds,
  );
  gain.connect(audioContext.destination);

  const oscillators = performance.notes.map((note) => {
    const oscillator = audioContext.createOscillator();

    oscillator.frequency.setValueAtTime(getNoteFrequency(note), startTime);
    oscillator.connect(filter);

    return oscillator;
  });

  setOscillatorsWaveform(oscillators, waveform);

  for (const oscillator of oscillators) {
    oscillator.start(startTime);
  }

  return {
    filter,
    gain,
    notes: performance.notes,
    oscillators,
    triggerId: performance.triggerId,
  };
}

function releaseChord(audioContext: AudioContext, chord: ActiveChord) {
  const releaseTime = audioContext.currentTime + chordReleaseSeconds;

  chord.gain.gain.cancelScheduledValues(audioContext.currentTime);
  chord.gain.gain.setValueAtTime(
    Math.max(silentGain, chord.gain.gain.value),
    audioContext.currentTime,
  );
  chord.gain.gain.exponentialRampToValueAtTime(silentGain, releaseTime);

  for (const oscillator of chord.oscillators) {
    oscillator.stop(releaseTime);
  }

  chord.oscillators[0]?.addEventListener(
    "ended",
    () => {
      chord.oscillators.forEach((oscillator) => oscillator.disconnect());
      chord.filter.disconnect();
      chord.gain.disconnect();
    },
    { once: true },
  );
}

export function useAudioOutput(
  performance: MusicalPerformance | null,
  waveform: Waveform,
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeChordRef = useRef<ActiveChord | null>(null);
  const latestPerformanceRef = useRef(performance);
  const latestWaveformRef = useRef(waveform);
  const pendingTriggerIdRef = useRef<number | null>(null);

  const startPendingChord = () => {
    const pendingTriggerId = pendingTriggerIdRef.current;

    if (pendingTriggerId === null || latestWaveformRef.current === "none") {
      return;
    }

    const audioContext =
      audioContextRef.current ?? (audioContextRef.current = new AudioContext());

    void audioContext.resume().then(
      () => {
        const latestPerformance = latestPerformanceRef.current;
        const latestWaveform = latestWaveformRef.current;

        if (
          pendingTriggerIdRef.current !== pendingTriggerId ||
          latestPerformance?.triggerId !== pendingTriggerId ||
          latestWaveform === "none"
        ) {
          return;
        }

        const activeChord = activeChordRef.current;

        if (activeChord) {
          releaseChord(audioContext, activeChord);
        }

        activeChordRef.current = startChord(
          audioContext,
          latestPerformance,
          latestWaveform,
        );
        pendingTriggerIdRef.current = null;
      },
      () => undefined,
    );
  };

  useEffect(() => {
    latestWaveformRef.current = waveform;

    const audioContext = audioContextRef.current;
    const activeChord = activeChordRef.current;

    if (waveform === "none") {
      pendingTriggerIdRef.current = null;

      if (audioContext && activeChord) {
        releaseChord(audioContext, activeChord);
        activeChordRef.current = null;
      }

      return;
    }

    if (audioContext && activeChord) {
      setOscillatorsWaveform(activeChord.oscillators, waveform);
      return;
    }

    const latestPerformance = latestPerformanceRef.current;

    if (latestPerformance) {
      pendingTriggerIdRef.current = latestPerformance.triggerId;
      startPendingChord();
    }
  }, [waveform]);

  useEffect(() => {
    latestPerformanceRef.current = performance;

    const audioContext = audioContextRef.current;
    const activeChord = activeChordRef.current;

    if (!performance) {
      pendingTriggerIdRef.current = null;

      if (audioContext && activeChord) {
        releaseChord(audioContext, activeChord);
        activeChordRef.current = null;
      }

      return;
    }

    if (latestWaveformRef.current === "none") {
      return;
    }

    if (
      audioContext?.state === "running" &&
      activeChord?.triggerId === performance.triggerId
    ) {
      updateChordControls(audioContext, activeChord, performance);

      if (!areNotesEqual(activeChord.notes, performance.notes)) {
        updateChordNotes(
          audioContext,
          activeChord,
          performance.notes,
          latestWaveformRef.current,
        );
      }

      return;
    }

    pendingTriggerIdRef.current = performance.triggerId;
    startPendingChord();
  }, [performance]);

  useEffect(() => {
    const unlockAudio = () => {
      startPendingChord();
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      pendingTriggerIdRef.current = null;
      activeChordRef.current = null;

      const audioContext = audioContextRef.current;
      audioContextRef.current = null;

      if (audioContext) {
        void audioContext.close();
      }
    };
  }, []);
}
