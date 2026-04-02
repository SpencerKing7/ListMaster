// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "./store/useCategoriesStore";
import { SettingsProvider } from "./store/useSettingsStore";
import { SyncProvider } from "./store/useSyncStore";
import App from "./App";
import "./index.css";

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
