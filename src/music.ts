import type { FingerPositions } from "./useHandTracking";

const scaleSemitones = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
} as const;

const chordVoicings = {
  triadRoot: [0, 2, 4],
  triadFirst: [2, 4, 7],
  triadSecond: [4, 7, 9],
  triadRootOctave: [7, 9, 11],
  suspendedRoot: [0, 3, 4],
  seventhRoot: [0, 2, 4, 6],
  seventhFirst: [2, 4, 6, 7],
  seventhSecond: [4, 6, 7, 9],
  seventhThird: [6, 7, 9, 11],
} as const;

const middleC = 60;

export type Scale = keyof typeof scaleSemitones;
export type ChordVoicing = keyof typeof chordVoicings;

function getRaisedFingerCount(fingers: FingerPositions) {
  return Object.values(fingers).filter(Boolean).length;
}

export function getChordDegree(fingers: FingerPositions) {
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

export function getChordVoicing(fingers: FingerPositions): ChordVoicing {
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

export function getChordMidiNotes(
  degree: number,
  root: number,
  scale: Scale,
  voicing: ChordVoicing,
  alternateQuality: boolean,
) {
  const semitones = scaleSemitones[scale];
  const scaleNote = degree - 1;
  const qualityNoteOffsets =
    voicing === "suspendedRoot" ? [0, 3, 4] : [0, 2, 4];
  const defaultQualitySemitones = qualityNoteOffsets.map((noteOffset) =>
    getScaleSemitone(semitones, scaleNote + noteOffset),
  ) as [number, number, number];
  const alternateQualitySemitones = alternateQuality
    ? getAlternateTriadQuality(defaultQualitySemitones)
    : defaultQualitySemitones;
  const qualityAdjustments = alternateQualitySemitones.map(
    (semitone, index) => semitone - defaultQualitySemitones[index],
  );

  return chordVoicings[voicing].map((noteOffset) => {
    const chordTone = noteOffset % semitones.length;
    const qualityToneIndex = qualityNoteOffsets.indexOf(chordTone);
    const adjustment =
      qualityToneIndex === -1 ? 0 : qualityAdjustments[qualityToneIndex];
    const semitone =
      getScaleSemitone(semitones, scaleNote + noteOffset) + adjustment;

    return middleC + root + semitone;
  });
}
