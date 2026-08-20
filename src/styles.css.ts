import { globalStyle } from "@vanilla-extract/css";

globalStyle("body", {
  margin: 0,
  fontFamily: '"Oswald", sans-serif',
  userSelect: "none",
});

globalStyle("#app", {
  boxSizing: "border-box",
  position: "fixed",
  inset: 0,
  overflow: "hidden",
  background: "#fff",
});

globalStyle("#app *, #app *::before, #app *::after", {
  boxSizing: "inherit",
});

globalStyle("button, select", {
  appearance: "none",
  backgroundColor: "rgba(255, 255, 255, 0.25)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  borderRadius: 6,
  color: "white",
  cursor: "pointer",
  font: "inherit",
  outline: "none",
  transition: "background-color 150ms ease",
});

globalStyle("button:hover:not(:disabled), select:hover:not(:disabled)", {
  backgroundColor: "rgba(255, 255, 255, 0.3)",
});

globalStyle("button:active:not(:disabled)", {
  backgroundColor: "rgba(255, 255, 255, 0.4)",
});

globalStyle("button:focus-visible, select:focus-visible", {
  borderColor: "white",
  boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.25)",
});

globalStyle("button:disabled, select:disabled", {
  cursor: "default",
  opacity: 0.65,
});
