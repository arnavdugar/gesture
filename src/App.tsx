import * as styles from "./App.css";
import { HandOverlay } from "./HandOverlay";
import { useHandTracking } from "./useHandTracking";

export function App() {
  const { videoRef, videoWidth, videoHeight, data } = useHandTracking();

  return (
    <>
      <video ref={videoRef} class={styles.video} playsInline muted />
      <HandOverlay
        videoWidth={videoWidth}
        videoHeight={videoHeight}
        data={data}
      />
    </>
  );
}
