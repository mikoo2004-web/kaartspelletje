import { defineConfig } from "vite";

export default defineConfig({
  base: "/kaartspelletje/",

  server: {
    host: "127.0.0.1",
    port: 9020,
    strictPort: true
  },

  preview: {
    host: "127.0.0.1",
    port: 9020,
    strictPort: true
  }
});
