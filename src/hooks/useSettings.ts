import { useCallback, useEffect, useState } from "preact/hooks";

import type { Scale } from "../music";
import type { Waveform } from "./useAudioOutput";
import type { Handedness } from "./useHandTracking";

const settingsStorageKey = "gesture:settings";
const settingsStorageVersion = 1;

const scales = new Set<Scale>([
  "major",
  "minor",
  "dorian",
  "phrygian",
  "lydian",
  "mixolydian",
  "locrian",
]);
const waveforms = new Set<Waveform>([
  "none",
  "sawtooth",
  "sine",
  "square",
  "triangle",
]);

export type SettingsState = {
  dominantHand: Handedness;
  midiChannel: number;
  root: number;
  scale: Scale;
  waveform: Waveform;
};

export const defaultSettings: Readonly<SettingsState> = {
  dominantHand: "Right",
  midiChannel: 1,
  root: 0,
  scale: "major",
  waveform: "sine",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDominantHand(value: unknown): value is Handedness {
  return value === "Left" || value === "Right";
}

function isMidiChannel(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 16
  );
}

function isRoot(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= -3 &&
    value <= 8
  );
}

function isScale(value: unknown): value is Scale {
  return typeof value === "string" && scales.has(value as Scale);
}

function isWaveform(value: unknown): value is Waveform {
  return typeof value === "string" && waveforms.has(value as Waveform);
}

function loadSettings(): SettingsState {
  if (typeof window === "undefined") {
    return { ...defaultSettings };
  }

  try {
    const storedValue = window.localStorage.getItem(settingsStorageKey);

    if (!storedValue) {
      return { ...defaultSettings };
    }

    const storedPayload: unknown = JSON.parse(storedValue);

    if (
      !isRecord(storedPayload) ||
      storedPayload.version !== settingsStorageVersion ||
      !isRecord(storedPayload.settings)
    ) {
      return { ...defaultSettings };
    }

    const storedSettings = storedPayload.settings;

    return {
      dominantHand: isDominantHand(storedSettings.dominantHand)
        ? storedSettings.dominantHand
        : defaultSettings.dominantHand,
      midiChannel: isMidiChannel(storedSettings.midiChannel)
        ? storedSettings.midiChannel
        : defaultSettings.midiChannel,
      root: isRoot(storedSettings.root)
        ? storedSettings.root
        : defaultSettings.root,
      scale: isScale(storedSettings.scale)
        ? storedSettings.scale
        : defaultSettings.scale,
      waveform: isWaveform(storedSettings.waveform)
        ? storedSettings.waveform
        : defaultSettings.waveform,
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        settingsStorageKey,
        JSON.stringify({
          settings,
          version: settingsStorageVersion,
        }),
      );
    } catch {
      // Settings still work in memory when storage is unavailable.
    }
  }, [settings]);

  const updateSetting = useCallback(
    <Key extends keyof SettingsState>(key: Key, value: SettingsState[Key]) => {
      setSettings((currentSettings) => {
        if (Object.is(currentSettings[key], value)) {
          return currentSettings;
        }

        return { ...currentSettings, [key]: value };
      });
    },
    [],
  );

  const updateSettings = useCallback((updates: Partial<SettingsState>) => {
    setSettings((currentSettings) => ({ ...currentSettings, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...defaultSettings });
  }, []);

  return {
    resetSettings,
    settings,
    updateSetting,
    updateSettings,
  };
}
