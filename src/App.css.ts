import { style } from "@vanilla-extract/css";

export const menu = style({
  alignItems: "center",
  backdropFilter: "blur(8px)",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  borderRadius: 8,
  bottom: 16,
  display: "flex",
  gap: 16,
  minHeight: 48,
  justifyContent: "start",
  left: 16,
  padding: "4px 12px",
  position: "absolute",
  right: 16,
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
