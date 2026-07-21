import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_FRONTEND_PORT);
  const resolvedPort = Number.isFinite(port) ? port : 5173;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: resolvedPort ,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:5000',
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('[Vite Proxy Error]: Backend server might be offline.', err.message);
            });
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              proxyReq.removeHeader('cookie');
            });
          }
        },
      },
    },
  };
});
