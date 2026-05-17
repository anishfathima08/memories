import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        ssr: path.resolve(__dirname, "server/node-build.ts"),
        outDir: "dist/server",
        rollupOptions: {
            external: [
                "fs", "path", "url", "http", "https", "os", "crypto",
                "stream", "util", "events", "buffer", "querystring", "child_process"
            ],
            output: {
                format: "es",
                entryFileNames: "server.mjs",
            },
        },
        target: "es2022",
        minify: false,
        sourcemap: true,
        emptyOutDir: true,
        copyPublicDir: false,
    },

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./server"),
        },
    },

    define: {
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    },
});