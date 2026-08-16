import preact from "@preact/preset-vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/gesture/",
  build: {
    outDir: "dist/gesture",
  },
  plugins: [preact(), vanillaExtractPlugin()],
});
