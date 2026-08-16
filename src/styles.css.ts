import { globalStyle } from "@vanilla-extract/css";

globalStyle("body", {
  margin: 0,
  fontFamily: '"Oswald", sans-serif',
});

globalStyle("#app", {
  position: "fixed",
  inset: 0,
  overflow: "hidden",
  background: "#fff",
});
