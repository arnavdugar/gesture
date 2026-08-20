import type { Handedness } from "../hooks/useHandTracking";
import type { MusicalPerformance } from "../hooks/useGesturePerformance";
import { getChordMidiNotes, type Scale } from "../music";
import * as styles from "./ChordGrid.css";

const chordDegrees = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const pitchClassNames = [
  "C",
  "C♯",
  "D",
  "D♯",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
  "A",
  "A♯",
  "B",
] as const;
const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII"];
const chordQualityLabels: Readonly<Record<ChordQuality, string>> = {
  augmented: "augmented",
  diminished: "diminished",
  major: "major",
  minor: "minor",
};

type ChordQuality = "major" | "minor" | "diminished" | "augmented";

type ChordDescription = {
  name: string;
  numeral: string;
};

type ChordGridProps = {
  dominantHand: Handedness;
  performance: MusicalPerformance | null;
  root: number;
  scale: Scale;
};

type ChordCellProps = {
  active: boolean;
  chord: ChordDescription;
};

function getChordQuality(notes: readonly number[]): ChordQuality {
  const chordRoot = notes[0];
  const third = (notes[1] - chordRoot + 12) % 12;
  const fifth = (notes[2] - chordRoot + 12) % 12;

  if (third === 3 && fifth === 6) {
    return "diminished";
  }

  if (third === 4 && fifth === 8) {
    return "augmented";
  }

  return third === 3 ? "minor" : "major";
}

function getChordDescription(
  degree: number,
  root: number,
  scale: Scale,
  alternateQuality: boolean,
): ChordDescription {
  const notes = getChordMidiNotes(
    degree,
    root,
    scale,
    "triadRoot",
    alternateQuality,
  );
  const quality = getChordQuality(notes);
  const lowerCaseNumeral = quality === "minor" || quality === "diminished";
  const baseNumeral = romanNumerals[(degree - 1) % romanNumerals.length];
  const qualitySuffix =
    quality === "diminished" ? "°" : quality === "augmented" ? "⁺" : "";
  const octaveSuffix = degree > romanNumerals.length ? "⁺" : "";
  const pitchClass = pitchClassNames[((notes[0] % 12) + 12) % 12];
  const displayPitchClass =
    quality === "minor" || quality === "diminished"
      ? pitchClass.toLowerCase()
      : pitchClass;

  return {
    name: `${displayPitchClass} ${chordQualityLabels[quality]}`,
    numeral: `${lowerCaseNumeral ? baseNumeral.toLowerCase() : baseNumeral}${qualitySuffix}${octaveSuffix}`,
  };
}

function ChordCell({ active, chord }: ChordCellProps) {
  return (
    <div
      aria-current={active ? "true" : undefined}
      class={styles.cell}
      data-active={active ? "true" : undefined}
      role="cell"
    >
      <span class={styles.numeral}>{chord.numeral}</span>
      <span class={styles.chordName}>{chord.name}</span>
    </div>
  );
}

export function ChordGrid({
  dominantHand,
  performance,
  root,
  scale,
}: ChordGridProps) {
  const secondaryHand = dominantHand === "Left" ? "Right" : "Left";

  return (
    <div
      aria-label="Secondary hand chords"
      class={`${styles.grid} ${styles.side[secondaryHand]}`}
      role="table"
    >
      <div class={styles.row} role="row">
        <div class={styles.columnHeader} role="columnheader">
          Palm Forward
        </div>
        <div class={styles.columnHeader} role="columnheader">
          Palm Backward
        </div>
      </div>
      {chordDegrees.map((degree) => {
        const forwardChord = getChordDescription(degree, root, scale, false);
        const backwardChord = getChordDescription(degree, root, scale, true);

        return (
          <div class={styles.row} key={degree} role="row">
            <ChordCell
              active={
                performance?.degree === degree && !performance.alternateQuality
              }
              chord={forwardChord}
            />
            <ChordCell
              active={
                performance?.degree === degree && performance.alternateQuality
              }
              chord={backwardChord}
            />
          </div>
        );
      })}
    </div>
  );
}
