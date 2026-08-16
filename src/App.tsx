import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef } from "preact/hooks";

import * as styles from "./App.css";

const wasmPath =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const modelPath =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const maxCanvasPixels = 1280 * 720;

type CoverRect = {
  x: number;
  y: number;
  scale: number;
};

function getCoverRect(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): CoverRect {
  const scale = Math.max(
    canvas.width / video.videoWidth,
    canvas.height / video.videoHeight,
  );
  const renderedWidth = video.videoWidth * scale;
  const renderedHeight = video.videoHeight * scale;

  return {
    x: (canvas.width - renderedWidth) / 2,
    y: (canvas.height - renderedHeight) / 2,
    scale,
  };
}

function drawHands(
  context: CanvasRenderingContext2D,
  result: HandLandmarkerResult,
  video: HTMLVideoElement,
  cover: CoverRect,
) {
  const project = (landmark: NormalizedLandmark) => ({
    x: cover.x + landmark.x * video.videoWidth * cover.scale,
    y: cover.y + landmark.y * video.videoHeight * cover.scale,
  });

  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(3, context.canvas.width / 400);
  context.strokeStyle = "rgba(255, 255, 255, 0.9)";
  context.fillStyle = "#ff5c35";

  for (const landmarks of result.landmarks) {
    for (const connection of HandLandmarker.HAND_CONNECTIONS) {
      const start = project(landmarks[connection.start]);
      const end = project(landmarks[connection.end]);

      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }

    for (const landmark of landmarks) {
      const point = project(landmark);

      context.beginPath();
      context.arc(point.x, point.y, context.lineWidth, 0, Math.PI * 2);
      context.fill();
    }
  }
}

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let handLandmarker: HandLandmarker | undefined;
    let latestResult: HandLandmarkerResult | undefined;
    let videoFrameCallback: number | undefined;
    let resizeObserver: ResizeObserver | undefined;
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
        return;
      }

      handLandmarker = landmarker;
    };

    const connectWebcam = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });

      if (disposed) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;
      await video.play();

      if (disposed) {
        return;
      }

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to create the canvas context.");
      }

      const resizeCanvas = () => {
        const deviceScale = Math.min(window.devicePixelRatio, 2);
        const targetWidth = Math.max(1, canvas.clientWidth * deviceScale);
        const targetHeight = Math.max(1, canvas.clientHeight * deviceScale);
        const pixelScale = Math.min(
          1,
          Math.sqrt(maxCanvasPixels / (targetWidth * targetHeight)),
        );
        const width = Math.round(targetWidth * pixelScale);
        const height = Math.round(targetHeight * pixelScale);

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          drawOverlay();
        }
      };

      const drawOverlay = () => {
        if (!video.videoWidth || !video.videoHeight) {
          return;
        }

        const cover = getCoverRect(video, canvas);

        context.clearRect(0, 0, canvas.width, canvas.height);

        if (latestResult) {
          drawHands(context, latestResult, video, cover);
        }
      };

      const processFrame = (timestamp: DOMHighResTimeStamp) => {
        if (handLandmarker) {
          latestResult = handLandmarker.detectForVideo(video, timestamp);
        }

        drawOverlay();
        videoFrameCallback = video.requestVideoFrameCallback(processFrame);
      };

      resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(canvas);
      resizeCanvas();
      videoFrameCallback = video.requestVideoFrameCallback(processFrame);
    };

    void loadHandLandmarker().catch((error: unknown) => {
      console.error("Unable to initialize MediaPipe.", error);
    });
    void connectWebcam().catch((error: unknown) => {
      console.error("Unable to access the webcam.", error);
    });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      handLandmarker?.close();

      if (videoFrameCallback !== undefined && videoRef.current) {
        videoRef.current.cancelVideoFrameCallback(videoFrameCallback);
      }

      stream?.getTracks().forEach((track) => track.stop());

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <>
      <video ref={videoRef} class={styles.video} playsInline muted />
      <canvas ref={canvasRef} class={styles.canvas} />
    </>
  );
}
