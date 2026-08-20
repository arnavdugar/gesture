import { useEffect, useRef } from "preact/hooks";
import type { FingerPositions, HandTrackingData } from "./useHandTracking";

const scaleSemitones = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
} as const;
const chordVoicingSettings = {
  triadRoot: { noteOffsets: [0, 2, 4], inversion: 0, octave: 0 },
  triadFirst: { noteOffsets: [0, 2, 4], inversion: 1, octave: 0 },
  triadSecond: { noteOffsets: [0, 2, 4], inversion: 2, octave: 0 },
  triadRootOctave: { noteOffsets: [0, 2, 4], inversion: 0, octave: 1 },
  suspendedRoot: { noteOffsets: [0, 3, 4], inversion: 0, octave: 0 },
  seventhRoot: { noteOffsets: [0, 2, 4, 6], inversion: 0, octave: 0 },
  seventhFirst: { noteOffsets: [0, 2, 4, 6], inversion: 1, octave: 0 },
  seventhSecond: { noteOffsets: [0, 2, 4, 6], inversion: 2, octave: 0 },
  seventhThird: { noteOffsets: [0, 2, 4, 6], inversion: 3, octave: 0 },
} as const;
const middleC = 60;
const chordAttackSeconds = 0.08;
const chordReleaseSeconds = 0.2;
const chordHoldTimeMilliseconds = 100;
const trackingLossGraceMilliseconds = 50;
const defaultFilterFrequency = 1200;
const defaultFilterResonance = 0.7;
const maximumChordGain = 0.09;
const silentGain = 0.0001;

type BuiltInWaveform = "sawtooth" | "sine" | "square" | "triangle";
type CustomWaveform = "warm-saw" | "organ" | "pulse" | "shimmer";

export type Waveform = BuiltInWaveform | CustomWaveform;
export type Scale = keyof typeof scaleSemitones;
type ChordVoicing = keyof typeof chordVoicingSettings;

type WaveformCoefficients = {
  real: Float32Array;
  imaginary: Float32Array;
};

function createHarmonicWaveform(
  harmonicCount: number,
  getAmplitude: (harmonic: number) => number,
): WaveformCoefficients {
  const real = new Float32Array(harmonicCount + 1);
  const imaginary = new Float32Array(harmonicCount + 1);

  for (let harmonic = 1; harmonic <= harmonicCount; harmonic += 1) {
    imaginary[harmonic] = getAmplitude(harmonic);
  }

  return { real, imaginary };
}

function createPulseWaveform(dutyCycle: number): WaveformCoefficients {
  const harmonicCount = 32;
  const real = new Float32Array(harmonicCount + 1);
  const imaginary = new Float32Array(harmonicCount + 1);

  for (let harmonic = 1; harmonic <= harmonicCount; harmonic += 1) {
    real[harmonic] = Math.sin(Math.PI * harmonic * dutyCycle) / harmonic;
  }

  return { real, imaginary };
}

const customWaveformCoefficients: Record<CustomWaveform, WaveformCoefficients> =
  {
    "warm-saw": createHarmonicWaveform(32, (harmonic) =>
      harmonic % 2 === 1 ? 1 / harmonic ** 1.6 : -1 / harmonic ** 1.6,
    ),
    organ: createHarmonicWaveform(8, (harmonic) => {
      const drawbarAmplitudes: Partial<Record<number, number>> = {
        1: 1,
        2: 0.7,
        3: 0.55,
        4: 0.3,
        6: 0.2,
        8: 0.12,
      };

      return drawbarAmplitudes[harmonic] ?? 0;
    }),
    pulse: createPulseWaveform(0.25),
    shimmer: createHarmonicWaveform(16, (harmonic) => {
      const octaveAmplitudes: Partial<Record<number, number>> = {
        1: 1,
        2: 0.55,
        4: 0.3,
        8: 0.14,
        16: 0.06,
      };

      return octaveAmplitudes[harmonic] ?? 0;
    }),
  };

function isBuiltInWaveform(waveform: Waveform): waveform is BuiltInWaveform {
  return (
    waveform === "sawtooth" ||
    waveform === "sine" ||
    waveform === "square" ||
    waveform === "triangle"
  );
}

function setOscillatorsWaveform(
  audioContext: AudioContext,
  oscillators: OscillatorNode[],
  waveform: Waveform,
) {
  if (isBuiltInWaveform(waveform)) {
    for (const oscillator of oscillators) {
      oscillator.type = waveform;
    }

    return;
  }

  const { real, imaginary } = customWaveformCoefficients[waveform];
  const periodicWave = audioContext.createPeriodicWave(real, imaginary);

  for (const oscillator of oscillators) {
    oscillator.setPeriodicWave(periodicWave);
  }
}

type ActiveChord = {
  alternateQuality: boolean;
  degree: number;
  voicing: ChordVoicing;
  oscillators: OscillatorNode[];
  filter: BiquadFilterNode;
  gain: GainNode;
};

function getRaisedFingerCount(fingers: FingerPositions) {
  return Object.values(fingers).filter(Boolean).length;
}

function getChordDegree(fingers: FingerPositions) {
  const { thumb, index, middle, ring, pinky } = fingers;

  if (thumb && pinky && !index && !middle && !ring) {
    return 6;
  }

  if (thumb && pinky && index && !middle && !ring) {
    return 7;
  }

  if (thumb && pinky && index && middle && !ring) {
    return 8;
  }

  const raisedFingerCount = getRaisedFingerCount(fingers);

  return raisedFingerCount > 0 ? raisedFingerCount : null;
}

function getChordVoicing(fingers: FingerPositions): ChordVoicing {
  const { thumb, index, middle, ring, pinky } = fingers;

  if (!thumb) {
    const raisedFingerCount = [index, middle, ring, pinky].filter(
      Boolean,
    ).length;

    if (raisedFingerCount === 2) {
      return "triadFirst";
    }

    if (raisedFingerCount === 3) {
      return "triadSecond";
    }

    if (raisedFingerCount === 4) {
      return "triadRootOctave";
    }

    return "triadRoot";
  }

  if (!index) {
    return !middle && !ring && !pinky ? "suspendedRoot" : "triadRoot";
  }

  if (!middle) {
    return "seventhRoot";
  }

  if (!ring) {
    return "seventhFirst";
  }

  if (!pinky) {
    return "seventhSecond";
  }

  return "seventhThird";
}

function getScaleSemitone(semitones: readonly number[], scaleNote: number) {
  const octave = Math.floor(scaleNote / semitones.length);
  const semitone = semitones[scaleNote % semitones.length];

  return octave * 12 + semitone;
}

function getAlternateTriadQuality(
  chordSemitones: [number, number, number],
): [number, number, number] {
  const [chordRoot, chordThird, chordFifth] = chordSemitones;
  const thirdInterval = chordThird - chordRoot;
  const fifthInterval = chordFifth - chordRoot;

  if (thirdInterval === 4 && fifthInterval === 7) {
    return [chordRoot, chordThird - 1, chordFifth];
  }

  if (thirdInterval === 3 && fifthInterval === 7) {
    return [chordRoot, chordThird + 1, chordFifth];
  }

  if (thirdInterval === 3 && fifthInterval === 6) {
    return [chordRoot, chordThird + 1, chordFifth + 2];
  }

  if (thirdInterval === 4 && fifthInterval === 8) {
    return [chordRoot, chordThird - 1, chordFifth - 2];
  }

  return chordSemitones;
}

function getChordFrequencies(
  degree: number,
  root: number,
  scale: Scale,
  voicing: ChordVoicing,
  alternateQuality: boolean,
) {
  const semitones = scaleSemitones[scale];
  const scaleNote = degree - 1;
  const { noteOffsets, inversion, octave } = chordVoicingSettings[voicing];
  const defaultChordSemitones = noteOffsets.map((noteOffset) =>
    getScaleSemitone(semitones, scaleNote + noteOffset),
  );
  const chordSemitones = alternateQuality
    ? [
        ...getAlternateTriadQuality(
          defaultChordSemitones.slice(0, 3) as [number, number, number],
        ),
        ...defaultChordSemitones.slice(3),
      ]
    : defaultChordSemitones;
  const invertedChordSemitones = [
    ...chordSemitones.slice(inversion),
    ...chordSemitones.slice(0, inversion).map((semitone) => semitone + 12),
  ].map((semitone) => semitone + octave * 12);

  return invertedChordSemitones.map((semitone) => {
    const midiNote = middleC + root + semitone;

    return 440 * 2 ** ((midiNote - 69) / 12);
  });
}

function updateChordFrequencies(
  audioContext: AudioContext,
  chord: ActiveChord,
  root: number,
  scale: Scale,
  voicing: ChordVoicing,
  alternateQuality: boolean,
  waveform: Waveform,
) {
  const frequencies = getChordFrequencies(
    chord.degree,
    root,
    scale,
    voicing,
    alternateQuality,
  );

  while (chord.oscillators.length < frequencies.length) {
    const oscillator = audioContext.createOscillator();
    const frequency = frequencies[chord.oscillators.length];

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(chord.filter);
    setOscillatorsWaveform(audioContext, [oscillator], waveform);
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

  chord.voicing = voicing;
  chord.alternateQuality = alternateQuality;

  chord.oscillators.forEach((oscillator, index) => {
    oscillator.frequency.setTargetAtTime(
      frequencies[index],
      audioContext.currentTime,
      0.01,
    );
  });
}

function getFilterSettings(sliderProgress: number | null) {
  if (sliderProgress === null) {
    return {
      frequency: defaultFilterFrequency,
      resonance: defaultFilterResonance,
    };
  }

  const tilt = sliderProgress * 2 - 1;
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

function updateChordFilter(
  audioContext: AudioContext,
  chord: ActiveChord,
  sliderProgress: number | null,
) {
  const { frequency, resonance } = getFilterSettings(sliderProgress);

  chord.filter.frequency.setTargetAtTime(
    frequency,
    audioContext.currentTime,
    0.04,
  );
  chord.filter.Q.setTargetAtTime(resonance, audioContext.currentTime, 0.04);
}

function getChordGain(sliderProgress: number | null) {
  if (sliderProgress === null) {
    return maximumChordGain;
  }

  return Math.max(silentGain, (1 - sliderProgress) * maximumChordGain);
}

function updateChordGain(
  audioContext: AudioContext,
  chord: ActiveChord,
  sliderProgress: number | null,
) {
  chord.gain.gain.setTargetAtTime(
    getChordGain(sliderProgress),
    audioContext.currentTime,
    0.04,
  );
}

function startChord(
  audioContext: AudioContext,
  degree: number,
  filterProgress: number | null,
  gainProgress: number | null,
  root: number,
  scale: Scale,
  voicing: ChordVoicing,
  alternateQuality: boolean,
  waveform: Waveform,
): ActiveChord {
  const startTime = audioContext.currentTime;
  const { frequency, resonance } = getFilterSettings(filterProgress);
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(frequency, startTime);
  filter.Q.setValueAtTime(resonance, startTime);
  filter.connect(gain);

  gain.gain.setValueAtTime(silentGain, startTime);
  gain.gain.exponentialRampToValueAtTime(
    getChordGain(gainProgress),
    startTime + chordAttackSeconds,
  );
  gain.connect(audioContext.destination);

  const oscillators = getChordFrequencies(
    degree,
    root,
    scale,
    voicing,
    alternateQuality,
  ).map((noteFrequency) => {
    const oscillator = audioContext.createOscillator();

    oscillator.frequency.setValueAtTime(noteFrequency, startTime);
    oscillator.connect(filter);

    return oscillator;
  });

  setOscillatorsWaveform(audioContext, oscillators, waveform);

  for (const oscillator of oscillators) {
    oscillator.start(startTime);
  }

  return {
    alternateQuality,
    degree,
    voicing,
    oscillators,
    filter,
    gain,
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

export function useAudio(
  data: HandTrackingData,
  root: number,
  scale: Scale,
  waveform: Waveform,
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeChordRef = useRef<ActiveChord | null>(null);
  const lastChordDegreeRef = useRef<number | null>(null);
  const candidateChordDegreeRef = useRef<number | null>(null);
  const pendingChordDegreeRef = useRef<number | null>(null);
  const latestFilterProgressRef = useRef<number | null>(null);
  const latestGainProgressRef = useRef<number | null>(null);
  const latestRootRef = useRef(root);
  const latestScaleRef = useRef(scale);
  const latestVoicingRef = useRef<ChordVoicing>("triadRoot");
  const latestAlternateQualityRef = useRef(false);
  const latestWaveformRef = useRef(waveform);
  const chordChangeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    latestRootRef.current = root;
    latestScaleRef.current = scale;

    const audioContext = audioContextRef.current;
    const activeChord = activeChordRef.current;

    if (!audioContext || !activeChord) {
      return;
    }

    updateChordFrequencies(
      audioContext,
      activeChord,
      root,
      scale,
      latestVoicingRef.current,
      latestAlternateQualityRef.current,
      latestWaveformRef.current,
    );
  }, [root, scale]);

  useEffect(() => {
    latestWaveformRef.current = waveform;

    const audioContext = audioContextRef.current;
    const activeChord = activeChordRef.current;

    if (!audioContext || !activeChord) {
      return;
    }

    setOscillatorsWaveform(audioContext, activeChord.oscillators, waveform);
  }, [waveform]);

  useEffect(() => {
    const unlockAudio = () => {
      const audioContext =
        audioContextRef.current ??
        (audioContextRef.current = new AudioContext());

      void audioContext.resume().then(
        () => {
          const pendingChordDegree = pendingChordDegreeRef.current;

          if (pendingChordDegree !== null) {
            const activeChord = activeChordRef.current;

            if (activeChord) {
              releaseChord(audioContext, activeChord);
            }

            activeChordRef.current = startChord(
              audioContext,
              pendingChordDegree,
              latestFilterProgressRef.current,
              latestGainProgressRef.current,
              latestRootRef.current,
              latestScaleRef.current,
              latestVoicingRef.current,
              latestAlternateQualityRef.current,
              latestWaveformRef.current,
            );
            pendingChordDegreeRef.current = null;
          }
        },
        () => undefined,
      );
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      pendingChordDegreeRef.current = null;
      activeChordRef.current = null;

      if (chordChangeTimeoutRef.current !== null) {
        window.clearTimeout(chordChangeTimeoutRef.current);
        chordChangeTimeoutRef.current = null;
      }

      const audioContext = audioContextRef.current;
      audioContextRef.current = null;

      if (audioContext) {
        void audioContext.close();
      }
    };
  }, []);

  useEffect(() => {
    const leftHand = data.Left;
    const activeChord = activeChordRef.current;
    const isHoldingChord = leftHand?.handOrientation === "neither";
    const chordDegree = isHoldingChord
      ? (activeChord?.degree ?? null)
      : leftHand
        ? getChordDegree(leftHand.fingers)
        : null;
    const voicing = data.Right
      ? getChordVoicing(data.Right.fingers)
      : latestVoicingRef.current;
    const alternateQuality =
      leftHand?.handOrientation === "backwards"
        ? true
        : leftHand?.handOrientation === "straight"
          ? false
          : latestAlternateQualityRef.current;
    const filterProgress =
      data.Left?.sliderProgress ?? latestFilterProgressRef.current;
    const gainProgress =
      data.Right?.sliderProgress ?? latestGainProgressRef.current;

    latestFilterProgressRef.current = filterProgress;
    latestGainProgressRef.current = gainProgress;
    latestVoicingRef.current = voicing;
    latestAlternateQualityRef.current = alternateQuality;

    const audioContext = audioContextRef.current;

    if (audioContext?.state === "running" && activeChord) {
      updateChordFilter(audioContext, activeChord, filterProgress);
      updateChordGain(audioContext, activeChord, gainProgress);

      if (
        chordDegree !== null &&
        (voicing !== activeChord.voicing ||
          alternateQuality !== activeChord.alternateQuality)
      ) {
        updateChordFrequencies(
          audioContext,
          activeChord,
          latestRootRef.current,
          latestScaleRef.current,
          voicing,
          alternateQuality,
          latestWaveformRef.current,
        );
      }
    }

    if (isHoldingChord) {
      if (chordChangeTimeoutRef.current !== null) {
        window.clearTimeout(chordChangeTimeoutRef.current);
        chordChangeTimeoutRef.current = null;
      }

      candidateChordDegreeRef.current = chordDegree;
      lastChordDegreeRef.current = chordDegree;
      pendingChordDegreeRef.current = null;
      return;
    }

    if (chordDegree === candidateChordDegreeRef.current) {
      return;
    }

    candidateChordDegreeRef.current = chordDegree;

    if (chordChangeTimeoutRef.current !== null) {
      window.clearTimeout(chordChangeTimeoutRef.current);
    }

    const holdTime =
      chordDegree === null
        ? trackingLossGraceMilliseconds
        : chordHoldTimeMilliseconds;

    chordChangeTimeoutRef.current = window.setTimeout(() => {
      chordChangeTimeoutRef.current = null;

      if (
        chordDegree !== candidateChordDegreeRef.current ||
        chordDegree === lastChordDegreeRef.current
      ) {
        return;
      }

      lastChordDegreeRef.current = chordDegree;
      pendingChordDegreeRef.current = chordDegree;

      if (chordDegree === null) {
        const currentAudioContext = audioContextRef.current;
        const currentChord = activeChordRef.current;

        if (currentAudioContext && currentChord) {
          releaseChord(currentAudioContext, currentChord);
          activeChordRef.current = null;
        }

        return;
      }

      const currentAudioContext =
        audioContextRef.current ??
        (audioContextRef.current = new AudioContext());

      void currentAudioContext.resume().then(
        () => {
          if (pendingChordDegreeRef.current === chordDegree) {
            const currentChord = activeChordRef.current;

            if (currentChord) {
              releaseChord(currentAudioContext, currentChord);
            }

            activeChordRef.current = startChord(
              currentAudioContext,
              chordDegree,
              latestFilterProgressRef.current,
              latestGainProgressRef.current,
              latestRootRef.current,
              latestScaleRef.current,
              latestVoicingRef.current,
              latestAlternateQualityRef.current,
              latestWaveformRef.current,
            );
            pendingChordDegreeRef.current = null;
          }
        },
        () => undefined,
      );
    }, holdTime);
  }, [data]);
}
