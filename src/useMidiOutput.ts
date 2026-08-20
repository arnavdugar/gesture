import { useEffect, useRef } from "preact/hooks";

import type { MusicalPerformance } from "./useGesturePerformance";

const midiChannel = 0;
const midiNoteOn = 0x90;
const midiNoteOff = 0x80;
const midiControlChange = 0xb0;
const midiExpressionController = 11;
const midiBrightnessController = 74;
const midiAllNotesOffController = 123;
const midiNoteVelocity = 100;

type ActiveMidiChord = {
  brightness: number;
  expression: number;
  notes: readonly number[];
  output: MIDIOutput;
};

function getMidiBrightness(leftSlider: number | null) {
  return Math.round((leftSlider ?? 0.5) * 127);
}

function getMidiExpression(rightSlider: number | null) {
  return Math.round((1 - (rightSlider ?? 0)) * 127);
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

function releaseMidiChord(chord: ActiveMidiChord) {
  for (const note of chord.notes) {
    sendMidiMessage(chord.output, [midiNoteOff | midiChannel, note, 0]);
  }

  sendMidiMessage(chord.output, [
    midiControlChange | midiChannel,
    midiAllNotesOffController,
    0,
  ]);
}

function startMidiChord(
  output: MIDIOutput,
  performance: MusicalPerformance,
): ActiveMidiChord | null {
  if (output.state !== "connected") {
    return null;
  }

  const brightness = getMidiBrightness(performance.leftSlider);
  const expression = getMidiExpression(performance.rightSlider);

  sendMidiMessage(output, [
    midiControlChange | midiChannel,
    midiBrightnessController,
    brightness,
  ]);
  sendMidiMessage(output, [
    midiControlChange | midiChannel,
    midiExpressionController,
    expression,
  ]);

  for (const note of performance.notes) {
    sendMidiMessage(output, [midiNoteOn | midiChannel, note, midiNoteVelocity]);
  }

  return { brightness, expression, notes: performance.notes, output };
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
  const brightness = getMidiBrightness(performance.leftSlider);
  const expression = getMidiExpression(performance.rightSlider);

  if (brightness !== chord.brightness) {
    sendMidiMessage(chord.output, [
      midiControlChange | midiChannel,
      midiBrightnessController,
      brightness,
    ]);
    chord.brightness = brightness;
  }

  if (expression !== chord.expression) {
    sendMidiMessage(chord.output, [
      midiControlChange | midiChannel,
      midiExpressionController,
      expression,
    ]);
    chord.expression = expression;
  }
}

function replaceMidiChord(
  activeChord: ActiveMidiChord | null,
  output: MIDIOutput,
  performance: MusicalPerformance,
) {
  if (
    activeChord?.output === output &&
    areNotesEqual(activeChord.notes, performance.notes)
  ) {
    updateMidiControllers(activeChord, performance);
    return activeChord;
  }

  if (activeChord) {
    releaseMidiChord(activeChord);
  }

  return startMidiChord(output, performance);
}

export function useMidiOutput(
  performance: MusicalPerformance | null,
  output: MIDIOutput | null,
) {
  const activeChordRef = useRef<ActiveMidiChord | null>(null);

  useEffect(() => {
    const activeChord = activeChordRef.current;

    if (!performance || !output) {
      if (activeChord) {
        releaseMidiChord(activeChord);
        activeChordRef.current = null;
      }

      return;
    }

    activeChordRef.current = replaceMidiChord(activeChord, output, performance);
  }, [output, performance]);

  useEffect(
    () => () => {
      const activeChord = activeChordRef.current;
      activeChordRef.current = null;

      if (activeChord) {
        releaseMidiChord(activeChord);
      }
    },
    [],
  );
}
