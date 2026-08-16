import { style } from "@vanilla-extract/css";

const mirroredLayer = style({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  transform: "scaleX(-1)",
});

export const video = style([
  mirroredLayer,
  {
    objectFit: "cover",
  },
]);

export const canvas = style([
  mirroredLayer,
  {
    display: "block",
    pointerEvents: "none",
  },
]);
