import { style } from "@vanilla-extract/css";

export const menu = style({
  alignItems: "center",
  backdropFilter: "blur(8px)",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  borderRadius: 8,
  bottom: 16,
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  justifyContent: "start",
  left: 16,
  minHeight: 58,
  padding: "8px 12px",
  position: "absolute",
  right: 16,
});

export const settingsMenu = style({
  marginLeft: "auto",
});

export const settingsButton = style({
  alignItems: "center",
  backgroundColor: "rgba(255, 255, 255, 0.18)",
  fontWeight: 500,
  height: 36,
  padding: "0 14px",
  selectors: {
    '&[aria-expanded="true"]': {
      backgroundColor: "rgba(255, 255, 255, 0.32)",
    },
  },
});

export const midiControl = style({
  alignItems: "center",
  color: "white",
  display: "flex",
  fontSize: 14,
  fontWeight: 500,
  gap: 8,
});

export const midiButton = style({
  minWidth: 120,
  padding: "7px 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const fullScreenLayer = style({
  height: "100%",
  inset: 0,
  position: "absolute",
  width: "100%",
});

export const video = style([
  fullScreenLayer,
  {
    objectFit: "cover",
    transform: "scaleX(-1)",
  },
]);

export const overlay = style([
  fullScreenLayer,
  {
    display: "block",
    pointerEvents: "none",
  },
]);
