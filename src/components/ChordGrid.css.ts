import { style, styleVariants } from "@vanilla-extract/css";

export const grid = style({
  color: "white",
  columnGap: 6,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  pointerEvents: "none",
  position: "absolute",
  rowGap: 6,
  top: "calc(50% - 36px)",
  transform: "translateY(-50%)",
  width: "min(320px, calc(50vw - 32px))",
});

export const chordGrid = style({
  gridTemplateColumns: "34px repeat(2, minmax(0, 1fr))",
  width: "min(360px, calc(50vw - 32px))",
});

export const side = styleVariants({
  Left: { left: 16 },
  Right: { right: 16 },
});

export const row = style({
  display: "grid",
  gridColumn: "1 / -1",
  gridTemplateColumns: "subgrid",
});

export const columnHeader = style({
  color: "rgba(255, 255, 255, 0.72)",
  fontSize: 12,
  fontWeight: 500,
  paddingBottom: 2,
  textAlign: "center",
});

export const handCell = style({
  alignItems: "center",
  display: "flex",
  height: 34,
  justifyContent: "center",
  overflow: "hidden",
});

export const handIcon = style({
  height: 44,
  transform: "scaleX(-1)",
  width: 44,
});

export const cell = style({
  alignItems: "baseline",
  backgroundColor: "transparent",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  borderRadius: 6,
  display: "flex",
  gap: 8,
  justifyContent: "space-between",
  minHeight: 34,
  minWidth: 0,
  padding: "7px 9px",
  transition: "background-color 100ms ease, border-color 100ms ease",
  selectors: {
    '&[data-active="true"]': {
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      borderColor: "rgba(255, 255, 255, 0.5)",
    },
  },
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
