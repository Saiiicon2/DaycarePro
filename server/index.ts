// server/index.ts
import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import "dotenv/config";
// Optional session store (prefer a persistent store in production)
let MemoryStore: any = null;
try {
  // memorystore is included as a dependency and works for single-instance deployments
  // If you prefer Redis in production, set REDIS_URL and install connect-redis and adapt accordingly.
  // We dynamically require to keep dev installs lightweight.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mem = require("memorystore");
  MemoryStore = mem(session);
} catch (e) {
  // fall back to default store (not recommended for production)
  console.warn("memorystore not available, falling back to default express-session MemoryStore");
}

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupLocalAuth } from "./localAuth";

const app = express();

const isProd = process.env.NODE_ENV === "production";
const FRONTEND_ORIGINS = isProd
  ? ["https://educonnect-8y46.onrender.com"]
  : ["http://localhost:5173", "http://localhost:5174"];

// IMPORTANT on Render/Heroku/etc so secure cookies work behind proxy
app.set("trust proxy", 1);

// CORS (only needed if frontend & API are on different origins)
app.use(
  cors({
    origin: (origin: any, cb: any) => {
      // Allow same-origin (no Origin header) and our whitelisted frontends
      if (!origin || FRONTEND_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "daycare-secret-key",
      resave: false,
      saveUninitialized: false,
      store: MemoryStore ? new MemoryStore({ checkPeriod: 86400000 }) : undefined,
      cookie: {
        httpOnly: true,
        secure: isProd, // only over https in prod
        // When deploying with a separate frontend origin (e.g. Render), set sameSite to 'none'
        sameSite: isProd ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
        // allow overriding cookie domain via env when using custom domains
        domain: process.env.SESSION_COOKIE_DOMAIN || undefined,
      },
  })
);

// Auth routes (login/logout/me)
setupLocalAuth(app);

// API request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let bodySnapshot: any;

  const orig = res.json.bind(res);
  res.json = (b: any) => {
    bodySnapshot = b;
    return orig(b);
  };

  res.on("finish", () => {
    const ms = Date.now() - start;
    if (path.startsWith("/api")) {
      let line = `${req.method} ${path} ${res.statusCode} in ${ms}ms`;
      if (bodySnapshot) line += ` :: ${JSON.stringify(bodySnapshot)}`;
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || err.statusCode || 500).json({ message: err.message || "Internal Server Error" });
    throw err;
  });

  // Serve frontend
  if (isProd) serveStatic(app);
  else await setupVite(app, server);

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(` Server listening on http://0.0.0.0:${port}`);
  });
})();
