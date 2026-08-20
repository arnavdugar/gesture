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
  padding: "8px 12px",
  position: "absolute",
  right: 16,
});

export const midiControl = style({
  alignItems: "center",
  color: "white",
  display: "flex",
  fontSize: 14,
  fontWeight: 500,
  gap: 10,
});

export const midiButton = style({
  appearance: "none",
  backgroundColor: "rgba(255, 255, 255, 0.25)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  borderRadius: 6,
  color: "white",
  cursor: "pointer",
  font: "inherit",
  minWidth: 120,
  outline: "none",
  padding: "7px 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  selectors: {
    "&:disabled": {
      cursor: "default",
      opacity: 0.65,
    },
    "&:focus-visible": {
      borderColor: "white",
      boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.25)",
    },
  },
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
