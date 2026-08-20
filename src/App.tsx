import { useState } from "preact/hooks";

import * as styles from "./App.css";
import { ChordGrid } from "./components/ChordGrid";
import { Dropdown } from "./components/Dropdown";
import { HandOverlay } from "./components/HandOverlay";
import { Settings } from "./components/Settings";
import { VoicingGrid } from "./components/VoicingGrid";
import { useAudioOutput, type Waveform } from "./hooks/useAudioOutput";
import { useGesturePerformance } from "./hooks/useGesturePerformance";
import { useHandTracking } from "./hooks/useHandTracking";
import { useMidiDevices } from "./hooks/useMidiDevices";
import { useMidiOutput } from "./hooks/useMidiOutput";
import { useSettings } from "./hooks/useSettings";
import type { Scale } from "./music";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, updateSetting } = useSettings();
  const { dominantHand, midiChannel, root, scale, waveform } = settings;
  const { videoRef, videoWidth, videoHeight, data } = useHandTracking();
  const performance = useGesturePerformance(data, {
    dominantHand,
    root,
    scale,
  });
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
  const learnMidiControl = useMidiOutput(
    performance,
    selectedOutput,
    midiChannel,
  );
  useAudioOutput(performance, waveform);

  return (
    <>
      <video ref={videoRef} class={styles.video} playsInline muted />
      <HandOverlay
        videoWidth={videoWidth}
        videoHeight={videoHeight}
        data={data}
      />
      <ChordGrid
        dominantHand={dominantHand}
        performance={performance}
        root={root}
        scale={scale}
      />
      <VoicingGrid data={data} dominantHand={dominantHand} />
      <div class={styles.menu}>
        <Dropdown
          label="Root"
          options={rootOptions}
          value={root}
          onChange={(event) =>
            updateSetting("root", parseInt(event.currentTarget.value))
          }
        />
        <Dropdown
          label="Scale"
          options={scaleOptions}
          value={scale}
          onChange={(event) =>
            updateSetting("scale", event.currentTarget.value as Scale)
          }
        />
        <Dropdown
          label="Waveform"
          options={waveformOptions}
          value={waveform}
          onChange={(event) =>
            updateSetting("waveform", event.currentTarget.value as Waveform)
          }
        />
        {midiStatus === "enabled" ? (
          <Dropdown
            label="MIDI"
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
        <div class={styles.settingsMenu}>
          <button
            aria-controls="settings-panel"
            aria-expanded={settingsOpen}
            aria-haspopup="dialog"
            class={styles.settingsButton}
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
          >
            Settings
          </button>
        </div>
      </div>
      <Settings
        dominantHand={dominantHand}
        midiChannel={midiChannel}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onDominantHandChange={(handedness) =>
          updateSetting("dominantHand", handedness)
        }
        onMidiChannelChange={(channel) => updateSetting("midiChannel", channel)}
        onMidiControlLearn={learnMidiControl}
      />
    </>
  );
}
