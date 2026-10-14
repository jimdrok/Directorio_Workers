import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: false,
        configure(proxy) {
          // Preserve the browser-facing host so backend Origin checks remain valid.
          proxy.on('proxyReq', (proxyRequest, request) => {
            if (request.headers.host) proxyRequest.setHeader('Host', request.headers.host);
          });
        },
      },
    },
  },
  build: { outDir: 'dist' },
  publicDir: false,
});
