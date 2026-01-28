import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],

  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  },

  // optional: just to reduce noise from dependency sourcemaps
  build: { sourcemap: false },
  esbuild: { supported: { "top-level-await": true } },

  publicDir: "public",
  // ensure wasm is served as a proper asset (MIME application/wasm)
  assetsInclude: ["**/*.mp3", "**/*.wav", "**/*.wasm"],
});