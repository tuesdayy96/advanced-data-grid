import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@advanced-data-grid/react-data-grid/styles.css";
import "./app.css";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
