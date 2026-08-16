import {
  FilesetResolver,
  HandLandmarker,
  type Landmark,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "preact/hooks";

const wasmPath =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const modelPath =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
export const fingerNames = [
  "thumb",
  "index",
  "middle",
  "ring",
  "pinky",
] as const;
const fingerRaisedAngle = (Math.PI * 2) / 3;
export const fingerLandmarkIndexes = {
  thumb: { tip: 4 },
  index: { base: 5, joint: 6, tip: 8 },
  middle: { base: 9, joint: 10, tip: 12 },
  ring: { base: 13, joint: 14, tip: 16 },
  pinky: { base: 17, joint: 18, tip: 20 },
} as const;
export const fingertipIndexes: ReadonlySet<number> = new Set(
  fingerNames.map((finger) => fingerLandmarkIndexes[finger].tip),
);
export const palmIndexes = [0, 5, 17];
const handednessLabels = ["Left", "Right"] as const;
const orientationThreshold = Math.PI / 12;
const sliderTilt = Math.PI / 6;
export const sliderArc = (2 * Math.PI) / 3;
const cameraNormal = { x: 0, y: 0, z: 1 };

export type Handedness = (typeof handednessLabels)[number];
type HandOrientation = "straight" | "backwards" | "neither";
type FingerName = (typeof fingerNames)[number];
export type FingerPositions = Record<FingerName, boolean>;
type Point3D = Pick<Landmark, "x" | "y" | "z">;

export type HandTrackingData = Record<
  Handedness,
  {
    landmarks: NormalizedLandmark[];
    handOrientation: HandOrientation;
    sliderProgress: number | null;
    fingers: FingerPositions;
  } | null
>;
type HandCandidate = {
  landmarks: NormalizedLandmark[];
  worldLandmarks: Landmark[];
  score: number;
};

type HandCandidates = Record<Handedness, HandCandidate | null>;

function getVector(from: Point3D, to: Point3D) {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
    z: to.z - from.z,
  };
}

function getVectorLength(vector: Point3D) {
  return Math.hypot(vector.x, vector.y, vector.z);
}

function getDotProduct(first: Point3D, second: Point3D) {
  return first.x * second.x + first.y * second.y + first.z * second.z;
}

function getCrossProduct(first: Point3D, second: Point3D) {
  return {
    x: first.y * second.z - first.z * second.y,
    y: first.z * second.x - first.x * second.z,
    z: first.x * second.y - first.y * second.x,
  };
}

function getAngle(first: Landmark, vertex: Landmark, second: Landmark) {
  const vertexToFirst = getVector(vertex, first);
  const vertexToSecond = getVector(vertex, second);
  const magnitude =
    getVectorLength(vertexToFirst) * getVectorLength(vertexToSecond);

  if (magnitude === 0) {
    return 0;
  }

  const cosine = getDotProduct(vertexToFirst, vertexToSecond) / magnitude;

  return Math.acos(Math.max(-1, Math.min(1, cosine)));
}

function getSignedAngle(first: Point3D, second: Point3D, planeNormal: Point3D) {
  const normalLength = getVectorLength(planeNormal);

  if (normalLength === 0) {
    return 0;
  }

  return Math.atan2(
    getDotProduct(planeNormal, getCrossProduct(first, second)) / normalLength,
    getDotProduct(first, second),
  );
}

function getHandOrientation(
  landmarks: Landmark[],
  handedness: Handedness,
): HandOrientation {
  const wrist = landmarks[0];
  const wristToIndexBase = getVector(wrist, landmarks[5]);
  const wristToPinkyBase = getVector(wrist, landmarks[17]);
  const rawAngle = getSignedAngle(
    wristToIndexBase,
    wristToPinkyBase,
    cameraNormal,
  );
  const angle = handedness === "Right" ? -rawAngle : rawAngle;

  if (angle > orientationThreshold) {
    return "straight";
  }

  if (angle < -orientationThreshold) {
    return "backwards";
  }

  return "neither";
}

function getFingerPositions(landmarks: Landmark[]): FingerPositions {
  return Object.fromEntries(
    fingerNames.map((finger) => {
      if (finger === "thumb") {
        const thumbJointAngle = getAngle(
          landmarks[2],
          landmarks[3],
          landmarks[4],
        );
        const acrossPalm = getVector(landmarks[17], landmarks[5]);
        const indexToThumbTip = getVector(
          landmarks[5],
          landmarks[fingerLandmarkIndexes.thumb.tip],
        );
        const palmWidthSquared = getDotProduct(acrossPalm, acrossPalm);
        const outwardSpan =
          palmWidthSquared === 0
            ? 0
            : getDotProduct(indexToThumbTip, acrossPalm) / palmWidthSquared;
        const thumbRaised =
          thumbJointAngle >= Math.PI * 0.83 && outwardSpan >= 0.2;

        return [finger, thumbRaised];
      }

      const { base, joint, tip } = fingerLandmarkIndexes[finger];
      const jointAngle = getAngle(
        landmarks[base],
        landmarks[joint],
        landmarks[tip],
      );
      const jointDistance = getVectorLength(
        getVector(landmarks[0], landmarks[joint]),
      );
      const tipDistance = getVectorLength(
        getVector(landmarks[0], landmarks[tip]),
      );
      const position =
        jointAngle >= fingerRaisedAngle && tipDistance > jointDistance;

      return [finger, position];
    }),
  ) as FingerPositions;
}

export function getSliderStartAngle(handedness: Handedness) {
  const tilt = handedness === "Left" ? sliderTilt : -sliderTilt;

  return Math.PI / 2 - sliderArc / 2 + tilt;
}

function getSliderProgress(
  landmarks: NormalizedLandmark[],
  video: HTMLVideoElement,
  handedness: Handedness,
) {
  const wrist = landmarks[0];
  const palmCenter = palmIndexes.reduce(
    (center, index) => ({
      x: center.x + landmarks[index].x / palmIndexes.length,
      y: center.y + landmarks[index].y / palmIndexes.length,
    }),
    { x: 0, y: 0 },
  );
  const wristAngle = Math.atan2(
    (wrist.y - palmCenter.y) * video.videoHeight,
    (palmCenter.x - wrist.x) * video.videoWidth,
  );
  const startAngle = getSliderStartAngle(handedness);
  const angleFromStart =
    (wristAngle - startAngle + Math.PI * 2) % (Math.PI * 2);
  const distanceFromEnd = angleFromStart - sliderArc;
  const distanceFromStart = Math.PI * 2 - angleFromStart;
  const progress =
    angleFromStart <= sliderArc
      ? angleFromStart / sliderArc
      : distanceFromStart < distanceFromEnd
        ? 0
        : 1;

  return handedness === "Left" ? progress : 1 - progress;
}

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [frame, setFrame] = useState({
    videoWidth: 0,
    videoHeight: 0,
    data: {
      Left: null,
      Right: null,
    } as HandTrackingData,
  });

  useEffect(() => {
    let stream: MediaStream | undefined;
    let videoElement: HTMLVideoElement | undefined;
    let handLandmarker: HandLandmarker | undefined;
    let videoFrameCallback: number | undefined;
    let disposed = false;

    const loadHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(wasmPath);
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: modelPath, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 2,
      });

      if (disposed) {
        landmarker.close();
        return null;
      }

      handLandmarker = landmarker;
      return landmarker;
    };

    const connectWebcam = async (video: HTMLVideoElement) => {
      videoElement = video;
      const webcamStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });

      if (disposed) {
        webcamStream.getTracks().forEach((track) => track.stop());
        return;
      }

      stream = webcamStream;
      video.srcObject = webcamStream;
      await video.play();
    };

    const initialize = async () => {
      const video = videoRef.current;

      if (!video) {
        throw new Error("Unable to find the video element.");
      }

      const [landmarker] = await Promise.all([
        loadHandLandmarker(),
        connectWebcam(video),
      ]);

      if (disposed || !landmarker) {
        return;
      }

      const processFrame = (timestamp: DOMHighResTimeStamp) => {
        const result = landmarker.detectForVideo(video, timestamp);
        const bestCandidates: HandCandidates = {
          Left: null,
          Right: null,
        };

        for (const [index, categories] of result.handedness.entries()) {
          const category = categories[0];
          const handedness = category?.categoryName;

          if (handedness !== "Left" && handedness !== "Right") {
            continue;
          }

          const score = category?.score ?? -Infinity;
          const currentBest = bestCandidates[handedness];

          if (!currentBest || score > currentBest.score) {
            bestCandidates[handedness] = {
              landmarks: result.landmarks[index],
              worldLandmarks: result.worldLandmarks[index],
              score,
            };
          }
        }

        const nextData: HandTrackingData = {
          Left: null,
          Right: null,
        };

        for (const handedness of handednessLabels) {
          const candidate = bestCandidates[handedness];

          if (!candidate) {
            continue;
          }

          const handOrientation = getHandOrientation(
            candidate.worldLandmarks,
            handedness,
          );
          const sliderProgress =
            handOrientation === "neither"
              ? null
              : getSliderProgress(candidate.landmarks, video, handedness);
          const fingers = getFingerPositions(candidate.worldLandmarks);

          nextData[handedness] = {
            landmarks: candidate.landmarks,
            handOrientation,
            sliderProgress,
            fingers,
          };
        }

        setFrame({
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          data: nextData,
        });
        videoFrameCallback = video.requestVideoFrameCallback(processFrame);
      };
      videoFrameCallback = video.requestVideoFrameCallback(processFrame);
    };

    const dispose = () => {
      disposed = true;
      handLandmarker?.close();
      handLandmarker = undefined;

      if (videoFrameCallback !== undefined && videoElement) {
        videoElement.cancelVideoFrameCallback(videoFrameCallback);
      }
      videoFrameCallback = undefined;

      stream?.getTracks().forEach((track) => track.stop());
      stream = undefined;

      if (videoElement) {
        videoElement.srcObject = null;
      }
    };

    void initialize().catch((error: unknown) => {
      dispose();
      console.error("Unable to initialize hand tracking.", error);
    });

    return dispose;
  }, []);

  return { videoRef, ...frame };
}
