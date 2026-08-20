import type { Handedness, HandTrackingData } from "../hooks/useHandTracking";
import { getChordVoicing, type ChordVoicing } from "../music";
import * as gridStyles from "./ChordGrid.css";
import * as styles from "./VoicingGrid.css";

type VoicingOption = {
  label: string;
  value: ChordVoicing;
};

const voicingRows: ReadonlyArray<
  readonly [VoicingOption, VoicingOption | null]
> = [
  [
    { label: "Root", value: "triadRoot" },
    { label: "Root", value: "seventhRoot" },
  ],
  [
    { label: "1st inversion", value: "triadFirst" },
    { label: "1st inversion", value: "seventhFirst" },
  ],
  [
    { label: "2nd inversion", value: "triadSecond" },
    { label: "2nd inversion", value: "seventhSecond" },
  ],
  [
    { label: "Octave", value: "triadRootOctave" },
    { label: "3rd inversion", value: "seventhThird" },
  ],
  [{ label: "Suspended", value: "suspendedRoot" }, null],
];

type VoicingGridProps = {
  data: HandTrackingData;
  dominantHand: Handedness;
};

type VoicingCellProps = {
  active: boolean;
  option: VoicingOption;
};

function VoicingCell({ active, option }: VoicingCellProps) {
  return (
    <div
      aria-current={active ? "true" : undefined}
      class={`${gridStyles.cell} ${styles.cell}`}
      data-active={active ? "true" : undefined}
      role="cell"
    >
      <span class={styles.label}>{option.label}</span>
    </div>
  );
}

export function VoicingGrid({ data, dominantHand }: VoicingGridProps) {
  const dominantHandData = data[dominantHand];
  const activeVoicing = dominantHandData
    ? getChordVoicing(dominantHandData.fingers)
    : null;

  return (
    <div
      aria-label="Dominant hand voicings"
      class={`${gridStyles.grid} ${gridStyles.side[dominantHand]}`}
      role="table"
    >
      <div class={gridStyles.row} role="row">
        <div class={gridStyles.columnHeader} role="columnheader">
          Triad
        </div>
        <div class={gridStyles.columnHeader} role="columnheader">
          Seventh
        </div>
      </div>
      {voicingRows.map(([triad, seventh]) => (
        <div class={gridStyles.row} key={triad.value} role="row">
          <VoicingCell active={activeVoicing === triad.value} option={triad} />
          {seventh ? (
            <VoicingCell
              active={activeVoicing === seventh.value}
              option={seventh}
            />
          ) : (
            <div
              aria-label="Not applicable"
              class={styles.emptyCell}
              role="cell"
            />
          )}
        </div>
      ))}
    </div>
  );
}
