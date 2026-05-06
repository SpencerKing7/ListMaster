// src/main.tsx — React root entry point; mounts providers and App into #root.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "@/store/useCategoriesStore";
import { SettingsProvider } from "@/store/useSettingsStore";
import { SyncProvider } from "@/store/useSyncStore";
import { App } from "@/App";
import "./index.css";

// Reload the page whenever a new service worker takes control so the latest
// app code and cached assets are used immediately on the next visit.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <SyncProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </SyncProvider>
    </SettingsProvider>
  </StrictMode>,
);
