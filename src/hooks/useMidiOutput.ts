import { useCallback, useEffect, useRef } from "preact/hooks";

import type { MusicalPerformance } from "./useGesturePerformance";

const midiNoteOn = 0x90;
const midiNoteOff = 0x80;
const midiControlChange = 0xb0;
const midiDominantAngleController = 102;
const midiSecondaryAngleController = 105;
const midiAllNotesOffController = 123;
const midiNoteVelocity = 100;
const midiLearnSweepValues = [0, 32, 64, 96, 127, 96, 64, 32, 0] as const;
const midiLearnSweepStepMilliseconds = 60;

export type MidiLearnControl =
  | "dominant-angle"
  | "dominant-horizontal"
  | "dominant-vertical"
  | "secondary-angle"
  | "secondary-horizontal"
  | "secondary-vertical";

const midiLearnControllers: Readonly<Record<MidiLearnControl, number>> = {
  "dominant-angle": midiDominantAngleController,
  "dominant-horizontal": 103,
  "dominant-vertical": 104,
  "secondary-angle": midiSecondaryAngleController,
  "secondary-horizontal": 106,
  "secondary-vertical": 107,
};

type ActiveMidiChord = {
  brightness: number;
  channel: number;
  expression: number;
  notes: readonly number[];
  output: MIDIOutput;
};

function getMidiBrightness(secondarySlider: number | null) {
  return Math.round((secondarySlider ?? 0.5) * 127);
}

function getMidiExpression(dominantSlider: number | null) {
  return Math.round((1 - (dominantSlider ?? 0)) * 127);
}

function sendMidiMessage(output: MIDIOutput, message: number[]) {
  if (output.state !== "connected") {
    return false;
  }

  try {
    output.send(message);
    return true;
  } catch {
    return false;
  }
}

function getMidiStatus(messageType: number, channel: number) {
  return messageType | (channel - 1);
}

function releaseMidiChord(chord: ActiveMidiChord) {
  for (const note of chord.notes) {
    sendMidiMessage(chord.output, [
      getMidiStatus(midiNoteOff, chord.channel),
      note,
      0,
    ]);
  }
}

function silenceMidiChord(chord: ActiveMidiChord) {
  releaseMidiChord(chord);
  sendMidiMessage(chord.output, [
    getMidiStatus(midiControlChange, chord.channel),
    midiAllNotesOffController,
    0,
  ]);
}

function startMidiChord(
  output: MIDIOutput,
  performance: MusicalPerformance,
  channel: number,
): ActiveMidiChord | null {
  if (output.state !== "connected") {
    return null;
  }

  const brightness = getMidiBrightness(performance.secondarySlider);
  const expression = getMidiExpression(performance.dominantSlider);

  sendMidiMessage(output, [
    getMidiStatus(midiControlChange, channel),
    midiSecondaryAngleController,
    brightness,
  ]);
  sendMidiMessage(output, [
    getMidiStatus(midiControlChange, channel),
    midiDominantAngleController,
    expression,
  ]);

  for (const note of performance.notes) {
    sendMidiMessage(output, [
      getMidiStatus(midiNoteOn, channel),
      note,
      midiNoteVelocity,
    ]);
  }

  return {
    brightness,
    channel,
    expression,
    notes: performance.notes,
    output,
  };
}

function areNotesEqual(first: readonly number[], second: readonly number[]) {
  return (
    first.length === second.length &&
    first.every((note, index) => note === second[index])
  );
}

function updateMidiControllers(
  chord: ActiveMidiChord,
  performance: MusicalPerformance,
) {
  const brightness = getMidiBrightness(performance.secondarySlider);
  const expression = getMidiExpression(performance.dominantSlider);

  if (brightness !== chord.brightness) {
    sendMidiMessage(chord.output, [
      getMidiStatus(midiControlChange, chord.channel),
      midiSecondaryAngleController,
      brightness,
    ]);
    chord.brightness = brightness;
  }

  if (expression !== chord.expression) {
    sendMidiMessage(chord.output, [
      getMidiStatus(midiControlChange, chord.channel),
      midiDominantAngleController,
      expression,
    ]);
    chord.expression = expression;
  }
}

function replaceMidiChord(
  activeChord: ActiveMidiChord | null,
  output: MIDIOutput,
  performance: MusicalPerformance,
  channel: number,
) {
  if (
    activeChord?.output === output &&
    activeChord.channel === channel &&
    areNotesEqual(activeChord.notes, performance.notes)
  ) {
    updateMidiControllers(activeChord, performance);
    return activeChord;
  }

  if (activeChord) {
    releaseMidiChord(activeChord);
  }

  return startMidiChord(output, performance, channel);
}

export function useMidiOutput(
  performance: MusicalPerformance | null,
  output: MIDIOutput | null,
  channel: number,
) {
  const activeChordRef = useRef<ActiveMidiChord | null>(null);
  const midiLearnIntervalRef = useRef<number | null>(null);

  const cancelMidiLearnSweep = useCallback(() => {
    if (midiLearnIntervalRef.current !== null) {
      window.clearInterval(midiLearnIntervalRef.current);
      midiLearnIntervalRef.current = null;
    }
  }, []);

  const learnControl = useCallback(
    (control: MidiLearnControl | null) => {
      cancelMidiLearnSweep();

      if (!control) {
        return true;
      }

      if (!output) {
        return false;
      }

      const status = getMidiStatus(midiControlChange, channel);
      const controller = midiLearnControllers[control];
      let sweepIndex = 0;

      sendMidiMessage(output, [
        status,
        controller,
        midiLearnSweepValues[sweepIndex],
      ]);
      midiLearnIntervalRef.current = window.setInterval(() => {
        sweepIndex = (sweepIndex + 1) % midiLearnSweepValues.length;
        sendMidiMessage(output, [
          status,
          controller,
          midiLearnSweepValues[sweepIndex],
        ]);
      }, midiLearnSweepStepMilliseconds);

      return true;
    },
    [cancelMidiLearnSweep, channel, output],
  );

  useEffect(() => {
    const activeChord = activeChordRef.current;

    if (!performance || !output) {
      if (activeChord) {
        if (output) {
          releaseMidiChord(activeChord);
        } else {
          silenceMidiChord(activeChord);
        }
        activeChordRef.current = null;
      }

      return;
    }

    activeChordRef.current = replaceMidiChord(
      activeChord,
      output,
      performance,
      channel,
    );
  }, [channel, output, performance]);

  useEffect(
    () => () => {
      const activeChord = activeChordRef.current;
      activeChordRef.current = null;

      if (activeChord) {
        silenceMidiChord(activeChord);
      }
    },
    [],
  );

  useEffect(() => cancelMidiLearnSweep, [cancelMidiLearnSweep]);

  return learnControl;
}
