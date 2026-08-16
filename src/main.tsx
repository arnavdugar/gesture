import { render } from "preact";

import { App } from "./App";
import "./styles.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Unable to find the application root.");
}

render(<App />, root);
