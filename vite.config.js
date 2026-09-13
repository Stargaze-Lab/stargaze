import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        "design-studies": resolve(import.meta.dirname, "design-studies/index.html"),
        "design-archive": resolve(import.meta.dirname, "design-studies/archive.html"),
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
  },
});
