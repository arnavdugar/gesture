import {
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

import * as styles from "../App.css";
import {
  fingerLandmarkIndexes,
  fingerNames,
  fingertipIndexes,
  getSliderStartAngle,
  palmIndexes,
  sliderArc,
  type Handedness,
  type HandTrackingData,
} from "../hooks/useHandTracking";

type Point = {
  x: number;
  y: number;
};

type HandOverlayProps = {
  videoWidth: number;
  videoHeight: number;
  data: HandTrackingData;
};

const handednessLabels: Handedness[] = ["Left", "Right"];

function project(
  landmark: NormalizedLandmark,
  videoWidth: number,
  videoHeight: number,
): Point {
  return {
    x: (1 - landmark.x) * videoWidth,
    y: landmark.y * videoHeight,
  };
}

function insetLine(
  start: Point,
  end: Point,
  startInset: number,
  endInset: number,
) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const length = Math.hypot(deltaX, deltaY);

  if (length === 0) {
    return null;
  }

  const unitX = deltaX / length;
  const unitY = deltaY / length;

  return {
    x1: start.x + unitX * startInset,
    y1: start.y + unitY * startInset,
    x2: end.x - unitX * endInset,
    y2: end.y - unitY * endInset,
  };
}

function arcPath(
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  clockwise = true,
) {
  const start = {
    x: center.x + Math.cos(startAngle) * radius,
    y: center.y + Math.sin(startAngle) * radius,
  };
  const end = {
    x: center.x + Math.cos(endAngle) * radius,
    y: center.y + Math.sin(endAngle) * radius,
  };
  const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  const sweep = clockwise ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

export function HandOverlay({
  videoWidth,
  videoHeight,
  data,
}: HandOverlayProps) {
  return (
    <svg
      class={styles.overlay}
      viewBox={`0 0 ${videoWidth} ${videoHeight}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {handednessLabels.map((handedness) => {
        const hand = data[handedness];

        if (!hand) {
          return null;
        }

        const { landmarks } = hand;
        const points = landmarks.map((landmark) =>
          project(landmark, videoWidth, videoHeight),
        );
        const palmCenter = palmIndexes.reduce(
          (center, index) => ({
            x: center.x + points[index].x / palmIndexes.length,
            y: center.y + points[index].y / palmIndexes.length,
          }),
          { x: 0, y: 0 },
        );
        const wrist = points[0];
        const sliderRadius = Math.hypot(
          wrist.x - palmCenter.x,
          wrist.y - palmCenter.y,
        );
        const sliderStartAngle = getSliderStartAngle(handedness);
        const sliderClockwise = handedness === "Left";
        const sliderInsideAngle = sliderClockwise
          ? sliderStartAngle
          : sliderStartAngle + sliderArc;
        const sliderValueAngle =
          sliderInsideAngle +
          (sliderClockwise ? 1 : -1) * (hand.sliderProgress ?? 0) * sliderArc;

        return (
          <g key={handedness} stroke-linecap="round" stroke-linejoin="round">
            <g stroke="rgba(255, 255, 255, 0.5)" stroke-width={1}>
              {HandLandmarker.HAND_CONNECTIONS.map((connection) => {
                const line = insetLine(
                  points[connection.start],
                  points[connection.end],
                  fingertipIndexes.has(connection.start) ? 8 : 0,
                  fingertipIndexes.has(connection.end) ? 8 : 0,
                );

                return line ? (
                  <line
                    key={`${connection.start}-${connection.end}`}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                  />
                ) : null;
              })}
            </g>

            <g fill="white">
              {points.map((point, index) =>
                fingertipIndexes.has(index) ? null : (
                  <circle key={index} cx={point.x} cy={point.y} r={4} />
                ),
              )}
            </g>

            <g stroke="white" stroke-width={1}>
              {fingerNames.map((finger) => {
                const point = points[fingerLandmarkIndexes[finger].tip];

                return (
                  <circle
                    key={finger}
                    cx={point.x}
                    cy={point.y}
                    r={6}
                    fill={hand.fingers[finger] ? "white" : "none"}
                  />
                );
              })}
              <circle cx={palmCenter.x} cy={palmCenter.y} r={16} fill="none" />
            </g>

            {hand.sliderProgress !== null && (
              <g fill="none" stroke-width={4}>
                <path
                  d={arcPath(
                    palmCenter,
                    sliderRadius,
                    sliderStartAngle,
                    sliderStartAngle + sliderArc,
                  )}
                  stroke="rgba(255, 255, 255, 0.35)"
                />
                <path
                  d={arcPath(
                    palmCenter,
                    sliderRadius,
                    sliderInsideAngle,
                    sliderValueAngle,
                    sliderClockwise,
                  )}
                  stroke="white"
                />
                <circle cx={wrist.x} cy={wrist.y} r={4} fill="white" />
              </g>
            )}

            <text
              x={palmCenter.x}
              y={palmCenter.y + 1.5}
              fill="white"
              font-size={16}
              font-weight={600}
              text-anchor="middle"
              dominant-baseline="middle"
            >
              {handedness[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
