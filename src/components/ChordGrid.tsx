import type { Handedness } from "../hooks/useHandTracking";
import type { MusicalPerformance } from "../hooks/useGesturePerformance";
import { getChordMidiNotes, type Scale } from "../music";
import degreeOneHand from "../assets/hands/2.png";
import degreeTwoHand from "../assets/hands/3.png";
import degreeThreeHand from "../assets/hands/4.png";
import degreeFourHand from "../assets/hands/5.png";
import degreeFiveHand from "../assets/hands/6.png";
import degreeSixHand from "../assets/hands/7.png";
import degreeSevenHand from "../assets/hands/8.png";
import degreeEightHand from "../assets/hands/9.png";
import degreeSevenBelowHand from "../assets/hands/11.png";
import degreeSixBelowHand from "../assets/hands/12.png";
import degreeFiveBelowHand from "../assets/hands/13.png";
import * as styles from "./ChordGrid.css";

const chordRows = [
  { degree: -2, handIcon: degreeFiveBelowHand },
  { degree: -1, handIcon: degreeSixBelowHand },
  { degree: 0, handIcon: degreeSevenBelowHand },
  { degree: 1, handIcon: degreeOneHand },
  { degree: 2, handIcon: degreeTwoHand },
  { degree: 3, handIcon: degreeThreeHand },
  { degree: 4, handIcon: degreeFourHand },
  { degree: 5, handIcon: degreeFiveHand },
  { degree: 6, handIcon: degreeSixHand },
  { degree: 7, handIcon: degreeSevenHand },
  { degree: 8, handIcon: degreeEightHand },
] as const;
const pitchClassNames = [
  "C",
  "C♯ / B♭",
  "D",
  "D♯ / C♭",
  "E",
  "F",
  "F♯ / E♭",
  "G",
  "G♯ / F♭",
  "A",
  "A♯ / G♭",
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
  octaveSuffix: string;
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
  const numeralIndex =
    (((degree - 1) % romanNumerals.length) + romanNumerals.length) %
    romanNumerals.length;
  const baseNumeral = romanNumerals[numeralIndex];
  const qualitySuffix =
    quality === "diminished" ? "°" : quality === "augmented" ? "⁺" : "";
  const octaveSuffix = degree < 1 ? "-8" : "";
  const upperOctaveSuffix = degree > romanNumerals.length ? "⁺" : "";
  const pitchClass = pitchClassNames[((notes[0] % 12) + 12) % 12];
  const displayPitchClass =
    quality === "minor" || quality === "diminished"
      ? pitchClass.toLowerCase()
      : pitchClass;

  return {
    name: `${displayPitchClass} ${chordQualityLabels[quality]}`,
    numeral: `${lowerCaseNumeral ? baseNumeral.toLowerCase() : baseNumeral}${qualitySuffix}${upperOctaveSuffix}`,
    octaveSuffix,
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
      <span class={styles.numeral}>
        {chord.numeral}
        {chord.octaveSuffix && <sup>({chord.octaveSuffix}ve)</sup>}
      </span>
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
      class={`${styles.grid} ${styles.chordGrid} ${styles.side[secondaryHand]}`}
      role="table"
    >
      <div class={styles.row} role="row">
        <div aria-hidden="true" />
        <div class={styles.columnHeader} role="columnheader">
          Palm Forward
        </div>
        <div class={styles.columnHeader} role="columnheader">
          Palm Backward
        </div>
      </div>
      {chordRows.map(({ degree, handIcon }) => {
        const forwardChord = getChordDescription(degree, root, scale, false);
        const backwardChord = getChordDescription(degree, root, scale, true);

        return (
          <div class={styles.row} key={degree} role="row">
            <div
              aria-label={`Degree ${degree} hand gesture`}
              class={styles.handCell}
              role="rowheader"
            >
              <img
                alt=""
                aria-hidden="true"
                class={styles.handIcon}
                src={handIcon}
              />
            </div>
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
