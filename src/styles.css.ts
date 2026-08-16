import { globalStyle } from "@vanilla-extract/css";

globalStyle("body", {
  margin: 0,
});

globalStyle("#app", {
  position: "fixed",
  inset: 0,
  overflow: "hidden",
  background: "#fff",
});
