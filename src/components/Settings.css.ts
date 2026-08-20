import { style } from "@vanilla-extract/css";

export const panel = style({
  backdropFilter: "blur(14px)",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  borderRadius: 10,
  color: "white",
  minHeight: 240,
  padding: 16,
  position: "fixed",
  width: "min(440px, calc(100vw - 48px))",
  right: 16,
  top: 16,
  bottom: 88,
});

export const header = style({
  alignItems: "center",
  display: "flex",
  justifyContent: "space-between",
});

export const title = style({
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1,
  margin: 0,
});

export const section = style({
  borderTop: "1px solid rgba(255, 255, 255, 0.25)",
  marginTop: 16,
  paddingTop: 16,
});

export const sectionTitle = style({
  fontSize: 16,
  fontWeight: 600,
  margin: "0 0 12px",
});

export const closeButton = style({
  alignItems: "center",
  background: "transparent",
  border: 0,
  borderRadius: 4,
  color: "rgba(255, 255, 255, 0.75)",
  display: "flex",
  fontSize: 24,
  height: 28,
  justifyContent: "center",
  lineHeight: 1,
  padding: 0,
  width: 28,
  selectors: {
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      color: "white",
    },
    "&:focus-visible": {
      boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.35)",
    },
  },
});

export const midiLearnGrid = style({
  alignItems: "center",
  columnGap: 8,
  display: "grid",
  gridTemplateColumns: "max-content repeat(3, minmax(0, 1fr))",
  marginTop: 12,
  rowGap: 8,
});

export const midiLearnRow = style({
  alignItems: "center",
  display: "grid",
  gridColumn: "1 / -1",
  gridTemplateColumns: "subgrid",
});

export const midiLearnColumnHeader = style({
  color: "rgba(255, 255, 255, 0.75)",
  fontSize: 12,
  fontWeight: 500,
  textAlign: "center",
  textTransform: "capitalize",
});

export const midiLearnRowHeader = style({
  fontSize: 13,
  fontWeight: 500,
  textAlign: "left",
  textTransform: "capitalize",
  whiteSpace: "nowrap",
});

export const midiLearnCell = style({
  minWidth: 0,
});

export const midiLearnButton = style({
  fontSize: 12,
  minWidth: 0,
  padding: "7px 6px",
  width: "100%",
  selectors: {
    '&[aria-pressed="true"]': {
      backgroundColor: "rgba(255, 255, 255, 0.4)",
    },
  },
});
