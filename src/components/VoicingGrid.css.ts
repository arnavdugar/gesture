import { style } from "@vanilla-extract/css";

export const cell = style({
  justifyContent: "center",
});

export const label = style({
  fontSize: 12,
  overflow: "hidden",
  textAlign: "center",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const emptyCell = style({
  minHeight: 34,
});
