import type { Handedness } from "../hooks/useHandTracking";
import type { MusicalPerformance } from "../hooks/useGesturePerformance";
import {
  chordDegrees,
  getChordMidiNotes,
  type ChordDegree,
  type Scale,
} from "../music";
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
import * as gridStyles from "./GestureGrid.css";
import * as styles from "./ChordGrid.css";

const handIcons: Readonly<Record<ChordDegree, string>> = {
  [-2]: degreeFiveBelowHand,
  [-1]: degreeSixBelowHand,
  0: degreeSevenBelowHand,
  1: degreeOneHand,
  2: degreeTwoHand,
  3: degreeThreeHand,
  4: degreeFourHand,
  5: degreeFiveHand,
  6: degreeSixHand,
  7: degreeSevenHand,
  8: degreeEightHand,
};
const pitchClassNames = [
  "C",
  "C♯ / D♭",
  "D",
  "D♯ / E♭",
  "E",
  "F",
  "F♯ / G♭",
  "G",
  "G♯ / A♭",
  "A",
  "A♯ / B♭",
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
  notes: readonly number[],
): ChordDescription {
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

  return {
    name: `${pitchClass} ${chordQualityLabels[quality]}`,
    numeral: `${lowerCaseNumeral ? baseNumeral.toLowerCase() : baseNumeral}${qualitySuffix}${upperOctaveSuffix}`,
    octaveSuffix,
  };
}

function ChordCell({ active, chord }: ChordCellProps) {
  return (
    <div
      aria-current={active ? "true" : undefined}
      class={gridStyles.cell}
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
      class={`${gridStyles.grid} ${styles.grid} ${gridStyles.side[secondaryHand]}`}
      role="table"
    >
      <div class={gridStyles.row} role="row">
        <div aria-hidden="true" />
        <div class={gridStyles.columnHeader} role="columnheader">
          Palm Forward
        </div>
        <div class={gridStyles.columnHeader} role="columnheader">
          Palm Backward
        </div>
      </div>
      {chordDegrees.map(({ degree, raisedFingers }) => {
        const { notes, alternateNotes } = getChordMidiNotes(
          degree,
          root,
          scale,
          "triadRoot",
        );
        const forwardChord = getChordDescription(degree, notes);
        const backwardChord = getChordDescription(degree, alternateNotes);

        return (
          <div class={gridStyles.row} key={degree} role="row">
            <div
              aria-label={`Degree ${degree}: ${raisedFingers.join(" + ")} raised`}
              class={gridStyles.handCell}
              role="rowheader"
            >
              <img
                alt=""
                aria-hidden="true"
                class={gridStyles.handIcon}
                data-handedness={secondaryHand}
                src={handIcons[degree]}
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
