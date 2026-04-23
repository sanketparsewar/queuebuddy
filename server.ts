// ⚠️ Dev-only server. NOT used in Vercel production.

import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

async function startServer() {
  // Middleware
  app.use(cors());
  app.use(express.json());

  // Start Vite in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  // Optional: health check
  app.get("/api/health", (_, res) => {
    res.json({
      status: "ok",
      env: "development",
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Dev server running at http://localhost:${PORT}`);
  });
}

startServer();
