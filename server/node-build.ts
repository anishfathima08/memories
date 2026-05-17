import path from "path"
import express from "express"
import { createServer } from "./index"

const port = process.env.PORT || 8000;
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../client");

(async () => {
    const app = await createServer();

    app.use(express.static(distPath));

    app.use((req, res) => {
        if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
            return res.status(404).json({ error: "API endpoint not found" });
        }
        res.sendFile(path.join(distPath, "index.html"));
    });

    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });

    ["SIGTERM", "SIGINT"].forEach(signal => {
        process.on(signal, () => {
            console.log(`🛑 Received ${signal}, shutting down gracefully`);
            process.exit(0);
        });
    });
})();