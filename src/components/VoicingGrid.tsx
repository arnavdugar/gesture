import { Fragment } from "preact";

import type { Handedness } from "../hooks/useHandTracking";
import type { MusicalPerformance } from "../hooks/useGesturePerformance";
import { chordVoicings, type ChordVoicing } from "../music";
import closedHand from "../assets/hands/1.png";
import indexHand from "../assets/hands/2.png";
import indexMiddleHand from "../assets/hands/3.png";
import indexMiddleRingHand from "../assets/hands/4.png";
import fourFingersHand from "../assets/hands/5.png";
import openHand from "../assets/hands/6.png";
import thumbPinkyHand from "../assets/hands/7.png";
import thumbIndexPinkyHand from "../assets/hands/8.png";
import thumbIndexMiddlePinkyHand from "../assets/hands/9.png";
import thumbHand from "../assets/hands/10.png";
import thumbIndexHand from "../assets/hands/11.png";
import thumbIndexMiddleHand from "../assets/hands/12.png";
import thumbIndexMiddleRingHand from "../assets/hands/13.png";
import indexPinkyHand from "../assets/hands/14.png";
import indexMiddlePinkyHand from "../assets/hands/15.png";
import pinkyHand from "../assets/hands/16.png";
import * as gridStyles from "./GestureGrid.css";
import * as styles from "./VoicingGrid.css";

const handIcons: Readonly<Record<ChordVoicing, string>> = {
  triadRoot: closedHand,
  triadFirst: indexHand,
  triadSecond: indexMiddleHand,
  triadRootOctave: indexMiddleRingHand,
  triadOpen: fourFingersHand,
  seventhRoot: thumbHand,
  seventhFirst: thumbIndexHand,
  seventhSecond: thumbIndexMiddleHand,
  seventhThird: thumbIndexMiddleRingHand,
  seventhRootOctave: openHand,
  suspendedSecond: indexPinkyHand,
  suspendedRoot: indexMiddlePinkyHand,
  rootFifth: pinkyHand,
  seventhShell: thumbPinkyHand,
  addedNinth: thumbIndexPinkyHand,
  ninthRoot: thumbIndexMiddlePinkyHand,
};

const voicingGroups = [
  {
    headings: ["Triad", "Seventh"],
    rows: [
      ["triadRoot", "seventhRoot"],
      ["triadFirst", "seventhFirst"],
      ["triadSecond", "seventhSecond"],
      ["triadRootOctave", "seventhThird"],
      ["triadOpen", "seventhRootOctave"],
    ],
  },
  {
    headings: ["Suspended / Fifth", "Seventh / Ninth"],
    rows: [
      ["suspendedSecond", "seventhShell"],
      ["suspendedRoot", "addedNinth"],
      ["rootFifth", "ninthRoot"],
    ],
  },
] as const satisfies ReadonlyArray<{
  headings: readonly [string, string];
  rows: ReadonlyArray<readonly [ChordVoicing, ChordVoicing]>;
}>;

type VoicingGridProps = {
  performance: MusicalPerformance | null;
  dominantHand: Handedness;
};

type VoicingCellProps = {
  active: boolean;
  handedness: Handedness;
  voicing: ChordVoicing;
};

function VoicingCell({ active, handedness, voicing }: VoicingCellProps) {
  const { label, raisedFingers } = chordVoicings[voicing];
  const gestureLabel = raisedFingers.length
    ? `${raisedFingers.join(" + ")} raised`
    : "Closed hand";

  return (
    <div
      aria-current={active ? "true" : undefined}
      aria-label={`${gestureLabel}: ${label}`}
      class={styles.option}
      role="cell"
    >
      <div
        aria-hidden="true"
        class={`${gridStyles.handCell} ${styles.handCell}`}
      >
        <img
          alt=""
          class={gridStyles.handIcon}
          data-handedness={handedness}
          src={handIcons[voicing]}
        />
      </div>
      <div
        class={`${gridStyles.cell} ${styles.cell}`}
        data-active={active ? "true" : undefined}
      >
        <span class={styles.label}>{label}</span>
      </div>
    </div>
  );
}

export function VoicingGrid({ performance, dominantHand }: VoicingGridProps) {
  const activeVoicing = performance?.voicing;

  return (
    <div
      aria-label="Dominant hand voicings"
      class={`${gridStyles.grid} ${styles.grid} ${gridStyles.side[dominantHand]}`}
      role="table"
    >
      {voicingGroups.map(({ headings, rows }) => (
        <Fragment key={headings[0]}>
          <div class={gridStyles.row} role="row">
            {headings.map((heading) => (
              <div
                class={`${gridStyles.columnHeader} ${styles.columnHeader}`}
                key={heading}
                role="columnheader"
              >
                {heading}
              </div>
            ))}
          </div>
          {rows.map((voicings) => (
            <div class={gridStyles.row} key={voicings[0]} role="row">
              {voicings.map((voicing) => (
                <VoicingCell
                  active={activeVoicing === voicing}
                  handedness={dominantHand}
                  key={voicing}
                  voicing={voicing}
                />
              ))}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
