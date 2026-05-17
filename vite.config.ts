import dotenv from 'dotenv';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type PluginOption, type ViteDevServer } from "vite";

dotenv.config();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    expressPlugin(),
  ],
  server: {
    port: Number(process.env.PORT || 8000),
    host: true
  },
})

function expressPlugin(): PluginOption {
  return {
    name: "vite:express",
    apply: "serve",

    async configureServer(viteServer: ViteDevServer) {
      const { createServer } = await viteServer.ssrLoadModule("./server/index.ts");
      const app = await createServer();

      viteServer.middlewares.use(app);
      console.log("✅ Express API mounted at /api");
    },
  };
}