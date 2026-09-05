import { style, type StyleRule } from "@vanilla-extract/css";

export const label = style({
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontSize: 13,
  fontVariantNumeric: "tabular-nums",
});

const trackStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.25)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  borderRadius: 6,
  boxSizing: "border-box",
  height: 8,
  transition: "background-color 150ms ease",
} satisfies StyleRule;

const trackHoverStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.3)",
} satisfies StyleRule;

export const input = style({
  appearance: "none",
  accentColor: "white",
  background: "transparent",
  cursor: "pointer",
  width: "100%",
  margin: "8px 0 0",
  selectors: {
    "&::-webkit-slider-runnable-track": trackStyle,
    "&::-moz-range-track": trackStyle,
    "&:hover::-webkit-slider-runnable-track": trackHoverStyle,
    "&:hover::-moz-range-track": trackHoverStyle,
    "&::-webkit-slider-thumb": {
      marginTop: -5,
    },
  },
});
