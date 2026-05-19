import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/shares": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/")

          if (!normalized.includes("node_modules")) {
            return
          }

          if (
            normalized.includes("/react-dom/") ||
            normalized.includes("/node_modules/react/")
          ) {
            return "react-vendor"
          }
          if (normalized.includes("/react-router")) {
            return "router-vendor"
          }
          if (normalized.includes("/lucide-react/")) {
            return "ui-vendor"
          }
          if (
            normalized.includes("/motion-dom/") ||
            normalized.includes("/framer-motion/") ||
            normalized.includes("/node_modules/motion/")
          ) {
            return "motion-vendor"
          }
        },
      },
    },
  },
})
