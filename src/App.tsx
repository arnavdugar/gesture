import { useState } from "preact/hooks";

import * as styles from "./App.css";
import { Dropdown } from "./components/dropdown";
import { HandOverlay } from "./HandOverlay";
import { useAudio, type Scale, type Waveform } from "./useAudio";
import { useHandTracking } from "./useHandTracking";

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
  { label: "Sawtooth", value: "sawtooth" },
  { label: "Sine", value: "sine" },
  { label: "Square", value: "square" },
  { label: "Triangle", value: "triangle" },
  { label: "Organ", value: "organ" },
  { label: "Pulse", value: "pulse" },
  { label: "Shimmer", value: "shimmer" },
] satisfies ReadonlyArray<{ label: string; value: Waveform }>;

export function App() {
  const [root, setRoot] = useState<number>(0);
  const [scale, setScale] = useState<Scale>("major");
  const [waveform, setWaveform] = useState<Waveform>("sawtooth");
  const { videoRef, videoWidth, videoHeight, data } = useHandTracking();
  useAudio(data, root, scale, waveform);

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
      </div>
    </>
  );
}
