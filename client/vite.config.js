import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/dementia/",

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      workbox: {
        navigateFallback: "/dementia/index.html",

        navigateFallbackAllowlist: [/^\/dementia\/.*$/],

        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}"],
      },

      devOptions: {
        enabled: true,
      },

      manifest: {
        name: "MANAS",
        short_name: "MANAS",
        description: "Offline-first dementia care application",

        theme_color: "#f4f7f6",
        background_color: "#f4f7f6",

        display: "standalone",

        start_url: "/dementia/",
        scope: "/dementia/",
      },
    }),
  ],
});
