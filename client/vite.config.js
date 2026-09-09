import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      workbox: {
        navigateFallback: "/index.html",

        navigateFallbackAllowlist: [/^\/.*$/],

        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}"],
      },

      devOptions: {
        enabled: true,
      },

      manifest: {
        name: "SmritiSetu",
        short_name: "SmritiSetu",
        description: "Offline-first dementia care application",
        theme_color: "#f4f7f6",
        background_color: "#f4f7f6",
        display: "standalone",
        start_url: "/",
        scope: "/",
      },
    }),
  ],
});
