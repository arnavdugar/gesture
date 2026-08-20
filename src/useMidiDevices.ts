import { useCallback, useEffect, useState } from "preact/hooks";

type MidiStatus =
  "idle" | "enabling" | "enabled" | "unsupported" | "unavailable";

function getConnectedOutputs(midiAccess: MIDIAccess) {
  return Array.from(midiAccess.outputs.values())
    .filter((output) => output.state === "connected")
    .sort((first, second) =>
      (first.name ?? "").localeCompare(second.name ?? ""),
    );
}

export function useMidiDevices() {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [outputs, setOutputs] = useState<MIDIOutput[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const isSupported = "requestMIDIAccess" in navigator;
  const [status, setStatus] = useState<MidiStatus>(
    isSupported ? "idle" : "unsupported",
  );

  useEffect(() => {
    if (!midiAccess) {
      return;
    }

    const refreshOutputs = () => {
      const nextOutputs = getConnectedOutputs(midiAccess);

      setOutputs(nextOutputs);
      setSelectedOutputId((currentOutputId) =>
        nextOutputs.some((output) => output.id === currentOutputId)
          ? currentOutputId
          : null,
      );
    };

    refreshOutputs();
    midiAccess.addEventListener("statechange", refreshOutputs);

    return () => {
      midiAccess.removeEventListener("statechange", refreshOutputs);
    };
  }, [midiAccess]);

  const enableMidi = useCallback(async () => {
    if (status !== "idle") {
      return;
    }

    setStatus("enabling");

    try {
      const nextMidiAccess = await navigator.requestMIDIAccess();
      const outputs = getConnectedOutputs(nextMidiAccess);

      setMidiAccess(nextMidiAccess);
      setOutputs(outputs);
      setStatus("enabled");
    } catch {
      setStatus("unavailable");
    }
  }, [status]);

  const selectedOutput =
    outputs.find((output) => output.id === selectedOutputId) ?? null;

  return {
    enableMidi,
    outputs,
    selectedOutput,
    selectOutput: setSelectedOutputId,
    status,
  };
}
