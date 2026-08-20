import { useEffect, useRef, useState } from "preact/hooks";

import {
  getChordDegree,
  getChordMidiNotes,
  getChordVoicing,
  type ChordVoicing,
  type Scale,
} from "./music";
import type { HandTrackingData } from "./useHandTracking";

const chordHoldTimeMilliseconds = 100;
const trackingLossGraceMilliseconds = 50;

export type MusicalPerformance = {
  leftSlider: number | null;
  notes: readonly number[];
  rightSlider: number | null;
  triggerId: number;
};

type GestureSettings = {
  root: number;
  scale: Scale;
};

type ActiveChord = {
  degree: number;
  triggerId: number;
};

type GestureState = {
  alternateQuality: boolean;
  leftSlider: number | null;
  rightSlider: number | null;
  voicing: ChordVoicing;
};

export function useGesturePerformance(
  data: HandTrackingData,
  { root, scale }: GestureSettings,
): MusicalPerformance | null {
  const [activeChord, setActiveChord] = useState<ActiveChord | null>(null);
  const gestureStateRef = useRef<GestureState>({
    alternateQuality: false,
    leftSlider: null,
    rightSlider: null,
    voicing: "triadRoot",
  });
  const candidateChordDegreeRef = useRef<number | null>(null);
  const lastChordDegreeRef = useRef<number | null>(null);
  const nextTriggerIdRef = useRef(1);
  const chordChangeTimeoutRef = useRef<number | null>(null);

  const leftHand = data.Left;
  const previousGestureState = gestureStateRef.current;
  const isHoldingChord = leftHand?.handOrientation === "neither";
  const chordDegree = isHoldingChord
    ? (activeChord?.degree ?? null)
    : leftHand
      ? getChordDegree(leftHand.fingers)
      : null;
  const voicing = data.Right
    ? getChordVoicing(data.Right.fingers)
    : previousGestureState.voicing;
  const alternateQuality =
    leftHand?.handOrientation === "backwards"
      ? true
      : leftHand?.handOrientation === "straight"
        ? false
        : previousGestureState.alternateQuality;
  const leftSlider =
    data.Left?.sliderProgress ?? previousGestureState.leftSlider;
  const rightSlider =
    data.Right?.sliderProgress ?? previousGestureState.rightSlider;

  gestureStateRef.current = {
    alternateQuality,
    leftSlider,
    rightSlider,
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
    leftSlider,
    notes: getChordMidiNotes(
      activeChord.degree,
      root,
      scale,
      voicing,
      alternateQuality,
    ),
    rightSlider,
    triggerId: activeChord.triggerId,
  };
}
