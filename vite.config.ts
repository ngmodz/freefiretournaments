import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => {
          return path;
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            // Return mock response on proxy error
            if (req.url?.includes('/api/mock-create-payment-order') || req.url?.includes('/api/create-payment-order')) {
              res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({
                success: true,
                data: {
                  cfOrderId: `cf_mock_${Date.now()}`,
                  orderId: `dev_mock_${Date.now()}`,
                  paymentSessionId: `mock_session_${Date.now()}`,
                  orderStatus: 'ACTIVE',
                  orderAmount: 100,
                  orderCurrency: 'INR',
                  orderExpiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                  createdAt: new Date().toISOString(),
                  orderMeta: {
                    returnUrl: 'http://localhost:8083/payment-status'
                  }
                }
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
          });
        },
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Note: Dev API middleware removed - using real API server via proxy
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Use hash for cache busting instead of timestamp
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
}));
