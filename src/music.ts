import type { FingerPositions } from "./hooks/useHandTracking";

type ChordVoicingDefinition = {
  label: string;
  raisedFingers: readonly (keyof FingerPositions)[];
  notes: readonly number[];
  qualityNoteOffsets: readonly [number, number, number];
};

const scaleSemitones = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
} as const;

// Intervals identify the third and fifth; offsets adjust root, third, and fifth.
const alternateQualityAdjustments = {
  major: { intervals: [4, 7], offsets: [0, -1, 0] },
  minor: { intervals: [3, 7], offsets: [0, 1, 0] },
  diminished: { intervals: [3, 6], offsets: [0, 1, 2] },
  augmented: { intervals: [4, 8], offsets: [0, -1, -2] },
} as const;

export const chordDegrees = [
  { degree: -2, raisedFingers: ["thumb", "index", "middle", "ring"] },
  { degree: -1, raisedFingers: ["thumb", "index", "middle"] },
  { degree: 0, raisedFingers: ["thumb", "index"] },
  { degree: 1, raisedFingers: ["index"] },
  { degree: 2, raisedFingers: ["index", "middle"] },
  { degree: 3, raisedFingers: ["index", "middle", "ring"] },
  { degree: 4, raisedFingers: ["index", "middle", "ring", "pinky"] },
  { degree: 5, raisedFingers: ["thumb", "index", "middle", "ring", "pinky"] },
  { degree: 6, raisedFingers: ["thumb", "pinky"] },
  { degree: 7, raisedFingers: ["thumb", "index", "pinky"] },
  { degree: 8, raisedFingers: ["thumb", "index", "middle", "pinky"] },
] as const satisfies ReadonlyArray<{
  degree: number;
  raisedFingers: readonly (keyof FingerPositions)[];
}>;

export const chordVoicings = {
  triadRoot: {
    label: "Root",
    raisedFingers: [],
    notes: [0, 2, 4],
    qualityNoteOffsets: [0, 2, 4],
  },
  triadFirst: {
    label: "1st inversion",
    raisedFingers: ["index"],
    notes: [2, 4, 7],
    qualityNoteOffsets: [0, 2, 4],
  },
  triadSecond: {
    label: "2nd inversion",
    raisedFingers: ["index", "middle"],
    notes: [4, 7, 9],
    qualityNoteOffsets: [0, 2, 4],
  },
  triadRootOctave: {
    label: "Octave",
    raisedFingers: ["index", "middle", "ring"],
    notes: [7, 9, 11],
    qualityNoteOffsets: [0, 2, 4],
  },
  triadOpen: {
    label: "Open voicing",
    raisedFingers: ["index", "middle", "ring", "pinky"],
    notes: [0, 4, 9],
    qualityNoteOffsets: [0, 2, 4],
  },
  seventhRoot: {
    label: "Root",
    raisedFingers: ["thumb"],
    notes: [0, 2, 4, 6],
    qualityNoteOffsets: [0, 2, 4],
  },
  seventhFirst: {
    label: "1st inversion",
    raisedFingers: ["thumb", "index"],
    notes: [2, 4, 6, 7],
    qualityNoteOffsets: [0, 2, 4],
  },
  seventhSecond: {
    label: "2nd inversion",
    raisedFingers: ["thumb", "index", "middle"],
    notes: [4, 6, 7, 9],
    qualityNoteOffsets: [0, 2, 4],
  },
  seventhThird: {
    label: "3rd inversion",
    raisedFingers: ["thumb", "index", "middle", "ring"],
    notes: [6, 7, 9, 11],
    qualityNoteOffsets: [0, 2, 4],
  },
  seventhRootOctave: {
    label: "Octave",
    raisedFingers: ["thumb", "index", "middle", "ring", "pinky"],
    notes: [7, 9, 11, 13],
    qualityNoteOffsets: [0, 2, 4],
  },
  suspendedSecond: {
    label: "Sus2",
    raisedFingers: ["index", "pinky"],
    notes: [0, 1, 4],
    qualityNoteOffsets: [0, 1, 4],
  },
  suspendedRoot: {
    label: "Sus4",
    raisedFingers: ["index", "middle", "pinky"],
    notes: [0, 3, 4],
    qualityNoteOffsets: [0, 3, 4],
  },
  rootFifth: {
    label: "Root + fifth",
    raisedFingers: ["pinky"],
    notes: [0, 4, 7],
    qualityNoteOffsets: [0, 2, 4],
  },
  seventhShell: {
    label: "Shell (1, 3, 7)",
    raisedFingers: ["thumb", "pinky"],
    notes: [0, 2, 6],
    qualityNoteOffsets: [0, 2, 4],
  },
  addedNinth: {
    label: "Add9",
    raisedFingers: ["thumb", "index", "pinky"],
    notes: [0, 2, 4, 8],
    qualityNoteOffsets: [0, 2, 4],
  },
  ninthRoot: {
    label: "Ninth",
    raisedFingers: ["thumb", "index", "middle", "pinky"],
    notes: [0, 2, 4, 6, 8],
    qualityNoteOffsets: [0, 2, 4],
  },
} as const satisfies Record<string, ChordVoicingDefinition>;

const middleC = 60;

export type Scale = keyof typeof scaleSemitones;
export type ChordDegree = (typeof chordDegrees)[number]["degree"];
export type ChordVoicing = keyof typeof chordVoicings;

function matchesGesture(
  fingers: FingerPositions,
  raisedFingers: readonly (keyof FingerPositions)[],
) {
  return (
    Object.values(fingers).filter(Boolean).length === raisedFingers.length &&
    raisedFingers.every((finger) => fingers[finger])
  );
}

export function getChordDegree(fingers: FingerPositions): ChordDegree | null {
  return (
    chordDegrees.find(({ raisedFingers }) =>
      matchesGesture(fingers, raisedFingers),
    )?.degree ?? null
  );
}

export function getChordVoicing(fingers: FingerPositions): ChordVoicing | null {
  const match = Object.entries(chordVoicings).find(([, gesture]) =>
    matchesGesture(fingers, gesture.raisedFingers),
  );

  return match ? (match[0] as ChordVoicing) : null;
}

function getScaleSemitone(semitones: readonly number[], scaleNote: number) {
  const octave = Math.floor(scaleNote / semitones.length);
  const scaleIndex =
    ((scaleNote % semitones.length) + semitones.length) % semitones.length;
  const semitone = semitones[scaleIndex];

  return octave * 12 + semitone;
}

export function getChordMidiNotes(
  degree: number,
  root: number,
  scale: Scale,
  voicing: ChordVoicing,
) {
  const semitones = scaleSemitones[scale];
  const scaleNote = degree - 1;
  const { notes: noteOffsets, qualityNoteOffsets }: ChordVoicingDefinition =
    chordVoicings[voicing];
  const notes = noteOffsets.map(
    (noteOffset) =>
      middleC + root + getScaleSemitone(semitones, scaleNote + noteOffset),
  );
  const [qualityRoot, qualityThird, qualityFifth] = qualityNoteOffsets.map(
    (noteOffset) => getScaleSemitone(semitones, scaleNote + noteOffset),
  );
  const qualityAdjustments = Object.values(alternateQualityAdjustments).find(
    ({ intervals: [third, fifth] }) =>
      third === qualityThird - qualityRoot &&
      fifth === qualityFifth - qualityRoot,
  )?.offsets ?? [0, 0, 0];

  const alternateNotes = notes.map((note, index) => {
    const chordTone = noteOffsets[index] % semitones.length;
    const qualityToneIndex = qualityNoteOffsets.indexOf(chordTone);
    const adjustment =
      qualityToneIndex === -1 ? 0 : qualityAdjustments[qualityToneIndex];

    return note + adjustment;
  });

  return { notes, alternateNotes };
}
