import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Simple API Mocker for local dev
const apiMocker = () => ({
  name: 'api-mocker',
  configureServer(server: any) {
    let mockDB: Record<string, any[]> = {};
    try {
      const seedPath = path.resolve(__dirname, 'scripts/tenantDemoSeed.json');
      if (fs.existsSync(seedPath)) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
        mockDB = seedData.collections || {};
        console.log('✅ [Vite Mocker] Loaded full VN demo seed - vehicles:', mockDB.vehicles?.length, 'drivers:', mockDB.drivers?.length);
      }
    } catch (e) {
      console.error('⚠️ [Vite Mocker] Failed to load seed:', e);
    }
    if (!mockDB.routes) {
      mockDB.routes = [{ id: 'route-1', origin: 'Hà Nội', destination: 'Hải Phòng', route_name: 'Hà Nội - Hải Phòng' }];
    }
    
    server.middlewares.use('/api', (req: any, res: any, next: any) => {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk.toString(); });
      req.on('end', () => {
        const parts = req.url.split('/').filter(Boolean);
        const collection = parts[0] || 'unknown';
        if (!mockDB[collection]) mockDB[collection] = [];

        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'GET') {
          if (parts[1]) {
            const found = mockDB[collection].find((item: any) => item.id === parts[1] || item.vehicle_code === parts[1] || item.driver_code === parts[1] || item.customer_code === parts[1] || item.route_code === parts[1]);
            res.end(JSON.stringify(found || mockDB[collection][0] || null));
          } else {
            res.end(JSON.stringify(mockDB[collection]));
          }
        } else if (req.method === 'POST' || req.method === 'PUT') {
          try {
            const payload = JSON.parse(body || '{}');
            const newItem = { ...payload, id: 'mock-' + Date.now() };
            mockDB[collection].unshift(newItem); // prepending
            res.end(JSON.stringify(newItem));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        } else if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.end();
        } else {
          res.end(JSON.stringify({ success: true }));
        }
      });
    });
  }
});

export default defineConfig(({ mode }) => {
  return {
    base: '/',
    server: {
      host: "::",
      port: 5173,
      hmr: { overlay: false }
      // proxy is removed and replaced by apiMocker
    },
    build: {
      sourcemap: false,
      minify: true,
      target: 'es2020',
      chunkSizeWarningLimit: 2000,
      outDir: 'dist',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      }
    },
    plugins: [react(), apiMocker()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});