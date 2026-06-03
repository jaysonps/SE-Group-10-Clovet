import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import backendRoutes from "./backend/routes";
import { initDb } from "./database/init";

const __dirname = process.cwd();

async function startServer() {
  await initDb();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use("/api", backendRoutes);

  if (process.env.NODE_ENV !== "production") {
    const rootsToTry = [
      path.join(process.cwd(), "front-end"),
      path.join(process.cwd(), "frontend"),
      path.join(process.cwd()),
    ];

    let frontendPath = rootsToTry[0];
    let foundIndex = false;

    for (const root of rootsToTry) {
      if (fs.existsSync(path.join(root, "index.html"))) {
        frontendPath = root;
        foundIndex = true;
        break;
      }
    }

    if (!foundIndex) {
      console.warn("CRITICAL WARNING: index.html NOT found!");
      console.warn("CWD:", process.cwd());
      
      const tryFindIndex = (dir: string, depth = 0): string | null => {
        if (depth > 1) return null;
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
              const res = tryFindIndex(path.join(dir, entry.name), depth + 1);
              if (res) return res;
            } else if (entry.name === 'index.html') {
              return dir;
            }
          }
        } catch (e) {}
        return null;
      };

      const foundDir = tryFindIndex(process.cwd());
      if (foundDir) {
        frontendPath = foundDir;
        foundIndex = true;
      }
    }

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: frontendPath,
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clovet Full-Stack App running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
