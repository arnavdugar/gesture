import { style } from "@vanilla-extract/css";

const fullScreenLayer = style({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
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
