import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppWrapper from "./AppWrapper";
import apiClient from "./lib/api";

(window as any).__API_CLIENT__ = apiClient;
(window as any).__BUILD_HASH__ = 'a4b8344';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);
