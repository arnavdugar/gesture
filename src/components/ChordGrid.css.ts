import { style } from "@vanilla-extract/css";

export const grid = style({
  gridTemplateColumns: "34px repeat(2, minmax(0, 1fr))",
});

export const numeral = style({
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 600,
});

export const chordName = style({
  fontSize: 12,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
