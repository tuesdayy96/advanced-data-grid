import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  platform: "neutral",
  target: "es2022",
  format: "esm",
  fixedExtension: false,
  dts: true,
  copy: [
    { from: ["src/styles/grid.css", "src/styles/grid.css.d.ts"], to: "dist" },
  ],
});
