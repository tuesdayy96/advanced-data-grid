import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const gridSource = new URL(
  "../../packages/react-data-grid/src/",
  import.meta.url,
);

export default defineConfig(({ command, isPreview }) => ({
  plugins: [react(), tailwindcss()],
  resolve:
    command === "serve" && !isPreview
      ? {
          alias: [
            {
              find: /^@advanced-data-grid\/react-data-grid$/,
              replacement: fileURLToPath(new URL("index.ts", gridSource)),
            },
            {
              find: /^@advanced-data-grid\/react-data-grid\/styles\.css$/,
              replacement: fileURLToPath(
                new URL("styles/grid.css", gridSource),
              ),
            },
          ],
          dedupe: ["react", "react-dom"],
        }
      : undefined,
}));
