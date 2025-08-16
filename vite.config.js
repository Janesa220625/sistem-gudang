import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// Konfigurasi yang sudah bersih
export default defineConfig({
  plugins: [react(), visualizer({ filename: "dist/stats.html", open: false })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("node_modules/react")) return "vendor.react";
          if (id.includes("node_modules/lucide-react")) return "vendor.lucide";
          if (id.includes("node_modules/framer-motion")) return "vendor.motion";
          if (id.includes("node_modules/@supabase")) return "vendor.supabase";
          if (id.includes("node_modules/xlsx")) return "vendor.xlsx";
          // fallback for other node_modules
          return "vendor.other";
        },
      },
    },
  },
});
