import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Build optimizations (T199, T203)
  build: {
    // Code splitting for faster startup (T203)
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk for React
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Tauri API chunk
          if (id.includes('@tauri-apps')) {
            return 'tauri';
          }
          // UI components chunk
          if (id.includes('/src/components/ui/')) {
            return 'ui';
          }
          // Services chunk
          if (id.includes('/src/services/')) {
            return 'services';
          }
          // Hooks chunk
          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }
          // Plugin SDK chunk
          if (id.includes('/src/lib/plugin-sdk/')) {
            return 'plugin-sdk';
          }
        },
      },
    },
    // Optimize chunk size warning
    chunkSizeWarningLimit: 500,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
