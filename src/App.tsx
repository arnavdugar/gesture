import { useState } from "preact/hooks";

import * as styles from "./App.css";
import { Dropdown } from "./components/Dropdown";
import { HandOverlay } from "./HandOverlay";
import type { Scale } from "./music";
import { useAudioOutput, type Waveform } from "./useAudioOutput";
import { useGesturePerformance } from "./useGesturePerformance";
import { useHandTracking } from "./useHandTracking";
import { useMidiDevices } from "./useMidiDevices";
import { useMidiOutput } from "./useMidiOutput";

const rootOptions = [
  { label: "A", value: -3 },
  { label: "A♯ / B♭", value: -2 },
  { label: "B", value: -1 },
  { label: "C", value: 0 },
  { label: "C♯ / D♭", value: 1 },
  { label: "D", value: 2 },
  { label: "D♯ / E♭", value: 3 },
  { label: "E", value: 4 },
  { label: "F", value: 5 },
  { label: "F♯ / G♭", value: 6 },
  { label: "G", value: 7 },
  { label: "G♯ / A♭", value: 8 },
] satisfies ReadonlyArray<{ label: string; value: number }>;

const scaleOptions = [
  { label: "Major", value: "major" },
  { label: "Minor", value: "minor" },
  { label: "Dorian", value: "dorian" },
  { label: "Phrygian", value: "phrygian" },
  { label: "Lydian", value: "lydian" },
  { label: "Mixolydian", value: "mixolydian" },
  { label: "Locrian", value: "locrian" },
] satisfies ReadonlyArray<{ label: string; value: Scale }>;

const waveformOptions = [
  { label: "None", value: "none" },
  { label: "Sawtooth", value: "sawtooth" },
  { label: "Sine", value: "sine" },
  { label: "Square", value: "square" },
  { label: "Triangle", value: "triangle" },
] satisfies ReadonlyArray<{ label: string; value: Waveform }>;

export function App() {
  const [root, setRoot] = useState<number>(0);
  const [scale, setScale] = useState<Scale>("major");
  const [waveform, setWaveform] = useState<Waveform>("sawtooth");
  const { videoRef, videoWidth, videoHeight, data } = useHandTracking();
  const performance = useGesturePerformance(data, { root, scale });
  const {
    enableMidi,
    outputs: midiOutputs,
    selectedOutput,
    selectOutput,
    status: midiStatus,
  } = useMidiDevices();
  const midiOutputOptions = [
    { label: "None", value: "" },
    ...midiOutputs.map((output) => ({
      label: output.name ?? "Unnamed MIDI output",
      value: output.id,
    })),
  ];
  useMidiOutput(performance, selectedOutput);
  useAudioOutput(performance, waveform);

  return (
    <>
      <video ref={videoRef} class={styles.video} playsInline muted />
      <HandOverlay
        videoWidth={videoWidth}
        videoHeight={videoHeight}
        data={data}
      />
      <div class={styles.menu}>
        <Dropdown
          label="Root:"
          options={rootOptions}
          value={root}
          onChange={(event) => setRoot(parseInt(event.currentTarget.value))}
        />
        <Dropdown
          label="Scale:"
          options={scaleOptions}
          value={scale}
          onChange={(event) => setScale(event.currentTarget.value as Scale)}
        />
        <Dropdown
          label="Waveform:"
          options={waveformOptions}
          value={waveform}
          onChange={(event) =>
            setWaveform(event.currentTarget.value as Waveform)
          }
        />
        {midiStatus === "enabled" ? (
          <Dropdown
            label="MIDI:"
            options={midiOutputOptions}
            value={selectedOutput?.id ?? ""}
            onChange={(event) =>
              selectOutput(event.currentTarget.value || null)
            }
          />
        ) : (
          <div class={styles.midiControl}>
            <span>MIDI:</span>
            <button
              class={styles.midiButton}
              disabled={midiStatus !== "idle"}
              type="button"
              onClick={enableMidi}
            >
              {midiStatus === "unsupported"
                ? "Unsupported"
                : midiStatus === "unavailable"
                  ? "Unavailable"
                  : midiStatus === "enabling"
                    ? "Enabling…"
                    : "Enable"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
