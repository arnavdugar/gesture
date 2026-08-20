import { useEffect, useState } from "preact/hooks";

import type { Handedness } from "../hooks/useHandTracking";
import type { MidiLearnControl } from "../hooks/useMidiOutput";
import { Dropdown } from "./Dropdown";
import * as styles from "./Settings.css";

const dominantHandOptions = [
  { label: "Right", value: "Right" },
  { label: "Left", value: "Left" },
] satisfies ReadonlyArray<{ label: string; value: Handedness }>;

const midiChannelOptions = Array.from({ length: 16 }, (_, index) => ({
  label: String(index + 1),
  value: index + 1,
}));

const midiControlRows = ["dominant", "secondary"] as const;
const midiControlColumns = ["angle", "horizontal", "vertical"] as const;

type SettingsProps = {
  dominantHand: Handedness;
  midiChannel: number;
  onClose: () => void;
  onDominantHandChange: (handedness: Handedness) => void;
  onMidiChannelChange: (channel: number) => void;
  onMidiControlLearn: (control: MidiLearnControl | null) => void;
  open: boolean;
};

export function Settings({
  dominantHand,
  midiChannel,
  onClose,
  onDominantHandChange,
  onMidiChannelChange,
  onMidiControlLearn,
  open,
}: SettingsProps) {
  const [learningControl, setLearningControl] =
    useState<MidiLearnControl | null>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      aria-labelledby="settings-title"
      aria-modal="true"
      class={styles.panel}
      id="settings-panel"
      role="dialog"
    >
      <div class={styles.header}>
        <h2 class={styles.title} id="settings-title">
          Settings
        </h2>
        <button
          aria-label="Close settings"
          autoFocus
          class={styles.closeButton}
          type="button"
          onClick={onClose}
        >
          <span aria-hidden="true" class="material-symbols-outlined">
            close
          </span>
        </button>
      </div>
      <section aria-labelledby="hands-settings-title" class={styles.section}>
        <h3 class={styles.sectionTitle} id="hands-settings-title">
          Hands
        </h3>
        <Dropdown
          label="Dominant Hand"
          options={dominantHandOptions}
          value={dominantHand}
          onChange={(event) =>
            onDominantHandChange(event.currentTarget.value as Handedness)
          }
        />
      </section>
      <section aria-labelledby="midi-settings-title" class={styles.section}>
        <h3 class={styles.sectionTitle} id="midi-settings-title">
          MIDI
        </h3>
        <Dropdown
          label="Channel"
          options={midiChannelOptions}
          value={midiChannel}
          onChange={(event) =>
            onMidiChannelChange(parseInt(event.currentTarget.value))
          }
        />
        <div
          aria-label="MIDI learn controls"
          class={styles.midiLearnGrid}
          role="table"
        >
          <div class={styles.midiLearnRow} role="row">
            <span aria-hidden="true" />
            {midiControlColumns.map((column) => (
              <span
                class={styles.midiLearnColumnHeader}
                key={column}
                role="columnheader"
              >
                {column}
              </span>
            ))}
          </div>
          {midiControlRows.map((row) => (
            <div class={styles.midiLearnRow} key={row} role="row">
              <span class={styles.midiLearnRowHeader} role="rowheader">
                {row}
              </span>
              {midiControlColumns.map((column) => {
                const control: MidiLearnControl = `${row}-${column}`;
                const isLearning = learningControl === control;

                return (
                  <span class={styles.midiLearnCell} key={control} role="cell">
                    <button
                      aria-label={
                        isLearning
                          ? `Stop learning ${row} ${column} MIDI control`
                          : `Learn ${row} ${column} MIDI control`
                      }
                      aria-pressed={isLearning}
                      class={styles.midiLearnButton}
                      type="button"
                      onClick={() => {
                        const nextControl = isLearning ? null : control;
                        setLearningControl(nextControl);
                        onMidiControlLearn(nextControl);
                      }}
                    >
                      {isLearning ? "Learning" : "Learn"}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
