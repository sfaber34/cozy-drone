import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the built index.html references its bundle as
  // ./assets/... — resolves correctly under the Electron app:// protocol
  // (app://local/assets/...) and is harmless for the normal web/Vercel
  // deploy. (Runtime fetches like /music/... stay absolute in the source and
  // resolve against the app:// origin; see electron/main.js.)
  base: "./",
  server: {
    // Pin the dev port so the Electron dev launcher can reliably wait for and
    // connect to it (electron:dev waits on 5173). strictPort makes Vite fail
    // loudly instead of drifting to 5174 if the port is busy.
    port: 5173,
    strictPort: true,
  },
});
