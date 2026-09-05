import { style } from "@vanilla-extract/css";

export const grid = style({
  gridTemplateColumns: "34px repeat(2, minmax(0, 1fr)) 34px",
});

export const columnHeader = style({
  gridColumn: 2,
  selectors: {
    "&:last-child": {
      gridColumn: 3,
    },
  },
});

export const option = style({
  display: "grid",
  gridColumn: "span 2",
  gridTemplateAreas: '"hand label"',
  gridTemplateColumns: "subgrid",
  minWidth: 0,
  selectors: {
    "&:last-child": {
      gridTemplateAreas: '"label hand"',
    },
  },
});

export const handCell = style({
  gridArea: "hand",
});

export const cell = style({
  gridArea: "label",
  justifyContent: "center",
});

export const label = style({
  fontSize: 12,
  overflow: "hidden",
  textAlign: "center",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
