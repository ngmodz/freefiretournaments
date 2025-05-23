import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8083,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Add timestamp to chunk filenames to prevent caching issues
        chunkFileNames: 'assets/js/[name]-[hash]-[timestamp].js',
        entryFileNames: 'assets/js/[name]-[hash]-[timestamp].js',
        assetFileNames: 'assets/[ext]/[name]-[hash]-[timestamp].[ext]',
      },
    },
  },
}));
