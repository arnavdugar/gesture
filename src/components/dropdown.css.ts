import { style } from "@vanilla-extract/css";

export const label = style({
  alignItems: "center",
  color: "white",
  display: "flex",
  fontSize: 14,
  fontWeight: 500,
  gap: 10,
});

export const wrapper = style({
  position: "relative",
  selectors: {
    "&::after": {
      alignItems: "center",
      bottom: 7,
      color: "rgba(255, 255, 255, 0.8)",
      content: '"▾"',
      display: "flex",
      fontSize: 12,
      pointerEvents: "none",
      position: "absolute",
      right: 10,
      top: 7,
    },
  },
});

export const select = style({
  appearance: "none",
  backgroundColor: "rgba(255, 255, 255, 0.25)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  borderRadius: 6,
  color: "white",
  colorScheme: "dark",
  cursor: "pointer",
  font: "inherit",
  minWidth: 120,
  outline: "none",
  padding: "7px 30px 7px 10px",
  selectors: {
    "&:focus-visible": {
      borderColor: "white",
      boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.25)",
    },
  },
});
