import { useEffect, useRef, useState } from "preact/hooks";

import {
  getChordDegree,
  getChordMidiNotes,
  getChordVoicing,
  type ChordVoicing,
  type Scale,
} from "../music";
import type { Handedness, HandTrackingData } from "./useHandTracking";

const chordHoldTimeMilliseconds = 100;
const trackingLossGraceMilliseconds = 50;

export type MusicalPerformance = {
  alternateQuality: boolean;
  degree: number;
  dominantSlider: number | null;
  notes: readonly number[];
  secondarySlider: number | null;
  triggerId: number;
  voicing: ChordVoicing;
};

type GestureSettings = {
  dominantHand: Handedness;
  root: number;
  scale: Scale;
};

type ActiveChord = {
  degree: number;
  triggerId: number;
};

type GestureState = {
  alternateQuality: boolean;
  sliders: Record<Handedness, number | null>;
  voicing: ChordVoicing;
};

export function useGesturePerformance(
  data: HandTrackingData,
  { dominantHand, root, scale }: GestureSettings,
): MusicalPerformance | null {
  const [activeChord, setActiveChord] = useState<ActiveChord | null>(null);
  const gestureStateRef = useRef<GestureState>({
    alternateQuality: false,
    sliders: {
      Left: null,
      Right: null,
    },
    voicing: "triadRoot",
  });
  const candidateChordDegreeRef = useRef<number | null>(null);
  const lastChordDegreeRef = useRef<number | null>(null);
  const nextTriggerIdRef = useRef(1);
  const chordChangeTimeoutRef = useRef<number | null>(null);

  const secondaryHandedness = dominantHand === "Left" ? "Right" : "Left";
  const dominantHandData = data[dominantHand];
  const secondaryHand = data[secondaryHandedness];
  const previousGestureState = gestureStateRef.current;
  const isHoldingChord = secondaryHand?.handOrientation === "neither";
  const chordDegree = isHoldingChord
    ? (activeChord?.degree ?? null)
    : secondaryHand
      ? getChordDegree(secondaryHand.fingers)
      : null;
  const voicing = dominantHandData
    ? getChordVoicing(dominantHandData.fingers)
    : previousGestureState.voicing;
  const alternateQuality =
    secondaryHand?.handOrientation === "backwards"
      ? true
      : secondaryHand?.handOrientation === "straight"
        ? false
        : previousGestureState.alternateQuality;
  const sliders = {
    Left: data.Left?.sliderProgress ?? previousGestureState.sliders.Left,
    Right: data.Right?.sliderProgress ?? previousGestureState.sliders.Right,
  };

  gestureStateRef.current = {
    alternateQuality,
    sliders,
    voicing,
  };

  useEffect(() => {
    if (isHoldingChord) {
      if (chordChangeTimeoutRef.current !== null) {
        window.clearTimeout(chordChangeTimeoutRef.current);
        chordChangeTimeoutRef.current = null;
      }

      candidateChordDegreeRef.current = chordDegree;
      lastChordDegreeRef.current = chordDegree;
      return;
    }

    if (chordDegree === candidateChordDegreeRef.current) {
      return;
    }

    candidateChordDegreeRef.current = chordDegree;

    if (chordChangeTimeoutRef.current !== null) {
      window.clearTimeout(chordChangeTimeoutRef.current);
    }

    const holdTime =
      chordDegree === null
        ? trackingLossGraceMilliseconds
        : chordHoldTimeMilliseconds;

    chordChangeTimeoutRef.current = window.setTimeout(() => {
      chordChangeTimeoutRef.current = null;

      if (
        chordDegree !== candidateChordDegreeRef.current ||
        chordDegree === lastChordDegreeRef.current
      ) {
        return;
      }

      lastChordDegreeRef.current = chordDegree;

      if (chordDegree === null) {
        setActiveChord(null);
        return;
      }

      setActiveChord({
        degree: chordDegree,
        triggerId: nextTriggerIdRef.current,
      });
      nextTriggerIdRef.current += 1;
    }, holdTime);
  }, [chordDegree, isHoldingChord]);

  useEffect(
    () => () => {
      if (chordChangeTimeoutRef.current !== null) {
        window.clearTimeout(chordChangeTimeoutRef.current);
      }
    },
    [],
  );

  if (!activeChord) {
    return null;
  }

  return {
    alternateQuality,
    degree: activeChord.degree,
    dominantSlider: sliders[dominantHand],
    notes: getChordMidiNotes(
      activeChord.degree,
      root,
      scale,
      voicing,
      alternateQuality,
    ),
    secondarySlider: sliders[secondaryHandedness],
    triggerId: activeChord.triggerId,
    voicing,
  };
}
