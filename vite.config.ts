import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  base: "/ListMaster/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "List Master",
        short_name: "List Master",
        description: "Your personal checklist companion",
        theme_color: "#39B385",
        background_color: "#F0F6F3",
        display: "standalone",
        orientation: "portrait",
        start_url: "/ListMaster/",
        scope: "/ListMaster/",
        icons: [
          {
            src: "/ListMaster/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/ListMaster/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/ListMaster/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
