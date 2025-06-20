import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  resolve: {
    alias: {
      "@": "/src",
      "@/utils": "/src/utils",
      "@/assets": "/src/assets",
    },
  },
  server: {
    port: 3000,
  },
});
