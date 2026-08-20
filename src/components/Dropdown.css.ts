import { style } from "@vanilla-extract/css";

export const label = style({
  alignItems: "center",
  color: "white",
  display: "flex",
  fontSize: 14,
  fontWeight: 500,
  gap: 8,
});

export const labelText = style({
  selectors: {
    "&::after": {
      content: '":"',
    },
  },
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
  colorScheme: "dark",
  minWidth: 120,
  padding: "7px 30px 7px 10px",
});
